import { chromium } from "playwright";

const helperUrl =
  process.env.ONLINE_TERMINAL_HELPER_URL || "https://137yugi.github.io/TRYGNU/terminal-live.html";
const channel = process.env.ONLINE_TERMINAL_HELPER_CHANNEL || `online-terminal-helper-${Date.now()}`;
const storageKey = "stream_raid_terminal_event_v1";
const channelKey = "stream_raid_terminal_channel_v1";

const expectedPresets = [
  { eventType: "like", label: "Like Tap", diamonds: 1, name: "like" },
  { eventType: "chat", label: "Chat Ping", diamonds: 1, name: "chat" },
  { eventType: "follow", label: "Follow Boost", diamonds: 5, name: "follow" },
  { eventType: "share", label: "Share Supply", diamonds: 8, name: "share" },
  { eventType: "gift", label: "Terminal Gift", diamonds: 15, name: "gift" },
  { eventType: "ad_obstacle", label: "Sponsor Jam", diamonds: 50, name: "ad_obstacle" },
];

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

function assertEqual(actual, expected, message, details = {}) {
  assert(Object.is(actual, expected), message, { actual, expected, ...details });
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const context = await browser.newContext();
const serverSideRequests = [];

await context.addInitScript(() => {
  window.__terminalLiveMessages = [];
  window.__terminalLiveClosed = 0;
  window.__terminalLiveEventSources = [];
  window.__terminalLiveFetches = [];

  const realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = (...args) => {
    const requestUrl = String(args[0] && args[0].url ? args[0].url : args[0]);
    window.__terminalLiveFetches.push(requestUrl);
    return realFetch(...args);
  };

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
      const requestUrl = String(url);
      window.__terminalLiveEventSources.push(requestUrl);
      throw new Error(`Unexpected EventSource request: ${requestUrl}`);
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

await context.route("**/*", async (route) => {
  const requestUrl = route.request().url();
  if (
    /\/(?:events|stream)(?:[?#]|$)/u.test(requestUrl) ||
    /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/)/u.test(requestUrl)
  ) {
    serverSideRequests.push(requestUrl);
    await route.abort("blockedbyclient");
    return;
  }
  await route.continue();
});

const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

try {
  await page.goto(helperUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForSelector("#presetButtons .preset", { timeout: 10000 });

  const loaded = await page.evaluate(() => {
    return {
      title: document.title,
      path: window.location.pathname,
      hasSend: Boolean(document.querySelector("#sendBtn")),
      hasBridge: Boolean(document.querySelector("#bridgeStartBtn")),
      hasBridgeConnect: Boolean(document.querySelector("#bridgeConnectBtn")),
      hasBridgeTikTokId: Boolean(document.querySelector("#bridgeTikTokIdInput")),
      presetCount: document.querySelectorAll("#presetButtons .preset").length,
      status: document.querySelector("#status")?.textContent || "",
    };
  });
  assert(loaded.title.includes("Terminal") || loaded.title.includes("端末"), "Helper title did not look like the terminal helper", loaded);
  assert(loaded.path.endsWith("/terminal-live.html"), "Helper did not load terminal-live.html", loaded);
  assert(loaded.hasSend, "Send button was missing", loaded);
  assert(loaded.hasBridge, "Bridge controls were missing", loaded);
  assert(loaded.hasBridgeConnect, "Bridge ID connect button was missing", loaded);
  assert(loaded.hasBridgeTikTokId, "Bridge TikTok ID input was missing", loaded);
  assertEqual(loaded.presetCount, expectedPresets.length, "Unexpected preset count", loaded);

  await page.fill("#channelInput", channel);
  await page.fill("#senderInput", "online_manual");

  const presetResults = [];
  for (const preset of expectedPresets) {
    await page.click(`#presetButtons .preset[data-event-type="${preset.eventType}"]`);
    const observed = await page.evaluate(() => {
      const previewText = document.querySelector("#preview")?.textContent || "{}";
      return {
        eventType: document.querySelector("#eventTypeInput")?.value || "",
        giftName: document.querySelector("#giftNameInput")?.value || "",
        diamonds: Number(document.querySelector("#diamondInput")?.value),
        status: document.querySelector("#status")?.textContent || "",
        pressed: document.querySelector(`#presetButtons .preset[aria-pressed="true"]`)?.dataset.eventType || "",
        preview: JSON.parse(previewText),
      };
    });
    presetResults.push(observed);
    assertEqual(observed.eventType, preset.eventType, `${preset.name} preset did not set event type`, observed);
    assertEqual(observed.giftName, preset.label, `${preset.name} preset did not set label`, observed);
    assertEqual(observed.diamonds, preset.diamonds, `${preset.name} preset did not set diamonds`, observed);
    assertEqual(observed.pressed, preset.eventType, `${preset.name} preset did not set pressed state`, observed);
    assert(observed.status.includes(`${preset.name} プリセット`), `${preset.name} preset did not update status`, observed);
    assertEqual(observed.preview.channel, channel, `${preset.name} preview channel mismatch`, observed.preview);
    assertEqual(observed.preview.event.eventType, preset.eventType, `${preset.name} preview event type mismatch`, observed.preview);
    assertEqual(observed.preview.event.giftName, preset.label, `${preset.name} preview label mismatch`, observed.preview);
    assertEqual(observed.preview.event.diamondCount, preset.diamonds, `${preset.name} preview diamonds mismatch`, observed.preview);
  }

  await page.fill("#eventIdInput", "online-manual-1");
  await page.selectOption("#eventTypeInput", "gift");
  await page.fill("#giftNameInput", "Online QA Gift");
  await page.fill("#diamondInput", "77");
  await page.click("#sendBtn");
  await page.waitForFunction(() => window.__terminalLiveMessages.length === 1, null, { timeout: 5000 });

  const observed = await page.evaluate(
    ({ storageKey: key, channelKey: storedChannelKey }) => {
      return {
        messages: window.__terminalLiveMessages,
        closed: window.__terminalLiveClosed,
        eventSources: window.__terminalLiveEventSources,
        fetches: window.__terminalLiveFetches,
        storedEnvelope: localStorage.getItem(key),
        storedChannel: localStorage.getItem(storedChannelKey),
        status: document.querySelector("#status")?.textContent || "",
        broadcastChip: document.querySelector("#broadcastChip")?.textContent || "",
        storageChip: document.querySelector("#storageChip")?.textContent || "",
        bridgeChip: document.querySelector("#bridgeChip")?.textContent || "",
        log: document.querySelector("#log")?.textContent || "",
      };
    },
    { storageKey, channelKey }
  );

  assertEqual(observed.messages.length, 1, "Manual send should publish one BroadcastChannel message", observed);
  assertEqual(observed.messages[0].name, channel, "BroadcastChannel used the wrong channel", observed.messages[0]);

  const payload = observed.messages[0].payload;
  assertEqual(payload.source, "stream-raid-terminal", "Manual envelope source mismatch", payload);
  assertEqual(payload.channel, channel, "Manual envelope channel mismatch", payload);
  assert(payload.event && typeof payload.event === "object", "Manual envelope missing event", payload);
  assertEqual(payload.event.id, "online-manual-1", "Manual event id mismatch", payload.event);
  assertEqual(payload.event.eventType, "gift", "Manual event type mismatch", payload.event);
  assertEqual(payload.event.sender, "online_manual", "Manual sender mismatch", payload.event);
  assertEqual(payload.event.giftName, "Online QA Gift", "Manual gift label mismatch", payload.event);
  assertEqual(payload.event.diamondCount, 77, "Manual diamonds mismatch", payload.event);
  assert(typeof payload.sentAt === "string" && payload.sentAt.length > 0, "Manual envelope missing sentAt", payload);
  assert(typeof payload.nonce === "string" && payload.nonce.length > 0, "Manual envelope missing nonce", payload);

  const stored = JSON.parse(observed.storedEnvelope);
  assertEqual(stored.source, payload.source, "localStorage source mismatch", stored);
  assertEqual(stored.channel, payload.channel, "localStorage channel mismatch", stored);
  assertEqual(stored.event.id, payload.event.id, "localStorage event id mismatch", stored);
  assertEqual(stored.event.giftName, payload.event.giftName, "localStorage event label mismatch", stored);
  assertEqual(stored.event.diamondCount, payload.event.diamondCount, "localStorage diamonds mismatch", stored);
  assertEqual(observed.storedChannel, channel, "Stored channel was not updated", observed);
  assert(observed.broadcastChip.includes(channel), "Broadcast chip did not show the channel", observed);
  assert(observed.storageChip.includes("送信"), "Storage chip did not show a sent state", observed);
  assert(observed.status.includes("Online QA Gift"), "Status did not summarize the manual send", observed);
  assert(observed.log.includes("online-manual-1"), "Log did not include the manual event id", observed);
  assert(observed.bridgeChip.includes("停止中"), "Bridge should remain stopped during manual send", observed);
  assertEqual(observed.eventSources.length, 0, "Manual send should not open EventSource", observed);
  assertEqual(observed.fetches.length, 0, "Manual send should not call fetch", observed);
  assertEqual(serverSideRequests.length, 0, "Manual helper QA should not hit bridge/server endpoints", {
    serverSideRequests,
  });
  assert(errors.length === 0, "Browser emitted errors", { errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        helperUrl,
        channel,
        presets_checked: presetResults.length,
        broadcast_messages: observed.messages.length,
        storage_event_id: stored.event.id,
        server_side_requests: serverSideRequests.length,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
