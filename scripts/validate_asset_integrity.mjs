import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { TextDecoder } from "node:util";

const rootDir = path.resolve(process.argv[2] || ".");
const assetsTsPath = path.join(rootDir, "src/content/assets.ts");
const equipmentTsPath = path.join(rootDir, "src/content/equipment.ts");
const adsJsonPath = path.join(rootDir, "public/config/ads.json");
const publicDir = path.join(rootDir, "public");

const imageExtensions = new Set([".png", ".svg", ".jpg", ".jpeg", ".webp", ".gif"]);
const mediaExtensions = new Set([...imageExtensions, ".json", ".mp3", ".ogg", ".wav", ".mp4", ".webm"]);

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function readText(file, label, errors) {
  let buffer;
  try {
    buffer = fs.readFileSync(file);
  } catch (error) {
    errors.push({ source: label, file, message: "could not read file", error: String(error) });
    return null;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (error) {
    errors.push({ source: label, file, message: "file is not valid UTF-8", error: String(error) });
    return null;
  }
}

function normalizePublicPath(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return null;

  let cleaned = value.trim().split(/[?#]/, 1)[0];
  if (!cleaned) return null;
  cleaned = cleaned.replace(/^\$\{import\.meta\.env\.BASE_URL\}/, "");
  cleaned = cleaned.replace(/^import\.meta\.env\.BASE_URL\s*\+\s*/, "");
  cleaned = cleaned.replace(/^\/+/, "");
  cleaned = cleaned.replace(/^public\//, "");

  if (!cleaned.startsWith("assets/") && !cleaned.startsWith("config/")) return null;
  if (!mediaExtensions.has(path.extname(cleaned).toLowerCase())) return null;
  if (cleaned.split("/").some((part) => part === "..")) return null;
  return cleaned;
}

function addRef(refs, publicPath, source) {
  const normalized = normalizePublicPath(publicPath);
  if (!normalized) return;
  const existing = refs.get(normalized);
  if (existing) existing.sources.add(source);
  else refs.set(normalized, { publicPath: normalized, sources: new Set([source]) });
}

function collectAssetsTsRefs(assetsSource, equipmentSource, refs, errors) {
  if (!assetsSource) return;

  for (const match of assetsSource.matchAll(/\bpixel\(\s*["']([^"']+)["']\s*\)/g)) {
    addRef(refs, `assets/pixel/${match[1]}`, "src/content/assets.ts pixel()");
  }

  for (const match of assetsSource.matchAll(/\bgenerated\(\s*["']([^"']+)["']\s*\)/g)) {
    addRef(refs, `assets/generated/${match[1]}`, "src/content/assets.ts generated()");
  }

  if (!/\bequipmentImage\(\s*base\.assetId\s*\)/.test(assetsSource)) return;
  if (!equipmentSource) {
    errors.push({ source: "src/content/assets.ts", message: "equipmentImage(base.assetId) is used but equipment.ts could not be read" });
    return;
  }

  const assetIds = [...equipmentSource.matchAll(/\bassetId\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
  if (assetIds.length === 0) {
    errors.push({ source: "src/content/equipment.ts", message: "no equipment assetId entries found" });
  }
  for (const assetId of assetIds) {
    addRef(refs, `assets/generated/equipment-${assetId}.png`, "src/content/assets.ts equipmentImage(base.assetId)");
  }
}

function collectJsonAssetRefs(value, refs, trail = "public/config/ads.json") {
  if (typeof value === "string") {
    const normalized = normalizePublicPath(value);
    if (normalized) addRef(refs, normalized, trail);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectJsonAssetRefs(entry, refs, `${trail}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      collectJsonAssetRefs(entry, refs, `${trail}.${key}`);
    }
  }
}

function validateSvg(file, errors) {
  const text = readText(file, file, errors);
  if (text === null) return null;
  if (!/<svg\b[^>]*>/i.test(text) || !/<\/svg\s*>/i.test(text)) {
    errors.push({ file, message: "SVG does not contain a complete <svg> root" });
    return null;
  }
  return { kind: "svg", bytes: Buffer.byteLength(text) };
}

function validatePng(file, buffer, errors) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 33 || buffer.subarray(0, 8).toString("hex") !== signature) {
    errors.push({ file, message: "PNG signature or IHDR is invalid" });
    return null;
  }
  if (buffer.subarray(12, 16).toString("ascii") !== "IHDR") {
    errors.push({ file, message: "PNG is missing IHDR as the first chunk" });
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width <= 0 || height <= 0) {
    errors.push({ file, message: "PNG dimensions must be positive", width, height });
    return null;
  }
  if (buffer.indexOf(Buffer.from("IEND"), 33) === -1) {
    errors.push({ file, message: "PNG is missing IEND chunk" });
    return null;
  }
  return { kind: "png", bytes: buffer.length, width, height };
}

function validateJpeg(file, buffer, errors) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) {
    errors.push({ file, message: "JPEG start/end markers are invalid" });
    return null;
  }
  return { kind: "jpeg", bytes: buffer.length };
}

function validateWebp(file, buffer, errors) {
  if (buffer.length < 12 || buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
    errors.push({ file, message: "WEBP RIFF header is invalid" });
    return null;
  }
  return { kind: "webp", bytes: buffer.length };
}

function validateGif(file, buffer, errors) {
  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") {
    errors.push({ file, message: "GIF header is invalid" });
    return null;
  }
  return { kind: "gif", bytes: buffer.length };
}

function validateJsonFile(file, errors) {
  const text = readText(file, file, errors);
  if (text === null) return null;
  try {
    JSON.parse(text);
  } catch (error) {
    errors.push({ file, message: "JSON is not parseable", error: String(error) });
    return null;
  }
  return { kind: "json", bytes: Buffer.byteLength(text) };
}

function validateReferencedFile(ref, errors) {
  const file = path.join(publicDir, ref.publicPath);
  let stat;
  try {
    stat = fs.statSync(file);
  } catch (error) {
    errors.push({ publicPath: ref.publicPath, sources: [...ref.sources], file, message: "referenced public file does not exist", error: String(error) });
    return null;
  }
  if (!stat.isFile()) {
    errors.push({ publicPath: ref.publicPath, sources: [...ref.sources], file, message: "referenced path is not a file" });
    return null;
  }
  if (stat.size <= 0) {
    errors.push({ publicPath: ref.publicPath, sources: [...ref.sources], file, message: "referenced file is empty" });
    return null;
  }

  const ext = path.extname(ref.publicPath).toLowerCase();
  let buffer = null;
  if (ext !== ".svg" && ext !== ".json") {
    try {
      buffer = fs.readFileSync(file);
    } catch (error) {
      errors.push({ publicPath: ref.publicPath, sources: [...ref.sources], file, message: "could not read referenced file", error: String(error) });
      return null;
    }
  }

  let result = null;
  if (ext === ".svg") result = validateSvg(file, errors);
  else if (ext === ".png") result = validatePng(file, buffer, errors);
  else if (ext === ".jpg" || ext === ".jpeg") result = validateJpeg(file, buffer, errors);
  else if (ext === ".webp") result = validateWebp(file, buffer, errors);
  else if (ext === ".gif") result = validateGif(file, buffer, errors);
  else if (ext === ".json") result = validateJsonFile(file, errors);
  else result = { kind: ext.slice(1), bytes: stat.size };

  return result ? { ...result, publicPath: ref.publicPath, sources: [...ref.sources] } : null;
}

const errors = [];
const refs = new Map();

const assetsSource = readText(assetsTsPath, "src/content/assets.ts", errors);
const equipmentSource = readText(equipmentTsPath, "src/content/equipment.ts", errors);
collectAssetsTsRefs(assetsSource, equipmentSource, refs, errors);

const adsText = readText(adsJsonPath, "public/config/ads.json", errors);
let adsConfig = null;
if (adsText !== null) {
  try {
    adsConfig = JSON.parse(adsText);
  } catch (error) {
    errors.push({ source: "public/config/ads.json", file: adsJsonPath, message: "ads config is not valid JSON", error: String(error) });
  }
}
if (adsConfig !== null) collectJsonAssetRefs(adsConfig, refs);

const checked = [];
for (const ref of [...refs.values()].sort((a, b) => a.publicPath.localeCompare(b.publicPath))) {
  const result = validateReferencedFile(ref, errors);
  if (result) checked.push(result);
}

if (errors.length) {
  fail("Asset/config integrity validation failed", {
    root: rootDir,
    checked_count: checked.length,
    reference_count: refs.size,
    errors,
  });
}

console.log(
  JSON.stringify(
    {
      result: "ok",
      root: rootDir,
      checked_count: checked.length,
      reference_count: refs.size,
      ads_config: path.relative(rootDir, adsJsonPath),
      by_kind: checked.reduce((acc, item) => {
        acc[item.kind] = (acc[item.kind] || 0) + 1;
        return acc;
      }, {}),
    },
    null,
    2,
  ),
);
