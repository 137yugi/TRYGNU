import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const helperUrl = pathToFileURL(path.resolve("public/terminal-live.html")).toString();
const bridgeUrl = "http://127.0.0.1:8091";
const offlineBridgeUrl = "http://127.0.0.1:8092";
const healthRequests = [];
const connectRequests = [];
const offlineConnectRequests = [];

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const context = await browser.newContext();

await context.addInitScript(() => {
  window.__terminalLiveMessages = [];
  window.__terminalLiveStreams = [];

  class StubBroadcastChannel {
    constructor(name) {
      this.name = name;
    }

    postMessage(payload) {
      window.__terminalLiveMessages.push({ name: this.name, payload });
    }

    close() {}
  }

  Object.defineProperty(window, "BroadcastChannel", {
    configurable: true,
    value: StubBroadcastChannel,
  });
  Object.defineProperty(window, "EventSource", {
    configurable: true,
    value: undefined,
  });
});

await context.route("http://127.0.0.1:8091/health", async (route) => {
  healthRequests.push(route.request().url());
  const isFailureProbe = healthRequests.length > 1;
  await route.fulfill({
    status: isFailureProbe ? 503 : 200,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-private-network": "true",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(
      isFailureProbe
        ? {
            ok: false,
            error: {
              code: "bridge_unavailable",
              message: "Bridge helper is offline.",
            },
          }
        : {
            ok: true,
            service: "tiktok_live_bridge",
            events: 2,
            cursor: 612,
            connector: {
              available: true,
              connected: true,
              username: "health_user",
              error: null,
            },
          },
    ),
  });
});

await context.route("http://127.0.0.1:8091/connect", async (route) => {
  const request = route.request();
  const postData = request.postDataJSON();
  connectRequests.push({ method: request.method(), postData });
  await route.fulfill({
    status: 400,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-private-network": "true",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ok: false,
      error: {
        code: "connect_failed",
        message: "Could not connect to TikTok Live for \"fail_user\".",
      },
    }),
  });
});

await context.route("http://127.0.0.1:8091/events**", async (route) => {
  await route.fulfill({
    status: 500,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-private-network": "true",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ ok: false, error: "health test should not poll events" }),
  });
});

await context.route("http://127.0.0.1:8092/connect", async (route) => {
  offlineConnectRequests.push(route.request().url());
  await route.abort("failed");
});

const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const text = message.text();
  const expectedFailedRequest =
    text.includes("Failed to load resource") &&
    (text.includes("503 (Service Unavailable)") || text.includes("400 (Bad Request)") || text.includes("net::ERR_FAILED"));
  if (!expectedFailedRequest) errors.push(text);
});
page.on("pageerror", (err) => errors.push(String(err)));

async function readBridgeUx() {
  return page.evaluate(() => {
    const bridgeChip = document.querySelector("#bridgeChip");
    const connectButton = document.querySelector("#bridgeConnectBtn");
    const startButton = document.querySelector("#bridgeStartBtn");
    const stopButton = document.querySelector("#bridgeStopBtn");
    return {
      status: document.querySelector("#status")?.textContent || "",
      bridgeChip: bridgeChip?.textContent || "",
      bridgeChipBad: Boolean(bridgeChip?.classList.contains("bad")),
      tiktokId: document.querySelector("#bridgeTikTokIdInput")?.value || "",
      connectDisabled: Boolean(connectButton?.disabled),
      startDisabled: Boolean(startButton?.disabled),
      stopDisabled: Boolean(stopButton?.disabled),
      messages: window.__terminalLiveMessages,
      streams: window.__terminalLiveStreams,
      log: document.querySelector("#log")?.textContent || "",
    };
  });
}

try {
  await page.goto(helperUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.fill("#bridgeUrlInput", bridgeUrl);

  await page.click("#bridgeHealthBtn");
  await page.waitForFunction(() => document.querySelector("#bridgeChip")?.textContent.includes("@health_user"), null, {
    timeout: 5000,
  });
  const healthOk = await readBridgeUx();
  assert(healthRequests.length === 1, "Expected one /health request after Bridge確認", { healthRequests });
  assert(healthOk.bridgeChip.includes("bridge:"), "Health success should update the bridge chip", healthOk);
  assert(healthOk.bridgeChip.includes("@health_user"), "Health success should summarize the connector username", healthOk);
  assert(healthOk.bridgeChip.includes("接続中"), "Health success should show connected status", healthOk);
  assert(healthOk.bridgeChip.includes("cursor 612"), "Health success should show the bridge cursor", healthOk);
  assert(!healthOk.bridgeChipBad, "Health success should not mark the bridge chip as bad", healthOk);

  await page.click("#bridgeHealthBtn");
  await page.waitForFunction(() => document.querySelector("#bridgeChip")?.textContent.includes("health失敗"), null, {
    timeout: 5000,
  });
  const healthFailed = await readBridgeUx();
  assert(healthRequests.length === 2, "Expected a second /health request for failure UX", { healthRequests });
  assert(healthFailed.bridgeChip.includes("health失敗"), "Health failure should update the bridge chip", healthFailed);
  assert(healthFailed.bridgeChip.includes("Bridge helper is offline."), "Health failure should surface the server error message", healthFailed);
  assert(healthFailed.bridgeChipBad, "Health failure should mark the bridge chip as bad", healthFailed);

  await page.fill("#bridgeTikTokIdInput", "   ");
  await page.click("#bridgeConnectBtn");
  await page.waitForFunction(() => document.querySelector("#bridgeChip")?.textContent.includes("TikTok IDを入力してください"), null, {
    timeout: 5000,
  });
  const missingId = await readBridgeUx();
  assert(connectRequests.length === 0, "Missing TikTok ID should not call /connect", { connectRequests });
  assert(missingId.bridgeChipBad, "Missing TikTok ID should mark the bridge chip as bad", missingId);
  assert(!missingId.connectDisabled && !missingId.startDisabled && missingId.stopDisabled, "Missing TikTok ID should leave bridge controls idle", missingId);

  await page.fill("#bridgeTikTokIdInput", "@fail_user!");
  await page.click("#bridgeConnectBtn");
  await page.waitForFunction(() => document.querySelector("#bridgeChip")?.textContent.includes("ID接続失敗"), null, {
    timeout: 5000,
  });
  const connectFailed = await readBridgeUx();
  assert(connectRequests.length === 1, "Connect failure should call /connect exactly once", { connectRequests });
  assert(connectRequests[0].method === "POST", "Connect failure request should be POST", connectRequests[0]);
  assert(connectRequests[0].postData.username === "fail_user", "TikTok ID should be sanitized before failed /connect", connectRequests[0]);
  assert(connectFailed.tiktokId === "fail_user", "Failed connect should normalize the TikTok ID input", connectFailed);
  assert(connectFailed.bridgeChip.includes("Could not connect to TikTok Live"), "Connect failure should surface the server error message", connectFailed);
  assert(connectFailed.bridgeChipBad, "Connect failure should mark the bridge chip as bad", connectFailed);
  assert(!connectFailed.connectDisabled && !connectFailed.startDisabled && connectFailed.stopDisabled, "Connect failure should return bridge controls to idle", connectFailed);
  assert(connectFailed.messages.length === 0, "Failure paths should not publish terminal live events", connectFailed);
  assert(connectFailed.streams.length === 0, "Failure paths should not open a bridge EventSource stream", connectFailed);

  await page.fill("#bridgeUrlInput", offlineBridgeUrl);
  await page.fill("#bridgeTikTokIdInput", "offline_user");
  await page.click("#bridgeConnectBtn");
  await page.waitForFunction(() => document.querySelector("#bridgeChip")?.textContent.includes("npm run live:bridge:tiktok"), null, {
    timeout: 5000,
  });
  const offlineFailed = await readBridgeUx();
  assert(offlineConnectRequests.length === 1, "Offline bridge test should attempt /connect once", { offlineConnectRequests });
  assert(offlineFailed.bridgeChip.includes("ローカルbridge未起動"), "Offline bridge failure should identify the missing local bridge", offlineFailed);
  assert(offlineFailed.bridgeChip.includes("npm run live:bridge:tiktok"), "Offline bridge failure should show the recovery command", offlineFailed);
  assert(offlineFailed.bridgeChipBad, "Offline bridge failure should mark the bridge chip as bad", offlineFailed);
  assert(!offlineFailed.connectDisabled && !offlineFailed.startDisabled && offlineFailed.stopDisabled, "Offline bridge failure should return bridge controls to idle", offlineFailed);
  assert(offlineFailed.messages.length === 0, "Offline bridge failure should not publish terminal live events", offlineFailed);
  assert(errors.length === 0, "Browser emitted errors", { errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        helperUrl,
        health_requests: healthRequests.length,
        connectRequests,
        offline_connect_requests: offlineConnectRequests.length,
        final_bridge_status: connectFailed.bridgeChip,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
