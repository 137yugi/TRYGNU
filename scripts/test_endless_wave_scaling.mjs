import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

const port = Number(process.env.ENDLESS_WAVE_SCALING_PORT || 5193);
const providedUrl = process.env.ENDLESS_WAVE_SCALING_URL || "";
const url = providedUrl || `http://127.0.0.1:${port}?seed=endless-wave-scaling`;
const viteCacheDir =
  process.env.ENDLESS_WAVE_SCALING_VITE_CACHE_DIR || `/private/tmp/stream-raid-vite-endless-${process.pid}`;
let outDir = path.resolve(process.env.ENDLESS_WAVE_SCALING_OUT_DIR || "output/stream-raid-endless-wave-scaling");

class TestFailure extends Error {
  constructor(message, details = {}) {
    super(message);
    this.details = details;
  }
}

function fail(message, details = {}) {
  throw new TestFailure(message, details);
}

function parseState(text, label = "render_game_to_text") {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail("render_game_to_text returned invalid JSON", { label, error: String(error), text });
  }
}

function finiteNumber(value, label, failures) {
  if (!Number.isFinite(value)) failures.push(`${label} is not finite: ${String(value)}`);
}

function assertSnapshotFinite(state, label) {
  const failures = [];
  finiteNumber(state?.run?.wave, `${label}.run.wave`, failures);
  finiteNumber(state?.run?.wave_target, `${label}.run.wave_target`, failures);
  finiteNumber(state?.run?.wave_spawned, `${label}.run.wave_spawned`, failures);
  finiteNumber(state?.run?.wave_remaining, `${label}.run.wave_remaining`, failures);
  finiteNumber(state?.run?.wave_clear_count, `${label}.run.wave_clear_count`, failures);
  finiteNumber(state?.run?.wave_xp_required, `${label}.run.wave_xp_required`, failures);
  finiteNumber(state?.run?.enemy_cap, `${label}.run.enemy_cap`, failures);
  finiteNumber(state?.run?.threat_score, `${label}.run.threat_score`, failures);
  finiteNumber(state?.run?.boss_kills, `${label}.run.boss_kills`, failures);
  finiteNumber(state?.run?.next_boss_wave, `${label}.run.next_boss_wave`, failures);
  finiteNumber(state?.player?.hp, `${label}.player.hp`, failures);
  finiteNumber(state?.player?.max_hp, `${label}.player.max_hp`, failures);
  finiteNumber(state?.player?.next_xp, `${label}.player.next_xp`, failures);
  finiteNumber(state?.combat?.damage_multiplier, `${label}.combat.damage_multiplier`, failures);
  finiteNumber(state?.combat?.effective_damage_multiplier, `${label}.combat.effective_damage_multiplier`, failures);
  if (failures.length) fail("Snapshot scaling fields were not finite", { label, failures, state });
}

function cleanDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    if (!error || error.code !== "EPERM") throw error;
  }
  fs.mkdirSync(dir, { recursive: true });
}

async function waitForServer(targetUrl, timeoutMs = 15000) {
  const start = Date.now();
  let lastError = "";
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(targetUrl, { method: "GET" });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("Timed out waiting for Vite test server", { url: targetUrl, lastError });
}

async function withServer(run) {
  if (providedUrl) {
    await waitForServer(url);
    return run();
  }

  const server = await createServer({
    configFile: "vite.config.ts",
    configLoader: "runner",
    cacheDir: viteCacheDir,
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
    },
  });

  try {
    await server.listen();
    return await run();
  } finally {
    await server.close();
  }
}

try {
  cleanDir(outDir);
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.resolve(`/private/tmp/stream-raid-endless-wave-scaling-${Date.now()}`);
  cleanDir(outDir);
}

try {
  await withServer(async () => {
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
      await page.waitForFunction(() => typeof window.render_game_to_text === "function" && window.__OVERDRIVE__?.sim, null, {
        timeout: 10000,
      });

      await page.evaluate(() => {
        const sim = window.__OVERDRIVE__?.sim;
        if (
          !sim ||
          typeof sim.startRun !== "function" ||
          typeof sim.spawnBoss !== "function" ||
          typeof sim.killEnemy !== "function" ||
          typeof sim.computeWaveTarget !== "function" ||
          typeof sim.waveXpRequirement !== "function" ||
          typeof sim.enemyCap !== "function"
        ) {
          throw new Error("GameSim endless-wave QA hooks unavailable");
        }
      });

      const result = await page.evaluate(() => {
        const sim = window.__OVERDRIVE__.sim;
        const dom = window.__OVERDRIVE__.dom;

        const state = () => JSON.parse(window.render_game_to_text());
        const advance = (ms) => JSON.parse(window.advanceTime(ms));
        const finite = (value) => Number.isFinite(value);
        const finiteBoss = (boss) =>
          Boolean(boss) && finite(boss.hp) && finite(boss.maxHp) && finite(boss.speed) && finite(boss.damage);

        const resetForForcedWave = (wave) => {
          sim.pauseMode = null;
          sim.enemies.length = 0;
          sim.drops.length = 0;
          sim.obstacles.length = 0;
          sim.activeAds.length = 0;
          sim.adQueue.length = 0;
          sim.levelChoices.length = 0;
          sim.mutationChoices.length = 0;
          sim.pickupCompare = null;
          sim.nextMutationWave = 9999;
          sim.wave = wave;
          sim.waveState = "fighting";
          sim.waveTarget = 0;
          sim.waveSpawned = 0;
          sim.waveKills = 0;
          sim.waveIntermissionTimer = 0;
          sim.spawnTimer = 999;
          sim.player.hp = sim.player.maxHp;
        };

        sim.startRun();
        sim.nextMutationWave = 9999;

        const cycles = [];
        for (let i = 0; i < 3; i += 1) {
          const bossWave = sim.nextBossWave;
          const bossKillsBefore = sim.bossKills;
          resetForForcedWave(bossWave);
          sim.spawnBoss();
          const boss = sim.enemies.find((enemy) => enemy.boss);
          if (!finiteBoss(boss)) {
            return {
              ok: false,
              message: "Forced boss spawn produced non-finite stats",
              bossWave,
              boss,
              snapshot: state(),
            };
          }

          const bossBefore = {
            wave: bossWave,
            boss_kills_before: bossKillsBefore,
            hp: boss.hp,
            max_hp: boss.maxHp,
            speed: boss.speed,
            damage: boss.damage,
            next_boss_wave_before: sim.nextBossWave,
          };

          sim.killEnemy(boss);
          sim.enemies = sim.enemies.filter((enemy) => enemy.id !== boss.id);
          sim.drops.length = 0;
          sim.pauseMode = null;
          sim.nextMutationWave = 9999;
          dom?.sync?.();

          const afterKill = state();
          const afterContinuation = advance(1200);
          cycles.push({ boss_before: bossBefore, after_kill: afterKill, after_continuation: afterContinuation });

          if (afterKill.run.boss_kills !== bossKillsBefore + 1) {
            return {
              ok: false,
              message: "Boss kill counter did not increment",
              cycle: cycles[cycles.length - 1],
            };
          }
          if (afterKill.run.next_boss_wave !== bossWave + 10) {
            return {
              ok: false,
              message: "Next boss wave did not advance by the boss interval",
              expected_next_boss_wave: bossWave + 10,
              cycle: cycles[cycles.length - 1],
            };
          }
          if (afterContinuation.mode !== "running" || afterContinuation.pause_mode !== null) {
            return {
              ok: false,
              message: "Run did not remain active after boss continuation",
              cycle: cycles[cycles.length - 1],
            };
          }
          if (afterContinuation.run.wave <= bossWave) {
            return {
              ok: false,
              message: "Wave did not continue past the defeated boss wave",
              bossWave,
              cycle: cycles[cycles.length - 1],
            };
          }
          if (afterContinuation.run.boss !== null) {
            return {
              ok: false,
              message: "Boss remained active after forced defeat and continuation",
              cycle: cycles[cycles.length - 1],
            };
          }
        }

        const scalingSamples = [1, 15, 16, 25, 26, 35, 36, 80, 120, 999].map((wave) => {
          sim.wave = wave;
          sim.waveTarget = sim.computeWaveTarget(wave);
          return {
            wave,
            wave_target: sim.waveTarget,
            wave_xp_required: sim.waveXpRequirement(),
            enemy_cap: sim.enemyCap(),
          };
        });

        return {
          ok: true,
          cycles,
          scaling_samples: scalingSamples,
          final_state: state(),
        };
      });

      if (!result.ok) fail(result.message || "Endless wave scaling scenario failed", result);
      for (const [index, cycle] of result.cycles.entries()) {
        assertSnapshotFinite(cycle.after_kill, `cycle-${index}.after_kill`);
        assertSnapshotFinite(cycle.after_continuation, `cycle-${index}.after_continuation`);
      }
      for (const sample of result.scaling_samples) {
        const failures = [];
        finiteNumber(sample.wave_target, `wave-${sample.wave}.wave_target`, failures);
        finiteNumber(sample.wave_xp_required, `wave-${sample.wave}.wave_xp_required`, failures);
        finiteNumber(sample.enemy_cap, `wave-${sample.wave}.enemy_cap`, failures);
        if (sample.wave_target < 0 || sample.enemy_cap < 1 || sample.wave_xp_required < 1) {
          failures.push(`wave-${sample.wave} produced invalid positive scaling fields`);
        }
        if (failures.length) fail("Wave scaling sample failed", { sample, failures });
      }
      assertSnapshotFinite(result.final_state, "final_state");
      if (errors.length) fail("Browser emitted errors during endless wave scaling test", { errors });

      fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify({ result: "passed", url, ...result }, null, 2));
      await page.screenshot({ path: path.join(outDir, "page.png"), fullPage: true });
      console.log(
        JSON.stringify(
          {
            result: "passed",
            url,
            cycles: result.cycles.map((cycle) => ({
              boss_wave: cycle.boss_before.wave,
              boss_kills_after: cycle.after_kill.run.boss_kills,
              continued_wave: cycle.after_continuation.run.wave,
              next_boss_wave: cycle.after_continuation.run.next_boss_wave,
              wave_target: cycle.after_continuation.run.wave_target,
              enemy_cap: cycle.after_continuation.run.enemy_cap,
            })),
            scaling_samples: result.scaling_samples,
            out_dir: outDir,
          },
          null,
          2,
        ),
      );
    } finally {
      await browser.close();
    }
  });
} catch (error) {
  if (error instanceof TestFailure) {
    console.error(JSON.stringify({ result: "failed", message: error.message, ...error.details }, null, 2));
  } else {
    console.error(JSON.stringify({ result: "failed", message: String(error) }, null, 2));
  }
  process.exit(1);
}
