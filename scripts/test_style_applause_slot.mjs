import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.STYLE_APPLAUSE_SLOT_URL || "http://127.0.0.1:5173?seed=style-applause-slot&admin=1";
let outDir = path.resolve(process.env.STYLE_APPLAUSE_SLOT_OUT_DIR || "output/stream-raid-style-applause-slot");

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function cleanDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    if (!error || error.code !== "EPERM") throw error;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function parseState(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail("render_game_to_text returned invalid JSON", { error: String(error), text });
  }
}

async function state(page) {
  return parseState(await page.evaluate(() => window.render_game_to_text()));
}

async function advance(page, ms) {
  return parseState(await page.evaluate((value) => window.advanceTime(value), ms));
}

try {
  cleanDir(outDir);
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.join("/private/tmp", `stream-raid-style-applause-slot-${Date.now()}`);
  cleanDir(outDir);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && window.__OVERDRIVE__?.sim, null, { timeout: 10000 });
  await page.click("#startBtn");
  await advance(page, 180);

  const style = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.spawnEnemy !== "function" || typeof sim.killEnemy !== "function") throw new Error("style hooks unavailable");
    sim.waveState = "fighting";
    sim.enemies.length = 0;
    for (let i = 0; i < 5; i += 1) {
      sim.spawnEnemy(i % 2 === 0, false);
      const enemy = sim.enemies[sim.enemies.length - 1];
      enemy.x = sim.player.x + 62 + i * 4;
      enemy.y = sim.player.y;
      enemy.score = 120 + i * 20;
      sim.nunchaku.speed = 520;
      sim.killEnemy(enemy);
      sim.enemies = sim.enemies.filter((entry) => entry.id !== enemy.id);
    }
    dom?.sync?.();
    return JSON.parse(window.render_game_to_text()).combat.style;
  });
  if (!style || style.multiplier <= 1.1 || style.kill_chain < 5 || style.bonus_score <= 0 || style.rank === "D") {
    fail("Style meter did not build from fast chained kills", { style });
  }

  const afterDecay = await advance(page, 12000);
  if ((afterDecay.combat.style?.multiplier || 1) > 1.05 || afterDecay.combat.style?.rank !== "D") {
    fail("Style meter did not reset after reaching zero", { afterDecay: afterDecay.combat.style });
  }

  const beforeApplause = await state(page);
  for (let i = 0; i < 6; i += 1) {
    await page.evaluate((index) => window.injectTikfinityEvent({ id: `applause-like-${index}`, eventType: "like", sender: "like_viewer", diamondCount: 250 }), i);
  }
  await page.evaluate(() => window.injectTikfinityEvent({ id: "applause-chat-1", eventType: "chat", sender: "chat_viewer", label: "go", diamondCount: 20 }));
  await page.evaluate(() => window.injectTikfinityEvent({ id: "applause-share-1", eventType: "share", sender: "share_viewer", label: "share", diamondCount: 20 }));
  const applauseReady = await state(page);
  if (
    applauseReady.run.live_applause_fever_ready !== true ||
    (applauseReady.run.live_pending_surges || 0) < 1 ||
    (applauseReady.run.live_applause_wave_gain || 0) < (beforeApplause.run.live_applause_gauge_max || 100)
  ) {
    fail("Applause gauge did not reserve fever from like/comment/share", { beforeApplause, applauseReady });
  }
  const expectedNextCap = Math.ceil(applauseReady.run.live_applause_wave_gain * 1.2);
  const fever = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    sim.startWave(sim.wave + 1);
    dom?.sync?.();
    return JSON.parse(window.render_game_to_text());
  });
  if (
    fever.run.live_applause_fever_active !== true ||
    fever.run.live_applause_wave_gain !== 0 ||
    fever.run.live_wave_score_bonus <= 0 ||
    fever.run.live_wave_drop_bonus <= 0 ||
    Math.abs(fever.run.live_applause_gauge_max - expectedNextCap) > 1
  ) {
    fail("Applause fever did not fire at the next wave head with dynamic cap", { applauseReady, fever, expectedNextCap });
  }

  const slot = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.spawnDrop !== "function" || typeof sim.collectDrop !== "function") throw new Error("slot hooks unavailable");
    sim.pauseMode = null;
    sim.waveState = "reward";
    sim.spawnDrop(sim.player.x, sim.player.y, "item");
    const drop = sim.drops.find((entry) => entry.kind === "item" && entry.item);
    if (!drop) throw new Error("item drop unavailable");
    const originalNext = sim.rng.next.bind(sim.rng);
    let forcedOutcome = true;
    sim.rng.chance = () => true;
    sim.rng.next = () => {
      if (!forcedOutcome) return originalNext();
      forcedOutcome = false;
      return 0.99;
    };
    sim.collectDrop(drop);
    sim.drops = sim.drops.filter((entry) => entry.id !== drop.id);
    dom?.sync?.();
    return {
      state: JSON.parse(window.render_game_to_text()),
      hidden: document.querySelector("#slotEffectStage")?.classList.contains("hidden"),
      reels: document.querySelectorAll(".slot-effect-reel").length,
      result: document.querySelector("#slotEffectResult")?.textContent || "",
    };
  });
  if (!slot.state.inventory.slot_event || slot.hidden || slot.reels !== 3 || !slot.result) {
    fail("Slot effect did not render during pickup compare", { slot });
  }
  await advance(page, 1700);
  const settled = await page.evaluate(() => ({
    settled: document.querySelector("#slotEffectStage")?.classList.contains("settled"),
    result: document.querySelector("#slotEffectResult")?.textContent || "",
  }));
  if (!settled.settled || !settled.result.includes("レジェンダリー")) {
    fail("Slot effect did not settle into jackpot result", { settled });
  }

  const finalState = await state(page);
  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(finalState, null, 2));
  fs.writeFileSync(path.join(outDir, "style.json"), JSON.stringify({ style, afterDecay: afterDecay.combat.style }, null, 2));
  fs.writeFileSync(path.join(outDir, "applause.json"), JSON.stringify({ applauseReady, fever }, null, 2));
  fs.writeFileSync(path.join(outDir, "slot.json"), JSON.stringify({ slot, settled }, null, 2));
  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(JSON.stringify({ result: "ok", url, style, expectedNextCap, slot: slot.state.inventory.slot_event, artifacts: outDir }, null, 2));
} finally {
  await browser.close();
}
