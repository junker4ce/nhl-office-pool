import { SyncStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";
import { NhlSyncError, syncNhlPlayers } from "@/lib/nhl";

export async function POST() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = await db.nhlSyncLog.create({
    data: {
      syncType: "players",
      status: SyncStatus.PENDING,
    },
  });

  try {
    const result = await syncNhlPlayers();

    const updatedLog = await db.nhlSyncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.SUCCESS,
        recordsUpserted: result.upserted,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      log: updatedLog,
      summary: {
        teamsProcessed: result.teamsProcessed,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
    const recordsUpserted = error instanceof NhlSyncError ? error.upserted : 0;
    const teamsProcessed = error instanceof NhlSyncError ? error.teamsProcessed : 0;

    const updatedLog = await db.nhlSyncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.FAILED,
        errorMessage,
        recordsUpserted,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        log: updatedLog,
        summary: {
          teamsProcessed,
        },
      },
      {
        status: 500,
      },
    );
  }
}
