import Link from "next/link";
import { ClipboardText, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "./report-form";

type LookupOption = {
  id: number;
  name: string;
};

function formatDateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function ReportItemPage() {
  const supabase = await createClient();
  const [categoriesResult, locationsResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  const categories = (categoriesResult.data ?? []) as LookupOption[];
  const locations = (locationsResult.data ?? []) as LookupOption[];
  const hasLookupError = Boolean(categoriesResult.error || locationsResult.error);
  const isFormUnavailable =
    hasLookupError || categories.length === 0 || locations.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <ClipboardText className="size-4" />
            Report item
          </p>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Add a lost or found item
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Share the essential details now. Keep private proof of ownership out
            of the public report.
          </p>
        </div>

        <Button variant="outline" className="h-11" asChild>
          <Link href="/dashboard">Back to browse</Link>
        </Button>
      </section>

      {isFormUnavailable ? (
        <section className="border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <WarningCircle className="size-5" />
            Report form unavailable
          </h2>
          <p className="mt-2 text-sm">
            Categories and locations must be readable before reports can be
            created. Check the lookup table rows and RLS read policies.
          </p>
        </section>
      ) : (
        <ReportForm
          categories={categories}
          locations={locations}
          today={formatDateValue(new Date())}
        />
      )}
    </div>
  );
}
