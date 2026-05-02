import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.NUNCHAKU_INERTIA_URL || "http://127.0.0.1:5173?seed=nunchaku-inertia";
let outDir = path.resolve(process.env.NUNCHAKU_INERTIA_OUT_DIR || "output/stream-raid-nunchaku-inertia");

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

function finiteNunchaku(snapshot, label) {
  const n = snapshot.nunchaku;
  if (!Number.isFinite(n.x) || !Number.isFinite(n.y) || !Number.isFinite(n.vx) || !Number.isFinite(n.vy) || !Number.isFinite(n.speed)) {
    fail(`${label}: nunchaku state is not finite`, { snapshot });
  }
}

function tetherDistance(snapshot) {
  return Math.hypot(Number(snapshot.nunchaku.x) - Number(snapshot.player.x), Number(snapshot.nunchaku.y) - Number(snapshot.player.y));
}

try {
  cleanDir(outDir);
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.join("/private/tmp", `stream-raid-nunchaku-inertia-${Date.now()}`);
  cleanDir(outDir);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.click("#startBtn");
  await advance(page, 160);

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    if (!sim) throw new Error("GameSim unavailable");
    sim.enemies.length = 0;
    sim.waveState = "fighting";
    sim.input.left = false;
    sim.input.right = false;
    sim.input.up = false;
    sim.input.down = false;
    sim.input.pointerActive = false;
  });

  const idleStart = await advance(page, 900);
  finiteNunchaku(idleStart, "idleStart");
  if (idleStart.nunchaku.speed > 95) {
    fail("Nunchaku spins too fast while the player is idle", { idleStart });
  }

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    sim.input.right = true;
  });
  const moving = await advance(page, 900);
  finiteNunchaku(moving, "moving");
  if (moving.nunchaku.speed <= idleStart.nunchaku.speed + 22) {
    fail("Player movement did not inject visible inertia into the nunchaku", { idleStart, moving });
  }
  if (tetherDistance(moving) < moving.nunchaku.rest_length * 0.58) {
    fail("Moving nunchaku collapsed too close to the player", { moving, tetherDistance: tetherDistance(moving) });
  }
  const movingTetherDistance = tetherDistance(moving);

  const speedBeforeRetether = moving.nunchaku.speed;
  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    sim.applySkill("reach", "skill");
  });
  const afterReach = await advance(page, 120);
  finiteNunchaku(afterReach, "afterReach");
  if (afterReach.nunchaku.speed < speedBeforeRetether * 0.45) {
    fail("Reach upgrade wiped out nunchaku inertia", { moving, afterReach });
  }
  if (Math.abs(tetherDistance(afterReach) - movingTetherDistance) > 18) {
    fail("Reach upgrade snapped the nunchaku to a different orbit", { moving, afterReach, movingTetherDistance, afterReachTetherDistance: tetherDistance(afterReach) });
  }

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    sim.input.right = false;
    sim.input.left = true;
  });
  const reversed = await advance(page, 700);
  finiteNunchaku(reversed, "reversed");
  const velocityDelta = Math.hypot(reversed.nunchaku.vx - moving.nunchaku.vx, reversed.nunchaku.vy - moving.nunchaku.vy);
  if (velocityDelta < 28) {
    fail("Reversing movement did not alter nunchaku inertia enough", { moving, reversed, velocityDelta });
  }

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    sim.input.left = false;
    sim.applySkill("clone", "skill");
  });
  const phantomIdle = await advance(page, 500);
  const firstPhantomIdle = phantomIdle.phantoms[0];
  if (!firstPhantomIdle) fail("Clone skill did not create a phantom nunchaku", { phantomIdle });
  if (!Number.isFinite(firstPhantomIdle.vx) || !Number.isFinite(firstPhantomIdle.vy) || !Number.isFinite(firstPhantomIdle.speed)) {
    fail("Phantom nunchaku state is not finite", { firstPhantomIdle });
  }

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    sim.input.up = true;
  });
  const phantomMoving = await advance(page, 850);
  const firstPhantomMoving = phantomMoving.phantoms[0];
  if (!firstPhantomMoving) fail("Phantom nunchaku disappeared during movement", { phantomMoving });
  if (firstPhantomMoving.speed <= firstPhantomIdle.speed + 10) {
    fail("Phantom nunchaku did not respond to player movement", { firstPhantomIdle, firstPhantomMoving });
  }

  fs.writeFileSync(path.join(outDir, "state-idle.json"), JSON.stringify(idleStart, null, 2));
  fs.writeFileSync(path.join(outDir, "state-moving.json"), JSON.stringify(moving, null, 2));
  fs.writeFileSync(path.join(outDir, "state-reversed.json"), JSON.stringify(reversed, null, 2));
  fs.writeFileSync(path.join(outDir, "state-phantom-moving.json"), JSON.stringify(phantomMoving, null, 2));
  await page.screenshot({ path: path.join(outDir, "page.png"), fullPage: true });
  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(
    JSON.stringify(
      {
        result: "ok",
        idle_speed: idleStart.nunchaku.speed,
        moving_speed: moving.nunchaku.speed,
        reversed_delta: velocityDelta,
        phantom_idle_speed: firstPhantomIdle.speed,
        phantom_moving_speed: firstPhantomMoving.speed,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
