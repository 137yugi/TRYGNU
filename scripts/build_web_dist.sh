#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist/web}"

cd "$ROOT_DIR"
npm run build -- --outDir "$OUT_DIR"

for required in index.html terminal-live.html manifest.webmanifest; do
  if [[ ! -f "$OUT_DIR/$required" ]]; then
    echo "Missing required Pages artifact: $OUT_DIR/$required" >&2
    exit 1
  fi
done

echo "Verified Pages bundle artifacts: index.html, terminal-live.html, manifest.webmanifest"
echo "Built Phaser web bundle: $OUT_DIR"
