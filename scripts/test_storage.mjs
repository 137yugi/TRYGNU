import { chromium } from "playwright";
import { createServer } from "vite";

const port = Number(process.env.SEASON_STORAGE_PORT || 5192);
const url = `http://127.0.0.1:${port}?seed=season-storage`;
const viteCacheDir = process.env.SEASON_STORAGE_VITE_CACHE_DIR || `/private/tmp/stream-raid-vite-season-${process.pid}`;

class TestFailure extends Error {
  constructor(message, details = {}) {
    super(message);
    this.details = details;
  }
}

function fail(message, details = {}) {
  throw new TestFailure(message, details);
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
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const result = await page.evaluate(async () => {
      const season = await import("/src/systems/season.ts");
      const epoch = Date.UTC(2026, 0, 5, 0, 0, 0);
      const firstSeasonNow = epoch + 60 * 60 * 1000;
      const secondSeasonNow = epoch + 15 * 24 * 60 * 60 * 1000;
      const originalNow = Date.now;
      const withNow = (value, run) => {
        Date.now = () => value;
        try {
          return run();
        } finally {
          Date.now = originalNow;
        }
      };

      localStorage.removeItem(season.SEASON_STORAGE_KEY);
      localStorage.removeItem(season.LEADERBOARD_STORAGE_KEY);
      localStorage.removeItem(season.FEEDBACK_STORAGE_KEY);

      const s1 = season.getCurrentSeason(firstSeasonNow);
      const s2 = season.getCurrentSeason(secondSeasonNow);
      const low = withNow(firstSeasonNow, () =>
        season.saveLeaderboardEntry(1000, { score: 999999, seasonId: "tampered", season_id: "tampered", name: "Low" })
      );
      const high = withNow(firstSeasonNow + 1000, () => season.saveLeaderboardEntry(2500, { name: "High" }));
      const next = withNow(secondSeasonNow, () => season.saveLeaderboardEntry(777, { name: "Next" }));
      const updated = season.updateLeaderboardEntryProfile(high.id, {
        name: "Season Ace",
        sns: "@season",
        comment: "best kept",
      });
      const s1Best = season.getSeasonPersonalBest(s1.id);
      const s2Best = season.getSeasonPersonalBest(s2.id);
      const s1Entries = season.getLeaderboardEntries(s1.id);
      const s2Entries = season.getLeaderboardEntries(s2.id);
      const summary = season.getLeaderboardSummary(s1.id);
      const review = season.buildSeasonReviewExport(s1.id);
      const rawRows = JSON.parse(localStorage.getItem(season.LEADERBOARD_STORAGE_KEY) || "[]");

      return {
        storageKeys: {
          season: season.SEASON_STORAGE_KEY,
          leaderboard: season.LEADERBOARD_STORAGE_KEY,
          feedback: season.FEEDBACK_STORAGE_KEY,
        },
        s1,
        s2,
        low,
        high,
        next,
        updated,
        s1Best,
        s2Best,
        s1Entries,
        s2Entries,
        summary,
        review,
        rawRows,
        persistedSeason: JSON.parse(localStorage.getItem(season.SEASON_STORAGE_KEY) || "{}"),
      };
    });

    if (result.storageKeys.season !== "synapse_storm_season_v1") fail("Unexpected season storage key", result.storageKeys);
    if (result.storageKeys.leaderboard !== "nunchaku_overdrive_scores_v1") fail("Unexpected leaderboard storage key", result.storageKeys);
    if (result.s1.id === result.s2.id) fail("Season ids did not advance", { s1: result.s1, s2: result.s2 });
    if (result.low.score !== 1000 || result.low.seasonId !== result.s1.id) fail("saveLeaderboardEntry allowed payload to override system fields", result.low);
    if (result.s1Best.score !== 2500 || result.s1Best.entry_id !== result.high.id) fail("First season personal best is wrong", result.s1Best);
    if (result.s2Best.score !== 777 || result.s2Best.entry_id !== result.next.id) fail("Second season personal best is wrong", result.s2Best);
    if (result.s1Entries.length !== 2 || result.s2Entries.length !== 1) fail("Leaderboard rows were not isolated by season", {
      s1Entries: result.s1Entries,
      s2Entries: result.s2Entries,
    });
    if (!result.updated?.profile || result.updated.profile.name !== "Season Ace") fail("Profile update was not persisted", result.updated);
    if (result.summary.personal_best_score !== 2500 || result.summary.personal_best_entry_id !== result.high.id) fail("Summary personal best fields are wrong", result.summary);
    if (result.review.leaderboard.personal_best.score !== 2500) fail("Export personal best is wrong", result.review.leaderboard);
    if (!result.rawRows.every((row) => row.seasonId === row.season_id)) fail("Rows did not keep seasonId/season_id mirror", result.rawRows);
    if (errors.length) fail("Unexpected page errors during season storage test", { errors });
    console.log(JSON.stringify({ result: "passed", url, season_ids: [result.s1.id, result.s2.id] }, null, 2));
  } finally {
    await browser.close();
  }
} catch (err) {
  if (err instanceof TestFailure) {
    console.error(JSON.stringify({ result: "failed", message: err.message, ...err.details }, null, 2));
  } else {
    console.error(JSON.stringify({ result: "failed", message: String(err) }, null, 2));
  }
  process.exitCode = 1;
} finally {
  await server.close();
}
