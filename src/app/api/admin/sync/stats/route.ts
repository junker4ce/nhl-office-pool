import { SyncStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";
import { NhlSyncError } from "@/lib/nhl";
import { runDailyStatSync } from "@/lib/scoring";

export async function POST(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = new URL(request.url).searchParams.get("date") ?? undefined;

  const log = await db.nhlSyncLog.create({
    data: {
      syncType: "dailyStats",
      status: SyncStatus.PENDING,
    },
  });

  try {
    const result = await runDailyStatSync(date);

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
        date: result.date,
        gamesProcessed: result.gamesProcessed,
        entrantsProcessed: result.entrantsProcessed,
        totalPointsAwarded: result.totalPointsAwarded,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
    const recordsUpserted = error instanceof NhlSyncError ? error.upserted : 0;
    const gamesProcessed = error instanceof NhlSyncError ? error.gamesProcessed : 0;

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
          gamesProcessed,
        },
      },
      {
        status: 500,
      },
    );
  }
}
