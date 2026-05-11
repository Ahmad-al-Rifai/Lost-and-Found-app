import { MagnifyingGlass, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

function getNextPath(value: string | string[] | undefined) {
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getNextPath(params.next);

  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:px-6">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Lost & Found</p>
            <h1 className="max-w-xl text-3xl font-semibold text-foreground md:text-4xl">
              Sign in to continue your search
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Review your reports, follow possible matches, and keep claims
              moving without exposing private contact details.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-card p-4">
              <MagnifyingGlass className="size-5 text-primary" />
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                Search-first workspace
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with item, place, or description and narrow results fast.
              </p>
            </div>
            <div className="border border-green-700/20 bg-green-50 p-4 text-green-900">
              <ShieldCheck className="size-5" />
              <h2 className="mt-3 text-lg font-semibold">Private by default</h2>
              <p className="mt-1 text-sm">
                Contact details stay hidden until ownership is verified.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Account sign in
            </h2>
            <p className="text-base text-muted-foreground">
              Use the email tied to your reports.
            </p>
          </div>

          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
