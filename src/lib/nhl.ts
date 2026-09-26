import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const NHL_ACTIVE_TEAMS_ENDPOINT = "https://api-web.nhle.com/v1/standings/now";
const NHL_TEAMS_ENDPOINT = "https://api.nhle.com/stats/rest/en/team";
const NHL_TEAM_ROSTER_ENDPOINT = (teamAbbreviation: string, seasonId: string) =>
  `https://api-web.nhle.com/v1/roster/${teamAbbreviation}/${seasonId}`;
const NHL_SCORE_ENDPOINT = (date: string) => `https://api-web.nhle.com/v1/score/${date}`;
const NHL_BOXSCORE_ENDPOINT = (gameId: number) => `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`;

const COMPLETED_GAME_STATES = new Set(["OFF", "FINAL"]);

type ActiveTeamsApiResponse = {
  standings?: Array<{
    teamAbbrev?: LocalizedText;
    teamName?: LocalizedText;
  }>;
};

type TeamApiResponse = {
  data: Array<{
    id: number;
    triCode?: string;
    rawTricode?: string;
    fullName: string;
  }>;
};

type LocalizedText = string | { default?: string; [key: string]: string | undefined } | undefined;

type TeamRosterPlayer = {
  id: number;
  firstName?: LocalizedText;
  lastName?: LocalizedText;
  positionCode?: LocalizedText;
  headshot?: string;
};

function getTeamLogoUrl(abbreviation: string) {
  const normalized = abbreviation.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  return `https://assets.nhle.com/logos/nhl/svg/${normalized}_light.svg`;
}

const TEAM_COLOR_MAP: Record<string, { primaryColorHex: string; secondaryColorHex: string | null }> = {
  ANA: { primaryColorHex: "#F47A38", secondaryColorHex: "#B9975B" },
  BOS: { primaryColorHex: "#FFB81C", secondaryColorHex: "#000000" },
  BUF: { primaryColorHex: "#003087", secondaryColorHex: "#FFB81C" },
  CAR: { primaryColorHex: "#CC0000", secondaryColorHex: "#111111" },
  CBJ: { primaryColorHex: "#002654", secondaryColorHex: "#CE1126" },
  CGY: { primaryColorHex: "#C8102E", secondaryColorHex: "#F1BE48" },
  CHI: { primaryColorHex: "#CF0A2C", secondaryColorHex: "#000000" },
  COL: { primaryColorHex: "#6F263D", secondaryColorHex: "#236192" },
  DAL: { primaryColorHex: "#006847", secondaryColorHex: "#8F8F8C" },
  DET: { primaryColorHex: "#CE1126", secondaryColorHex: "#FFFFFF" },
  EDM: { primaryColorHex: "#041E42", secondaryColorHex: "#FF4C00" },
  FLA: { primaryColorHex: "#041E42", secondaryColorHex: "#C8102E" },
  LAK: { primaryColorHex: "#111111", secondaryColorHex: "#A2AAAD" },
  MIN: { primaryColorHex: "#154734", secondaryColorHex: "#A6192E" },
  MTL: { primaryColorHex: "#AF1E2D", secondaryColorHex: "#001E62" },
  NJD: { primaryColorHex: "#CE1126", secondaryColorHex: "#000000" },
  NSH: { primaryColorHex: "#FFB81C", secondaryColorHex: "#041E42" },
  NYI: { primaryColorHex: "#00539B", secondaryColorHex: "#F47D30" },
  NYR: { primaryColorHex: "#0038A8", secondaryColorHex: "#CE1126" },
  OTT: { primaryColorHex: "#C52032", secondaryColorHex: "#C2912C" },
  PHI: { primaryColorHex: "#F74902", secondaryColorHex: "#000000" },
  PIT: { primaryColorHex: "#FFB81C", secondaryColorHex: "#000000" },
  SEA: { primaryColorHex: "#001628", secondaryColorHex: "#99D9D9" },
  SJS: { primaryColorHex: "#006D75", secondaryColorHex: "#EA7200" },
  STL: { primaryColorHex: "#002F87", secondaryColorHex: "#FCB514" },
  TBL: { primaryColorHex: "#002868", secondaryColorHex: "#FFFFFF" },
  TOR: { primaryColorHex: "#00205B", secondaryColorHex: "#FFFFFF" },
  UTA: { primaryColorHex: "#71AFE5", secondaryColorHex: "#041C2C" },
  VAN: { primaryColorHex: "#00205B", secondaryColorHex: "#00843D" },
  VGK: { primaryColorHex: "#B4975A", secondaryColorHex: "#333F42" },
  WPG: { primaryColorHex: "#041E42", secondaryColorHex: "#004C97" },
  WSH: { primaryColorHex: "#041E42", secondaryColorHex: "#C8102E" },
};

function getTeamColors(abbreviation: string) {
  const normalized = abbreviation.trim().toUpperCase();

  return TEAM_COLOR_MAP[normalized] ?? { primaryColorHex: "#22D3EE", secondaryColorHex: "#334155" };
}

const TEAM_MODEL_FIELDS = new Set(
  (Prisma.dmmf.datamodel.models.find((model) => model.name === "Team")?.fields ?? []).map((field) => field.name),
);

function buildTeamColorFields(colors: ReturnType<typeof getTeamColors>) {
  return {
    ...(TEAM_MODEL_FIELDS.has("primaryColorHex") ? { primaryColorHex: colors.primaryColorHex } : {}),
    ...(TEAM_MODEL_FIELDS.has("secondaryColorHex") ? { secondaryColorHex: colors.secondaryColorHex } : {}),
  };
}

type TeamRosterApiResponse = {
  forwards?: TeamRosterPlayer[];
  defensemen?: TeamRosterPlayer[];
  goalies?: TeamRosterPlayer[];
  [key: string]: TeamRosterPlayer[] | undefined;
};

type ScoreApiResponse = {
  games?: Array<{
    id: number;
    gameState?: string;
  }>;
};

type BoxscorePlayerStat = {
  playerId: number;
  goals?: number;
  assists?: number;
  decision?: string;
  goalsAgainst?: number;
  shutout?: number;
};

type BoxscoreTeamStats = {
  forwards?: BoxscorePlayerStat[];
  defense?: BoxscorePlayerStat[];
  goalies?: BoxscorePlayerStat[];
};

type BoxscoreApiResponse = {
  playerByGameStats?: {
    awayTeam?: BoxscoreTeamStats;
    homeTeam?: BoxscoreTeamStats;
  };
};

export class NhlSyncError extends Error {
  upserted: number;
  teamsProcessed: number;
  gamesProcessed: number;

  constructor(
    message: string,
    progress?: { upserted?: number; teamsProcessed?: number; gamesProcessed?: number },
  ) {
    super(message);
    this.name = "NhlSyncError";
    this.upserted = progress?.upserted ?? 0;
    this.teamsProcessed = progress?.teamsProcessed ?? 0;
    this.gamesProcessed = progress?.gamesProcessed ?? 0;
  }
}

function getTextValue(value: LocalizedText, fallback = "") {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (value && typeof value === "object") {
    return value.default?.trim() || Object.values(value).find((entry) => typeof entry === "string" && entry.trim()) || fallback;
  }

  return fallback;
}

function getCurrentNhlSeasonId() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const seasonStart = new Date(Date.UTC(currentYear, 8, 1));
  const seasonYear = now >= seasonStart ? currentYear : currentYear - 1;

  return `${seasonYear}${seasonYear + 1}`;
}

export async function syncNhlTeams() {
  const [activeTeamsRes, teamsRes] = await Promise.all([
    fetch(NHL_ACTIVE_TEAMS_ENDPOINT, {
      method: "GET",
      next: { revalidate: 60 * 60 * 6 },
    }),
    fetch(NHL_TEAMS_ENDPOINT, {
      method: "GET",
      next: { revalidate: 60 * 60 * 6 },
    }),
  ]);

  if (!activeTeamsRes.ok) {
    throw new Error(`NHL active teams API failed with status ${activeTeamsRes.status}`);
  }

  if (!teamsRes.ok) {
    throw new Error(`NHL teams API failed with status ${teamsRes.status}`);
  }

  const activeTeamsPayload = (await activeTeamsRes.json()) as ActiveTeamsApiResponse;
  const teamsPayload = (await teamsRes.json()) as TeamApiResponse;

  const activeAbbreviations = new Set(
    (activeTeamsPayload.standings ?? [])
      .map((team) => getTextValue(team.teamAbbrev, "").toUpperCase())
      .filter(Boolean),
  );

  if (activeAbbreviations.size === 0) {
    throw new NhlSyncError("NHL active teams API returned no teams");
  }

  const byAbbreviation = new Map<string, TeamApiResponse["data"][number]>();

  for (const team of teamsPayload.data) {
    const abbreviation = (team.triCode ?? team.rawTricode ?? "").trim().toUpperCase();

    if (!abbreviation || !activeAbbreviations.has(abbreviation)) {
      continue;
    }

    const existing = byAbbreviation.get(abbreviation);

    if (!existing || team.id > existing.id) {
      byAbbreviation.set(abbreviation, team);
    }
  }

  await db.team.deleteMany({
    where: {
      abbreviation: {
        notIn: [...activeAbbreviations],
      },
    },
  });

  let upserted = 0;

  for (const team of byAbbreviation.values()) {
    const abbreviation = (team.triCode ?? team.rawTricode ?? "").trim().toUpperCase();
    const colors = getTeamColors(abbreviation);
    const colorFields = buildTeamColorFields(colors);

    await db.team.upsert({
      where: { nhlId: team.id },
      create: {
        nhlId: team.id,
        abbreviation,
        name: team.fullName,
        logoUrl: getTeamLogoUrl(abbreviation),
        ...colorFields,
      },
      update: {
        abbreviation,
        name: team.fullName,
        logoUrl: getTeamLogoUrl(abbreviation),
        ...colorFields,
      },
    });

    upserted += 1;
  }

  return {
    upserted,
  };
}

export async function syncNhlPlayers() {
  await syncNhlTeams();

  const teams = await db.team.findMany({
    select: {
      id: true,
      nhlId: true,
      abbreviation: true,
    },
    orderBy: {
      nhlId: "asc",
    },
  });

  const seasonId = getCurrentNhlSeasonId();
  let upserted = 0;
  let teamsProcessed = 0;

  for (const team of teams) {
    const res = await fetch(NHL_TEAM_ROSTER_ENDPOINT(team.abbreviation, seasonId), {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new NhlSyncError(
        `NHL roster API failed for team ${team.abbreviation} with status ${res.status}`,
        { upserted, teamsProcessed },
      );
    }

    const payload = (await res.json()) as TeamRosterApiResponse;
    const rosterPlayers = Object.values(payload).flat() as TeamRosterPlayer[];

    for (const rosterPlayer of rosterPlayers) {
      const firstName = getTextValue(rosterPlayer.firstName, "Unknown");
      const lastName = getTextValue(rosterPlayer.lastName, "Player");
      const position = getTextValue(rosterPlayer.positionCode, "N/A").toUpperCase().slice(0, 10) || "N/A";

      await db.player.upsert({
        where: { nhlId: rosterPlayer.id },
        create: {
          nhlId: rosterPlayer.id,
          teamId: team.id,
          firstName,
          lastName,
          position,
          headshotUrl: rosterPlayer.headshot?.trim() || null,
          active: true,
        },
        update: {
          teamId: team.id,
          firstName,
          lastName,
          position,
          headshotUrl: rosterPlayer.headshot?.trim() || null,
          active: true,
        },
      });

      upserted += 1;
    }

    teamsProcessed += 1;
  }

  return {
    upserted,
    teamsProcessed,
  };
}

function flattenBoxscoreStats(payload: BoxscoreApiResponse) {
  const teams = [payload.playerByGameStats?.awayTeam, payload.playerByGameStats?.homeTeam];
  const skaters: BoxscorePlayerStat[] = [];
  const goalies: BoxscorePlayerStat[] = [];

  for (const team of teams) {
    skaters.push(...(team?.forwards ?? []), ...(team?.defense ?? []));
    goalies.push(...(team?.goalies ?? []));
  }

  return { skaters, goalies };
}

// The NHL API doesn't consistently expose a `shutout` flag on goalie boxscore
// stats, so a win with zero goals against is treated as a shutout. Verify
// this against a real shutout game if the NHL API's field names change.
function isGoalieShutout(goalie: BoxscorePlayerStat) {
  if (typeof goalie.shutout === "number") {
    return goalie.shutout > 0;
  }

  return goalie.decision === "W" && (goalie.goalsAgainst ?? 0) === 0;
}

export async function syncDailyPlayerStats(date: string) {
  const scoreRes = await fetch(NHL_SCORE_ENDPOINT(date), {
    method: "GET",
    cache: "no-store",
  });

  if (!scoreRes.ok) {
    throw new Error(`NHL score API failed for ${date} with status ${scoreRes.status}`);
  }

  const scorePayload = (await scoreRes.json()) as ScoreApiResponse;
  const completedGames = (scorePayload.games ?? []).filter(
    (game) => game.gameState && COMPLETED_GAME_STATES.has(game.gameState),
  );

  let upserted = 0;
  let gamesProcessed = 0;

  for (const game of completedGames) {
    const boxscoreRes = await fetch(NHL_BOXSCORE_ENDPOINT(game.id), {
      method: "GET",
      cache: "no-store",
    });

    if (!boxscoreRes.ok) {
      throw new NhlSyncError(
        `NHL boxscore API failed for game ${game.id} with status ${boxscoreRes.status}`,
        { upserted, gamesProcessed },
      );
    }

    const boxscorePayload = (await boxscoreRes.json()) as BoxscoreApiResponse;
    const { skaters, goalies } = flattenBoxscoreStats(boxscorePayload);

    const nhlIds = [...skaters, ...goalies].map((entry) => entry.playerId);
    const players = await db.player.findMany({
      where: { nhlId: { in: nhlIds } },
      select: { id: true, nhlId: true },
    });
    const playerIdByNhlId = new Map(players.map((player) => [player.nhlId, player.id]));

    for (const skater of skaters) {
      const playerId = playerIdByNhlId.get(skater.playerId);

      if (!playerId) {
        continue;
      }

      await db.dailyPlayerStat.upsert({
        where: { gameId_playerId: { gameId: game.id, playerId } },
        create: {
          gameId: game.id,
          statDate: new Date(date),
          playerId,
          goals: skater.goals ?? 0,
          assists: skater.assists ?? 0,
        },
        update: {
          goals: skater.goals ?? 0,
          assists: skater.assists ?? 0,
        },
      });

      upserted += 1;
    }

    for (const goalie of goalies) {
      const playerId = playerIdByNhlId.get(goalie.playerId);

      if (!playerId) {
        continue;
      }

      const goalieWin = goalie.decision === "W" ? 1 : 0;
      const goalieShutout = isGoalieShutout(goalie) ? 1 : 0;

      await db.dailyPlayerStat.upsert({
        where: { gameId_playerId: { gameId: game.id, playerId } },
        create: {
          gameId: game.id,
          statDate: new Date(date),
          playerId,
          goalieWin,
          goalieShutout,
        },
        update: {
          goalieWin,
          goalieShutout,
        },
      });

      upserted += 1;
    }

    gamesProcessed += 1;
  }

  return {
    upserted,
    gamesProcessed,
  };
}
