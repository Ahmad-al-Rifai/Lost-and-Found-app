"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <WarningCircle className="size-5" />
        Dashboard could not be loaded
      </h1>
      <p className="mt-2 text-sm">
        Check your connection and try again. If the problem continues, verify the
        Supabase tables and read policies before the demo.
      </p>
      <Button type="button" className="mt-5 h-11" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
