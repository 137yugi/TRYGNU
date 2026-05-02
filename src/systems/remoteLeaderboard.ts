export interface RemoteLeaderboardProfile {
  name: string;
  sns: string;
  comment: string;
}

export interface RemoteLeaderboardEntry {
  id: string;
  score: number;
  at: number;
  seasonId: string;
  season_id: string;
  profile: RemoteLeaderboardProfile;
  name?: string;
  sns?: string;
  comment?: string;
  character?: string;
  build?: string;
  wave?: number;
  kills?: number;
  time?: number;
  rank?: number;
  [key: string]: unknown;
}

export interface RemoteLeaderboardSnapshot {
  enabled: boolean;
  endpoint: string;
  season_id: string;
  status: string;
  rows: RemoteLeaderboardEntry[];
  last_fetch_at: number | null;
  last_submit_at: number | null;
  error: string;
}

const ENDPOINT_STORAGE_KEY = "stream_raid_remote_leaderboard_endpoint_v1";
const CLIENT_ID_STORAGE_KEY = "stream_raid_remote_client_id_v1";
const CONFIG_PATH = "config/leaderboard.json";
const REFRESH_THROTTLE_MS = 15000;
const MAX_REMOTE_ROWS = 100;

let configLoaded = false;
let refreshInFlight: Promise<RemoteLeaderboardSnapshot> | null = null;
let lastRefreshRequestedAt = 0;
let snapshot: RemoteLeaderboardSnapshot = {
  enabled: false,
  endpoint: "",
  season_id: "",
  status: "リモート未設定",
  rows: [],
  last_fetch_at: null,
  last_submit_at: null,
  error: "",
};

export function getRemoteLeaderboardSnapshot(): RemoteLeaderboardSnapshot {
  const endpoint = getStoredEndpoint();
  if (endpoint && !snapshot.endpoint) {
    snapshot = { ...snapshot, enabled: true, endpoint, status: snapshot.status === "リモート未設定" ? "リモート待機中" : snapshot.status };
  }
  return snapshot;
}

export async function refreshRemoteLeaderboard(seasonId: string, force = false): Promise<RemoteLeaderboardSnapshot> {
  const now = Date.now();
  if (!force && now - lastRefreshRequestedAt < REFRESH_THROTTLE_MS) return snapshot;
  lastRefreshRequestedAt = now;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefreshRemoteLeaderboard(seasonId).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function submitRemoteLeaderboardEntry(entry: RemoteLeaderboardEntry | Record<string, unknown>): Promise<boolean> {
  const endpoint = await resolveEndpoint();
  if (!endpoint) return false;
  const normalized = normalizeRemoteEntry(entry);
  if (!normalized || normalized.score <= 0 || !normalized.season_id) return false;
  try {
    const response = await fetch(leaderboardUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...normalized,
        season: normalized.season_id,
        clientId: getClientId(),
        client_id: getClientId(),
        profile: normalized.profile,
        source: "stream-raid-arena",
      }),
      keepalive: true,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    snapshot = {
      ...snapshot,
      enabled: true,
      endpoint,
      status: "リモート送信済み",
      last_submit_at: Date.now(),
      error: "",
    };
    return true;
  } catch (err) {
    snapshot = {
      ...snapshot,
      enabled: true,
      endpoint,
      status: "リモート送信失敗",
      error: err instanceof Error ? err.message : String(err),
    };
    return false;
  }
}

export function setRemoteLeaderboardEndpoint(value: string): boolean {
  const endpoint = sanitizeEndpoint(value);
  try {
    if (!endpoint) globalThis.localStorage?.removeItem(ENDPOINT_STORAGE_KEY);
    else globalThis.localStorage?.setItem(ENDPOINT_STORAGE_KEY, endpoint);
    snapshot = {
      ...snapshot,
      enabled: Boolean(endpoint),
      endpoint,
      status: endpoint ? "リモート待機中" : "リモート未設定",
      error: "",
    };
    return true;
  } catch {
    return false;
  }
}

async function doRefreshRemoteLeaderboard(seasonId: string): Promise<RemoteLeaderboardSnapshot> {
  const endpoint = await resolveEndpoint();
  if (!endpoint) {
    snapshot = { ...snapshot, enabled: false, endpoint: "", season_id: seasonId, status: "リモート未設定", rows: [] };
    return snapshot;
  }
  try {
    const response = await fetch(leaderboardUrl(endpoint, { season: seasonId }), { cache: "no-store" });
    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = normalizeRemoteRows(payload).filter((row) => row.season_id === seasonId).slice(0, MAX_REMOTE_ROWS);
    snapshot = {
      enabled: true,
      endpoint,
      season_id: seasonId,
      status: rows.length ? `グローバル ${rows.length}件` : "グローバル記録待ち",
      rows,
      last_fetch_at: Date.now(),
      last_submit_at: snapshot.last_submit_at,
      error: "",
    };
    return snapshot;
  } catch (err) {
    snapshot = {
      ...snapshot,
      enabled: true,
      endpoint,
      season_id: seasonId,
      status: "リモート読込失敗",
      error: err instanceof Error ? err.message : String(err),
    };
    return snapshot;
  }
}

async function resolveEndpoint(): Promise<string> {
  const query = queryEndpoint();
  if (query === "off") return "";
  if (query) {
    setRemoteLeaderboardEndpoint(query);
    return query;
  }
  const stored = getStoredEndpoint();
  if (stored) return stored;
  const env = sanitizeEndpoint(String(import.meta.env.VITE_LEADERBOARD_ENDPOINT || ""));
  if (env) return env;
  const config = await loadConfigEndpoint();
  return config;
}

function getStoredEndpoint(): string {
  try {
    return sanitizeEndpoint(globalThis.localStorage?.getItem(ENDPOINT_STORAGE_KEY) || "");
  } catch {
    return "";
  }
}

function queryEndpoint(): string {
  try {
    const value = new URLSearchParams(globalThis.location?.search || "").get("leaderboard") || "";
    if (value.toLowerCase() === "off") return "off";
    return sanitizeEndpoint(value);
  } catch {
    return "";
  }
}

async function loadConfigEndpoint(): Promise<string> {
  if (configLoaded) return "";
  configLoaded = true;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}${CONFIG_PATH}`, { cache: "no-store" });
    if (!response.ok) return "";
    const payload = (await response.json()) as Record<string, unknown>;
    if (payload.enabled === false) return "";
    const endpoint = sanitizeEndpoint(String(payload.endpoint || ""));
    if (endpoint) setRemoteLeaderboardEndpoint(endpoint);
    return endpoint;
  } catch {
    return "";
  }
}

function leaderboardUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(endpoint, globalThis.location?.href || "http://localhost/");
  if (!url.pathname.endsWith("/leaderboard")) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/leaderboard`;
  }
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

function normalizeRemoteRows(payload: Record<string, unknown>): RemoteLeaderboardEntry[] {
  const seasonId = String(payload.season || payload.season_id || "");
  const source = Array.isArray(payload.rows)
    ? payload.rows
    : Array.isArray(payload.entries)
      ? payload.entries
      : Array.isArray(payload.leaderboard)
        ? payload.leaderboard
        : [];
  return source.map((row) => normalizeRemoteEntry(row, seasonId)).filter(Boolean) as RemoteLeaderboardEntry[];
}

function normalizeRemoteEntry(raw: unknown, fallbackSeasonId = ""): RemoteLeaderboardEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const profile = normalizeProfile(row.profile && typeof row.profile === "object" ? (row.profile as Record<string, unknown>) : row);
  const seasonId = String(row.seasonId || row.season_id || row.season || fallbackSeasonId);
  const id = String(row.id || row.entry_id || row.clientIdHash || row.client_id_hash || "");
  const score = Math.max(0, Math.round(Number(row.score) || 0));
  if (!id || !seasonId || score <= 0) return null;
  return {
    ...row,
    id,
    score,
    at: Math.max(0, Number(row.at) || Date.now()),
    seasonId,
    season_id: seasonId,
    profile,
    name: profile.name,
    sns: profile.sns,
    comment: profile.comment,
    character: cleanSingleLine(row.character, 32),
    build: cleanSingleLine(row.build, 48),
    wave: Math.max(0, Math.round(Number(row.wave) || 0)),
    kills: Math.max(0, Math.round(Number(row.kills) || 0)),
    time: Math.max(0, Math.round(Number(row.time) || 0)),
  };
}

function normalizeProfile(profile: Record<string, unknown>): RemoteLeaderboardProfile {
  return {
    name: cleanSingleLine(profile.name, 24),
    sns: cleanSingleLine(profile.sns, 40),
    comment: cleanSingleLine(profile.comment, 80),
  };
}

function sanitizeEndpoint(value: string): string {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text, globalThis.location?.href || "http://localhost/");
    if (!["https:", "http:"].includes(url.protocol)) return "";
    return url.toString().replace(/[?#]$/, "");
  } catch {
    return "";
  }
}

function getClientId(): string {
  try {
    const existing = globalThis.localStorage?.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing) return existing;
    const id = `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    globalThis.localStorage?.setItem(CLIENT_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return `ephemeral_${Math.random().toString(36).slice(2, 12)}`;
  }
}

function cleanSingleLine(value: unknown, max: number): string {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}
