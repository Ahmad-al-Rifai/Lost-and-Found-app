"use client";

import { useActionState } from "react";
import { createReport, type CreateReportState } from "@/app/actions/items";
import { Button } from "@/components/ui/button";

type ReportFormProps = {
  itemId: string;
};

const initialState: CreateReportState = null;

export function ReportForm({ itemId }: ReportFormProps) {
  const [state, formAction, isPending] = useActionState(
    createReport,
    initialState
  );

  return (
    <form
      action={formAction}
      className="border border-border bg-card p-4"
    >
      <input type="hidden" name="item_id" value={itemId} />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          Report this item
        </h2>
        <p className="text-sm text-muted-foreground">
          Tell admins if this post looks suspicious, inaccurate, or
          inappropriate.
        </p>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Reason for report
        </span>
        <textarea
          name="reason"
          required
          rows={4}
          maxLength={1000}
          placeholder="Briefly explain what admins should review."
          className="min-h-28 w-full resize-y border border-input bg-background px-3 py-2 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>

      {state?.error ? (
        <p className="mt-3 border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p className="mt-3 border border-green-700/20 bg-green-50 px-3 py-2 text-sm text-green-900">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" className="mt-4 h-11 w-full" disabled={isPending}>
        {isPending ? "Submitting report..." : "Submit report"}
      </Button>
    </form>
  );
}
