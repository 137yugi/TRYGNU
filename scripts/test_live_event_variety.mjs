import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.LIVE_VARIETY_URL || "http://127.0.0.1:5173?seed=live-variety";
let outDir = path.resolve(process.env.LIVE_VARIETY_OUT_DIR || "output/stream-raid-live-variety");

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function parseStateText(text, label = "render_game_to_text") {
  try {
    return JSON.parse(text);
  } catch (err) {
    fail(label + " returned invalid JSON", { error: String(err), text });
  }
}

async function state(page) {
  return parseStateText(await page.evaluate(() => window.render_game_to_text()));
}

async function advance(page, ms) {
  return parseStateText(await page.evaluate((value) => window.advanceTime(value), ms), "advanceTime");
}

async function waitFor(page, predicate, label, timeoutMs = 7000) {
  const start = Date.now();
  let current = await state(page);
  while (Date.now() - start < timeoutMs) {
    if (predicate(current)) return current;
    current = await advance(page, 120);
  }
  fail("Timed out waiting for " + label, { state: current });
}

async function inject(page, event) {
  const accepted = await page.evaluate((payload) => window.injectTikfinityEvent(payload), event);
  const observed = await state(page);
  if (accepted !== true) fail("Live event was not applied immediately", { event, accepted, observed });
  return observed;
}

function adTotal(observed) {
  return Number(observed.run?.active_ads?.length || 0) + Number(observed.run?.ad_queue?.length || 0);
}

function velocityDelta(a, b) {
  return Math.hypot(Number(a.nunchaku.vx) - Number(b.nunchaku.vx), Number(a.nunchaku.vy) - Number(b.nunchaku.vy));
}

function isIgnorableConsoleError(text) {
  return String(text || "").includes("Failed to process file") && String(text || "").includes("arena_map");
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch {
  outDir = path.resolve(`/private/tmp/stream-raid-live-variety-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
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
  const baseline = await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "fighting", "fighting wave");

  const afterLike = await inject(page, { id: "variety-like-1", eventType: "like", sender: "like_viewer", diamondCount: 9, label: "like burst" });
  if (afterLike.economy.diamonds !== baseline.economy.diamonds || afterLike.run.enemies_alive !== baseline.run.enemies_alive || adTotal(afterLike) !== adTotal(baseline)) {
    fail("Like event should stay cheap: no diamonds, enemies, or ads", { baseline, afterLike });
  }
  if (velocityDelta(baseline, afterLike) < 0.5) fail("Like event did not nudge nunchaku motion", { baseline, afterLike });

  const burstAccepted = await page.evaluate(() => {
    let count = 0;
    for (let i = 0; i < 24; i += 1) {
      if (window.injectTikfinityEvent({ id: `variety-like-burst-${i}`, eventType: "like", sender: "like_burst", diamondCount: 1, label: "like tap" })) count += 1;
    }
    return count;
  });
  const afterLikeBurst = await state(page);
  if (burstAccepted !== 24) fail("Like burst did not apply every unique event", { burstAccepted, afterLikeBurst });
  if (
    afterLikeBurst.economy.diamonds !== afterLike.economy.diamonds ||
    afterLikeBurst.run.enemies_alive !== afterLike.run.enemies_alive ||
    afterLikeBurst.drops.length !== afterLike.drops.length ||
    adTotal(afterLikeBurst) !== adTotal(afterLike)
  ) {
    fail("High-frequency likes created expensive gameplay objects", { afterLike, afterLikeBurst });
  }
  if (
    (afterLikeBurst.run.live_pending_surges || 0) < 1 ||
    afterLikeBurst.run.live_applause_fever_ready !== true ||
    (afterLikeBurst.run.live_applause_wave_gain || 0) < (afterLikeBurst.run.live_applause_gauge_max || 100)
  ) {
    fail("High-frequency likes did not fill and reserve the next-wave applause fever gauge", { afterLikeBurst });
  }

  const afterChat = await inject(page, { id: "variety-chat-1", eventType: "chat", sender: "chat_viewer", diamondCount: 3, label: "hello arena" });
  if (
    afterChat.economy.diamonds !== afterLikeBurst.economy.diamonds ||
    afterChat.run.gift_event?.kind !== "assault" ||
    afterChat.run.gift_event?.source !== "LIVE chat_viewer"
  ) {
    fail("Chat event should create an audience raid banner without gift diamonds", { afterLikeBurst, afterChat });
  }
  if ((afterChat.run.live_applause_wave_gain || 0) <= (afterLikeBurst.run.live_applause_wave_gain || 0)) {
    fail("Comment event did not add to the per-wave applause measurement", { afterLikeBurst, afterChat });
  }

  const afterFollow = await inject(page, { id: "variety-follow-1", eventType: "follow", sender: "follow_viewer", diamondCount: 4, label: "follow" });
  if (
    afterFollow.economy.demo_energy < afterChat.economy.demo_energy ||
    afterFollow.economy.diamonds !== afterChat.economy.diamonds ||
    afterFollow.run.gift_event?.kind !== "surge" ||
    afterFollow.run.gift_event?.source !== "LIVE follow_viewer"
  ) {
    fail("Follow event should grant support without gift diamonds", { afterChat, afterFollow });
  }
  if ((afterFollow.run.live_pending_bosses || 0) < 1) {
    fail("Follow event did not reserve a next-wave boss", { afterChat, afterFollow });
  }

  const afterShare = await inject(page, { id: "variety-share-1", eventType: "share", sender: "share_viewer", diamondCount: 8, label: "share wave" });
  if (
    afterShare.drops.length <= afterFollow.drops.length ||
    afterShare.economy.diamonds !== afterFollow.economy.diamonds ||
    afterShare.run.gift_event?.kind !== "treasure" ||
    afterShare.run.gift_event?.source !== "LIVE share_viewer"
  ) {
    fail("Share event should create a supply drop without gift diamonds", { afterFollow, afterShare });
  }
  if ((afterShare.run.live_applause_wave_gain || 0) <= (afterChat.run.live_applause_wave_gain || 0)) {
    fail("Share event did not add to the per-wave applause measurement", { afterChat, afterShare });
  }

  const afterGift = await inject(page, { id: "variety-gift-1", eventType: "gift", sender: "gift_viewer", giftName: "Rose", diamondCount: 11 });
  if (afterGift.economy.diamonds < afterShare.economy.diamonds + 11) {
    fail("Gift event no longer applies gift economy", { afterShare, afterGift });
  }
  if (afterGift.run.live_applause_wave_gain !== afterShare.run.live_applause_wave_gain) {
    fail("Gift event should stay separate from the applause gauge", { afterShare, afterGift });
  }

  const adsBefore = adTotal(afterGift);
  const afterAd = await inject(page, { id: "variety-ad-1", eventType: "ad_obstacle", sender: "ad_viewer", diamondCount: 7, label: "ad_obstacle banner" });
  if (afterAd.economy.diamonds < afterGift.economy.diamonds + 7 || adTotal(afterAd) <= adsBefore) {
    fail("Ad obstacle event no longer applies existing ad behavior", { afterGift, afterAd, adsBefore, adsAfter: adTotal(afterAd) });
  }

  const beforeWaveHead = await state(page);
  const expectedNextApplauseCap = Math.ceil((beforeWaveHead.run.live_applause_wave_gain || 0) * 1.2);
  const waveHead = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim) throw new Error("GameSim unavailable");
    sim.startWave(sim.wave + 1);
    dom?.sync?.();
    return JSON.parse(window.render_game_to_text());
  });
  if (
    waveHead.run.live_pending_surges !== 0 ||
    waveHead.run.live_pending_bosses !== 0 ||
    waveHead.run.live_wave_surges < 1 ||
    waveHead.run.live_applause_fever_active !== true ||
    waveHead.run.live_applause_wave_gain !== 0 ||
    waveHead.run.live_applause_last_wave_gain !== beforeWaveHead.run.live_applause_wave_gain ||
    Math.abs(waveHead.run.live_applause_gauge_max - expectedNextApplauseCap) > 1 ||
    waveHead.run.enemies_alive < beforeWaveHead.run.enemies_alive + 12 ||
    waveHead.run.bosses_alive < beforeWaveHead.run.bosses_alive + 1 ||
    waveHead.run.live_wave_score_bonus <= 0 ||
    waveHead.run.live_wave_drop_bonus <= 0
  ) {
    fail("Next wave head did not spend live surge/boss reservations", { beforeWaveHead, waveHead });
  }

  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(waveHead, null, 2));
  if (errors.length) fail("Browser emitted errors", { errors, artifacts: outDir });
  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        like_pressure: afterLikeBurst.run.live_pressure,
        chat_enemies_delta: afterChat.run.enemies_alive - afterLikeBurst.run.enemies_alive,
        follow_energy_delta: afterFollow.economy.demo_energy - afterChat.economy.demo_energy,
        share_drop_delta: afterShare.drops.length - afterFollow.drops.length,
        gift_diamonds_delta: afterGift.economy.diamonds - afterShare.economy.diamonds,
        ad_total_delta: adTotal(afterAd) - adsBefore,
        pending_surges_spent: beforeWaveHead.run.live_pending_surges,
        pending_bosses_spent: beforeWaveHead.run.live_pending_bosses,
        wave_head_enemy_delta: waveHead.run.enemies_alive - beforeWaveHead.run.enemies_alive,
        wave_head_bosses: waveHead.run.bosses_alive,
        wave_head_score_bonus: waveHead.run.live_wave_score_bonus,
        wave_head_drop_bonus: waveHead.run.live_wave_drop_bonus,
        artifacts: outDir,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
