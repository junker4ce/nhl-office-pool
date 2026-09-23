import Link from "next/link";
import { getServerSession } from "next-auth";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { authOptions } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:px-10">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-7">
          <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
            2026 Season MVP
          </span>
          <h1 className="font-heading text-6xl uppercase leading-[0.9] text-cyan-100 md:text-8xl">
            NHL Office Pool
          </h1>
          <p className="max-w-xl text-lg text-slate-200/90">
            Run a full-season player box pool with account sign-up, admin management,
            and automatic scoring from public NHL APIs.
          </p>
          <div className="flex flex-wrap gap-3">
            {!session && (
              <>
                <Link
                  href="/auth/signup"
                  className={cn(
                    buttonVariants(),
                    "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
                  )}
                >
                  Create account
                </Link>
                <Link
                  href="/auth/login"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-cyan-300/40 text-cyan-100 hover:bg-cyan-500/15",
                  )}
                >
                  Log in
                </Link>
              </>
            )}
            {session && (
              <>
                <Link
                  href="/pools"
                  className={cn(
                    buttonVariants(),
                    "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
                  )}
                >
                  Open office pool
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-cyan-300/40 text-cyan-100 hover:bg-cyan-500/15",
                  )}
                >
                  My dashboard
                </Link>
              </>
            )}
          </div>
        </div>

        <FeatureShowcase />
      </div>
    </section>
  );
}
