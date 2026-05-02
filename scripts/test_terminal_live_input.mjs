import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.LIVE_TERMINAL_INPUT_URL || "http://127.0.0.1:5173?seed=terminal-live-input&admin=1";
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

async function waitForStreamStatus(page, sourceLabel, timeoutMs = 5000) {
  const start = Date.now();
  let status = await streamStatus(page);
  while (Date.now() - start < timeoutMs) {
    if (String(status || "").includes(sourceLabel)) return String(status || "");
    await advance(page, 120);
    status = await streamStatus(page);
  }
  fail("Terminal status did not report the expected source", { sourceLabel, status });
}

function envelope(event) {
  return {
    source: "stream-raid-terminal",
    channel,
    event,
  };
}

function liveEvent(id, eventType, sender, diamonds, label = "Terminal Input Test") {
  return {
    id,
    eventType,
    sender,
    giftName: label,
    label,
    diamondCount: diamonds,
  };
}

function gift(id, sender, diamonds) {
  return liveEvent(id, "gift", sender, diamonds);
}

function idlessGift(sender, diamonds, label = "ID-less Terminal Gift") {
  return {
    eventType: "gift",
    sender,
    giftName: label,
    label,
    diamondCount: diamonds,
  };
}

function adTotal(observed) {
  return Number(observed.run?.active_ads?.length || 0) + Number(observed.run?.ad_queue?.length || 0);
}

function isIgnorableConsoleError(text) {
  return String(text || "").includes("Failed to process file") && String(text || "").includes("arena_map");
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

async function assertKindApplied(page, before, event, sourceLabel, expectedKind, options = {}) {
  const after = await waitFor(
    page,
    (s) => s.run?.gift_event?.kind === expectedKind && s.run?.gift_event?.source === `LIVE ${event.sender}`,
    `${sourceLabel} ${event.eventType} live event application`,
    5000
  );
  const status = await streamStatus(page);
  if (!String(status || "").includes(sourceLabel)) {
    fail("Terminal status did not report the expected source", { sourceLabel, status, after });
  }
  if (after.economy.diamonds !== before.economy.diamonds) {
    fail(`${event.eventType} terminal event should not add gift diamonds`, { before, after, event });
  }
  if (options.energyShouldNotDrop && after.economy.demo_energy < before.economy.demo_energy) {
    fail("Follow terminal event should not reduce support energy", { before, after, event });
  }
  return after;
}

async function assertLikeApplied(page, before, event, sourceLabel) {
  await waitForStreamStatus(page, sourceLabel);
  const after = await state(page);
  if (
    after.economy.diamonds !== before.economy.diamonds ||
    after.run.enemies_alive !== before.run.enemies_alive ||
    after.drops.length !== before.drops.length ||
    adTotal(after) !== adTotal(before)
  ) {
    fail("Like terminal event should stay lightweight", { before, after, event });
  }
  return after;
}

async function assertAdObstacleApplied(page, before, event, expectedDelta, sourceLabel) {
  const adsBefore = adTotal(before);
  const after = await waitFor(
    page,
    (s) => s.economy.diamonds >= before.economy.diamonds + expectedDelta && adTotal(s) > adsBefore,
    `${sourceLabel} ad obstacle live event application`,
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
    window.dispatchEvent(new MessageEvent("message", { data: payload, origin: window.location.origin }));
  }, envelope(event));
}

async function sendPostMessageEnvelope(page, payload) {
  await page.evaluate((value) => {
    window.dispatchEvent(new MessageEvent("message", { data: value, origin: window.location.origin }));
  }, payload);
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

async function sendBroadcastEnvelope(page, payload) {
  await page.evaluate(
    ({ channelName, value }) => {
      if (typeof BroadcastChannel === "undefined") throw new Error("BroadcastChannel is not available");
      const outbound = new BroadcastChannel(channelName);
      outbound.postMessage(value);
      setTimeout(() => outbound.close(), 50);
    },
    { channelName: channel, value: payload }
  );
}

async function sendCustomEvent(page, event) {
  await page.evaluate((payload) => {
    window.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: payload }));
  }, envelope(event));
}

async function sendCustomEnvelope(page, payload) {
  await page.evaluate((value) => {
    window.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: value }));
  }, payload);
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
  if (message.type() === "error" && !isIgnorableConsoleError(message.text())) errors.push(message.text());
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

  await sendPostMessage(page, liveEvent("terminal-like-1", "like", "terminal_like", 9, "like tap"));
  current = await assertLikeApplied(page, current, liveEvent("terminal-like-1", "like", "terminal_like", 9, "like tap"), "postMessage");

  await sendCustomEvent(page, liveEvent("terminal-chat-1", "chat", "terminal_chat", 3, "hello arena"));
  current = await assertKindApplied(page, current, liveEvent("terminal-chat-1", "chat", "terminal_chat", 3, "hello arena"), "customEvent", "assault");

  await sendBroadcastChannel(page, liveEvent("terminal-follow-1", "follow", "terminal_follow", 4, "follow"));
  current = await assertKindApplied(page, current, liveEvent("terminal-follow-1", "follow", "terminal_follow", 4, "follow"), "broadcast", "surge", {
    energyShouldNotDrop: true,
  });

  await sendCustomEvent(page, liveEvent("terminal-share-1", "share", "terminal_share", 8, "share"));
  current = await assertKindApplied(page, current, liveEvent("terminal-share-1", "share", "terminal_share", 8, "share"), "customEvent", "treasure");

  await sendPostMessage(page, gift("terminal-post-message-1", "terminal_post", 7));
  current = await assertGiftApplied(page, current, 7, "postMessage");

  const beforeWrongChannel = await state(page);
  await page.evaluate((payload) => {
    window.dispatchEvent(new MessageEvent("message", { data: payload, origin: window.location.origin }));
  }, { ...envelope(gift("wrong-channel-1", "wrong_channel", 99)), channel: `${channel}-other` });
  const afterWrongChannel = await advance(page, 240);
  if (afterWrongChannel.economy.diamonds !== beforeWrongChannel.economy.diamonds || afterWrongChannel.run.live_queue !== beforeWrongChannel.run.live_queue) {
    fail("Terminal input accepted a mismatched channel payload", { channel, beforeWrongChannel, afterWrongChannel });
  }

  const idlessEnvelope = {
    source: "stream-raid-terminal",
    channel,
    nonce: `idless-dedupe-${Date.now()}`,
    event: idlessGift("terminal_idless", 19),
  };
  const beforeIdless = await state(page);
  await sendPostMessageEnvelope(page, idlessEnvelope);
  await sendCustomEnvelope(page, idlessEnvelope);
  await sendBroadcastEnvelope(page, idlessEnvelope);
  const afterIdlessOnce = await waitFor(
    page,
    (s) => s.economy.diamonds >= beforeIdless.economy.diamonds + 19,
    "id-less duplicate envelope first application",
    5000
  );
  const afterIdlessSettled = await advance(page, 700);
  if (afterIdlessSettled.economy.diamonds !== beforeIdless.economy.diamonds + 19) {
    fail("ID-less duplicate terminal envelope applied more than once", { beforeIdless, afterIdlessOnce, afterIdlessSettled });
  }

  const nextIdlessEnvelope = {
    ...idlessEnvelope,
    nonce: `${idlessEnvelope.nonce}-next`,
  };
  await sendPostMessageEnvelope(page, nextIdlessEnvelope);
  current = await assertGiftApplied(page, afterIdlessSettled, 19, "postMessage");

  await sendBroadcastChannel(page, gift("terminal-broadcast-1", "terminal_broadcast", 11));
  current = await assertGiftApplied(page, current, 11, "broadcast");

  await sendCustomEvent(page, gift("terminal-custom-event-1", "terminal_custom", 13));
  current = await assertGiftApplied(page, current, 13, "customEvent");

  await sendStorage(context, gift("terminal-storage-1", "terminal_storage", 17));
  current = await assertGiftApplied(page, current, 17, "storage");

  const adEvent = liveEvent("terminal-ad-1", "ad_obstacle", "terminal_ad", 5, "ad_obstacle banner");
  await sendBroadcastChannel(page, adEvent);
  current = await assertAdObstacleApplied(page, current, adEvent, 5, "broadcast");

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
