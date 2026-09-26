import { db } from "@/lib/db";
import { syncDailyPlayerStats } from "@/lib/nhl";

const SCORING = {
  goal: 1,
  assist: 1,
  goalieWin: 2,
  goalieShutout: 3,
} as const;

function getDefaultSyncDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}

export async function computeScoreLedgerForDate(date: string) {
  const statDate = new Date(date);

  const stats = await db.dailyPlayerStat.findMany({
    where: { statDate },
    select: {
      playerId: true,
      goals: true,
      assists: true,
      goalieWin: true,
      goalieShutout: true,
    },
  });

  const pointsByPlayerId = new Map<string, number>();

  for (const stat of stats) {
    const points =
      stat.goals * SCORING.goal +
      stat.assists * SCORING.assist +
      stat.goalieWin * SCORING.goalieWin +
      stat.goalieShutout * SCORING.goalieShutout;

    pointsByPlayerId.set(stat.playerId, (pointsByPlayerId.get(stat.playerId) ?? 0) + points);
  }

  const [entrants, picks] = await Promise.all([
    db.poolEntrant.findMany({
      select: { id: true, userId: true },
    }),
    db.entrantPick.findMany({
      select: {
        poolEntrantId: true,
        playerOption: { select: { playerId: true } },
      },
    }),
  ]);

  const playerIdsByEntrantId = new Map<string, string[]>();

  for (const pick of picks) {
    const playerIds = playerIdsByEntrantId.get(pick.poolEntrantId) ?? [];
    playerIds.push(pick.playerOption.playerId);
    playerIdsByEntrantId.set(pick.poolEntrantId, playerIds);
  }

  let totalPointsAwarded = 0;

  for (const entrant of entrants) {
    const playerIds = playerIdsByEntrantId.get(entrant.id) ?? [];
    const totalPoints = playerIds.reduce(
      (sum, playerId) => sum + (pointsByPlayerId.get(playerId) ?? 0),
      0,
    );

    await db.scoreLedger.upsert({
      where: { poolEntrantId_statDate: { poolEntrantId: entrant.id, statDate } },
      create: {
        poolEntrantId: entrant.id,
        userId: entrant.userId,
        statDate,
        points: totalPoints,
      },
      update: {
        points: totalPoints,
      },
    });

    totalPointsAwarded += totalPoints;
  }

  return {
    entrantsProcessed: entrants.length,
    totalPointsAwarded,
  };
}

export async function runDailyStatSync(date?: string) {
  const targetDate = date ?? getDefaultSyncDate();

  const statsResult = await syncDailyPlayerStats(targetDate);
  const ledgerResult = await computeScoreLedgerForDate(targetDate);

  return {
    date: targetDate,
    ...statsResult,
    ...ledgerResult,
  };
}
