"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateItemState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | null;

export type CreateClaimState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | null;

export type ReviewClaimState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | null;

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getRequiredNumber(formData: FormData, key: string) {
  const value = getRequiredString(formData, key);
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

function getOptionalImage(formData: FormData) {
  const value = formData.get("item_image");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getSafeFileName(file: File) {
  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const fallbackExtension = extensionByType[file.type] ?? "jpg";
  const rawName = file.name || `photo.${fallbackExtension}`;
  const extension = rawName.includes(".")
    ? rawName.split(".").pop()?.toLowerCase() || fallbackExtension
    : fallbackExtension;
  const baseName =
    rawName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "photo";

  return `${baseName}.${extension}`;
}

export async function createItem(
  _prevState: CreateItemState,
  formData: FormData
): Promise<CreateItemState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in to report an item." };
  }

  const itemType = getRequiredString(formData, "item_type");
  const title = getRequiredString(formData, "title");
  const categoryId = getRequiredNumber(formData, "category_id");
  const locationId = getRequiredNumber(formData, "location_id");
  const dateLostFound = getRequiredString(formData, "date_lost_found");
  const description = getRequiredString(formData, "description");
  const image = getOptionalImage(formData);

  if (!["lost", "found"].includes(itemType)) {
    return { error: "Choose whether the item was lost or found." };
  }

  if (!title) {
    return { error: "Enter an item title." };
  }

  if (!categoryId) {
    return { error: "Choose a category." };
  }

  if (!locationId) {
    return { error: "Choose a location." };
  }

  if (!dateLostFound || !isValidDate(dateLostFound)) {
    return { error: "Choose the date the item was lost or found." };
  }

  if (!description) {
    return { error: "Add a short public description." };
  }

  if (image && !allowedImageTypes.includes(image.type)) {
    return { error: "Upload a JPG, PNG, or WebP image." };
  }

  if (image && image.size > maxImageSize) {
    return { error: "Upload an image smaller than 5 MB." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Your profile could not be found. Try signing in again." };
  }

  const { data: item, error: insertError } = await supabase
    .from("items")
    .insert({
      reported_by: profile.id,
      category_id: categoryId,
      location_id: locationId,
      title,
      description,
      item_type: itemType,
      date_lost_found: dateLostFound,
      status: "open",
    })
    .select("id")
    .single();

  if (insertError || !item) {
    return { error: insertError?.message ?? "The item could not be created." };
  }

  if (image) {
    const objectPath = `${profile.id}/${item.id}/${Date.now()}-${getSafeFileName(
      image
    )}`;
    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(objectPath, image, {
        contentType: image.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        error: `The report was created, but the image could not be uploaded: ${uploadError.message}`,
      };
    }

    const { error: imageInsertError } = await supabase
      .from("item_images")
      .insert({
        item_id: item.id,
        storage_path: objectPath,
        is_primary: true,
      });

    if (imageInsertError) {
      return {
        error: `The report was created, but the image could not be attached: ${imageInsertError.message}`,
      };
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createClaim(
  _prevState: CreateClaimState,
  formData: FormData
): Promise<CreateClaimState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in to claim an item." };
  }

  const itemId = getRequiredString(formData, "item_id");
  const verificationAnswer = getRequiredString(
    formData,
    "verification_answer"
  );

  if (!itemId || !isValidUuid(itemId)) {
    return { error: "This item could not be found." };
  }

  if (!verificationAnswer) {
    return { error: "Add a detail that helps verify ownership." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Your profile could not be found. Try signing in again." };
  }

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("reported_by, item_type, status")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return { error: "This item could not be found or is no longer available." };
  }

  if (item.item_type !== "found") {
    return { error: "Only found items can be claimed." };
  }

  if (item.reported_by === profile.id) {
    return { error: "You cannot claim an item you reported." };
  }

  const { data: existingClaim, error: existingClaimError } = await supabase
    .from("claims")
    .select("id")
    .eq("item_id", itemId)
    .eq("claimant_id", profile.id)
    .maybeSingle();

  if (existingClaimError) {
    return { error: existingClaimError.message };
  }

  if (existingClaim) {
    return { error: "You already submitted a claim for this item." };
  }

  const { error: insertError } = await supabase.from("claims").insert({
    item_id: itemId,
    claimant_id: profile.id,
    claim_status: "pending",
    verification_answer: verificationAnswer,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/dashboard/items/${itemId}`);
  return { success: "Claim submitted for review." };
}

async function getReporterClaimContext(claimId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in to review claims." };
  }

  if (!claimId || !isValidUuid(claimId)) {
    return { error: "This claim could not be found." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Your profile could not be found. Try signing in again." };
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, item_id, claim_status")
    .eq("id", claimId)
    .single();

  if (claimError || !claim?.item_id || !isValidUuid(claim.item_id)) {
    return { error: "This claim could not be found." };
  }

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("id, reported_by")
    .eq("id", claim.item_id)
    .single();

  if (itemError || !item) {
    return { error: "The claimed item could not be found." };
  }

  if (item.reported_by !== profile.id) {
    return { error: "Only the item reporter can review this claim." };
  }

  if (claim.claim_status !== "pending") {
    return { error: "Only pending claims can be changed." };
  }

  return { supabase, claim, item };
}

export async function approveClaim(
  _prevState: ReviewClaimState,
  formData: FormData
): Promise<ReviewClaimState> {
  const claimId = getRequiredString(formData, "claim_id");
  const context = await getReporterClaimContext(claimId);

  if ("error" in context) {
    return { error: context.error ?? "Claim review failed." };
  }

  const { supabase, claim, item } = context;

  const { error: approveError } = await supabase
    .from("claims")
    .update({ claim_status: "approved" })
    .eq("id", claim.id);

  if (approveError) {
    return { error: approveError.message };
  }

  const { error: rejectOthersError } = await supabase
    .from("claims")
    .update({ claim_status: "rejected" })
    .eq("item_id", item.id)
    .eq("claim_status", "pending")
    .neq("id", claim.id);

  if (rejectOthersError) {
    return { error: rejectOthersError.message };
  }

  const { error: itemUpdateError } = await supabase
    .from("items")
    .update({ status: "claimed" })
    .eq("id", item.id);

  if (itemUpdateError) {
    return { error: itemUpdateError.message };
  }

  revalidatePath(`/dashboard/items/${item.id}`);
  return { success: "Claim approved." };
}

export async function rejectClaim(
  _prevState: ReviewClaimState,
  formData: FormData
): Promise<ReviewClaimState> {
  const claimId = getRequiredString(formData, "claim_id");
  const context = await getReporterClaimContext(claimId);

  if ("error" in context) {
    return { error: context.error ?? "Claim review failed." };
  }

  const { supabase, claim, item } = context;

  const { error: rejectError } = await supabase
    .from("claims")
    .update({ claim_status: "rejected" })
    .eq("id", claim.id);

  if (rejectError) {
    return { error: rejectError.message };
  }

  revalidatePath(`/dashboard/items/${item.id}`);
  return { success: "Claim rejected." };
}
