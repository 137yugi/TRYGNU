import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

function parseArgs(argv) {
  const args = {
    url: null,
    iterations: 3,
    pauseMs: 250,
    headless: true,
    screenshotDir: "output/web-game",
    actionsFile: null,
    actionsJson: null,
    click: null,
    clickSelector: null,
    clickSelectorOptional: false,
    viewportWidth: null,
    viewportHeight: null,
    actionTimeoutMs: 5000,
    stepTimeoutMs: 15000,
    navigationTimeoutMs: 15000,
    expectFinalModes: null,
    allowFinalTitle: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--url" && next) {
      args.url = next;
      i++;
    } else if (arg === "--iterations" && next) {
      args.iterations = parseInt(next, 10);
      i++;
    } else if (arg === "--pause-ms" && next) {
      args.pauseMs = parseInt(next, 10);
      i++;
    } else if (arg === "--headless" && next) {
      args.headless = next !== "0" && next !== "false";
      i++;
    } else if (arg === "--screenshot-dir" && next) {
      args.screenshotDir = next;
      i++;
    } else if (arg === "--actions-file" && next) {
      args.actionsFile = next;
      i++;
    } else if (arg === "--actions-json" && next) {
      args.actionsJson = next;
      i++;
    } else if (arg === "--click" && next) {
      const parts = next.split(",").map((v) => parseFloat(v.trim()));
      if (parts.length === 2 && parts.every((v) => Number.isFinite(v))) {
        args.click = { x: parts[0], y: parts[1] };
      }
      i++;
    } else if (arg === "--click-selector" && next) {
      args.clickSelector = next;
      i++;
    } else if (arg === "--click-selector-optional") {
      args.clickSelectorOptional = true;
    } else if (arg === "--viewport" && next) {
      const parts = next.split("x").map((v) => parseInt(v.trim(), 10));
      if (parts.length === 2 && parts.every((v) => Number.isFinite(v) && v > 0)) {
        args.viewportWidth = parts[0];
        args.viewportHeight = parts[1];
      }
      i++;
    } else if (arg === "--action-timeout-ms" && next) {
      args.actionTimeoutMs = parseInt(next, 10);
      i++;
    } else if (arg === "--step-timeout-ms" && next) {
      args.stepTimeoutMs = parseInt(next, 10);
      i++;
    } else if (arg === "--navigation-timeout-ms" && next) {
      args.navigationTimeoutMs = parseInt(next, 10);
      i++;
    } else if (arg === "--expect-final-mode" && next) {
      args.expectFinalModes = next.split(",").map((v) => v.trim()).filter(Boolean);
      i++;
    } else if (arg === "--allow-final-title") {
      args.allowFinalTitle = true;
    }
  }
  if (!args.url) {
    throw new Error("--url is required");
  }
  return args;
}

const buttonNameToKey = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  enter: "Enter",
  space: "Space",
  a: "KeyA",
  b: "KeyB",
  m: "KeyM",
  escape: "Escape",
  esc: "Escape",
  "1": "Digit1",
  "2": "Digit2",
  "3": "Digit3",
  h: "KeyH",
};

const selectorAliases = {
  "#pickupPickBtn": "#pickupKeepBtn",
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function cleanPreviousDiagnostics(p) {
  if (!fs.existsSync(p)) return;
  for (const name of fs.readdirSync(p)) {
    if (/^(errors-\d+\.json|diagnostic-[^.]+\.(json|png))$/.test(name)) {
      fs.rmSync(path.join(p, name), { force: true });
    }
  }
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function withTimeout(promise, ms, label) {
  const timeoutMs = Math.max(1, finiteOr(ms, 1));
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function normalizeSelector(selector) {
  if (typeof selector !== "string" || !selector.trim()) return null;
  return selectorAliases[selector] || selector;
}

function normalizeButton(button) {
  if (typeof button !== "string") return null;
  const trimmed = button.trim();
  if (!trimmed) return null;
  if (trimmed === "mouse_left") return "left_mouse_button";
  if (trimmed === "mouse_right") return "right_mouse_button";
  return trimmed;
}

function normalizeStep(step) {
  if (!step || typeof step !== "object") return { frames: 1 };
  const clickSelector = normalizeSelector(step.click_selector || step.clickSelector || step.selector);
  const clickSelectors = Array.isArray(step.click_selectors)
    ? step.click_selectors.map(normalizeSelector).filter(Boolean)
    : Array.isArray(step.clickSelectors)
      ? step.clickSelectors.map(normalizeSelector).filter(Boolean)
      : clickSelector
        ? [clickSelector]
        : [];
  const rawButtons = Array.isArray(step.buttons)
    ? step.buttons
    : step.buttons
      ? [step.buttons]
      : step.button
        ? [step.button]
        : step.key
          ? [step.key]
          : [];
  const buttons = rawButtons.map(normalizeButton).filter(Boolean);
  const frames =
    typeof step.frames === "number"
      ? step.frames
      : typeof step.frame_count === "number"
        ? step.frame_count
        : typeof step.duration_frames === "number"
          ? step.duration_frames
          : undefined;
  return {
    ...step,
    click_selector: clickSelector,
    click_selectors: clickSelectors,
    buttons,
    frames,
    key_tap: step.key_tap || step.keyTap || step.press || null,
    wait_ms: typeof step.wait_ms === "number" ? step.wait_ms : step.waitMs,
    timeout_ms: typeof step.timeout_ms === "number" ? step.timeout_ms : step.timeoutMs,
    type_text: step.type_text || step.typeText || null,
    inject_tikfinity_event: step.inject_tikfinity_event || step.injectTikfinityEvent || step.live_event || null,
    click_page_x: typeof step.click_page_x === "number" ? step.click_page_x : step.clickPageX,
    click_page_y: typeof step.click_page_y === "number" ? step.click_page_y : step.clickPageY,
    mouse_x: typeof step.mouse_x === "number" ? step.mouse_x : step.mouseX,
    mouse_y: typeof step.mouse_y === "number" ? step.mouse_y : step.mouseY,
  };
}

function normalizeSteps(steps) {
  return Array.isArray(steps) ? steps.map(normalizeStep) : steps;
}

function normalizeModeList(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value).split(",").map((v) => v.trim()).filter(Boolean);
}

function parseAssertions(parsed) {
  const expect = parsed && typeof parsed.expect === "object" ? parsed.expect : {};
  return {
    expectedFinalModes:
      normalizeModeList(expect.final_mode) ||
      normalizeModeList(expect.final_modes) ||
      normalizeModeList(parsed?.expect_final_mode) ||
      normalizeModeList(parsed?.expect_final_modes),
    allowFinalTitle: Boolean(expect.allow_title || parsed?.allow_final_title),
  };
}

function parseActionSpec(parsed) {
  let steps = null;
  let iterationSteps = null;
  const assertions = parseAssertions(parsed);

  if (Array.isArray(parsed)) {
    steps = normalizeSteps(parsed);
  } else if (parsed && Array.isArray(parsed.steps)) {
    steps = normalizeSteps(parsed.steps);
  }

  if (parsed && Array.isArray(parsed.iterations)) {
    iterationSteps = parsed.iterations
      .map((entry) => {
        if (Array.isArray(entry)) return normalizeSteps(entry);
        if (entry && Array.isArray(entry.steps)) return normalizeSteps(entry.steps);
        return [];
      })
      .filter((entry) => entry.length > 0);
    if (!iterationSteps.length) iterationSteps = null;
  }

  return { steps, iterationSteps, assertions };
}

function makeVirtualTimeShim() {
  return `(() => {
    const pending = new Set();
    const origSetTimeout = window.setTimeout.bind(window);
    const origSetInterval = window.setInterval.bind(window);
    const origRequestAnimationFrame = window.requestAnimationFrame.bind(window);

    window.__vt_pending = pending;

    window.setTimeout = (fn, t, ...rest) => {
      const task = {};
      pending.add(task);
      return origSetTimeout(() => {
        pending.delete(task);
        fn(...rest);
      }, t);
    };

    window.setInterval = (fn, t, ...rest) => {
      const task = {};
      pending.add(task);
      return origSetInterval(() => {
        fn(...rest);
      }, t);
    };

    window.requestAnimationFrame = (fn) => {
      const task = {};
      pending.add(task);
      return origRequestAnimationFrame((ts) => {
        pending.delete(task);
        fn(ts);
      });
    };

    window.advanceTime = (ms) => {
      return new Promise((resolve) => {
        const start = performance.now();
        function step(now) {
          if (now - start >= ms) return resolve();
          origRequestAnimationFrame(step);
        }
        origRequestAnimationFrame(step);
      });
    };

    window.__drainVirtualTimePending = () => pending.size;
  })();`;
}

async function getCanvasHandle(page) {
  const handle = await page.evaluateHandle(() => {
    let best = null;
    let bestArea = 0;
    for (const canvas of document.querySelectorAll("canvas")) {
      const area = (canvas.width || canvas.clientWidth || 0) * (canvas.height || canvas.clientHeight || 0);
      if (area > bestArea) {
        bestArea = area;
        best = canvas;
      }
    }
    return best;
  });
  return handle.asElement();
}

async function captureCanvasPngBase64(canvas) {
  return canvas.evaluate((c) => {
    if (!c || typeof c.toDataURL !== "function") return "";
    const data = c.toDataURL("image/png");
    const idx = data.indexOf(",");
    return idx === -1 ? "" : data.slice(idx + 1);
  });
}

async function isCanvasTransparent(canvas) {
  if (!canvas) return true;
  return canvas.evaluate((c) => {
    try {
      const w = c.width || c.clientWidth || 0;
      const h = c.height || c.clientHeight || 0;
      if (!w || !h) return true;
      const size = Math.max(1, Math.min(16, w, h));
      const probe = document.createElement("canvas");
      probe.width = size;
      probe.height = size;
      const ctx = probe.getContext("2d");
      if (!ctx) return true;
      ctx.drawImage(c, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) return false;
      }
      return true;
    } catch {
      return false;
    }
  });
}

async function captureScreenshot(page, canvas, outPath, timeoutMs = 10000) {
  let buffer = null;
  let base64 = canvas ? await withTimeout(captureCanvasPngBase64(canvas), timeoutMs, "canvas toDataURL") : "";
  if (base64) {
    buffer = Buffer.from(base64, "base64");
    const transparent = canvas ? await withTimeout(isCanvasTransparent(canvas), timeoutMs, "canvas transparency probe") : false;
    if (transparent) buffer = null;
  }
  if (!buffer && canvas) {
    try {
      buffer = await withTimeout(canvas.screenshot({ type: "png", timeout: timeoutMs }), timeoutMs, "canvas screenshot");
    } catch {
      buffer = null;
    }
  }
  if (!buffer) {
    const bbox = canvas ? await withTimeout(canvas.boundingBox(), timeoutMs, "canvas boundingBox") : null;
    if (bbox) {
      buffer = await withTimeout(
        page.screenshot({
          type: "png",
          omitBackground: false,
          clip: bbox,
          timeout: timeoutMs,
        }),
        timeoutMs,
        "page clipped screenshot"
      );
    } else {
      buffer = await withTimeout(
        page.screenshot({ type: "png", omitBackground: false, timeout: timeoutMs }),
        timeoutMs,
        "page screenshot"
      );
    }
  }
  fs.writeFileSync(outPath, buffer);
}

class ConsoleErrorTracker {
  constructor() {
    this._seen = new Set();
    this._errors = [];
  }

  ingest(err) {
    const key = JSON.stringify(err);
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this._errors.push(err);
  }

  drain() {
    const next = [...this._errors];
    this._errors = [];
    return next;
  }
}

async function releaseButtons(page, buttons) {
  for (const button of buttons) {
    if (button === "left_mouse_button" || button === "right_mouse_button") {
      await page.mouse.up({ button: button === "left_mouse_button" ? "left" : "right" }).catch(() => {});
    } else if (buttonNameToKey[button]) {
      await page.keyboard.up(buttonNameToKey[button]).catch(() => {});
    }
  }
}

async function doChoreography(page, canvas, steps, options = {}) {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = normalizeStep(steps[stepIndex]);
    const actionTimeoutMs = finiteOr(step.timeout_ms, options.actionTimeoutMs || 5000);
    const stepTimeoutMs = finiteOr(step.step_timeout_ms, options.stepTimeoutMs || 15000);
    await withTimeout(runStep(page, canvas, step, stepIndex, actionTimeoutMs), stepTimeoutMs, `step ${stepIndex}`);
  }
}

async function runStep(page, canvas, step, stepIndex, actionTimeoutMs) {
  if (step.click_selectors?.length) {
    let clicked = false;
    let lastError = null;
    for (const selector of step.click_selectors) {
      try {
        await page.click(selector, { timeout: actionTimeoutMs });
        clicked = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (!clicked) {
      const selectors = step.click_selectors.join(", ");
      if (!step.optional) {
        throw new Error(`step ${stepIndex} click failed for ${selectors}: ${lastError?.message || String(lastError)}`);
      }
      console.warn(`[qa-client] optional click skipped at step ${stepIndex}: ${selectors}`);
    }
  }

  if (typeof step.click_page_x === "number" && typeof step.click_page_y === "number") {
    await page.mouse.click(step.click_page_x, step.click_page_y, { timeout: actionTimeoutMs });
  }

  if (step.inject_tikfinity_event) {
    await withTimeout(
      page.evaluate((payload) => {
        if (typeof window.injectTikfinityEvent !== "function") {
          throw new Error("window.injectTikfinityEvent is not available");
        }
        return window.injectTikfinityEvent(payload);
      }, step.inject_tikfinity_event),
      actionTimeoutMs,
      `step ${stepIndex} injectTikfinityEvent`
    );
  }

  const buttons = new Set(step.buttons || []);
  try {
    for (const button of buttons) {
      if (button === "left_mouse_button" || button === "right_mouse_button") {
        const bbox = canvas ? await withTimeout(canvas.boundingBox(), actionTimeoutMs, `step ${stepIndex} canvas boundingBox`) : null;
        if (!bbox) continue;
        const x = typeof step.mouse_x === "number" ? step.mouse_x : bbox.width / 2;
        const y = typeof step.mouse_y === "number" ? step.mouse_y : bbox.height / 2;
        await page.mouse.move(bbox.x + x, bbox.y + y);
        await page.mouse.down({ button: button === "left_mouse_button" ? "left" : "right" });
      } else if (buttonNameToKey[button]) {
        await page.keyboard.down(buttonNameToKey[button]);
      } else {
        console.warn(`[qa-client] unknown button ignored at step ${stepIndex}: ${button}`);
      }
    }

    const frames = typeof step.frames === "number" ? Math.max(0, step.frames) : 1;
    if (frames > 0) {
      const frameTimeoutMs = Math.max(actionTimeoutMs, frames * 80);
      await withTimeout(page.evaluate(async (frameCount) => {
        for (let i = 0; i < frameCount; i++) {
          if (typeof window.advanceTime === "function") {
            await window.advanceTime(1000 / 60);
          }
        }
      }, frames), frameTimeoutMs, `step ${stepIndex} advance ${frames} frames`);
    }

    if (typeof step.wait_ms === "number" && step.wait_ms > 0) {
      await sleep(step.wait_ms);
    }

    if (step.key_tap && buttonNameToKey[step.key_tap]) {
      await page.keyboard.press(buttonNameToKey[step.key_tap]);
    } else if (step.key_tap && typeof step.key_tap === "string") {
      await page.keyboard.press(step.key_tap);
    }

    if (step.type_text && typeof step.type_text === "string") {
      await page.keyboard.type(step.type_text);
    }
  } finally {
    await releaseButtons(page, buttons);
  }
}

async function drainAnimationFrame(page, timeoutMs) {
  await withTimeout(
    page.evaluate(async () => {
      if (typeof window.advanceTime === "function") {
        await window.advanceTime(1000 / 60);
      }
    }),
    timeoutMs,
    "initial animation frame"
  );
}

function chooseStepsForIteration(iterationSteps, fallbackSteps, index) {
  if (!iterationSteps || !iterationSteps.length) return fallbackSteps;
  if (index < iterationSteps.length) return iterationSteps[index];
  return iterationSteps[iterationSteps.length - 1];
}

async function loadStepsFromArgs(args) {
  let steps = null;
  let iterationSteps = null;
  let assertions = {
    expectedFinalModes: null,
    allowFinalTitle: false,
  };

  if (args.actionsFile) {
    const raw = fs.readFileSync(args.actionsFile, "utf-8");
    const parsed = JSON.parse(raw);
    const spec = parseActionSpec(parsed);
    steps = spec.steps;
    iterationSteps = spec.iterationSteps;
    assertions = spec.assertions;
  } else if (args.actionsJson) {
    const parsed = JSON.parse(args.actionsJson);
    const spec = parseActionSpec(parsed);
    steps = spec.steps;
    iterationSteps = spec.iterationSteps;
    assertions = spec.assertions;
  } else if (args.click) {
    steps = [
      {
        buttons: ["left_mouse_button"],
        frames: 2,
        mouse_x: args.click.x,
        mouse_y: args.click.y,
      },
    ];
  }

  if (!steps && !iterationSteps) {
    throw new Error("Actions are required. Use --actions-file, --actions-json, or --click.");
  }

  if (args.expectFinalModes) assertions.expectedFinalModes = args.expectFinalModes;
  if (args.allowFinalTitle) assertions.allowFinalTitle = true;

  return { steps, iterationSteps, assertions };
}

function assertFinalState(finalState, assertions) {
  if (!finalState || typeof finalState !== "object") {
    throw new Error("Final state assertion failed: state-*.json was not captured or was not an object");
  }

  const mode = finalState.mode;
  if (typeof mode !== "string" || !mode) {
    throw new Error("Final state assertion failed: final mode is missing");
  }
  const expectedFinalModes = normalizeModeList(assertions?.expectedFinalModes);
  if (expectedFinalModes?.length) {
    if (!expectedFinalModes.includes(mode)) {
      throw new Error(
        `Final state assertion failed: expected mode ${expectedFinalModes.join(",")} but got ${mode || "(missing)"}`
      );
    }
    return;
  }

  if (!assertions?.allowFinalTitle && mode === "title") {
    throw new Error("Final state assertion failed: final mode is still title; start action likely did not run");
  }
}

async function captureFailureDiagnostics(page, screenshotDir, label, timeoutMs) {
  const safeLabel = label.replace(/[^a-z0-9_-]+/gi, "-").slice(0, 64) || "failure";
  const payload = {
    label,
    url: page.url(),
    timestamp: new Date().toISOString(),
  };
  try {
    payload.title = await withTimeout(page.title(), timeoutMs, `${label} title`);
  } catch (err) {
    payload.title_error = err.message || String(err);
  }
  try {
    payload.state = await withTimeout(
      page.evaluate(() => {
        if (typeof window.render_game_to_text === "function") return window.render_game_to_text();
        return null;
      }),
      timeoutMs,
      `${label} render_game_to_text`
    );
  } catch (err) {
    payload.state_error = err.message || String(err);
  }
  try {
    await withTimeout(
      page.screenshot({
        type: "png",
        omitBackground: false,
        fullPage: true,
        path: path.join(screenshotDir, `diagnostic-${safeLabel}.png`),
        timeout: timeoutMs,
      }),
      timeoutMs,
      `${label} diagnostic screenshot`
    );
  } catch (err) {
    payload.screenshot_error = err.message || String(err);
  }
  fs.writeFileSync(path.join(screenshotDir, `diagnostic-${safeLabel}.json`), JSON.stringify(payload, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  ensureDir(args.screenshotDir);
  cleanPreviousDiagnostics(args.screenshotDir);

  const browser = await chromium.launch({
    headless: args.headless,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-crash-reporter", "--disable-hang-monitor"],
  });
  const page = await browser.newPage();
  try {
    page.setDefaultTimeout(args.actionTimeoutMs);
    page.setDefaultNavigationTimeout(args.navigationTimeoutMs);
    if (args.viewportWidth && args.viewportHeight) {
      await page.setViewportSize({ width: args.viewportWidth, height: args.viewportHeight });
    }
    const consoleErrors = new ConsoleErrorTracker();

    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      consoleErrors.ingest({ type: "console.error", text: msg.text() });
    });
    page.on("pageerror", (err) => {
      consoleErrors.ingest({ type: "pageerror", text: String(err) });
    });

    await page.addInitScript({ content: makeVirtualTimeShim() });
    await page.goto(args.url, { waitUntil: "domcontentloaded", timeout: args.navigationTimeoutMs });
    await page.waitForTimeout(500);
    await drainAnimationFrame(page, args.actionTimeoutMs).catch((err) => {
      console.warn(`[qa-client] initial animation frame skipped: ${err.message || String(err)}`);
    });
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"));
    });

    let canvas = await getCanvasHandle(page);

    if (args.clickSelector) {
      try {
        await page.click(args.clickSelector, { timeout: args.actionTimeoutMs });
        await page.waitForTimeout(250);
      } catch (err) {
        const message = `initial --click-selector failed for ${args.clickSelector}: ${err.message || String(err)}`;
        if (!args.clickSelectorOptional) throw new Error(message);
        console.warn(`[qa-client] ${message}`);
      }
    }

    const actions = await loadStepsFromArgs(args);
    const steps = actions.steps;
    const iterationSteps = actions.iterationSteps;
    let finalState = null;
    let hadConsoleErrors = false;

    for (let i = 0; i < args.iterations; i++) {
      if (!canvas) canvas = await getCanvasHandle(page);
      const activeSteps = chooseStepsForIteration(iterationSteps, steps, i);
      await doChoreography(page, canvas, activeSteps, {
        actionTimeoutMs: args.actionTimeoutMs,
        stepTimeoutMs: args.stepTimeoutMs,
      });
      await sleep(args.pauseMs);

      const shotPath = path.join(args.screenshotDir, `shot-${i}.png`);
      await captureScreenshot(page, canvas, shotPath, args.actionTimeoutMs);
      await withTimeout(
        page.screenshot({
          type: "png",
          omitBackground: false,
          fullPage: true,
          path: path.join(args.screenshotDir, `page-${i}.png`),
          timeout: args.actionTimeoutMs,
        }),
        args.actionTimeoutMs,
        `page-${i} full screenshot`
      );

      const text = await withTimeout(
        page.evaluate(() => {
          if (typeof window.render_game_to_text === "function") {
            return window.render_game_to_text();
          }
          return null;
        }),
        args.actionTimeoutMs,
        `state-${i} render_game_to_text`
      );
      if (text) {
        fs.writeFileSync(path.join(args.screenshotDir, `state-${i}.json`), text);
        try {
          finalState = JSON.parse(text);
        } catch (err) {
          throw new Error(`state-${i}.json is not valid JSON: ${err.message || String(err)}`);
        }
      }

      const freshErrors = consoleErrors.drain();
      if (freshErrors.length) {
        hadConsoleErrors = true;
        fs.writeFileSync(
          path.join(args.screenshotDir, `errors-${i}.json`),
          JSON.stringify(freshErrors, null, 2)
        );
        break;
      }
    }

    assertFinalState(finalState, actions.assertions);
    if (hadConsoleErrors) {
      throw new Error("Console or page errors were captured; see errors-*.json in screenshot dir");
    }
  } catch (err) {
    await captureFailureDiagnostics(page, args.screenshotDir, "failure", Math.min(args.actionTimeoutMs, 5000)).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
