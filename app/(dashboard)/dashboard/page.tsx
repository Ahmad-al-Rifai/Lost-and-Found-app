import {
  CalendarBlank,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  MapPin,
  Plus,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

const items = [
  {
    title: "Black backpack",
    status: "Found",
    category: "Bags",
    location: "Main library desk",
    date: "Today",
    detail: "Front pocket has a small campus pin.",
    confidence: "Strong match for 2 open lost reports",
    tone: "success",
  },
  {
    title: "Silver key ring",
    status: "Claim pending",
    category: "Keys",
    location: "North entrance",
    date: "Yesterday",
    detail: "Three keys and a blue access fob.",
    confidence: "Owner verification requested",
    tone: "warning",
  },
  {
    title: "Blue water bottle",
    status: "Lost",
    category: "Personal item",
    location: "Gym lockers",
    date: "May 8",
    detail: "Last seen near the lower locker row.",
    confidence: "No close matches yet",
    tone: "primary",
  },
];

const statusStyles = {
  success: "border-green-700/20 bg-green-50 text-green-800",
  warning: "border-amber-700/20 bg-amber-50 text-amber-800",
  primary: "border-blue-700/20 bg-blue-50 text-blue-800",
};

export default function DashboardPage() {
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
          ["Open reports", "18", "text-blue-700"],
          ["Possible matches", "6", "text-green-700"],
          ["Claim pending", "3", "text-amber-700"],
          ["Returned", "41", "text-green-700"],
        ].map(([label, value, color]) => (
          <div key={label} className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Search
                </span>
                <span className="relative block">
                  <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search by item, place, or description"
                    className="h-11 w-full border border-input bg-background px-9 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Sort
                </span>
                <select className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20">
                  <option>Newest</option>
                  <option>Nearest</option>
                  <option>Most likely match</option>
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Category", ["Any category", "Bags", "Keys", "Electronics"]],
                ["Location", ["Any location", "Library", "Gym", "Entrance"]],
                ["Date", ["Any date", "Today", "This week", "This month"]],
                [
                  "Status",
                  ["Any status", "Lost", "Found", "Claim pending", "Returned"],
                ],
              ].map(([label, options]) => (
                <label key={label as string} className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    {label as string}
                  </span>
                  <select className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20">
                    {(options as string[]).map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.title}
                className="grid gap-4 border border-border bg-card p-4 transition hover:border-primary/40 sm:grid-cols-[96px_1fr]"
              >
                <div className="flex aspect-square items-center justify-center border border-border bg-muted text-sm font-medium text-muted-foreground">
                  {item.category}
                </div>
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {item.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {item.location} · {item.date}
                      </p>
                    </div>
                    <span
                      className={`border px-2 py-1 text-xs font-medium ${
                        statusStyles[item.tone as keyof typeof statusStyles]
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{item.detail}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="size-4 text-green-700" />
                    {item.confidence}
                  </p>
                </div>
              </article>
            ))}
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
                Main library and north entrance have the most reports today.
              </p>
              <p className="flex gap-2">
                <CalendarBlank className="mt-0.5 size-4 shrink-0 text-primary" />
                Check reports from the last 48 hours before broadening filters.
              </p>
              <p className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-amber-700" />
                Pending claims need verification before contact details appear.
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
