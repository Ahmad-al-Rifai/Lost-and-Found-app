"use client";

import { useActionState } from "react";
import { createClaim, type CreateClaimState } from "@/app/actions/items";
import { Button } from "@/components/ui/button";

type ClaimFormProps = {
  itemId: string;
};

const initialState: CreateClaimState = null;

export function ClaimForm({ itemId }: ClaimFormProps) {
  const [state, formAction, isPending] = useActionState(
    createClaim,
    initialState
  );

  return (
    <form
      id="claim-item"
      action={formAction}
      className="border border-border bg-card p-4"
    >
      <input type="hidden" name="item_id" value={itemId} />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Claim item</h2>
        <p className="text-sm text-muted-foreground">
          Add a private detail that helps the finder verify you own this item.
        </p>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Verification detail
        </span>
        <textarea
          name="verification_answer"
          required
          rows={5}
          maxLength={1000}
          placeholder="Share a detail only the owner would know. Do not include passwords, payment information, or other sensitive data."
          className="min-h-32 w-full resize-y border border-input bg-background px-3 py-2 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
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
        {isPending ? "Submitting claim..." : "Submit claim"}
      </Button>
    </form>
  );
}
