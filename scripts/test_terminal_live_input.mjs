import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.LIVE_TERMINAL_INPUT_URL || "http://127.0.0.1:5173?seed=terminal-live-input";
const channel = process.env.LIVE_TERMINAL_INPUT_CHANNEL || `stream-raid-live-test-${Date.now()}`;
let outDir = path.resolve(process.env.LIVE_TERMINAL_INPUT_OUT_DIR || "output/stream-raid-terminal-live-input");
const storageKey = "stream_raid_terminal_event_v1";

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
  fail(`Timed out waiting for ${label}`, { state: current });
}

async function streamStatus(page) {
  return page.locator("#streamHookStatus").textContent();
}

function envelope(event) {
  return {
    source: "stream-raid-terminal",
    event,
  };
}

function gift(id, sender, diamonds) {
  return {
    id,
    eventType: "gift",
    sender,
    giftName: "Terminal Input Test",
    diamondCount: diamonds,
  };
}

async function assertGiftApplied(page, before, expectedDelta, sourceLabel) {
  const after = await waitFor(
    page,
    (s) => s.economy.diamonds >= before.economy.diamonds + expectedDelta,
    `${sourceLabel} live event application`,
    5000
  );
  const status = await streamStatus(page);
  if (!String(status || "").includes(sourceLabel)) {
    fail("Terminal status did not report the expected source", { sourceLabel, status, after });
  }
  return after;
}

async function sendPostMessage(page, event) {
  await page.evaluate((payload) => {
    window.postMessage(payload, window.location.origin);
  }, envelope(event));
}

async function sendBroadcastChannel(page, event) {
  await page.evaluate(
    ({ channelName, payload }) => {
      if (typeof BroadcastChannel === "undefined") throw new Error("BroadcastChannel is not available");
      const outbound = new BroadcastChannel(channelName);
      outbound.postMessage(payload);
      setTimeout(() => outbound.close(), 50);
    },
    { channelName: channel, payload: envelope(event) }
  );
}

async function sendCustomEvent(page, event) {
  await page.evaluate((payload) => {
    window.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: payload }));
  }, envelope(event));
}

async function sendStorage(context, event) {
  const storagePage = await context.newPage();
  try {
    await storagePage.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await storagePage.evaluate(
      ({ key, payload }) => {
        localStorage.setItem(key, JSON.stringify(payload));
      },
      { key: storageKey, payload: envelope(event) }
    );
  } finally {
    await storagePage.close();
  }
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch {
  outDir = path.resolve(`/private/tmp/stream-raid-terminal-live-input-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const context = await browser.newContext({ viewport: { width: 932, height: 430 } });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && typeof window.advanceTime === "function", null, {
    timeout: 10000,
  });

  await page.click("#startBtn");
  await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "fighting", "fighting wave");

  await page.click("#menuFloatingBtn");
  await page.click("#openTikTokSettingsBtn");
  await page.fill("#terminalChannelInput", channel);
  await page.click("#connectTikTokBtn");
  const connectedStatus = await streamStatus(page);
  if (!String(connectedStatus || "").includes(channel)) {
    fail("Terminal input did not connect to the configured channel", { channel, connectedStatus });
  }
  await page.click("#closeMenuBtn");
  let current = await waitFor(
    page,
    (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "fighting",
    "fighting wave after terminal setup"
  );

  await sendPostMessage(page, gift("terminal-post-message-1", "terminal_post", 7));
  current = await assertGiftApplied(page, current, 7, "postMessage");

  await sendBroadcastChannel(page, gift("terminal-broadcast-1", "terminal_broadcast", 11));
  current = await assertGiftApplied(page, current, 11, "broadcast");

  await sendCustomEvent(page, gift("terminal-custom-event-1", "terminal_custom", 13));
  current = await assertGiftApplied(page, current, 13, "customEvent");

  await sendStorage(context, gift("terminal-storage-1", "terminal_storage", 17));
  current = await assertGiftApplied(page, current, 17, "storage");

  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(current, null, 2));
  if (errors.length) fail("Browser emitted errors", { errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        channel,
        final_diamonds: current.economy.diamonds,
        live_queue: current.run.live_queue,
        status: await streamStatus(page),
        artifacts: outDir,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
