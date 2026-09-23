interface HttpClientConfig {
    baseURL: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
interface RequestOptions {
    params?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
}

declare class HttpClient {
    private client;
    private retries;
    private retryDelay;
    constructor(config: HttpClientConfig);
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    private transformError;
    private sleep;
}

interface LocalizedName {
    default: string;
    fr?: string;
    es?: string;
    cs?: string;
    fi?: string;
    sk?: string;
    de?: string;
    sv?: string;
}
declare enum GameType {
    Preseason = 1,
    RegularSeason = 2,
    Playoffs = 3,
    AllStar = 4
}
type SeasonId = string;
interface TeamRef {
    id: number;
    name: LocalizedName;
    abbrev: string;
    logo: string;
}
interface PlayerRef {
    id: number;
    firstName: LocalizedName;
    lastName: LocalizedName;
    sweaterNumber?: number;
    positionCode?: string;
    headshot?: string;
}
interface PaginationParams {
    start?: number;
    limit?: number;
}
interface SortParams {
    sort?: string;
    dir?: 'ASC' | 'DESC';
}

interface PlayerLanding {
    playerId: number;
    isActive: boolean;
    currentTeamId?: number;
    currentTeamAbbrev?: string;
    fullTeamName?: LocalizedName;
    firstName: LocalizedName;
    lastName: LocalizedName;
    teamLogo?: string;
    sweaterNumber?: number;
    position: string;
    headshot: string;
    heroImage?: string;
    heightInInches?: number;
    weightInPounds?: number;
    heightInCentimeters?: number;
    weightInKilograms?: number;
    birthDate: string;
    birthCity?: LocalizedName;
    birthStateProvince?: LocalizedName;
    birthCountry: string;
    shootsCatches: string;
    draftDetails?: DraftDetails;
    playerSlug: string;
    inTop100AllTime?: number;
    inHHOF?: number;
    featuredStats?: FeaturedStats;
    careerTotals?: CareerTotals;
    shopLink?: string;
    twitterLink?: string;
    watchLink?: string;
    last5Games?: GameLogEntry[];
    seasonTotals?: SeasonTotal[];
    awards?: Award[];
    currentTeamRoster?: RosterEntry[];
}
interface DraftDetails {
    year: number;
    teamAbbrev: string;
    round: number;
    pickInRound: number;
    overallPick: number;
}
interface FeaturedStats {
    season: number;
    regularSeason?: StatsSummary;
    playoffs?: StatsSummary;
}
interface StatsSummary {
    subSeason: Record<string, number | string>;
    career: Record<string, number | string>;
}
interface CareerTotals {
    regularSeason?: Record<string, number>;
    playoffs?: Record<string, number>;
}
interface GameLogEntry {
    gameId: number;
    teamAbbrev: string;
    homeRoadFlag: string;
    gameDate: string;
    goals?: number;
    assists?: number;
    points?: number;
    plusMinus?: number;
    powerPlayGoals?: number;
    shots?: number;
    shifts?: number;
    shorthandedGoals?: number;
    gameWinningGoals?: number;
    otGoals?: number;
    pim?: number;
    toi?: string;
    gamesStarted?: number;
    decision?: string;
    shotsAgainst?: number;
    goalsAgainst?: number;
    savePctg?: number;
    shutouts?: number;
}
interface SeasonTotal {
    season: number;
    gameTypeId: number;
    leagueAbbrev: string;
    teamName: LocalizedName;
    sequence?: number;
    gamesPlayed: number;
    [key: string]: unknown;
}
interface Award {
    trophy: LocalizedName;
    seasons: AwardSeason[];
}
interface AwardSeason {
    seasonId: number;
    gamesPlayed: number;
    [key: string]: unknown;
}
interface RosterEntry {
    playerId: number;
    lastName: LocalizedName;
    firstName: LocalizedName;
    playerSlug: string;
}
interface PlayerGameLog {
    seasonId: number;
    gameTypeId: number;
    playerStatsSeasons?: number[];
    gameLog: GameLogEntry[];
}
interface PlayerSpotlight {
    playerId: number;
    name: LocalizedName;
    firstName: LocalizedName;
    lastName: LocalizedName;
    sweaterNumber: number;
    position: string;
    headshot: string;
    teamTriCode: string;
    teamLogo: string;
    teamId: number;
    [key: string]: unknown;
}

declare class PlayersEndpoints {
    private http;
    constructor(http: HttpClient);
    getLanding(playerId: number): Promise<PlayerLanding>;
    getGameLog(playerId: number, season: string, gameType: number): Promise<PlayerGameLog>;
    getGameLogNow(playerId: number): Promise<PlayerGameLog>;
    getSpotlight(): Promise<PlayerSpotlight[]>;
}

interface StandingsResponse {
    wildCardIndicator: boolean;
    standings: StandingEntry[];
}
interface StandingEntry {
    conferenceAbbrev: string;
    conferenceName: string;
    conferenceSequence: number;
    divisionAbbrev: string;
    divisionName: string;
    divisionSequence: number;
    teamName: LocalizedName;
    teamCommonName: LocalizedName;
    teamAbbrev: LocalizedName;
    teamLogo: string;
    clinchIndicator?: string;
    date: string;
    gamesPlayed: number;
    goalDifferential: number;
    goalDifferentialPctg: number;
    goalAgainst: number;
    goalFor: number;
    goalsForPctg: number;
    homeGamesPlayed: number;
    homeGoalDifferential: number;
    homeGoalsAgainst: number;
    homeGoalsFor: number;
    homeLosses: number;
    homeOtLosses: number;
    homePoints: number;
    homeRegulationPlusOtWins: number;
    homeRegulationWins: number;
    homeTies?: number;
    homeWins: number;
    l10GamesPlayed: number;
    l10GoalDifferential: number;
    l10GoalsAgainst: number;
    l10GoalsFor: number;
    l10Losses: number;
    l10OtLosses: number;
    l10Points: number;
    l10RegulationPlusOtWins: number;
    l10RegulationWins: number;
    l10Ties?: number;
    l10Wins: number;
    leagueHomeSequence: number;
    leagueL10Sequence: number;
    leagueRoadSequence: number;
    leagueSequence: number;
    losses: number;
    otLosses: number;
    placeName: LocalizedName;
    pointPctg: number;
    points: number;
    regulationPlusOtWinPctg: number;
    regulationPlusOtWins: number;
    regulationWinPctg: number;
    regulationWins: number;
    roadGamesPlayed: number;
    roadGoalDifferential: number;
    roadGoalsAgainst: number;
    roadGoalsFor: number;
    roadLosses: number;
    roadOtLosses: number;
    roadPoints: number;
    roadRegulationPlusOtWins: number;
    roadRegulationWins: number;
    roadTies?: number;
    roadWins: number;
    seasonId: number;
    streakCode: string;
    streakCount: number;
    ties?: number;
    waiversSequence: number;
    wildcardSequence: number;
    winPctg: number;
    wins: number;
}
interface StandingsSeasonList {
    seasons: StandingsSeason[];
}
interface StandingsSeason {
    id: number;
    conferencesInUse: boolean;
    divisionsInUse: boolean;
    pointForOTLossInUse: boolean;
    regulationWinsInUse: boolean;
    rowInUse: boolean;
    standingsEnd: string;
    standingsStart: string;
    tiesInUse: boolean;
    wildcardInUse: boolean;
}

declare class StandingsEndpoints {
    private http;
    constructor(http: HttpClient);
    get(date?: string): Promise<StandingsResponse>;
    getSeasonList(): Promise<StandingsSeasonList>;
}

interface Boxscore {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    venue: LocalizedName;
    startTimeUTC: string;
    easternUTCOffset: string;
    venueUTCOffset: string;
    gameState: string;
    gameScheduleState: string;
    periodDescriptor: {
        number: number;
        periodType: string;
        maxRegulationPeriods: number;
    };
    awayTeam: BoxscoreTeam;
    homeTeam: BoxscoreTeam;
    clock?: GameClock;
    playerByGameStats: PlayerByGameStats;
    boxscore: BoxscoreDetails;
    gameVideo?: GameVideo;
}
interface BoxscoreTeam {
    id: number;
    name: LocalizedName;
    abbrev: string;
    score: number;
    sog: number;
    faceoffWinningPctg?: number;
    powerPlay?: string;
    pim?: number;
    hits?: number;
    blocks?: number;
    logo: string;
}
interface GameClock {
    timeRemaining: string;
    secondsRemaining: number;
    running: boolean;
    inIntermission: boolean;
}
interface PlayerByGameStats {
    awayTeam: TeamGameStats;
    homeTeam: TeamGameStats;
}
interface TeamGameStats {
    forwards: PlayerGameStat[];
    defense: PlayerGameStat[];
    goalies: GoalieGameStat[];
}
interface PlayerGameStat {
    playerId: number;
    name: LocalizedName;
    sweaterNumber: number;
    position: string;
    goals: number;
    assists: number;
    points: number;
    plusMinus: number;
    pim: number;
    hits: number;
    blockedShots: number;
    powerPlayGoals: number;
    powerPlayPoints: number;
    shorthandedGoals: number;
    shorthpiandedPoints: number;
    shots: number;
    faceoffs: string;
    faceoffWinningPctg: number;
    toi: string;
    powerPlayToi: string;
    shorthandedToi: string;
}
interface GoalieGameStat {
    playerId: number;
    name: LocalizedName;
    sweaterNumber: number;
    position: string;
    evenStrengthShotsAgainst: string;
    powerPlayShotsAgainst: string;
    shorthandedShotsAgainst: string;
    saveShotsAgainst: string;
    savePctg?: number;
    evenStrengthGoalsAgainst: number;
    powerPlayGoalsAgainst: number;
    shorthandedGoalsAgainst: number;
    pim: number;
    goalsAgainst: number;
    toi: string;
}
interface BoxscoreDetails {
    linescore: Linescore;
    shotsByPeriod: ShotsByPeriod[];
    gameReports?: GameReports;
}
interface Linescore {
    byPeriod: PeriodScore[];
    totals: {
        away: number;
        home: number;
    };
}
interface PeriodScore {
    period: number;
    periodDescriptor: {
        number: number;
        periodType: string;
    };
    away: number;
    home: number;
}
interface ShotsByPeriod {
    period: number;
    periodDescriptor: {
        number: number;
        periodType: string;
    };
    away: number;
    home: number;
}
interface GameReports {
    gameSummary?: string;
    eventSummary?: string;
    playByPlay?: string;
    faceoffSummary?: string;
    faceoffComparison?: string;
    rosters?: string;
    shotSummary?: string;
    shiftChart?: string;
    toiAway?: string;
    toiHome?: string;
}
interface GameVideo {
    threeMinRecap?: number;
    threeMinRecapFr?: number;
    condensedGame?: number;
    condensedGameFr?: number;
}
interface PlayByPlay {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    venue: LocalizedName;
    startTimeUTC: string;
    gameState: string;
    gameScheduleState: string;
    awayTeam: {
        id: number;
        abbrev: string;
        logo: string;
        score?: number;
    };
    homeTeam: {
        id: number;
        abbrev: string;
        logo: string;
        score?: number;
    };
    clock?: GameClock;
    periodDescriptor?: {
        number: number;
        periodType: string;
        maxRegulationPeriods: number;
    };
    plays: Play[];
    rosterSpots: RosterSpot[];
}
interface Play {
    eventId: number;
    periodDescriptor: {
        number: number;
        periodType: string;
    };
    timeInPeriod: string;
    timeRemaining: string;
    situationCode?: string;
    homeTeamDefendingSide?: string;
    typeCode: number;
    typeDescKey: string;
    sortOrder: number;
    details?: Record<string, unknown>;
}
interface RosterSpot {
    teamId: number;
    playerId: number;
    firstName: LocalizedName;
    lastName: LocalizedName;
    sweaterNumber: number;
    positionCode: string;
    headshot: string;
}
interface GameLanding {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    venue: LocalizedName;
    startTimeUTC: string;
    gameState: string;
    gameScheduleState: string;
    awayTeam: GameLandingTeam;
    homeTeam: GameLandingTeam;
    summary?: GameSummary;
    matchup?: Record<string, unknown>;
}
interface GameLandingTeam {
    id: number;
    name: LocalizedName;
    abbrev: string;
    score?: number;
    sog?: number;
    logo: string;
}
interface GameSummary {
    scoring: ScoringPeriod[];
    shootout?: ShootoutAttempt[];
    threeStars?: ThreeStar[];
    penalties: PenaltyPeriod[];
    gameInfo?: Record<string, unknown>;
    linescore?: Linescore;
    shotsByPeriod?: ShotsByPeriod[];
}
interface ScoringPeriod {
    periodDescriptor: {
        number: number;
        periodType: string;
    };
    goals: ScoringGoal[];
}
interface ScoringGoal {
    situationCode: string;
    strength: string;
    playerId: number;
    firstName: LocalizedName;
    lastName: LocalizedName;
    name?: LocalizedName;
    teamAbbrev: LocalizedName;
    headshot: string;
    highlightClip?: number;
    highlightClipFr?: number;
    goalsToDate: number;
    awayScore: number;
    homeScore: number;
    leadingTeamAbbrev?: LocalizedName;
    timeInPeriod: string;
    shotType?: string;
    goalModifier?: string;
    assists: ScoringAssist[];
}
interface ScoringAssist {
    playerId: number;
    firstName: LocalizedName;
    lastName: LocalizedName;
    name?: LocalizedName;
    assistsToDate: number;
}
interface ShootoutAttempt {
    sequence: number;
    playerId: number;
    teamAbbrev: string;
    firstName: LocalizedName;
    lastName: LocalizedName;
    shotType?: string;
    result: string;
    headshot: string;
    gameWinner: boolean;
}
interface ThreeStar {
    star: number;
    playerId: number;
    teamAbbrev: string;
    headshot: string;
    name: LocalizedName;
    firstName: LocalizedName;
    lastName: LocalizedName;
    sweaterNo: number;
    position: string;
    goals?: number;
    assists?: number;
    points?: number;
    savePctg?: number;
    goalsAgainst?: number;
}
interface PenaltyPeriod {
    periodDescriptor: {
        number: number;
        periodType: string;
    };
    penalties: PenaltyEvent[];
}
interface PenaltyEvent {
    timeInPeriod: string;
    type: string;
    duration: number;
    committedByPlayer?: string;
    teamAbbrev: LocalizedName;
    drawnBy?: string;
    descKey: string;
}
interface ScoresResponse {
    currentDate: string;
    prevDate: string;
    nextDate: string;
    gamesByDate: GamesByDate[];
    focusedDate?: string;
    focusedDateCount?: number;
}
interface GamesByDate {
    date: string;
    games: ScoreGame[];
}
interface ScoreGame {
    id: number;
    season: number;
    gameType: number;
    venue: LocalizedName;
    neutralSite: boolean;
    startTimeUTC: string;
    easternUTCOffset: string;
    venueUTCOffset: string;
    venueTimezone: string;
    gameState: string;
    gameScheduleState: string;
    awayTeam: ScoreTeam;
    homeTeam: ScoreTeam;
    periodDescriptor?: {
        number: number;
        periodType: string;
        maxRegulationPeriods: number;
    };
    gameOutcome?: {
        lastPeriodType: string;
    };
    clock?: GameClock;
    gameCenterLink: string;
    [key: string]: unknown;
}
interface ScoreTeam {
    id: number;
    abbrev: string;
    logo: string;
    darkLogo?: string;
    score?: number;
}
interface GameStory {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    venue: LocalizedName;
    gameState: string;
    awayTeam: GameLandingTeam;
    homeTeam: GameLandingTeam;
    summary?: GameSummary;
    [key: string]: unknown;
}
interface GameRightRail {
    gameId: number;
    teamGameStats?: TeamGameStatsComparison[];
    seasonSeriesWins?: Record<string, unknown>;
    shotsByPeriod?: ShotsByPeriod[];
    [key: string]: unknown;
}
interface TeamGameStatsComparison {
    category: string;
    awayValue: string | number;
    homeValue: string | number;
}

interface TeamRoster {
    forwards: RosterPlayer[];
    defensemen: RosterPlayer[];
    goalies: RosterPlayer[];
}
interface RosterPlayer {
    id: number;
    headshot: string;
    firstName: LocalizedName;
    lastName: LocalizedName;
    sweaterNumber: number;
    positionCode: string;
    shootsCatches: string;
    heightInInches: number;
    weightInPounds: number;
    heightInCentimeters: number;
    weightInKilograms: number;
    birthDate: string;
    birthCity: LocalizedName;
    birthCountry: string;
    birthStateProvince?: LocalizedName;
}
interface TeamSeasonStats {
    season: number;
    gameType: number;
    teamId: number;
    teamFullName: string;
    skaters: TeamSkaterStat[];
    goalies: TeamGoalieStat[];
}
interface TeamSkaterStat {
    playerId: number;
    headshot: string;
    firstName: LocalizedName;
    lastName: LocalizedName;
    positionCode: string;
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    plusMinus: number;
    pim: number;
    gameWinningGoals: number;
    otGoals: number;
    shots: number;
    shootingPctg: number;
    powerPlayGoals: number;
    powerPlayPoints: number;
    shorthandedGoals: number;
    shorthandedPoints: number;
    avgToi: string;
    faceoffWinPctg: number;
    [key: string]: unknown;
}
interface TeamGoalieStat {
    playerId: number;
    headshot: string;
    firstName: LocalizedName;
    lastName: LocalizedName;
    gamesPlayed: number;
    gamesStarted: number;
    wins: number;
    losses: number;
    otLosses: number;
    goalsAgainstAvg: number;
    savePctg: number;
    shutouts: number;
    [key: string]: unknown;
}
interface TeamScheduleResponse {
    previousMonth: string;
    currentMonth: string;
    nextMonth: string;
    calendarUrl: string;
    clubTimezone: string;
    clubUTCOffset: string;
    games: TeamScheduleGame[];
}
interface TeamScheduleGame {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    venue: LocalizedName;
    neutralSite: boolean;
    startTimeUTC: string;
    gameState: string;
    gameScheduleState: string;
    awayTeam: TeamScheduleTeamEntry;
    homeTeam: TeamScheduleTeamEntry;
    periodDescriptor?: {
        number: number;
        periodType: string;
    };
    gameOutcome?: {
        lastPeriodType: string;
    };
    winningGoalie?: {
        playerId: number;
    };
    winningGoalScorer?: {
        playerId: number;
    };
    tvBroadcasts?: {
        id: number;
        market: string;
        countryCode: string;
        network: string;
    }[];
    gameCenterLink: string;
    ticketsLink?: string;
}
interface TeamScheduleTeamEntry {
    id: number;
    abbrev: string;
    logo: string;
    darkLogo?: string;
    score?: number;
    placeName?: LocalizedName;
    placeNameWithPreposition?: LocalizedName;
}
interface ProspectStats {
    [key: string]: unknown;
}
interface TeamScoreboard {
    focusedDate: string;
    focusedDateCount: number;
    clubTimeZone: string;
    clubUTCOffset: string;
    clubScheduleLink: string;
    gamesByDate: GamesByDateEntry[];
}
interface GamesByDateEntry {
    date: string;
    games: ScoreboardGame[];
}
interface ScoreboardGame {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    startTimeUTC: string;
    gameState: string;
    gameScheduleState: string;
    awayTeam: {
        id: number;
        abbrev: string;
        logo: string;
        score?: number;
    };
    homeTeam: {
        id: number;
        abbrev: string;
        logo: string;
        score?: number;
    };
    clock?: {
        timeRemaining: string;
        secondsRemaining: number;
        running: boolean;
        inIntermission: boolean;
    };
    [key: string]: unknown;
}

declare class ScoresEndpoints {
    private http;
    constructor(http: HttpClient);
    get(date?: string): Promise<ScoresResponse>;
    getScoreboard(date?: string): Promise<ScoresResponse>;
    getTeamScoreboard(teamAbbrev: string): Promise<TeamScoreboard>;
}

declare class TeamsEndpoints {
    private http;
    constructor(http: HttpClient);
    getRoster(teamAbbrev: string, season?: string): Promise<TeamRoster>;
    getRosterSeason(teamAbbrev: string): Promise<number[]>;
    getStats(teamAbbrev: string, season?: string, gameType?: number): Promise<TeamSeasonStats>;
    getStatsSeasonList(teamAbbrev: string): Promise<unknown>;
    getSchedule(teamAbbrev: string, month?: string): Promise<TeamScheduleResponse>;
    getScheduleByWeek(teamAbbrev: string, date?: string): Promise<TeamScheduleResponse>;
    getScheduleSeason(teamAbbrev: string, season?: string): Promise<TeamScheduleResponse>;
    getProspects(teamAbbrev: string): Promise<ProspectStats>;
    getScoreboard(teamAbbrev: string): Promise<TeamScoreboard>;
    getSeasonList(): Promise<unknown>;
    getLogo(teamAbbrev: string): Promise<string>;
}

interface ScheduleResponse {
    nextStartDate: string;
    previousStartDate: string;
    gameWeek: GameWeek[];
    oddsPartners: OddsPartner[];
    preSeasonStartDate: string;
    regularSeasonStartDate: string;
    regularSeasonEndDate: string;
    playoffEndDate: string;
    numberOfGames: number;
}
interface GameWeek {
    date: string;
    dayAbbrev: string;
    numberOfGames: number;
    games: ScheduleGame[];
}
interface ScheduleGame {
    id: number;
    season: number;
    gameType: number;
    venue: LocalizedName;
    neutralSite: boolean;
    startTimeUTC: string;
    easternUTCOffset: string;
    venueUTCOffset: string;
    venueTimezone: string;
    gameState: string;
    gameScheduleState: string;
    tvBroadcasts: TvBroadcast[];
    awayTeam: ScheduleTeam;
    homeTeam: ScheduleTeam;
    periodDescriptor?: PeriodDescriptor;
    gameOutcome?: GameOutcome;
    winningGoalie?: PlayerInfo;
    winningGoalScorer?: PlayerInfo;
    threeMinRecap?: string;
    threeMinRecapFr?: string;
    gameCenterLink: string;
    ticketsLink?: string;
    ticketsLinkFr?: string;
}
interface ScheduleTeam {
    id: number;
    placeName?: LocalizedName;
    abbrev: string;
    logo: string;
    darkLogo: string;
    awaySplitSquad?: boolean;
    homeSplitSquad?: boolean;
    score?: number;
    radioLink?: string;
    odds?: OddsEntry[];
}
interface TvBroadcast {
    id: number;
    market: string;
    countryCode: string;
    network: string;
    sequenceNumber: number;
}
interface PeriodDescriptor {
    number: number;
    periodType: string;
    maxRegulationPeriods?: number;
}
interface GameOutcome {
    lastPeriodType: string;
}
interface PlayerInfo {
    playerId: number;
    firstInitial: LocalizedName;
    lastName: LocalizedName;
}
interface OddsPartner {
    partnerId: number;
    country: string;
    name: string;
    imageUrl: string;
    siteUrl?: string;
    bgColor: string;
    textColor: string;
    accentColor: string;
}
interface OddsEntry {
    providerId: number;
    value: string;
}
interface ScheduleCalendar {
    nextStartDate: string;
    previousStartDate: string;
    clubTimeZone?: string;
    clubUTCOffset?: string;
}

declare class ScheduleEndpoints {
    private http;
    constructor(http: HttpClient);
    get(date?: string): Promise<ScheduleResponse>;
    getCalendar(date?: string): Promise<ScheduleCalendar>;
    getByTeam(teamAbbrev: string, date?: string): Promise<ScheduleResponse>;
    getSeasonSchedule(season: string): Promise<unknown>;
}

declare class GamesEndpoints {
    private http;
    constructor(http: HttpClient);
    getPlayByPlay(gameId: number): Promise<PlayByPlay>;
    getBoxscore(gameId: number): Promise<Boxscore>;
    getLanding(gameId: number): Promise<GameLanding>;
    getStory(gameId: number): Promise<GameStory>;
    getRightRail(gameId: number): Promise<GameRightRail>;
    getReplay(gameId: number): Promise<unknown>;
    getWscPlayByPlay(gameId: number): Promise<unknown>;
}

interface LeadersResponse {
    categories: LeaderCategory[];
}
interface LeaderCategory {
    categoryKey: string;
    displayTitle: string;
    leaders: Leader[];
}
interface Leader {
    id: number;
    firstName: LocalizedName;
    lastName: LocalizedName;
    sweaterNumber: number;
    teamAbbrev: string;
    teamName?: LocalizedName;
    teamLogo: string;
    headshot: string;
    position: string;
    value: number | string;
}

declare class LeadersEndpoints {
    private http;
    constructor(http: HttpClient);
    getSkatersCurrent(categories?: string): Promise<LeadersResponse>;
    getSkaters(season: string, gameType: number, categories?: string): Promise<LeadersResponse>;
    getGoaliesCurrent(categories?: string): Promise<LeadersResponse>;
    getGoalies(season: string, gameType: number, categories?: string): Promise<LeadersResponse>;
}

interface DraftRankingsResponse {
    draftYear: number;
    categoryKey: string;
    categories: DraftCategory[];
    rankings: DraftProspect[];
}
interface DraftCategory {
    categoryKey: string;
    categoryName: string;
}
interface DraftProspect {
    lastName: string;
    firstName: string;
    positionCode: string;
    shootsCatches?: string;
    heightInInches?: number;
    weightInPounds?: number;
    lastAmateurClub?: string;
    lastAmateurLeague?: string;
    birthDate: string;
    birthCity?: string;
    birthStateProvince?: string;
    birthCountry?: string;
    midtermRank?: number;
    finalRank?: number;
    [key: string]: unknown;
}
interface DraftPicksResponse {
    draftYear: number;
    rounds: DraftRound[];
}
interface DraftRound {
    roundNumber: number;
    picks: DraftPick[];
}
interface DraftPick {
    round: number;
    pickInRound: number;
    overallPickNumber: number;
    year: number;
    teamAbbrev: string;
    teamLogo: string;
    firstName: string;
    lastName: string;
    positionCode: string;
    shootsCatches?: string;
    birthDate?: string;
    birthCity?: string;
    birthCountry?: string;
    heightInInches?: number;
    weightInPounds?: number;
    amateurClubName?: string;
    amateurLeague?: string;
    playerId?: number;
    [key: string]: unknown;
}

declare class DraftEndpoints {
    private http;
    constructor(http: HttpClient);
    getRankingsNow(): Promise<DraftRankingsResponse>;
    getRankings(season: string, prospectCategory?: string): Promise<DraftRankingsResponse>;
    getPicksNow(): Promise<DraftPicksResponse>;
    getPicks(season: string, round?: number): Promise<DraftPicksResponse>;
}

interface PlayoffSeriesCarousel {
    seasonId: number;
    currentRound: number;
    rounds: PlayoffRound[];
}
interface PlayoffRound {
    roundNumber: number;
    roundCode: string;
    roundAbbrev: string;
    series: PlayoffSeries[];
}
interface PlayoffSeries {
    seriesTitle: string;
    seriesAbbrev: string;
    seriesLetter: string;
    seriesUrl: string;
    topSeedTeam: PlayoffTeam;
    bottomSeedTeam: PlayoffTeam;
    winningTeamId?: number;
    losingTeamId?: number;
    neededToWin: number;
    topSeedWins: number;
    bottomSeedWins: number;
}
interface PlayoffTeam {
    id: number;
    abbrev: string;
    name: LocalizedName;
    logo: string;
    darkLogo?: string;
    commonName?: LocalizedName;
    seed?: number;
    seriesWins?: number;
}
interface PlayoffSeriesSchedule {
    seriesTitle: string;
    topSeedTeam: PlayoffTeam;
    bottomSeedTeam: PlayoffTeam;
    games: PlayoffGame[];
}
interface PlayoffGame {
    id: number;
    season: number;
    gameType: number;
    gameDate: string;
    venue: LocalizedName;
    startTimeUTC: string;
    gameState: string;
    gameScheduleState: string;
    seriesGameNumber: number;
    awayTeam: PlayoffGameTeam;
    homeTeam: PlayoffGameTeam;
    periodDescriptor?: {
        number: number;
        periodType: string;
    };
    gameOutcome?: {
        lastPeriodType: string;
    };
    [key: string]: unknown;
}
interface PlayoffGameTeam {
    id: number;
    abbrev: string;
    logo: string;
    score?: number;
}
interface PlayoffBracket {
    seasonId: number;
    rounds: PlayoffBracketRound[];
}
interface PlayoffBracketRound {
    roundNumber: number;
    roundCode: string;
    roundAbbrev: string;
    series: PlayoffBracketSeries[];
}
interface PlayoffBracketSeries {
    seriesTitle: string;
    seriesLetter: string;
    matchup: {
        topSeed: PlayoffTeam;
        bottomSeed: PlayoffTeam;
    };
    winningTeamId?: number;
    topSeedWins: number;
    bottomSeedWins: number;
    [key: string]: unknown;
}

declare class PlayoffsEndpoints {
    private http;
    constructor(http: HttpClient);
    getSeriesCarousel(season?: string): Promise<PlayoffSeriesCarousel>;
    getSeriesSchedule(season: string, seriesLetter: string): Promise<PlayoffSeriesSchedule>;
    getBracket(season?: string): Promise<PlayoffBracket>;
}

interface TvScheduleResponse {
    date: string;
    games: TvScheduleGame[];
}
interface TvScheduleGame {
    id: number;
    startTimeUTC: string;
    awayTeam: {
        abbrev: string;
        logo: string;
    };
    homeTeam: {
        abbrev: string;
        logo: string;
    };
    tvBroadcasts: {
        network: string;
        market: string;
        countryCode: string;
    }[];
    [key: string]: unknown;
}
interface WhereToWatchResponse {
    [key: string]: unknown;
}
declare class NetworkEndpoints {
    private http;
    constructor(http: HttpClient);
    getTvSchedule(date?: string): Promise<TvScheduleResponse>;
    getWhereToWatch(): Promise<WhereToWatchResponse>;
    getPartnerGames(countryCode: string, date?: string): Promise<unknown>;
}

interface MetaResponse {
    players: MetaPlayer[];
    teams: MetaTeam[];
    seasonStates: MetaSeasonState[];
}
interface MetaPlayer {
    playerId: number;
    name: string;
    teamId: number;
    teamAbbrev: string;
    position: string;
}
interface MetaTeam {
    teamId: number;
    teamAbbrev: string;
    teamFullName: string;
}
interface MetaSeasonState {
    seasonId: number;
    gameTypes: number[];
}
interface GameMetaResponse {
    [key: string]: unknown;
}
declare class MetaEndpoints {
    private http;
    constructor(http: HttpClient);
    get(): Promise<MetaResponse>;
    getGame(gameId: number): Promise<GameMetaResponse>;
    getLocation(): Promise<unknown>;
    getSeason(): Promise<unknown>;
    getPlayoffSeriesMeta(): Promise<unknown>;
}

interface EdgeSeasonParams {
    season?: string;
    gameType?: number;
    position?: string;
    team?: string;
    limit?: number;
    start?: number;
}
interface EdgeTeamStat {
    teamId: number;
    teamFullName: string;
    teamAbbrev: string;
    gamesPlayed: number;
    [key: string]: unknown;
}
interface EdgeSkaterStat {
    playerId: number;
    firstName: string;
    lastName: string;
    teamAbbrev: string;
    position: string;
    gamesPlayed: number;
    [key: string]: unknown;
}
interface EdgeGoalieStat {
    playerId: number;
    firstName: string;
    lastName: string;
    teamAbbrev: string;
    gamesPlayed: number;
    [key: string]: unknown;
}
interface EdgeResponse<T> {
    data: T[];
    total: number;
}

declare class EdgeTeamsEndpoints {
    private http;
    constructor(http: HttpClient);
    private buildParams;
    getRealTimeStats(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getDistance(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getSpeed(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getSpeedBursts(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getZoneTime(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getShotSpeed(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getShotLocation(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getTimeBetweenShots(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getPossessionTime(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getPenaltyKill(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getPowerPlay(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getFaceoffs(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
    getOverview(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeTeamStat>>;
}

declare class EdgeSkatersEndpoints {
    private http;
    constructor(http: HttpClient);
    private buildParams;
    getRealTimeStats(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getDistance(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getSpeed(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getSpeedBursts(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getZoneTime(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getShotSpeed(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getShotLocation(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getTimeBetweenShots(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getPossessionTime(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getPenaltyKill(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getPowerPlay(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getFaceoffs(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getOverview(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getRealtimeLeaders(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
    getSpeedLeaders(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeSkaterStat>>;
}

declare class EdgeGoaliesEndpoints {
    private http;
    constructor(http: HttpClient);
    private buildParams;
    getRealTimeStats(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getSaveTracking(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getShotSpeed(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getShotLocation(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getShotType(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getZoneTime(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getPenaltyKill(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getStartVsRelief(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getDaysRest(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getOverview(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
    getLeaders(params?: EdgeSeasonParams): Promise<EdgeResponse<EdgeGoalieStat>>;
}

interface WebApiClientConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
declare class WebApiClient {
    private http;
    readonly players: PlayersEndpoints;
    readonly standings: StandingsEndpoints;
    readonly scores: ScoresEndpoints;
    readonly teams: TeamsEndpoints;
    readonly schedule: ScheduleEndpoints;
    readonly games: GamesEndpoints;
    readonly leaders: LeadersEndpoints;
    readonly draft: DraftEndpoints;
    readonly playoffs: PlayoffsEndpoints;
    readonly network: NetworkEndpoints;
    readonly meta: MetaEndpoints;
    readonly edge: {
        teams: EdgeTeamsEndpoints;
        skaters: EdgeSkatersEndpoints;
        goalies: EdgeGoaliesEndpoints;
    };
    constructor(config?: WebApiClientConfig);
    get httpClient(): HttpClient;
}

interface StatsApiResponse<T> {
    data: T[];
    total: number;
}
interface StatsQueryParams {
    cayenneExp?: string;
    factCayenneExp?: string;
    sort?: string | SortField[];
    dir?: 'ASC' | 'DESC';
    start?: number;
    limit?: number;
    isAggregate?: boolean;
    isGame?: boolean;
}
interface SortField {
    property: string;
    direction: 'ASC' | 'DESC';
}
declare enum SkaterReportType {
    Summary = "summary",
    Bios = "bios",
    FaceoffPercentages = "faceoffpercentages",
    FaceoffWinsLosses = "faceoffwinslosses",
    GoalsForAgainst = "goalsforagainst",
    RealTime = "realtime",
    Penalties = "penalties",
    PenaltyKill = "penaltykill",
    PenaltyShots = "penaltyshots",
    PowerPlay = "powerplay",
    PuckPossessions = "puckpossessions",
    SatCounts = "summaryshooting",
    SatPercentages = "percentages",
    ScoringShotType = "scoringRates",
    ShootOut = "shootout",
    ShotType = "shottype",
    TimeOnIce = "timeonice"
}
declare enum GoalieReportType {
    Summary = "summary",
    Advanced = "advanced",
    Bios = "bios",
    DaysRest = "daysrest",
    PenaltyShots = "penaltyshots",
    SavesByStrength = "savesByStrength",
    ShootOut = "shootout",
    StartedVsRelieved = "startedVsRelieved"
}
declare enum TeamReportType {
    Summary = "summary",
    Penalties = "penalties",
    PenaltyKill = "penaltykill",
    PenaltyKillTime = "penaltykilltime",
    PowerPlay = "powerplay",
    PowerPlayTime = "powerplaytime",
    GoalsByGameSituation = "summaryshooting",
    FaceoffPercentages = "faceoffpercentages",
    DaysRest = "daysrest",
    OutshootOutshot = "outshootoutshot",
    RealTime = "realtime",
    ShootOut = "shootout",
    Scoring = "scoring",
    ShotType = "shottype"
}
interface StatsSkater {
    playerId: number;
    skaterFullName: string;
    positionCode: string;
    teamAbbrevs: string;
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    plusMinus: number;
    penaltyMinutes: number;
    pointsPerGame: number;
    [key: string]: unknown;
}
interface StatsGoalie {
    playerId: number;
    goalieFullName: string;
    teamAbbrevs: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    otLosses: number;
    goalsAgainstAverage: number;
    savePct: number;
    shutouts: number;
    [key: string]: unknown;
}
interface StatsTeam {
    teamId: number;
    teamFullName: string;
    triCode: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    otLosses: number;
    points: number;
    pointPct: number;
    [key: string]: unknown;
}
interface Franchise {
    id: number;
    firstSeasonId: number;
    fullName: string;
    lastSeasonId?: number;
    teamAbbrev: string;
    teamCommonName: string;
    teamPlaceName: string;
    [key: string]: unknown;
}
interface StatsGame {
    gameId: number;
    gameDate: string;
    gameType: number;
    season: number;
    homeTeamId: number;
    awayTeamId: number;
    [key: string]: unknown;
}
interface ShiftChart {
    id: number;
    detailCode: number;
    duration: string;
    endTime: string;
    eventDescription?: string;
    eventDetails?: string;
    eventNumber: number;
    firstName: string;
    gameId: number;
    hexValue?: string;
    lastName: string;
    period: number;
    playerId: number;
    shiftNumber: number;
    startTime: string;
    teamAbbrev: string;
    teamId: number;
    teamName: string;
    typeCode: number;
    [key: string]: unknown;
}
interface StatsConfig {
    [key: string]: unknown;
}
interface Country {
    id: string;
    countryName: string;
    countryCode: string;
    nationality: string;
    [key: string]: unknown;
}
interface GlossaryEntry {
    [key: string]: unknown;
}
interface Season {
    id: number;
    allStarGameInUse: boolean;
    conferencesInUse: boolean;
    divisionsInUse: boolean;
    endDate: string;
    entryDraftInUse: boolean;
    formattedSeasonId: string;
    minimumPlayoffMinutesForGoalieStatsLeaders: number;
    minimumRegularGamesForGoalieStatsLeaders: number;
    nhlStanleyCapOwner: string;
    numberOfGames: number;
    olympicsParticipation: boolean;
    pointForOTLossInUse: boolean;
    preseasonStartdate: string;
    regularSeasonEndDate: string;
    regulationWinsInUse: boolean;
    rowInUse: boolean;
    seasonOrdinal: number;
    startDate: string;
    supplementalDraftInUse: boolean;
    tiesInUse: boolean;
    totalPlayoffGames: number;
    totalRegularSeasonGames: number;
    wildcardInUse: boolean;
    [key: string]: unknown;
}
interface Milestone {
    [key: string]: unknown;
}

declare class SkatersStatsEndpoints {
    private http;
    constructor(http: HttpClient);
    private buildParams;
    getByReport(reportType: string, query?: StatsQueryParams): Promise<StatsApiResponse<StatsSkater>>;
    getLeaders(reportType: string, query?: StatsQueryParams): Promise<StatsApiResponse<StatsSkater>>;
    getMilestones(query?: StatsQueryParams): Promise<StatsApiResponse<Milestone>>;
}

declare class GoaliesStatsEndpoints {
    private http;
    constructor(http: HttpClient);
    private buildParams;
    getByReport(reportType: string, query?: StatsQueryParams): Promise<StatsApiResponse<StatsGoalie>>;
    getLeaders(reportType: string, query?: StatsQueryParams): Promise<StatsApiResponse<StatsGoalie>>;
    getMilestones(query?: StatsQueryParams): Promise<StatsApiResponse<Milestone>>;
}

declare class TeamsStatsEndpoints {
    private http;
    constructor(http: HttpClient);
    private buildParams;
    getByReport(reportType: string, query?: StatsQueryParams): Promise<StatsApiResponse<StatsTeam>>;
    getFranchises(query?: StatsQueryParams): Promise<StatsApiResponse<Franchise>>;
    getAll(): Promise<StatsApiResponse<StatsTeam>>;
    getById(teamId: number): Promise<StatsApiResponse<StatsTeam>>;
}

declare class DraftStatsEndpoints {
    private http;
    constructor(http: HttpClient);
    get(query?: StatsQueryParams): Promise<StatsApiResponse<Record<string, unknown>>>;
}

declare class GamesStatsEndpoints {
    private http;
    constructor(http: HttpClient);
    get(query?: StatsQueryParams): Promise<StatsApiResponse<StatsGame>>;
    getMeta(): Promise<unknown>;
    getShiftCharts(gameId: number): Promise<ShiftChart[]>;
}

declare class SeasonsStatsEndpoints {
    private http;
    constructor(http: HttpClient);
    get(): Promise<StatsApiResponse<Season>>;
    getComponentSeason(): Promise<unknown>;
}

declare class MiscStatsEndpoints {
    private http;
    constructor(http: HttpClient);
    getConfig(): Promise<StatsConfig>;
    ping(): Promise<unknown>;
    getCountries(): Promise<StatsApiResponse<Country>>;
    getGlossary(): Promise<StatsApiResponse<GlossaryEntry>>;
    getContent(path: string): Promise<unknown>;
}

interface StatsApiClientConfig {
    language?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
declare class StatsApiClient {
    private http;
    private language;
    readonly skaters: SkatersStatsEndpoints;
    readonly goalies: GoaliesStatsEndpoints;
    readonly teams: TeamsStatsEndpoints;
    readonly draft: DraftStatsEndpoints;
    readonly games: GamesStatsEndpoints;
    readonly seasons: SeasonsStatsEndpoints;
    readonly misc: MiscStatsEndpoints;
    constructor(config?: StatsApiClientConfig);
    get httpClient(): HttpClient;
}

interface NHLClientConfig extends WebApiClientConfig {
    stats?: StatsApiClientConfig;
}
declare class NHLClient {
    readonly web: WebApiClient;
    readonly stats: StatsApiClient;
    readonly players: PlayersEndpoints;
    readonly standings: StandingsEndpoints;
    readonly scores: ScoresEndpoints;
    readonly teams: TeamsEndpoints;
    readonly schedule: ScheduleEndpoints;
    readonly games: GamesEndpoints;
    readonly leaders: LeadersEndpoints;
    readonly draft: DraftEndpoints;
    readonly playoffs: PlayoffsEndpoints;
    readonly network: NetworkEndpoints;
    readonly meta: MetaEndpoints;
    constructor(config?: NHLClientConfig);
}

declare class CayenneExpBuilder {
    private expressions;
    seasonId(season: string): this;
    gameTypeId(gameType: GameType | number): this;
    teamId(id: number): this;
    currentTeamId(id: number): this;
    franchiseId(id: number): this;
    position(code: string): this;
    gamesPlayed(op: string, value: number): this;
    gameId(id: number): this;
    gameDate(op: string, date: string): this;
    playerId(id: number): this;
    where(field: string, op: string, value: string | number): this;
    raw(expression: string): this;
    build(): string;
    reset(): this;
}

declare class NHLApiError extends Error {
    readonly statusCode: number;
    readonly url: string;
    constructor(message: string, statusCode: number, url: string);
}
declare class NHLNotFoundError extends NHLApiError {
    constructor(url: string);
}
declare class NHLRateLimitError extends NHLApiError {
    readonly retryAfter: number | null;
    constructor(url: string, retryAfter?: number | null);
}

export { type Award, type AwardSeason, type Boxscore, type BoxscoreDetails, type BoxscoreTeam, type CareerTotals, CayenneExpBuilder, type Country, type DraftCategory, type DraftDetails, type DraftPick, type DraftPicksResponse, type DraftProspect, type DraftRankingsResponse, type DraftRound, type EdgeGoalieStat, type EdgeResponse, type EdgeSeasonParams, type EdgeSkaterStat, type EdgeTeamStat, type FeaturedStats, type Franchise, type GameClock, type GameLanding, type GameLandingTeam, type GameLogEntry, type GameOutcome, type GameReports, type GameRightRail, type GameStory, type GameSummary, GameType, type GameVideo, type GameWeek, type GamesByDate, type GamesByDateEntry, type GlossaryEntry, type GoalieGameStat, GoalieReportType, HttpClient, type HttpClientConfig, type Leader, type LeaderCategory, type LeadersResponse, type Linescore, type LocalizedName, type Milestone, NHLApiError, NHLClient, type NHLClientConfig, NHLNotFoundError, NHLRateLimitError, type OddsEntry, type OddsPartner, type PaginationParams, type PenaltyEvent, type PenaltyPeriod, type PeriodDescriptor, type PeriodScore, type Play, type PlayByPlay, type PlayerByGameStats, type PlayerGameLog, type PlayerGameStat, type PlayerInfo, type PlayerLanding, type PlayerRef, type PlayerSpotlight, type PlayoffBracket, type PlayoffBracketRound, type PlayoffBracketSeries, type PlayoffGame, type PlayoffGameTeam, type PlayoffRound, type PlayoffSeries, type PlayoffSeriesCarousel, type PlayoffSeriesSchedule, type PlayoffTeam, type ProspectStats, type RequestOptions, type RosterEntry, type RosterPlayer, type RosterSpot, type ScheduleCalendar, type ScheduleGame, type ScheduleResponse, type ScheduleTeam, type ScoreGame, type ScoreTeam, type ScoreboardGame, type ScoresResponse, type ScoringAssist, type ScoringGoal, type ScoringPeriod, type Season, type SeasonId, type SeasonTotal, type ShiftChart, type ShootoutAttempt, type ShotsByPeriod, SkaterReportType, type SortField, type SortParams, type StandingEntry, type StandingsResponse, type StandingsSeason, type StandingsSeasonList, StatsApiClient, type StatsApiClientConfig, type StatsApiResponse, type StatsConfig, type StatsGame, type StatsGoalie, type StatsQueryParams, type StatsSkater, type StatsSummary, type StatsTeam, type TeamGameStats, type TeamGameStatsComparison, type TeamGoalieStat, type TeamRef, TeamReportType, type TeamRoster, type TeamScheduleGame, type TeamScheduleResponse, type TeamScheduleTeamEntry, type TeamScoreboard, type TeamSeasonStats, type TeamSkaterStat, type ThreeStar, type TvBroadcast, WebApiClient, type WebApiClientConfig };
