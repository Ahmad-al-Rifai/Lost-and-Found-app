import { ClipboardText } from "@phosphor-icons/react/dist/ssr";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <ClipboardText className="size-4" />
          Loading dashboard
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Preparing recent reports
        </h1>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border border-border bg-card p-4">
            <div className="h-4 w-24 bg-muted" />
            <div className="mt-3 h-7 w-12 bg-muted" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-border bg-card p-4">
              <div className="h-5 w-2/3 bg-muted" />
              <div className="mt-3 h-4 w-1/2 bg-muted" />
              <div className="mt-4 h-16 w-full bg-muted" />
            </div>
          ))}
        </div>
        <aside className="hidden border border-border bg-card p-4 lg:block">
          <div className="h-5 w-40 bg-muted" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full bg-muted" />
            <div className="h-4 w-5/6 bg-muted" />
            <div className="h-4 w-4/5 bg-muted" />
          </div>
        </aside>
      </section>
    </div>
  );
}
