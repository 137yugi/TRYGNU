#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist/web}"

cd "$ROOT_DIR"
npm run build -- --outDir "$OUT_DIR"

echo "Built Phaser web bundle: $OUT_DIR"
