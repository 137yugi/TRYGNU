import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:5173?seed=equipment-catalog";
const outDir = process.argv[3] || "output/overdrive-equipment-catalog";
fs.mkdirSync(outDir, { recursive: true });
for (const name of fs.readdirSync(outDir)) {
  if (/^(errors|diagnostic)-/.test(name)) fs.rmSync(path.join(outDir, name), { force: true });
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
});
page.on("pageerror", (err) => errors.push({ type: "pageerror", text: String(err) }));

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.click("#startBtn");
  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.spawnDrop !== "function") throw new Error("GameSim spawnDrop unavailable");
    sim.spawnDrop(sim.player.x, sim.player.y, "legendary");
    sim.waveState = "reward";
    dom?.sync?.();
  });
  for (let i = 0; i < 8; i += 1) await page.evaluate(() => window.advanceTime(1000 / 60));
  const compareState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  fs.writeFileSync(path.join(outDir, "compare-state.json"), JSON.stringify(compareState, null, 2));
  if (compareState.pause_mode !== "pickup_compare") throw new Error("Legendary equipment did not open pickup_compare");
  const dropItem = compareState.inventory?.pickup_compare?.drop_item;
  if (!dropItem) throw new Error("pickup_compare.drop_item missing");
  if (!["legendary", "ancient"].includes(dropItem.rarity)) throw new Error(`expected legendary/ancient, got ${dropItem.rarity}`);
  if (!Array.isArray(dropItem.affixes) || dropItem.affixes.length < 5) throw new Error("legendary item has too few affixes");
  if ((compareState.inventory?.affix_catalog_count || 0) < 30) throw new Error("affix catalog count is below 30");
  if ((compareState.combat?.skill_catalog_count || 0) < 30) throw new Error("skill catalog count is below 30");

  await page.click("#pickupKeepBtn");
  await page.waitForTimeout(120);
  const equippedState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  fs.writeFileSync(path.join(outDir, "equipped-state.json"), JSON.stringify(equippedState, null, 2));
  if (equippedState.pause_mode !== null) throw new Error("pickup_compare did not close after equip");
  if (!equippedState.inventory?.equipped_item) throw new Error("equipped_item missing after equip");
  if (!equippedState.inventory?.equipment_mods) throw new Error("equipment_mods missing after equip");
  await page.screenshot({ path: path.join(outDir, "page.png"), fullPage: true });
  await page.locator("canvas").first().screenshot({ path: path.join(outDir, "canvas.png") });
  if (errors.length) {
    fs.writeFileSync(path.join(outDir, "errors-final.json"), JSON.stringify(errors, null, 2));
    throw new Error("console/page errors captured");
  }
  console.log("equipment catalog ok");
} catch (err) {
  fs.writeFileSync(path.join(outDir, "diagnostic-failure.json"), JSON.stringify({ error: err.message || String(err), errors }, null, 2));
  throw err;
} finally {
  await browser.close();
}
