#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const statePath = path.join(projectRoot, "runtime", "agent-work-timer.json");

function usage() {
  return {
    usage: [
      "node scripts/agent_work_timer.mjs start 8h",
      "node scripts/agent_work_timer.mjs status",
      'node scripts/agent_work_timer.mjs checkpoint "message"',
      'node scripts/agent_work_timer.mjs next "task"',
    ],
  };
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", reason: message, ...details }, null, 2));
  process.exit(1);
}

function ensureRuntimeDir() {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
}

function readState(required = true) {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    if (!required && error.code === "ENOENT") return null;
    fail("Timer state is missing or invalid. Run start first.", { state_file: statePath });
  }
}

function writeState(state) {
  ensureRuntimeDir();
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function parseDuration(input) {
  const match = String(input ?? "").trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/i);
  if (!match) {
    fail("Invalid duration. Use a value like 8h, 30m, 90s, or 1000ms.", usage());
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const factors = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
  const durationMs = Math.round(value * factors[unit]);

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    fail("Duration must be greater than zero.", usage());
  }

  return durationMs;
}

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function timerSummary(state, nowMs = Date.now()) {
  const remainingMs = Math.max(0, state.end_ms - nowMs);
  const expired = remainingMs === 0;
  return {
    result: "ok",
    state_file: statePath,
    started_at: state.started_at,
    ends_at: state.ends_at,
    now: new Date(nowMs).toISOString(),
    duration_ms: state.duration_ms,
    remaining_ms: remainingMs,
    remaining: formatDuration(remainingMs),
    expired,
    checkpoint_count: state.checkpoints.length,
    next_task_count: state.next_tasks.length,
    latest_checkpoint: state.checkpoints.at(-1) ?? null,
    latest_next_task: state.next_tasks.at(-1) ?? null,
  };
}

function start(durationInput) {
  const durationMs = parseDuration(durationInput);
  const nowMs = Date.now();
  const state = {
    version: 1,
    started_at: new Date(nowMs).toISOString(),
    start_ms: nowMs,
    ends_at: new Date(nowMs + durationMs).toISOString(),
    end_ms: nowMs + durationMs,
    duration_ms: durationMs,
    checkpoints: [],
    next_tasks: [],
  };
  writeState(state);
  console.log(JSON.stringify({ ...timerSummary(state, nowMs), action: "start" }, null, 2));
}

function status() {
  const state = readState();
  console.log(JSON.stringify({ ...timerSummary(state), action: "status" }, null, 2));
}

function checkpoint(messageParts) {
  const message = messageParts.join(" ").trim();
  if (!message) fail("Checkpoint message is required.", usage());

  const state = readState();
  const nowMs = Date.now();
  state.checkpoints.push({
    at: new Date(nowMs).toISOString(),
    message,
    remaining_ms: Math.max(0, state.end_ms - nowMs),
    remaining: formatDuration(state.end_ms - nowMs),
  });
  writeState(state);
  console.log(JSON.stringify({ ...timerSummary(state, nowMs), action: "checkpoint" }, null, 2));
}

function nextTask(taskParts) {
  const task = taskParts.join(" ").trim();
  if (!task) fail("Next task is required.", usage());

  const state = readState();
  const nowMs = Date.now();
  state.next_tasks.push({
    at: new Date(nowMs).toISOString(),
    task,
    remaining_ms: Math.max(0, state.end_ms - nowMs),
    remaining: formatDuration(state.end_ms - nowMs),
  });
  writeState(state);
  console.log(JSON.stringify({ ...timerSummary(state, nowMs), action: "next" }, null, 2));
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "start":
    start(args[0]);
    break;
  case "status":
    status();
    break;
  case "checkpoint":
    checkpoint(args);
    break;
  case "next":
    nextTask(args);
    break;
  default:
    fail("Unknown or missing command.", usage());
}
