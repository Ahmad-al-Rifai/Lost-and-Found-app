import Link from "next/link";
import {
  ChartBar,
  ClipboardText,
  Flag,
  ShieldCheck,
  Users,
} from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";

type AdminReport = {
  id: string;
  reporter_id: string | null;
  item_id: string | null;
  reason: string | null;
  report_status: string | null;
  created_at: string | null;
};

type AdminClaim = {
  id: string;
  item_id: string | null;
  claimant_id: string | null;
  claim_status: string | null;
  verification_answer: string | null;
  created_at: string | null;
};

type AdminItem = {
  id: string;
  title: string | null;
};

type AdminProfile = {
  id: string;
  full_name: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function countValue(count: number | null) {
  return count ?? 0;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    totalUsersResult,
    activeUsersResult,
    blockedUsersResult,
    totalItemsResult,
    openItemsResult,
    claimedItemsResult,
    resolvedItemsResult,
    pendingClaimsCountResult,
    pendingReportsCountResult,
    recentReportsResult,
    recentClaimsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "blocked"),
    supabase.from("items").select("*", { count: "exact", head: true }),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "claimed"),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("claims")
      .select("*", { count: "exact", head: true })
      .eq("claim_status", "pending"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("report_status", "pending"),
    supabase
      .from("reports")
      .select("id, reporter_id, item_id, reason, report_status, created_at")
      .eq("report_status", "pending")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<AdminReport[]>(),
    supabase
      .from("claims")
      .select(
        "id, item_id, claimant_id, claim_status, verification_answer, created_at",
      )
      .eq("claim_status", "pending")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<AdminClaim[]>(),
  ]);

  const recentReports = recentReportsResult.data ?? [];
  const recentClaims = recentClaimsResult.data ?? [];

  const itemIds = Array.from(
    new Set(
      [...recentReports, ...recentClaims]
        .map((entry) => entry.item_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const profileIds = Array.from(
    new Set(
      [
        ...recentReports.map((report) => report.reporter_id),
        ...recentClaims.map((claim) => claim.claimant_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  );

  const [itemsLookupResult, profilesLookupResult] = await Promise.all([
    itemIds.length
      ? supabase
          .from("items")
          .select("id, title")
          .in("id", itemIds)
          .returns<AdminItem[]>()
      : Promise.resolve({ data: [] as AdminItem[], error: null }),
    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profileIds)
          .returns<AdminProfile[]>()
      : Promise.resolve({ data: [] as AdminProfile[], error: null }),
  ]);

  const itemsById = new Map(
    (itemsLookupResult.data ?? []).map((item) => [item.id, item]),
  );
  const profilesById = new Map(
    (profilesLookupResult.data ?? []).map((profile) => [profile.id, profile]),
  );

  const queryErrors = [
    totalUsersResult.error,
    activeUsersResult.error,
    blockedUsersResult.error,
    totalItemsResult.error,
    openItemsResult.error,
    claimedItemsResult.error,
    resolvedItemsResult.error,
    pendingClaimsCountResult.error,
    pendingReportsCountResult.error,
    recentReportsResult.error,
    recentClaimsResult.error,
    itemsLookupResult.error,
    profilesLookupResult.error,
  ].filter(Boolean);
  const loadError = queryErrors[0] as { message?: string } | undefined;

  const stats = [
    {
      label: "Total users",
      value: countValue(totalUsersResult.count),
      description: "Profiles in the system",
      icon: Users,
    },
    {
      label: "Active users",
      value: countValue(activeUsersResult.count),
      description: "Profiles with active status",
      icon: ShieldCheck,
    },
    {
      label: "Blocked users",
      value: countValue(blockedUsersResult.count),
      description: "Profiles blocked by policy",
      icon: ShieldCheck,
    },
    {
      label: "Total items",
      value: countValue(totalItemsResult.count),
      description: "Lost and found reports",
      icon: ClipboardText,
    },
    {
      label: "Open items",
      value: countValue(openItemsResult.count),
      description: "Available for browsing",
      icon: ClipboardText,
    },
    {
      label: "Claimed items",
      value: countValue(claimedItemsResult.count),
      description: "Claim flow in progress",
      icon: ClipboardText,
    },
    {
      label: "Resolved items",
      value: countValue(resolvedItemsResult.count),
      description: "Returned or closed items",
      icon: ClipboardText,
    },
    {
      label: "Pending claims",
      value: countValue(pendingClaimsCountResult.count),
      description: "Waiting for review",
      icon: ChartBar,
    },
    {
      label: "Pending reports",
      value: countValue(pendingReportsCountResult.count),
      description: "Flagged items to review",
      icon: Flag,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Admin</p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Admin panel
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Read-only overview for access control, item activity, pending reports,
          and pending claims.
        </p>
      </section>

      {loadError ? (
        <section className="border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          Admin data could not be fully loaded:{" "}
          {loadError.message ?? "Unknown Supabase error"}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <Icon className="size-6 text-primary" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {stat.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent pending reports
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                User-submitted flags waiting for admin review.
              </p>
            </div>
            <Flag className="size-6 text-primary" />
          </div>

          {recentReports.length ? (
            <div className="mt-5 space-y-3">
              {recentReports.map((report) => {
                const item = report.item_id
                  ? itemsById.get(report.item_id)
                  : null;
                const reporter = report.reporter_id
                  ? profilesById.get(report.reporter_id)
                  : null;

                return (
                  <article
                    key={report.id}
                    className="border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-amber-700/20 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                        Pending report
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(report.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 break-words text-sm font-medium text-foreground">
                      {report.reason || "No reason provided"}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>
                        Reporter:{" "}
                        {reporter?.full_name || "Reporter unavailable"}
                      </p>
                      <p>
                        Item:{" "}
                        {report.item_id ? (
                          <Link
                            className="font-medium text-primary underline-offset-4 hover:underline"
                            href={`/dashboard/items/${report.item_id}`}
                          >
                            {item?.title || "Open item detail"}
                          </Link>
                        ) : (
                          "Item unavailable"
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
              No pending reports.
            </div>
          )}
        </div>

        <div className="border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent pending claims
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Claim requests waiting for reporter review.
              </p>
            </div>
            <ChartBar className="size-6 text-primary" />
          </div>

          {recentClaims.length ? (
            <div className="mt-5 space-y-3">
              {recentClaims.map((claim) => {
                const item = claim.item_id
                  ? itemsById.get(claim.item_id)
                  : null;
                const claimant = claim.claimant_id
                  ? profilesById.get(claim.claimant_id)
                  : null;

                return (
                  <article
                    key={claim.id}
                    className="border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-amber-700/20 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                        Pending claim
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(claim.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 break-words text-sm font-medium text-foreground">
                      {claim.verification_answer ||
                        "No verification answer provided"}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>
                        Claimant:{" "}
                        {claimant?.full_name || "Claimant unavailable"}
                      </p>
                      <p>
                        Item:{" "}
                        {claim.item_id ? (
                          <Link
                            className="font-medium text-primary underline-offset-4 hover:underline"
                            href={`/dashboard/items/${claim.item_id}`}
                          >
                            {item?.title || "Open item detail"}
                          </Link>
                        ) : (
                          "Item unavailable"
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
              No pending claims.
            </div>
          )}
        </div>
      </section>

      <section className="border border-amber-700/20 bg-amber-50 p-5 text-amber-900">
        <h2 className="text-lg font-semibold">Coming next</h2>
        <p className="mt-2 text-sm leading-6">
          Sprint 3 can add report review actions, user role editing, and
          moderation workflows once those controls are ready.
        </p>
      </section>
    </div>
  );
}
