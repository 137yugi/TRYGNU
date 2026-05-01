import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.LIVE_QUEUE_URL || "http://127.0.0.1:5173?seed=live-queue";
const outDir = path.resolve("output/stream-raid-live-queue");

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

function envelope(event) {
  return { source: "stream-raid-terminal", event };
}

async function inject(page, payload) {
  return page.evaluate((terminalPayload) => window.receiveTerminalLiveEvent(terminalPayload), envelope(payload));
}

async function injectRaw(page, payload) {
  return page.evaluate((terminalPayload) => window.receiveTerminalLiveEvent(terminalPayload), payload);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.click("#startBtn");
  await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "fighting", "fighting wave");

  const offBefore = await state(page);
  const offIgnored = await inject(page, { id: "off-gift-1", sender: "off_user", giftName: "Rose", diamondCount: 99 });
  const offAfter = await state(page);
  if (offIgnored !== 0 || offAfter.economy.diamonds !== offBefore.economy.diamonds) {
    fail("Terminal API accepted an event while terminal input was OFF", { offIgnored, offBefore, offAfter });
  }

  await page.click("#menuFloatingBtn");
  await page.click("#openTikTokSettingsBtn");
  await page.click("#connectTikTokBtn");
  const wrongSource = await injectRaw(page, {
    source: "stream-raid-live",
    event: { id: "wrong-source-1", sender: "wrong_source", giftName: "Rose", diamondCount: 77 },
  });
  const afterWrongSource = await state(page);
  if (wrongSource !== 0 || afterWrongSource.run.live_queue !== 0 || afterWrongSource.economy.diamonds !== offAfter.economy.diamonds) {
    fail("Terminal API accepted an event with a non-contract source", { wrongSource, offAfter, afterWrongSource });
  }
  const queued = await inject(page, { id: "queue-gift-1", sender: "queue_user", giftName: "Rose", diamondCount: 20 });
  const duplicateQueued = await inject(page, { id: "queue-gift-1", sender: "queue_user", giftName: "Rose", diamondCount: 20 });
  const paused = await state(page);
  if (queued !== 1 || duplicateQueued !== 1) fail("Terminal input should receive both queued payload attempts", { queued, duplicateQueued, paused });
  if (paused.run.live_queue !== 1) fail("Paused live event was not queued exactly once", { paused });

  const diamondsBeforeRelease = paused.economy.diamonds;
  await page.click("#closeMenuBtn");
  const early = await advance(page, 1000);
  if (early.run.live_queue !== 1 || early.economy.diamonds !== diamondsBeforeRelease) {
    fail("Queued live event released before delay", { early, diamondsBeforeRelease });
  }

  const released = await waitFor(
    page,
    (s) => s.run.live_queue === 0 && s.economy.diamonds >= diamondsBeforeRelease + 20,
    "queued live event release",
    6000
  );

  const immediate = await inject(page, { id: "run-gift-1", sender: "run_user", giftName: "Galaxy", diamondCount: 30 });
  const afterImmediate = await state(page);
  const duplicateImmediate = await inject(page, { id: "run-gift-1", sender: "run_user", giftName: "Galaxy", diamondCount: 30 });
  const afterDuplicate = await state(page);
  if (immediate !== 1) fail("Running terminal event should be received", { immediate, afterImmediate });
  if (afterImmediate.economy.diamonds < released.economy.diamonds + 30) {
    fail("Running terminal event did not apply immediately", { released, immediate, afterImmediate });
  }
  if (duplicateImmediate !== 1 || afterDuplicate.economy.diamonds !== afterImmediate.economy.diamonds) {
    fail("Duplicate running live event changed state", { duplicateImmediate, afterImmediate, afterDuplicate });
  }

  const ad = await inject(page, { id: "run-ad-1", type: "ad_obstacle", sender: "sponsor", label: "ad banner", diamondCount: 12 });
  const afterAd = await advance(page, 180);
  if (ad !== 1) fail("Running ad terminal event should be received", { ad, afterAd });
  if (afterAd.run.active_ads.length + afterAd.run.ad_queue.length < 1) fail("Ad live event did not enqueue or spawn an ad", { afterAd });

  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(afterAd, null, 2));
  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        queued_release_diamonds: released.economy.diamonds,
        final_diamonds: afterAd.economy.diamonds,
        active_ads: afterAd.run.active_ads.length,
        ad_queue: afterAd.run.ad_queue.length,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
