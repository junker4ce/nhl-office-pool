import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  const [user, pool] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { teamName: true, teamLogoData: true },
    }),
    db.pool.findFirst({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const now = new Date();
  const pools = pool
    ? [
        {
          id: pool.id,
          name: pool.name,
          seasonLabel: pool.season.label,
          joined: pool.entrants.length > 0,
          locked: pool.isLocked || (pool.lockAt ? pool.lockAt.getTime() <= now.getTime() : false),
          boxCount: pool.boxCount,
        },
      ]
    : [];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <DashboardOverview
        displayName={session.user.name ?? "Player"}
        role={session.user.role ?? "USER"}
        teamName={user.teamName}
        teamLogoData={user.teamLogoData}
        pools={pools}
      />
    </section>
  );
}
