import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.AD_SAFE_LANES_URL || "http://127.0.0.1:5173?seed=ad-safe-lanes";
let outDir = path.resolve(process.env.AD_SAFE_LANES_OUT_DIR || "output/stream-raid-ad-safe-lanes");

const scenarios = [
  { name: "landscape-932x430", viewport: { width: 932, height: 430 }, expectedLayout: "landscape" },
  { name: "portrait-390x844", viewport: { width: 390, height: 844 }, expectedLayout: "portrait" },
];

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

function parseState(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail("render_game_to_text returned invalid JSON", { label, error: String(error), text });
  }
}

function assertRect(ad, state, scenarioName) {
  const rect = ad.rect;
  const visible = ad.visible_rect;
  const safe = ad.safe_lane;
  const play = state.canvas.play_bounds;
  if (!rect || !visible || !safe || !play) {
    fail("active_ads entry is missing rect/safe lane fields", { scenarioName, ad });
  }

  const margin = 0.01;
  const failures = [];
  if (rect.top < safe.top_safe_bottom + margin) failures.push(`top ${rect.top} overlaps top UI band ${safe.top_safe_bottom}`);
  if (rect.bottom > safe.bottom_safe_top - margin) failures.push(`bottom ${rect.bottom} overlaps bottom UI band ${safe.bottom_safe_top}`);
  if (rect.top < play.y - margin) failures.push(`top ${rect.top} < play.y ${play.y}`);
  if (rect.bottom > play.y + play.height + margin) failures.push(`bottom ${rect.bottom} > play.bottom ${play.y + play.height}`);
  if (visible.left < play.x - margin || visible.right > play.x + play.width + margin) failures.push("visible_rect escapes horizontal play bounds");
  if (visible.top < play.y - margin || visible.bottom > play.y + play.height + margin) failures.push("visible_rect escapes vertical play bounds");
  if (safe.min_y > ad.y + margin || safe.max_y < ad.y - margin) failures.push(`center y ${ad.y} is outside safe lane ${safe.min_y}-${safe.max_y}`);

  if (failures.length) {
    fail("Ad rectangle violated play/UI safe lane bounds", { scenarioName, failures, ad, play });
  }
}

async function waitForSceneReady(page, scenarioName) {
  try {
    await page.waitForFunction(
      () => {
        const overdrive = window.__OVERDRIVE__;
        return Boolean(overdrive?.scene?.graphics && document.querySelector("canvas"));
      },
      null,
      { timeout: 10000 },
    );
  } catch (error) {
    fail("Phaser scene did not become render-ready", { scenarioName, error: String(error) });
  }
}

async function waitForCanvasDetail(page, scenarioName) {
  try {
    await page.waitForFunction(
      () => {
        const source = document.querySelector("canvas");
        if (!source || source.width <= 0 || source.height <= 0) return false;
        const sample = document.createElement("canvas");
        sample.width = 96;
        sample.height = 96;
        const ctx = sample.getContext("2d", { willReadFrequently: true });
        if (!ctx) return false;
        ctx.drawImage(source, 0, 0, sample.width, sample.height);
        const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data;
        let detailed = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          if (a > 20 && Math.abs(r - 7) + Math.abs(g - 16) + Math.abs(b - 23) > 30) detailed += 1;
          if (detailed > 80) return true;
        }
        return false;
      },
      null,
      { timeout: 10000 },
    );
  } catch (error) {
    fail("Canvas did not render visible gameplay/ad detail", { scenarioName, error: String(error) });
  }
}

try {
  cleanDir(outDir);
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.resolve(`/private/tmp/stream-raid-ad-safe-lanes-${Date.now()}`);
  cleanDir(outDir);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const errors = [];

try {
  for (const scenario of scenarios) {
    const page = await browser.newPage({ viewport: scenario.viewport });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push({ scenario: scenario.name, text: message.text() });
    });
    page.on("pageerror", (error) => errors.push({ scenario: scenario.name, text: String(error) }));

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForFunction(() => typeof window.render_game_to_text === "function" && window.__OVERDRIVE__?.sim, null, {
      timeout: 10000,
    });
    await waitForSceneReady(page, scenario.name);

    await page.evaluate(() => {
      const sim = window.__OVERDRIVE__?.sim;
      const dom = window.__OVERDRIVE__?.dom;
      if (!sim || typeof sim.spawnQueuedAd !== "function" || typeof sim.adLaneY !== "function") {
        throw new Error("GameSim ad lane hooks unavailable");
      }
      sim.startRun();
      sim.wave = 12;
      sim.activeAds.length = 0;
      sim.adQueue.length = 0;
      const fixtures = [
        { id: "qa-banner-top", type: "banner", lane: 0, w: 268, h: 42 },
        { id: "qa-banner-middle", type: "banner", lane: 1, w: 292, h: 46 },
        { id: "qa-banner-bottom", type: "banner", lane: 2, w: 276, h: 44 },
        { id: "qa-video-top", type: "video", lane: 0, w: 184, h: 96 },
        { id: "qa-video-bottom", type: "video", lane: 2, w: 188, h: 94 },
      ];
      for (const fixture of fixtures) {
        sim.spawnQueuedAd({ id: "fixture-seed-ad", source: "QA safe lane", diamonds: 25, tier: 5, queuedAt: sim.time });
        const ad = sim.activeAds[sim.activeAds.length - 1];
        ad.id = fixture.id;
        ad.type = fixture.type;
        ad.lane = fixture.lane;
        ad.w = fixture.w;
        ad.h = fixture.h;
        ad.y = sim.adLaneY(fixture.lane, ad.h);
        ad.x = window.__OVERDRIVE__.sim.createSnapshot().canvas.width * 0.5;
        ad.life = Math.max(ad.life, 5);
      }
      dom?.sync?.();
    });

    const text = await page.evaluate(() => window.advanceTime(120));
    const state = parseState(text, scenario.name);
    if (state.canvas.layout !== scenario.expectedLayout) {
      fail("Unexpected canvas layout for viewport", { scenario, canvas: state.canvas });
    }
    if (!Array.isArray(state.run.active_ads) || state.run.active_ads.length < 5) {
      fail("Expected forced active ads in snapshot", { scenario, active_ads: state.run.active_ads });
    }
    for (const ad of state.run.active_ads) assertRect(ad, state, scenario.name);

    fs.writeFileSync(path.join(outDir, `state-${scenario.name}.json`), JSON.stringify(state, null, 2));
    await waitForCanvasDetail(page, scenario.name);
    await page.screenshot({ path: path.join(outDir, `page-${scenario.name}.png`), fullPage: true });
    await page.close();
  }

  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        out_dir: outDir,
        scenarios: scenarios.map((scenario) => scenario.name),
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
