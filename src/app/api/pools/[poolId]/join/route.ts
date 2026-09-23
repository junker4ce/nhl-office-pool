import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/authz";
import { db } from "@/lib/db";

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

export async function POST(_: Request, { params }: Params) {
  const session = await requireUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await params;

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      isLocked: true,
      lockAt: true,
      entrantLimit: true,
      _count: {
        select: {
          entrants: true,
        },
      },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (isPoolLocked(pool)) {
    return NextResponse.json({ error: "Pool is locked" }, { status: 409 });
  }

  const existing = await db.poolEntrant.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ entrant: existing, joined: false });
  }

  if (pool.entrantLimit && pool._count.entrants >= pool.entrantLimit) {
    return NextResponse.json({ error: "Pool is full" }, { status: 409 });
  }

  const entrant = await db.poolEntrant.create({
    data: {
      poolId,
      userId: session.user.id,
    },
  });

  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "pool.join",
      entityType: "poolEntrant",
      entityId: entrant.id,
      metadata: {
        poolId,
      },
    },
  });

  return NextResponse.json({ entrant, joined: true }, { status: 201 });
}
