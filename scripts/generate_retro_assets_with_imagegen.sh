#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE_GEN="${CODEX_HOME:-$HOME/.codex}/skills/imagegen/scripts/image_gen.py"
OUT_DIR="${1:-$ROOT_DIR/assets/retro/generated}"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "imagegen CLI not found: $IMAGE_GEN" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is not set. Please export it, then rerun." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Generating retro pixel pack into: $OUT_DIR"

python3 "$IMAGE_GEN" generate \
  --model gpt-image-1.5 \
  --size 1536x1024 \
  --quality high \
  --output-format png \
  --out "$OUT_DIR/retro_clouds.png" \
  --prompt "Use case: stylized-concept. Asset type: game background clouds strip. Primary request: monochrome 1-bit pixel-art cloud band for a side-scroll fantasy field. Scene/background: transparent background only. Style/medium: strict black-and-white retro handheld pixel style, crisp edges. Composition/framing: horizontal strip, cloud clusters on left and right, center open. Color palette: white sprites only, no gray anti-alias. Constraints: transparent background, no text, no logo, no watermark. Avoid: blur, gradients, smooth shading."

python3 "$IMAGE_GEN" generate \
  --model gpt-image-1.5 \
  --size 1536x1024 \
  --quality high \
  --output-format png \
  --out "$OUT_DIR/retro_land_far.png" \
  --prompt "Use case: illustration-story. Asset type: game far-ground tile. Primary request: monochrome 1-bit pixel-art far skyline with tiny castle, village, mountains, and tree line. Scene/background: transparent background only, skyline near bottom. Style/medium: strict black-and-white pixel art inspired by 2010s mobile retro games. Composition/framing: horizontal panoramic strip, repeat-friendly edges. Color palette: white sprites only, no anti-alias. Constraints: transparent background, no text, no logo, no watermark. Avoid: blur, smooth lines, colored pixels."

python3 "$IMAGE_GEN" generate \
  --model gpt-image-1.5 \
  --size 1536x1024 \
  --quality high \
  --output-format png \
  --out "$OUT_DIR/retro_land_near.png" \
  --prompt "Use case: illustration-story. Asset type: game near-ground tile. Primary request: monochrome 1-bit pixel-art near forest and stone ground strip with dense pixel clusters. Scene/background: transparent background only, heavy detail near bottom. Style/medium: strict black-and-white pixel art with chunky 4px blocks. Composition/framing: horizontal repeatable strip. Color palette: white sprites only, no anti-alias. Constraints: transparent background, no text, no logo, no watermark. Avoid: gradients, soft edges, color."

python3 "$IMAGE_GEN" generate \
  --model gpt-image-1.5 \
  --size 1024x1024 \
  --quality high \
  --output-format png \
  --out "$OUT_DIR/retro_panel_pattern.png" \
  --prompt "Use case: ui-mockup. Asset type: game UI panel texture. Primary request: monochrome 1-bit pixel dithering pattern tile for HUD panel background. Scene/background: seamless tile texture only. Style/medium: strict black-and-white handheld pixel style. Composition/framing: square seamless pattern with low visual noise and checker dithering. Color palette: black and white only. Constraints: no text, no logo, no watermark. Avoid: blur, gradients, perspective."

echo "Done. Generated files:"
ls -1 "$OUT_DIR" | sed -n '1,200p'
