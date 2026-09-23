import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserSession } from "@/lib/authz";
import { db } from "@/lib/db";

const updatePicksSchema = z.object({
  picks: z
    .array(
      z.object({
        poolBoxId: z.string().min(1),
        playerOptionId: z.string().min(1),
      }),
    )
    .min(1),
});

type Params = {
  params: Promise<{ poolId: string }>;
};

function isPoolLocked(pool: { isLocked: boolean; lockAt: Date | null }) {
  if (pool.isLocked) {
    return true;
  }

  if (pool.lockAt && pool.lockAt.getTime() <= Date.now()) {
    return true;
  }

  return false;
}

export async function GET(_: Request, { params }: Params) {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await params;

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    include: {
      season: true,
      boxes: {
        orderBy: {
          boxOrder: "asc",
        },
        include: {
          playerOptions: {
            include: {
              player: {
                include: {
                  team: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  const entrant = await db.poolEntrant.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId: session.user.id,
      },
    },
    include: {
      picks: true,
    },
  });

  return NextResponse.json({
    pool,
    entrant,
    locked: isPoolLocked(pool),
  });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await params;
  const payload = await request.json().catch(() => null);
  const parsed = updatePicksSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      isLocked: true,
      lockAt: true,
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (isPoolLocked(pool)) {
    return NextResponse.json({ error: "Pool is locked" }, { status: 409 });
  }

  const entrant = await db.poolEntrant.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId: session.user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (!entrant) {
    return NextResponse.json(
      { error: "Join the pool before submitting picks." },
      { status: 403 },
    );
  }

  const picks = parsed.data.picks;
  const uniqueBoxIds = [...new Set(picks.map((pick) => pick.poolBoxId))];

  if (uniqueBoxIds.length !== picks.length) {
    return NextResponse.json(
      { error: "Only one pick per box can be submitted." },
      { status: 400 },
    );
  }

  const validBoxes = await db.poolBox.findMany({
    where: {
      id: {
        in: uniqueBoxIds,
      },
      poolId,
    },
    select: {
      id: true,
      playerOptions: {
        select: {
          id: true,
        },
      },
    },
  });

  if (validBoxes.length !== uniqueBoxIds.length) {
    return NextResponse.json({ error: "One or more boxes are invalid." }, { status: 400 });
  }

  const allowedOptionsByBox = new Map<string, Set<string>>();
  for (const box of validBoxes) {
    allowedOptionsByBox.set(
      box.id,
      new Set(box.playerOptions.map((option) => option.id)),
    );
  }

  for (const pick of picks) {
    const allowedOptions = allowedOptionsByBox.get(pick.poolBoxId);
    if (!allowedOptions || !allowedOptions.has(pick.playerOptionId)) {
      return NextResponse.json(
        { error: "A selected player option does not belong to its box." },
        { status: 400 },
      );
    }
  }

  await db.$transaction(async (tx) => {
    for (const pick of picks) {
      await tx.entrantPick.upsert({
        where: {
          poolEntrantId_poolBoxId: {
            poolEntrantId: entrant.id,
            poolBoxId: pick.poolBoxId,
          },
        },
        create: {
          poolEntrantId: entrant.id,
          poolBoxId: pick.poolBoxId,
          playerOptionId: pick.playerOptionId,
          userId: session.user.id,
        },
        update: {
          playerOptionId: pick.playerOptionId,
          pickedAt: new Date(),
          userId: session.user.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "entrantPick.upsertMany",
        entityType: "poolEntrant",
        entityId: entrant.id,
        metadata: {
          poolId,
          pickCount: picks.length,
        },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
