#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function fail(message, details) {
  const payload = { result: "failed", reason: message, ...details };
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

const dir = process.argv[2];
if (!dir) {
  fail("Usage: node scripts/assert_pause_recovery.mjs <output-dir>");
}

const stateFiles = fs
  .readdirSync(dir)
  .filter((name) => /^state-\d+\.json$/.test(name))
  .sort((a, b) => {
    const ai = Number(a.match(/\d+/)[0]);
    const bi = Number(b.match(/\d+/)[0]);
    return ai - bi;
  });

if (!stateFiles.length) {
  fail("No state-*.json files found", { dir });
}

const states = stateFiles
  .map((name) => safeReadJson(path.join(dir, name)))
  .filter(Boolean);

if (!states.length) {
  fail("Failed to parse any state json", { dir, files: stateFiles });
}

const hasRunning = states.some((s) => s.mode === "running");
const hasEnded = states.some((s) => s.mode === "ended");
const hasLevelup = states.some((s) => s.mode === "levelup");

if (!hasRunning && !hasEnded) {
  fail("Pause recovery did not leave modal state", {
    modes: states.map((s) => s.mode),
  });
}

const payload = {
  result: "ok",
  has_running: hasRunning,
  has_ended: hasEnded,
  has_levelup: hasLevelup,
  final_mode: states[states.length - 1].mode,
  states: states.map((s, i) => ({ i, mode: s.mode, hp: s.player?.hp ?? null, wave: s.run?.wave ?? null })),
};

console.log(JSON.stringify(payload, null, 2));
