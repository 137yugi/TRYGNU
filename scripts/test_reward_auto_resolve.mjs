import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.REWARD_AUTO_URL || "http://127.0.0.1:5173?seed=reward-auto-resolve";
let outDir = path.resolve(process.env.REWARD_AUTO_OUT_DIR || "output/stream-raid-reward-auto-resolve");

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
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

async function waitFor(page, predicate, label, timeoutMs = 7000) {
  const start = Date.now();
  let current = await state(page);
  while (Date.now() - start < timeoutMs) {
    if (predicate(current)) return current;
    current = await advance(page, 120);
  }
  fail(`Timed out waiting for ${label}`, { state: current });
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch {
  outDir = path.resolve(`/private/tmp/stream-raid-reward-auto-resolve-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
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
  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && typeof window.advanceTime === "function", null, {
    timeout: 10000,
  });
  await page.click("#startBtn");
  await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null, "running state");

  const levelOpened = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.openLevelUp !== "function") throw new Error("openLevelUp hook unavailable");
    sim.openLevelUp();
    dom?.sync?.();
    return {
      choices: sim.levelChoices.length,
      timer: Number(sim.levelChoices.autoTimer || 0),
    };
  });
  if (levelOpened.choices < 1 || levelOpened.timer < 20) fail("Level auto timer did not initialize", { levelOpened });
  const levelState = await state(page);
  const skillCountBefore = levelState.combat.acquired_skills.length;
  if (levelState.pause_mode !== "levelup") fail("Level auto test did not enter levelup pause", { levelState });
  await advance(page, (levelOpened.timer + 0.8) * 1000);
  const afterLevel = await state(page);
  if (afterLevel.pause_mode === "levelup") fail("Level auto timer did not choose a skill", { afterLevel, levelOpened });
  if (afterLevel.combat.acquired_skills.length <= skillCountBefore) {
    fail("Level auto timer did not add a skill", { before: levelState, afterLevel });
  }

  const pickupOpened = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.spawnDrop !== "function") throw new Error("spawnDrop hook unavailable");
    sim.pauseMode = null;
    sim.waveState = "reward";
    sim.drops.length = 0;
    sim.spawnDrop(sim.player.x, sim.player.y, "legendary");
    dom?.sync?.();
    return true;
  });
  if (!pickupOpened) fail("Pickup setup failed");
  await advance(page, 120);
  const pickupState = await waitFor(page, (s) => s.pause_mode === "pickup_compare", "pickup compare");
  const compare = pickupState.inventory.pickup_compare;
  if (!compare || compare.timer < 15) fail("Pickup auto timer did not initialize", { pickupState });
  const beforePower = pickupState.inventory.equipped_power;
  await advance(page, (compare.timer + 0.8) * 1000);
  const afterPickup = await state(page);
  if (afterPickup.pause_mode === "pickup_compare") fail("Pickup auto timer did not resolve compare", { afterPickup, compare });
  if (compare.delta_power >= 0 && afterPickup.inventory.equipped_power < beforePower) {
    fail("Pickup auto timer lost power on an upgrade", { beforePower, compare, afterPickup });
  }

  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(afterPickup, null, 2));
  if (errors.length) fail("Browser emitted errors", { errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        level_auto_timer: levelOpened.timer,
        pickup_auto_timer: compare.timer,
        acquired_skills: afterLevel.combat.acquired_skills.length,
        equipped_power_before: beforePower,
        equipped_power_after: afterPickup.inventory.equipped_power,
        artifacts: outDir,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
