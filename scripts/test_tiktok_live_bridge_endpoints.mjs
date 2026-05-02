import { spawn } from "node:child_process";
import net from "node:net";

const host = "127.0.0.1";
const bridgeScript = "scripts/tiktok_live_bridge.mjs";

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

function assertHeaderIncludes(headers, name, expected, context = {}) {
  const actual = headers.get(name) || "";
  assert(actual.toLowerCase().includes(String(expected).toLowerCase()), `Header ${name} should include ${expected}`, {
    ...context,
    actual,
  });
}

function assertBridgeHeaders(response, context = {}) {
  const expectedOrigin = context.expectedOrigin === undefined ? "*" : context.expectedOrigin;
  if (expectedOrigin === null) {
    assert(!response.headers.has("access-control-allow-origin"), "Forbidden origin should not receive access-control-allow-origin", context);
  } else {
    assertHeaderIncludes(response.headers, "access-control-allow-origin", expectedOrigin, context);
  }
  assertHeaderIncludes(response.headers, "access-control-allow-private-network", "true", context);
  assertHeaderIncludes(response.headers, "vary", "Origin", context);
  assertHeaderIncludes(response.headers, "vary", "Access-Control-Request-Private-Network", context);
}

function assertErrorShape(body, expectedCode, context = {}) {
  assert(body && body.ok === false, "Error response should include ok:false", { ...context, body });
  assert(body.error && typeof body.error === "object", "Error response should include an error object", { ...context, body });
  assert(body.error.code === expectedCode, `Error code should be ${expectedCode}`, { ...context, body });
  assert(typeof body.error.message === "string" && body.error.message.length > 0, "Error message should be a non-empty string", {
    ...context,
    body,
  });
  assert(typeof body.error.detail === "string", "Error detail should be a string", { ...context, body });
  assert(Number.isFinite(Number(body.error.at)), "Error at should be numeric", { ...context, body });
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      const port = address && typeof address === "object" ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForListening(child, port) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Timed out waiting for bridge listening on ${port}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`));
    }, 8000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (!settled && stdout.includes("listening")) {
        settled = true;
        clearTimeout(timeout);
        resolve({ stdout, stderr });
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("exit", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Bridge exited before listening: code=${code} signal=${signal}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`));
    });
  });
}

async function startBridge(port) {
  const child = spawn(process.execPath, [bridgeScript], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TIKTOK_LIVE_BRIDGE_HOST: host,
      TIKTOK_LIVE_BRIDGE_PORT: String(port),
      TIKTOK_LIVE_RETRY_MS: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const startup = await waitForListening(child, port);
  return { child, startup };
}

async function stopBridge(child) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve();
    }, 2500);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill("SIGTERM");
  });
}

async function jsonRequest(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || "GET",
    headers: options.headers || undefined,
    body: options.body,
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (err) {
    fail("Expected JSON response", { pathname, status: response.status, text, parse_error: String(err) });
  }
  return { response, body, text };
}

function parseSseMessage(raw) {
  const message = {
    raw,
    id: "",
    retry: "",
    event: "message",
    data: null,
    dataText: "",
  };
  const dataLines = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon >= 0 ? line.slice(0, colon) : line;
    const value = colon >= 0 ? line.slice(colon + 1).replace(/^ /, "") : "";
    if (field === "id") message.id = value;
    if (field === "retry") message.retry = value;
    if (field === "event") message.event = value;
    if (field === "data") dataLines.push(value);
  }
  message.dataText = dataLines.join("\n");
  if (message.dataText) {
    try {
      message.data = JSON.parse(message.dataText);
    } catch {
      message.data = message.dataText;
    }
  }
  return message;
}

async function readSseUntil(reader, state, predicate, label, timeoutMs = 5000) {
  const decoder = new TextDecoder();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let splitIndex = state.buffer.indexOf("\n\n");
    while (splitIndex >= 0) {
      const raw = state.buffer.slice(0, splitIndex);
      state.buffer = state.buffer.slice(splitIndex + 2);
      const message = parseSseMessage(raw);
      state.messages.push(message);
      if (predicate(message)) return message;
      splitIndex = state.buffer.indexOf("\n\n");
    }

    const remaining = Math.max(1, deadline - Date.now());
    const result = await Promise.race([
      reader.read(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out waiting for SSE ${label}`)), remaining)),
    ]);
    if (result.done) break;
    state.buffer += decoder.decode(result.value, { stream: true });
  }
  fail(`Timed out waiting for SSE ${label}`, { messages: state.messages, buffered: state.buffer });
}

const port = await getFreePort();
const baseUrl = `http://${host}:${port}`;
let child = null;
let streamReader = null;
let abortStream = null;

try {
  const started = await startBridge(port);
  child = started.child;

  const health = await jsonRequest(baseUrl, "/health");
  assert(health.response.status === 200, "/health should return 200", { status: health.response.status, body: health.body });
  assertBridgeHeaders(health.response, { endpoint: "/health" });
  assert(health.body.ok === true, "/health should return ok:true", health.body);
  assert(health.body.service === "tiktok_live_bridge", "/health should identify the bridge service", health.body);
  assert(health.body.connector && typeof health.body.connector === "object", "/health should include connector status", health.body);

  const pagesHealth = await jsonRequest(baseUrl, "/health", {
    headers: { Origin: "https://137yugi.github.io" },
  });
  assert(pagesHealth.response.status === 200, "GitHub Pages origin should be allowed", {
    status: pagesHealth.response.status,
    body: pagesHealth.body,
  });
  assertBridgeHeaders(pagesHealth.response, { endpoint: "/health pages origin", expectedOrigin: "https://137yugi.github.io" });

  const fileHealth = await jsonRequest(baseUrl, "/health", {
    headers: { Origin: "null" },
  });
  assert(fileHealth.response.status === 200, "file:// null origin should be allowed", {
    status: fileHealth.response.status,
    body: fileHealth.body,
  });
  assertBridgeHeaders(fileHealth.response, { endpoint: "/health null origin", expectedOrigin: "null" });

  const localHealth = await jsonRequest(baseUrl, "/health", {
    headers: { Origin: "http://127.0.0.1:5173" },
  });
  assert(localHealth.response.status === 200, "127.0.0.1 origin should be allowed", {
    status: localHealth.response.status,
    body: localHealth.body,
  });
  assertBridgeHeaders(localHealth.response, { endpoint: "/health 127 origin", expectedOrigin: "http://127.0.0.1:5173" });

  const forbiddenOrigin = await jsonRequest(baseUrl, "/demo", {
    method: "OPTIONS",
    headers: {
      Origin: "https://evil.example",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Private-Network": "true",
    },
  });
  assert(forbiddenOrigin.response.status === 403, "Forbidden origin should receive 403", {
    status: forbiddenOrigin.response.status,
    body: forbiddenOrigin.body,
  });
  assertBridgeHeaders(forbiddenOrigin.response, { endpoint: "forbidden origin", expectedOrigin: null });
  assertErrorShape(forbiddenOrigin.body, "origin_forbidden", { endpoint: "forbidden origin" });

  const options = await jsonRequest(baseUrl, "/connect", {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Private-Network": "true",
    },
  });
  assert(options.response.status === 200, "OPTIONS /connect should return 200", { status: options.response.status, body: options.body });
  assertBridgeHeaders(options.response, { endpoint: "OPTIONS /connect", expectedOrigin: "http://localhost:5173" });
  assert(options.body.ok === true, "OPTIONS /connect should return ok:true", options.body);

  const malformedConnect = await jsonRequest(baseUrl, "/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{\"bad\"",
  });
  assert(malformedConnect.response.status === 400, "Malformed /connect should return 400", {
    status: malformedConnect.response.status,
    body: malformedConnect.body,
  });
  assertBridgeHeaders(malformedConnect.response, { endpoint: "malformed /connect" });
  assertErrorShape(malformedConnect.body, "invalid_payload", { endpoint: "malformed /connect" });

  const missingId = await jsonRequest(baseUrl, "/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(missingId.response.status === 400, "Missing tiktokId /connect should return 400", {
    status: missingId.response.status,
    body: missingId.body,
  });
  assertBridgeHeaders(missingId.response, { endpoint: "missing tiktokId /connect" });
  assertErrorShape(missingId.body, "missing_tiktok_id", { endpoint: "missing tiktokId /connect" });

  const demo = await jsonRequest(baseUrl, "/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "endpoint-demo-1",
      type: "gift",
      sender: "endpoint_alice",
      giftName: "Endpoint Rose",
      diamondCount: 17,
    }),
  });
  assert(demo.response.status === 200, "/demo should return 200", { status: demo.response.status, body: demo.body });
  assertBridgeHeaders(demo.response, { endpoint: "/demo" });
  assert(demo.body.ok === true && demo.body.accepted, "/demo should accept an event", demo.body);
  assert(demo.body.accepted.id === 1, "/demo first event id should be 1", demo.body);
  assert(demo.body.accepted.sender === "endpoint_alice", "/demo sender should round-trip", demo.body);
  assert(demo.body.accepted.giftName === "Endpoint Rose", "/demo giftName should round-trip", demo.body);
  assert(demo.body.accepted.diamonds === 17, "/demo diamonds should round-trip", demo.body);
  assert(demo.body.cursor === 1, "/demo cursor should advance", demo.body);

  const duplicate = await jsonRequest(baseUrl, "/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "endpoint-demo-1",
      type: "gift",
      sender: "endpoint_alice",
      giftName: "Endpoint Rose",
      diamondCount: 17,
    }),
  });
  assert(duplicate.response.status === 200, "Duplicate /demo should return 200", {
    status: duplicate.response.status,
    body: duplicate.body,
  });
  assert(duplicate.body.ok === true && duplicate.body.deduped === true, "Duplicate /demo should be deduped", duplicate.body);
  assert(duplicate.body.cursor === 1, "Duplicate /demo should not advance cursor", duplicate.body);

  const events = await jsonRequest(baseUrl, "/events?since=0&max=10");
  assert(events.response.status === 200, "/events should return 200", { status: events.response.status, body: events.body });
  assertBridgeHeaders(events.response, { endpoint: "/events" });
  assert(events.body.ok === true, "/events should return ok:true", events.body);
  assert(events.body.cursor === 1, "/events cursor should match accepted event", events.body);
  assert(Array.isArray(events.body.events) && events.body.events.length === 1, "/events should include accepted event", events.body);
  assert(events.body.events[0].id === 1 && events.body.events[0].giftName === "Endpoint Rose", "/events event mismatch", events.body);

  abortStream = new AbortController();
  const stream = await fetch(`${baseUrl}/stream`, { signal: abortStream.signal });
  assert(stream.status === 200, "/stream should return 200", { status: stream.status });
  assertHeaderIncludes(stream.headers, "content-type", "text/event-stream", { endpoint: "/stream" });
  assertBridgeHeaders(stream, { endpoint: "/stream" });
  streamReader = stream.body.getReader();
  const sseState = { buffer: "", messages: [] };
  const statusMessage = await readSseUntil(streamReader, sseState, (message) => message.event === "status", "status");
  assert(statusMessage.id === "1", "Initial SSE status should include cursor id", statusMessage);
  assert(statusMessage.retry === "5000", "Initial SSE status should include retry", statusMessage);
  assert(statusMessage.data && statusMessage.data.cursor === 1, "Initial SSE status data should include cursor", statusMessage);

  const streamedDemo = await jsonRequest(baseUrl, "/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "endpoint-demo-2",
      type: "ad_obstacle",
      sender: "endpoint_bob",
      giftName: "Endpoint Billboard",
      diamondCount: 29,
    }),
  });
  assert(streamedDemo.body.ok === true && streamedDemo.body.accepted.id === 2, "Second /demo should accept id 2", streamedDemo.body);
  const liveMessage = await readSseUntil(streamReader, sseState, (message) => message.event === "liveEvent", "liveEvent");
  assert(liveMessage.id === "2", "SSE liveEvent should include event id", liveMessage);
  assert(liveMessage.retry === "5000", "SSE liveEvent should include retry", liveMessage);
  assert(liveMessage.data && liveMessage.data.id === 2, "SSE liveEvent data should include id 2", liveMessage);
  assert(liveMessage.data.type === "ad_obstacle", "SSE liveEvent should preserve type", liveMessage);
  assert(liveMessage.data.sender === "endpoint_bob", "SSE liveEvent should preserve sender", liveMessage);

  await streamReader.cancel();
  streamReader = null;
  abortStream.abort();
  abortStream = null;

  const replayDemo = await jsonRequest(baseUrl, "/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "endpoint-demo-3",
      type: "gift",
      sender: "endpoint_cara",
      giftName: "Replay Coin",
      diamondCount: 11,
    }),
  });
  assert(replayDemo.body.ok === true && replayDemo.body.accepted.id === 3, "Third /demo should accept id 3", replayDemo.body);

  abortStream = new AbortController();
  const replayStream = await fetch(`${baseUrl}/stream`, {
    signal: abortStream.signal,
    headers: {
      Origin: "https://137yugi.github.io",
      "Last-Event-ID": "2",
    },
  });
  assert(replayStream.status === 200, "Replay /stream should return 200", { status: replayStream.status });
  assertBridgeHeaders(replayStream, { endpoint: "replay /stream", expectedOrigin: "https://137yugi.github.io" });
  streamReader = replayStream.body.getReader();
  const replaySseState = { buffer: "", messages: [] };
  const replayLiveMessage = await readSseUntil(streamReader, replaySseState, (message) => message.event === "liveEvent", "replay liveEvent");
  assert(replayLiveMessage.id === "3", "SSE replay should include missed event id", replayLiveMessage);
  assert(replayLiveMessage.retry === "5000", "SSE replay liveEvent should include retry", replayLiveMessage);
  assert(replayLiveMessage.data && replayLiveMessage.data.id === 3, "SSE replay data should include id 3", replayLiveMessage);
  assert(replayLiveMessage.data.sender === "endpoint_cara", "SSE replay should preserve sender", replayLiveMessage);
  const replayStatus = await readSseUntil(streamReader, replaySseState, (message) => message.event === "status", "replay status");
  assert(replayStatus.id === "3", "Replay SSE status should include latest cursor id", replayStatus);
  assert(replayStatus.data && replayStatus.data.replay_from === 2, "Replay status should include replay_from", replayStatus);
  assert(replayStatus.data.replayed === 1, "Replay status should include replay count", replayStatus);

  await streamReader.cancel();
  streamReader = null;
  abortStream.abort();
  abortStream = null;

  abortStream = new AbortController();
  const sinceReplayStream = await fetch(`${baseUrl}/stream?since=2`, {
    signal: abortStream.signal,
    headers: { Origin: "http://127.0.0.1:5173" },
  });
  assert(sinceReplayStream.status === 200, "Replay /stream?since should return 200", { status: sinceReplayStream.status });
  assertBridgeHeaders(sinceReplayStream, { endpoint: "replay /stream?since", expectedOrigin: "http://127.0.0.1:5173" });
  streamReader = sinceReplayStream.body.getReader();
  const sinceReplayState = { buffer: "", messages: [] };
  const sinceReplayLiveMessage = await readSseUntil(streamReader, sinceReplayState, (message) => message.event === "liveEvent", "since replay liveEvent");
  assert(sinceReplayLiveMessage.id === "3", "SSE ?since replay should include missed event id", sinceReplayLiveMessage);
  assert(sinceReplayLiveMessage.data && sinceReplayLiveMessage.data.id === 3, "SSE ?since replay data should include id 3", sinceReplayLiveMessage);
  const sinceReplayStatus = await readSseUntil(streamReader, sinceReplayState, (message) => message.event === "status", "since replay status");
  assert(sinceReplayStatus.data && sinceReplayStatus.data.replay_from === 2, "SSE ?since status should include replay_from", sinceReplayStatus);
  assert(sinceReplayStatus.data.replayed === 1, "SSE ?since status should include replay count", sinceReplayStatus);

  const malformedDemo = await jsonRequest(baseUrl, "/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{\"bad\"",
  });
  assert(malformedDemo.response.status === 400, "Malformed /demo should return 400", {
    status: malformedDemo.response.status,
    body: malformedDemo.body,
  });
  assertBridgeHeaders(malformedDemo.response, { endpoint: "malformed /demo" });
  assertErrorShape(malformedDemo.body, "invalid_payload", { endpoint: "malformed /demo" });

  const notFound = await jsonRequest(baseUrl, "/missing-endpoint");
  assert(notFound.response.status === 404, "404 should return status 404", { status: notFound.response.status, body: notFound.body });
  assertBridgeHeaders(notFound.response, { endpoint: "404" });
  assertErrorShape(notFound.body, "not_found", { endpoint: "404" });
  assert(notFound.body.path === "/missing-endpoint", "404 should include requested path", notFound.body);

  console.log(
    JSON.stringify(
      {
        result: "ok",
        bridge: baseUrl,
        endpoints: ["/health", "OPTIONS /connect", "POST /connect", "POST /demo", "GET /events", "GET /stream", "404"],
        accepted_events: [demo.body.accepted.id, streamedDemo.body.accepted.id, replayDemo.body.accepted.id],
        sse_messages: sseState.messages.map((message) => ({ id: message.id, retry: message.retry, event: message.event })),
        replay_sse_messages: replaySseState.messages.map((message) => ({ id: message.id, retry: message.retry, event: message.event })),
        since_replay_sse_messages: sinceReplayState.messages.map((message) => ({ id: message.id, retry: message.retry, event: message.event })),
      },
      null,
      2,
    ),
  );
} catch (err) {
  fail("TikTok live bridge endpoint QA failed", { error: err && err.stack ? err.stack : String(err), bridge: baseUrl });
} finally {
  if (streamReader) {
    try {
      await streamReader.cancel();
    } catch {
      // Stream may already be aborted.
    }
  }
  if (abortStream) abortStream.abort();
  await stopBridge(child);
}
