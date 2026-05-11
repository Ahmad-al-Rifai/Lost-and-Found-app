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
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold">
              Lost & Found
            </Link>
            <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
              <Link href="/dashboard" className="text-foreground">
                Browse
              </Link>
              <a href="#reports">Reports</a>
              <a href="#matches">Matches</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:inline">
              {profile?.full_name ?? user.email}
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href="#report-item">Report item</a>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
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
