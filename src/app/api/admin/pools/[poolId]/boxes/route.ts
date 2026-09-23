import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";

const createBoxSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  boxOrder: z.number().int().min(1).optional(),
});

type Params = {
  params: Promise<{ poolId: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await params;

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      name: true,
      boxCount: true,
      boxes: {
        orderBy: { boxOrder: "asc" },
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

  return NextResponse.json({ pool });
}

export async function POST(request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await params;

  const payload = await request.json().catch(() => null);
  const parsed = createBoxSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    select: { id: true, boxCount: true },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  const currentCount = await db.poolBox.count({
    where: { poolId },
  });

  if (currentCount >= pool.boxCount) {
    return NextResponse.json(
      { error: "Box limit reached for this pool." },
      { status: 409 },
    );
  }

  let boxOrder = parsed.data.boxOrder;

  if (!boxOrder) {
    const currentMax = await db.poolBox.aggregate({
      where: { poolId },
      _max: { boxOrder: true },
    });
    boxOrder = (currentMax._max.boxOrder ?? 0) + 1;
  }

  try {
    const box = await db.poolBox.create({
      data: {
        poolId,
        boxOrder,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() ?? null,
      },
    });

    await db.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "poolBox.create",
        entityType: "poolBox",
        entityId: box.id,
        metadata: {
          poolId,
          boxOrder,
        },
      },
    });

    return NextResponse.json({ box }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This box order is already used in the pool." },
        { status: 409 },
      );
    }

    throw error;
  }
}
