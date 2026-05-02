import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const cwd = path.resolve(new URL("..", import.meta.url).pathname);
const url = process.env.MELEE_SLASH_BUILD_UI_URL || process.argv[2] || "http://127.0.0.1:5173?seed=melee-slash-build-ui";
let outDir = path.resolve(process.env.MELEE_SLASH_BUILD_UI_OUT_DIR || process.argv[3] || "output/stream-raid-melee-slash-build-ui");

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

function cleanDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    if (!error || error.code !== "EPERM") throw error;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function requestOk(targetUrl, timeoutMs = 800) {
  return new Promise((resolve) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(parsed, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

async function waitForServer(targetUrl, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await requestOk(targetUrl)) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function ensureDevServer(targetUrl) {
  if (await requestOk(targetUrl)) return { started: false, stop: async () => {} };

  const logs = [];
  const child = spawn("npm", ["run", "dev"], {
    cwd,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const collect = (chunk) => {
    logs.push(String(chunk));
    if (logs.join("").length > 12000) logs.splice(0, logs.length - 8);
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);

  const ready = await waitForServer(targetUrl);
  if (!ready) {
    child.kill("SIGTERM");
    fail("Dev server did not become ready", { url: targetUrl, logs: logs.join("") });
  }

  return {
    started: true,
    stop: async () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill("SIGTERM");
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 1800);
        child.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    },
  };
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

async function advance(page, ms = 180) {
  return parseState(await page.evaluate((value) => window.advanceTime(value), ms));
}

function assertWeaponDescription(label, payload) {
  const expectedTitle = "流星籠手";
  const expectedName = "Meteor Gauntlet";
  const descriptivePattern = /近接|斬撃|斬り|弧|短射程|踏み込み|接近|連打|高速|melee|slash|arc|gauntlet/i;
  const matching = payload.candidates.filter((entry) => {
    const text = String(entry.text || "").replace(/\s+/g, " ").trim();
    return (
      (text.includes(expectedTitle) || text.includes(expectedName)) &&
      descriptivePattern.test(text) &&
      text.length >= expectedTitle.length + 12
    );
  });
  assert(matching.length > 0, `${label} weapon description is missing`, payload);
}

async function collectWeaponUi(page, scopeSelector) {
  return page.evaluate((scope) => {
    const visibleText = (el) => {
      const style = window.getComputedStyle(el);
      const box = el.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || box.width <= 0 || box.height <= 0) return "";
      return String(el.textContent || "").replace(/\s+/g, " ").trim();
    };
    const scopeEl = document.querySelector(scope);
    const candidates = [];
    const selectors = [
      "[data-testid*='weapon' i]",
      "[id*='Weapon']",
      "[class*='weapon' i]",
    ];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(`${scope} ${selector}`)) {
        const text = visibleText(el);
        if (text) candidates.push({ selector, id: el.id || "", className: String(el.className || ""), text });
      }
    }
    return {
      scope,
      scopeText: scopeEl ? visibleText(scopeEl) : "",
      candidates,
    };
  }, scopeSelector);
}

async function assertResponsiveBuildUi(browser, targetUrl) {
  const cases = [
    { label: "phone-portrait", viewport: { width: 390, height: 844 } },
    { label: "phone-landscape", viewport: { width: 932, height: 430 } },
    { label: "compact-landscape", viewport: { width: 844, height: 390 } },
  ];
  const page = await browser.newPage();
  try {
    for (const testCase of cases) {
      await page.setViewportSize(testCase.viewport);
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForFunction(() => typeof window.render_game_to_text === "function" && Boolean(window.__OVERDRIVE__?.sim));
      await page.selectOption("#startJobSelect", "reaver");
      await page.selectOption("#startWeaponSelect", "comet_knuckle");
      await page.waitForFunction(() => document.querySelector("#startWeaponDescVal")?.textContent?.includes("流星籠手"));

      const startUi = await collectWeaponUi(page, "#startScreen");
      fs.writeFileSync(path.join(outDir, `${testCase.label}-start-weapon-ui.json`), JSON.stringify(startUi, null, 2));
      assertWeaponDescription(`${testCase.label} start build UI`, startUi);

      const startLayout = await measureBuildLayout(page, "#startScreen", ".start-panel");
      fs.writeFileSync(path.join(outDir, `${testCase.label}-start-layout.json`), JSON.stringify(startLayout, null, 2));
      assertBuildLayout(`${testCase.label} start`, startLayout);

      await clickVisible(page, ["#openStartMenuBtn", "#mobileMenuBtn", "#menuFloatingBtn"]);
      await page.waitForSelector("#menuModal:not(.hidden)");
      await page.selectOption("#jobSelect", "reaver");
      await page.selectOption("#weaponSelect", "comet_knuckle");
      await page.waitForFunction(() => document.querySelector("#menuWeaponDescVal")?.textContent?.includes("流星籠手"));

      const menuUi = await collectWeaponUi(page, "#menuModal");
      fs.writeFileSync(path.join(outDir, `${testCase.label}-menu-weapon-ui.json`), JSON.stringify(menuUi, null, 2));
      assertWeaponDescription(`${testCase.label} menu build UI`, menuUi);

      const menuLayout = await measureBuildLayout(page, "#menuModal", ".menu-panel");
      fs.writeFileSync(path.join(outDir, `${testCase.label}-menu-layout.json`), JSON.stringify(menuLayout, null, 2));
      assertBuildLayout(`${testCase.label} menu`, menuLayout);
      await page.screenshot({ path: path.join(outDir, `${testCase.label}.png`), fullPage: true });
    }
  } finally {
    await page.close();
  }
}

async function measureBuildLayout(page, scopeSelector, panelSelector) {
  return page.evaluate(
    ({ scope, panel }) => {
      const rectJson = (el) => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const scopeEl = document.querySelector(scope);
      const panelEl = document.querySelector(`${scope} ${panel}`) || document.querySelector(panel);
      const ids = [
        "startWeaponReachVal",
        "startWeaponTraitVal",
        "startWeaponDescVal",
        "startWeaponTacticsVal",
        "startBtn",
        "mobileStartBtn",
        "openStartMenuBtn",
        "mobileMenuBtn",
        "menuWeaponReachVal",
        "menuWeaponTraitVal",
        "menuWeaponDescVal",
        "menuWeaponTacticsVal",
        "closeMenuBtn",
      ];
      const items = ids
        .map((id) => document.querySelector(`${scope} #${id}`))
        .filter((el) => {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        })
        .filter(Boolean)
        .map((el) => ({ id: el.id, text: String(el.textContent || "").replace(/\s+/g, " ").trim(), rect: rectJson(el) }));
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentOverflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
        scope: scopeEl ? rectJson(scopeEl) : null,
        panel: panelEl
          ? {
              ...rectJson(panelEl),
              scrollWidth: panelEl.scrollWidth,
              clientWidth: panelEl.clientWidth,
              scrollHeight: panelEl.scrollHeight,
              clientHeight: panelEl.clientHeight,
            }
          : null,
        items,
      };
    },
    { scope: scopeSelector, panel: panelSelector },
  );
}

async function clickVisible(page, selectors) {
  const clicked = await page.evaluate((selectorList) => {
    for (const selector of selectorList) {
      const el = document.querySelector(selector);
      if (!el) continue;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width <= 0 || rect.height <= 0) continue;
      el.click();
      return selector;
    }
    return "";
  }, selectors);
  assert(Boolean(clicked), "No visible clickable control was available", { selectors });
}

function assertBuildLayout(label, layout) {
  assert(layout.scope && layout.panel, `${label} build panel is missing`, layout);
  assert(layout.documentOverflowX <= 6, `${label} has document-level horizontal overflow`, layout);
  assert(layout.panel.scrollWidth - layout.panel.clientWidth <= 8, `${label} build panel has horizontal overflow`, layout);
  for (const item of layout.items) {
    assert(item.rect.width > 0 && item.rect.height > 0, `${label} ${item.id} is not measurable`, { layout, item });
    assert(item.rect.left >= -8 && item.rect.right <= layout.viewport.width + 8, `${label} ${item.id} overflows horizontally`, { layout, item });
  }
}

function compareBuffers(before, after) {
  const length = Math.min(before.length, after.length);
  let differentBytes = Math.abs(before.length - after.length);
  let byteDelta = 0;
  for (let i = 0; i < length; i += 1) {
    const delta = Math.abs(before[i] - after[i]);
    if (delta > 0) differentBytes += 1;
    byteDelta += delta;
  }
  return { beforeBytes: before.length, afterBytes: after.length, differentBytes, byteDelta };
}

async function assertCanvasSlashScreenshot(page) {
  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const scene = window.__OVERDRIVE__?.scene;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || !scene || typeof sim.setBuild !== "function" || typeof sim.spawnEnemy !== "function") throw new Error("Canvas slash setup hooks unavailable");
    sim.setBuild("reaver", "comet_knuckle");
    dom?.sync?.();
    sim.enemies.length = 0;
    sim.combatFx.length = 0;
    sim.floatTexts.length = 0;
    sim.particles.length = 0;
    sim.meleeCd = 0;
    sim.waveState = "fighting";
    sim.input.pointerActive = false;
    sim.input.left = false;
    sim.input.right = true;
    sim.input.up = false;
    sim.input.down = false;
    window.advanceTime(180);
    sim.input.right = false;
    sim.player.vx = 0;
    sim.player.vy = 0;
    sim.enemies.length = 0;
    sim.combatFx.length = 0;
    sim.floatTexts.length = 0;
    sim.particles.length = 0;
    sim.meleeCd = 0;
    sim.nunchaku.x = sim.player.x - 190;
    sim.nunchaku.y = sim.player.y + 120;
    sim.nunchaku.prevX = sim.nunchaku.x;
    sim.nunchaku.prevY = sim.nunchaku.y;
    sim.nunchaku.vx = 0;
    sim.nunchaku.vy = 0;
    scene.renderState();
  });
  const before = await page.locator("#gameCanvas").screenshot({ path: path.join(outDir, "canvas-before-slash.png") });
  const hit = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const scene = window.__OVERDRIVE__?.scene;
    sim.combatFx.push({
      id: 990001,
      kind: "melee_slash",
      x: sim.player.x,
      y: sim.player.y,
      x2: sim.player.x + 58,
      y2: sim.player.y,
      radius: 77,
      color: 0xff5f8f,
      life: 0.18,
      maxLife: 0.18,
    });
    scene.renderState();
    const rendered = JSON.parse(window.render_game_to_text());
    return {
      visualEffects: rendered.combat.visual_effects,
    };
  });
  const after = await page.locator("#gameCanvas").screenshot({ path: path.join(outDir, "canvas-after-slash.png") });
  return { hit, diff: compareBuffers(before, after) };
}

async function runMeleeScenarioTest(page) {
  return page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const scene = window.__OVERDRIVE__?.scene;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || !scene || typeof sim.setBuild !== "function" || typeof sim.spawnEnemy !== "function" || typeof sim.tryMeleeHit !== "function") {
      throw new Error("GameSim melee hooks unavailable");
    }

    const sampleSlashPixels = () => {
      scene.renderState();
      const canvas = document.querySelector("#gameCanvas");
      const scratch = document.createElement("canvas");
      scratch.width = canvas.width;
      scratch.height = canvas.height;
      const ctx = scratch.getContext("2d", { willReadFrequently: true });
      try {
        ctx.drawImage(canvas, 0, 0);
        const p = sim.player;
        const radius = 96;
        const x0 = Math.max(0, Math.floor(p.x - 8));
        const y0 = Math.max(0, Math.floor(p.y - radius));
        const w = Math.min(scratch.width - x0, Math.ceil(radius + 22));
        const h = Math.min(scratch.height - y0, Math.ceil(radius * 2));
        const data = ctx.getImageData(x0, y0, w, h).data;
        let hot = 0;
        let lum = 0;
        let samples = 0;
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const px = x0 + x;
            const py = y0 + y;
            const dx = px - p.x;
            const dy = py - p.y;
            const dist = Math.hypot(dx, dy);
            if (dx < 4 || dist < 16 || dist > radius) continue;
            const index = (y * w + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
            samples += 1;
            lum += r + g + b;
            if (a > 80 && r > 140 && b > 70 && r > g + 30) hot += 1;
          }
        }
        return { ok: true, hot, lum, samples, region: { x0, y0, w, h } };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    };

    const orientRightThenStop = () => {
      sim.input.pointerActive = false;
      sim.input.left = false;
      sim.input.right = true;
      sim.input.up = false;
      sim.input.down = false;
      window.advanceTime(180);
      sim.input.right = false;
      sim.player.vx = 0;
      sim.player.vy = 0;
    };

    const resetArena = () => {
      sim.setBuild("reaver", "comet_knuckle");
      dom?.sync?.();
      sim.enemies.length = 0;
      sim.combatFx.length = 0;
      sim.floatTexts.length = 0;
      sim.particles.length = 0;
      sim.meleeCd = 0;
      sim.waveState = "fighting";
      sim.player.hp = sim.player.maxHp;
      sim.nunchaku.x = sim.player.x - 190;
      sim.nunchaku.y = sim.player.y + 120;
      sim.nunchaku.prevX = sim.nunchaku.x;
      sim.nunchaku.prevY = sim.nunchaku.y;
      sim.nunchaku.vx = 0;
      sim.nunchaku.vy = 0;
      orientRightThenStop();
      sim.enemies.length = 0;
      sim.combatFx.length = 0;
      sim.floatTexts.length = 0;
      sim.particles.length = 0;
      sim.meleeCd = 0;
      sim.waveState = "fighting";
    };

    const attempt = (label, offsetX, offsetY, collectPixels = false) => {
      resetArena();
      sim.spawnEnemy(false, false);
      const enemy = sim.enemies[0];
      enemy.x = sim.player.x + offsetX;
      enemy.y = sim.player.y + offsetY;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.speed = 0;
      enemy.hp = 240;
      enemy.maxHp = 240;
      enemy.hitCd = 0;
      enemy.touchCd = 9;
      const hpBefore = enemy.hp;
      const beforePixels = collectPixels ? sampleSlashPixels() : null;
      sim.tryMeleeHit(enemy);
      const afterPixels = collectPixels ? sampleSlashPixels() : null;
      const rendered = JSON.parse(window.render_game_to_text());
      return {
        label,
        hpBefore,
        hpAfter: enemy.hp,
        meleeCd: sim.meleeCd,
        facing: rendered.combat.melee_facing,
        build: rendered.build,
        floatTexts: sim.floatTexts.map((entry) => ({ text: entry.text, life: entry.life })),
        directFx: sim.combatFx.map((entry) => ({ kind: entry.kind, radius: entry.radius, life: entry.life })),
        visualEffects: rendered.combat.visual_effects,
        beforePixels,
        afterPixels,
      };
    };

    return {
      front: attempt("front", 50, 0, false),
      behind: attempt("behind", -50, 0, false),
      boundary: attempt("boundary", 0, 50, false),
    };
  });
}

try {
  cleanDir(outDir);
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.join("/private/tmp", `stream-raid-melee-slash-build-ui-${Date.now()}`);
  cleanDir(outDir);
}

const server = await ensureDevServer(url);
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
  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && Boolean(window.__OVERDRIVE__?.sim));

  await page.selectOption("#startJobSelect", "reaver");
  await page.selectOption("#startWeaponSelect", "comet_knuckle");
  await page.waitForFunction(() => {
    const select = document.querySelector("#startWeaponSelect");
    const label = document.querySelector("#startWeaponImageNameVal");
    return select?.value === "comet_knuckle" && label?.textContent?.includes("流星籠手");
  });

  const startUi = await collectWeaponUi(page, "#startScreen");
  fs.writeFileSync(path.join(outDir, "start-weapon-ui.json"), JSON.stringify(startUi, null, 2));
  assertWeaponDescription("Start build UI", startUi);

  await page.click("#openStartMenuBtn");
  await page.waitForSelector("#menuModal:not(.hidden)");
  await page.selectOption("#jobSelect", "reaver");
  await page.selectOption("#weaponSelect", "comet_knuckle");
  await page.waitForFunction(() => {
    const select = document.querySelector("#weaponSelect");
    const label = document.querySelector("#menuWeaponImageNameVal");
    return select?.value === "comet_knuckle" && label?.textContent?.includes("流星籠手");
  });

  const menuUi = await collectWeaponUi(page, "#menuModal");
  fs.writeFileSync(path.join(outDir, "menu-weapon-ui.json"), JSON.stringify(menuUi, null, 2));
  assertWeaponDescription("Menu build UI", menuUi);

  await assertResponsiveBuildUi(browser, url);

  await page.click("#closeMenuBtn");
  await page.click("#startBtn");
  await advance(page, 180);

  const melee = await runMeleeScenarioTest(page);
  fs.writeFileSync(path.join(outDir, "melee-slash-result.json"), JSON.stringify(melee, null, 2));

  assert(melee.front.build?.weapon === "comet_knuckle", "Melee test did not keep the comet_knuckle build", { melee });
  assert(melee.front.hpAfter < melee.front.hpBefore, "Comet knuckle front melee hit did not damage the enemy", { melee });
  assert(melee.front.meleeCd > 0, "Comet knuckle front melee hit did not start melee cooldown", { melee });
  const frontFxKinds = melee.front.visualEffects.map((entry) => entry.kind);
  assert(frontFxKinds.includes("melee_slash"), "Front melee hit did not emit dedicated melee_slash visual_effect", { melee });
  assert(!frontFxKinds.includes("reflect"), "Front melee hit still emits the generic reflect visual_effect", { melee });
  const slash = melee.front.visualEffects.find((entry) => entry.kind === "melee_slash");
  assert(slash && Math.abs(slash.angle) <= 0.25, "Front melee_slash is not aligned with right-facing movement", { melee, slash });

  const canvasSlash = await assertCanvasSlashScreenshot(page);
  fs.writeFileSync(path.join(outDir, "canvas-slash-diff.json"), JSON.stringify(canvasSlash, null, 2));
  assert(canvasSlash.hit.visualEffects.some((entry) => entry.kind === "melee_slash"), "Canvas slash setup did not expose melee_slash", { canvasSlash });
  assert(
    canvasSlash.diff.differentBytes > 20 || canvasSlash.diff.byteDelta > 1000,
    "Canvas screenshot did not change after melee_slash rendering",
    { canvasSlash },
  );

  const behindFxKinds = melee.behind.visualEffects.map((entry) => entry.kind);
  assert(melee.behind.hpAfter === melee.behind.hpBefore, "Behind enemy was damaged by forward half-circle melee", { melee });
  assert(!behindFxKinds.includes("melee_slash"), "Behind enemy emitted melee_slash", { melee });

  const boundaryFxKinds = melee.boundary.visualEffects.map((entry) => entry.kind);
  assert(melee.boundary.hpAfter < melee.boundary.hpBefore, "Half-circle boundary enemy was not damaged", { melee });
  assert(boundaryFxKinds.includes("melee_slash"), "Half-circle boundary enemy did not emit melee_slash", { melee });

  const finalState = await state(page);
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(finalState, null, 2));
  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(JSON.stringify({ result: "ok", url, server_started: server.started, artifacts: outDir, melee, canvasSlash }, null, 2));
} catch (error) {
  fs.writeFileSync(path.join(outDir, "diagnostic-failure.json"), JSON.stringify({ error: String(error?.stack || error), errors }, null, 2));
  throw error;
} finally {
  await browser.close();
  await server.stop();
}
