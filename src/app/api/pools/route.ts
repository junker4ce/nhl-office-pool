import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/authz";
import { db } from "@/lib/db";

export async function GET() {
  const session = await requireUserSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pools = await db.pool.findMany({
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

  return NextResponse.json({
    pools: pools.map((pool) => {
      const lockedByDate = pool.lockAt ? pool.lockAt.getTime() <= Date.now() : false;

      return {
        ...pool,
        joined: pool.entrants.length > 0,
        locked: pool.isLocked || lockedByDate,
      };
    }),
  });
}
