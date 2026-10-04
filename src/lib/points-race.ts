import { db } from "@/lib/db";

// Running point totals for every team in a pool, one value per scored day.
export async function getPointsRace(poolId: string) {
  const [entrants, ledgers] = await Promise.all([
    db.poolEntrant.findMany({
      where: { poolId },
      select: {
        id: true,
        user: { select: { teamName: true, displayName: true } },
      },
    }),
    db.scoreLedger.findMany({
      where: { poolEntrant: { poolId } },
      select: { poolEntrantId: true, statDate: true, points: true },
      orderBy: { statDate: "asc" },
    }),
  ]);

  const dates = [...new Set(ledgers.map((ledger) => ledger.statDate.toISOString().slice(0, 10)))];
  const dateIndex = new Map(dates.map((date, index) => [date, index]));

  const dailyPointsByEntrantId = new Map<string, number[]>(
    entrants.map((entrant) => [entrant.id, dates.map(() => 0)]),
  );

  for (const ledger of ledgers) {
    const daily = dailyPointsByEntrantId.get(ledger.poolEntrantId);
    const index = dateIndex.get(ledger.statDate.toISOString().slice(0, 10));
    if (daily && index !== undefined) {
      daily[index] += ledger.points;
    }
  }

  const teams = entrants
    .map((entrant) => {
      let runningTotal = 0;
      const totals = (dailyPointsByEntrantId.get(entrant.id) ?? []).map(
        (points) => (runningTotal += points),
      );

      return {
        id: entrant.id,
        teamName: entrant.user.teamName ?? entrant.user.displayName,
        totals,
        total: runningTotal,
      };
    })
    .sort((a, b) => b.total - a.total || a.teamName.localeCompare(b.teamName));

  return { dates, teams };
}

export type PointsRace = Awaited<ReturnType<typeof getPointsRace>>;
