import Link from "next/link";
import {
  ChartBar,
  ClipboardText,
  Flag,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import { ReportReviewActions } from "./report-review-actions";

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
      label: "Users",
      value: countValue(totalUsersResult.count),
      description: `${countValue(activeUsersResult.count)} active, ${countValue(
        blockedUsersResult.count,
      )} blocked`,
      icon: ShieldCheck,
    },
    {
      label: "Items",
      value: countValue(totalItemsResult.count),
      description: `${countValue(openItemsResult.count)} open, ${countValue(
        resolvedItemsResult.count,
      )} resolved`,
      icon: ClipboardText,
    },
    {
      label: "Claims",
      value: countValue(pendingClaimsCountResult.count),
      description: `${countValue(claimedItemsResult.count)} items in claim flow`,
      icon: ChartBar,
    },
    {
      label: "Reports",
      value: countValue(pendingReportsCountResult.count),
      description: "Flags waiting for admin review",
      icon: Flag,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Moderation queue
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Review pending reports first, then follow up on claim activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="border border-amber-700/20 bg-amber-50 px-2.5 py-1 font-medium text-amber-900">
            {countValue(pendingReportsCountResult.count)} reports
          </span>
          <span className="border border-blue-700/20 bg-blue-50 px-2.5 py-1 font-medium text-blue-800">
            {countValue(pendingClaimsCountResult.count)} claims
          </span>
        </div>
      </section>

      {loadError ? (
        <section className="border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          Admin data could not be fully loaded:{" "}
          {loadError.message ?? "Unknown Supabase error"}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="border border-border bg-card p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <Icon className="size-5 text-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Pending reports
              </h2>
              <p className="text-sm text-muted-foreground">
                User-submitted flags that need a decision.
              </p>
            </div>
            <Flag className="size-5 text-primary" />
          </div>

          {recentReports.length ? (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const item = report.item_id
                  ? itemsById.get(report.item_id)
                  : null;
                const reporter = report.reporter_id
                  ? profilesById.get(report.reporter_id)
                  : null;
                const itemTitle = item?.title || "Open item detail";

                return (
                  <article
                    key={report.id}
                    className="border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="border border-amber-700/20 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                        Pending
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(report.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 break-words text-sm font-medium text-foreground">
                      {report.reason || "No reason provided"}
                    </p>
                    <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Reporter: {reporter?.full_name || "Unavailable"}</p>
                      <p className="min-w-0">
                        Item:{" "}
                        {report.item_id ? (
                          <Link
                            className="font-medium text-primary underline-offset-4 hover:underline"
                            href={`/dashboard/items/${report.item_id}`}
                          >
                            {itemTitle}
                          </Link>
                        ) : (
                          "Item unavailable"
                        )}
                      </p>
                    </div>

                    <ReportReviewActions
                      reportId={report.id}
                      itemTitle={itemTitle}
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
              No pending reports.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Pending claims
              </h2>
              <p className="text-sm text-muted-foreground">
                Recent ownership requests from students.
              </p>
            </div>
            <ChartBar className="size-5 text-primary" />
          </div>

          {recentClaims.length ? (
            <div className="space-y-3">
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
                    className="border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="border border-amber-700/20 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                        Pending
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
                      <p>Claimant: {claimant?.full_name || "Unavailable"}</p>
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
            <div className="border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
              No pending claims.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
