#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(process.argv[2] || path.join(rootDir, "dist/web"));

const requiredFiles = ["index.html", "terminal-live.html", "agency.html", "manifest.webmanifest"];
const failures = [];
const checkedRefs = new Set();
const legacySpecialActionToken = ["S", "N", "A", "P"].join("");

function fail(message) {
  failures.push(message);
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function isExternalUrl(rawUrl) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(rawUrl);
}

function normalizeLocalRef(rawUrl) {
  const trimmed = rawUrl.trim().replace(/^["']|["']$/g, "");
  if (!trimmed || isExternalUrl(trimmed)) {
    return null;
  }
  if (trimmed.startsWith("/")) {
    return { invalid: true, reason: "root-relative URL is not Pages-safe", url: trimmed };
  }
  const withoutHash = trimmed.split("#", 1)[0];
  const withoutQuery = withoutHash.split("?", 1)[0];
  if (!withoutQuery) {
    return null;
  }
  try {
    return { url: decodeURIComponent(withoutQuery) };
  } catch {
    return { url: withoutQuery };
  }
}

function assertLocalRefExists(fromFile, rawUrl) {
  const normalized = normalizeLocalRef(rawUrl);
  if (!normalized) {
    return;
  }
  if (normalized.invalid) {
    fail(`${path.relative(outDir, fromFile)} uses ${normalized.reason}: ${normalized.url}`);
    return;
  }
  const target = path.resolve(path.dirname(fromFile), normalized.url);
  const relativeTarget = path.relative(outDir, target);
  checkedRefs.add(`${path.relative(outDir, fromFile)} -> ${relativeTarget}`);
  if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
    fail(`${path.relative(outDir, fromFile)} points outside bundle: ${rawUrl}`);
    return;
  }
  if (!fs.existsSync(target)) {
    fail(`${path.relative(outDir, fromFile)} references missing file: ${rawUrl}`);
  }
}

function verifyHtml(file) {
  const html = readText(file);
  for (const match of html.matchAll(/\b(?:href|src|poster|action)=["']([^"']+)["']/gi)) {
    assertLocalRefExists(file, match[1]);
  }
  if (path.basename(file) === "index.html") {
    const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
    const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
    const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] || "";
    const hasViteModule = scripts.some(
      (tag) => attr(tag, "type").toLowerCase() === "module" && /^\.\/assets\/index-[^/]+\.js$/.test(attr(tag, "src")),
    );
    const hasViteStylesheet = links.some(
      (tag) =>
        attr(tag, "rel").toLowerCase() === "stylesheet" && /^\.\/assets\/index-[^/]+\.css$/.test(attr(tag, "href")),
    );
    if (!hasViteModule) {
      fail("index.html does not reference a Vite hashed module chunk under ./assets/");
    }
    if (!hasViteStylesheet) {
      fail("index.html does not reference a Vite hashed stylesheet chunk under ./assets/");
    }
  }
}

function verifyCss(file) {
  const css = readText(file);
  for (const match of css.matchAll(/url\(\s*([^'")][^)]*|["'][^"']+["'])\s*\)/gi)) {
    assertLocalRefExists(file, match[1]);
  }
  for (const match of css.matchAll(/\/\*# sourceMappingURL=([^\s*]+)\s*\*\//g)) {
    assertLocalRefExists(file, match[1]);
  }
}

function verifyJs(file) {
  const js = readText(file);
  for (const match of js.matchAll(/\/\/# sourceMappingURL=([^\s]+)/g)) {
    assertLocalRefExists(file, match[1]);
  }
}

function verifyManifest(file) {
  let manifest;
  try {
    manifest = JSON.parse(readText(file));
  } catch (error) {
    fail(`manifest.webmanifest is not valid JSON: ${error.message}`);
    return;
  }
  for (const key of ["start_url", "scope"]) {
    if (typeof manifest[key] === "string") {
      assertLocalRefExists(file, manifest[key]);
    }
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    fail("manifest.webmanifest must include at least one icon");
    return;
  }
  for (const icon of manifest.icons) {
    if (icon && typeof icon.src === "string") {
      assertLocalRefExists(file, icon.src);
    }
  }
}

if (!fs.existsSync(outDir)) {
  fail(`Missing bundle directory: ${outDir}`);
} else {
  for (const required of requiredFiles) {
    const file = path.join(outDir, required);
    if (!fs.existsSync(file)) {
      fail(`Missing required Pages artifact: ${required}`);
    }
  }

  for (const file of walk(outDir)) {
    const relative = path.relative(outDir, file);
    const textLike = /\.(?:html|css|js|mjs|json|webmanifest|map)$/i.test(file);
    if (textLike && readText(file).includes(legacySpecialActionToken)) {
      fail(`${relative} still contains legacy special-action text`);
    }
    if (/\.html$/i.test(file)) {
      verifyHtml(file);
    } else if (/\.css$/i.test(file)) {
      verifyCss(file);
    } else if (/\.js$/i.test(file)) {
      verifyJs(file);
    } else if (path.basename(file) === "manifest.webmanifest") {
      verifyManifest(file);
    }
  }
}

if (failures.length > 0) {
  console.error("GitHub Pages bundle verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Verified Pages bundle: ${requiredFiles.join(", ")}`);
console.log(`Verified local bundle references: ${checkedRefs.size}`);
