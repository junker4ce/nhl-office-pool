import { SyncStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";
import { syncNhlTeams } from "@/lib/nhl";

export async function POST() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = await db.nhlSyncLog.create({
    data: {
      syncType: "teams",
      status: SyncStatus.PENDING,
    },
  });

  try {
    const result = await syncNhlTeams();

    const updatedLog = await db.nhlSyncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.SUCCESS,
        recordsUpserted: result.upserted,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, log: updatedLog });
  } catch (error) {
    const updatedLog = await db.nhlSyncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Unknown sync error",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { ok: false, log: updatedLog },
      {
        status: 500,
      },
    );
  }
}
