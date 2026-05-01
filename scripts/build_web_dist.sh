#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist/web}"

cd "$ROOT_DIR"
npm run build -- --outDir "$OUT_DIR"

node scripts/verify_pages_bundle.mjs "$OUT_DIR"

echo "Built Phaser web bundle: $OUT_DIR"
