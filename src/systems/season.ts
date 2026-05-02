export const SEASON_STORAGE_KEY = "synapse_storm_season_v1";
export const LEADERBOARD_STORAGE_KEY = "nunchaku_overdrive_scores_v1";
export const FEEDBACK_STORAGE_KEY = "synapse_storm_feedback_v1";

const SEASON_LENGTH_MS = 14 * 24 * 60 * 60 * 1000;
const SEASON_EPOCH_UTC = Date.UTC(2026, 0, 5, 0, 0, 0);
const MAX_SEASONS_TO_KEEP = 12;
const MAX_LEADERBOARD_PER_SEASON = 20;
const MAX_FEEDBACK_ROWS = 240;

export interface SeasonState {
  id: string;
  index: number;
  startAt: number;
  endAt: number;
  now: number;
  daysLeft: number;
}

export interface LeaderboardProfile {
  name: string;
  sns: string;
  comment: string;
}

export interface LeaderboardEntry {
  id: string;
  score: number;
  at: number;
  seasonId: string;
  season_id: string;
  seasonStartAt: number;
  seasonEndAt: number;
  profile: LeaderboardProfile;
  name?: string;
  sns?: string;
  comment?: string;
  [key: string]: unknown;
}

export interface FeedbackEntry {
  id: string;
  seasonId: string;
  season_id: string;
  at: number;
  text: string;
}

export interface SeasonPersonalBest {
  storage_key: string;
  season_id: string;
  score: number;
  entry_id: string | null;
  at: number | null;
  rank: number | null;
  profile: LeaderboardProfile;
  has_profile: boolean;
}

export interface SeasonReviewExport {
  generated_at: string;
  storage_keys: {
    season: string;
    leaderboard: string;
    feedback: string;
  };
  current_season: SeasonState;
  target_season_id: string;
  feedback: {
    count: number;
    rows: Array<{ id: string; at: string; text: string }>;
  };
  leaderboard: {
    count: number;
    personal_best: SeasonPersonalBest;
    rows: Array<{ rank: number; score: number; at: string; name: string; sns: string; comment: string }>;
  };
}

export function getCurrentSeason(now = Date.now()): SeasonState {
  const safeNow = Number.isFinite(now) ? now : Date.now();
  const index = Math.max(0, Math.floor((safeNow - SEASON_EPOCH_UTC) / SEASON_LENGTH_MS));
  const startAt = SEASON_EPOCH_UTC + index * SEASON_LENGTH_MS;
  const endAt = startAt + SEASON_LENGTH_MS;
  const state = {
    id: `S${String(index + 1).padStart(3, "0")}-${formatIdDate(startAt)}`,
    index,
    startAt,
    endAt,
    now: safeNow,
    daysLeft: Math.max(0, Math.ceil((endAt - safeNow) / (24 * 60 * 60 * 1000))),
  };
  persistSeason(state);
  return state;
}

export function formatSeasonRange(season = getCurrentSeason()): string {
  return `${formatShortDate(season.startAt)}-${formatShortDate(season.endAt - 1)}`;
}

export function saveLeaderboardEntry(score: number, payload: Record<string, unknown>): LeaderboardEntry | null {
  const season = getCurrentSeason();
  const rows = readLeaderboardRows();
  const entry = normalizeLeaderboardEntry({
    ...payload,
    id: createId("score"),
    score,
    at: Date.now(),
    seasonId: season.id,
    season_id: season.id,
    seasonStartAt: season.startAt,
    seasonEndAt: season.endAt,
    profile: emptyProfile(),
  });
  rows.push(entry);
  const saved = trimLeaderboardRows(rows, season.id);
  if (!writeJson(LEADERBOARD_STORAGE_KEY, saved)) return null;
  return readLeaderboardRows().some((row) => row.id === entry.id) ? entry : null;
}

export function getLeaderboardEntries(seasonId = getCurrentSeason().id): LeaderboardEntry[] {
  return readLeaderboardRows()
    .filter((row) => row.seasonId === seasonId)
    .sort(compareLeaderboardRows)
    .slice(0, MAX_LEADERBOARD_PER_SEASON);
}

export function getLeaderboardEntry(id: string): LeaderboardEntry | null {
  return readLeaderboardRows().find((row) => row.id === id) || null;
}

export function getLeaderboardRank(id: string): number | null {
  const entry = getLeaderboardEntry(id);
  if (!entry) return null;
  const index = getLeaderboardEntries(entry.seasonId).findIndex((row) => row.id === id);
  return index >= 0 ? index + 1 : null;
}

export function getSeasonPersonalBest(seasonId = getCurrentSeason().id): SeasonPersonalBest {
  const best = getLeaderboardEntries(seasonId)[0] || null;
  return {
    storage_key: LEADERBOARD_STORAGE_KEY,
    season_id: seasonId,
    score: best?.score || 0,
    entry_id: best?.id || null,
    at: best?.at || null,
    rank: best ? 1 : null,
    profile: best?.profile || emptyProfile(),
    has_profile: hasLeaderboardProfile(best),
  };
}

export function updateLeaderboardEntryProfile(id: string, profile: Partial<LeaderboardProfile>): LeaderboardEntry | null {
  const rows = readLeaderboardRows();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return null;
  const clean = normalizeProfile(profile);
  rows[index] = {
    ...rows[index],
    profile: clean,
    name: clean.name,
    sns: clean.sns,
    comment: clean.comment,
  };
  if (!writeJson(LEADERBOARD_STORAGE_KEY, rows)) return null;
  const saved = getLeaderboardEntry(id);
  return saved &&
    saved.profile.name === clean.name &&
    saved.profile.sns === clean.sns &&
    saved.profile.comment === clean.comment
    ? saved
    : null;
}

export function hasLeaderboardProfile(entry: LeaderboardEntry | null): boolean {
  if (!entry) return false;
  const profile = normalizeProfile(entry.profile || { name: entry.name, sns: entry.sns, comment: entry.comment });
  return Boolean(profile.name || profile.sns || profile.comment);
}

export function getLeaderboardSummary(seasonId = getCurrentSeason().id): Record<string, unknown> {
  const entries = getLeaderboardEntries(seasonId);
  const personalBest = getSeasonPersonalBest(seasonId);
  return {
    storage_key: LEADERBOARD_STORAGE_KEY,
    season_id: seasonId,
    count: entries.length,
    top_score: personalBest.score,
    personal_best_score: personalBest.score,
    personal_best_entry_id: personalBest.entry_id,
    personal_best_at: personalBest.at,
    personal_best: personalBest,
    profiles: entries.filter((entry) => hasLeaderboardProfile(entry)).length,
  };
}

export function saveSeasonFeedback(text: string): FeedbackEntry | null {
  const clean = cleanMultiline(text, 600);
  if (!clean) return null;
  const season = getCurrentSeason();
  const rows = readFeedbackRows();
  const entry = {
    id: createId("feedback"),
    seasonId: season.id,
    season_id: season.id,
    at: Date.now(),
    text: clean,
  };
  rows.push(entry);
  rows.sort((a, b) => b.at - a.at);
  if (!writeJson(FEEDBACK_STORAGE_KEY, rows.slice(0, MAX_FEEDBACK_ROWS))) return null;
  return readFeedbackRows().some((row) => row.id === entry.id && row.text === entry.text) ? entry : null;
}

export function getFeedbackEntries(seasonId = getCurrentSeason().id): FeedbackEntry[] {
  return readFeedbackRows()
    .filter((row) => row.seasonId === seasonId)
    .sort((a, b) => b.at - a.at);
}

export function getFeedbackSummary(seasonId = getCurrentSeason().id): Record<string, unknown> {
  const entries = getFeedbackEntries(seasonId);
  return {
    storage_key: FEEDBACK_STORAGE_KEY,
    season_id: seasonId,
    count: entries.length,
    latest_at: entries[0]?.at || null,
  };
}

export function buildSeasonReviewExport(seasonId = getCurrentSeason().id): SeasonReviewExport {
  const current = getCurrentSeason();
  const feedback = getFeedbackEntries(seasonId);
  const leaderboard = getLeaderboardEntries(seasonId);
  return {
    generated_at: new Date().toISOString(),
    storage_keys: {
      season: SEASON_STORAGE_KEY,
      leaderboard: LEADERBOARD_STORAGE_KEY,
      feedback: FEEDBACK_STORAGE_KEY,
    },
    current_season: current,
    target_season_id: seasonId,
    feedback: {
      count: feedback.length,
      rows: feedback.map((row) => ({
        id: row.id,
        at: new Date(row.at).toISOString(),
        text: row.text,
      })),
    },
    leaderboard: {
      count: leaderboard.length,
      personal_best: getSeasonPersonalBest(seasonId),
      rows: leaderboard.map((row, index) => ({
        rank: index + 1,
        score: row.score,
        at: new Date(row.at).toISOString(),
        name: row.profile.name,
        sns: row.profile.sns,
        comment: row.profile.comment,
      })),
    },
  };
}

export function normalizeProfile(profile: Partial<LeaderboardProfile> | Record<string, unknown> | undefined): LeaderboardProfile {
  return {
    name: cleanSingleLine(profile?.name, 24),
    sns: cleanSingleLine(profile?.sns, 40),
    comment: cleanSingleLine(profile?.comment, 80),
  };
}

function persistSeason(season: SeasonState): void {
  const previous = readJson<Record<string, unknown>>(SEASON_STORAGE_KEY, {});
  const previousId = typeof previous.current_id === "string" ? previous.current_id : "";
  writeJson(SEASON_STORAGE_KEY, {
    current_id: season.id,
    previous_id: previousId && previousId !== season.id ? previousId : previous.previous_id || "",
    index: season.index,
    start_at: season.startAt,
    end_at: season.endAt,
    seen_at: season.now,
    length_days: 14,
  });
}

function readLeaderboardRows(): LeaderboardEntry[] {
  const raw = readJson<unknown[]>(LEADERBOARD_STORAGE_KEY, []);
  return Array.isArray(raw) ? raw.map((row) => normalizeLeaderboardEntry((row || {}) as Record<string, unknown>)).filter((row) => row.score > 0) : [];
}

function normalizeLeaderboardEntry(raw: Record<string, unknown>): LeaderboardEntry {
  const season = getCurrentSeason();
  const seasonId = String(raw.seasonId || raw.season_id || "legacy");
  const profile = normalizeProfile(raw.profile && typeof raw.profile === "object" ? (raw.profile as Record<string, unknown>) : raw);
  return {
    ...raw,
    id: String(raw.id || createId("legacy")),
    score: Math.max(0, Math.round(Number(raw.score) || 0)),
    at: Math.max(0, Number(raw.at) || Date.now()),
    seasonId,
    season_id: seasonId,
    seasonStartAt: Number(raw.seasonStartAt) || (seasonId === season.id ? season.startAt : 0),
    seasonEndAt: Number(raw.seasonEndAt) || (seasonId === season.id ? season.endAt : 0),
    profile,
    name: profile.name,
    sns: profile.sns,
    comment: profile.comment,
  };
}

function trimLeaderboardRows(rows: LeaderboardEntry[], currentSeasonId: string): LeaderboardEntry[] {
  const seasonIds = [...new Set(rows.map((row) => row.seasonId))]
    .sort((a, b) => latestSeasonStart(rows, b) - latestSeasonStart(rows, a))
    .slice(0, MAX_SEASONS_TO_KEEP);
  if (!seasonIds.includes(currentSeasonId)) seasonIds.unshift(currentSeasonId);
  return seasonIds.flatMap((seasonId) => rows.filter((row) => row.seasonId === seasonId).sort(compareLeaderboardRows).slice(0, MAX_LEADERBOARD_PER_SEASON));
}

function latestSeasonStart(rows: LeaderboardEntry[], seasonId: string): number {
  return Math.max(...rows.filter((row) => row.seasonId === seasonId).map((row) => row.seasonStartAt || row.at || 0), 0);
}

function compareLeaderboardRows(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return b.score - a.score || a.at - b.at;
}

function readFeedbackRows(): FeedbackEntry[] {
  const raw = readJson<unknown[]>(FEEDBACK_STORAGE_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const source = row as Record<string, unknown>;
      const seasonId = String(source.seasonId || source.season_id || "legacy");
      return {
        id: String(source.id || createId("legacy_feedback")),
        seasonId,
        season_id: seasonId,
        at: Math.max(0, Number(source.at) || Date.now()),
        text: cleanMultiline(source.text, 600),
      };
    })
    .filter((row) => row.text);
}

function emptyProfile(): LeaderboardProfile {
  return { name: "", sns: "", comment: "" };
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return false;
    const serialized = JSON.stringify(value);
    storage.setItem(key, serialized);
    return storage.getItem(key) === serialized;
  } catch {
    // localStorage may be blocked in private browsing or embedded contexts.
    return false;
  }
}

function cleanSingleLine(value: unknown, max: number): string {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultiline(value: unknown, max: number): string {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function formatIdDate(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatShortDate(ms: number): string {
  const date = new Date(ms);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}
