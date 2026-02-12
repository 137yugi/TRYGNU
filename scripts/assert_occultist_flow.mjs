import fs from "node:fs";
import path from "node:path";

function readState(dir, index) {
  const file = path.join(dir, `state-${index}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing state file: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function fail(message, details = "") {
  const text = details ? `${message}\n${details}` : message;
  throw new Error(text);
}

function main() {
  const dirArg = process.argv[2] || "output/web-game-occultist";
  const dir = path.isAbsolute(dirArg) ? dirArg : path.join(process.cwd(), dirArg);

  if (!fs.existsSync(dir)) {
    fail("Output directory does not exist.", dir);
  }

  const s0 = readState(dir, 0);
  const s1 = readState(dir, 1);
  const s2 = readState(dir, 2);

  const rune0 = Number(s0.inventory?.rune_count ?? 0);
  const rune1 = Number(s1.inventory?.rune_count ?? 0);
  const credits0 = Number(s0.economy?.credits ?? NaN);
  const credits1 = Number(s1.economy?.credits ?? NaN);
  const credits2 = Number(s2.economy?.credits ?? NaN);
  const selected2 = s2.inventory?.selected;

  if (!Number.isFinite(credits0) || !Number.isFinite(credits1) || !Number.isFinite(credits2)) {
    fail("Credits are missing from state payload.", JSON.stringify({ credits0, credits1, credits2 }, null, 2));
  }
  if (rune0 < 1) {
    fail("Extract step did not produce any rune.", JSON.stringify(s0.inventory, null, 2));
  }
  if (rune1 >= rune0) {
    fail(
      "Imprint step did not consume rune inventory.",
      JSON.stringify({ rune_after_extract: rune0, rune_after_imprint: rune1 }, null, 2)
    );
  }
  if (credits1 >= credits0) {
    fail(
      "Imprint step did not spend credits.",
      JSON.stringify({ credits_after_extract: credits0, credits_after_imprint: credits1 }, null, 2)
    );
  }
  if (credits2 >= credits1) {
    fail(
      "Reforge step did not spend credits.",
      JSON.stringify({ credits_after_imprint: credits1, credits_after_reforge: credits2 }, null, 2)
    );
  }
  if (!selected2 || typeof selected2.power !== "number") {
    fail("Final selected item is missing after reforge.", JSON.stringify(s2.inventory, null, 2));
  }

  console.log(
    JSON.stringify(
      {
        result: "ok",
        rune_after_extract: rune0,
        rune_after_imprint: rune1,
        credits_after_extract: credits0,
        credits_after_imprint: credits1,
        credits_after_reforge: credits2,
        final_selected_power: selected2.power,
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
