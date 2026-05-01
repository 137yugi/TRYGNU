import fs from "node:fs";
import path from "node:path";
import { chromium, webkit } from "playwright";

const url = process.env.ORIENTATION_RESIZE_URL || "http://127.0.0.1:5173?seed=orientation-resize";
const browserName = process.env.ORIENTATION_RESIZE_BROWSER || "chromium";
let outDir = path.resolve(process.env.ORIENTATION_RESIZE_OUT_DIR || "output/stream-raid-orientation-resize");

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

async function setViewportAndSettle(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => {
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("orientationchange"));
  });
  await page.waitForTimeout(180);
  return advance(page, 240);
}

try {
  cleanDir(outDir);
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.join("/private/tmp", `stream-raid-orientation-resize-${Date.now()}`);
  cleanDir(outDir);
}

const browserType = browserName === "webkit" ? webkit : chromium;
const browser = await browserType.launch({
  headless: true,
  args: browserName === "webkit" ? [] : ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.click("#mobileStartBtn");
  const portrait = await advance(page, 240);
  if (portrait.canvas.layout !== "portrait" || portrait.canvas.height <= portrait.canvas.width) {
    fail("Initial portrait viewport did not create portrait world", { portrait });
  }

  const landscape = await setViewportAndSettle(page, 844, 390);
  if (landscape.canvas.layout !== "landscape" || landscape.canvas.width <= landscape.canvas.height) {
    fail("Landscape resize did not reconfigure world", { landscape });
  }
  if (landscape.player.x < 0 || landscape.player.x > landscape.canvas.width || landscape.player.y < 0 || landscape.player.y > landscape.canvas.height) {
    fail("Player was not clamped into landscape bounds", { landscape });
  }
  await page.screenshot({ path: path.join(outDir, "landscape.png"), fullPage: true });

  const portraitAgain = await setViewportAndSettle(page, 390, 844);
  if (portraitAgain.canvas.layout !== "portrait" || portraitAgain.canvas.height <= portraitAgain.canvas.width) {
    fail("Portrait resize did not reconfigure world", { portraitAgain });
  }
  if (portraitAgain.player.x < 0 || portraitAgain.player.x > portraitAgain.canvas.width || portraitAgain.player.y < 0 || portraitAgain.player.y > portraitAgain.canvas.height) {
    fail("Player was not clamped into portrait bounds", { portraitAgain });
  }
  await page.screenshot({ path: path.join(outDir, "portrait.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(portraitAgain, null, 2));

  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        browser: browserName,
        portrait: portrait.canvas,
        landscape: landscape.canvas,
        portrait_again: portraitAgain.canvas,
        artifacts: outDir,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
