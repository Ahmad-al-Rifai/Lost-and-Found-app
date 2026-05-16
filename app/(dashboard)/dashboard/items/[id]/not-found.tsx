import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ItemNotFound() {
  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <section className="w-full max-w-xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-primary">Item unavailable</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          This item could not be found or is no longer available.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          It may have been resolved, removed, or hidden by current access
          policies.
        </p>
        <Button asChild className="mt-6 h-11">
          <Link href="/dashboard">Back to browse</Link>
        </Button>
      </section>
    </div>
  );
}
