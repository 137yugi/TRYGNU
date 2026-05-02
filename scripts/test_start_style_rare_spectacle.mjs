import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const cwd = path.resolve(new URL("..", import.meta.url).pathname);
const url = process.env.START_STYLE_RARE_URL || process.argv[2] || "http://127.0.0.1:5173?seed=start-style-rare";
let outDir = path.resolve(process.env.START_STYLE_RARE_OUT_DIR || process.argv[3] || "output/stream-raid-start-style-rare");

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, url, ...details }, null, 2));
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
  const child = spawn("npm", ["run", "dev"], { cwd, env: { ...process.env, BROWSER: "none" }, stdio: ["ignore", "pipe", "pipe"] });
  const collect = (chunk) => {
    logs.push(String(chunk));
    if (logs.join("").length > 12000) logs.splice(0, logs.length - 8);
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  if (!(await waitForServer(targetUrl))) {
    child.kill("SIGTERM");
    fail("Dev server did not become ready", { logs: logs.join("") });
  }
  return {
    started: true,
    stop: async () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill("SIGTERM");
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 1600);
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
    fail("state JSON parse failed", { error: String(error), text });
  }
}

async function advance(page, ms) {
  return parseState(await page.evaluate((value) => window.advanceTime(value), ms));
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

try {
  cleanDir(outDir);
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.join("/private/tmp", `stream-raid-start-style-rare-${Date.now()}`);
  cleanDir(outDir);
}

const server = await ensureDevServer(url);
const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && Boolean(window.__OVERDRIVE__?.sim), null, { timeout: 10000 });
  await page.selectOption("#startJobSelect", "reaver");
  await page.selectOption("#startWeaponSelect", "comet_knuckle");
  await page.waitForFunction(() => document.querySelector("#startWeaponTacticsVal")?.textContent?.includes("武器運用"));

  const startLayout = await page.evaluate(() => {
    const rectJson = (el) => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const panel = document.querySelector(".start-panel");
    const shell = document.querySelector(".start-shell");
    const targetIds = ["startJobDetail", "startWeaponTacticsVal", "startWeaponDescVal", "startWeaponReachVal", "startBuildSummaryVal"];
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentOverflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      shell: rectJson(shell),
      panel: {
        ...rectJson(panel),
        scrollHeight: panel.scrollHeight,
        clientHeight: panel.clientHeight,
        scrollWidth: panel.scrollWidth,
        clientWidth: panel.clientWidth,
      },
      items: targetIds.map((id) => ({ id, rect: rectJson(document.querySelector(`#${id}`)), text: document.querySelector(`#${id}`)?.textContent || "" })),
    };
  });
  fs.writeFileSync(path.join(outDir, "start-layout.json"), JSON.stringify(startLayout, null, 2));
  assert(startLayout.documentOverflowX <= 4, "Start screen has horizontal overflow", { startLayout });
  assert(startLayout.panel.scrollWidth - startLayout.panel.clientWidth <= 4, "Start build panel has horizontal overflow", { startLayout });
  assert(startLayout.panel.scrollHeight - startLayout.panel.clientHeight <= 28, "Start build panel still requires meaningful vertical scrolling on SP", { startLayout });
  const tactics = startLayout.items.find((item) => item.id === "startWeaponTacticsVal");
  assert(tactics.rect.bottom <= startLayout.viewport.height - 54, "Weapon tactics are below the first mobile viewport", { startLayout });
  await page.screenshot({ path: path.join(outDir, "start-portrait.png"), fullPage: true });

  await page.click("#mobileStartBtn");
  await advance(page, 180);
  const styleDecay = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    sim.mode = "running";
    sim.pauseMode = null;
    sim.waveState = "fighting";
    sim.enemies.length = 0;
    sim.styleGauge = 80;
    sim.styleLastRank = "SS";
    const before = JSON.parse(window.render_game_to_text()).combat.style;
    window.advanceTime(2200);
    const after = JSON.parse(window.render_game_to_text()).combat.style;
    return { before, after };
  });
  fs.writeFileSync(path.join(outDir, "style-decay.json"), JSON.stringify(styleDecay, null, 2));
  assert(styleDecay.before.gauge >= 79, "Style setup failed", { styleDecay });
  assert(styleDecay.after.gauge <= 50, "Style gauge did not decay fast enough", { styleDecay });
  assert(styleDecay.after.multiplier < styleDecay.before.multiplier - 0.55, "Style multiplier did not fall with gauge", { styleDecay });

  await page.evaluate(() => {
    const dom = window.__OVERDRIVE__?.dom;
    window.__sfxProbe = [];
    dom.audio.play = (id, enabled) => window.__sfxProbe.push({ id, enabled });
  });
  const beforeDrop = await page.locator("#gameCanvas").screenshot({ path: path.join(outDir, "rare-before.png") });
  const rare = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const scene = window.__OVERDRIVE__?.scene;
    const dom = window.__OVERDRIVE__?.dom;
    sim.pauseMode = null;
    sim.waveState = "reward";
    sim.drops.length = 0;
    sim.floatTexts.length = 0;
    sim.spawnDrop(sim.player.x + 22, sim.player.y - 18, "legendary");
    scene.renderState();
    dom.sync();
    const state = JSON.parse(window.render_game_to_text());
    return {
      sfx: window.__sfxProbe,
      flash: sim.flash,
      shake: sim.shake,
      floats: sim.floatTexts.map((entry) => entry.text),
      drop: state.drops[0],
    };
  });
  const afterDrop = await page.locator("#gameCanvas").screenshot({ path: path.join(outDir, "rare-after.png") });
  const rareDiff = compareBuffers(beforeDrop, afterDrop);
  fs.writeFileSync(path.join(outDir, "rare-spectacle.json"), JSON.stringify({ rare, rareDiff }, null, 2));
  assert(rare.drop?.rarity === "legendary" || rare.drop?.rarity === "ancient", "Legendary spawn did not create a high-rarity item", { rare });
  assert(rare.sfx.some((entry) => entry.id === "ancientDrop"), "Legendary drop did not request the high-rarity stinger", { rare });
  assert(rare.flash >= 0.2 && rare.shake >= 7, "Legendary drop did not trigger flash and shake", { rare });
  assert(rare.floats.some((text) => /LEGENDARY|ANCIENT/u.test(text)), "Legendary drop did not announce itself", { rare });
  assert(rareDiff.differentBytes > 100 || rareDiff.byteDelta > 5000, "Legendary drop did not visibly change the canvas", { rare, rareDiff });

  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(JSON.stringify({ result: "ok", url, server_started: server.started, artifacts: outDir, styleDecay, rare, rareDiff }, null, 2));
} finally {
  await browser.close();
  await server.stop();
}
