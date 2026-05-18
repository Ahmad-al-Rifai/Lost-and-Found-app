import { redirect } from "next/navigation";
import Link from "next/link";
import { MagnifyingGlass, Plus, SignOut } from "@phosphor-icons/react/dist/ssr";
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
    .select("full_name, role")
    .eq("auth_user_id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href="/dashboard"
              className="shrink-0 text-base font-semibold text-foreground"
            >
              Lost & Found
            </Link>
            <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex">
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 px-3 text-foreground hover:bg-muted"
              >
                <MagnifyingGlass className="size-4" />
                Browse
              </Link>
              <Link
                href="/dashboard/activity"
                className="inline-flex h-9 items-center px-3 hover:bg-muted hover:text-foreground"
              >
                My Activity
              </Link>
              {isAdmin ? (
                <Link
                  href="/dashboard/admin"
                  className="inline-flex h-9 items-center px-3 hover:bg-muted hover:text-foreground"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
            <Link
              href="/dashboard/activity"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:hidden"
            >
              My Activity
            </Link>
            {isAdmin ? (
              <Link
                href="/dashboard/admin"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:hidden"
              >
                Admin
              </Link>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-40 truncate text-sm text-muted-foreground lg:inline">
              {profile?.full_name ?? user.email}
            </span>
            <Button className="h-9 gap-1.5" asChild>
              <Link href="/dashboard/report">
                <Plus className="size-4" weight="bold" />
                <span className="hidden sm:inline">Report item</span>
                <span className="sm:hidden">Report</span>
              </Link>
            </Button>
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sign out"
              >
                <SignOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-6">
        {children}
      </main>
    </div>
  );
}
