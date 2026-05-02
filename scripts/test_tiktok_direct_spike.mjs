import fs from "node:fs";
import path from "node:path";
import { chromium, webkit } from "playwright";

const baseUrl = process.env.TIKTOK_DIRECT_SPIKE_URL || "http://127.0.0.1:5173/tiktok-direct-spike.html?mock=cors&room=yrachac";
const browserName = process.env.TIKTOK_DIRECT_SPIKE_BROWSER || "chromium";
let outDir = path.resolve(process.env.TIKTOK_DIRECT_SPIKE_OUT_DIR || "output/tiktok-direct-spike");
const viewports = [
  { width: 390, height: 844, label: "phone-portrait" },
  { width: 768, height: 1024, label: "ipad-portrait" },
  { width: 1024, height: 1366, label: "ipad-large-portrait" },
];
const allowedReasons = new Set(["DIRECT_OK", "CORS_BLOCKED", "SIGNED_WS_REQUIRED", "BROWSER_WS_BLOCKED", "TIKTOK_OFFLINE", "UNKNOWN"]);

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function readJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (err) {
    fail("Direct spike did not render valid JSON", { label, error: String(err), text });
  }
}

function isIgnorableConsoleError(text) {
  return String(text || "").includes("WebSocket connection to") && String(text || "").includes("webcast.tiktok.com");
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch {
  outDir = path.resolve(`/private/tmp/tiktok-direct-spike-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
}

const launcher = browserName === "webkit" ? webkit : chromium;
const browser = await launcher.launch({
  headless: true,
  args: browserName === "chromium" ? ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] : [],
});

const results = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !isIgnorableConsoleError(message.text())) errors.push(message.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));
    try {
      const url = new URL(baseUrl);
      url.searchParams.set("autorun", "1");
      await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForFunction(() => typeof window.getTikTokDirectProbeResult === "function", null, { timeout: 10000 });
      await page.waitForFunction(() => {
        const result = window.getTikTokDirectProbeResult?.();
        return result && result.reason && Array.isArray(result.checks) && result.checks.length > 0;
      }, null, { timeout: 10000 });
      const text = await page.locator("#resultJson").textContent();
      const result = readJson(text || "{}", viewport.label);
      if (!allowedReasons.has(String(result.reason))) {
        fail("Direct spike returned an unknown reason", { viewport, result });
      }
      const runButtonBox = await page.locator("#runBtn").boundingBox();
      const inputBox = await page.locator("#roomInput").boundingBox();
      if (!runButtonBox || !inputBox) fail("Direct spike controls are not visible", { viewport, runButtonBox, inputBox });
      await page.screenshot({ path: path.join(outDir, `${viewport.label}.png`), fullPage: true });
      results.push({ viewport, reason: result.reason, success: result.success, checks: result.checks.length });
      if (errors.length) fail("Direct spike page emitted errors", { viewport, errors });
    } finally {
      await context.close();
    }
  }

  fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ result: "ok", browser: browserName, results, artifacts: outDir }, null, 2));
} finally {
  await browser.close();
}
