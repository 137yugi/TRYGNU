import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const out = resolve("public/assets/generated/arena-map.png");
const width = 1024;
const height = 1024;
const data = Buffer.alloc((width * 4 + 1) * height);

const palette = {
  basalt: [32, 29, 32, 255],
  coolStone: [54, 50, 52, 255],
  warmStone: [66, 55, 48, 255],
  dust: [92, 72, 52, 255],
  mortar: [17, 15, 18, 255],
  moss: [38, 72, 58, 255],
  rust: [111, 45, 42, 255],
  ember: [199, 116, 48, 255],
  gold: [178, 132, 65, 255],
  shadow: [4, 5, 8, 255],
};

for (let y = 0; y < height; y += 1) {
  const row = y * (width * 4 + 1);
  data[row] = 0;
  for (let x = 0; x < width; x += 1) {
    const i = row + 1 + x * 4;
    const cx = x - width / 2;
    const cy = y - height / 2;
    const r = Math.hypot(cx, cy);
    const angle = Math.atan2(cy, cx);
    const slabX = Math.floor((x + Math.sin(y * 0.014) * 12) / 74);
    const slabY = Math.floor((y + Math.cos(x * 0.012) * 10) / 62);
    const slabSeed = hash2(slabX, slabY);
    const grain = noise(x * 0.032, y * 0.032) * 0.52 + noise(x * 0.11 + 9, y * 0.11 - 3) * 0.22;
    const local = hash2(Math.floor(x / 12), Math.floor(y / 12));
    let color = mix(palette.basalt, slabSeed > 0.52 ? palette.warmStone : palette.coolStone, 0.44 + grain * 0.2);

    const mortarX = Math.abs(((x + Math.sin(y * 0.014) * 12) % 74) - 37);
    const mortarY = Math.abs(((y + Math.cos(x * 0.012) * 10) % 62) - 31);
    if (mortarX > 34.5 || mortarY > 29.2) color = mix(color, palette.mortar, 0.52);

    const wornCenter = clamp(1 - r / 410, 0, 1);
    color = mix(color, palette.dust, wornCenter * 0.2);

    const crowdShadow = clamp((Math.abs(cy) - 330) / 210, 0, 1);
    color = mix(color, palette.shadow, crowdShadow * 0.28);

    const narrowCrack = Math.abs(Math.sin(x * 0.035 + noise(slabY, slabX) * 6) + Math.cos(y * 0.028 + slabSeed * 4)) < 0.035;
    if (narrowCrack && local > 0.57) color = mix(color, palette.mortar, 0.64);

    const mossPatch = noise(x * 0.018 - 6, y * 0.021 + 5) > 0.77 && r > 250;
    if (mossPatch) color = mix(color, palette.moss, 0.28);

    const rustPatch = noise(x * 0.025 + 14, y * 0.02 - 8) > 0.82 && Math.abs(Math.sin(angle * 5)) > 0.8;
    if (rustPatch) color = mix(color, palette.rust, 0.22);

    const emberChip = local > 0.992 && r > 120 && r < 450;
    if (emberChip) color = mix(color, palette.ember, 0.72);

    const chip = hash2(Math.floor(x / 5), Math.floor(y / 5));
    if (chip > 0.985) color = mix(color, chip > 0.994 ? palette.gold : palette.dust, 0.36);

    const wornLane = Math.abs(cy + Math.sin(x * 0.011) * 18) < 54 && r < 430;
    if (wornLane) color = mix(color, palette.dust, 0.08);

    const vignette = clamp((r - 410) / 360, 0, 1);
    color = mix(color, palette.shadow, vignette * 0.46);

    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = 255;
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, encodePng(width, height, data));
console.log(out);

function encodePng(w, h, raw) {
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", Buffer.concat([u32(w), u32(h), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, payload) {
  const name = Buffer.from(type);
  return Buffer.concat([u32(payload.length), name, payload, u32(crc32(Buffer.concat([name, payload])) >>> 0)]);
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c ^ 0xffffffff;
}

function noise(x, y) {
  return fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
}

function hash2(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function fract(v) {
  return v - Math.floor(v);
}

function mix(a, b, t) {
  const k = clamp(t, 0, 1);
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
    255,
  ];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
