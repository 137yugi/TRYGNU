import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const ignoredDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "output",
  "runtime",
  "tmp",
  ".vite",
  ".cache",
]);

const ignoredFiles = new Set([
  "assert_no_snap_residue.mjs",
  "package-lock.json",
]);

const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".webmanifest",
  ".yml",
  ".yaml",
]);

const forbiddenPatterns = [
  {
    label: "Japanese snap label",
    pattern: /スナップ/u,
  },
  {
    label: "legacy SNAP action token",
    pattern: /(?<![A-Za-z0-9_])SNAP(?![A-Za-z0-9_])/u,
  },
  {
    label: "legacy snap action token",
    pattern: /(?<![A-Za-z0-9_])snap(?!shot(?:s)?|[A-Za-z0-9_])/u,
  },
  {
    label: "legacy snap snake_case key",
    pattern: /(?<![A-Za-z0-9_])snap_[A-Za-z0-9_]+/u,
  },
  {
    label: "legacy snap camelCase identifier",
    pattern: /(?<![A-Za-z0-9_])snap(?:Cd|TouchBtn|Btn|Cooldown|Action|State|Input|Key|Ready|Timer|Charges)(?![A-Za-z0-9_])/u,
  },
];

function isTextFile(filePath) {
  const basename = path.basename(filePath);
  if (ignoredFiles.has(basename)) return false;
  if (basename === "package.json") return true;
  return textExtensions.has(path.extname(filePath));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }
    if (entry.isFile()) {
      const filePath = path.join(dir, entry.name);
      if (isTextFile(filePath)) files.push(filePath);
    }
  }
  return files;
}

function lineAndColumn(text, index) {
  let line = 1;
  let column = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

const findings = [];

for (const filePath of walk(repoRoot)) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/u);
  for (const { label, pattern } of forbiddenPatterns) {
    const regex = new RegExp(pattern.source, `${pattern.flags}g`);
    for (const match of text.matchAll(regex)) {
      const index = match.index ?? 0;
      const { line, column } = lineAndColumn(text, index);
      const lineText = lines[line - 1]?.trim() ?? "";
      const isAllowedPackageScript =
        path.basename(filePath) === "package.json" &&
        /^"(?:test|test:no-snap)"\s*:/u.test(lineText);
      if (isAllowedPackageScript) {
        continue;
      }
      findings.push({
        file: path.relative(repoRoot, filePath),
        line,
        column,
        match: match[0],
        label,
        text: lineText,
      });
    }
  }
}

if (findings.length) {
  console.error("Legacy snap residue found:");
  for (const finding of findings) {
    console.error(
      `${finding.file}:${finding.line}:${finding.column} ${finding.label}: ${JSON.stringify(finding.match)}`
    );
    console.error(`  ${finding.text}`);
  }
  process.exit(1);
}

console.log("No legacy snap residue found.");
