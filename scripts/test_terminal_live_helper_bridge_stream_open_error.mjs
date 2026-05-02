import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const helperUrl = pathToFileURL(path.resolve("public/terminal-live.html")).toString();
const channel = `stream-raid-live-helper-open-error-${Date.now()}`;
const storageKey = "stream_raid_terminal_event_v1";
const bridgeUrl = "http://127.0.0.1:8091";
const requests = [];

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
  window.__terminalLiveStreams = [];
  window.__terminalLiveStreamClosed = 0;

  class StubBroadcastChannel {
    constructor(name) {
      this.name = name;
    }

    postMessage(payload) {
      window.__terminalLiveMessages.push({ name: this.name, payload });
    }

    close() {}
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

    close() {
      this.readyState = 2;
      window.__terminalLiveStreamClosed += 1;
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
  const since = url.searchParams.get("since");
  const max = url.searchParams.get("max");
  requests.push({ since, max, url: route.request().url() });

  const isInitialSync = since === "0" && max === "1";
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
      cursor: isInitialSync ? 301 : 302,
      connector: { connected: true, username: "demo_live" },
      events: isInitialSync
        ? [
            {
              id: 300,
              source: "tiktok-live",
              type: "gift",
              sender: "old_backlog",
              giftName: "Old Backlog",
              diamonds: 99,
              receivedAt: 1710000000100,
            },
          ]
        : [
            {
              id: 302,
              source: "tiktok-live",
              type: "chat",
              sender: "after_open_error",
              giftName: "After Open Error",
              diamonds: 1,
              receivedAt: 1710000000400,
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
  await page.waitForFunction(() => window.__terminalLiveMessages.length > 0, null, { timeout: 5000 });
  await page.click("#bridgeStopBtn");

  const observed = await page.evaluate((key) => {
    return {
      messages: window.__terminalLiveMessages,
      streams: window.__terminalLiveStreams,
      streamClosed: window.__terminalLiveStreamClosed,
      stored: localStorage.getItem(key),
      bridgeChip: document.querySelector("#bridgeChip")?.textContent || "",
    };
  }, storageKey);

  assert(requests.length === 2, "Open-before-status fallback should sync once, then poll once", { requests });
  assert(requests[0].since === "0" && requests[0].max === "1", "First fallback request should be cursor sync", { requests });
  assert(requests[1].since === "301" && requests[1].max === "100", "Polling should resume from synced cursor", { requests });
  assert(observed.streams[0] === `${bridgeUrl}/stream`, "EventSource used the wrong stream URL", observed);
  assert(observed.streamClosed === 1, "Stop button should close EventSource", observed);
  assert(observed.messages.length === 1, "Sync backlog must not be published as an envelope", observed);
  assert(observed.messages[0].name === channel, "BroadcastChannel used the wrong channel", observed.messages[0]);

  const payload = observed.messages[0].payload;
  assert(payload.source === "stream-raid-terminal", "Fallback envelope source was not terminal", payload);
  assert(payload.channel === channel, "Fallback envelope channel mismatch", payload);
  assert(Array.isArray(payload.events) && payload.events.length === 1, "Fallback envelope should contain one event", payload);
  assert(payload.events[0].id === "bridge-302", "Fallback event id was not normalized", payload.events[0]);
  assert(payload.events[0].eventType === "chat", "Fallback event type was not preserved", payload.events[0]);
  assert(payload.events[0].sender === "after_open_error", "Fallback sender was not preserved", payload.events[0]);
  assert(payload.bridgeCursor === 302, "Fallback cursor was not attached to envelope", payload);

  const stored = JSON.parse(observed.stored);
  assert(stored.events.length === 1 && stored.events[0].id === "bridge-302", "localStorage should hold only the post-sync event", stored);
  assert(observed.bridgeChip.includes("停止中"), "Stop button did not update bridge status", observed);
  assert(errors.length === 0, "Browser emitted errors", { errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        helperUrl,
        channel,
        requests,
        broadcast_events: payload.events.length,
        bridge_status: observed.bridgeChip,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
