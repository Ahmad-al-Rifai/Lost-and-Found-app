import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// This layout wraps every route inside app/(dashboard)/.
// It acts as a second layer of protection after proxy.
// Useful if proxy is bypassed accidentally, such as direct API calls.

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("auth_user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/dashboard" className="text-lg font-semibold">
              Lost & Found
            </Link>
            <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
              <Link href="/dashboard" className="text-foreground">
                Browse
              </Link>
              <Link href="/dashboard/activity">My Activity</Link>
            </nav>
            <Link
              href="/dashboard/activity"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:hidden"
            >
              My Activity
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:inline">
              {profile?.full_name ?? user.email}
            </span>
            <Button variant="outline" className="h-11" asChild>
              <Link href="/dashboard/report">Report item</Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="h-11">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
