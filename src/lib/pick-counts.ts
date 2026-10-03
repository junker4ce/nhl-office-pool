import { db } from "@/lib/db";
import { pointsForStats } from "@/lib/scoring";

type Options = {
  // Who picked each player is admin-only; leave it out so it never reaches other users.
  includePickers?: boolean;
};

export async function getPoolPickCounts(poolId: string, { includePickers = true }: Options = {}) {
  const [pool, picks, entrantCount] = await Promise.all([
    db.pool.findUnique({
      where: { id: poolId },
      include: {
        season: true,
        boxes: {
          orderBy: { boxOrder: "asc" },
          include: {
            playerOptions: {
              include: {
                player: {
                  include: { team: true },
                },
              },
            },
          },
        },
      },
    }),
    db.entrantPick.findMany({
      where: { poolBox: { poolId } },
      select: {
        playerOptionId: true,
        poolEntrant: {
          select: {
            id: true,
            user: { select: { teamName: true, displayName: true } },
          },
        },
      },
    }),
    db.poolEntrant.count({ where: { poolId } }),
  ]);

  if (!pool) {
    return null;
  }

  const statTotals = await db.dailyPlayerStat.groupBy({
    by: ["playerId"],
    where: {
      playerId: { in: pool.boxes.flatMap((box) => box.playerOptions.map((option) => option.playerId)) },
      statDate: { gte: pool.season.startDate, lte: pool.season.endDate },
    },
    _sum: { goals: true, assists: true, goalieWin: true, goalieShutout: true },
  });

  const statsByPlayerId = new Map(
    statTotals.map((total) => {
      const stats = {
        goals: total._sum.goals ?? 0,
        assists: total._sum.assists ?? 0,
        goalieWin: total._sum.goalieWin ?? 0,
        goalieShutout: total._sum.goalieShutout ?? 0,
      };
      return [total.playerId, { ...stats, points: pointsForStats(stats) }];
    }),
  );

  const pickersByOptionId = new Map<string, Array<{ entrantId: string; teamName: string }>>();

  for (const pick of picks) {
    const pickers = pickersByOptionId.get(pick.playerOptionId) ?? [];
    pickers.push({
      entrantId: pick.poolEntrant.id,
      teamName: pick.poolEntrant.user.teamName ?? pick.poolEntrant.user.displayName,
    });
    pickersByOptionId.set(pick.playerOptionId, pickers);
  }

  const boxes = pool.boxes.map((box) => {
    const options = box.playerOptions
      .map((option) => {
        const pickers = (pickersByOptionId.get(option.id) ?? []).sort((a, b) =>
          a.teamName.localeCompare(b.teamName),
        );

        return {
          id: option.id,
          player: option.player,
          stats: statsByPlayerId.get(option.playerId) ?? {
            goals: 0,
            assists: 0,
            goalieWin: 0,
            goalieShutout: 0,
            points: 0,
          },
          pickCount: pickers.length,
          pickers: includePickers ? pickers : [],
        };
      })
      .sort(
        (a, b) =>
          b.pickCount - a.pickCount ||
          a.player.lastName.localeCompare(b.player.lastName),
      );

    return {
      id: box.id,
      boxOrder: box.boxOrder,
      title: box.title,
      description: box.description,
      totalPicks: options.reduce((sum, option) => sum + option.pickCount, 0),
      options,
    };
  });

  return {
    id: pool.id,
    name: pool.name,
    seasonLabel: pool.season.label,
    entrantCount,
    boxes,
  };
}

export type PoolPickCounts = NonNullable<Awaited<ReturnType<typeof getPoolPickCounts>>>;
