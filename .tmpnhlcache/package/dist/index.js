"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CayenneExpBuilder: () => CayenneExpBuilder,
  GameType: () => GameType,
  GoalieReportType: () => GoalieReportType,
  HttpClient: () => HttpClient,
  NHLApiError: () => NHLApiError,
  NHLClient: () => NHLClient,
  NHLNotFoundError: () => NHLNotFoundError,
  NHLRateLimitError: () => NHLRateLimitError,
  SkaterReportType: () => SkaterReportType,
  StatsApiClient: () => StatsApiClient,
  TeamReportType: () => TeamReportType,
  WebApiClient: () => WebApiClient
});
module.exports = __toCommonJS(index_exports);

// src/http/http-client.ts
var import_axios = __toESM(require("axios"));

// src/http/errors.ts
var NHLApiError = class extends Error {
  constructor(message, statusCode, url) {
    super(message);
    this.name = "NHLApiError";
    this.statusCode = statusCode;
    this.url = url;
  }
};
var NHLNotFoundError = class extends NHLApiError {
  constructor(url) {
    super(`Resource not found: ${url}`, 404, url);
    this.name = "NHLNotFoundError";
  }
};
var NHLRateLimitError = class extends NHLApiError {
  constructor(url, retryAfter = null) {
    super(`Rate limit exceeded: ${url}`, 429, url);
    this.name = "NHLRateLimitError";
    this.retryAfter = retryAfter;
  }
};

// src/http/http-client.ts
var DEFAULT_TIMEOUT = 1e4;
var DEFAULT_RETRIES = 3;
var DEFAULT_RETRY_DELAY = 1e3;
var HttpClient = class {
  constructor(config) {
    this.retries = config.retries ?? DEFAULT_RETRIES;
    this.retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY;
    this.client = import_axios.default.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT
    });
  }
  async get(path, options) {
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.client.get(path, {
          params: options?.params,
          headers: options?.headers
        });
        return response.data;
      } catch (error) {
        lastError = this.transformError(error, path);
        if (lastError instanceof NHLNotFoundError) {
          throw lastError;
        }
        if (lastError instanceof NHLRateLimitError) {
          const delay = lastError.retryAfter ? lastError.retryAfter * 1e3 : this.retryDelay * Math.pow(2, attempt);
          if (attempt < this.retries) {
            await this.sleep(delay);
            continue;
          }
          throw lastError;
        }
        if (attempt < this.retries) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }
    throw lastError ?? new Error("Request failed");
  }
  transformError(error, path) {
    if (import_axios.default.isAxiosError(error)) {
      const axiosError = error;
      const status = axiosError.response?.status ?? 0;
      const url = axiosError.config?.url ?? path;
      if (status === 404) {
        return new NHLNotFoundError(url);
      }
      if (status === 429) {
        const retryAfter = axiosError.response?.headers?.["retry-after"];
        return new NHLRateLimitError(
          url,
          retryAfter ? parseInt(retryAfter, 10) : null
        );
      }
      return new NHLApiError(
        axiosError.message || `Request failed with status ${status}`,
        status,
        url
      );
    }
    if (error instanceof Error) {
      return new NHLApiError(error.message, 0, path);
    }
    return new NHLApiError("An unknown error occurred", 0, path);
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/web/players.ts
var PlayersEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getLanding(playerId) {
    return this.http.get(`/player/${playerId}/landing`);
  }
  async getGameLog(playerId, season, gameType) {
    return this.http.get(`/player/${playerId}/game-log/${season}/${gameType}`);
  }
  async getGameLogNow(playerId) {
    return this.http.get(`/player/${playerId}/game-log/now`);
  }
  async getSpotlight() {
    return this.http.get("/player-spotlight");
  }
};

// src/web/standings.ts
var StandingsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async get(date) {
    const path = date ? `/standings/${date}` : "/standings/now";
    return this.http.get(path);
  }
  async getSeasonList() {
    return this.http.get("/standings-season");
  }
};

// src/web/scores.ts
var ScoresEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async get(date) {
    const path = date ? `/score/${date}` : "/score/now";
    return this.http.get(path);
  }
  async getScoreboard(date) {
    const path = date ? `/scoreboard/${date}` : "/scoreboard/now";
    return this.http.get(path);
  }
  async getTeamScoreboard(teamAbbrev) {
    return this.http.get(`/scoreboard/${teamAbbrev}/now`);
  }
};

// src/web/teams.ts
var TeamsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getRoster(teamAbbrev, season) {
    const path = season ? `/roster/${teamAbbrev}/${season}` : `/roster/${teamAbbrev}/current`;
    return this.http.get(path);
  }
  async getRosterSeason(teamAbbrev) {
    return this.http.get(`/roster-season/${teamAbbrev}`);
  }
  async getStats(teamAbbrev, season, gameType) {
    if (season && gameType !== void 0) {
      return this.http.get(`/club-stats/${teamAbbrev}/${season}/${gameType}`);
    }
    return this.http.get(`/club-stats/${teamAbbrev}/now`);
  }
  async getStatsSeasonList(teamAbbrev) {
    return this.http.get(`/club-stats-season/${teamAbbrev}`);
  }
  async getSchedule(teamAbbrev, month) {
    const path = month ? `/club-schedule/${teamAbbrev}/month/${month}` : `/club-schedule/${teamAbbrev}/month/now`;
    return this.http.get(path);
  }
  async getScheduleByWeek(teamAbbrev, date) {
    const path = date ? `/club-schedule/${teamAbbrev}/week/${date}` : `/club-schedule/${teamAbbrev}/week/now`;
    return this.http.get(path);
  }
  async getScheduleSeason(teamAbbrev, season) {
    if (season) {
      return this.http.get(`/club-schedule-season/${teamAbbrev}/${season}`);
    }
    return this.http.get(`/club-schedule-season/${teamAbbrev}/now`);
  }
  async getProspects(teamAbbrev) {
    return this.http.get(`/prospects/${teamAbbrev}`);
  }
  async getScoreboard(teamAbbrev) {
    return this.http.get(`/scoreboard/${teamAbbrev}/now`);
  }
  async getSeasonList() {
    return this.http.get("/season");
  }
  async getLogo(teamAbbrev) {
    return this.http.get(`/team/${teamAbbrev}/logo`);
  }
};

// src/web/schedule.ts
var ScheduleEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async get(date) {
    const path = date ? `/schedule/${date}` : "/schedule/now";
    return this.http.get(path);
  }
  async getCalendar(date) {
    const path = date ? `/schedule-calendar/${date}` : "/schedule-calendar/now";
    return this.http.get(path);
  }
  async getByTeam(teamAbbrev, date) {
    const path = date ? `/schedule/${teamAbbrev}/${date}` : `/schedule/${teamAbbrev}/now`;
    return this.http.get(path);
  }
  async getSeasonSchedule(season) {
    return this.http.get(`/schedule/${season}`);
  }
};

// src/web/games.ts
var GamesEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getPlayByPlay(gameId) {
    return this.http.get(`/gamecenter/${gameId}/play-by-play`);
  }
  async getBoxscore(gameId) {
    return this.http.get(`/gamecenter/${gameId}/boxscore`);
  }
  async getLanding(gameId) {
    return this.http.get(`/gamecenter/${gameId}/landing`);
  }
  async getStory(gameId) {
    return this.http.get(`/wsc/game-story/${gameId}`);
  }
  async getRightRail(gameId) {
    return this.http.get(`/gamecenter/${gameId}/right-rail`);
  }
  async getReplay(gameId) {
    return this.http.get(`/gamecenter/${gameId}/recap`);
  }
  async getWscPlayByPlay(gameId) {
    return this.http.get(`/wsc/game-play-by-play/${gameId}`);
  }
};

// src/web/leaders.ts
var LeadersEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getSkatersCurrent(categories) {
    const params = categories ? { categories } : void 0;
    return this.http.get("/skater-stats-leaders/current", { params });
  }
  async getSkaters(season, gameType, categories) {
    const params = categories ? { categories } : void 0;
    return this.http.get(`/skater-stats-leaders/${season}/${gameType}`, { params });
  }
  async getGoaliesCurrent(categories) {
    const params = categories ? { categories } : void 0;
    return this.http.get("/goalie-stats-leaders/current", { params });
  }
  async getGoalies(season, gameType, categories) {
    const params = categories ? { categories } : void 0;
    return this.http.get(`/goalie-stats-leaders/${season}/${gameType}`, { params });
  }
};

// src/web/draft.ts
var DraftEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getRankingsNow() {
    return this.http.get("/draft/rankings/now");
  }
  async getRankings(season, prospectCategory) {
    const params = prospectCategory ? { prospectCategory } : void 0;
    return this.http.get(`/draft/rankings/${season}`, { params });
  }
  async getPicksNow() {
    return this.http.get("/draft/picks/now");
  }
  async getPicks(season, round) {
    if (round !== void 0) {
      return this.http.get(`/draft/picks/${season}/round/${round}`);
    }
    return this.http.get(`/draft/picks/${season}`);
  }
};

// src/web/playoffs.ts
var PlayoffsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getSeriesCarousel(season) {
    const path = season ? `/playoff-series/carousel/${season}` : "/playoff-series/carousel/now";
    return this.http.get(path);
  }
  async getSeriesSchedule(season, seriesLetter) {
    return this.http.get(`/playoff-series/schedule/${season}/${seriesLetter}`);
  }
  async getBracket(season) {
    const path = season ? `/playoff-bracket/${season}` : "/playoff-bracket/now";
    return this.http.get(path);
  }
};

// src/web/network.ts
var NetworkEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getTvSchedule(date) {
    const path = date ? `/network/tv-schedule/${date}` : "/network/tv-schedule/now";
    return this.http.get(path);
  }
  async getWhereToWatch() {
    return this.http.get("/where-to-watch");
  }
  async getPartnerGames(countryCode, date) {
    const params = { country: countryCode };
    if (date) params.date = date;
    return this.http.get("/partner-game/now", { params });
  }
};

// src/web/meta.ts
var MetaEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async get() {
    return this.http.get("/meta");
  }
  async getGame(gameId) {
    return this.http.get(`/meta/game/${gameId}`);
  }
  async getLocation() {
    return this.http.get("/location");
  }
  async getSeason() {
    return this.http.get("/season");
  }
  async getPlayoffSeriesMeta() {
    return this.http.get("/meta/playoff-series");
  }
};

// src/web/edge/edge-teams.ts
var EdgeTeamsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  buildParams(params) {
    if (!params) return void 0;
    const result = {};
    if (params.season) result.season = params.season;
    if (params.gameType !== void 0) result.gameType = params.gameType;
    if (params.limit !== void 0) result.limit = params.limit;
    if (params.start !== void 0) result.start = params.start;
    return Object.keys(result).length > 0 ? result : void 0;
  }
  async getRealTimeStats(params) {
    return this.http.get("/edge/team/stats/real-time", { params: this.buildParams(params) });
  }
  async getDistance(params) {
    return this.http.get("/edge/team/stats/distance", { params: this.buildParams(params) });
  }
  async getSpeed(params) {
    return this.http.get("/edge/team/stats/speed", { params: this.buildParams(params) });
  }
  async getSpeedBursts(params) {
    return this.http.get("/edge/team/stats/speed-bursts", { params: this.buildParams(params) });
  }
  async getZoneTime(params) {
    return this.http.get("/edge/team/stats/zone-time", { params: this.buildParams(params) });
  }
  async getShotSpeed(params) {
    return this.http.get("/edge/team/stats/shot-speed", { params: this.buildParams(params) });
  }
  async getShotLocation(params) {
    return this.http.get("/edge/team/stats/shot-location", { params: this.buildParams(params) });
  }
  async getTimeBetweenShots(params) {
    return this.http.get("/edge/team/stats/time-between-shots", { params: this.buildParams(params) });
  }
  async getPossessionTime(params) {
    return this.http.get("/edge/team/stats/possession-time", { params: this.buildParams(params) });
  }
  async getPenaltyKill(params) {
    return this.http.get("/edge/team/stats/penalty-kill", { params: this.buildParams(params) });
  }
  async getPowerPlay(params) {
    return this.http.get("/edge/team/stats/power-play", { params: this.buildParams(params) });
  }
  async getFaceoffs(params) {
    return this.http.get("/edge/team/stats/faceoffs", { params: this.buildParams(params) });
  }
  async getOverview(params) {
    return this.http.get("/edge/team/stats/overview", { params: this.buildParams(params) });
  }
};

// src/web/edge/edge-skaters.ts
var EdgeSkatersEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  buildParams(params) {
    if (!params) return void 0;
    const result = {};
    if (params.season) result.season = params.season;
    if (params.gameType !== void 0) result.gameType = params.gameType;
    if (params.position) result.position = params.position;
    if (params.team) result.team = params.team;
    if (params.limit !== void 0) result.limit = params.limit;
    if (params.start !== void 0) result.start = params.start;
    return Object.keys(result).length > 0 ? result : void 0;
  }
  async getRealTimeStats(params) {
    return this.http.get("/edge/skater/stats/real-time", { params: this.buildParams(params) });
  }
  async getDistance(params) {
    return this.http.get("/edge/skater/stats/distance", { params: this.buildParams(params) });
  }
  async getSpeed(params) {
    return this.http.get("/edge/skater/stats/speed", { params: this.buildParams(params) });
  }
  async getSpeedBursts(params) {
    return this.http.get("/edge/skater/stats/speed-bursts", { params: this.buildParams(params) });
  }
  async getZoneTime(params) {
    return this.http.get("/edge/skater/stats/zone-time", { params: this.buildParams(params) });
  }
  async getShotSpeed(params) {
    return this.http.get("/edge/skater/stats/shot-speed", { params: this.buildParams(params) });
  }
  async getShotLocation(params) {
    return this.http.get("/edge/skater/stats/shot-location", { params: this.buildParams(params) });
  }
  async getTimeBetweenShots(params) {
    return this.http.get("/edge/skater/stats/time-between-shots", { params: this.buildParams(params) });
  }
  async getPossessionTime(params) {
    return this.http.get("/edge/skater/stats/possession-time", { params: this.buildParams(params) });
  }
  async getPenaltyKill(params) {
    return this.http.get("/edge/skater/stats/penalty-kill", { params: this.buildParams(params) });
  }
  async getPowerPlay(params) {
    return this.http.get("/edge/skater/stats/power-play", { params: this.buildParams(params) });
  }
  async getFaceoffs(params) {
    return this.http.get("/edge/skater/stats/faceoffs", { params: this.buildParams(params) });
  }
  async getOverview(params) {
    return this.http.get("/edge/skater/stats/overview", { params: this.buildParams(params) });
  }
  async getRealtimeLeaders(params) {
    return this.http.get("/edge/skater/stats/leaders/real-time", { params: this.buildParams(params) });
  }
  async getSpeedLeaders(params) {
    return this.http.get("/edge/skater/stats/leaders/speed", { params: this.buildParams(params) });
  }
};

// src/web/edge/edge-goalies.ts
var EdgeGoaliesEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  buildParams(params) {
    if (!params) return void 0;
    const result = {};
    if (params.season) result.season = params.season;
    if (params.gameType !== void 0) result.gameType = params.gameType;
    if (params.team) result.team = params.team;
    if (params.limit !== void 0) result.limit = params.limit;
    if (params.start !== void 0) result.start = params.start;
    return Object.keys(result).length > 0 ? result : void 0;
  }
  async getRealTimeStats(params) {
    return this.http.get("/edge/goalie/stats/real-time", { params: this.buildParams(params) });
  }
  async getSaveTracking(params) {
    return this.http.get("/edge/goalie/stats/save-tracking", { params: this.buildParams(params) });
  }
  async getShotSpeed(params) {
    return this.http.get("/edge/goalie/stats/shot-speed", { params: this.buildParams(params) });
  }
  async getShotLocation(params) {
    return this.http.get("/edge/goalie/stats/shot-location", { params: this.buildParams(params) });
  }
  async getShotType(params) {
    return this.http.get("/edge/goalie/stats/shot-type", { params: this.buildParams(params) });
  }
  async getZoneTime(params) {
    return this.http.get("/edge/goalie/stats/zone-time", { params: this.buildParams(params) });
  }
  async getPenaltyKill(params) {
    return this.http.get("/edge/goalie/stats/penalty-kill", { params: this.buildParams(params) });
  }
  async getStartVsRelief(params) {
    return this.http.get("/edge/goalie/stats/start-vs-relief", { params: this.buildParams(params) });
  }
  async getDaysRest(params) {
    return this.http.get("/edge/goalie/stats/days-rest", { params: this.buildParams(params) });
  }
  async getOverview(params) {
    return this.http.get("/edge/goalie/stats/overview", { params: this.buildParams(params) });
  }
  async getLeaders(params) {
    return this.http.get("/edge/goalie/stats/leaders", { params: this.buildParams(params) });
  }
};

// src/web/web-client.ts
var WEB_API_BASE = "https://api-web.nhle.com/v1";
var WebApiClient = class {
  constructor(config) {
    this.http = new HttpClient({
      baseURL: WEB_API_BASE,
      timeout: config?.timeout,
      retries: config?.retries,
      retryDelay: config?.retryDelay
    });
    this.players = new PlayersEndpoints(this.http);
    this.standings = new StandingsEndpoints(this.http);
    this.scores = new ScoresEndpoints(this.http);
    this.teams = new TeamsEndpoints(this.http);
    this.schedule = new ScheduleEndpoints(this.http);
    this.games = new GamesEndpoints(this.http);
    this.leaders = new LeadersEndpoints(this.http);
    this.draft = new DraftEndpoints(this.http);
    this.playoffs = new PlayoffsEndpoints(this.http);
    this.network = new NetworkEndpoints(this.http);
    this.meta = new MetaEndpoints(this.http);
    this.edge = {
      teams: new EdgeTeamsEndpoints(this.http),
      skaters: new EdgeSkatersEndpoints(this.http),
      goalies: new EdgeGoaliesEndpoints(this.http)
    };
  }
  get httpClient() {
    return this.http;
  }
};

// src/stats/skaters.ts
var SkatersStatsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  buildParams(query) {
    if (!query) return void 0;
    const params = {};
    if (query.cayenneExp) params.cayenneExp = query.cayenneExp;
    if (query.factCayenneExp) params.factCayenneExp = query.factCayenneExp;
    if (query.sort) {
      params.sort = Array.isArray(query.sort) ? JSON.stringify(query.sort) : query.sort;
    }
    if (query.dir) params.dir = query.dir;
    if (query.start !== void 0) params.start = query.start;
    if (query.limit !== void 0) params.limit = query.limit;
    if (query.isAggregate !== void 0) params.isAggregate = query.isAggregate;
    if (query.isGame !== void 0) params.isGame = query.isGame;
    return Object.keys(params).length > 0 ? params : void 0;
  }
  async getByReport(reportType, query) {
    return this.http.get(`/skater/${reportType}`, {
      params: this.buildParams(query)
    });
  }
  async getLeaders(reportType, query) {
    return this.http.get(`/leaders/skaters/${reportType}`, {
      params: this.buildParams(query)
    });
  }
  async getMilestones(query) {
    return this.http.get("/milestones/skaters", {
      params: this.buildParams(query)
    });
  }
};

// src/stats/goalies.ts
var GoaliesStatsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  buildParams(query) {
    if (!query) return void 0;
    const params = {};
    if (query.cayenneExp) params.cayenneExp = query.cayenneExp;
    if (query.factCayenneExp) params.factCayenneExp = query.factCayenneExp;
    if (query.sort) {
      params.sort = Array.isArray(query.sort) ? JSON.stringify(query.sort) : query.sort;
    }
    if (query.dir) params.dir = query.dir;
    if (query.start !== void 0) params.start = query.start;
    if (query.limit !== void 0) params.limit = query.limit;
    if (query.isAggregate !== void 0) params.isAggregate = query.isAggregate;
    if (query.isGame !== void 0) params.isGame = query.isGame;
    return Object.keys(params).length > 0 ? params : void 0;
  }
  async getByReport(reportType, query) {
    return this.http.get(`/goalie/${reportType}`, {
      params: this.buildParams(query)
    });
  }
  async getLeaders(reportType, query) {
    return this.http.get(`/leaders/goalies/${reportType}`, {
      params: this.buildParams(query)
    });
  }
  async getMilestones(query) {
    return this.http.get("/milestones/goalies", {
      params: this.buildParams(query)
    });
  }
};

// src/stats/teams.ts
var TeamsStatsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  buildParams(query) {
    if (!query) return void 0;
    const params = {};
    if (query.cayenneExp) params.cayenneExp = query.cayenneExp;
    if (query.factCayenneExp) params.factCayenneExp = query.factCayenneExp;
    if (query.sort) {
      params.sort = Array.isArray(query.sort) ? JSON.stringify(query.sort) : query.sort;
    }
    if (query.dir) params.dir = query.dir;
    if (query.start !== void 0) params.start = query.start;
    if (query.limit !== void 0) params.limit = query.limit;
    if (query.isAggregate !== void 0) params.isAggregate = query.isAggregate;
    if (query.isGame !== void 0) params.isGame = query.isGame;
    return Object.keys(params).length > 0 ? params : void 0;
  }
  async getByReport(reportType, query) {
    return this.http.get(`/team/${reportType}`, {
      params: this.buildParams(query)
    });
  }
  async getFranchises(query) {
    return this.http.get("/franchise", {
      params: this.buildParams(query)
    });
  }
  async getAll() {
    return this.http.get("/team");
  }
  async getById(teamId) {
    return this.http.get("/team", {
      params: { cayenneExp: `teamId=${teamId}` }
    });
  }
};

// src/stats/draft.ts
var DraftStatsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async get(query) {
    const params = {};
    if (query?.cayenneExp) params.cayenneExp = query.cayenneExp;
    if (query?.sort) {
      params.sort = Array.isArray(query.sort) ? JSON.stringify(query.sort) : query.sort;
    }
    if (query?.dir) params.dir = query.dir;
    if (query?.start !== void 0) params.start = query.start;
    if (query?.limit !== void 0) params.limit = query.limit;
    return this.http.get("/draft", {
      params: Object.keys(params).length > 0 ? params : void 0
    });
  }
};

// src/stats/games.ts
var GamesStatsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async get(query) {
    const params = {};
    if (query?.cayenneExp) params.cayenneExp = query.cayenneExp;
    if (query?.sort) {
      params.sort = Array.isArray(query.sort) ? JSON.stringify(query.sort) : query.sort;
    }
    if (query?.start !== void 0) params.start = query.start;
    if (query?.limit !== void 0) params.limit = query.limit;
    return this.http.get("/game", {
      params: Object.keys(params).length > 0 ? params : void 0
    });
  }
  async getMeta() {
    return this.http.get("/game/meta");
  }
  async getShiftCharts(gameId) {
    return this.http.get("/shiftcharts", {
      params: { cayenneExp: `gameId=${gameId}` }
    });
  }
};

// src/stats/seasons.ts
var SeasonsStatsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async get() {
    return this.http.get("/season");
  }
  async getComponentSeason() {
    return this.http.get("/componentSeason");
  }
};

// src/stats/misc.ts
var MiscStatsEndpoints = class {
  constructor(http) {
    this.http = http;
  }
  async getConfig() {
    return this.http.get("/config");
  }
  async ping() {
    return this.http.get("/ping");
  }
  async getCountries() {
    return this.http.get("/country");
  }
  async getGlossary() {
    return this.http.get("/glossary");
  }
  async getContent(path) {
    return this.http.get(`/content/${path}`);
  }
};

// src/stats/stats-client.ts
var STATS_API_BASE = "https://api.nhle.com/stats/rest";
var StatsApiClient = class {
  constructor(config) {
    this.language = config?.language ?? "en";
    this.http = new HttpClient({
      baseURL: `${STATS_API_BASE}/${this.language}`,
      timeout: config?.timeout,
      retries: config?.retries,
      retryDelay: config?.retryDelay
    });
    this.skaters = new SkatersStatsEndpoints(this.http);
    this.goalies = new GoaliesStatsEndpoints(this.http);
    this.teams = new TeamsStatsEndpoints(this.http);
    this.draft = new DraftStatsEndpoints(this.http);
    this.games = new GamesStatsEndpoints(this.http);
    this.seasons = new SeasonsStatsEndpoints(this.http);
    this.misc = new MiscStatsEndpoints(this.http);
  }
  get httpClient() {
    return this.http;
  }
};

// src/client.ts
var NHLClient = class {
  constructor(config) {
    this.web = new WebApiClient(config);
    this.stats = new StatsApiClient(config?.stats);
    this.players = this.web.players;
    this.standings = this.web.standings;
    this.scores = this.web.scores;
    this.teams = this.web.teams;
    this.schedule = this.web.schedule;
    this.games = this.web.games;
    this.leaders = this.web.leaders;
    this.draft = this.web.draft;
    this.playoffs = this.web.playoffs;
    this.network = this.web.network;
    this.meta = this.web.meta;
  }
};

// src/stats/cayenne-builder.ts
var CayenneExpBuilder = class {
  constructor() {
    this.expressions = [];
  }
  seasonId(season) {
    this.expressions.push(`seasonId=${season}`);
    return this;
  }
  gameTypeId(gameType) {
    this.expressions.push(`gameTypeId=${gameType}`);
    return this;
  }
  teamId(id) {
    this.expressions.push(`teamId=${id}`);
    return this;
  }
  currentTeamId(id) {
    this.expressions.push(`currentTeamId=${id}`);
    return this;
  }
  franchiseId(id) {
    this.expressions.push(`franchiseId=${id}`);
    return this;
  }
  position(code) {
    this.expressions.push(`positionCode="${code}"`);
    return this;
  }
  gamesPlayed(op, value) {
    this.expressions.push(`gamesPlayed${op}${value}`);
    return this;
  }
  gameId(id) {
    this.expressions.push(`gameId=${id}`);
    return this;
  }
  gameDate(op, date) {
    this.expressions.push(`gameDate${op}"${date}"`);
    return this;
  }
  playerId(id) {
    this.expressions.push(`playerId=${id}`);
    return this;
  }
  where(field, op, value) {
    if (typeof value === "string") {
      this.expressions.push(`${field}${op}"${value}"`);
    } else {
      this.expressions.push(`${field}${op}${value}`);
    }
    return this;
  }
  raw(expression) {
    this.expressions.push(expression);
    return this;
  }
  build() {
    return this.expressions.join(" and ");
  }
  reset() {
    this.expressions = [];
    return this;
  }
};

// src/types/common.ts
var GameType = /* @__PURE__ */ ((GameType2) => {
  GameType2[GameType2["Preseason"] = 1] = "Preseason";
  GameType2[GameType2["RegularSeason"] = 2] = "RegularSeason";
  GameType2[GameType2["Playoffs"] = 3] = "Playoffs";
  GameType2[GameType2["AllStar"] = 4] = "AllStar";
  return GameType2;
})(GameType || {});

// src/types/stats-api.ts
var SkaterReportType = /* @__PURE__ */ ((SkaterReportType2) => {
  SkaterReportType2["Summary"] = "summary";
  SkaterReportType2["Bios"] = "bios";
  SkaterReportType2["FaceoffPercentages"] = "faceoffpercentages";
  SkaterReportType2["FaceoffWinsLosses"] = "faceoffwinslosses";
  SkaterReportType2["GoalsForAgainst"] = "goalsforagainst";
  SkaterReportType2["RealTime"] = "realtime";
  SkaterReportType2["Penalties"] = "penalties";
  SkaterReportType2["PenaltyKill"] = "penaltykill";
  SkaterReportType2["PenaltyShots"] = "penaltyshots";
  SkaterReportType2["PowerPlay"] = "powerplay";
  SkaterReportType2["PuckPossessions"] = "puckpossessions";
  SkaterReportType2["SatCounts"] = "summaryshooting";
  SkaterReportType2["SatPercentages"] = "percentages";
  SkaterReportType2["ScoringShotType"] = "scoringRates";
  SkaterReportType2["ShootOut"] = "shootout";
  SkaterReportType2["ShotType"] = "shottype";
  SkaterReportType2["TimeOnIce"] = "timeonice";
  return SkaterReportType2;
})(SkaterReportType || {});
var GoalieReportType = /* @__PURE__ */ ((GoalieReportType2) => {
  GoalieReportType2["Summary"] = "summary";
  GoalieReportType2["Advanced"] = "advanced";
  GoalieReportType2["Bios"] = "bios";
  GoalieReportType2["DaysRest"] = "daysrest";
  GoalieReportType2["PenaltyShots"] = "penaltyshots";
  GoalieReportType2["SavesByStrength"] = "savesByStrength";
  GoalieReportType2["ShootOut"] = "shootout";
  GoalieReportType2["StartedVsRelieved"] = "startedVsRelieved";
  return GoalieReportType2;
})(GoalieReportType || {});
var TeamReportType = /* @__PURE__ */ ((TeamReportType2) => {
  TeamReportType2["Summary"] = "summary";
  TeamReportType2["Penalties"] = "penalties";
  TeamReportType2["PenaltyKill"] = "penaltykill";
  TeamReportType2["PenaltyKillTime"] = "penaltykilltime";
  TeamReportType2["PowerPlay"] = "powerplay";
  TeamReportType2["PowerPlayTime"] = "powerplaytime";
  TeamReportType2["GoalsByGameSituation"] = "summaryshooting";
  TeamReportType2["FaceoffPercentages"] = "faceoffpercentages";
  TeamReportType2["DaysRest"] = "daysrest";
  TeamReportType2["OutshootOutshot"] = "outshootoutshot";
  TeamReportType2["RealTime"] = "realtime";
  TeamReportType2["ShootOut"] = "shootout";
  TeamReportType2["Scoring"] = "scoring";
  TeamReportType2["ShotType"] = "shottype";
  return TeamReportType2;
})(TeamReportType || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CayenneExpBuilder,
  GameType,
  GoalieReportType,
  HttpClient,
  NHLApiError,
  NHLClient,
  NHLNotFoundError,
  NHLRateLimitError,
  SkaterReportType,
  StatsApiClient,
  TeamReportType,
  WebApiClient
});
//# sourceMappingURL=index.js.map