import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.LIVE_STORM_URL || "http://127.0.0.1:5173?seed=live-storm";
let outDir = path.resolve(process.env.LIVE_STORM_OUT_DIR || "output/stream-raid-live-storm");
const eventCount = Number.parseInt(process.env.LIVE_STORM_COUNT || "204", 10);
const queuedEventCount = Number.parseInt(process.env.LIVE_STORM_QUEUE_COUNT || "96", 10);
const liveQueueLimit = 72;
const channel = process.env.LIVE_STORM_CHANNEL || "stream-raid-live-storm-" + Date.now();

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function parseStateText(text, label = "render_game_to_text") {
  try {
    return JSON.parse(text);
  } catch (err) {
    fail(label + " returned invalid JSON", { error: String(err), text });
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
  fail("Timed out waiting for " + label, { state: current });
}

async function streamStatus(page) {
  return page.locator("#streamHookStatus").textContent().catch(() => "");
}

function makeStormEvents(count, prefix = "storm") {
  const kinds = ["gift", "ad_obstacle", "like", "share"];
  const gifts = ["Rose", "Galaxy", "Tiny Dino", "Lightning", "Arena Drum"];
  return Array.from({ length: count }, (_, index) => {
    const kind = kinds[index % kinds.length];
    const duplicateBucket = Math.floor(index / 31);
    const duplicateId = index % 31 === 29 || index % 31 === 30 ? prefix + "-duplicate-" + duplicateBucket : null;
    const id = duplicateId || prefix + "-" + kind + "-" + index;
    const repeatCount = index % 17 === 0 ? 5 : index % 9 === 0 ? 3 : 1;
    const base = {
      id,
      eventType: kind,
      type: kind,
      sender: "storm_viewer_" + (index % 43),
      repeatCount,
      diamondCount: kind === "gift" ? 3 + (index % 19) : kind === "ad_obstacle" ? 2 + (index % 13) : 1,
    };
    if (kind === "gift") return { ...base, giftName: gifts[index % gifts.length] };
    if (kind === "ad_obstacle") return { ...base, label: index % 2 === 0 ? "ad_obstacle banner" : "advert sponsor block" };
    if (kind === "like") return { ...base, label: "like burst" };
    return { ...base, label: "share wave" };
  });
}

function finiteQueueSnapshot(snapshot) {
  const run = snapshot && typeof snapshot === "object" ? snapshot.run : null;
  const liveQueue = Number(run?.live_queue);
  const livePressure = Number(run?.live_pressure);
  const droppedLiveEvents = Number(run?.dropped_live_events);
  const activeAds = run?.active_ads;
  const adQueue = run?.ad_queue;
  const failures = [];
  if (!Number.isFinite(liveQueue) || liveQueue < 0) failures.push("run.live_queue is not a finite non-negative number");
  if (!Number.isFinite(livePressure) || livePressure < 0) failures.push("run.live_pressure is not a finite non-negative number");
  if (typeof run?.live_storm !== "boolean") failures.push("run.live_storm is not a boolean");
  if (!Number.isFinite(droppedLiveEvents) || droppedLiveEvents < 0) failures.push("run.dropped_live_events is not a finite non-negative number");
  if (!Array.isArray(activeAds)) failures.push("run.active_ads is not an array");
  if (!Array.isArray(adQueue)) failures.push("run.ad_queue is not an array");
  return {
    ok: failures.length === 0,
    failures,
    live_queue: Number.isFinite(liveQueue) ? liveQueue : null,
    live_pressure: Number.isFinite(livePressure) ? livePressure : null,
    live_storm: typeof run?.live_storm === "boolean" ? run.live_storm : null,
    dropped_live_events: Number.isFinite(droppedLiveEvents) ? droppedLiveEvents : null,
    active_ads: Array.isArray(activeAds) ? activeAds.length : null,
    ad_queue: Array.isArray(adQueue) ? adQueue.length : null,
  };
}

async function assertBrowserResponsive(page) {
  const probe = await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => {
          resolve({
            renderReady: typeof window.render_game_to_text === "function",
            advanceReady: typeof window.advanceTime === "function",
            bodyConnected: Boolean(document.body?.isConnected),
            visibility: document.visibilityState,
          });
        });
      })
  );
  if (!probe.renderReady || !probe.advanceReady || !probe.bodyConnected) {
    fail("Browser page stopped responding after live storm", { probe });
  }
  return probe;
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
} catch {
  outDir = path.resolve(`/private/tmp/stream-raid-live-storm-${Date.now()}`);
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
page.on("pageerror", (err) => errors.push(String(err)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function" && typeof window.advanceTime === "function", null, {
    timeout: 10000,
  });

  await page.click("#startBtn");
  let current = await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "fighting", "fighting wave");

  await page.click("#menuFloatingBtn");
  await page.click("#openTikTokSettingsBtn");
  await page.fill("#terminalChannelInput", channel);
  await page.click("#connectTikTokBtn");
  const connectedStatus = await streamStatus(page);
  if (!String(connectedStatus || "").includes("端末受信ON")) {
    fail("Terminal input did not turn ON before live storm", { channel, connectedStatus, state: current });
  }
  await page.click("#closeMenuBtn");
  current = await waitFor(page, (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "fighting", "fighting wave after terminal setup");

  await page.evaluate(() => {
    const sim = window.__OVERDRIVE__?.sim;
    const dom = window.__OVERDRIVE__?.dom;
    if (!sim || typeof sim.startWave !== "function") throw new Error("GameSim startWave test hook is unavailable");
    sim.startWave((sim.wave || 1) + 1);
    dom?.sync?.();
  });
  const waveHeadBefore = await waitFor(
    page,
    (s) => s.mode === "running" && s.pause_mode === null && s.run.wave_state === "spawning",
    "forced spawning wave for live queue"
  );
  const waveHeadDiamonds = waveHeadBefore.economy.diamonds;
  const waveHeadAccepted = await page.evaluate((payload) => window.receiveTerminalLiveEvent(payload), {
    source: "stream-raid-terminal",
    event: {
      id: "wave-head-gift-1",
      eventType: "gift",
      sender: "wave_head_viewer",
      giftName: "Wave Head Check",
      diamondCount: 23,
    },
  });
  if (waveHeadAccepted !== 1) fail("Terminal API did not receive the wave-head payload", { waveHeadAccepted });
  const waveHeadQueued = await state(page);
  if (waveHeadQueued.run.live_queue !== 1 || waveHeadQueued.economy.diamonds !== waveHeadDiamonds) {
    fail("Wave-head live event was not held in queue during spawning", { waveHeadBefore, waveHeadQueued });
  }
  const waveHeadEarly = await advance(page, 1000);
  if (waveHeadEarly.run.live_queue !== 1 || waveHeadEarly.economy.diamonds !== waveHeadDiamonds) {
    fail("Wave-head live event released before the spawn grace delay", { waveHeadEarly, waveHeadDiamonds });
  }
  const waveHeadReleased = await waitFor(
    page,
    (s) => s.run.wave_state === "fighting" && s.run.live_queue === 0 && s.economy.diamonds >= waveHeadDiamonds + 23,
    "wave-head queued live event release",
    7000
  );
  current = waveHeadReleased;

  const events = makeStormEvents(Math.max(1, eventCount));
  const accepted = await page.evaluate((payload) => window.receiveTerminalLiveEvent(payload), {
    source: "stream-raid-terminal",
    events,
  });
  if (accepted !== events.length) {
    fail("Terminal API did not receive the whole storm payload", { accepted, expected: events.length });
  }

  const afterInject = await state(page);
  const injectQueues = finiteQueueSnapshot(afterInject);
  if (!injectQueues.ok) fail("Queue fields were not finite after storm injection", { failures: injectQueues.failures, afterInject });

  current = afterInject;
  for (let i = 0; i < 8; i += 1) current = await advance(page, 250);
  const afterAdvance = current;
  const finalQueues = finiteQueueSnapshot(afterAdvance);
  if (!finalQueues.ok) fail("Queue fields were not finite after advancing storm state", { failures: finalQueues.failures, afterAdvance });
  if (!finalQueues.live_storm || (finalQueues.live_pressure ?? 0) <= 0) {
    fail("Live storm pressure did not activate after storm injection", { finalQueues, afterAdvance });
  }

  const absurdQueueLimit = events.length + 32;
  if (
    (finalQueues.live_queue ?? 0) > absurdQueueLimit ||
    (finalQueues.active_ads ?? 0) > absurdQueueLimit ||
    (finalQueues.ad_queue ?? 0) > absurdQueueLimit
  ) {
    fail("Storm queues grew beyond the injected payload size", { finalQueues, absurdQueueLimit });
  }

  await page.click("#menuFloatingBtn");
  const queuedEvents = makeStormEvents(Math.max(1, queuedEventCount), "queued-storm");
  const queuedAccepted = await page.evaluate((payload) => window.receiveTerminalLiveEvent(payload), {
    source: "stream-raid-terminal",
    events: queuedEvents,
  });
  if (queuedAccepted !== queuedEvents.length) {
    fail("Terminal API did not receive the whole queued storm payload", { queuedAccepted, expected: queuedEvents.length });
  }
  const queuedState = await state(page);
  const queuedQueues = finiteQueueSnapshot(queuedState);
  if (!queuedQueues.ok) fail("Queue fields were not finite while paused", { failures: queuedQueues.failures, queuedState });
  if (queuedState.pause_mode !== "menu") fail("Queued storm was not injected during menu pause", { pause_mode: queuedState.pause_mode });
  if ((queuedQueues.live_queue ?? 0) <= 0) fail("Paused live storm did not queue any event", { queuedQueues, queuedState });
  if ((queuedQueues.live_queue ?? 0) > liveQueueLimit) fail("Paused live storm exceeded queue cap", { queuedQueues, liveQueueLimit });
  if (queuedEvents.length > liveQueueLimit && (queuedQueues.dropped_live_events ?? 0) <= (finalQueues.dropped_live_events ?? 0)) {
    fail("Paused live storm did not report dropped/compressed events after queue cap", {
      before: finalQueues.dropped_live_events,
      after: queuedQueues.dropped_live_events,
      liveQueueLimit,
    });
  }

  await page.click("#closeMenuBtn");
  let afterQueuedRelease = queuedState;
  for (let i = 0; i < 14; i += 1) afterQueuedRelease = await advance(page, 250);
  const releaseQueues = finiteQueueSnapshot(afterQueuedRelease);
  if (!releaseQueues.ok) fail("Queue fields were not finite after releasing paused storm", { failures: releaseQueues.failures, afterQueuedRelease });
  if ((releaseQueues.live_queue ?? 0) >= (queuedQueues.live_queue ?? 0)) {
    fail("Paused live storm queue did not start releasing after resume", { queuedQueues, releaseQueues, afterQueuedRelease });
  }

  const responsiveness = await assertBrowserResponsive(page);
  await page.screenshot({ path: path.join(outDir, "page-final.png"), fullPage: true });
  fs.writeFileSync(path.join(outDir, "state-after-inject.json"), JSON.stringify(afterInject, null, 2));
  fs.writeFileSync(path.join(outDir, "state-final.json"), JSON.stringify(afterQueuedRelease, null, 2));
  fs.writeFileSync(path.join(outDir, "state-queued.json"), JSON.stringify(queuedState, null, 2));
  fs.writeFileSync(path.join(outDir, "state-after-queued-release.json"), JSON.stringify(afterQueuedRelease, null, 2));

  if (errors.length) {
    fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
    fail("Browser emitted console/page errors during live storm", { errors, artifacts: outDir });
  }

  const summary = {
    result: "ok",
    url,
    channel,
    events: events.length,
    accepted,
    queued_events: queuedEvents.length,
    queued_accepted: queuedAccepted,
    wave_head: {
      accepted: waveHeadAccepted,
      held_during_spawning: waveHeadQueued.run.live_queue,
      early_queue: waveHeadEarly.run.live_queue,
      released_diamonds: waveHeadReleased.economy.diamonds,
      expected_delta: 23,
    },
    after_inject: injectQueues,
    final: finalQueues,
    queued: queuedQueues,
    after_queued_release: releaseQueues,
    mode: afterQueuedRelease.mode,
    pause_mode: afterQueuedRelease.pause_mode,
    wave_state: afterQueuedRelease.run?.wave_state,
    diamonds: afterQueuedRelease.economy?.diamonds,
    responsiveness,
    artifacts: outDir,
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
