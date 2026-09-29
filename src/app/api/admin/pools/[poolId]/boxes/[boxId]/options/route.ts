import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";

const addOptionSchema = z.object({
  playerId: z.string().min(1),
});

const reorderOptionsSchema = z.object({
  optionIds: z.array(z.string().min(1)).min(1),
});

type Params = {
  params: Promise<{ poolId: string; boxId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId, boxId } = await params;
  const payload = await request.json().catch(() => null);
  const parsed = addOptionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const box = await db.poolBox.findFirst({
    where: {
      id: boxId,
      poolId,
    },
    select: { id: true },
  });

  if (!box) {
    return NextResponse.json({ error: "Pool box not found" }, { status: 404 });
  }

  const player = await db.player.findUnique({
    where: { id: parsed.data.playerId },
    select: { id: true },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const existingPoolAssignment = await db.poolBoxPlayerOption.findFirst({
    where: {
      poolId,
      playerId: parsed.data.playerId,
    },
    select: {
      id: true,
      poolBoxId: true,
    },
  });

  if (existingPoolAssignment) {
    const message =
      existingPoolAssignment.poolBoxId === boxId
        ? "That player is already an option in this box."
        : "That player is already assigned to another box in this pool.";

    return NextResponse.json({ error: message }, { status: 409 });
  }

  const lastOption = await db.poolBoxPlayerOption.findFirst({
    where: { poolBoxId: boxId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  try {
    const option = await db.poolBoxPlayerOption.create({
      data: {
        poolId,
        poolBoxId: boxId,
        playerId: parsed.data.playerId,
        sortOrder: (lastOption?.sortOrder ?? -1) + 1,
      },
      include: {
        player: {
          include: {
            team: true,
          },
        },
      },
    });

    await db.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "poolBoxOption.create",
        entityType: "poolBoxPlayerOption",
        entityId: option.id,
        metadata: {
          poolId,
          boxId,
          playerId: parsed.data.playerId,
        },
      },
    });

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "That player is already assigned to another box in this pool.",
        },
        { status: 409 },
      );
    }

    throw error;
  }
}

export async function PUT(request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId, boxId } = await params;
  const payload = await request.json().catch(() => null);
  const parsed = reorderOptionsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const box = await db.poolBox.findFirst({
    where: {
      id: boxId,
      poolId,
    },
    select: {
      id: true,
      playerOptions: {
        select: { id: true },
      },
    },
  });

  if (!box) {
    return NextResponse.json({ error: "Pool box not found" }, { status: 404 });
  }

  const { optionIds } = parsed.data;
  const existingIds = new Set(box.playerOptions.map((option) => option.id));
  const isCompleteOrder =
    optionIds.length === existingIds.size &&
    new Set(optionIds).size === optionIds.length &&
    optionIds.every((id) => existingIds.has(id));

  if (!isCompleteOrder) {
    return NextResponse.json(
      { error: "Order must include every option in this box exactly once." },
      { status: 400 },
    );
  }

  await db.$transaction(
    optionIds.map((id, index) =>
      db.poolBoxPlayerOption.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "poolBoxOption.reorder",
      entityType: "poolBox",
      entityId: boxId,
      metadata: {
        poolId,
        optionIds,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
