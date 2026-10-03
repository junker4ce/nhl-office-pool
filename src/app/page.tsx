import { getServerSession } from "next-auth";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { LandingHero } from "@/components/landing/landing-hero";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPoolPickCounts } from "@/lib/pick-counts";

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <LandingHero />;
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
          _count: {
            select: { picks: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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
          picksMade: pool.entrants[0]?._count.picks ?? 0,
        },
      ]
    : [];

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const pointsByEntrantId = new Map<string, number>();

  if (pool) {
    const totals = await db.scoreLedger.groupBy({
      by: ["poolEntrantId"],
      where: { poolEntrant: { poolId: pool.id } },
      _sum: { points: true },
    });

    for (const total of totals) {
      pointsByEntrantId.set(total.poolEntrantId, total._sum.points ?? 0);
    }
  }

  const entrantTeams = pool
    ? (
        await db.poolEntrant.findMany({
          where: { poolId: pool.id },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            createdAt: true,
            user: {
              select: { teamName: true, teamLogoData: true, displayName: true, fullName: true },
            },
            _count: {
              select: { picks: true },
            },
          },
        })
      ).map((entrant) => ({
        id: entrant.id,
        teamName: entrant.user.teamName ?? entrant.user.displayName,
        ownerName: entrant.user.fullName ?? entrant.user.displayName,
        teamLogoData: entrant.user.teamLogoData,
        joinedLabel: dateFormatter.format(entrant.createdAt),
        picksMade: entrant._count.picks,
        boxCount: pool.boxCount,
        points: pointsByEntrantId.get(entrant.id) ?? 0,
      }))
        .sort((a, b) => b.points - a.points || a.teamName.localeCompare(b.teamName))
    : [];

  const { view: requestedView } = await searchParams;
  const poolLocked = pools[0]?.locked ?? false;
  // Other views reveal everyone's picks, so they only open up once the pool is locked.
  const view = poolLocked && requestedView === "pick-counts" ? "pick-counts" : "standings";
  const pickCounts =
    pool && view === "pick-counts"
      ? await getPoolPickCounts(pool.id, { includePickers: false })
      : null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <DashboardOverview
        displayName={session.user.name ?? "Player"}
        role={session.user.role ?? "USER"}
        pools={pools}
        entrantTeams={entrantTeams}
        view={view}
        pickCounts={pickCounts}
      />
    </section>
  );
}
