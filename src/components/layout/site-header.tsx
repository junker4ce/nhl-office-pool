import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="font-heading text-3xl uppercase tracking-wide text-brand">
          NHL Office Pool
        </Link>
        <nav className="flex items-center gap-2">
          {session && (
            <>
              <Link
                href="/pools"
                className={cn(buttonVariants({ variant: "ghost" }), "text-foreground hover:bg-muted")}
              >
                Pool
              </Link>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost" }), "text-foreground hover:bg-muted")}
              >
                Dashboard
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "ghost" }), "text-foreground hover:bg-muted")}
                >
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          )}
          {!session && (
            <>
              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-border bg-transparent text-foreground hover:bg-muted",
                )}
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className={cn(buttonVariants(), "bg-brand text-brand-foreground hover:bg-brand/90")}
              >
                Create account
              </Link>
            </>
          )}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
