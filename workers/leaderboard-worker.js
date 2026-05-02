const BOARD_LIMIT = 100;
const DEFAULT_COOLDOWN_SECONDS = 30;
const DEFAULT_DAILY_SUBMIT_LIMIT = 60;
const DEFAULT_MAX_SCORE = 999999999;
const MAX_BODY_BYTES = 4096;

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};

export class LeaderboardDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const store = createDurableObjectStore(this.state.storage);
    return handleRequest(request, this.env, undefined, store);
  }
}

async function handleRequest(request, env = {}, ctx, forcedStore) {
  const cors = buildCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(request.url);
  if (url.pathname !== "/leaderboard") {
    return jsonResponse({ error: "not_found" }, 404, cors);
  }

  try {
    if (!isOriginAllowed(request, env)) {
      return jsonResponse({ error: "origin_not_allowed" }, 403, cors);
    }

    if (request.method !== "GET" && request.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405, {
        ...cors,
        Allow: "GET, POST, OPTIONS",
      });
    }

    if (!forcedStore && env.LEADERBOARD_DO) {
      const season = await extractSeasonForDurableObject(request, url);
      const seasonCheck = validateSeason(season);
      if (!seasonCheck.ok) {
        return jsonResponse({ error: seasonCheck.error }, 400, cors);
      }
      const id = env.LEADERBOARD_DO.idFromName(seasonCheck.value);
      return env.LEADERBOARD_DO.get(id).fetch(request);
    }

    const store = forcedStore || createKvStore(env.LEADERBOARD_KV);
    if (!store) {
      return jsonResponse({ error: "leaderboard_storage_not_configured" }, 500, cors);
    }

    if (request.method === "GET") {
      return handleGet(url, store, cors);
    }

    if (request.method === "POST") {
      return handlePost(request, env, store, cors);
    }

    return jsonResponse({ error: "method_not_allowed" }, 405, {
      ...cors,
      Allow: "GET, POST, OPTIONS",
    });
  } catch (error) {
    return jsonResponse(
      { error: "internal_error", message: String(error && error.message ? error.message : error) },
      500,
      cors,
    );
  }
}

async function handleGet(url, store, cors) {
  const seasonCheck = validateSeason(url.searchParams.get("season"));
  if (!seasonCheck.ok) {
    return jsonResponse({ error: seasonCheck.error }, 400, cors);
  }

  const board = await loadBoard(store, seasonCheck.value);
  return jsonResponse(
    {
      season: board.season,
      updatedAt: board.updatedAt,
      limit: BOARD_LIMIT,
      entries: rankEntries(board.entries),
    },
    200,
    cors,
  );
}

async function handlePost(request, env, store, cors) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "payload_too_large" }, 413, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, cors);
  }

  const input = validateScoreSubmission(body, request, env);
  if (!input.ok) {
    return jsonResponse({ error: input.error, details: input.details }, 400, cors);
  }

  const clientHash = await hashClientId(input.value.clientId, env);
  const now = new Date().toISOString();
  const board = await loadBoard(store, input.value.season);
  const existingIndex = board.entries.findIndex((entry) => entry.clientIdHash === clientHash);
  const existing = existingIndex >= 0 ? board.entries[existingIndex] : null;

  if (existing && input.value.score < existing.score) {
    return jsonResponse(
      {
        accepted: false,
        reason: "score_not_improved",
        season: board.season,
        entry: rankEntries(board.entries).find((entry) => entry.clientIdHash === clientHash),
        leaderboard: rankEntries(board.entries),
      },
      200,
      cors,
    );
  }

  const isSameScoreProfileUpdate = Boolean(existing && input.value.score === existing.score && hasProfileChanged(existing, input.value.profile));

  if (existing && input.value.score === existing.score && !isSameScoreProfileUpdate) {
    return jsonResponse(
      {
        accepted: false,
        reason: "score_not_improved",
        season: board.season,
        entry: rankEntries(board.entries).find((entry) => entry.clientIdHash === clientHash),
        leaderboard: rankEntries(board.entries),
      },
      200,
      cors,
    );
  }

  if (!isSameScoreProfileUpdate) {
    const rate = await checkRateLimit(store, input.value.season, clientHash, env);
    if (!rate.ok) {
      return jsonResponse(
        { error: rate.error, retryAfter: rate.retryAfter, limit: rate.limit },
        429,
        { ...cors, "Retry-After": String(rate.retryAfter || DEFAULT_COOLDOWN_SECONDS) },
      );
    }
  }

  const entry = {
    clientIdHash: clientHash,
    score: input.value.score,
    name: input.value.profile.name,
    sns: input.value.profile.sns,
    comment: input.value.profile.comment,
    submittedAt: existing ? existing.submittedAt : now,
    updatedAt: now,
  };

  const nextEntries = board.entries.filter((item) => item.clientIdHash !== clientHash);
  nextEntries.push(entry);
  nextEntries.sort(compareEntries);

  board.entries = nextEntries.slice(0, BOARD_LIMIT);
  board.updatedAt = now;
  await saveBoard(store, board);

  const ranked = rankEntries(board.entries);
  const rankedEntry = ranked.find((item) => item.clientIdHash === clientHash) || null;

  return jsonResponse(
    {
      accepted: Boolean(rankedEntry),
      reason: rankedEntry ? "accepted" : "not_in_top_100",
      season: board.season,
      entry: rankedEntry,
      leaderboard: ranked,
    },
    rankedEntry ? 201 : 200,
    cors,
  );
}

function validateScoreSubmission(body, request, env) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "body_must_be_object" };
  }

  const seasonCheck = validateSeason(body.season);
  if (!seasonCheck.ok) {
    return seasonCheck;
  }

  const clientId = String(body.clientId || request.headers.get("x-client-id") || "").trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(clientId)) {
    return {
      ok: false,
      error: "invalid_client_id",
      details: "clientId must be 8-80 chars using letters, numbers, underscore, or hyphen",
    };
  }

  const maxScore = readPositiveInteger(env.MAX_SCORE, DEFAULT_MAX_SCORE);
  if (!Number.isInteger(body.score) || body.score < 0 || body.score > maxScore) {
    return {
      ok: false,
      error: "invalid_score",
      details: `score must be an integer from 0 to ${maxScore}`,
    };
  }

  return {
    ok: true,
    value: {
      season: seasonCheck.value,
      clientId,
      score: body.score,
      profile: normalizeProfile(body),
    },
  };
}

function validateSeason(season) {
  if (typeof season !== "string") {
    return { ok: false, error: "invalid_season" };
  }

  const value = season.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,47}$/.test(value)) {
    return {
      ok: false,
      error: "invalid_season",
      details: "season must be 1-48 chars using letters, numbers, dot, underscore, or hyphen",
    };
  }

  return { ok: true, value };
}

function normalizeProfile(body) {
  const source = body.profile && typeof body.profile === "object" ? body.profile : body;
  return {
    name: cleanText(source.name, 24) || "Player",
    sns: cleanText(source.sns || source.social, 80),
    comment: cleanText(source.comment, 120),
  };
}

function cleanText(value, maxChars) {
  if (typeof value !== "string") {
    return "";
  }

  return Array.from(value.replace(/[\u0000-\u001f\u007f<>]/g, " ").trim())
    .slice(0, maxChars)
    .join("");
}

async function extractSeasonForDurableObject(request, url) {
  if (request.method === "GET") {
    return url.searchParams.get("season");
  }

  if (request.method === "POST") {
    const body = await request.clone().json().catch(() => null);
    return body && body.season;
  }

  return "";
}

async function loadBoard(store, season) {
  const board = await store.get(boardKey(season));
  if (!board || !Array.isArray(board.entries)) {
    return { season, updatedAt: null, entries: [] };
  }

  return {
    season,
    updatedAt: typeof board.updatedAt === "string" ? board.updatedAt : null,
    entries: board.entries.filter(isValidStoredEntry).sort(compareEntries).slice(0, BOARD_LIMIT),
  };
}

async function saveBoard(store, board) {
  await store.put(boardKey(board.season), {
    season: board.season,
    updatedAt: board.updatedAt,
    entries: board.entries.slice(0, BOARD_LIMIT),
  });
}

function isValidStoredEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.clientIdHash === "string" &&
    Number.isInteger(entry.score) &&
    typeof entry.name === "string" &&
    typeof entry.submittedAt === "string" &&
    typeof entry.updatedAt === "string"
  );
}

function rankEntries(entries) {
  return entries.sort(compareEntries).slice(0, BOARD_LIMIT).map((entry, index) => ({
    rank: index + 1,
    clientIdHash: entry.clientIdHash,
    score: entry.score,
    name: entry.name,
    sns: entry.sns || "",
    comment: entry.comment || "",
    submittedAt: entry.submittedAt,
    updatedAt: entry.updatedAt,
  }));
}

function hasProfileChanged(entry, profile) {
  return (
    entry.name !== profile.name ||
    (entry.sns || "") !== profile.sns ||
    (entry.comment || "") !== profile.comment
  );
}

function compareEntries(a, b) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  const submitted = String(a.submittedAt).localeCompare(String(b.submittedAt));
  if (submitted !== 0) {
    return submitted;
  }

  return String(a.clientIdHash).localeCompare(String(b.clientIdHash));
}

async function checkRateLimit(store, season, clientHash, env) {
  const cooldownSeconds = readPositiveInteger(env.COOLDOWN_SECONDS, DEFAULT_COOLDOWN_SECONDS);
  const dailyLimit = readPositiveInteger(env.DAILY_SUBMIT_LIMIT, DEFAULT_DAILY_SUBMIT_LIMIT);
  const now = Date.now();
  const cooldownKey = `cooldown:${season}:${clientHash}`;
  const cooldown = await store.get(cooldownKey);

  if (cooldown && cooldown.until && cooldown.until > now) {
    return {
      ok: false,
      error: "cooldown_active",
      retryAfter: Math.ceil((cooldown.until - now) / 1000),
    };
  }

  const quotaKey = `quota:${new Date(now).toISOString().slice(0, 10)}:${season}:${clientHash}`;
  const quota = (await store.get(quotaKey)) || { count: 0 };
  if (quota.count >= dailyLimit) {
    return {
      ok: false,
      error: "daily_submit_limit_reached",
      retryAfter: secondsUntilNextUtcDay(now),
      limit: dailyLimit,
    };
  }

  await store.put(cooldownKey, { until: now + cooldownSeconds * 1000 }, cooldownSeconds);
  await store.put(quotaKey, { count: quota.count + 1 }, secondsUntilNextUtcDay(now) + 3600);

  return { ok: true };
}

function secondsUntilNextUtcDay(now) {
  const date = new Date(now);
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  return Math.max(60, Math.ceil((next - now) / 1000));
}

async function hashClientId(clientId, env) {
  const salt = typeof env.CLIENT_ID_SALT === "string" ? env.CLIENT_ID_SALT : "";
  const bytes = new TextEncoder().encode(`${salt}:${clientId}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function boardKey(season) {
  return `leaderboard:${season}`;
}

function createKvStore(kv) {
  if (!kv) {
    return null;
  }

  return {
    async get(key) {
      return kv.get(key, "json");
    },
    async put(key, value, ttlSeconds) {
      const options = ttlSeconds ? { expirationTtl: ttlSeconds } : undefined;
      await kv.put(key, JSON.stringify(value), options);
    },
  };
}

function createDurableObjectStore(storage) {
  return {
    async get(key) {
      const value = await storage.get(key);
      if (!value || typeof value !== "object" || !value.__expiresAt) {
        return value || null;
      }

      if (value.__expiresAt <= Date.now()) {
        await storage.delete(key);
        return null;
      }

      return value.__value;
    },
    async put(key, value, ttlSeconds) {
      if (!ttlSeconds) {
        await storage.put(key, value);
        return;
      }

      await storage.put(key, {
        __value: value,
        __expiresAt: Date.now() + ttlSeconds * 1000,
      });
    },
  };
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get("origin");
  const configured = String(env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowAny = configured.length === 0 || configured.includes("*");
  const allowedOrigin = allowAny || !origin ? "*" : configured.includes(origin) ? origin : "";

  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Client-Id",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  if (!allowAny) {
    headers.Vary = "Origin";
  }

  return headers;
}

function isOriginAllowed(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const configured = String(env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.length === 0 || configured.includes("*") || configured.includes(origin);
}

function jsonResponse(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}
