import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const inputUrl = process.env.BROWSER_RELAY_TEST_URL || "http://127.0.0.1:5173?seed=browser-live-relay";
const testUrl = new URL(inputUrl);
const useConfigRelay = process.env.BROWSER_RELAY_TEST_CONFIG !== "0";
const forceAdmin = process.env.BROWSER_RELAY_TEST_ADMIN === "1" || !useConfigRelay;
if (forceAdmin) testUrl.searchParams.set("admin", "1");
const url = testUrl.toString();
const channel = process.env.BROWSER_RELAY_TEST_CHANNEL || `stream-raid-relay-${Date.now()}`;
const expectedChannel = useConfigRelay ? "stream-raid-live-v1" : channel;
const room = process.env.BROWSER_RELAY_TEST_ROOM || "yrachac";
const relayTemplate = process.env.BROWSER_RELAY_TEST_WS || "wss://relay.example/tiktok/{room}?channel={channel}";
const viewportMatch = String(process.env.BROWSER_RELAY_TEST_VIEWPORT || "932x430").match(/^(\d+)x(\d+)$/);
const viewport = viewportMatch
  ? { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) }
  : { width: 932, height: 430 };
let outDir = path.resolve(process.env.BROWSER_RELAY_TEST_OUT_DIR || "output/stream-raid-browser-relay");

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function readStateText(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    fail("render_game_to_text returned invalid JSON", { error: String(err), text });
  }
}

async function state(page) {
  return readStateText(await page.evaluate(() => window.render_game_to_text()));
}

async function advance(page, ms) {
  return readStateText(await page.evaluate((value) => window.advanceTime(value), ms));
}

async function waitFor(page, predicate, label, timeoutMs = 7000) {
  const start = Date.now();
  let current = await state(page);
  while (Date.now() - start < timeoutMs) {
    if (predicate(current)) return current;
    current = await advance(page, 120);
  }
  fail(`Timed out waiting for ${label}`, { state: current, status: await streamStatus(page) });
}

async function streamStatus(page) {
  return page.locator("#streamHookStatus").textContent();
}

async function clickFirstVisible(page, selectors, label) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click();
      return selector;
    }
  }
  fail(`No visible control for ${label}`, { selectors });
}

async function waitForStatus(page, label, timeoutMs = 5000) {
  const start = Date.now();
  let status = await streamStatus(page);
  while (Date.now() - start < timeoutMs) {
    if (String(status || "").includes(label)) return String(status || "");
    await advance(page, 120);
    status = await streamStatus(page);
  }
  fail("Browser relay status did not update", { label, status });
}

async function emitRelay(page, payload) {
  await page.evaluate((value) => {
    const socket = window.__streamRaidFakeSockets?.find((entry) => String(entry.url || "").startsWith("wss://relay.example/"));
    if (!socket) throw new Error("fake relay socket was not created");
    socket.__emit(JSON.stringify(value));
  }, payload);
}

function isIgnorableConsoleError(text) {
  return String(text || "").includes("Failed to process file") && String(text || "").includes("arena_map");
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch {
  outDir = path.resolve(`/private/tmp/stream-raid-browser-relay-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const context = await browser.newContext({ viewport });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error" && !isIgnorableConsoleError(message.text())) errors.push(message.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

if (useConfigRelay) {
  await page.route("**/config/live-relay.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        enabled: true,
        browserRelayUrl: relayTemplate,
        statusLabel: "ライブ接続準備中",
      }),
    });
  });
}

await page.addInitScript(() => {
  localStorage.setItem("stream_raid_browser_relay_url_v1", "not-a-smart-connect-url");
  class FakeWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url) {
      this.url = String(url);
      this.readyState = FakeWebSocket.CONNECTING;
      this.sent = [];
      window.__streamRaidFakeSockets = window.__streamRaidFakeSockets || [];
      window.__streamRaidFakeSockets.push(this);
      setTimeout(() => {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.({ type: "open" });
      }, 0);
    }

    send(data) {
      this.sent.push(String(data));
    }

    close() {
      if (this.readyState === FakeWebSocket.CLOSED) return;
      this.readyState = FakeWebSocket.CLOSED;
      this.onclose?.({ type: "close" });
    }

    __emit(data) {
      this.onmessage?.({ data });
    }
  }
  window.WebSocket = FakeWebSocket;
});

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && typeof window.advanceTime === "function", null, {
    timeout: 10000,
  });

  await clickFirstVisible(page, ["#startBtn", "#mobileStartBtn"], "start");
  await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "fighting", "fighting wave");

  await clickFirstVisible(page, ["#menuFloatingBtn", "#mobileMenuBtn", "#openStartMenuBtn"], "menu");
  await page.click("#openTikTokSettingsBtn");
  await page.fill("#tiktokRoomInput", `@${room}`);
  if (useConfigRelay) {
    if (await page.locator("#browserRelayUrlInput").isVisible()) {
      fail("Browser relay URL input should be hidden in normal Smart Connect UI");
    }
    if (await page.locator("#terminalHelperLink").isVisible()) {
      fail("Terminal helper link should be hidden in normal Smart Connect UI");
    }
  } else {
    await page.fill("#browserRelayUrlInput", relayTemplate);
    await page.fill("#terminalChannelInput", channel);
  }
  await page.click("#connectTikTokBtn");
  await waitForStatus(page, "WSS接続中");

  const relayInfo = await page.evaluate(() => {
    const socket = window.__streamRaidFakeSockets?.find((entry) => String(entry.url || "").startsWith("wss://relay.example/"));
    return { url: socket?.url || "", sent: socket?.sent || [] };
  });
  if (!relayInfo.url.includes(encodeURIComponent(room)) || !relayInfo.url.includes(encodeURIComponent(expectedChannel))) {
    fail("Browser relay URL did not substitute room/channel placeholders", { relayTemplate, relayInfo });
  }
  if (!relayInfo.sent.some((message) => message.includes(room) && message.includes("subscribe"))) {
    fail("Browser relay did not send a subscribe hint", { relayInfo });
  }

  await page.click("#closeMenuBtn");
  let current = await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null, "running after relay setup");

  await emitRelay(page, {
    event: "like",
    data: {
      id: "relay-like-1",
      uniqueId: "relay_like",
      nickname: "Relay Like",
      likeCount: 18,
    },
  });
  await waitForStatus(page, "browserRelay");

  await emitRelay(page, {
    type: "gift",
    data: {
      id: "relay-gift-1",
      uniqueId: "relay_gift",
      nickname: "Relay Gift",
      giftName: "Rose",
      diamondCount: 9,
      repeatCount: 1,
    },
  });
  current = await waitFor(page, (s) => s.economy.diamonds >= current.economy.diamonds + 9, "browser relay gift");

  await emitRelay(page, {
    events: [
      {
        id: "relay-comment-1",
        eventType: "comment",
        sender: "relay_chat",
        comment: "fever",
        diamondCount: 4,
      },
      {
        id: "relay-share-1",
        eventType: "share",
        sender: "relay_share",
        label: "shared",
      },
    ],
  });
  await waitForStatus(page, "+2");

  const finalState = await state(page);
  const recent = finalState.run?.live_recent_events || [];
  if (!recent.some((event) => String(event.sender || "").includes("relay"))) {
    fail("Browser relay events were not visible in recent live events", { recent, finalState });
  }
  if (errors.length) fail("Browser emitted errors", { errors });

  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(finalState, null, 2));
  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        useConfigRelay,
        viewport,
        relayUrl: relayInfo.url,
        status: await streamStatus(page),
        diamonds: finalState.economy.diamonds,
        recent,
        artifacts: outDir,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
