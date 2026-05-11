"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

// ─── Sign Up ────────────────────────────────────────────────────────────────

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  // Basic server-side validation
  if (!email || !password || !fullName) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // This data is available inside the Supabase trigger that creates the profile row.
      // Your trigger should read NEW.raw_user_meta_data->>'full_name'
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    // Supabase error messages are user-safe for common cases (e.g. "User already registered")
    return { error: error.message };
  }

  // NOTE: If your Supabase project requires email confirmation, the user won't
  // have an active session yet. Redirect to a "check your email" page instead.
  // If email confirmation is OFF (common in dev), they're logged in immediately.
  redirect("/dashboard");
}

// ─── Sign In ────────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nextPath = getSafeRedirectPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Deliberately vague — don't reveal whether the email exists
    return { error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

// ─── Sign Out ───────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ─── Shared type ────────────────────────────────────────────────────────────

// Used as the state type for useActionState() in client components.
// { error } on failure, { success } on success (if you need a success message),
// or null on the initial render before any submission.
export type ActionState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | null;
