import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const helperUrl = pathToFileURL(path.resolve("public/terminal-live.html")).toString();
const channel = `stream-raid-live-helper-${Date.now()}`;
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
  window.__terminalLiveClosed = 0;
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
  Object.defineProperty(window, "BroadcastChannel", {
    configurable: true,
    value: StubBroadcastChannel,
  });
  Object.defineProperty(window, "EventSource", {
    configurable: true,
    value: undefined,
  });
});

await context.route("http://127.0.0.1:8091/events**", async (route) => {
  const url = new URL(route.request().url());
  const since = url.searchParams.get("since");
  const max = url.searchParams.get("max");
  requests.push({
    since,
    max,
  });
  const isSync = since === "0" && max === "1";
  const events = isSync
    ? [
        {
          id: 100,
          source: "tiktok-live",
          type: "gift",
          sender: "old_live",
          giftName: "Old Rose",
          diamonds: 9,
          receivedAt: 1709999999000,
        },
      ]
    : [
        {
          id: 103,
          source: "tiktok-live",
          type: "gift",
          sender: "alice_live",
          giftName: "Rose",
          diamonds: 15,
          receivedAt: 1710000000000,
        },
        {
          id: 104,
          source: "tiktok-live",
          type: "like",
          sender: "bob_live",
          giftName: "like",
          diamonds: 1,
          receivedAt: 1710000000100,
        },
      ];
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
      cursor: isSync ? 102 : 104,
      connector: { connected: true, username: "demo_live" },
      events,
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
      closed: window.__terminalLiveClosed,
      stored: localStorage.getItem(key),
      status: document.querySelector("#status")?.textContent || "",
      bridgeChip: document.querySelector("#bridgeChip")?.textContent || "",
    };
  }, storageKey);

  assert(requests.length >= 2, "Bridge /events should sync cursor then poll new events", { requests });
  assert(requests[0].since === "0", "Initial bridge sync should start at cursor 0", { requests });
  assert(requests[0].max === "1", "Initial bridge sync should fetch one event only", { requests });
  assert(requests[1].since === "102", "Polling should resume from synced bridge cursor", { requests });
  assert(requests[1].max === "100", "Bridge request should cap each poll at 100 events", { requests });
  assert(observed.messages.length === 1, "Expected one BroadcastChannel bridge envelope", observed);
  assert(observed.messages[0].name === channel, "BroadcastChannel used the wrong channel", observed.messages[0]);

  const payload = observed.messages[0].payload;
  assert(payload.source === "stream-raid-terminal", "Bridge envelope source was not terminal", payload);
  assert(payload.channel === channel, "Bridge envelope channel mismatch", payload);
  assert(Array.isArray(payload.events) && payload.events.length === 2, "Bridge envelope should contain two events", payload);
  assert(payload.events[0].id === "bridge-103", "Bridge event id was not normalized", payload.events[0]);
  assert(payload.events[0].eventType === "gift", "Gift event type was not preserved", payload.events[0]);
  assert(payload.events[0].sender === "alice_live", "Gift sender was not preserved", payload.events[0]);
  assert(payload.events[0].giftName === "Rose", "Gift label was not preserved", payload.events[0]);
  assert(payload.events[0].diamondCount === 15, "Gift diamonds were not preserved", payload.events[0]);
  assert(payload.events[1].eventType === "like", "Like event type was not preserved", payload.events[1]);
  assert(payload.bridgeCursor === 104, "Bridge cursor was not attached to envelope", payload);

  const stored = JSON.parse(observed.stored);
  assert(stored.source === "stream-raid-terminal", "localStorage envelope source mismatch", stored);
  assert(stored.channel === channel, "localStorage envelope channel mismatch", stored);
  assert(stored.events.length === 2, "localStorage envelope did not include bridge events", stored);
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
      2
    )
  );
} finally {
  await browser.close();
}
