import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// This layout wraps every route inside app/(dashboard)/.
// It acts as a second layer of protection after middleware —
// useful if you ever bypass middleware accidentally (e.g. direct API calls).

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // getUser() makes a real network request to Supabase to validate the JWT.
  // Never use getSession() here — it only reads the cookie without validating.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch the user's profile row (created automatically by your Supabase trigger)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // TODO: Pass `user` and `profile` to child components via a context provider
  // once you build the nav/sidebar. For now they're just validated here.

  return (
    <div className="min-h-screen bg-background">
      {/* Replace this with your real nav/sidebar in Sprint 2 */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg">Lost & Found</span>
        <span className="text-sm text-muted-foreground">
          {profile?.full_name ?? user.email}
        </span>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}