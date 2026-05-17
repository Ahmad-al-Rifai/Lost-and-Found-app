"use client";

import { useActionState } from "react";
import {
  dismissReport,
  markReportReviewed,
  type ReviewReportState,
} from "@/app/actions/items";
import { Button } from "@/components/ui/button";

type ReportReviewActionsProps = {
  reportId: string;
  itemTitle: string;
};

const initialState: ReviewReportState = null;

export function ReportReviewActions({
  reportId,
  itemTitle,
}: ReportReviewActionsProps) {
  const [reviewState, reviewAction, isReviewing] = useActionState(
    markReportReviewed,
    initialState
  );
  const [dismissState, dismissAction, isDismissing] = useActionState(
    dismissReport,
    initialState
  );
  const isPending = isReviewing || isDismissing;
  const reviewMessage = `Mark report for "${itemTitle}" as reviewed?`;
  const dismissMessage = `Dismiss report for "${itemTitle}"?`;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          action={reviewAction}
          onSubmit={(event) => {
            if (!window.confirm(reviewMessage)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="report_id" value={reportId} />
          <Button
            type="submit"
            className="h-11 w-full sm:w-auto"
            disabled={isPending}
            aria-label={`Mark report for ${itemTitle} as reviewed`}
          >
            {isReviewing ? "Marking..." : "Reviewed"}
          </Button>
        </form>

        <form
          action={dismissAction}
          onSubmit={(event) => {
            if (!window.confirm(dismissMessage)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="report_id" value={reportId} />
          <Button
            type="submit"
            variant="outline"
            className="h-11 w-full sm:w-auto"
            disabled={isPending}
            aria-label={`Dismiss report for ${itemTitle}`}
          >
            {isDismissing ? "Dismissing..." : "Dismiss"}
          </Button>
        </form>
      </div>

      {reviewState?.error || dismissState?.error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {reviewState?.error ?? dismissState?.error}
        </p>
      ) : null}

      {reviewState?.success || dismissState?.success ? (
        <p className="border border-green-700/20 bg-green-50 px-3 py-2 text-sm text-green-900">
          {reviewState?.success ?? dismissState?.success}
        </p>
      ) : null}
    </div>
  );
}
