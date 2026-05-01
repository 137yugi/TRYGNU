import fs from "node:fs";
import path from "node:path";
import { chromium, webkit } from "playwright";

const url = process.env.JOYSTICK_TOUCH_URL || "http://127.0.0.1:5173?seed=virtual-joystick-touch-drag&ads_config=off";
const browserName = process.env.JOYSTICK_TOUCH_BROWSER || "chromium";
const viewportText = process.env.JOYSTICK_TOUCH_VIEWPORT || "390x844";
let outDir = path.resolve(process.env.JOYSTICK_TOUCH_OUT_DIR || `output/stream-raid-virtual-joystick-${browserName}-${viewportText}`);

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function parseViewport(value) {
  const match = String(value || "").match(/^(\d+)x(\d+)$/);
  if (!match) fail("Invalid JOYSTICK_TOUCH_VIEWPORT", { value });
  return { width: Number(match[1]), height: Number(match[2]) };
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

function clientPoint(box, x, y) {
  return { x: Math.round(box.x + x), y: Math.round(box.y + y) };
}

async function dispatchCdpTouch(cdp, type, point) {
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x: point.x, y: point.y, radiusX: 12, radiusY: 12, force: 0.5, id: 17 }],
  });
}

async function dispatchCdpMouse(page, type, point) {
  if (type === "down") {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
  } else if (type === "move") {
    await page.mouse.move(point.x, point.y);
  } else {
    await page.mouse.up();
  }
}

async function dispatchSyntheticPointerCancel(canvas, x, y) {
  await canvas.evaluate(
    (node, payload) => {
      const rect = node.getBoundingClientRect();
      node.dispatchEvent(
        new PointerEvent("pointercancel", {
          bubbles: true,
          cancelable: true,
          composed: true,
          pointerId: 17,
          pointerType: "touch",
          isPrimary: true,
          clientX: rect.left + payload.x,
          clientY: rect.top + payload.y,
          screenX: rect.left + payload.x,
          screenY: rect.top + payload.y,
          buttons: 0,
          pressure: 0,
        }),
      );
    },
    { x, y },
  );
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch (error) {
  if (!error || error.code !== "EPERM") throw error;
  outDir = path.resolve(`/private/tmp/stream-raid-virtual-joystick-${browserName}-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
}

const viewport = parseViewport(viewportText);
const browserType = browserName === "webkit" ? webkit : chromium;
const browser = await browserType.launch({
  headless: true,
  args: browserName === "webkit" ? [] : ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await context.newPage();
const cdp = browserName === "chromium" ? await context.newCDPSession(page) : null;
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
  const canvas = page.locator("#gameCanvas").first();
  const box = await canvas.boundingBox();
  if (!box) fail("Game canvas was not visible");

  const startX = Math.min(Math.max(120, box.width * 0.28), box.width - 120);
  const startY = Math.min(Math.max(180, box.height * 0.72), box.height - 90);
  const dragRightX = startX + 112;
  const dragRightY = startY;
  const dragUpLeftX = startX - 72;
  const dragUpLeftY = startY - 72;

  if (!cdp) {
    await page.touchscreen.tap(box.x + startX, box.y + startY);
    const tapped = await advance(page, 240);
    assert(tapped.mode === "running" && tapped.pause_mode === null, "WebKit touch tap did not start running mode", { tapped });
    assert(tapped.input?.pointer_active === false, "WebKit tap should release pointer input", { input: tapped.input });
    await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
    fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify({ tapped }, null, 2));
    if (errors.length) fail("Browser emitted errors", { errors });
    console.log(JSON.stringify({ result: "ok", mode: "webkit-touch-tap-guard", url, browser: browserName, viewport, artifacts: outDir }, null, 2));
  } else {
  await dispatchCdpTouch(cdp, "touchStart", clientPoint(box, startX, startY));
  let afterDown = await advance(page, 180);
  assert(afterDown.mode === "running" && afterDown.pause_mode === null, "Touch pointerdown did not start running mode", { afterDown });
  assert(afterDown.input?.pointer_active === true, "Touch pointerdown did not activate pointer input", { input: afterDown.input });
  assert(afterDown.input?.pointer_mode === "relative", "Touch pointerdown did not enter relative mode", { input: afterDown.input });
  assert(afterDown.input?.joystick_radius === 72, "Unexpected joystick radius", { input: afterDown.input });

  await dispatchCdpTouch(cdp, "touchMove", clientPoint(box, dragRightX, dragRightY));
  const right = await advance(page, 360);
  assert(right.input?.pointer_active === true && right.input?.pointer_mode === "relative", "Right drag lost relative pointer state", { input: right.input });
  assert(right.input.joystick_x >= 0.98 && Math.abs(right.input.joystick_y) <= 0.08, "Right drag did not clamp to right joystick vector", { input: right.input });
  assert(right.player.vx > 20 || right.player.x > afterDown.player.x + 4, "Right drag did not move player right", { afterDown: afterDown.player, right: right.player });

  await dispatchCdpTouch(cdp, "touchMove", clientPoint(box, dragUpLeftX, dragUpLeftY));
  const upLeft = await advance(page, 360);
  assert(upLeft.input?.joystick_x < -0.65 && upLeft.input?.joystick_y < -0.65, "Diagonal drag did not produce left/up joystick vector", { input: upLeft.input });
  assert(upLeft.player.vx < 0 && upLeft.player.vy < 0, "Diagonal drag did not move player left/up", { upLeft: upLeft.player });

  await dispatchCdpTouch(cdp, "touchEnd", clientPoint(box, dragUpLeftX, dragUpLeftY));
  const released = await advance(page, 700);
  assert(released.input?.pointer_active === false, "Pointer remained active after release", { input: released.input });
  assert(released.input?.joystick_x === 0 && released.input?.joystick_y === 0, "Joystick vector did not clear after release", { input: released.input });

  await dispatchCdpTouch(cdp, "touchStart", clientPoint(box, startX, startY));
  await dispatchCdpTouch(cdp, "touchMove", clientPoint(box, dragRightX, dragRightY));
  await dispatchSyntheticPointerCancel(canvas, dragRightX, dragRightY);
  await dispatchCdpTouch(cdp, "touchEnd", clientPoint(box, dragRightX, dragRightY));
  const cancelled = await advance(page, 240);
  assert(cancelled.input?.pointer_active === false, "Touch cancel left pointer active", { input: cancelled.input });
  assert(cancelled.input?.joystick_x === 0 && cancelled.input?.joystick_y === 0, "Touch cancel did not clear joystick vector", { input: cancelled.input });

  await dispatchCdpMouse(page, "down", clientPoint(box, startX, startY));
  await dispatchCdpMouse(page, "move", clientPoint(box, startX + 80, startY));
  const mouse = await advance(page, 180);
  await dispatchCdpMouse(page, "up", clientPoint(box, startX + 80, startY));
  assert(mouse.input?.pointer_mode === "absolute", "Mouse pointer should stay in absolute mode", { input: mouse.input });
  assert(mouse.input?.joystick_x === 0 && mouse.input?.joystick_y === 0, "Mouse input should not set joystick vector", { input: mouse.input });

  const finalState = await advance(page, 120);
  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify({ afterDown, right, upLeft, released, cancelled, mouse, finalState }, null, 2));
  if (errors.length) fail("Browser emitted errors", { errors });
  console.log(JSON.stringify({ result: "ok", url, browser: browserName, viewport, artifacts: outDir }, null, 2));
  }
} finally {
  await context.close();
  await browser.close();
}
