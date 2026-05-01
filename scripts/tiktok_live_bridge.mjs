#!/usr/bin/env node
import http from "node:http";
import { URL } from "node:url";

const HOST = process.env.TIKTOK_LIVE_BRIDGE_HOST || "127.0.0.1";
const PORT = Number(process.env.TIKTOK_LIVE_BRIDGE_PORT || 8091);
const MAX_EVENTS = Number(process.env.TIKTOK_LIVE_BRIDGE_MAX_EVENTS || 800);
const RETRY_MS = Number(process.env.TIKTOK_LIVE_RETRY_MS || 15000);
const INCLUDE_STREAK_PROGRESS = process.env.TIKTOK_LIVE_INCLUDE_STREAK_PROGRESS === "1";

const args = process.argv.slice(2);
const initialUsername = cleanUsername(readArg(["--username", "--id", "--tiktok-id"]) || readPositionalArg() || process.env.TIKTOK_LIVE_USERNAME || process.env.TIKTOK_ID || "");

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: npm run live:bridge:tiktok -- <tiktok_id>

Starts a local TikTok Live bridge for the game.

Endpoints:
  GET  /health              bridge and connector status
  GET  /events?since=0      polling endpoint used by the game
  GET  /stream              Server-Sent Events feed
  POST /connect             connect or reconnect by TikTok ID
  POST /demo                inject a demo event without TikTok

Environment:
  TIKTOK_LIVE_BRIDGE_HOST   default 127.0.0.1
  TIKTOK_LIVE_BRIDGE_PORT   default 8091
  TIKTOK_LIVE_USERNAME      TikTok ID fallback
`);
  process.exit(0);
}

let nextEventId = 1;
const events = [];
const seenExternalIds = new Set();
const sseClients = new Set();
let connection = null;
let retryTimer = null;
let currentUsername = initialUsername;
let connectorStatus = {
  available: false,
  connected: false,
  username: currentUsername || null,
  roomId: null,
  error: null,
  lastConnectedAt: null,
  lastEventAt: null,
};

function readArg(names) {
  for (const name of names) {
    const eq = args.find((arg) => arg.startsWith(`${name}=`));
    if (eq) return eq.slice(name.length + 1).trim();
    const index = args.indexOf(name);
    if (index >= 0 && args[index + 1] && !args[index + 1].startsWith("-")) return args[index + 1].trim();
  }
  return "";
}

function readPositionalArg() {
  return args.find((arg) => arg && !arg.startsWith("-")) || "";
}

function cleanUsername(value) {
  return String(value || "").trim().replace(/^@+/, "").replace(/[^\w.-]/g, "").slice(0, 40);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapType(raw) {
  const text = String(raw || "").toLowerCase();
  if (!text) return "gift";
  if (text.includes("gift")) return "gift";
  if (text.includes("ad") || text.includes("advert") || text.includes("sponsor")) return "ad_obstacle";
  if (text.includes("sub") || text.includes("member")) return "subscription";
  if (text.includes("follow")) return "follow";
  if (text.includes("share")) return "share";
  if (text.includes("like")) return "like";
  if (text.includes("chat") || text.includes("comment")) return "chat";
  return "gift";
}

function readNested(payload, path) {
  let current = payload;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = current[key];
  }
  return current;
}

function firstText(values, fallback) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return fallback;
}

function firstFinite(values, fallback) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return fallback;
}

function deriveDiamonds(payload, type) {
  const gift = payload && typeof payload.gift === "object" ? payload.gift : {};
  const repeat = Math.max(1, Math.round(firstFinite([payload.repeatCount, payload.repeat_count, gift.repeatCount], 1)));
  const direct = firstFinite(
    [
      payload.diamonds,
      payload.diamondCount,
      payload.diamond_count,
      payload.giftDiamondCount,
      payload.value,
      gift.diamonds,
      gift.diamondCount,
      gift.diamond_count,
      gift.value,
    ],
    0
  );
  if (direct > 0) return Math.max(1, Math.round(direct * repeat));

  const likes = firstFinite([payload.likeCount, payload.likes, payload.totalLikeCount], 0);
  if (type === "like" && likes > 0) return Math.max(1, Math.round(likes / 120));
  if (type === "subscription") return 22;
  if (type === "share") return 2;
  if (type === "follow" || type === "chat") return 1;
  return 3;
}

function shouldSkipGiftProgress(payload) {
  if (INCLUDE_STREAK_PROGRESS) return false;
  const giftType = toNumber(payload.giftType, toNumber(readNested(payload, ["gift", "giftType"]), 0));
  const repeatEnd = Boolean(payload.repeatEnd ?? readNested(payload, ["gift", "repeatEnd"]));
  return giftType === 1 && !repeatEnd;
}

function normalizeEvent(rawPayload, forcedType = "", forcedSource = "") {
  const payload = rawPayload && typeof rawPayload === "object" ? rawPayload : {};
  const type = mapType(forcedType || payload.type || payload.eventType || payload.event || payload.action || payload.eventName || payload.event_name);
  if (type === "gift" && shouldSkipGiftProgress(payload)) return null;

  const sender = firstText(
    [
      payload.sender,
      payload.uniqueId,
      payload.nickname,
      payload.userName,
      payload.userId,
      readNested(payload, ["user", "uniqueId"]),
      readNested(payload, ["user", "nickname"]),
    ],
    "viewer"
  ).slice(0, 42);
  const giftName = firstText(
    [payload.giftName, payload.label, payload.name, readNested(payload, ["gift", "name"]), readNested(payload, ["gift", "giftName"]), type],
    type
  ).slice(0, 64);
  const diamonds = deriveDiamonds(payload, type);
  const externalId = firstText(
    [
      payload.id,
      payload.eventId,
      payload.messageId,
      payload.msgId,
      payload.event_id,
      payload.createTime ? `${type}:${sender}:${giftName}:${payload.createTime}:${payload.repeatCount || ""}` : "",
    ],
    ""
  );

  if (externalId) {
    if (seenExternalIds.has(externalId)) return null;
    seenExternalIds.add(externalId);
    if (seenExternalIds.size > MAX_EVENTS * 2) {
      const first = seenExternalIds.values().next();
      if (!first.done) seenExternalIds.delete(first.value);
    }
  }

  return {
    id: nextEventId++,
    source: forcedSource || (forcedType === "demo" ? "tiktok-demo" : "tiktok-live"),
    type,
    sender,
    giftName,
    diamonds,
    receivedAt: Date.now(),
    externalId: externalId || null,
    raw: payload,
  };
}

function publicEvent(event) {
  return {
    id: event.id,
    source: event.source,
    type: event.type,
    sender: event.sender,
    giftName: event.giftName,
    diamonds: event.diamonds,
    receivedAt: event.receivedAt,
  };
}

function pushEvent(event) {
  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  connectorStatus.lastEventAt = event.receivedAt;
  broadcastSse("liveEvent", publicEvent(event));
}

function statusPayload() {
  return {
    ok: true,
    service: "tiktok_live_bridge",
    host: HOST,
    port: PORT,
    events: events.length,
    cursor: nextEventId - 1,
    connector: connectorStatus,
  };
}

function sendJson(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Last-Event-ID,Access-Control-Request-Private-Network",
    "Access-Control-Allow-Private-Network": "true",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1024 * 512) reject(new Error("Payload too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function writeSse(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastSse(eventName, payload) {
  for (const res of sseClients) writeSse(res, eventName, payload);
}

function connectorError(code, message, detail = "") {
  return {
    code,
    message,
    detail: detail ? String(detail) : "",
    at: Date.now(),
  };
}

function setConnectorError(code, message, detail = "") {
  connectorStatus = {
    ...connectorStatus,
    available: code !== "dependency_missing",
    connected: false,
    error: connectorError(code, message, detail),
  };
  broadcastSse("status", statusPayload());
}

async function loadConnector() {
  try {
    const mod = await import("tiktok-live-connector");
    const ConnectionCtor = mod.WebcastPushConnection || mod.TikTokLiveConnection || mod.default;
    if (typeof ConnectionCtor !== "function") {
      setConnectorError("unsupported_connector_export", "tiktok-live-connector is installed but no usable connection class was exported.");
      return null;
    }
    connectorStatus = { ...connectorStatus, available: true, error: null };
    return ConnectionCtor;
  } catch (err) {
    const missing = err && (err.code === "ERR_MODULE_NOT_FOUND" || String(err.message || "").includes("Cannot find package"));
    setConnectorError(
      missing ? "dependency_missing" : "dependency_load_failed",
      missing ? "Install tiktok-live-connector to connect to TikTok Live. Demo injection still works." : "Failed to load tiktok-live-connector.",
      err && err.message
    );
    return null;
  }
}

async function connectToTikTok(nextUsername = currentUsername) {
  const targetUsername = cleanUsername(nextUsername);
  currentUsername = targetUsername;
  connectorStatus = { ...connectorStatus, username: targetUsername || null };
  if (!targetUsername) {
    setConnectorError("missing_tiktok_id", "Pass a TikTok ID: npm run live:bridge:tiktok -- <tiktok_id>");
    return;
  }

  const ConnectionCtor = await loadConnector();
  if (!ConnectionCtor) return;

  try {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (connection && typeof connection.disconnect === "function") {
      try {
        connection.disconnect();
      } catch {
        // Reconnect is best effort.
      }
    }
    connection = new ConnectionCtor(targetUsername);
    attachConnectionEvents(connection);
    const state = await connection.connect();
    connectorStatus = {
      ...connectorStatus,
      available: true,
      connected: true,
      username: targetUsername,
      roomId: state && state.roomId ? String(state.roomId) : null,
      error: null,
      lastConnectedAt: Date.now(),
    };
    broadcastSse("status", statusPayload());
    console.log(`[tiktok-live-bridge] connected to ${targetUsername}${connectorStatus.roomId ? ` room ${connectorStatus.roomId}` : ""}`);
  } catch (err) {
    setConnectorError("connect_failed", `Could not connect to TikTok Live for "${targetUsername}".`, err && err.message);
    scheduleReconnect();
  }
}

function attachConnectionEvents(conn) {
  const on = typeof conn.on === "function" ? conn.on.bind(conn) : null;
  if (!on) return;

  for (const type of ["gift", "like", "chat", "comment", "follow", "share", "subscribe", "member"]) {
    on(type, (payload) => {
      const event = normalizeEvent(payload || {}, type);
      if (event) pushEvent(event);
    });
  }

  on("disconnected", () => {
    setConnectorError("disconnected", "TikTok Live connector disconnected.");
    scheduleReconnect();
  });
  on("streamEnd", () => {
    setConnectorError("stream_end", "TikTok Live stream ended.");
    scheduleReconnect();
  });
  on("error", (err) => {
    setConnectorError("connector_error", "TikTok Live connector emitted an error.", err && err.message);
  });
}

function scheduleReconnect() {
  if (!currentUsername || !RETRY_MS || retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectToTikTok();
  }, Math.max(1000, RETRY_MS));
}

const server = http.createServer(async (req, res) => {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  if (method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, statusPayload());
    return;
  }

  if (method === "GET" && url.pathname === "/events") {
    const since = Math.max(0, Math.floor(toNumber(url.searchParams.get("since"), 0)));
    const max = Math.min(100, Math.max(1, Math.floor(toNumber(url.searchParams.get("max"), 24))));
    const slice = events.filter((evt) => evt.id > since).slice(-max).map(publicEvent);
    sendJson(res, 200, {
      ok: true,
      cursor: nextEventId - 1,
      connector: connectorStatus,
      events: slice,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Private-Network": "true",
    });
    sseClients.add(res);
    writeSse(res, "status", statusPayload());
    req.on("close", () => sseClients.delete(res));
    return;
  }

  if (method === "POST" && url.pathname === "/connect") {
    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const target = cleanUsername(body.username || body.tiktokId || body.id || body.room || "");
      if (!target) {
        sendJson(res, 400, { ok: false, error: connectorError("missing_tiktok_id", "TikTok ID is required.") });
        return;
      }
      connectToTikTok(target).catch((err) => {
        setConnectorError("connect_failed", `Could not connect to TikTok Live for "${target}".`, err && err.message);
      });
      sendJson(res, 202, { ok: true, connecting: target, cursor: nextEventId - 1, connector: connectorStatus });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err && err.message ? err.message : "invalid payload" });
    }
    return;
  }

  if (method === "POST" && (url.pathname === "/demo" || url.pathname === "/inject")) {
    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const forcedType = body.type || body.eventType || body.event || "gift";
      const event = normalizeEvent({ type: "gift", giftName: "Demo Rose", diamondCount: 15, sender: "demo_user", ...body }, forcedType, "tiktok-demo");
      if (!event) {
        sendJson(res, 200, { ok: true, deduped: true, cursor: nextEventId - 1 });
        return;
      }
      pushEvent(event);
      sendJson(res, 200, { ok: true, accepted: publicEvent(event), cursor: nextEventId - 1 });
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err && err.message ? err.message : "invalid payload" });
    }
    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: "not_found",
    path: url.pathname,
    hint: "GET /health, GET /events, GET /stream, or POST /demo",
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[tiktok-live-bridge] listening on http://${HOST}:${PORT}`);
  console.log(`[tiktok-live-bridge] events -> GET  http://${HOST}:${PORT}/events?since=0`);
  console.log(`[tiktok-live-bridge] demo   -> POST http://${HOST}:${PORT}/demo`);
  if (currentUsername) {
    console.log(`[tiktok-live-bridge] connecting to TikTok ID "${currentUsername}"`);
  } else {
    console.log("[tiktok-live-bridge] no TikTok ID provided; demo injection and JSON status are available");
  }
  connectToTikTok();
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal) {
  if (retryTimer) clearTimeout(retryTimer);
  try {
    if (connection && typeof connection.disconnect === "function") connection.disconnect();
  } catch {
    // Best-effort cleanup only.
  }
  server.close(() => {
    console.log(`[tiktok-live-bridge] stopped (${signal})`);
    process.exit(0);
  });
}
