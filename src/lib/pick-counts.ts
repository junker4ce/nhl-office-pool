import { db } from "@/lib/db";

export async function getPoolPickCounts(poolId: string) {
  const [pool, counts, entrantCount] = await Promise.all([
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
    db.entrantPick.groupBy({
      by: ["playerOptionId"],
      where: { poolBox: { poolId } },
      _count: { _all: true },
    }),
    db.poolEntrant.count({ where: { poolId } }),
  ]);

  if (!pool) {
    return null;
  }

  const countByOptionId = new Map(
    counts.map((row) => [row.playerOptionId, row._count._all]),
  );

  const boxes = pool.boxes.map((box) => {
    const options = box.playerOptions
      .map((option) => ({
        id: option.id,
        player: option.player,
        pickCount: countByOptionId.get(option.id) ?? 0,
      }))
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
