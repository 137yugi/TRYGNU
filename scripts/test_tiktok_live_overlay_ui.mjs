import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.TIKTOK_OVERLAY_UI_URL || "http://127.0.0.1:5173?seed=tiktok-overlay-ui";
const outDir = path.resolve(process.env.TIKTOK_OVERLAY_UI_OUT_DIR || "output/stream-raid-tiktok-overlay-ui");
const channel = "stream-raid-live-v1";

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

async function isVisible(locator) {
  try {
    return await locator.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    });
  } catch {
    return false;
  }
}

async function advance(page, ms = 180) {
  await page.evaluate((value) => window.advanceTime(value), ms);
}

function liveEvent(id, eventType, sender, label, diamonds = 1) {
  return {
    id,
    eventType,
    sender,
    giftName: label,
    label,
    diamondCount: diamonds,
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 932, height: 430 }, deviceScaleFactor: 1 });
  const errors = [];
  const bridgeRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("request", (request) => {
    if (request.url().startsWith("http://127.0.0.1:8091/")) bridgeRequests.push(request.url());
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof window.render_game_to_text === "function" && typeof window.receiveTerminalLiveEvent === "function");
    await page.locator("#menuFloatingBtn").click();
    await page.locator("#openTikTokSettingsBtn").click();

    const hiddenAdminSelectors = [
      "#gift100Btn",
      "#browserRelayUrlInput",
      "#terminalChannelInput",
      "#terminalTestEventBtn",
      "#terminalHelperLink",
      "#tiktokDirectProbeLink",
      "#agencySignupLink",
      ".economy",
    ];
    for (const selector of hiddenAdminSelectors) {
      assert(!(await isVisible(page.locator(selector).first())), `Admin-only control should be hidden: ${selector}`);
    }

    await page.locator("#tiktokRoomInput").fill("@yrachac");
    await page.locator("#connectTikTokBtn").click();
    await advance(page, 240);

    assert(bridgeRequests.length === 0, "Normal game UI should not connect directly to the local TikTok bridge", { bridgeRequests });

    const applied = await page.evaluate(
      (payload) => window.receiveTerminalLiveEvent(payload),
      {
        source: "stream-raid-terminal",
        channel,
        nonce: `overlay-ui-${Date.now()}`,
        liveEvents: [
          liveEvent("overlay-gift", "gift", "gift_sender", "Rose", 15),
          liveEvent("overlay-like", "like", "like_sender", "Like Tap", 1),
          liveEvent("overlay-chat", "chat", "chat_sender", "Go", 1),
          liveEvent("overlay-share", "share", "share_sender", "Shared", 2),
          liveEvent("overlay-follow", "follow", "follow_sender", "Followed", 5),
        ],
      }
    );
    assert(applied === 5, "Terminal envelope should apply five visible live events", { applied });
    await advance(page, 240);

    const overlayText = await page.locator("#liveEventList").textContent();
    for (const expected of ["gift_sender", "like_sender", "chat_sender", "share_sender", "follow_sender", "ギフト", "いいね", "コメント", "シェア", "フォロー"]) {
      assert(String(overlayText || "").includes(expected), `Live overlay should include ${expected}`, { overlayText });
    }
    const status = await page.locator("#liveEventOverlayStatus").textContent();
    assert(String(status || "").includes("喝采"), "Battle overlay status should expose applause gauge", { status });

    await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
    assert(errors.length === 0, "Console/page errors should be empty", { errors });
    console.log(JSON.stringify({ result: "ok", applied, outDir }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => fail("Unhandled test failure", { error: String(err?.stack || err) }));
