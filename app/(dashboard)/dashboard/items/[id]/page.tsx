import {
  CalendarBlank,
  CheckCircle,
  ImageSquare,
  MapPin,
  ShieldCheck,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ClaimForm } from "./claim-form";
import { ClaimReviewActions } from "./claim-review-actions";
import { ReportForm } from "./report-form";

type LookupRelation = { name: string | null } | { name: string | null }[] | null;

type ItemImage = {
  storage_path: string | null;
  is_primary: boolean | null;
  created_at: string | null;
};

type DetailItem = {
  id: string;
  reported_by: string | null;
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

type ItemClaim = {
  id: string;
  item_id: string | null;
  claimant_id: string | null;
  claim_status: "pending" | "approved" | "rejected" | string | null;
  verification_answer: string | null;
  created_at: string | null;
};

type ClaimantProfile = {
  id: string;
  full_name: string | null;
};

const statusStyles = {
  open: "border-blue-700/20 bg-blue-50 text-blue-800",
  claimed: "border-amber-700/20 bg-amber-50 text-amber-800",
  resolved: "border-green-700/20 bg-green-50 text-green-800",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  claimed: "Claimed",
  resolved: "Resolved",
};

const itemTypeLabels: Record<string, string> = {
  lost: "Lost",
  found: "Found",
};

const claimStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const claimStatusStyles = {
  pending: "border-amber-700/20 bg-amber-50 text-amber-800",
  approved: "border-green-700/20 bg-green-50 text-green-800",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not listed";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getRelationName(relation: LookupRelation) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation?.name ?? null;
}

function getStorageObjectPath(storagePath: string) {
  return storagePath.startsWith("item-images/")
    ? storagePath.slice("item-images/".length)
    : storagePath;
}

function getSortedImages(images: ItemImage[] | null) {
  return (images ?? [])
    .filter((image) => image.storage_path)
    .sort((first, second) => {
      if (first.is_primary && !second.is_primary) {
        return -1;
      }

      if (!first.is_primary && second.is_primary) {
        return 1;
      }

      return (first.created_at ?? "").localeCompare(second.created_at ?? "");
    });
}

function ClaimStatusPill({ status }: { status: string | null }) {
  const value = status ?? "pending";

  return (
    <span
      className={`border px-2 py-1 text-xs font-medium ${
        claimStatusStyles[value as keyof typeof claimStatusStyles] ??
        claimStatusStyles.pending
      }`}
    >
      {claimStatusLabels[value] ?? value}
    </span>
  );
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidUuid(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("items")
    .select(
      `
      id,
      reported_by,
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
    .eq("id", id)
    .single<DetailItem>();

  if (error || !item) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentProfile } = user
    ? await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
    : { data: null };
  const isReporter = Boolean(
    currentProfile?.id && item.reported_by === currentProfile.id
  );
  const { data: reporter } =
    item.reported_by && isReporter
      ? await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", item.reported_by)
          .single()
      : { data: null };
  const claimsResult = isReporter
    ? await supabase
        .from("claims")
        .select(
          "id, item_id, claimant_id, claim_status, verification_answer, created_at"
        )
        .eq("item_id", item.id)
        .order("created_at", { ascending: false })
        .returns<ItemClaim[]>()
    : { data: [] as ItemClaim[] };
  const claims = claimsResult.data ?? [];
  const claimantIds = Array.from(
    new Set(
      claims
        .map((claim) => claim.claimant_id)
        .filter((claimantId): claimantId is string => Boolean(claimantId))
    )
  );
  const claimantProfilesResult =
    isReporter && claimantIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", claimantIds)
          .returns<ClaimantProfile[]>()
      : { data: [] as ClaimantProfile[] };
  const claimantProfilesById = new Map(
    (claimantProfilesResult.data ?? []).map((profile) => [profile.id, profile])
  );

  const categoryName = getRelationName(item.categories) ?? "Category pending";
  const locationName = getRelationName(item.locations) ?? "Location pending";
  const status = item.status ?? "open";
  const itemType = item.item_type ?? "lost";
  const title = item.title ?? "Untitled item";
  const images = getSortedImages(item.item_images);
  const isFoundItem = itemType === "found";
  const isClaimable = isFoundItem && status === "open" && !isReporter;
  const canReportItem = Boolean(currentProfile?.id && !isReporter);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link href="/dashboard">Back to browse</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
              {itemTypeLabels[itemType] ?? itemType}
            </span>
            <span
              className={`border px-2 py-1 text-xs font-medium ${
                statusStyles[status as keyof typeof statusStyles] ??
                statusStyles.open
              }`}
            >
              {statusLabels[status] ?? status}
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Review the public details before contacting the reporter. Keep
            ownership proof private until verification.
          </p>
        </div>

        {isClaimable ? (
          <Button className="h-11" asChild>
            <a href="#claim-item">Claim item</a>
          </Button>
        ) : (
          <Button className="h-11" disabled>
            Contact finder
          </Button>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="border border-border bg-card p-4">
            {images.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image, index) => {
                  const publicUrl = image.storage_path
                    ? supabase.storage
                        .from("item-images")
                        .getPublicUrl(getStorageObjectPath(image.storage_path))
                        .data.publicUrl
                    : null;

                  return publicUrl ? (
                    <div
                      key={`${image.storage_path}-${index}`}
                      className="aspect-[4/3] overflow-hidden border border-border bg-muted"
                    >
                      {/* The bucket is public and the dimensions are reserved by the wrapper. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={publicUrl}
                        alt={`${title} photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-border bg-muted text-muted-foreground">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ImageSquare className="size-8" />
                  <p className="text-sm font-medium">No photos added yet</p>
                </div>
              </div>
            )}
          </div>

          <div className="border border-border bg-card p-5">
            <h2 className="text-xl font-semibold text-foreground">
              Public description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {item.description ?? "No public description provided."}
            </p>
          </div>

          {isReporter ? (
            <section className="border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Claims for this item
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review private verification details before approving a
                    claim.
                  </p>
                </div>
                <span className="border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  {claims.length} claim{claims.length === 1 ? "" : "s"}
                </span>
              </div>

              {claims.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {claims.map((claim) => {
                    const claimant = claim.claimant_id
                      ? claimantProfilesById.get(claim.claimant_id)
                      : null;
                    const claimantName =
                      claimant?.full_name ?? "Claimant unavailable";
                    const isPendingClaim = claim.claim_status === "pending";

                    return (
                      <article
                        key={claim.id}
                        className="border border-border bg-background p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">
                              {claimantName}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Submitted {formatDateTime(claim.created_at)}
                            </p>
                          </div>
                          <ClaimStatusPill status={claim.claim_status} />
                        </div>

                        <div className="mt-4 border border-border bg-card p-3">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Verification detail
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                            {claim.verification_answer ??
                              "No verification detail provided."}
                          </p>
                        </div>

                        {isPendingClaim ? (
                          <ClaimReviewActions
                            claimId={claim.id}
                            claimantName={claimantName}
                          />
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 border border-border bg-background p-5 text-center">
                  <h3 className="text-base font-semibold text-foreground">
                    No claims submitted yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Claims will appear here when students submit ownership
                    details for this item.
                  </p>
                </div>
              )}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">
              Item details
            </h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-foreground">Location:</span>{" "}
                  {locationName}
                </span>
              </p>
              <p className="flex gap-2">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-foreground">Category:</span>{" "}
                  {categoryName}
                </span>
              </p>
              <p className="flex gap-2">
                <CalendarBlank className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-foreground">
                    Item date:
                  </span>{" "}
                  {formatDate(item.date_lost_found)}
                </span>
              </p>
              <p className="flex gap-2">
                <CalendarBlank className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium text-foreground">
                    Reported:
                  </span>{" "}
                  {formatDateTime(item.created_at)}
                </span>
              </p>
              {item.reported_by ? (
                <p className="flex gap-2">
                  <UserCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium text-foreground">
                      Reporter:
                    </span>{" "}
                    {isReporter
                      ? reporter?.full_name ?? "You"
                      : "Reporter verified"}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {isClaimable ? (
            <ClaimForm itemId={item.id} />
          ) : isFoundItem ? (
            <div className="border border-amber-700/20 bg-amber-50 p-4 text-amber-900">
              <h2 className="text-lg font-semibold">Claims unavailable</h2>
              <p className="mt-2 text-sm">
                This found item is not currently open for new claims.
              </p>
            </div>
          ) : (
            <div className="border border-amber-700/20 bg-amber-50 p-4 text-amber-900">
              <h2 className="text-lg font-semibold">Contact unavailable</h2>
              <p className="mt-2 text-sm">
                Contact messages are not part of this sprint. Claims are only
                available for found items.
              </p>
            </div>
          )}

          {canReportItem ? <ReportForm itemId={item.id} /> : null}

          <div className="border border-green-700/20 bg-green-50 p-4 text-green-900">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="size-5" />
              Safety note
            </h2>
            <p className="mt-2 text-sm">
              Do not share private contact details or ownership proof publicly.
              Use a detail only the owner would know when claim review is
              available.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
