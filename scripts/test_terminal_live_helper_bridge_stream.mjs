import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const helperUrl = `${pathToFileURL(path.resolve("public/terminal-live.html")).toString()}?admin=1`;
const channel = `stream-raid-live-helper-sse-${Date.now()}`;
const storageKey = "stream_raid_terminal_event_v1";
const bridgeUrl = "http://127.0.0.1:8091";
const eventsRequests = [];

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const context = await browser.newContext();

await context.addInitScript(() => {
  window.__terminalLiveMessages = [];
  window.__terminalLiveClosed = 0;
  window.__terminalLiveStreams = [];
  window.__terminalLiveStreamClosed = 0;

  class StubBroadcastChannel {
    constructor(name) {
      this.name = name;
    }

    postMessage(payload) {
      window.__terminalLiveMessages.push({ name: this.name, payload });
    }

    close() {
      window.__terminalLiveClosed += 1;
    }
  }

  class StubEventSource {
    constructor(url) {
      this.url = String(url);
      this.readyState = 0;
      this.listeners = new Map();
      window.__terminalLiveStreams.push(this.url);

      setTimeout(() => {
        if (this.readyState === 2) return;
        this.readyState = 1;
        if (typeof this.onopen === "function") this.onopen({ type: "open" });
        this.emit("status", {
          ok: true,
          cursor: 205,
          connector: { connected: true, username: "demo_live" },
        });
        this.emit("liveEvent", {
          id: 206,
          source: "tiktok-live",
          type: "gift",
          sender: "sse_alice",
          giftName: "SSE Rose",
          diamonds: 25,
          receivedAt: 1710000000200,
        });
        setTimeout(() => {
          if (this.readyState === 2) return;
          if (typeof this.onerror === "function") this.onerror({ type: "error" });
        }, 20);
      }, 20);
    }

    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    }

    removeEventListener(type, listener) {
      if (this.listeners.has(type)) this.listeners.get(type).delete(listener);
    }

    close() {
      this.readyState = 2;
      window.__terminalLiveStreamClosed += 1;
    }

    emit(type, payload) {
      const message = { type, data: JSON.stringify(payload) };
      for (const listener of this.listeners.get(type) || []) listener(message);
      if (type === "message" && typeof this.onmessage === "function") this.onmessage(message);
    }
  }

  Object.defineProperty(window, "BroadcastChannel", {
    configurable: true,
    value: StubBroadcastChannel,
  });
  Object.defineProperty(window, "EventSource", {
    configurable: true,
    value: StubEventSource,
  });
});

await context.route("http://127.0.0.1:8091/events**", async (route) => {
  const url = new URL(route.request().url());
  eventsRequests.push({ since: url.searchParams.get("since"), max: url.searchParams.get("max"), url: route.request().url() });
  await route.fulfill({
    status: 200,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-private-network": "true",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ok: true,
      cursor: 207,
      connector: { connected: true, username: "demo_live" },
      events: [
        {
          id: 207,
          source: "tiktok-live",
          type: "share",
          sender: "sse_bob",
          giftName: "SSE Share",
          diamonds: 2,
          receivedAt: 1710000000300,
        },
      ],
    }),
  });
});

const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

try {
  await page.goto(helperUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.fill("#channelInput", channel);
  await page.fill("#bridgeUrlInput", bridgeUrl);
  await page.fill("#bridgeIntervalInput", "10000");
  await page.click("#bridgeStartBtn");
  await page.waitForFunction(() => window.__terminalLiveMessages.length >= 2, null, { timeout: 5000 });
  await page.click("#bridgeStopBtn");

  const observed = await page.evaluate((key) => {
    return {
      messages: window.__terminalLiveMessages,
      closed: window.__terminalLiveClosed,
      streams: window.__terminalLiveStreams,
      streamClosed: window.__terminalLiveStreamClosed,
      stored: localStorage.getItem(key),
      status: document.querySelector("#status")?.textContent || "",
      bridgeChip: document.querySelector("#bridgeChip")?.textContent || "",
    };
  }, storageKey);

  assert(eventsRequests.length === 1, "SSE bridge should poll /events exactly once after stream failure", { eventsRequests });
  assert(eventsRequests[0].since === "206", "SSE fallback should continue from the last delivered cursor", { eventsRequests });
  assert(eventsRequests[0].max === "100", "SSE fallback should use normal poll batch size", { eventsRequests });
  assert(observed.streams.length === 1, "Expected exactly one EventSource stream", observed);
  assert(observed.streams[0] === `${bridgeUrl}/stream`, "EventSource used the wrong stream URL", observed);
  assert(observed.streamClosed === 1, "Stop button should close EventSource", observed);
  assert(observed.messages.length === 2, "Expected one SSE envelope and one fallback poll envelope", observed);
  assert(observed.messages[0].name === channel, "BroadcastChannel used the wrong channel", observed.messages[0]);
  assert(observed.messages[1].name === channel, "Fallback BroadcastChannel used the wrong channel", observed.messages[1]);

  const payload = observed.messages[0].payload;
  assert(payload.source === "stream-raid-terminal", "SSE envelope source was not terminal", payload);
  assert(payload.channel === channel, "SSE envelope channel mismatch", payload);
  assert(Array.isArray(payload.events) && payload.events.length === 1, "SSE envelope should contain one event", payload);
  assert(payload.events[0].id === "bridge-206", "SSE event id was not normalized", payload.events[0]);
  assert(payload.events[0].eventType === "gift", "SSE event type was not preserved", payload.events[0]);
  assert(payload.events[0].sender === "sse_alice", "SSE sender was not preserved", payload.events[0]);
  assert(payload.events[0].giftName === "SSE Rose", "SSE label was not preserved", payload.events[0]);
  assert(payload.events[0].diamondCount === 25, "SSE diamonds were not preserved", payload.events[0]);
  assert(payload.bridgeCursor === 206, "SSE cursor was not attached to envelope", payload);

  const fallbackPayload = observed.messages[1].payload;
  assert(fallbackPayload.source === "stream-raid-terminal", "Fallback envelope source was not terminal", fallbackPayload);
  assert(Array.isArray(fallbackPayload.events) && fallbackPayload.events.length === 1, "Fallback envelope should contain one event", fallbackPayload);
  assert(fallbackPayload.events[0].id === "bridge-207", "Fallback event id was not normalized", fallbackPayload.events[0]);
  assert(fallbackPayload.events[0].eventType === "share", "Fallback event type was not preserved", fallbackPayload.events[0]);
  assert(fallbackPayload.events[0].sender === "sse_bob", "Fallback sender was not preserved", fallbackPayload.events[0]);
  assert(fallbackPayload.bridgeCursor === 207, "Fallback cursor was not attached to envelope", fallbackPayload);

  const stored = JSON.parse(observed.stored);
  assert(stored.source === "stream-raid-terminal", "localStorage envelope source mismatch", stored);
  assert(stored.channel === channel, "localStorage envelope channel mismatch", stored);
  assert(stored.events.length === 1, "localStorage envelope did not include SSE event", stored);
  assert(stored.events[0].id === "bridge-207", "localStorage should hold the latest fallback event", stored);
  assert(observed.bridgeChip.includes("停止中"), "Stop button did not update bridge status", observed);
  assert(errors.length === 0, "Browser emitted errors", { errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        helperUrl,
        channel,
        streams: observed.streams,
        fallback_requests: eventsRequests,
        broadcast_events: payload.events.length + fallbackPayload.events.length,
        bridge_status: observed.bridgeChip,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
