#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist/web}"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cp "$ROOT_DIR/index.html" "$OUT_DIR/index.html"
cp "$ROOT_DIR/styles.css" "$OUT_DIR/styles.css"
cp "$ROOT_DIR/game.js" "$OUT_DIR/game.js"

if [[ -d "$ROOT_DIR/assets" ]]; then
  cp -R "$ROOT_DIR/assets" "$OUT_DIR/assets"
fi

if [[ -f "$ROOT_DIR/favicon.ico" ]]; then
  cp "$ROOT_DIR/favicon.ico" "$OUT_DIR/favicon.ico"
fi

echo "Built static web bundle: $OUT_DIR"
