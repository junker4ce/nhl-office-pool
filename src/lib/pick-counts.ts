import { db } from "@/lib/db";

export async function getPoolPickCounts(poolId: string) {
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
          pickCount: pickers.length,
          pickers,
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
