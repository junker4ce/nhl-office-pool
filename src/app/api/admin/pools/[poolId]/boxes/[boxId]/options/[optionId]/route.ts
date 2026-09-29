import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";

type Params = {
  params: Promise<{ poolId: string; boxId: string; optionId: string }>;
};

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId, boxId, optionId } = await params;
  const force = new URL(request.url).searchParams.get("force") === "true";

  const option = await db.poolBoxPlayerOption.findFirst({
    where: {
      id: optionId,
      poolBoxId: boxId,
      poolBox: {
        poolId,
      },
    },
    select: { id: true, _count: { select: { picks: true } } },
  });

  if (!option) {
    return NextResponse.json({ error: "Option not found" }, { status: 404 });
  }

  const pickCount = option._count.picks;
  if (pickCount > 0 && !force) {
    return NextResponse.json(
      {
        error: `This player has been picked by ${pickCount} ${pickCount === 1 ? "entrant" : "entrants"}.`,
        pickCount,
      },
      { status: 409 },
    );
  }

  const removedPicks = await db.$transaction(async (tx) => {
    const picks = await tx.entrantPick.findMany({
      where: { playerOptionId: optionId },
      select: { poolEntrantId: true },
    });

    await tx.entrantPick.deleteMany({
      where: { playerOptionId: optionId },
    });

    await tx.poolBoxPlayerOption.delete({
      where: { id: optionId },
    });

    return picks;
  });

  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "poolBoxOption.delete",
      entityType: "poolBoxPlayerOption",
      entityId: optionId,
      metadata: {
        poolId,
        boxId,
        removedPickCount: removedPicks.length,
        affectedEntrantIds: removedPicks.map((pick) => pick.poolEntrantId),
      },
    },
  });

  return NextResponse.json({ ok: true, removedPickCount: removedPicks.length });
}
