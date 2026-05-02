import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const helperUrl = pathToFileURL(path.resolve("public/terminal-live.html")).toString();
const channel = `stream-raid-live-helper-connect-${Date.now()}`;
const storageKey = "stream_raid_terminal_event_v1";
const bridgeUrl = "http://127.0.0.1:8091";
const connectRequests = [];

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
        this.emit("status", {
          ok: true,
          cursor: 450,
          connector: { connected: true, username: "connect_user" },
        });
        this.emit("liveEvent", {
          id: 451,
          source: "tiktok-live",
          type: "gift",
          sender: "connect_alice",
          giftName: "Connect Rose",
          diamonds: 33,
          receivedAt: 1710000000500,
        });
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

    emit(type, payload) {
      const message = { type, data: JSON.stringify(payload) };
      for (const listener of this.listeners.get(type) || []) listener(message);
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

await context.route("http://127.0.0.1:8091/connect", async (route) => {
  const request = route.request();
  const postData = request.postDataJSON();
  connectRequests.push({ method: request.method(), postData });
  await route.fulfill({
    status: 202,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-private-network": "true",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ok: true,
      connecting: postData.username,
      cursor: 449,
      connector: { connected: false, username: postData.username },
    }),
  });
});

await context.route("http://127.0.0.1:8091/events**", async (route) => {
  await route.fulfill({
    status: 500,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-private-network": "true",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ ok: false, error: "connect test should use SSE first" }),
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
  await page.fill("#bridgeTikTokIdInput", "@connect_user!");
  await page.fill("#bridgeUrlInput", bridgeUrl);
  await page.click("#bridgeConnectBtn");
  await page.waitForFunction(() => window.__terminalLiveMessages.length > 0, null, { timeout: 5000 });
  await page.click("#bridgeStopBtn");

  const observed = await page.evaluate((key) => {
    return {
      messages: window.__terminalLiveMessages,
      streams: window.__terminalLiveStreams,
      streamClosed: window.__terminalLiveStreamClosed,
      stored: localStorage.getItem(key),
      tiktokId: document.querySelector("#bridgeTikTokIdInput")?.value || "",
      status: document.querySelector("#status")?.textContent || "",
      bridgeChip: document.querySelector("#bridgeChip")?.textContent || "",
    };
  }, storageKey);

  assert(connectRequests.length === 1, "Expected one /connect request", { connectRequests });
  assert(connectRequests[0].method === "POST", "Connect request should be POST", connectRequests[0]);
  assert(connectRequests[0].postData.username === "connect_user", "TikTok ID should be sanitized before /connect", connectRequests[0]);
  assert(observed.tiktokId === "connect_user", "TikTok ID input should be normalized", observed);
  assert(observed.streams.length === 1 && observed.streams[0] === `${bridgeUrl}/stream`, "Connect should start the SSE bridge stream", observed);
  assert(observed.streamClosed === 1, "Stop should close the SSE stream", observed);
  assert(observed.messages.length === 1, "Expected one live event envelope from SSE after connect", observed);
  assert(observed.messages[0].name === channel, "BroadcastChannel used the wrong channel", observed.messages[0]);

  const payload = observed.messages[0].payload;
  assert(payload.source === "stream-raid-terminal", "Connect envelope source mismatch", payload);
  assert(payload.channel === channel, "Connect envelope channel mismatch", payload);
  assert(Array.isArray(payload.events) && payload.events.length === 1, "Connect envelope should contain one event", payload);
  assert(payload.events[0].id === "bridge-451", "Connect event id mismatch", payload.events[0]);
  assert(payload.events[0].eventType === "gift", "Connect event type mismatch", payload.events[0]);
  assert(payload.events[0].sender === "connect_alice", "Connect sender mismatch", payload.events[0]);
  assert(payload.events[0].giftName === "Connect Rose", "Connect gift label mismatch", payload.events[0]);
  assert(payload.events[0].diamondCount === 33, "Connect diamonds mismatch", payload.events[0]);
  assert(payload.bridgeCursor === 451, "Connect cursor mismatch", payload);

  const stored = JSON.parse(observed.stored);
  assert(stored.channel === channel && stored.events[0].id === "bridge-451", "localStorage should hold connect event", stored);
  assert(observed.bridgeChip.includes("停止中"), "Stop button did not update bridge status", observed);
  assert(errors.length === 0, "Browser emitted errors", { errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        helperUrl,
        channel,
        connectRequests,
        streams: observed.streams,
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
