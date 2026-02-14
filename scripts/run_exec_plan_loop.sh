#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAN_FILE="$ROOT_DIR/.agent/PLANS.md"
LOG_DIR="$ROOT_DIR/output/exec-plan-loop"

MAX_ITERS="${1:-24}"
PROMPT_TEXT="${PROMPT_TEXT:-Continue this repository autonomously: read .agent/PLANS.md (compact) and progress.md (compact summary), execute the top unfinished tasks, run mandatory Playwright validation, update plan/progress, and keep going without waiting for another go until Status: DONE or a blocker. If more context is needed, check .agent/PLANS.full.md / progress.full.md only on demand.}"
SLEEP_SEC="${SLEEP_SEC:-1}"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex command not found." >&2
  exit 1
fi

if [[ ! -f "$PLAN_FILE" ]]; then
  echo "plan file not found: $PLAN_FILE" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

echo "Starting Exec Plan loop"
echo "root: $ROOT_DIR"
echo "plan: $PLAN_FILE"
echo "max iterations: $MAX_ITERS"
echo "prompt: $PROMPT_TEXT"

for ((i = 1; i <= MAX_ITERS; i += 1)); do
  ts="$(date -u +"%Y%m%dT%H%M%SZ")"
  msg_file="$LOG_DIR/iter-${i}-${ts}.txt"
  json_file="$LOG_DIR/iter-${i}-${ts}.jsonl"

  echo "----"
  echo "iteration $i/$MAX_ITERS"

  codex exec \
    --full-auto \
    -C "$ROOT_DIR" \
    --output-last-message "$msg_file" \
    --json \
    "$PROMPT_TEXT" >"$json_file"

  if rg -n "^Status:[[:space:]]*DONE$" "$PLAN_FILE" >/dev/null 2>&1; then
    echo "Plan status DONE. Stopping loop."
    exit 0
  fi

  sleep "$SLEEP_SEC"
done

echo "Reached max iterations without DONE status."
echo "Check: $PLAN_FILE"
