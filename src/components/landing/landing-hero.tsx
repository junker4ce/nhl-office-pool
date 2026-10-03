import Link from "next/link";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:px-10">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-7">
          <span className="inline-flex rounded-full border border-brand/25 bg-brand/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            2026 Season MVP
          </span>
          <h1 className="font-heading text-6xl uppercase leading-[0.9] text-brand md:text-8xl">
            NHL Office Pool
          </h1>
          <p className="max-w-xl text-lg text-foreground/90">
            Run a full-season player box pool with account sign-up, admin management,
            and automatic scoring from public NHL APIs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth/signup"
              className={cn(
                buttonVariants(),
                "bg-brand text-brand-foreground hover:bg-brand/90",
              )}
            >
              Create account
            </Link>
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-brand/40 text-brand hover:bg-brand/15",
              )}
            >
              Log in
            </Link>
          </div>
        </div>

        <FeatureShowcase />
      </div>
    </section>
  );
}
