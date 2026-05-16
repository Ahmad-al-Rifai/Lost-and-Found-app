"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createItem, type CreateItemState } from "@/app/actions/items";
import { Button } from "@/components/ui/button";

type LookupOption = {
  id: number;
  name: string;
};

type ReportFormProps = {
  categories: LookupOption[];
  locations: LookupOption[];
  today: string;
};

const initialState: CreateItemState = null;

export function ReportForm({ categories, locations, today }: ReportFormProps) {
  const [state, formAction, isPending] = useActionState(
    createItem,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <section className="border border-border bg-card p-5">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            Item basics
          </h2>
          <p className="text-sm text-muted-foreground">
            Use public details that help people recognize the item without
            exposing private proof of ownership.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-sm font-medium text-foreground">
              Report type
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 border border-input bg-background px-3 text-sm text-foreground transition hover:bg-muted">
                <input
                  name="item_type"
                  type="radio"
                  value="lost"
                  required
                  className="size-4 accent-primary"
                />
                I lost an item
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 border border-input bg-background px-3 text-sm text-foreground transition hover:bg-muted">
                <input
                  name="item_type"
                  type="radio"
                  value="found"
                  required
                  className="size-4 accent-primary"
                />
                I found an item
              </label>
            </div>
          </fieldset>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Title</span>
            <input
              name="title"
              type="text"
              required
              maxLength={120}
              placeholder="Black backpack, silver key ring, blue water bottle"
              className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Category
            </span>
            <select
              name="category_id"
              required
              className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Description
            </span>
            <textarea
              name="description"
              required
              rows={5}
              maxLength={1000}
              placeholder="Add color, brand, size, or where it was last seen. Keep private identifying details for verification later."
              className="min-h-32 w-full resize-y border border-input bg-background px-3 py-2 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      <section className="border border-border bg-card p-5">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            Place and time
          </h2>
          <p className="text-sm text-muted-foreground">
            Help others narrow the search by choosing the closest university
            location and date.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Location
            </span>
            <select
              name="location_id"
              required
              className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Choose a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Date lost or found
            </span>
            <input
              name="date_lost_found"
              type="date"
              required
              defaultValue={today}
              className="h-11 w-full border border-input bg-background px-3 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      <section className="border border-green-700/20 bg-green-50 p-5 text-green-900">
        <h2 className="text-xl font-semibold">Photo</h2>
        <p className="mt-2 text-sm">
          Add one optional JPG, PNG, or WebP photo up to 5 MB. Avoid showing
          private identifying details.
        </p>
        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium">Item photo</span>
          <input
            name="item_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full border border-green-700/20 bg-background text-sm text-foreground file:mr-3 file:h-11 file:cursor-pointer file:border-0 file:bg-primary file:px-3 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/80"
          />
        </label>
      </section>

      <section className="border border-green-700/20 bg-green-50 p-5 text-green-900">
        <h2 className="text-xl font-semibold">Review and submit</h2>
        <p className="mt-2 text-sm">
          Check the public details before submitting. Private proof of
          ownership should stay out of the report.
        </p>
      </section>

      {state?.error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className="h-11" asChild>
          <Link href="/dashboard">Cancel</Link>
        </Button>
        <Button type="submit" className="h-11" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit report"}
        </Button>
      </div>
    </form>
  );
}
