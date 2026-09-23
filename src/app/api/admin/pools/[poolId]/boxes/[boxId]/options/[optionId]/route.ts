import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";

type Params = {
  params: Promise<{ poolId: string; boxId: string; optionId: string }>;
};

export async function DELETE(_: Request, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId, boxId, optionId } = await params;

  const option = await db.poolBoxPlayerOption.findFirst({
    where: {
      id: optionId,
      poolBoxId: boxId,
      poolBox: {
        poolId,
      },
    },
    select: { id: true },
  });

  if (!option) {
    return NextResponse.json({ error: "Option not found" }, { status: 404 });
  }

  await db.poolBoxPlayerOption.delete({
    where: { id: optionId },
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
      },
    },
  });

  return NextResponse.json({ ok: true });
}
