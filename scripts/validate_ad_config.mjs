import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const configPath = path.resolve(process.argv[2] || process.env.AD_CONFIG_PATH || "public/config/ads.json");

const allowed = {
  type: new Set(["banner", "video"]),
  lane: new Set(["top", "middle", "bottom", "random"]),
  rarity: new Set(["common", "rare", "epic", "legendary"]),
};

const requiredFields = [
  "id",
  "type",
  "brand",
  "title",
  "copy",
  "weight",
  "minWave",
  "duration",
  "lane",
  "speed",
  "opacity",
  "rarity",
];

const numericRules = {
  weight: { min: 0.01, max: 999 },
  minWave: { min: 1, max: 999, integer: true },
  duration: { min: 1.2, max: 20 },
  speed: { min: -220, max: 220 },
  opacity: { min: 0.18, max: 0.88 },
};

const textLimits = {
  id: 48,
  brand: 28,
  title: 42,
  copy: 56,
};

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function warn(warnings, message, details = {}) {
  warnings.push({ message, ...details });
}

function readJson(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (error) {
    fail("Could not read ad config", { file, error: String(error) });
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail("Ad config is not valid JSON", { file, error: String(error) });
  }
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w.-]+/g, "-")
    .slice(0, 48);
}

function assertString(errors, ad, index, field) {
  const value = ad[field];
  if (typeof value !== "string" || !value.trim()) {
    errors.push({ path: `ads[${index}].${field}`, message: "must be a non-empty string" });
    return;
  }
  if (value.length > textLimits[field]) {
    errors.push({
      path: `ads[${index}].${field}`,
      message: `must be ${textLimits[field]} characters or fewer to avoid runtime truncation`,
      length: value.length,
    });
  }
}

function assertNumber(errors, ad, index, field, rule) {
  const value = ad[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push({ path: `ads[${index}].${field}`, message: "must be a finite number" });
    return;
  }
  if (value < rule.min || value > rule.max) {
    errors.push({ path: `ads[${index}].${field}`, message: `must be between ${rule.min} and ${rule.max}`, value });
  }
  if (rule.integer && !Number.isInteger(value)) {
    errors.push({ path: `ads[${index}].${field}`, message: "must be an integer", value });
  }
}

function probabilityRows(ads) {
  const waves = [...new Set([1, ...ads.map((ad) => ad.minWave)])].sort((a, b) => a - b);
  return waves.map((wave) => {
    const eligible = ads.filter((ad) => ad.minWave <= wave);
    const totalWeight = eligible.reduce((sum, ad) => sum + ad.weight, 0);
    const byRarity = {};
    for (const ad of eligible) {
      byRarity[ad.rarity] = (byRarity[ad.rarity] || 0) + ad.weight;
    }
    return {
      wave,
      eligible_count: eligible.length,
      total_weight: Number(totalWeight.toFixed(4)),
      rarity_probability_pct: Object.fromEntries(
        Object.entries(byRarity).map(([rarity, weight]) => [rarity, Number(((weight / totalWeight) * 100).toFixed(2))]),
      ),
      ad_probability_pct: eligible.map((ad) => ({
        id: ad.id,
        pct: Number(((ad.weight / totalWeight) * 100).toFixed(2)),
      })),
    };
  });
}

const config = readJson(configPath);
const errors = [];
const warnings = [];

if (!isRecord(config)) {
  fail("Ad config root must be an object", { file: configPath });
}

if (!Number.isInteger(config.version) || config.version < 1) {
  errors.push({ path: "version", message: "must be a positive integer" });
}

if (!Array.isArray(config.ads) || config.ads.length === 0) {
  errors.push({ path: "ads", message: "must be a non-empty array" });
}

const seenIds = new Set();
const seenNormalizedIds = new Set();
const parsedAds = [];

for (const [index, ad] of (Array.isArray(config.ads) ? config.ads : []).entries()) {
  if (!isRecord(ad)) {
    errors.push({ path: `ads[${index}]`, message: "must be an object" });
    continue;
  }

  for (const field of requiredFields) {
    if (!(field in ad)) errors.push({ path: `ads[${index}].${field}`, message: "is required" });
  }

  for (const field of ["id", "brand", "title", "copy"]) {
    if (field in ad) assertString(errors, ad, index, field);
  }

  if (typeof ad.id === "string") {
    const normalized = normalizeId(ad.id);
    if (normalized !== ad.id) {
      errors.push({ path: `ads[${index}].id`, message: "must already be runtime-normalized", value: ad.id, normalized });
    }
    if (seenIds.has(ad.id)) errors.push({ path: `ads[${index}].id`, message: "duplicates another ad id", value: ad.id });
    if (seenNormalizedIds.has(normalized)) {
      errors.push({ path: `ads[${index}].id`, message: "duplicates another ad id after runtime normalization", value: ad.id });
    }
    seenIds.add(ad.id);
    seenNormalizedIds.add(normalized);
  }

  for (const [field, values] of Object.entries(allowed)) {
    if (field in ad && !values.has(ad[field])) {
      errors.push({ path: `ads[${index}].${field}`, message: `must be one of ${[...values].join(", ")}`, value: ad[field] });
    }
  }

  for (const [field, rule] of Object.entries(numericRules)) {
    if (field in ad) assertNumber(errors, ad, index, field, rule);
  }

  parsedAds.push(ad);
}

if (parsedAds.length) {
  const firstWaveAds = parsedAds.filter((ad) => ad.minWave === 1);
  if (firstWaveAds.length === 0) {
    errors.push({ path: "ads", message: "at least one ad must be eligible at minWave 1" });
  }

  const totalWeight = parsedAds.reduce((sum, ad) => sum + (typeof ad.weight === "number" && Number.isFinite(ad.weight) ? ad.weight : 0), 0);
  if (totalWeight <= 0) errors.push({ path: "ads", message: "total configured weight must be positive" });

  const rarities = new Set(parsedAds.map((ad) => ad.rarity));
  for (const rarity of allowed.rarity) {
    if (!rarities.has(rarity)) warn(warnings, "rarity has no configured ads", { rarity });
  }
}

if (errors.length) fail("Ad config validation failed", { file: configPath, errors, warnings });

console.log(
  JSON.stringify(
    {
      result: "ok",
      file: configPath,
      ad_count: parsedAds.length,
      total_weight: parsedAds.reduce((sum, ad) => sum + ad.weight, 0),
      warnings,
      probability_by_wave: probabilityRows(parsedAds),
    },
    null,
    2,
  ),
);
