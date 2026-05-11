import { ClipboardText, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:px-6">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Lost & Found</p>
            <h1 className="max-w-xl text-3xl font-semibold text-foreground md:text-4xl">
              Create an account to report and track items
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Keep ownership details organized, follow match updates, and
              manage reports from one calm workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-card p-4">
              <ClipboardText className="size-5 text-primary" />
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                Guided reports
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add only the details needed to help the right owner connect.
              </p>
            </div>
            <div className="border border-green-700/20 bg-green-50 p-4 text-green-900">
              <ShieldCheck className="size-5" />
              <h2 className="mt-3 text-lg font-semibold">Safety built in</h2>
              <p className="mt-1 text-sm">
                Private contact details are not shown on public listings.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Account registration
            </h2>
            <p className="text-base text-muted-foreground">
              Start with your name, email, and a secure password.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
