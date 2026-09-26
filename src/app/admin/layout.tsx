import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-[240px_1fr] md:px-10">
      <aside className="rounded-2xl border border-brand/20 bg-card p-4">
        <h2 className="font-heading text-3xl uppercase text-brand">Admin</h2>
        <nav className="mt-4 space-y-2 text-sm text-foreground">
          <Link className="block rounded-md px-3 py-2 hover:bg-muted" href="/admin">
            Overview
          </Link>
        </nav>
      </aside>
      <div>{children}</div>
    </section>
  );
}
