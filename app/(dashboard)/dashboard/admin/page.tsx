import {
  ChartBar,
  IdentificationBadge,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

const adminSections = [
  {
    title: "Admin panel",
    description:
      "Admin access is active. Moderation queues and item review tools come next.",
    icon: ShieldCheck,
  },
  {
    title: "Access control",
    description:
      "Only profiles with the admin role can open this page or see the Admin link.",
    icon: IdentificationBadge,
  },
  {
    title: "Reports",
    description:
      "User-submitted item reports will be reviewed here in the next Sprint 3 step.",
    icon: ChartBar,
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Admin</p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Admin workspace
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          This read-only page confirms admin-only access is working. Moderation
          and report review tools are intentionally not enabled yet.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon;

          return (
            <article
              key={section.title}
              className="border border-border bg-card p-5"
            >
              <Icon className="size-6 text-primary" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {section.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="border border-amber-700/20 bg-amber-50 p-5 text-amber-900">
        <h2 className="text-lg font-semibold">Coming next</h2>
        <p className="mt-2 text-sm leading-6">
          Sprint 3 can add report queues, status filters, and admin actions once
          database policies for those workflows are ready.
        </p>
      </section>
    </div>
  );
}
