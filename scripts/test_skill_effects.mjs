import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.SKILL_EFFECTS_URL || "http://127.0.0.1:5173?seed=skill-effects";
let outDir = path.resolve(process.env.SKILL_EFFECTS_OUT_DIR || "output/stream-raid-skill-effects");

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
  outDir = path.join("/private/tmp", `stream-raid-skill-effects-${Date.now()}`);
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
  await advance(page, 120);

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.applySkill !== "function") throw new Error("GameSim applySkill unavailable");
    sim.applySkill("vital", "skill");
    dom?.sync?.();
  });
  const afterVital = await state(page);
  if (afterVital.player.max_hp < 176) fail("vital max HP did not apply", { afterVital });

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.spawnDrop !== "function") throw new Error("GameSim spawnDrop unavailable");
    sim.spawnDrop(sim.player.x, sim.player.y, "legendary");
    sim.waveState = "reward";
    dom?.sync?.();
  });
  for (let i = 0; i < 10; i += 1) await advance(page, 1000 / 60);
  const pickup = await state(page);
  if (pickup.pause_mode !== "pickup_compare") fail("legendary item did not open pickup compare", { pickup });

  await page.click("#pickupKeepBtn");
  await advance(page, 180);
  const afterEquip = await state(page);
  if (afterEquip.player.max_hp < afterVital.player.max_hp) {
    fail("equipment rebuild removed skill max HP", { afterVital, afterEquip });
  }

  const shock = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    if (!sim || typeof sim.applySkill !== "function" || typeof sim.tryWeaponHit !== "function" || typeof sim.spawnEnemy !== "function") {
      throw new Error("GameSim shockwave hooks unavailable");
    }
    sim.applySkill("shockwave", "skill");
    sim.enemies.length = 0;
    sim.spawnEnemy(false, false);
    const enemy = sim.enemies[0];
    enemy.x = sim.player.x + 70;
    enemy.y = sim.player.y;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.hp = 220;
    enemy.maxHp = 220;
    enemy.hitCd = 0;
    sim.tryWeaponHit(enemy, enemy.x - 36, enemy.y, enemy.x + 36, enemy.y, 18, 260, 1, 0xffd166);
    return {
      shockwaveText: sim.floatTexts.some((entry) => entry.text === "SHOCK"),
      shockwaveFx: sim.combatFx.some((entry) => entry.kind === "shockwave"),
      shockwaveCd: sim.shockwaveCd,
      shockwaveStacks: sim.totalShockwaveStacks(),
      enemyHp: enemy.hp,
      hitCd: enemy.hitCd,
    };
  });
  if (!shock.shockwaveText || !shock.shockwaveFx || shock.shockwaveCd <= 0 || shock.shockwaveStacks < 1) {
    fail("shockwave did not trigger on a high-speed normal hit", { shock });
  }

  const combatFx = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    if (!sim || typeof sim.applySkill !== "function" || typeof sim.tryWeaponHit !== "function" || typeof sim.spawnEnemy !== "function") {
      throw new Error("GameSim combat FX hooks unavailable");
    }
    const hpScale = {};
    sim.enemies.length = 0;
    sim.spawnEnemy(false, false);
    hpScale.normalEnemyMaxHp = sim.enemies[0].maxHp;
    sim.enemies.length = 0;
    if (typeof sim.spawnBoss === "function") {
      sim.spawnBoss();
      hpScale.bossMaxHp = sim.enemies[0].maxHp;
    }

    sim.enemies.length = 0;
    sim.combatFx.length = 0;
    sim.applySkill("chain", "skill");
    sim.spawnEnemy(false, false);
    sim.spawnEnemy(false, false);
    const first = sim.enemies[0];
    const second = sim.enemies[1];
    first.x = sim.player.x + 70;
    first.y = sim.player.y;
    second.x = first.x + 40;
    second.y = first.y + 8;
    first.hp = 500;
    first.maxHp = 500;
    second.hp = 500;
    second.maxHp = 500;
    sim.tryWeaponHit(first, first.x - 30, first.y, first.x + 30, first.y, 18, 230, 1, 0xffd166);
    const chainFx = sim.combatFx.some((entry) => entry.kind === "chain");

    sim.enemies.length = 0;
    sim.combatFx.length = 0;
    sim.player.invuln = 0;
    sim.player.hp = sim.player.maxHp;
    sim.applySkill("reflect", "skill");
    sim.spawnEnemy(false, false);
    const blastEnemy = sim.enemies[0];
    blastEnemy.x = sim.player.x + 48;
    blastEnemy.y = sim.player.y;
    blastEnemy.hp = 700;
    blastEnemy.maxHp = 700;
    const hpBeforeBlast = blastEnemy.hp;
    const playerHpBeforeBlast = sim.player.hp;
    sim.damagePlayer(12, "TEST HIT");

    return {
      hpScale,
      chainFx,
      selfBlastFx: sim.combatFx.some((entry) => entry.kind === "self_blast"),
      reflectFx: sim.combatFx.some((entry) => entry.kind === "reflect"),
      selfBlastStacks: sim.totalSelfBlastStacks(),
      blastEnemyHpBefore: hpBeforeBlast,
      blastEnemyHpAfter: blastEnemy.hp,
      playerHpBeforeBlast,
      playerHpAfterBlast: sim.player.hp,
    };
  });
  if (combatFx.hpScale.normalEnemyMaxHp < 80 || combatFx.hpScale.bossMaxHp < 18000) {
    fail("enemy or boss HP scale did not increase", { combatFx });
  }
  if (!combatFx.chainFx || !combatFx.reflectFx || !combatFx.selfBlastFx || combatFx.selfBlastStacks < 1) {
    fail("chain/reflect/self-blast visual FX did not register", { combatFx });
  }
  if (combatFx.blastEnemyHpAfter >= combatFx.blastEnemyHpBefore || combatFx.playerHpAfterBlast >= combatFx.playerHpBeforeBlast) {
    fail("self-blast did not trade player HP for enemy damage", { combatFx });
  }

  const finalState = await state(page);
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(finalState, null, 2));
  fs.writeFileSync(path.join(outDir, "shockwave-result.json"), JSON.stringify(shock, null, 2));
  fs.writeFileSync(path.join(outDir, "combat-fx-result.json"), JSON.stringify(combatFx, null, 2));
  await page.screenshot({ path: path.join(outDir, "page.png"), fullPage: true });
  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(JSON.stringify({ result: "ok", max_hp_after_vital: afterVital.player.max_hp, max_hp_after_equip: afterEquip.player.max_hp, shock, combatFx }, null, 2));
} finally {
  await browser.close();
}
