import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const NHL_ACTIVE_TEAMS_ENDPOINT = "https://api-web.nhle.com/v1/standings/now";
const NHL_TEAMS_ENDPOINT = "https://api.nhle.com/stats/rest/en/team";
const NHL_TEAM_ROSTER_ENDPOINT = (teamAbbreviation: string, seasonId: string) =>
  `https://api-web.nhle.com/v1/roster/${teamAbbreviation}/${seasonId}`;

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

export class NhlSyncError extends Error {
  upserted: number;
  teamsProcessed: number;

  constructor(message: string, progress?: { upserted?: number; teamsProcessed?: number }) {
    super(message);
    this.name = "NhlSyncError";
    this.upserted = progress?.upserted ?? 0;
    this.teamsProcessed = progress?.teamsProcessed ?? 0;
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
