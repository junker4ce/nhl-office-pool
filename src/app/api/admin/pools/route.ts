import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";

const createPoolSchema = z.object({
  name: z.string().min(3).max(120),
  seasonId: z.string().min(1),
  boxCount: z.number().int().min(1).max(200),
  entrantLimit: z.number().int().positive().max(500).nullable().optional(),
  lockAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pools = await db.pool.findMany({
    include: {
      season: true,
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

  return NextResponse.json({ pools });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPoolSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const season = await db.season.findUnique({
    where: { id: parsed.data.seasonId },
    select: { id: true },
  });

  if (!season) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  try {
    const pool = await db.pool.create({
      data: {
        name: parsed.data.name.trim(),
        seasonId: parsed.data.seasonId,
        boxCount: parsed.data.boxCount,
        entrantLimit: parsed.data.entrantLimit ?? null,
        lockAt: parsed.data.lockAt ? new Date(parsed.data.lockAt) : null,
        createdByUserId: session.user.id,
      },
      include: {
        season: true,
      },
    });

    await db.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "pool.create",
        entityType: "pool",
        entityId: pool.id,
        metadata: {
          seasonId: pool.seasonId,
          boxCount: pool.boxCount,
        },
      },
    });

    return NextResponse.json({ pool }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A season can only have one pool in this MVP." },
        { status: 409 },
      );
    }

    throw error;
  }
}
