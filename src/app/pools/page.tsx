import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isPoolLocked(pool: { isLocked: boolean; lockAt: Date | null }) {
  if (pool.isLocked) {
    return true;
  }

  if (pool.lockAt && pool.lockAt.getTime() <= Date.now()) {
    return true;
  }

  return false;
}

export default async function PoolsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/pools");
  }

  const pool = await db.pool.findFirst({
    include: {
      season: true,
      entrants: {
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          entrants: true,
          boxes: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const locked = pool ? isPoolLocked(pool) : false;
  const joined = pool ? pool.entrants.length > 0 : false;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-heading text-5xl uppercase text-cyan-100">Office pool</h1>
        <Badge className="bg-cyan-500/20 text-cyan-100">Single pool setup</Badge>
      </div>
      <Card className="border-cyan-300/20 bg-slate-900/85">
        <CardHeader>
          <CardTitle className="text-slate-100">Current office pool</CardTitle>
          <CardDescription className="text-slate-300">
            Join the office pool and submit one player pick per box before lock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200">
          {!pool && <p>No office pool is configured yet.</p>}
          {pool && (
            <div className="rounded-md border border-slate-700/70 bg-slate-950/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-100">{pool.name}</p>
                <Badge className={locked ? "bg-rose-500/20 text-rose-100" : "bg-cyan-500/20 text-cyan-100"}>
                  {locked ? "Locked" : "Open"}
                </Badge>
              </div>
              <p>Season: {pool.season.label}</p>
              <p>
                Entrants: {pool._count.entrants}
                {pool.entrantLimit ? ` / ${pool.entrantLimit}` : ""}
              </p>
              <p>Boxes configured: {pool._count.boxes} / {pool.boxCount}</p>
              <p>Status: {joined ? "Joined" : "Not joined"}</p>
              <div className="mt-3">
                <Link
                  href={`/pools/${pool.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/10",
                  )}
                >
                  Open picks
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
