import {
  CalendarBlank,
  ClipboardText,
  FileMagnifyingGlass,
  Tag,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type ActivityItem = {
  id: string;
  title: string | null;
  item_type: "lost" | "found" | string | null;
  status: "open" | "claimed" | "resolved" | string | null;
  date_lost_found: string | null;
  created_at: string | null;
};

type ActivityClaim = {
  id: string;
  item_id: string | null;
  claim_status: "pending" | "approved" | "rejected" | string | null;
  created_at: string | null;
};

const itemTypeLabels: Record<string, string> = {
  lost: "Lost",
  found: "Found",
};

const itemStatusLabels: Record<string, string> = {
  open: "Open",
  claimed: "Claimed",
  resolved: "Resolved",
};

const claimStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const itemStatusStyles = {
  open: "border-blue-700/20 bg-blue-50 text-blue-800",
  claimed: "border-amber-700/20 bg-amber-50 text-amber-800",
  resolved: "border-green-700/20 bg-green-50 text-green-800",
};

const claimStatusStyles = {
  pending: "border-amber-700/20 bg-amber-50 text-amber-800",
  approved: "border-green-700/20 bg-green-50 text-green-800",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

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

function ItemStatusPill({ status }: { status: string | null }) {
  const value = status ?? "open";

  return (
    <span
      className={`border px-2 py-1 text-xs font-medium ${
        itemStatusStyles[value as keyof typeof itemStatusStyles] ??
        itemStatusStyles.open
      }`}
    >
      {itemStatusLabels[value] ?? value}
    </span>
  );
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

function TypePill({ type }: { type: string | null }) {
  const value = type ?? "lost";

  return (
    <span className="border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
      {itemTypeLabels[value] ?? value}
    </span>
  );
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return (
      <section className="border border-destructive/30 bg-destructive/10 p-5 text-destructive">
        <h1 className="text-xl font-semibold">Activity unavailable</h1>
        <p className="mt-2 text-sm">
          Your session could not be verified. Sign in again to view your
          activity.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </section>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="border border-amber-700/20 bg-amber-50 p-5 text-amber-900">
          <h1 className="text-xl font-semibold">Profile unavailable</h1>
          <p className="mt-2 text-sm">
            Your profile row could not be found. Try signing out and signing in
            again before viewing activity.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard">Back to browse</Link>
          </Button>
        </section>
      </div>
    );
  }

  const [reportsResult, claimsResult] = await Promise.all([
    supabase
      .from("items")
      .select("id, title, item_type, status, date_lost_found, created_at")
      .eq("reported_by", profile.id)
      .order("created_at", { ascending: false })
      .returns<ActivityItem[]>(),
    supabase
      .from("claims")
      .select("id, item_id, claim_status, created_at")
      .eq("claimant_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<ActivityClaim[]>(),
  ]);

  const reports = reportsResult.data ?? [];
  const claims = claimsResult.data ?? [];
  const claimedItemIds = Array.from(
    new Set(
      claims
        .map((claim) => claim.item_id)
        .filter((itemId): itemId is string => Boolean(itemId))
    )
  );

  const claimedItemsResult =
    claimedItemIds.length > 0
      ? await supabase
          .from("items")
          .select("id, title, item_type, status, date_lost_found, created_at")
          .in("id", claimedItemIds)
          .returns<ActivityItem[]>()
      : { data: [] as ActivityItem[], error: null };

  const claimedItemsById = new Map(
    (claimedItemsResult.data ?? []).map((item) => [item.id, item])
  );
  const loadError =
    reportsResult.error ?? claimsResult.error ?? claimedItemsResult.error;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <ClipboardText className="size-4" />
            My Activity
          </p>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Your reports and claims
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Review items you reported and claims you submitted. This page is
            read-only for now.
          </p>
        </div>

        <Button className="h-11" asChild>
          <Link href="/dashboard/report">Report item</Link>
        </Button>
      </section>

      {loadError ? (
        <section className="border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Activity could not be loaded. Check the related table read policies
          and try again.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                My reports
              </h2>
              <p className="text-sm text-muted-foreground">
                {reports.length} reported item{reports.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((item) => (
                <article
                  key={item.id}
                  className="border border-border bg-card p-4 transition hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-foreground">
                        <Link
                          href={`/dashboard/items/${item.id}`}
                          className="underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        >
                          {item.title ?? "Untitled item"}
                        </Link>
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarBlank className="size-4 text-primary" />
                        {formatDate(item.date_lost_found)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <TypePill type={item.item_type} />
                      <ItemStatusPill status={item.status} />
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <FileMagnifyingGlass className="size-4 text-primary" />
                    Reported {formatDateTime(item.created_at)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                No reports yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Report a lost or found item when you need help from the campus
                community.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/report">Report item</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              My claims
            </h2>
            <p className="text-sm text-muted-foreground">
              {claims.length} submitted claim{claims.length === 1 ? "" : "s"}
            </p>
          </div>

          {claims.length > 0 ? (
            <div className="space-y-3">
              {claims.map((claim) => {
                const item = claim.item_id
                  ? claimedItemsById.get(claim.item_id)
                  : null;

                return (
                  <article
                    key={claim.id}
                    className="border border-border bg-card p-4 transition hover:border-primary/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-foreground">
                          {item ? (
                            <Link
                              href={`/dashboard/items/${item.id}`}
                              className="underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                            >
                              {item.title ?? "Untitled item"}
                            </Link>
                          ) : (
                            "Item no longer available"
                          )}
                        </h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarBlank className="size-4 text-primary" />
                          Claim submitted {formatDateTime(claim.created_at)}
                        </p>
                      </div>
                      <ClaimStatusPill status={claim.claim_status} />
                    </div>

                    {item ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <TypePill type={item.item_type} />
                        <ItemStatusPill status={item.status} />
                        <span className="flex items-center gap-1 border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                          <Tag className="size-3" />
                          {formatDate(item.date_lost_found)}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        The item may have been removed, resolved, or hidden by
                        current read policies.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border border-border bg-card p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                No claims submitted
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Browse found items and submit a claim when you recognize
                something that belongs to you.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard">Browse items</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
