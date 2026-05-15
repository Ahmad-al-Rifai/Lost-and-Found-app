import {
  CalendarBlank,
  CheckCircle,
  Clock,
  ImageSquare,
  MagnifyingGlass,
  MapPin,
  Plus,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  location?: string | string[];
  status?: string | string[];
  type?: string | string[];
  date?: string | string[];
  sort?: string | string[];
};

type LookupOption = {
  id: number;
  name: string;
};

type ItemImage = {
  storage_path: string | null;
  is_primary: boolean | null;
  created_at: string | null;
};

type LookupRelation = { name: string | null } | { name: string | null }[] | null;

type BrowseItem = {
  id: string;
  category_id: number | null;
  location_id: number | null;
  title: string | null;
  description: string | null;
  item_type: "lost" | "found" | string | null;
  date_lost_found: string | null;
  status: "open" | "claimed" | "resolved" | string | null;
  created_at: string | null;
  categories: LookupRelation;
  locations: LookupRelation;
  item_images: ItemImage[] | null;
};

type BrowseError = {
  message: string;
};

const statusStyles = {
  open: "border-blue-700/20 bg-blue-50 text-blue-800",
  claimed: "border-amber-700/20 bg-amber-50 text-amber-800",
  resolved: "border-green-700/20 bg-green-50 text-green-800",
};

const itemTypeLabels: Record<string, string> = {
  lost: "Lost",
  found: "Found",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  claimed: "Claimed",
  resolved: "Resolved",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getNumericParam(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Date not listed";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(value: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (value === "today") {
    return formatDateValue(today);
  }

  if (value === "week") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    return formatDateValue(weekStart);
  }

  if (value === "month") {
    const monthStart = new Date(today);
    monthStart.setMonth(today.getMonth() - 1);
    return formatDateValue(monthStart);
  }

  return null;
}

function getPrimaryImage(images: ItemImage[] | null) {
  if (!images?.length) {
    return null;
  }

  return (
    images.find((image) => image.is_primary && image.storage_path)
      ?.storage_path ??
    images.find((image) => image.storage_path)?.storage_path ??
    null
  );
}

function getStorageObjectPath(storagePath: string) {
  return storagePath.startsWith("item-images/")
    ? storagePath.slice("item-images/".length)
    : storagePath;
}

function getRelationName(relation: LookupRelation) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation?.name ?? null;
}

async function getBrowseData(params: SearchParams) {
  const supabase = await createClient();
  const isDevelopment = process.env.NODE_ENV === "development";

  const search = getParam(params.q).trim();
  const category = getNumericParam(getParam(params.category));
  const location = getNumericParam(getParam(params.location));
  const status = getParam(params.status);
  const type = getParam(params.type);
  const date = getParam(params.date);
  const sort = getParam(params.sort) || "newest";

  const [categoriesResult, locationsResult, statsResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("items").select("status"),
  ]);

  let matchingLocationIds: number[] = [];

  if (search) {
    const { data } = await supabase
      .from("locations")
      .select("id")
      .ilike("name", `%${search}%`);

    matchingLocationIds = data?.map((match) => match.id) ?? [];
  }

  let query = supabase
    .from("items")
    .select(
      `
      id,
      category_id,
      location_id,
      title,
      description,
      item_type,
      date_lost_found,
      status,
      created_at,
      categories:categories!fk_items_categories(name),
      locations:locations!fk_items_locations(name),
      item_images:item_images!fk_item_images_items(storage_path, is_primary, created_at)
    `
    )
    .limit(50);

  if (search) {
    const searchPattern = `%${search.replaceAll(",", " ")}%`;
    const searchParts = [
      `title.ilike.${searchPattern}`,
      `description.ilike.${searchPattern}`,
    ];

    if (matchingLocationIds.length > 0) {
      searchParts.push(`location_id.in.(${matchingLocationIds.join(",")})`);
    }

    query = query.or(searchParts.join(","));
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (location) {
    query = query.eq("location_id", location);
  }

  if (["open", "claimed", "resolved"].includes(status)) {
    query = query.eq("status", status);
  }

  if (["lost", "found"].includes(type)) {
    query = query.eq("item_type", type);
  }

  const dateStart = getDateRange(date);

  if (dateStart) {
    query = query.gte("date_lost_found", dateStart);
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "date") {
    query = query.order("date_lost_found", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const itemsResult = await query.returns<BrowseItem[]>();

  if (isDevelopment && categoriesResult.error) {
    console.error(
      "[Sprint 2A Browse] categoriesResult.error",
      categoriesResult.error
    );
  }

  if (isDevelopment && locationsResult.error) {
    console.error(
      "[Sprint 2A Browse] locationsResult.error",
      locationsResult.error
    );
  }

  if (isDevelopment && statsResult.error) {
    console.error("[Sprint 2A Browse] statsResult.error", statsResult.error);
  }

  if (isDevelopment && itemsResult.error) {
    console.error("[Sprint 2A Browse] itemsResult.error", itemsResult.error);
  }

  if (isDevelopment && itemsResult.data?.[0]) {
    const sample = itemsResult.data[0];

    console.log("[Sprint 2A Browse] sample item relation shape", {
      id: sample.id,
      category_id: sample.category_id,
      location_id: sample.location_id,
      categories: sample.categories,
      categoriesShape: Array.isArray(sample.categories)
        ? "array"
        : sample.categories === null
          ? "null"
          : "object",
      locations: sample.locations,
      locationsShape: Array.isArray(sample.locations)
        ? "array"
        : sample.locations === null
          ? "null"
          : "object",
    });
  }

  const stats = (statsResult.data ?? []).reduce(
    (counts, item) => {
      if (item.status === "open") {
        counts.open += 1;
      }

      if (item.status === "claimed") {
        counts.claimed += 1;
      }

      if (item.status === "resolved") {
        counts.resolved += 1;
      }

      return counts;
    },
    { open: 0, claimed: 0, resolved: 0 }
  );

  return {
    categories: (categoriesResult.data ?? []) as LookupOption[],
    locations: (locationsResult.data ?? []) as LookupOption[],
    filters: { search, category, location, status, type, date, sort },
    items: itemsResult.data ?? [],
    stats,
    error:
      categoriesResult.error ??
      locationsResult.error ??
      statsResult.error ??
      itemsResult.error,
    supabase,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { categories, locations, filters, items, stats, error, supabase } =
    await getBrowseData(params);
  const isDevelopment = process.env.NODE_ENV === "development";
  const developmentErrorMessage = (error as BrowseError | null)?.message;
  const categoryNamesById = new Map(
    categories.map((category) => [category.id, category.name])
  );
  const locationNamesById = new Map(
    locations.map((location) => [location.id, location.name])
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Find or report an item
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Search recent reports, review possible matches, and keep private
            details protected until ownership is verified.
          </p>
        </div>

        <Button id="report-item" className="h-11 w-full gap-2 lg:w-auto">
          <Plus weight="bold" />
          Report item
        </Button>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["Open reports", stats.open, "text-blue-700"],
          ["Claimed", stats.claimed, "text-amber-700"],
          ["Resolved", stats.resolved, "text-green-700"],
          ["Visible now", items.length, "text-slate-700"],
        ].map(([label, value, color]) => (
          <div key={label} className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <form action="/dashboard" className="border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Search
                </span>
                <span className="relative block">
                  <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="q"
                    type="search"
                    defaultValue={filters.search}
                    placeholder="Search by item, place, or description"
                    className="h-11 w-full border border-input bg-background px-9 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Sort
                </span>
                <select
                  name="sort"
                  defaultValue={filters.sort}
                  className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="date">Item date</option>
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Category
                </span>
                <select
                  name="category"
                  defaultValue={filters.category ?? ""}
                  className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Any category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Location
                </span>
                <select
                  name="location"
                  defaultValue={filters.location ?? ""}
                  className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Any location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Date
                </span>
                <select
                  name="date"
                  defaultValue={filters.date}
                  className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Any date</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Type
                </span>
                <select
                  name="type"
                  defaultValue={filters.type}
                  className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Lost or found</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={filters.status}
                  className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Any status</option>
                  <option value="open">Open</option>
                  <option value="claimed">Claimed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" className="h-10 gap-2">
                <MagnifyingGlass weight="bold" />
                Search listings
              </Button>
              <Button variant="outline" className="h-10" asChild>
                <a href="/dashboard">Clear filters</a>
              </Button>
            </div>
          </form>

          {error ? (
            <div className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p>
                Items could not be loaded. Check the Supabase tables and RLS
                read policies, then try again.
              </p>
              {isDevelopment && developmentErrorMessage ? (
                <p className="mt-2 font-mono text-xs">
                  Supabase error: {developmentErrorMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item) => {
                const categoryName =
                  getRelationName(item.categories) ??
                  (item.category_id
                    ? categoryNamesById.get(item.category_id) ??
                      `Category #${item.category_id}`
                    : "Category pending");
                const locationName =
                  getRelationName(item.locations) ??
                  (item.location_id
                    ? locationNamesById.get(item.location_id) ??
                      `Location #${item.location_id}`
                    : "Location pending");
                const primaryImage = getPrimaryImage(item.item_images);
                const imageUrl = primaryImage
                  ? supabase.storage
                      .from("item-images")
                      .getPublicUrl(getStorageObjectPath(primaryImage)).data
                      .publicUrl
                  : null;
                const status = item.status ?? "open";
                const type = item.item_type ?? "lost";

                return (
                  <article
                    key={item.id}
                    className="grid gap-4 border border-border bg-card p-4 transition hover:border-primary/40 sm:grid-cols-[112px_1fr]"
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden border border-border bg-muted text-sm font-medium text-muted-foreground">
                      {imageUrl ? (
                        // The bucket is public and the dimensions are reserved by the wrapper.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={`${item.title ?? "Lost and found item"} photo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-2 text-center">
                          <ImageSquare className="size-6" />
                          <span>{categoryName}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">
                            {item.title ?? "Untitled item"}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {locationName} - {formatDate(item.date_lost_found)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                            {itemTypeLabels[type] ?? type}
                          </span>
                          <span
                            className={`border px-2 py-1 text-xs font-medium ${
                              statusStyles[
                                status as keyof typeof statusStyles
                              ] ?? statusStyles.open
                            }`}
                          >
                            {statusLabels[status] ?? status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground">
                        {item.description ?? "No public description provided."}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="size-4 text-green-700" />
                        {categoryName} report - private contact details hidden
                        until ownership is verified
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="border border-border bg-card p-6 text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  No items match these filters
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Broaden the search, choose fewer filters, or report a new item
                  if it has not been listed yet.
                </p>
                <Button className="mt-4" asChild>
                  <a href="/dashboard">Clear filters</a>
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">
              Location context
            </h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                Browse by university location to narrow results faster.
              </p>
              <p className="flex gap-2">
                <CalendarBlank className="mt-0.5 size-4 shrink-0 text-primary" />
                Check recent reports first before broadening the date filter.
              </p>
              <p className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-amber-700" />
                Claimed items still need verification before contact details
                appear.
              </p>
            </div>
          </div>

          <div className="border border-green-700/20 bg-green-50 p-4 text-green-900">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle className="size-5" />
              Trust and safety
            </h2>
            <p className="mt-2 text-sm">
              Ask for a detail only the owner would know before marking an item
              as returned.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
