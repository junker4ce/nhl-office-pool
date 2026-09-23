import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-cyan-300/20 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="font-heading text-3xl uppercase tracking-wide text-cyan-100">
          NHL Office Pool
        </Link>
        <nav className="flex items-center gap-2">
          {session && (
            <>
              <Link
                href="/pools"
                className={cn(buttonVariants({ variant: "ghost" }), "text-slate-100 hover:bg-slate-800")}
              >
                Pool
              </Link>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost" }), "text-slate-100 hover:bg-slate-800")}
              >
                Dashboard
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "ghost" }), "text-slate-100 hover:bg-slate-800")}
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
                  "border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800",
                )}
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className={cn(buttonVariants(), "bg-cyan-400 text-slate-950 hover:bg-cyan-300")}
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
