#!/usr/bin/env node
import http from "node:http";
import { URL } from "node:url";

const HOST = process.env.TIKFINITY_BRIDGE_HOST || "127.0.0.1";
const PORT = Number(process.env.TIKFINITY_BRIDGE_PORT || 8091);
const MAX_EVENTS = Number(process.env.TIKFINITY_BRIDGE_MAX_EVENTS || 800);

let nextEventId = 1;
const events = [];
const seenExternalIds = new Set();

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapType(raw) {
  const text = String(raw || "").toLowerCase();
  if (!text) return "gift";
  if (text.includes("gift")) return "gift";
  if (text.includes("sub") || text.includes("member")) return "subscription";
  if (text.includes("follow")) return "follow";
  if (text.includes("share")) return "share";
  if (text.includes("like")) return "like";
  if (text.includes("chat") || text.includes("comment")) return "chat";
  return "gift";
}

function deriveDiamonds(payload, type) {
  const gift = payload && typeof payload.gift === "object" ? payload.gift : {};
  const repeat = Math.max(1, Math.round(toNumber(payload.repeatCount, toNumber(gift.repeatCount, 1))));
  const direct =
    Math.max(
      toNumber(payload.diamonds, 0),
      toNumber(payload.diamondCount, 0),
      toNumber(payload.diamond_count, 0),
      toNumber(gift.diamondCount, 0),
      toNumber(gift.diamond_count, 0),
      toNumber(payload.value, 0),
      toNumber(gift.value, 0)
    ) * repeat;
  if (direct > 0) return Math.max(1, Math.round(direct));

  const likes = Math.max(toNumber(payload.likeCount, 0), toNumber(payload.likes, 0), toNumber(payload.totalLikeCount, 0));
  if (type === "like" && likes > 0) return Math.max(1, Math.round(likes / 120));
  if (type === "subscription") return 22;
  if (type === "share") return 2;
  if (type === "follow" || type === "chat") return 1;
  return 3;
}

function normalizeEvent(payload) {
  const type = mapType(payload.type || payload.eventType || payload.event || payload.action || payload.eventName || payload.event_name);
  const sender = String(
    payload.sender || payload.nickname || payload.user || payload.uniqueId || payload.userName || payload.userId || "viewer"
  ).slice(0, 42);
  const giftName = String(payload.giftName || (payload.gift && payload.gift.name) || payload.name || type).slice(0, 64);
  const diamonds = deriveDiamonds(payload, type);

  const externalId = String(payload.id || payload.eventId || payload.messageId || payload.msgId || "").trim();
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
    source: "tikfinity",
    type,
    sender,
    giftName,
    diamonds,
    receivedAt: Date.now(),
    externalId: externalId || null,
    raw: payload,
  };
}

function pushEvent(event) {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

function sendJson(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1024 * 512) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  if (method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "tikfinity_webhook_bridge",
      events: events.length,
      cursor: nextEventId - 1,
      host: HOST,
      port: PORT,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/events") {
    const since = Math.max(0, Math.floor(toNumber(url.searchParams.get("since"), 0)));
    const max = Math.min(100, Math.max(1, Math.floor(toNumber(url.searchParams.get("max"), 24))));
    const slice = events.filter((evt) => evt.id > since).slice(-max).map((evt) => {
      return {
        id: evt.id,
        type: evt.type,
        sender: evt.sender,
        giftName: evt.giftName,
        diamonds: evt.diamonds,
        receivedAt: evt.receivedAt,
      };
    });
    sendJson(res, 200, {
      ok: true,
      cursor: nextEventId - 1,
      events: slice,
    });
    return;
  }

  if (method === "POST" && url.pathname === "/webhook/tikfinity") {
    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const event = normalizeEvent(body || {});
      if (!event) {
        sendJson(res, 200, { ok: true, deduped: true, cursor: nextEventId - 1 });
        return;
      }
      pushEvent(event);
      sendJson(res, 200, {
        ok: true,
        accepted: {
          id: event.id,
          type: event.type,
          sender: event.sender,
          giftName: event.giftName,
          diamonds: event.diamonds,
        },
        cursor: nextEventId - 1,
      });
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        error: err && err.message ? err.message : "invalid payload",
      });
    }
    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: "not_found",
    path: url.pathname,
    hint: "POST /webhook/tikfinity or GET /events",
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[tikfinity-bridge] listening on http://${HOST}:${PORT}`);
  console.log(`[tikfinity-bridge] webhook -> POST http://${HOST}:${PORT}/webhook/tikfinity`);
  console.log(`[tikfinity-bridge] events  -> GET  http://${HOST}:${PORT}/events?since=0`);
});
