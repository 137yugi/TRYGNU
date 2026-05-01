import { chromium } from "playwright";

const url =
  process.env.ONLINE_STATE_URL || "https://137yugi.github.io/TRYGNU/?seed=online-state-contract";

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
    pattern:
      /(?<![A-Za-z0-9_])snap(?:Cd|TouchBtn|Btn|Cooldown|Action|State|Input|Key|Ready|Timer|Charges)(?![A-Za-z0-9_])/u,
  },
];

function fail(message, details = {}) {
  console.error(JSON.stringify({ result: "failed", message, ...details }, null, 2));
  process.exit(1);
}

function parseStateText(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail("render_game_to_text returned invalid JSON", { error: String(error), text });
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function matchLegacySnap(text) {
  for (const { label, pattern } of forbiddenPatterns) {
    const match = String(text).match(pattern);
    if (match) return { label, match: match[0] };
  }
  return null;
}

function childPath(parentPath, key) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key)) return `${parentPath}.${key}`;
  return `${parentPath}[${JSON.stringify(key)}]`;
}

function findLegacySnapResidue(value, currentPath = "$", findings = []) {
  if (typeof value === "string") {
    const match = matchLegacySnap(value);
    if (match) {
      findings.push({
        path: currentPath,
        kind: "string",
        value,
        ...match,
      });
    }
    return findings;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findLegacySnapResidue(item, `${currentPath}[${index}]`, findings));
    return findings;
  }

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      const path = childPath(currentPath, key);
      const match = matchLegacySnap(key);
      if (match) {
        findings.push({
          path,
          kind: "key",
          value: key,
          ...match,
        });
      }
      findLegacySnapResidue(item, path, findings);
    }
  }

  return findings;
}

function validateStateContract(state) {
  const failures = [];
  const canvas = isRecord(state.canvas) ? state.canvas : null;
  const playBounds = isRecord(canvas?.play_bounds) ? canvas.play_bounds : null;
  const input = isRecord(state.input) ? state.input : null;
  const run = isRecord(state.run) ? state.run : null;

  if (!canvas) failures.push("canvas is missing or not an object");
  if (typeof canvas?.layout !== "string" || canvas.layout.length === 0) {
    failures.push("canvas.layout is missing or not a non-empty string");
  }
  if (!playBounds) {
    failures.push("canvas.play_bounds is missing or not an object");
  } else {
    for (const key of ["x", "y", "width", "height"]) {
      if (!Number.isFinite(playBounds[key])) {
        failures.push(`canvas.play_bounds.${key} is missing or not finite`);
      }
    }
  }
  if (!input) failures.push("input is missing or not an object");
  if (!run || !Number.isFinite(run.live_queue)) {
    failures.push("run.live_queue is missing or not finite");
  }

  const legacySnapFindings = findLegacySnapResidue(state);
  if (legacySnapFindings.length) {
    failures.push("legacy snap residue was found in render_game_to_text JSON keys or strings");
  }

  if (failures.length) {
    fail("Online state contract failed", {
      url,
      failures,
      legacy_snap_findings: legacySnapFindings,
      observed_contract: {
        canvas_layout: canvas?.layout ?? null,
        canvas_play_bounds: playBounds ?? null,
        has_input: Boolean(input),
        live_queue: run?.live_queue ?? null,
      },
    });
  }

  return {
    canvas_layout: canvas.layout,
    canvas_play_bounds: playBounds,
    input_keys: Object.keys(input),
    live_queue: run.live_queue,
  };
}

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function", null, {
    timeout: 10000,
  });

  const stateText = await page.evaluate(() => window.render_game_to_text());
  const state = parseStateText(stateText);
  const contract = validateStateContract(state);

  if (errors.length) fail("Browser emitted errors", { url, errors });

  console.log(
    JSON.stringify(
      {
        result: "ok",
        url,
        contract,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
