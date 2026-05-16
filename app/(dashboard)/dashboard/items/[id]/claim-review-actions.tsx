"use client";

import { useActionState } from "react";
import {
  approveClaim,
  rejectClaim,
  type ReviewClaimState,
} from "@/app/actions/items";
import { Button } from "@/components/ui/button";

type ClaimReviewActionsProps = {
  claimId: string;
  claimantName: string;
};

const initialState: ReviewClaimState = null;

export function ClaimReviewActions({
  claimId,
  claimantName,
}: ClaimReviewActionsProps) {
  const [approveState, approveAction, isApproving] = useActionState(
    approveClaim,
    initialState
  );
  const [rejectState, rejectAction, isRejecting] = useActionState(
    rejectClaim,
    initialState
  );
  const isPending = isApproving || isRejecting;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <form action={approveAction}>
          <input type="hidden" name="claim_id" value={claimId} />
          <Button
            type="submit"
            className="h-10 w-full sm:w-auto"
            disabled={isPending}
            aria-label={`Approve claim from ${claimantName}`}
          >
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        </form>

        <form action={rejectAction}>
          <input type="hidden" name="claim_id" value={claimId} />
          <Button
            type="submit"
            variant="destructive"
            className="h-10 w-full sm:w-auto"
            disabled={isPending}
            aria-label={`Reject claim from ${claimantName}`}
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </form>
      </div>

      {approveState?.error || rejectState?.error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {approveState?.error ?? rejectState?.error}
        </p>
      ) : null}

      {approveState?.success || rejectState?.success ? (
        <p className="border border-green-700/20 bg-green-50 px-3 py-2 text-sm text-green-900">
          {approveState?.success ?? rejectState?.success}
        </p>
      ) : null}
    </div>
  );
}
