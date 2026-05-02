#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { chromium, webkit } from "playwright";

const defaultUrl = "https://137yugi.github.io/TRYGNU/?seed=post-deploy-mobile";
const url = process.env.POST_DEPLOY_MOBILE_URL || process.argv[2] || defaultUrl;
const browserName = process.env.POST_DEPLOY_MOBILE_BROWSER || "chromium";
const outDir = path.resolve(process.env.POST_DEPLOY_MOBILE_OUT_DIR || "output/stream-raid-post-deploy-mobile");
const viewport = parseViewport(process.env.POST_DEPLOY_MOBILE_VIEWPORT || "390x844");

const leaderboardKey = "nunchaku_overdrive_scores_v1";
const removedAction = "s" + "nap";
const removedActionUpper = removedAction.toUpperCase();
const removedActionJa = "\u30b9\u30ca\u30c3\u30d7";
const forbiddenPatterns = [
  { label: "removed Japanese action label", pattern: new RegExp(removedActionJa, "u") },
  { label: "removed uppercase action token", pattern: new RegExp(`(?<![A-Za-z0-9_])${removedActionUpper}(?![A-Za-z0-9_])`, "u") },
  { label: "removed lowercase action token", pattern: new RegExp(`(?<![A-Za-z0-9_])${removedAction}(?!shot(?:s)?|[A-Za-z0-9_])`, "u") },
  { label: "removed snake_case action key", pattern: new RegExp(`(?<![A-Za-z0-9_])${removedAction}_[A-Za-z0-9_]+`, "u") },
  {
    label: "removed camelCase action identifier",
    pattern: new RegExp(`(?<![A-Za-z0-9_])${removedAction}(?:Cd|TouchBtn|Btn|Cooldown|Action|State|Input|Key|Ready|Timer|Charges)(?![A-Za-z0-9_])`, "u"),
  },
];

function parseViewport(value) {
  const [width, height] = String(value)
    .split("x")
    .map((part) => Number.parseInt(part.trim(), 10));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid POST_DEPLOY_MOBILE_VIEWPORT: ${value}`);
  }
  return { width, height };
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, url, ...details }, null, 2));
  process.exit(1);
}

function cleanOutDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch (error) {
    if (!error || error.code !== "EPERM") throw error;
    const fallback = path.join("/private/tmp", `stream-raid-post-deploy-mobile-${Date.now()}`);
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

function parseStateText(text, label = "render_game_to_text") {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${label} returned invalid JSON`, { error: String(error), text });
  }
}

async function state(page) {
  return parseStateText(await page.evaluate(() => window.render_game_to_text()));
}

async function advance(page, ms) {
  return parseStateText(await page.evaluate((value) => window.advanceTime(value), ms), "advanceTime");
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

async function waitForSceneReady(page) {
  try {
    await page.waitForFunction(
      () => Boolean(window.__OVERDRIVE__?.scene?.graphics && document.querySelector("canvas")),
      null,
      { timeout: 10000 },
    );
  } catch (error) {
    fail("Phaser scene did not become render-ready", { error: String(error) });
  }
}

async function waitForCanvasDetail(page, label) {
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
    fail(`Canvas did not render visible gameplay detail during ${label}`, { error: String(error) });
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function matchLegacyResidue(text) {
  for (const { label, pattern } of forbiddenPatterns) {
    const match = String(text).match(pattern);
    if (match) return { label, match: match[0] };
  }
  return null;
}

function childPath(parentPath, key) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key)) return `${parentPath}.${key}`;
  return `${parentPath}[${JSON.stringify(key)}]`;
}

function findLegacyResidue(value, currentPath = "$", findings = []) {
  if (typeof value === "string") {
    const match = matchLegacyResidue(value);
    if (match) findings.push({ path: currentPath, kind: "string", value, ...match });
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findLegacyResidue(item, `${currentPath}[${index}]`, findings));
    return findings;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      const pathName = childPath(currentPath, key);
      const match = matchLegacyResidue(key);
      if (match) findings.push({ path: pathName, kind: "key", value: key, ...match });
      findLegacyResidue(item, pathName, findings);
    }
  }
  return findings;
}

function assertNoLegacyResidue(snapshot, label) {
  const findings = findLegacyResidue(snapshot);
  if (findings.length) fail(`Legacy action residue found during ${label}`, { findings });
}

function assertPortraitPlayable(snapshot, label) {
  const canvas = isRecord(snapshot.canvas) ? snapshot.canvas : null;
  const bounds = isRecord(canvas?.play_bounds) ? canvas.play_bounds : null;
  const player = isRecord(snapshot.player) ? snapshot.player : null;
  if (!canvas || canvas.layout !== "portrait" || canvas.height <= canvas.width) {
    fail(`${label}: viewport did not produce portrait layout`, { canvas });
  }
  for (const key of ["x", "y", "width", "height"]) {
    if (!Number.isFinite(bounds?.[key])) fail(`${label}: canvas.play_bounds.${key} is not finite`, { bounds });
  }
  if (!player || player.x < 0 || player.x > canvas.width || player.y < 0 || player.y > canvas.height) {
    fail(`${label}: player is outside portrait canvas bounds`, { canvas, player });
  }
}

async function clickFirst(page, selectors, label) {
  let lastError = null;
  for (const selector of selectors) {
    try {
      await page.click(selector, { timeout: 3000 });
      return selector;
    } catch (error) {
      lastError = error;
    }
  }
  fail(`Could not click ${label}`, { selectors, error: String(lastError) });
}

async function textContent(page, selector) {
  return String((await page.locator(selector).textContent({ timeout: 3000 })) || "");
}

async function seedLeaderboard(page, snapshot) {
  const season = snapshot.season;
  if (!season?.id) fail("State snapshot does not expose season.id", { snapshot });
  await page.evaluate(
    ({ key, seasonId, startsAt, endsAt }) => {
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify([
          {
            id: "qa-post-deploy-score",
            score: 43210,
            at: now,
            seasonId,
            season_id: seasonId,
            seasonStartAt: startsAt,
            seasonEndAt: endsAt,
            profile: {
              name: "PostDeploy QA",
              sns: "@qa-mobile",
              comment: "portrait leaderboard seed",
            },
          },
        ]),
      );
    },
    { key: leaderboardKey, seasonId: season.id, startsAt: season.starts_at, endsAt: season.ends_at },
  );
}

async function sendTerminalGift(page, channel) {
  await page.evaluate((payload) => {
    window.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: payload }));
  }, {
    source: "stream-raid-terminal",
    channel,
    event: {
      id: "post-deploy-mobile-gift",
      eventType: "gift",
      sender: "post_deploy_mobile",
      giftName: "mobile QA gift",
      label: "mobile QA gift",
      diamondCount: 3,
    },
  });
}

const finalOutDir = cleanOutDir(outDir);
const browserType = browserName === "webkit" ? webkit : chromium;
const browser = await browserType.launch({
  headless: true,
  args: browserName === "webkit" ? [] : ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport });
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
  await waitForSceneReady(page);

  let current = await advance(page, 240);
  assertPortraitPlayable(current, "initial load");
  assertNoLegacyResidue(current, "initial state contract");
  await seedLeaderboard(page, current);

  await clickFirst(page, ["#mobileMenuBtn", "#menuFloatingBtn"], "mobile menu");
  await page.locator("#menuModal:not(.hidden)").waitFor({ timeout: 5000 });
  current = await advance(page, 240);
  if (current.run?.ui_panels?.menu_open !== true) fail("Menu did not open in state snapshot", { current });

  await page.click("#openTikTokSettingsBtn", { timeout: 3000 });
  const channel = `post-deploy-mobile-${Date.now()}`;
  await page.fill("#tiktokRoomInput", "post_deploy_mobile_room");
  await page.fill("#terminalChannelInput", channel);
  await page.click("#saveTikTokSettingsBtn", { timeout: 3000 });
  await page.click("#connectTikTokBtn", { timeout: 3000 });
  let status = await textContent(page, "#streamHookStatus");
  if (!status.includes(channel)) fail("Terminal channel did not connect", { status, channel });

  await sendTerminalGift(page, channel);
  await waitFor(page, (snapshot) => snapshot.run?.live_queue > current.run?.live_queue || snapshot.run?.gift_event?.source === "LIVE post_deploy_mobile", "terminal event envelope");
  status = await textContent(page, "#streamHookStatus");
  if (!status.includes("customEvent")) fail("Terminal status did not report customEvent envelope", { status });

  const leaderText = await textContent(page, "#leaderboardList");
  if (!leaderText.includes("PostDeploy QA") || !leaderText.includes("43210")) {
    fail("Seeded leaderboard row was not rendered in the mobile menu", { leaderText });
  }

  const beforeFeedback = await state(page);
  const feedbackText = `post-deploy mobile feedback ${Date.now()}`;
  await page.fill("#feedbackText", feedbackText);
  await page.click("#feedbackSaveBtn", { timeout: 3000 });
  const feedbackStatus = await textContent(page, "#feedbackStatus");
  if (!feedbackStatus.includes("\u4fdd\u5b58\u3057\u307e\u3057\u305f")) fail("Feedback form did not report saved status", { feedbackStatus });
  const feedbackInput = await page.locator("#feedbackText").inputValue();
  if (feedbackInput !== "") fail("Feedback text was not cleared after a successful save", { feedbackInput });
  current = await waitFor(
    page,
    (snapshot) => Number(snapshot.feedback?.count || 0) > Number(beforeFeedback.feedback?.count || 0),
    "feedback summary count increase",
  );

  await page.click("#closeMenuBtn", { timeout: 3000 });
  await clickFirst(page, ["#mobileStartBtn", "#startBtn"], "mobile start");
  current = await waitFor(page, (snapshot) => snapshot.mode === "running" && snapshot.pause_mode === null, "running portrait gameplay");
  await page.keyboard.down("ArrowRight");
  current = await advance(page, 720);
  await page.keyboard.up("ArrowRight");
  assertPortraitPlayable(current, "running gameplay");
  assertNoLegacyResidue(current, "final state contract");
  await waitForCanvasDetail(page, "final portrait gameplay");

  await page.screenshot({ path: path.join(finalOutDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(finalOutDir, "state-final.json"), JSON.stringify(current, null, 2));

  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        browser: browserName,
        viewport,
        mode: current.mode,
        layout: current.canvas.layout,
        live_queue: current.run.live_queue,
        feedback_count: current.feedback.count,
        artifacts: finalOutDir,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
