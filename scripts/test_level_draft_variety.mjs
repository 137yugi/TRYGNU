import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.LEVEL_DRAFT_URL || "http://127.0.0.1:5173?seed=level-draft-variety";
let outDir = path.resolve(process.env.LEVEL_DRAFT_OUT_DIR || "output/stream-raid-level-draft-variety");
const kineticKinds = new Set(["clone", "spin", "shockwave", "chain", "saw", "gravity", "bleed"]);
const survivalKinds = new Set(["maxHp", "lifesteal", "reflect", "enemySlow", "frost", "damageReduction"]);

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function roleFor(choice) {
  const kinds = new Set((choice.effects || []).map((effect) => effect.kind));
  if ([...kineticKinds].some((kind) => kinds.has(kind))) return "kinetic";
  if ([...survivalKinds].some((kind) => kinds.has(kind))) return "survival";
  return "pressure";
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch {
  outDir = path.resolve(`/private/tmp/stream-raid-level-draft-variety-${Date.now()}`);
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
  await page.waitForFunction(() => window.__OVERDRIVE__?.sim && typeof window.render_game_to_text === "function", null, { timeout: 10000 });
  await page.click("#startBtn");

  const drafts = await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.openLevelUp !== "function") throw new Error("openLevelUp hook unavailable");
    const result = [];
    for (let i = 0; i < 18; i += 1) {
      sim.pauseMode = null;
      sim.openLevelUp();
      result.push(
        sim.levelChoices.map((choice) => ({
          id: choice.id,
          effects: choice.effects,
        }))
      );
      sim.pauseMode = null;
    }
    dom?.sync?.();
    return result;
  });

  const failures = [];
  for (let index = 0; index < drafts.length; index += 1) {
    const choices = drafts[index];
    const roles = choices.map(roleFor);
    const uniqueRoles = new Set(roles);
    if (choices.length !== 3) failures.push({ index, reason: "choice_count", choices, roles });
    if (!roles.includes("kinetic")) failures.push({ index, reason: "missing_kinetic", choices, roles });
    if (uniqueRoles.size < 2) failures.push({ index, reason: "too_few_roles", choices, roles });
  }
  if (failures.length) fail("Level draft variety failed", { failures, drafts });

  const snapshot = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  fs.writeFileSync(path.join(outDir, "drafts.json"), JSON.stringify({ drafts, snapshot }, null, 2));
  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        drafts: drafts.length,
        sample: drafts.slice(0, 3).map((choices) => choices.map((choice) => choice.id)),
        artifacts: outDir,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
