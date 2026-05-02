import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const out = resolve("public/assets/generated/arena-map.png");
const width = 1024;
const height = 1024;
const data = Buffer.alloc((width * 4 + 1) * height);

const palette = {
  obsidian: [22, 13, 25, 255],
  stone: [42, 37, 44, 255],
  mortar: [16, 12, 20, 255],
  gold: [218, 164, 74, 255],
  teal: [64, 208, 216, 255],
  red: [138, 36, 63, 255],
  shadow: [5, 7, 12, 255],
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
    const tile = Math.floor(x / 64) + Math.floor(y / 64);
    const crack = noise(x * 0.035, y * 0.035) + noise(x * 0.09 + 4, y * 0.09 - 2) * 0.45;
    let color = mix(palette.obsidian, palette.stone, 0.28 + (tile % 2) * 0.08 + crack * 0.08);

    if (x % 64 < 3 || y % 64 < 3) color = mix(color, palette.mortar, 0.58);
    if (Math.abs(r - 368) < 10 || Math.abs(r - 248) < 5) color = mix(color, palette.gold, 0.74);
    if (Math.abs(cx) < 5 || Math.abs(cy) < 5) color = mix(color, palette.red, 0.42);
    if ((Math.abs(Math.sin(angle * 8)) > 0.985 && r > 120 && r < 360) || Math.abs(r - 146) < 4) color = mix(color, palette.teal, 0.62);

    const carpet = Math.abs(cx) < 68 && Math.abs(cy) < 420;
    if (carpet) color = mix(color, palette.red, 0.34 + Math.max(0, 1 - Math.abs(cx) / 68) * 0.18);

    const vignette = clamp((r - 330) / 360, 0, 1);
    color = mix(color, palette.shadow, vignette * 0.52);

    const runeBand = r > 260 && r < 330 && Math.abs(Math.sin(angle * 20 + r * 0.02)) > 0.92;
    if (runeBand) color = mix(color, palette.teal, 0.5);

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
  return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
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
