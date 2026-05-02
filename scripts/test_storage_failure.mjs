import { chromium } from "playwright";
import { createServer } from "vite";

const port = Number(process.env.STORAGE_FAILURE_PORT || 5191);
const providedUrl = process.env.STORAGE_FAILURE_URL || "";
const url = providedUrl || `http://127.0.0.1:${port}?seed=storage-failure&admin=1`;
const viteCacheDir = process.env.STORAGE_FAILURE_VITE_CACHE_DIR || `/private/tmp/stream-raid-vite-storage-${process.pid}`;
const leaderboardKey = "nunchaku_overdrive_scores_v1";
const profileEntryId = "storage-profile-test";

class TestFailure extends Error {
  constructor(message, details = {}) {
    super(message);
    this.details = details;
  }
}

function fail(message, details = {}) {
  throw new TestFailure(message, details);
}

async function waitForServer(targetUrl, timeoutMs = 15000) {
  const start = Date.now();
  let lastError = "";
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(targetUrl, { method: "GET" });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (err) {
      lastError = String(err);
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
  await withServer(async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    const context = await browser.newContext({ viewport: { width: 932, height: 430 } });
    await context.addInitScript(
      ({ leaderboardKey: key, profileEntryId: entryId }) => {
        const originalSetItem = Storage.prototype.setItem;
        const seasonLengthMs = 14 * 24 * 60 * 60 * 1000;
        const epoch = Date.UTC(2026, 0, 5, 0, 0, 0);
        const now = Date.now();
        const index = Math.max(0, Math.floor((now - epoch) / seasonLengthMs));
        const startAt = epoch + index * seasonLengthMs;
        const endAt = startAt + seasonLengthMs;
        const date = new Date(startAt);
        const idDate = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
        const seasonId = `S${String(index + 1).padStart(3, "0")}-${idDate}`;
        originalSetItem.call(
          window.localStorage,
          key,
          JSON.stringify([
            {
              id: entryId,
              score: 98765,
              at: now,
              seasonId,
              season_id: seasonId,
              seasonStartAt: startAt,
              seasonEndAt: endAt,
              profile: { name: "", sns: "", comment: "" },
              character: "Storage Failure Test",
              time: 42,
            },
          ])
        );
        Object.defineProperty(Storage.prototype, "setItem", {
          configurable: true,
          value() {
            throw new Error("forced localStorage.setItem failure");
          },
        });
      },
      { leaderboardKey, profileEntryId }
    );

    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForFunction(() => typeof window.render_game_to_text === "function" && typeof window.advanceTime === "function", null, {
        timeout: 10000,
      });

      await page.click("#menuFloatingBtn");
      await page.fill("#feedbackText", "storage failure feedback");
      await page.click("#feedbackSaveBtn");
      const feedbackStatus = await page.locator("#feedbackStatus").textContent();
      if (!String(feedbackStatus || "").includes("保存できません")) {
        fail("Feedback save did not show failure UI", { feedbackStatus });
      }
      const feedbackText = await page.locator("#feedbackText").inputValue();
      if (feedbackText !== "storage failure feedback") {
        fail("Feedback text was cleared even though storage failed", { feedbackText });
      }

      await page.click("#openTikTokSettingsBtn");
      await page.fill("#tiktokRoomInput", "storage_room");
      await page.fill("#terminalChannelInput", "storage-failure-channel");
      await page.click("#saveTikTokSettingsBtn");
      const streamStatus = await page.locator("#streamHookStatus").textContent();
      if (!String(streamStatus || "").includes("保存できません")) {
        fail("Stream settings save did not show failure UI", { streamStatus });
      }

      await page.evaluate((entryId) => {
        const overdrive = window.__OVERDRIVE__;
        overdrive.sim.mode = "ended";
        overdrive.sim.pauseMode = null;
        overdrive.sim.lastScoreEntryId = entryId;
        overdrive.dom.sync();
      }, profileEntryId);
      await page.locator("#scoreProfileModal:not(.hidden)").waitFor({ timeout: 5000 });
      await page.fill("#scoreNameInput", "Storage Tester");
      await page.fill("#scoreSnsInput", "@storage");
      await page.fill("#scoreCommentInput", "should fail");
      await page.click("#saveScoreProfileBtn");
      const profileStatus = await page.locator("#scoreProfileSummary").textContent();
      if (!String(profileStatus || "").includes("保存できません")) {
        fail("Profile save did not show failure UI", { profileStatus });
      }
      await page.locator("#scoreProfileModal:not(.hidden)").waitFor({ timeout: 1000 });

      const storedProfile = await page.evaluate(
        ({ key, entryId }) => {
          const rows = JSON.parse(window.localStorage.getItem(key) || "[]");
          return rows.find((row) => row.id === entryId)?.profile || null;
        },
        { key: leaderboardKey, entryId: profileEntryId }
      );
      if (!storedProfile || storedProfile.name || storedProfile.sns || storedProfile.comment) {
        fail("Profile data changed even though localStorage.setItem failed", { storedProfile });
      }
      if (errors.length) fail("Unexpected page errors during storage failure test", { errors });
      console.log(JSON.stringify({ result: "passed", url }, null, 2));
    } finally {
      await browser.close();
    }
  });
} catch (err) {
  if (err instanceof TestFailure) {
    console.error(JSON.stringify({ result: "failed", message: err.message, ...err.details }, null, 2));
  } else {
    console.error(JSON.stringify({ result: "failed", message: String(err) }, null, 2));
  }
  process.exit(1);
}
