Original prompt: Webで動くゲームを作りたい、縦型でハクスラ。Diablo/ヴァンサバ要素、Glitch ON/OFF、配信向けUI、ランキング、課金連動を含めて面白さをブラッシュアップしたい。

## Current Status (2026-02-09)
- UI: inventory -> select -> equip/salvage flow exists.
- Itemization: random affix + legendary affix + power/tier implemented.
- Combat: glitch toggle, burst skill, contracts, legendary演出あり.
- Difficulty: enemy archetypes + very high scaling applied.
- Iteration hooks (new):
  - `window.render_game_to_text` added.
  - `window.advanceTime(ms)` added with fixed-step simulation.
  - fullscreen toggle added (`f` / `Esc`) on `.game-shell`.

## Gaps vs develop-web-game Skill
- `window.render_game_to_text` is missing.
- `window.advanceTime(ms)` deterministic stepping hook is missing.
- Fullscreen toggle (`f` / `Esc`) is missing.
- Playwright action loop validation has not been run in this branch.
- Environment checks:
  - `npx` exists.
  - `playwright` package is currently missing.
  - `$WEB_GAME_CLIENT` is ESM (`import` syntax) and current Node runtime (`v18.13.0`) executes `.js` as CJS here, so direct run fails without ESM handling workaround.
  - Network is blocked for npm (`ENOTFOUND registry.npmjs.org`), so dependency installation is not currently possible in-session.

## TODO (Priority)
1. Restore network or provide prebundled `playwright` to run the required automated loop.
2. Run `web_game_playwright_client.js` with action bursts and inspect screenshots.
3. Fix first console/runtime issue found by automated run.
4. Tune readability under iPhone landscape height constraints using screenshot evidence.
5. Expand `render_game_to_text` only if test loop needs extra state fields.

## Test Attempt Notes
- Local HTTP server was started successfully only with escalated permissions.
- Playwright client execution currently blocked by missing `playwright` module.
- Attempted `npm install playwright` failed due DNS/network restriction.

## Skill Upgrade
- Created reusable skill:
  - `/Users/137yugi/.codex/skills/glitch-survivors-iteration-loop/SKILL.md`
  - `/Users/137yugi/.codex/skills/glitch-survivors-iteration-loop/references/action_bursts.json`
- Purpose: enforce deterministic web-game iteration loop for this project.

## Iteration Update (Keyboard + State)
- Added keyboard shortcuts for deterministic automation:
  - `Enter`: start run (if idle)
  - `Space`: cast burst (if running)
  - `A`: toggle glitch on/off
- Extended `render_game_to_text` with `run.fullscreen`.
- Added local test action payload:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json`

## Automated Test Runs (Playwright)
- Environment setup completed:
  - `npm install playwright` succeeded.
  - `npx playwright install` succeeded (browser binaries downloaded).
- Browser launch in sandbox failed; succeeded with escalated execution.
- Run command (latest):
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8080 --actions-file test_actions_skill_loop.json --click-selector #startBtn --iterations 3 --pause-ms 250 --screenshot-dir output/web-game`
- Artifacts:
  - screenshots: `output/web-game/shot-0.png` .. `shot-2.png`
  - states: `output/web-game/state-0.json` .. `state-2.json`
  - no `errors-*.json` generated (no new console/page errors).
- Behavior verified from state:
  - burst input reflected by `run.burst_cd` countdown.
  - glitch toggles reflected by non-zero `glitch_time` with end-state `glitch_active:false`.

## Balance Iteration (2026-02-09)
- Added early/mid survival ramp in `spawnEnemy`:
  - early game slightly less HP/damage compression,
  - scaling still grows hard with time/wave.
- Fixed deterministic stepping consistency:
  - `advanceTime(ms)` no longer re-schedules RAF loop internally.
- Updated end overlay title:
  - shows `Run Clear` / `Run Failed` when run ended.
- Re-tested with long scenario and short sync scenario:
  - outputs in `output/web-game-long*` and `output/web-game-sync`.
  - no new Playwright error files generated.

## Balance Iteration 2 (2026-02-09)
- Changed contact damage model:
  - from continuous per-frame drain -> gated hit interval (`hitCooldown`) discrete hits.
  - added incoming damage float text for readability (`-<damage>`).
- Re-tested with long scenario:
  - output: `output/web-game-long3`.
  - run progressed to level-up pause and significantly longer survival before fail.
  - end overlay now clearly shows `Run Failed` state.

## Suggestions for Next Agent
- Keep deltas small: one mechanic or one UI block per iteration.
- After every feature change, run Playwright once and record result summary here.
- Track balancing with explicit metrics per run:
  - time_to_death, wave_reached, legendary_count, pickup_miss_count, damage_taken_rate.

## Iteration Update (2026-02-09, Gear Rework + Survival Pass)
- Gear system redesigned toward Diablo-like crafting loop:
  - Added **Occultist** panel in UI with `Extract / Imprint / Reforge`.
  - Added Affix Rune inventory (`state.affixRunes`) with selection and quality.
  - Added craft target selection by equipped slot (`state.selectedGearSlot`).
  - Added rune-aware state output in `render_game_to_text` (`rune_count`, `selected_rune`, `craft_target_slot`).
- Item mutation internals added:
  - `rebuildItemBonuses`, `rebuildItemName`, and per-affix impact scoring for replacement logic.
  - Imprint supports both normal affix and legendary aspect behavior.
- Survival tuning pass completed:
  - Reduced early wave budget and spawn pressure while preserving high scaling trajectory.
  - Enemy spawn now enforces minimum distance from player edge spawn.
  - Added close-range crowd-pressure mitigation and on-hit crowd knockback wave.
  - Increased hit interval and short invulnerability on damage to avoid frame-stacked instant death.
  - Increased XP gain and level damage growth for stronger early power curve.
- HUD readability pass:
  - Added translucent top-left HUD backing panel and pressure (`PRS`) telemetry.
- iPhone landscape UI compression pass:
  - Reduced right-column density and list heights (`item-list`, `rune-list`, details, ranking rows).

## Automated Validation (Playwright)
- Run 1 (`output/web-game-survival`): still too lethal in early wave; died by iteration 4.
- Run 2 after tuning (`output/web-game-survival2`): survived through iteration 4 (`mode: running`, HP remained).
- UI regression check (`output/web-game-uicheck`): completed with screenshots/state output and no error artifact files.

## Next Suggestions
1. Add scripted Playwright scenario that actively clicks Occultist buttons (extract/imprint/reforge) and asserts rune state transitions.
2. Add enemy role pacing (chaser vs zoner quotas) to avoid same-frame close clustering on one side.
3. Add stronger legendary audiovisual stack (pillar SFX layering + pickup stinger variants) for dopamine spikes.

## Exec Plan Autopilot Setup (2026-02-09)
- Added project-level agent rules for long-running `go` loops:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/AGENTS.md`
- Added explicit plan file for Codex Exec Plans style iteration:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/.agent/PLANS.md`
- Added loop runner script:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/run_exec_plan_loop.sh`
  - Runs `codex exec --full-auto ... "go"` repeatedly until `Status: DONE`.
- Added usage note:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/EXEC_PLAN_AUTOPILOT.md`
- Script sanity check done:
  - `bash -n scripts/run_exec_plan_loop.sh`
  - `./scripts/run_exec_plan_loop.sh 0`
- Added local reusable skill for autonomous loop:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/skills/exec-plan-web-game-loop/SKILL.md`
- Tried `skill-creator` initializer script, but environment lacks `PyYAML` (`ModuleNotFoundError: yaml`), so skill was created manually with valid frontmatter/body fallback.

## P0 Progress (2026-02-09)
- Implemented automated Occultist flow test assets:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_occultist.json`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/assert_occultist_flow.mjs`
- Extended Playwright client:
  - iteration-specific action payloads (`iterations[].steps`)
  - selector clicks and wait steps in choreography
- Validation run:
  - output dir: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-occultist`
  - assertion: `node scripts/assert_occultist_flow.mjs output/web-game-occultist` => `result: ok`
  - no `errors-*.json` generated.

## P0 Progress (2026-02-09, Enemy Roles)
- Added enemy role design: `chaser / bruiser / zoner`.
- Added role-aware spawn balancing to prevent chaser overstack in high pressure.
- Added role-specific movement behavior (zoner ring/orbit, bruiser heavy chase, chaser default pursue).
- Added role telemetry to HUD and `render_game_to_text` (`run.role_counts`, enemy `role`).
- Validation:
  - run: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-survival3`
  - outcome: survived through iteration 4, reached `mode: levelup` with HP remaining.
  - no `errors-*.json` generated.

## P0 Progress (2026-02-09, Legendary FX Pass)
- Upgraded legendary spectacle stack in `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`:
  - Added richer spawn/pickup chord-based SFX layers.
  - Added periodic legendary beacon SFX while legendary drop remains on ground.
  - Enhanced pillar rendering with larger multi-layer beam, floor glow, side fade, and ring pulse.
  - Added `LEGENDARY SIGNAL / FOLLOW THE PILLAR` overlay while legendary exists on ground.
  - Extended legendary banner persistence and urgency text.
- Added validation action set:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_legendary_showcase.json`
- Validation run:
  - output: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-legendary`
  - screenshots confirm overlay + pillar intensity increase.
  - no `errors-*.json` generated.
- Observation:
  - Heavy gift spam causes enemy count spike (60-78 range); spectacle works, but this scenario is intentionally chaotic.

## Incident Fix (2026-02-09 15:42Z)
- User-reported blocker analyzed: approval dialog reappeared and blocked UI interaction.
- Root cause:
  - Approved escalation prefix was absolute-path form:
    - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs`
  - Some runs used relative form:
    - `node web_game_playwright_client.mjs ...`
  - Prefix mismatch triggered repeated approval prompts, causing perceived stuck state.
- Fix:
  - Standardized Playwright execution to absolute path form only.
  - Re-ran pending validations successfully without additional blocking prompts.

## Validation After Incident Fix
- Completed runs:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck4`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-occultist4`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-legendary4`
- Error artifacts:
  - No `errors-*.json` in these outputs.
- Assertions:
  - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/assert_occultist_flow.mjs /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-occultist4`
  - Result: `ok`.

## Gameplay/Balancing Delta Applied This Cycle
- Added enemy on-field cap + quality reinforcement when cap is reached:
  - function: `maxEnemiesOnField()`
  - behavior: suppress over-spawn and reinforce existing enemies instead (hp/dmg/speed micro buffs).
- Added cap telemetry to HUD and text state:
  - HUD shows `ENEMY current/cap`.
  - `render_game_to_text` includes `run.enemy_cap`.
- Kept high-pressure feel while improving readability:
  - sample state: `legendary4/state-3.json` -> `enemies_alive: 36`, `enemy_cap: 55`, `threat_score: 132`.

## Notes for next loop
- Keep Playwright commands absolute-path form to avoid prefix mismatch prompts.

## Iteration Update (2026-02-09 15:45Z, Craft UI Readability)
- Equipment/Crafting readability pass completed.
- UI changes:
  - Added quick meta strip in gear detail:
    - `#itemQuickMeta` in `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - Added compact metric pills style:
    - `.item-quick-meta`, `.meta-pill` (`good/warn/bad/info`) in `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/styles.css`
- Logic changes in `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`:
  - Added quick-cost helpers `getReforgeCost`, `getImprintCost`.
  - Shortened `buildItemDetail` to focused lines (source/slot + top affixes + LEG line).
  - Rendered quick meta pills with:
    - slot, power tier, delta, salvage, reforge cost, imprint cost/lock state.
  - Refined `affixLabHint` to include actionable cost/lock hints.
  - Compressed `gearHint` text to include credits and target at glance.

## Validation (absolute-path Playwright)
- `output/web-game-uicheck5`: pass
- `output/web-game-occultist5`: pass
- `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/assert_occultist_flow.mjs /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-occultist5` => `ok`
- No `errors-*.json` in both output dirs.

## Observed Outcome
- Core HUD remains readable under pressure.
- Craft decisions are faster (cost/lock/delta visible without reading long detail text).

## Iteration Update (2026-02-10 05:33Z, Blocker Fix + Gift Rebalance)
- Blocker fix (進行不能対策):
  - Added run-start fail-safe: tapping canvas while idle now triggers `startRun()`.
  - Added pointer capture recovery helper `releasePointerDrag()` and call it on `startRun()` / `finishRun()` to avoid stale pointer capture after fail/retry.
  - HUD start button now reflects state (`Run Start` / `Running...` / `Retry Run`) and disables only while running.
- Gift system rebalance (quality over raw crowd):
  - Added live event panel wiring (`giftEventPanel`, `giftEventName`, `giftEventMeta`) with timer/class updates.
  - Implemented `setGiftEvent()` + `syncGiftEventPanel()`.
  - Implemented `reinforceEnemies()` and reused it in spawn-cap pulse + gift events.
  - Reworked `triggerGift`:
    - reduced forced extra spawns,
    - increased elite/quality reinforcement and frenzy tuning,
    - clearer reward shaping (more treasure rain quality, burst cooldown relief in surge),
    - event metadata now exposed to UI and text-state.
  - Added `run.gift_event { kind, timer }` to `render_game_to_text`.

## Validation (absolute-path Playwright)
- Mandatory loop:
  - `output/web-game-uicheck6` pass, no `errors-*.json`.
- Full regression:
  - `output/web-game-occultist6` pass.
  - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/assert_occultist_flow.mjs /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-occultist6` => `result: ok`.
  - `output/web-game-legendary5` pass, no `errors-*.json`.
- Restart reproduction (Run Failed -> Retry):
  - Added `test_actions_restart_loop.json`.
  - Run: `output/web-game-restart2`.
  - Evidence:
    - `state-0.json` / `state-1.json`: `mode: ended`
    - `state-2.json` / `state-3.json`: `mode: running`
  - Confirms second-start recoverability (no new errors).

## Notes for next loop
- Visual overlap remains in high-chaos scenes (`LEGENDARY`, `FRENZY`, and floating combat text). Next pass should reduce text collision priority/positioning in `draw()`.

## Iteration Update (2026-02-10 07:19Z, Overlay Conflict Pass + Autopilot Policy)
- Autopilot policy updated (no repeated `go` required):
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/AGENTS.md` now states autonomous continuation until `Status: DONE` or blocker.
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/run_exec_plan_loop.sh` default prompt changed to autonomous execution text (instead of literal `go`).
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/EXEC_PLAN_AUTOPILOT.md` updated accordingly.

- Overlay conflict reduction in `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`:
  - `LEGENDARY SIGNAL` top text moved to centered top to reduce right-side collision.
  - `LEGENDARY` banner moved to fixed top strip (y=52..96) to avoid center fight occlusion.
  - Gift event card now auto-relocates downward when top legendary signal/banner is active.
  - `GIFT` local float text keeps amount only; removed duplicate event-tag float over player.
  - End overlay subtitle updated to mention both restart paths:
    - `Tap canvas or Run Start to retry`.

## Validation (absolute-path Playwright)
- `output/web-game-uicheck8`: pass, no `errors-*.json`.
- `output/web-game-occultist8`: pass, assert `ok`.
- `output/web-game-legendary7`: pass, no `errors-*.json`.
- Restart regression:
  - `output/web-game-restart5`: pass, no `errors-*.json`.
  - `state-0/1: mode=ended` -> `state-2/3: mode=running` confirmed.

## Observed outcome
- High-chaos scenes remain intense, but text overlaps are reduced:
  - `LEGENDARY SIGNAL` and Gift event card no longer overlap in the same top-right lane.
  - Center readability improved during pickup/legendary moments.

## Notes for next loop
- Remaining pain-point is bursty death in extreme crowd contact; next pass should smooth multi-contact damage without lowering overall threat.

## Iteration Update (2026-02-10 07:19Z, Multi-contact Damage Smoothing)
- Implemented contact-damage smoothing in `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js` (`updateEnemies`):
  - Added overlap depth multiplier (`overlapMul`) so glancing contact hurts less than deep overlap.
  - Added crowd saturation dampening (`multiContactMul`) to reduce stacked burst damage in heavy swarms.
  - Added dynamic hit cadence scaling:
    - increases hit cooldown / invulnerability duration under high `closePressure`.
  - Goal: keep danger high while reducing non-reactable instant deaths.

## Validation (absolute-path Playwright)
- `output/web-game-uicheck10`: pass, no `errors-*.json`.
- `output/web-game-occultist10`: pass, assert `ok`.
- `output/web-game-legendary8`: pass, no `errors-*.json`.
- Restart stress:
  - `output/web-game-restart7`: pass, no `errors-*.json`.
  - state evidence:
    - `state-0` high pressure with survivable HP (`63.3`)
    - `state-1` enters `mode: levelup` under pressure (continued progression)

## Current takeaway
- Overlay readability remains improved.
- High-pressure survivability is less spikey; still dangerous, but more recoverable than immediate wipe behavior.

## Next loop target
- Re-tighten endgame tension after smoothing (minor coefficient tuning) to avoid over-softening while preserving fairness.

## Iteration Update (2026-02-10 10:32Z, Endgame Tension Re-tighten)
- Implemented endgame tension re-tightening in `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js` (`updateEnemies` contact branch):
  - Added `lateStage` scalar from time/wave/fury.
  - Added `flowPressure` scalar from high flow performance.
  - Applied `tensionMul` to contact damage.
  - Reduced crowd dampening strength in later stages (`crowdDampen` dynamic), so endgame remains threatening.
  - Kept smoothing primitives (`overlapMul`, dynamic cadence) to preserve fairness.

## Validation (absolute-path Playwright)
- `output/web-game-uicheck11`: pass, no `errors-*.json`.
- `output/web-game-occultist11`: pass, assert `ok`.
- `output/web-game-legendary9`: pass, no `errors-*.json`.
- Restart stress:
  - `output/web-game-restart8`: pass, no `errors-*.json`.
  - Noted prolonged `mode: levelup` in restart states (`state-0..2`), indicating selection-wait stall rather than crash.

## Current takeaway
- Endgame threat was tightened back up while maintaining anti-spike smoothing.
- Remaining bottleneck for long unattended validation is level-up modal waiting for manual choice.

## Next loop target
- Add a safe resume path for level-up stall (automation-friendly choice flow) without removing manual agency in normal play.

## Iteration Update (2026-02-10 13:06Z, Button Unresponsive Root Cause + Pause Escape)
- User-reported blocker re-investigated: "button cannot be pressed / progression blocked" recurred around pause states.
- Root cause clarified:
  - It was not a dead click handler.
  - In `pauseMode` (`levelup` / `mutation`), users often hit `Run Start`, but prior behavior treated Start as a pure run-start action and did not always resolve pause immediately.
  - This created a "stuck" perception even when the game loop was alive.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added `resolvePauseWithFallback(source)`:
    - If `pauseMode === levelup`: auto-resolves level choices immediately (including queued level-ups) with priority pick fallback.
    - If `pauseMode === mutation`: resolves by first available mutation if needed.
  - Updated Start button behavior via `handleStartAction()`:
    - `pauseMode` -> resolve pause now.
    - not running -> `startRun()`.
  - Updated canvas pointer handling:
    - tapping canvas while paused now resolves pause instead of no-op.
  - Added modal-backdrop pointer handlers:
    - tapping outside cards in level/mutation modal resolves pause.
  - Updated Enter key behavior:
    - Enter now works as resume/start action when paused or idle.
  - Updated HUD start button state:
    - shows `Continue ...` during pause, and disabled only when truly running without pause.
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - Level-up text now explicitly says outside tap can continue.

### Test Assets Added/Adjusted
- Added: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_fail_retry.json`
- Added/iterated: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_pause_resume.json`

### Validation (absolute-path Playwright)
- Mandatory loop:
  - `output/web-game-uicheck15`: pass, no `errors-*.json`.
- Restart / pause recovery checks:
  - `output/web-game-restart11`: pass, no `errors-*.json`.
  - `output/web-game-pause-resume4`: pass, no `errors-*.json`.
  - Evidence: `pause-resume4/state-0.json`, `state-1.json` both `mode: running`.

### Current Takeaway
- Progression blocker is now mitigated with multiple resume paths (Start button, canvas tap, modal backdrop tap, Enter key).
- Core loop remains stable after changes (no new Playwright console/page error artifacts).

### Next Loop Target
- Reduce on-screen information density (Top HUD two-level display: compact default + detailed mode) while keeping all core controls in-game view.

## Iteration Update (2026-02-10 13:06Z, HUD Compact Pass)
- Reduced information density with a compact-first HUD model while preserving detail access.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - Added top-line toggle button: `#hudModeBtn` (`HUD: Compact` / `HUD: Detailed`).
  - Tagged stat cells with `stat-core` / `stat-detail` for compact filtering.
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/styles.css`
  - Added compact mode rule: `.stats.compact .stat-detail { display: none; }`.
  - Added small button style for HUD mode toggle.
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added state flag `hudCompact` (defaults true, persists across runs).
  - Added UI wiring (`ui.stats`, `ui.hudModeBtn`) and toggle handling (`H` key + button).
  - Added `run.hud_compact` to `render_game_to_text` for deterministic validation.
  - Reworked in-canvas HUD rendering:
    - Compact mode now uses 4 concise lines.
    - Detailed mode keeps expanded metrics.

### Validation (absolute-path Playwright)
- Mandatory loop:
  - `output/web-game-uicheck17`: pass, no `errors-*.json`.
- Occultist regression:
  - `output/web-game-occultist14`: pass, no `errors-*.json`.
  - `node scripts/assert_occultist_flow.mjs output/web-game-occultist14` => `result: ok`.
- State evidence:
  - `uicheck17/state-2.json` includes `run.hud_compact: true`.

### Visual Outcome
- Canvas top-left telemetry occupies less area and is easier to parse in iPhone landscape.
- Core combat readability improved during legendary overlays.

## Iteration Update (2026-02-10 14:01Z, UI/System Focus Controls)
- Scope narrowed to UI readability and system stability (no new content mechanics).

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - Added `System Focus` panel in controls with 3 toggles:
    - `#systemTextBtn` (Text density)
    - `#systemFlashBtn` (Flash FX)
    - `#systemShakeBtn` (Shake FX)
  - Updated gameplay hint with shortcut keys: `H/T/V/J`.
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/styles.css`
  - Added compact styles for system panel and ON/OFF button states.
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added `state.settings` with defaults:
    - `combatTextMode: low|full|off`
    - `flashFx: boolean`
    - `shakeFx: boolean`
  - Added normalization helper `normalizeSystemSettings`.
  - Added UI sync `syncSystemFocusButtons()` and wired button handlers.
  - Added keyboard shortcuts:
    - `T` cycles text mode (`LOW -> FULL -> OFF`)
    - `V` toggles flash
    - `J` toggles shake
  - Persisted settings across run restart (`startRun` keep/restore path).
  - Applied settings into effect pipeline:
    - `spawnFloatText` now respects text mode and caps text count by mode.
    - `triggerFlash` / `triggerShake` now obey toggle settings.
  - Added deterministic visibility in `render_game_to_text`:
    - `run.system_focus { text_mode, flash_fx, shake_fx }`.

### Validation (absolute-path Playwright)
- Mandatory loop:
  - `output/web-game-uicheck18`: pass, no `errors-*.json`.
- Occultist regression:
  - `output/web-game-occultist15`: pass, no `errors-*.json`.
  - `node scripts/assert_occultist_flow.mjs output/web-game-occultist15` => `result: ok`.
- Legendary stress regression:
  - `output/web-game-legendary12`: pass, no `errors-*.json`.
- State evidence:
  - `uicheck18/state-2.json` includes `run.system_focus` with default `text:low, flash:true, shake:true`.

### Visual Outcome
- UI options for readability/performance are now in-game and immediate.
- Combat readability under heavy legendary scenes improved further by reducing text pressure without touching core balance.

## Iteration Update (2026-02-10 15:12Z, Alert Layer Cleanup + Pause Safety)
- Scope: UIとシステム専念の継続。Legendary/Danger重なり、重要テキスト過密、pause復帰の3点を修正。

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added `state.floatTextStamp` and critical-float de-dup in `spawnFloatText()`.
    - Suppresses repeated `LEGENDARY` / `DANGER` spam within short intervals.
  - Reworked overlay rendering in `draw()`:
    - Removed center-top `LEGENDARY SIGNAL` text strip.
    - Introduced right-top stacked alert cards for:
      - `LEGENDARY` / `LEGENDARY SIGNAL`
      - `DANGER`
    - Keeps combat center readable while preserving urgency.
  - Hardened `resolvePauseWithFallback()`:
    - Increased guard for queued level-ups.
    - Added forced close path for extreme levelup queues to avoid perceived deadlock.

### Validation (absolute-path Playwright)
- 3-scenario regression:
  - `output/web-game-uicheck19` pass (`errors-*.json` none)
  - `output/web-game-occultist16` pass (`errors-*.json` none)
  - `output/web-game-legendary13` pass (`errors-*.json` none)
  - `node scripts/assert_occultist_flow.mjs output/web-game-occultist16` => `result: ok`
- Pause/restart follow-up:
  - `output/web-game-pause-resume6` pass (`errors-*.json` none)
  - `output/web-game-restart9` pass (`errors-*.json` none)
  - Evidence: `restart9/state-1.json` -> `mode: running`

### Visual Outcome
- `legendary13/shot-3.png`: Legendary通知が右上カードに整理され、中央帯の重なりが解消。
- `uicheck20/shot-2.png`: 右上カード化後も通常HUD可読性を維持。

### Open Note
- `pause-resume6/state-0..2.json` は `mode: levelup` 継続だが、クラッシュではなく連続レベルアップ待機。次サイクルで自動判定シナリオを追加予定。

## Iteration Update (2026-02-10 15:32Z, Pause Recovery automation)
- Added pause-recovery automation assets:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_pause_recovery.json`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/assert_pause_recovery.mjs`
- Added levelup queue compression in `openLevelChoiceModal()`:
  - when queue is too large, auto-picks a portion silently before showing modal.
  - improves chance of immediate resume without long modal loops.

### Validation
- First probe:
  - `output/web-game-pause-recovery1` -> all `mode: levelup` (expected fail for baseline)
  - `assert_pause_recovery` => failed (captured for evidence)
- After queue compression patch:
  - `output/web-game-pause-recovery2` -> `state-0..2` all `mode: running`
  - `node scripts/assert_pause_recovery.mjs output/web-game-pause-recovery2` => `result: ok`
- Regression check:
  - `output/web-game-uicheck21` pass, `errors-*.json` none.

### Takeaway
- Progression-blocker symptom is now testable and guarded by dedicated automation.
- Next is polish-only: reduce text clutter priority between right-top alerts and center float text.

## Iteration Update (2026-02-10 15:50Z, Float Priority Rule)
- Implemented additional text-density control during alert overlays.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added float priority model:
    - `getFloatTextPriority()`
    - `getRenderableFloatTexts(alertOverlayActive)`
  - During alert overlays (`legendary`/`danger`), render list now:
    - keeps only high-priority float texts,
    - reduces display cap dynamically.
  - `spawnFloatText()` now applies tighter global cap when alert overlays are active.

### Validation
- Mandatory loop:
  - `output/web-game-uicheck22` pass, `errors-*.json` none.
- Legendary visibility regression:
  - `output/web-game-legendary14` pass, `errors-*.json` none.
  - Visual check confirms reduced center text clutter while right-top alert card remains.
- Occultist regression:
  - `output/web-game-occultist17` pass, `errors-*.json` none.
  - `node scripts/assert_occultist_flow.mjs output/web-game-occultist17` => `result: ok`.

### Outcome
- Alert-heavy scenes now keep important labels but drop lower-priority spam faster.
- UI/system readability improved without lowering combat pressure.

## Iteration Update (2026-02-10 16:00Z, Adaptive Alert Card Width)
- Added layout-level polish for alert-vs-HUD interference.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Alert cards now use adaptive width based on available space after HUD panel.
  - If right-top space is tight, alert cards are moved below HUD panel.
  - `fillText` is now width-bounded inside cards to avoid overflow clipping.

### Validation
- Mandatory loop:
  - `output/web-game-uicheck23` pass, `errors-*.json` none.
- Legendary stress:
  - `output/web-game-legendary15` pass, `errors-*.json` none.
- HUD detailed stress:
  - `output/web-game-hud-detail1` pass, `errors-*.json` none.
  - `state-0..3` shows `hud_compact:false` and stable running flow.

### Outcome
- Alert card/HUD overlap risk reduced in both compact and detailed HUD modes.

## Iteration Update (2026-02-10 16:12Z, Legendary-family Float Suppression)
- Reduced duplicate Legendary-family messaging while alert card is active.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - In `spawnFloatText()`:
    - detect active legendary alert state,
    - suppress `LEGENDARY DROP` / `PITY LEGENDARY` float texts during alert,
    - add family-level throttling for remaining `LEGENDARY` text.

### Validation
- Mandatory loop:
  - `output/web-game-uicheck24` pass, `errors-*.json` none.
- Legendary stress:
  - `output/web-game-legendary16` pass, `errors-*.json` none.
  - Visual check: Legendary-family duplicate text reduced in center combat area.
- Occultist regression:
  - `output/web-game-occultist18` pass, `errors-*.json` none.
  - `node scripts/assert_occultist_flow.mjs output/web-game-occultist18` => `result: ok`.

### Outcome
- Alert-heavy scenes are cleaner: right-top card remains, center duplicate legendary text is reduced.

## Iteration Update (2026-02-10 16:40Z, HUD Detail Shortening)
- Compressed HUD detailed text lines for better readability in landscape.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Detailed HUD strings were shortened:
    - line2: `SPD/DIR/PRS/PK` compact notation
    - line3/4: removed separators and long labels
  - Goal: reduce horizontal pressure while keeping key telemetry.

### Validation
- Mandatory loop:
  - `output/web-game-uicheck25` pass, `errors-*.json` none.
- HUD detailed stress:
  - `output/web-game-hud-detail2` pass, `errors-*.json` none.
  - `state-0..3` confirms `hud_compact:false` path is stable.
- Legendary stress:
  - `output/web-game-legendary17` pass, `errors-*.json` none.
- Occultist regression:
  - `output/web-game-occultist19` pass, `errors-*.json` none.
  - `node scripts/assert_occultist_flow.mjs output/web-game-occultist19` => `result: ok`.

### Outcome
- Detailed HUD remains informative but visually lighter under mobile landscape constraints.

## Iteration Update (2026-02-10 16:50Z, Progress % reporting)
- User request reflected: from this point, every status report includes progress percentage.
- Current plan completion: **96.7% (29/30)** based on `.agent/PLANS.md` checklist.

## Iteration Update (2026-02-10 17:08Z, Levelup HUD finalize + State observability)
- User request handled: progress reporting now includes percentage, and this cycle closes the remaining ExecPlan item.
- Progress: **100% (30/30)**.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Finalized levelup-specific HUD detail text spacing:
    - `LVUP AUTO <t>s  Q<queue>  PICK[1-3]`
  - Extended `render_game_to_text` for pause diagnostics:
    - top-level `pause_mode`
    - `run.level_queue`
    - `run.level_autopick_timer`

### Validation
- `node --check game.js` => pass.
- Mandatory loop:
  - `output/web-game-uicheck27` => pass, `errors-*.json` none.
  - `output/web-game-uicheck28` => pass, `errors-*.json` none.
- HUD detail stress:
  - `output/web-game-hud-detail4` => pass, `errors-*.json` none.
  - `output/web-game-hud-detail5` => pass, `errors-*.json` none.

### Evidence
- `uicheck28/state-1.json`:
  - `mode: "levelup"`
  - `pause_mode: "levelup"`
  - `run.level_autopick_timer: 4.68`
- `hud-detail5/state-0.json`:
  - `hud_compact: false`
  - `pause_mode: "levelup"`
- `hud-detail5/state-1..3.json`: `mode: "running"` へ復帰確認。

### Plan Sync
- Updated `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/.agent/PLANS.md`:
  - `Status: DONE`
  - `Overall Progress: 100% (30/30)`
  - Final checklist item marked done.

### Extra Safety Validation (2026-02-10 17:12Z)
- Ran restart regression once more:
  - `output/web-game-restart10`
- Result:
  - `errors-*.json` none.
  - `state-0..2` reports `pause_mode: "levelup"` with decreasing `run.level_autopick_timer` (wait state, not blocked input).
- Progress remains **100% (30/30)**.

## Iteration Update (2026-02-11 05:40Z, Nunchaku core rework restart)
- User restart request handled; loop resumed from current workspace state.
- Progress (reopened plan): **84% (35/41)**.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added core helpers:
    - `distanceSqToSegment(...)` for swept hit detection.
    - `computeMilestoneProgress(...)` for HUD/telemetry progress percent.
  - Nunchaku state extended:
    - `prevX/prevY` for sweep trace.
    - `aimX/aimY` for target-follow swing assist.
  - Nunchaku physics pass:
    - stronger target-follow and tangential transfer from player motion,
    - reduced drag to keep swing energy,
    - swept-segment hit check (prevents pass-through),
    - lower minimum impact threshold for hit registration.
  - Risk/reward pass:
    - self-hit gating switched to inward speed check,
    - self-hit impact threshold raised to emphasize high-speed punishment,
    - self-hit now collapses combo to create clear penalty.
  - Combo system:
    - added `state.swingCombo` / `state.swingComboTimer`,
    - combo gain on nunchaku hits,
    - combo-based damage multiplier in `computeSwingImpactDamage`,
    - combo decay over time.
  - HUD & state observability:
    - compact/detailed HUD now shows `COMBO` and `M/B` progress percent,
    - `render_game_to_text` includes:
      - `run.swing_combo`
      - `run.progress_pct.{mutation,miniboss}`
      - `nunchaku.prev_*` and `nunchaku.aim_*`.

### Validation
- Syntax:
  - `node --check game.js` => pass.
- Playwright runs (absolute path):
  - `output/web-game-uicheck32` => pass, `errors-*.json` none.
  - `output/web-game-nunchaku-swing2` => pass, `errors-*.json` none.
  - `output/web-game-nunchaku-selfhit4` => pass, `errors-*.json` none.
  - `output/web-game-legendary24` => pass, `errors-*.json` none.

### Evidence
- `output/web-game-nunchaku-selfhit4/state-2.json`:
  - `mode: "ended"`, `nunchaku.speed: 681.69`, `self_hit_cd: 0.32`, `hp: -12.8`
  - self-hit risk path is active.
- `output/web-game-legendary24/state-3.json`:
  - `run.swing_combo: 11.26`
  - high-density combat can build combo.
- `output/web-game-uicheck32/state-2.json`:
  - `run.progress_pct: { mutation: 10, miniboss: 7 }`
  - new progress telemetry is visible in run state.

### Plan Sync
- Updated `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/.agent/PLANS.md`:
  - `Status: IN_PROGRESS`
  - `Overall Progress: 84% (35/41)`
  - Added new done/pending checklist items for nunchaku cycle.

### Next TODO
1. Raise combo activation rate in normal-density loops (`uicheck`) without making early game unfair.
2. Add stronger visual differentiation for Weapon vs Armor changes (player/weapon silhouette feedback).

## Iteration Update (2026-02-10 20:55Z, Nunchaku UX polish + plan close)
- User request handled: UI/システム専念を維持しつつ、ヌンチャク操作感と視認性を優先して調整。
- Progress: **100% (41/41)**.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - Removed `#glitchBtn` from controls row (glitch is fixed ON by design).
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/styles.css`
  - Added scroll safety for right-side information area:
    - `.side-column { overflow: hidden; }`
    - `.info-grid` now supports `overflow-y: auto` with touch scroll settings.
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added pointer motion state (`state.pointer`) and mapped pointer velocity into nunchaku aim force.
  - Improved nunchaku aim fallback for keyboard movement (`p.vx/p.vy` based direction).
  - Tuned self-hit thresholds for clearer risk feedback.
  - Added null-guard handling for removed glitch button:
    - guarded `ui.glitchBtn` text/class updates and click binding.
  - Increased normal-density combo build by adding combo gain on burst hits.
  - Enhanced equipment visual differentiation:
    - weapon rarity accents and highlights on nunchaku head ring,
    - armor rarity accent ring around player body.
  - Synced telemetry:
    - `render_game_to_text.player.swing_speed` now reflects `nunchaku.speed` directly.

### Validation
- Syntax:
  - `node --check game.js` => pass.
- Mandatory loop:
  - `output/web-game-uicheck33` => pass (`errors-*.json` none).
- Additional nunchaku checks:
  - `output/web-game-nunchaku2` => pass (`errors-*.json` none).
  - `output/web-game-nunchaku-selfhit4` => pass (`errors-*.json` none).
  - `output/web-game-nunchaku3` => pass (`errors-*.json` none).
- Regression trio:
  - `output/web-game-uicheck34` => pass (`errors-*.json` none).
  - `output/web-game-occultist24` => pass (`errors-*.json` none).
  - `output/web-game-legendary25` => pass (`errors-*.json` none).
  - `node scripts/assert_occultist_flow.mjs output/web-game-occultist24` => `result: ok`.

### Evidence
- Fixed null crash after glitch button removal:
  - old artifact `output/web-game-nunchaku-selfhit3/errors-0.json` had null access pageerrors.
  - new run `output/web-game-nunchaku-selfhit4` has no errors.
- Combo in normal-density-adjacent swing run:
  - `output/web-game-nunchaku3/state-2.json`:
    - `run.swing_combo: 6.56`
    - `player.swing_speed: 822.24`
    - `run.hits_taken: 3`
- Core regression remains stable:
  - `output/web-game-uicheck34/state-2.json` / `output/web-game-occultist24/state-2.json` / `output/web-game-legendary25/state-3.json`.

### Plan Sync
- Updated `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/.agent/PLANS.md`:
  - `Status: DONE`
  - `Overall Progress: 100% (41/41)`
  - Closed previously pending 2 items:
    - normal-density combo activation uplift,
    - Weapon/Armor visual differentiation.

## Iteration Update (2026-02-10 21:20Z, Stop-cause fix + pickup compare stabilization)
- User report handled: 「止まってた」再調査と復旧。

### Root Cause
- `pickup_compare` 導入時に `state.pendingPickupItem` のデータ形が混在。
  - ある経路は `state.pendingPickupItem = normalizedItem`
  - 別経路は `state.pendingPickupItem.item` 前提
- この不一致で `pauseMode: "pickup_compare"` には入るが、比較表示データが欠落するケースが発生。

### Fix
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added `getPendingPickupItem()` helper and routed all compare paths through it.
  - `openPickupCompareModal()` now stores as `{ item: normalized }`.
  - Updated `renderPickupCompareModal()`, `resolvePickupChoice()`, HUD detail line, and `render_game_to_text` export to use normalized accessor.
  - Added safe fallback: if compare payload is missing during pause, close compare mode and recover HUD state.

### Validation
- Syntax:
  - `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck37` => pass (`errors-*.json` none)
- Compare scenario:
  - `output/web-game-pickup-compare4` => pass (`errors-*.json` none)
  - `state-0..2.json` include:
    - `mode: "pickup_compare"`
    - `pause_mode: "pickup_compare"`
    - `inventory.pickup_compare` with `slot/dropped_power/equipped_power/delta/auto_timer`

### Note
- Playwright artifact is canvas-centric, so full-page modal visual proof is still pending.
- Gameplay state and controls now recover correctly; work resumed.

## Iteration Update (2026-02-10 21:38Z, pickup compare full-screen visibility + resolve test)
- User issue addressed: 比較中に「見えていない/止まった」と感じる問題の再発防止。

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Added `drawPickupCompareCanvasOverlay(dropped, hudScorePreview)`.
  - Draw path now renders full-screen compare panel on canvas when `pauseMode === "pickup_compare"`.
  - Panel includes:
    - slot + auto timer + score,
    - power delta,
    - current vs dropped stat lines,
    - explicit controls (`1/ENTER/TAP = PICK`, `2 = DISCARD`).
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_pickup_compare_resolve.json`
  - Added dedicated scenario to click `#pickupKeepBtn` and verify pause-to-running recovery.

### Validation
- Syntax:
  - `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck38` => pass (`errors-*.json` none)
- Compare visibility:
  - `output/web-game-pickup-compare5` => pass (`errors-*.json` none)
  - `state-7.json` includes `pause_mode:"pickup_compare"` + `inventory.pickup_compare` payload
  - `shot-7.png` clearly shows full-screen compare panel in-canvas.
- Compare resolve:
  - `output/web-game-pickup-compare-resolve1` => pass (`errors-*.json` none)
  - `state-5.json`: `pause_mode:"pickup_compare"`
  - `state-6.json`: `mode:"running", pause_mode:null` (selection後に復帰確認)

### Outcome
- 「比較で止まっているように見える」問題を、状態整合修正 + 画面内可視化で解消。
- 作業ループを継続可能な状態に復旧完了。

## Iteration Update (2026-02-11 09:00Z, Boss brush + stop-recurrence hardening)
- User request handled:
  - 「もっと面白さをブラッシュ、ボスや各要素を確認して実装」
  - 「止まってた理由を調べ修正して戻る」
- Progress: **92% (this cycle complete; boss phase3 balance pass remains)**.

### Root Cause (stop recurrence view)
- `pickup_compare` state is valid but visual continuity was still fragile when relying on `state.running` in canvas compare draw conditions.
- This caused moments where users perceived a freeze despite active pause state.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Boss redesign:
    - Added `MINIBOSS_PROFILES` and weighted roll (`DUELIST/JUGGERNAUT/HUNTER/WARLORD`).
    - Boss behavior now profile-driven for dash/slam/call cadence, slam spread, reinforce pressure, and touch multiplier.
    - HUD/objective/rendered boss data now expose profile role.
  - Reward loop:
    - Added `BOSS_BOONS` and `applyBossBoon()` on miniboss defeat.
    - Added run telemetry: `run.boss_boons { count, last }`.
  - Stop hardening:
    - `renderPickupCompareModal()` now logs and auto-recovers when payload is missing while paused.
    - Canvas compare overlay draw condition changed from `state.running && pickupPause` to `pickupPause` to guarantee visibility.
  - HUD clarity:
    - Added `BOON` count to compact/detailed HUD status lines.

### Validation
- Syntax:
  - `node --check game.js` => pass.
- Mandatory loop:
  - `output/web-game-uicheck43` => pass (`errors-*.json` none).
- Boss-focused validation:
  - `output/web-game-boss-brush7` => pass (`errors-*.json` none).
  - state confirms boss profile output:
    - `run.boss.profile: "warden"`
    - `run.boss.role: "DUELIST"`
- Compare-stop validation:
  - `output/web-game-pickup-compare-resolve6` => pass (`errors-*.json` none).
- Stress validation (legendary + compare):
  - `output/web-game-legendary26` => pass (`errors-*.json` none).
  - states `0,2,3,4,5` contain `pause_mode:"pickup_compare"` with populated `inventory.pickup_compare`.
  - screenshot `shot-2.png` confirms full-screen compare panel visible while paused.

### Evidence Snippets
- `output/web-game-boss-brush7/state-2.json`:
  - `run.boss.phase: 3`, `run.boss.profile: "warden"`, `run.boss.role: "DUELIST"`.
- `output/web-game-legendary26/state-2.json`:
  - `mode:"pickup_compare"`, `inventory.pickup_compare` payload present.
- `output/web-game-legendary26/shot-2.png`:
  - compare panel visibly rendered over active battle context.

### Next TODO
1. Add 30-60s boss survival scenario to observe `boss_boons.count` increase (actual boss defeat path).
2. Tune phase3 crowd + touch coefficients to keep danger high but reduce unavoidable wipe spikes.

## Iteration Update (2026-02-11 09:20Z, Phase3 unfair spike clamp)
- User direction continued: ボスと各要素のブラッシュ継続。
- Progress: **95% (remaining: long-run boss kill validation + boon pacing)**.

### Problem Found
- In boss-heavy runs, HP sometimes dropped to extreme negatives despite low `hits_taken`.
- Root cause was boss-origin damage spikes (especially slam/omega hazard) lacking per-hit upper cap against player max HP.

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - Boss arena density:
    - `updateWaveSpawner()` now applies phase-based enemy cap ratio while boss is alive:
      - P1: 42%
      - P2: 36%
      - P3: 30%
  - Boss contact damage clamp:
    - During boss fight, per-hit cap added:
      - boss touch: capped by phase-based max HP ratio
      - non-boss touch while boss alive: additional cap
  - Boss hazard damage clamp:
    - `updateBossHazards()` now caps damage by player max HP ratio:
      - OMEGA: up to 38%
      - normal SLAM: up to 28%
    - hazard hit cooldown/invuln slightly extended to avoid stacked burst.
  - Spawn scaling tweak:
    - miniboss base HP/DMG multipliers softened (`spawnMiniBoss`) to keep fights hard but not mathematically unwinnable.

### Validation
- Syntax:
  - `node --check game.js` => pass.
- Boss stress regression:
  - `output/web-game-boss-brush8` => pass (`errors-*.json` none).
  - `output/web-game-boss-brush9` exposed extreme negative HP symptom (`hp:-6808.8`) and confirmed spike source.
  - After clamp fix: `output/web-game-boss-brush10` => pass (`errors-*.json` none).
  - `boss-brush10/state-0..3.json` stayed in `running/pickup_compare` during sample window (no immediate wipe recurrence).

### Evidence
- Pre-fix spike:
  - `output/web-game-boss-brush9/state-2.json` => `hits_taken:4`, `hp:-6808.8`.
- Post-fix stability:
  - `output/web-game-boss-brush10/state-1..3.json` => no forced ended-state in sampled iterations.

### Next TODO (updated)
1. Add a dedicated long-run boss test action (30-60s) to verify first `Boss Boon` acquisition path (`run.boss_boons.count > 0`).
2. Tune boss HP pace so wave1 emergency boss can be pressured by skilled play but remains threatening.

## Iteration Update (2026-02-11 16:11Z, TikFinity webhook + live hook ingest)
- User direction handled:
  - 「配信前提のゲームとしてバイラル活用」
  - 「TikFinity webhook送信を使える形にする」
- Progress: **97% (remaining: long-run boss kill validation + phase3 A/B tuning)**.

### Code Changes
- UI:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
    - Added `LIVE HOOK` toggle button + status chip in control panel.
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/styles.css`
    - Added styles for `.stream-hook-status` (`on/off/error`) and compact row alignment.
- Game runtime:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
    - Added stream hook runtime state:
      - `state.streamHook` (`enabled/endpoint/cursor/failStreak/totalEvents/totalDiamonds/pendingCount/...`)
    - Added live ingestion pipeline:
      - `normalizeLiveEvent()`
      - `deriveLiveEventDiamonds()`
      - `ingestLiveGiftEvent()`
      - `pollStreamHookOnce()` with dedupe and cursor update
    - Added queue-based apply:
      - idle/pause受信時は `queuedLiveEvents` に保留
      - `running`中に `drainQueuedLiveGiftEvents()` で間引き適用
    - Refactored gift impact:
      - `applyGiftImpact()` に一本化し、Local Gift と Live Gift を共通化
    - Added telemetry:
      - `render_game_to_text` に `run.stream_hook` と `gift_event.source`
    - Added controls:
      - UI button + hotkey `L` for hook on/off
      - `window.injectTikfinityEvent(payload)` for manual injection
- Bridge + docs:
  - Added `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/tikfinity_webhook_bridge.mjs`
    - `POST /webhook/tikfinity`
    - `GET /events?since=&max=`
    - `GET /health`
    - event dedupe and normalized output
  - Added `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/TIKFINITY_WEBHOOK.md`
    - setup/run instructions and payload examples

### Validation
- Syntax:
  - `node --check game.js` => pass
  - `node --check scripts/tikfinity_webhook_bridge.mjs` => pass
- Mandatory loop:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir output/web-game-uicheck`
  - Result: pass, no `errors-*.json`.
- Bridge connectivity:
  - `curl -v --max-time 3 http://127.0.0.1:8091/health` => HTTP 200
  - test POST accepted:
    - gift / share / like / follow events accepted and listed by `/events`.
- Live hook gameplay:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_live_hook.json --iterations 4 --pause-ms 260 --screenshot-dir output/web-game-livehook1`
  - Result: pass, no `errors-*.json`.
  - `state-0..3.json` shows:
    - `run.stream_hook.enabled: true`
    - `run.stream_hook.total_events: 6`
    - `run.stream_hook.total_diamonds: 190`
    - `run.gift_event.source: "LIVE"`
    - queued progression via `pending_count`.

### Key Outcome
- TikFinity webhook前提の配信連動を、ゲーム本体を壊さず追加できた。
- LIVE受信が止まっても通常プレイは継続（hook OFF既定、fail streak可視化）。
- 進行不能の再発なしで作業ループへ復帰完了。


## Iteration Update (2026-02-11 16:36Z, Nunchaku physics + elastic rope pass)
- User request handled:
  - ヌンチャクを物理演算っぽく（紐の弾性が加速へ寄与）

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - `state.nunchaku` に弾性指標を追加:
    - `restLength`, `maxLength`, `tension`, `stretch`, `elasticBoost`, `anchorVx`, `anchorVy`
  - `updateNunchaku(dt)` を物理寄りへ更新:
    - rest長とmax長を分離（伸び許容量を導入）
    - radial spring + damping
    - アンカー（プレイヤー）加速度によるエネルギーポンプ
    - 遠心項 `v_t^2 / r` の外向き加速
    - スラック時の復元（ただし過拘束を避ける係数）
    - max長超過時の反力・min長内側侵入補正
    - 壁反射で速度喪失を伴う反発
  - チェーン描画を直線から曲線（quadratic）へ変更し、スラック時にたわむ見た目へ改善。
  - HUDに `TN:%`（テンション）を表示。
  - `render_game_to_text` の `nunchaku` に以下を追加:
    - `rest_length`, `max_length`, `tension`, `stretch`, `elastic_boost`

### Validation
- Syntax:
  - `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck47` => pass（`errors-*.json` none）
- Nunchaku swing:
  - `output/web-game-nunchaku-swing7` => pass（`errors-*.json` none）
  - 集計: `maxSpeed=69.66`, `maxTension=0.065`, `maxStretch=1.49`
- Nunchaku self-hit:
  - `output/web-game-nunchaku-selfhit8` => pass（`errors-*.json` none）
  - 集計: `maxSpeed=18.59`, `maxTension=0.196`, `maxStretch=4.30`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck47/shot-2.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-swing7/shot-4.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-selfhit8/shot-4.png`

### Outcome
- ヌンチャクが「位置追従」中心から「弾性で伸びて戻る」挙動へ改善。
- 伸びに応じたテンション値がstateへ反映され、速度と自己被弾リスクの連動が強化。
- 既存ループ回帰（クラッシュ/進行不能）なし。



## Iteration Update (2026-02-11 17:08Z, Remove direct weapon control)
- User request handled:
  - 武器を直接操作させない
  - 自機のみ操作し、紐物理で武器が釣られて動く挙動へ

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - `updateNunchaku(dt)` から以下を削除/置換:
    - 照準ベクトル追従トルク (`targetX/targetY` 依存)
    - ポインタ速度/位置からの武器直接加速
  - 追加:
    - 自機運動由来の慣性トルク
    - 小さなランダム揺らぎ（wobble）
    - 既存弾性（rest/max長、遠心、spring+damping）と統合

### Validation
- Syntax:
  - `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck48` => pass (`errors-*.json` none)
- Swing scenario:
  - `output/web-game-nunchaku-swing8` => pass (`errors-*.json` none)
  - 集計: `maxSpeed=185.49`, `maxTension=0.411`, `maxStretch=8.93`, `maxCombo=13.65`
- Self-hit scenario:
  - `output/web-game-nunchaku-selfhit9` => pass (`errors-*.json` none)
  - 集計: `maxTension=0.108`, `maxStretch=2.64`, `maxHits=1`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck48/shot-2.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-swing8/shot-4.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-selfhit9/shot-4.png`

### Outcome
- 武器は直接狙えず、自機の加減速と向き変化に対して遅れて振られる挙動へ移行。
- ランダム揺らぎ込みで「思い通りになりすぎない」ヌンチャク感を強化。



## Iteration Update (2026-02-11 17:16Z, Simplify nunchaku to rubber-link model)
- User request handled:
  - 動きが不自然 -> シンプルに再設計
  - 「たまにゴムで繋がる」挙動
  - 回転抵抗は不要

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - `updateNunchaku(dt)` を簡素化:
    - 残す: 自機移動入力、紐バネ、遠心、軽いジッター
    - 削除: 武器の直接狙い補助、複雑な回転抵抗系
  - 追加:
    - `rubberTimer`, `rubberCd`, `rubberMul`
    - 低確率でゴムモード発火（短時間だけ `restLength` を伸ばす）
  - `render_game_to_text` に `nunchaku.rubber_timer`, `rubber_on` を追加

### Validation
- `node --check game.js` => pass
- `output/web-game-uicheck49` => pass (`errors-*.json` none)
- `output/web-game-nunchaku-swing9` => pass (`errors-*.json` none)
  - `maxSpeed=367.84`, `maxTension=0.966`, `maxStretch=32.29`, `maxRubberTimer=0.36`
- `output/web-game-nunchaku-selfhit10` => pass (`errors-*.json` none)
  - `maxSpeed=256.19`, `maxTension=0.819`, `maxStretch=27.43`, `maxRubberTimer=0.32`

### Outcome
- 武器は直接操作されず、プレイヤー移動に引かれて暴れる挙動に統一。
- たまにゴム化して伸びるピークが出るため、ランダムさが増加。



## Iteration Update (2026-02-12 03:59Z, Boss/Gift root-cause fix)
- Blocker root cause:
  - `triggerGift(amount, cost)` が `applyGiftImpact(diamonds, cost, ...)` になっており、ギフト額ではなくクレジット消費値がtier扱いされて敵強化が過剰化していた。
- Code changes:
  - File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
    - `triggerGift` で `deriveGiftTierFromDiamonds(diamonds, "gift")` を使うよう修正。
    - `applyGiftImpact` に `pressureTier` を導入し、spawn/reinforce/frenzy係数を再調整。
    - `render_game_to_text` の `run` に `kills_total`, `gift_value` を追加（長尺判定用）。
    - 敵基礎式（`nightmareHpMul/nightmareDmgMul/hpBase/damageBase`）を再スケーリング。
    - 緊急ボスゲートを `wave>=2` 固定から `wave1でも time>=34s && kills>=6` で解放に変更。
    - ヌンチャクの対ボスダメージ補正を限定追加（`enemy.miniBoss` 時のみ）。
    - ボス周りを追加調整（spawn時のHP/damage/speed、call/slam係数、boss touch cap、phase enemy cap）。
    - ヌンチャク挙動をさらに単純化（加速度ポンプ/遠心補助を削り、紐バネ+牽引+軽ジッターへ）。

### Validation
- Syntax:
  - `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck56` => pass (`errors-*.json` none)
- Boss longrun (safe):
  - `output/web-game-boss-longrun-safe4` => pass (`errors-*.json` none)
  - 集計:
    - `states=14`, `maxWave=2`, `maxKills=17`, `bossSeen=4`
    - `maxBossPhase=1`, `maxBoon=1`, `ended=0`
    - `maxTension=0.978`, `maxThreat=81`
- Boss brush (gift-heavy):
  - `output/web-game-boss-brush11` => pass (`errors-*.json` none)
  - 集計:
    - `states=10`, `maxGift=214`, `bossSeen=5`, `maxBossPhase=1`
    - `ended=0`, `pickupPause=6`（比較UI動作による一時停止）
- Nunchaku swing:
  - `output/web-game-nunchaku-swing12` => pass (`errors-*.json` none)
  - `maxSpeed=173.34`, `maxTension=0.677`, `maxStretch=52.90`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck56/shot-2.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-boss-longrun-safe4/shot-6.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-boss-longrun-safe4/shot-13.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-boss-brush11/shot-9.png`

### Outcome
- 進行不能の直接要因（過剰強化）を除去し、長尺テストでボス報酬 `boss_boons.count=1` 到達を確認。
- ヌンチャクは「自機のみ操作 + 紐バネ + 時々ゴム」の挙動へさらに収束し、不自然な補助挙動を削減。
- 残課題は phase3 専用シナリオの最終A/B（phase3時の雑魚密度/接触係数）確認。

### Note
- `boss-brush12`（20iteration）はPlaywrightが無限待機になるケースを確認。
- 以後の標準検証は 14iteration 以下に分割し、`safe4` / `brush11` の証跡を採用。


## Iteration Update (2026-02-12 08:15Z, Rubber auto-retract off + higher viscosity)
- User request handled:
  - 「ゴムが自動で収縮してるのをやめる」
  - 「もう少し粘度高め」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - `updateNunchaku(dt)` の `restLength` 自動補間を撤去。
    - 変更前: `n.restLength += (desiredLength - n.restLength) * ...`
    - 変更後: `restLength` は自動で縮めず、`desiredLength` 未満のみ底上げ。
  - ゴム発火時の挙動を「一時倍率」から「restLength 自体を拡張」に変更。
    - `n.restLength = clamp(n.restLength * rand(...), desiredLength, desiredLength * 1.95)`
    - `activeRest` は `n.restLength` を直接使用。
  - 粘度調整:
    - `radialDamping` を強化。
    - 相対速度ベースの粘性減衰 `n.v -= relV * viscousDamping * dt` を追加。
    - 速度dragを強め、ジッターを弱めて挙動を重めに調整。

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir output/web-game-uicheck`
  - pass (`errors-*.json` none)
- State check:
  - `output/web-game-uicheck/state-2.json`:
    - `mode: "running"`
    - `nunchaku.rest_length: 153.07`
    - `nunchaku.tension: 0`
    - `nunchaku.stretch: -22.29`
    - `nunchaku.rubber_on: true`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-2.png`

### Outcome
- 自動収縮感を除去し、武器頭が勝手に短く戻る挙動を抑制。
- 挙動は重め（高粘度）になり、プレイヤーの移動に対して遅れて追随するヌンチャク感を強化。


## Iteration Update (2026-02-12 09:59Z, Anti-angle-lock + shorter rope)
- User feedback handled:
  - 「硬すぎる」
  - 「同じ角度のままになる」
  - 「紐も長すぎる」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - 紐の基準長を短縮:
    - `resetNunchakuToPlayer()` と `updateNunchaku()` の `desiredLength` 式を圧縮。
  - ゴム伸長上限を抑制:
    - `restLength` の伸長倍率と上限を小さく変更（過伸長を防止）。
  - 同角度固定化の抑制:
    - 全方向の重い粘性をやめ、接線方向中心の減衰へ再配分。
    - 自機加速度差 (`anchorAx/anchorAy`) から接線トルクを加えて、向き変化時に自然に振れるよう調整。
  - 速度/バネ係数を再調整:
    - `springK` と `radialDamping` を緩和、dragを見直し。

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck` => pass (`errors-*.json` none)
- Swing loop:
  - `output/web-game-nunchaku-swing` => pass (`errors-*.json` none)
  - 集計:
    - `angle_span_deg: 291.1`
    - `len_min: 67.5`
    - `len_max: 93.1`
    - `max_speed: 99.5`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-2.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-swing/shot-2.png`

### Outcome
- 紐長の過大感を抑制し、プレイヤー近傍で振り回す手触りへ寄せた。
- 角度固定化を緩和し、向き変更時にヌンチャク頭が流れて回り込む挙動へ改善。


## Iteration Update (2026-02-12 10:20Z, Spin-stretch for damage sustain)
- User feedback handled:
  - 「攻撃力維持には体の周りをくるくるしたい」
  - 「紐の伸縮が少ないと回転しない」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - `updateNunchaku(dt)` に回転時伸長を追加:
    - `tangentialV`（接線速度）から `spinStretch` を算出。
    - `activeRest = baseRest + spinStretch` として、回転中のみ紐が伸びるよう変更。
    - `maxLength` も `activeRest` 連動で拡張。
  - 回転維持のための接線キャリーを追加:
    - 自機速度の接線成分をヌンチャク速度へ反映。
  - 伸長上限を再調整:
    - ゴム発火時の `restLength` 上限を `desiredLength * 1.36` へ更新（普段は短め、回転時は動的伸長）。
  - 接線減衰を緩和:
    - 周回維持しやすいよう `tangentialDamping` を下げた。

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck` => pass (`errors-*.json` none)
- Swing loop:
  - `output/web-game-nunchaku-swing` => pass (`errors-*.json` none)
- Long swing loop:
  - `output/web-game-nunchaku-swing-long` => pass (`errors-*.json` none)
  - 集計:
    - `angle_span_deg: 336.1`
    - `len_min: 73.4`
    - `len_max: 128.5`
    - `len_span: 55.2`
    - `max_speed: 203.2`
    - `max_tension: 0.847`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-2.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-swing/shot-2.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-swing-long/shot-6.png`

### Outcome
- 普段は短めの紐感を維持しつつ、回転を作ると自動で伸びて周回を維持しやすくなった。
- 「くるくる回して速度×ダメージを稼ぐ」プレイ意図に合う挙動へ寄せた。


## Iteration Update (2026-02-12 10:45Z, Magnetic pull + stretch limit control)
- User feedback handled:
  - 「紐に当たり判定はいらない」
  - 「磁気で引っ張って加速できるのが基本」
  - 「紐の伸びる限界は指定したい」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - 紐の内側拘束を削除:
    - `minLength` 判定分岐（内側へ入ると押し戻す処理）を撤去。
    - 紐そのものの当たり判定的な拘束を減らし、自機接触の成立を妨げない構造へ。
  - 磁気牽引ベースへ変更:
    - `magneticPull` を追加して、武器頭を自機側へ引く加速を実装。
    - 接線方向には `yank` と `lateralCarry` を残し、回転加速を維持。
    - `activeRest` は `spinStretch + magneticStretch` で動的決定。
  - 伸び上限を指定可能化:
    - `state.nunchaku.stretchLimit` を追加（初期値 54）。
    - `maxLength = baseRest + stretchLimit` として上限を明示化。
    - HUDに `SL` 表示を追加。
    - `render_game_to_text` に `nunchaku.stretch_limit` を追加。
    - API追加: `window.set_nunchaku_stretch_limit(value)`（18〜180にクランプ）。

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck` => pass (`errors-*.json` none)
- Swing loop:
  - `output/web-game-nunchaku-swing` => pass (`errors-*.json` none)
  - 集計:
    - `max_speed: 107.01`
    - `max_stretch: 20.42`
    - `stretch_limit: 70.46`
- Self-hit loop:
  - `output/web-game-nunchaku-selfhit` => pass (`errors-*.json` none)
  - 集計:
    - `max_hits_taken: 1`
    - `min_dist: 65.01`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-selfhit/shot-3.png`
  - HUDに `SL:70` 表示を確認。

### Outcome
- 紐拘束を薄くしつつ、磁気牽引で加速する操作感へ寄せた。
- 伸び限界をプレイ中デバッグで指定可能にしたため、以後の調整サイクルが高速化。


## Iteration Update (2026-02-12 11:10Z, No lower-bound repel + no weapon friction/cap)
- User feedback handled:
  - 「自機に反発する力か長さの下限があるなら無くす」
  - 「武器速度上限や摩擦はなし」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - 反発/下限の除去:
    - バネ力を `pull-only` に変更。
      - 変更前: `springForce = -stretch * springK - ...`
      - 変更後: `springForce = -max(0, stretch) * springK`
    - これにより、内側で押し戻す力（実質的下限反発）を発生させない。
  - 武器摩擦・速度制限の除去:
    - 接線減衰（`tangentialDamping`）を削除。
    - `drag` 乗算を削除。
    - 敵ヒット時の武器反動上限 `Math.min(220, ...)` を削除。
    - 自己ヒット時の減衰反転 `*-0.48` を `*-1` へ変更。
    - 壁反射係数 `-0.42` を `-1` へ変更。
  - 既存 `stretchLimit` 指定機能は維持。

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck` => pass (`errors-*.json` none)
- Self-hit loop:
  - `output/web-game-nunchaku-selfhit` => pass (`errors-*.json` none)
  - 集計:
    - `min_dist: 42.19`
    - `max_hits_taken: 6`
    - `max_speed: 267.23`
    - `max_self_hit_cd: 0.07`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-selfhit/shot-3.png`
  - `SW:157` と `SL:66` を確認。

### Outcome
- 自機側への押し戻し感を抑え、引力主体の挙動へ移行。
- 武器速度の減衰を外したことで、回し続けたときの速度維持が強化された。


## Iteration Update (2026-02-12 11:26Z, Self-damage formula unified with weapon damage)
- User feedback handled:
  - 「自爆ダメージはちゃんと火力と一緒でいい」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - `updateNunchaku(dt)` の自己被弾計算を変更:
    - 変更前:
      - `selfImpact * (0.032 + p.baseDamage * 0.0016)`
    - 変更後:
      - `rawSelfDamage = computeSwingImpactDamage(selfImpactSpeed)`
      - `selfDamage = rawSelfDamage * (1 - guard)`
  - しきい値も敵ヒット側と整合:
    - `selfImpactSpeed >= 46` を採用。

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `output/web-game-uicheck` => pass (`errors-*.json` none)
- Self-hit loop:
  - `output/web-game-nunchaku-selfhit` => pass (`errors-*.json` none)
  - `state-0.json`:
    - `mode: ended`
    - `player.hp: -1071.6`
    - `run.hits_taken: 1`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-selfhit/shot-0.png`
  - `SELF 1244` のフロートを確認。

### Outcome
- 敵へ当てた時と同じ火力スケールで自爆ダメージが入るようになり、リスク/リターンの体感が一致した。


## Iteration Update (2026-02-12 12:47Z, Player HP scaled to enemy class)
- User feedback handled:
  - 「自分の体力のスケールも的と同等クラスにしよう」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - プレイヤーHPクラス倍率を追加:
    - `PLAYER_HP_CLASS_MUL = 8`
    - `scalePlayerHpBase(value)`
    - `scalePlayerHpDelta(value)`
  - 反映対象を統一:
    - 初期値: `createState()` の `player.hp/maxHp`
    - ビルド適用: `applyBuildToPlayer()`
    - 装備HP差分: `applyEquipmentBonuses()`
    - レベル成長/回復: `gainXp()`
    - 契約報酬回復: `completeObjective()` (`pickup_chain`)
    - Boon/変異/スキル: `hardskin`, `fracture`, `bastion`, `vital`
    - レジェンド回復: `applyDrop()` の `legendary` 分岐

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir output/web-game-uicheck`
  - 結果: pass (`errors-*.json` none)
- `output/web-game-uicheck/state-0..2.json`:
  - `player.max_hp: 1376`
  - `player.hp: 817.9 -> 319.2 -> 19.5`
  - `mode: running` 継続

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-0.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-1.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-2.png`

### Outcome
- プレイヤー耐久が敵スケールに近づき、ヌンチャク自爆の高リスクを維持しつつ即死頻度を抑えた。
- HP関連の全経路を同倍率で統一したため、今後のバランス調整で成長カーブが崩れにくくなった。


## Iteration Update (2026-02-12 13:22Z, No wall reflection + on-hit projectile affix)
- User feedback handled:
  - 「壁反射はきついな、なしで」
  - 「アフィックスに、ヒット時に弾を飛ばすとか追加したい」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - 壁反射を無効化:
    - `updateNunchaku(dt)` 内の壁反射反転
      - `if (n.x <= 4 || n.x >= W - 4) n.vx *= -1;`
      - `if (n.y <= 4 || n.y >= H - 4) n.vy *= -1;`
    - を削除し、境界はクランプのみへ変更。
  - 新規Affixを追加:
    - `Shrapnel` (`stat: hitShotChance`, UI表記 `PROC%`)
    - 武器ランダムAffixに追加。
    - レジェンダリーAffix `Shard Tempest` 追加（on-hit弾発射率を大幅上昇）。
  - 追撃弾システムを追加:
    - `spawnProcShot(...)` で追撃弾を生成。
    - `updateProcShots(dt)` で弾の移動/命中/ダメージ処理。
    - 描画ループに弾とトレイルを追加。
    - `render_game_to_text` に `run.projectile_count` を追加。
  - 装備UI/比較表示にも反映:
    - `renderAffixList` のセット要約に `PROC+xx%` を表示。
    - `formatCompareStatLabel` に `PROC%` ラベルを追加。
    - `formatItemStat` / `computeItemPower` / bonus template に `hitShotChance` を統合。

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir output/web-game-uicheck`
  - 結果: pass (`errors-*.json` none)
- Additional loop:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_nunchaku_swing.json --click-selector '#startBtn' --iterations 4 --pause-ms 260 --screenshot-dir output/web-game-nunchaku-swing`
  - 結果: pass (`errors-*.json` none)
- State check:
  - `output/web-game-uicheck/state-0..2.json`: `mode: running`, `player.max_hp: 1533`, `run.projectile_count: 0`
  - `output/web-game-nunchaku-swing/state-0..3.json`: `mode: running/ended`, `run.projectile_count: 0`（Affix未ロール時の正常挙動）

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-0.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-1.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-2.png`

### Outcome
- 壁際でヌンチャクが反転して挙動を崩す現象を除去した。
- 新Affix種別（On-hit弾）が装備厳選軸として追加され、武器の当たり方に応じて追加ヒットを狙える設計になった。


## Iteration Update (2026-02-12 13:57Z, Inventory removed: drop -> equip/discard only)
- User feedback handled:
  - 「インベントリ機能自体廃止していい」
  - 「アイテムを拾ったら装備か捨てるか」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - 在庫保存を無効化:
    - `initializeLoadoutState()` で `state.itemInventory=[]` を固定。
    - `startRun()` でも `itemInventory` の持ち越しを停止。
  - 拾得フローを2択へ統一:
    - `queuePickupItem()` と `pendingPickupQueue` を追加。
    - `addItemToInventory()` は在庫追加せず、比較モーダルへ直送。
    - `resolvePickupChoice()` は Keep時に `equipItemDirect()` で即装備、Discardは破棄。
    - 比較中の連続ドロップはキューで順番処理。
  - 既存在庫操作は無効化:
    - `getSelectedInventoryItem()` は常に `null`。
    - `equipItemById`/`salvageItemById`/`unequipSlot` は無効メッセージに変更。
    - Occultist Extract は「選択中の装備スロット」対象に変更（抽出時に装備消費）。
  - ドロップ処理:
    - `applyDrop()` の item/legendary/fallback すべて比較フロー経由に統一。

- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - 文言更新:
    - `Select equipped gear`
    - `Inventory disabled. Drops are Equip/Discard only.`
    - `Drop -> Equip/Discard only. Tap slot to target craft.`

### Validation
- `node --check game.js` => pass
- Mandatory loop:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir output/web-game-uicheck`
  - 結果: pass (`errors-*.json` none)
- Additional drop-pressure check:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_legendary_showcase.json --click-selector '#startBtn' --iterations 4 --pause-ms 260 --screenshot-dir output/web-game-legendary`
  - 結果: pass (`errors-*.json` none)
- State check:
  - `output/web-game-uicheck/state-0..2.json`: `inventory.count: 0`
  - `output/web-game-legendary/state-0..3.json`: `pause_mode: pickup_compare`, `inventory.count: 0` 維持

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-0.png`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-legendary/shot-2.png`

### Outcome
- インベントリ管理を排除し、ドロップ判断を「装備/破棄」に一本化できた。
- 連続ドロップ時も比較モーダルがキュー処理され、進行不能なく裁ける構成になった。


## Iteration Update (2026-02-12 14:45Z, 1-bit retro visual pass + imagegen bridge)
- User feedback handled:
  - 「画像生成を活用してリッチにしていこう」
  - 添付トンマナ（白黒1-bitピクセル）準拠

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - レトロ描画層を追加:
    - `RETRO_ASSET_PATHS` / `createRetroAssets` / `createRetroImageAsset`
    - `drawRetroBackdrop`（クラウド/遠景/前景のタイル描画）
    - `drawRetroPanel`（HUD/比較/アラートを統一）
    - `drawRetroTiledStrip`, `drawRetroCloudFallback`, `drawRetroLandFallback`
  - 描画更新:
    - 背景グラデを暗めモノクロ寄りへ変更
    - `draw()` で `drawRetroBackdrop()` を追加
    - `drawGrid()` の線色を低彩度へ変更
    - HUD / Boss HUD / Alertカード / Pickup Compare / Run end overlay をレトロパネル化
    - Canvasテキストを主要箇所で `monospace` 化
  - `ctx.imageSmoothingEnabled=false` を有効化（ピクセル感維持）

- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - タイトルを `1-Bit Nunchaku Survivors` に変更
  - 画面タイトル文言を `1-BIT NUNCHAKU SURVIVORS` へ更新

- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/styles.css`
  - 全体カラーパレットをモノクロ寄りへ調整
  - ベースフォントを `Courier New/Menlo/Consolas` へ変更
  - Canvas/Panelの枠色・背景色をレトロ向けに再調整

- New Assets:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/assets/retro/clouds-strip.svg`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/assets/retro/land-far.svg`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/assets/retro/land-near.svg`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/assets/retro/panel-pattern.svg`

- New Script (imagegen bridge):
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/generate_retro_assets_with_imagegen.sh`
  - `OPENAI_API_KEY` 設定後に imagegen CLI で同系統アセット（clouds/far/near/panel）を `assets/retro/generated/` に生成する。

### Validation
- `node --check game.js` => pass
- Mandatory loop (required by project rule):
  - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck`
  - 結果: pass (`errors-*.json` none)
- Additional style/regression checks:
  - `... --screenshot-dir output/web-game-uicheck-imagegen1` => pass
  - `...test_actions_legendary_showcase.json --iterations 4 --screenshot-dir output/web-game-legendary-imagegen1` => pass
  - `errors-*.json` なし

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck-imagegen1/shot-0.png`
  - 白黒ピクセル雲帯・地形帯が背景に表示されることを確認。
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-legendary-imagegen1/shot-0.png`
  - レジェンダリー帯＋比較モーダル重なりで可読性維持を確認。
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-2.png`
  - 必須ループ結果でも同トンマナが維持されることを確認。

### Environment Note
- imagegen実API呼び出しの前提:
  - `OPENAI_API_KEY` が必要。
- 現環境確認:
  - `OPENAI_API_KEY` は未設定（dry-runのみ成功）。
  - そのため本サイクルは「トンマナ適用 + 生成導線構築」まで完了。

### Outcome
- 添付参照に近い1-bitレトロ基調へ、ゲーム画面の背景/パネル/UIを段階的に移行できた。
- APIキー投入後は `scripts/generate_retro_assets_with_imagegen.sh` 実行だけでAI生成素材へ差し替え可能。


## Iteration Update (2026-02-13 01:12Z, Drop rate / rarity heavy nerf)
- User feedback handled:
  - 「アイテムドロップ10分の1でいい」
  - 「レアとかももっと下げていい」
  - 「どんどん下げてくれ」

### Code Changes
- File: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - グローバル係数を追加:
    - `ITEM_DROP_RATE_MULT = 0.1`
    - `HIGH_RARITY_RATE_MULT = 0.08`
    - `LEGENDARY_RATE_MULT = 0.06`
  - レアリティ抽選を大幅低下:
    - `rollRarity()` の閾値を縮小
      - legendary: `0.008 + bias*0.5` -> `0.0008 + bias*0.05`
      - rare: `0.12 + bias*0.34` -> `0.02 + bias*0.06`
      - magic: `0.46 + bias*0.16` -> `0.18 + bias*0.08`
  - レジェンダリーAffix率を低下:
    - `rollLegendaryAffixChance()` を `base*0.22 + bias(上限0.02)` へ変更。
  - レジェンダリードロップ判定を低下:
    - `legendaryChance()` の base / bonus / pity を全体的に圧縮。
    - 上限 `0.94` -> `0.22`。
    - 装備由来 `legendaryChance` も `*0.22` で反映。
  - 強制レジェ条件をさらに遅延:
    - `shouldForceLegendary()` を `eliteSinceLegendary>=26 || timeSinceLegendary>=220` へ変更（旧 7 / 85）。
  - 敵死亡時ドロップを低下:
    - `onEnemyDeath()` の通常ドロップ率を係数反映で約1/10へ低下。
    - elite/miniboss追加rareの発生率も低下。
  - ギフトイベントの高レア雨を低下:
    - `applyGiftImpact()` の treasure rain を `2 + tier*2` -> `1 + tier*0.35` 相当へ圧縮。
    - ギフト中の追加rare / legendary発生率を係数反映で低下。
  - 受け取り報酬を低下:
    - `applyDrop(kind=legendary)` の追加 `rare` 配布を削除。
  - 契約報酬（crit_chain）を低下:
    - legendary分岐 `46%` -> `8%`
    - それ以外も `item_rare` 固定から `rare/magic/item` 低密度化へ変更。

### Validation
- `node --check game.js` => pass
- Mandatory loop (required):
  - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck`
  - 結果: pass (`errors-*.json` none)
  - `state-0..2.json`: `run.drops_on_ground: 0`
- Additional high-pressure check:
  - `...test_actions_legendary_showcase.json --iterations 4 --screenshot-dir output/web-game-legendary-dropnerf1`
  - 結果: pass (`errors-*.json` none)
  - `state-0..3.json`: `drops_on_ground: 2`、`legendary_on_ground:false`

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-legendary-dropnerf1/shot-0.png`
  - 高圧シーンでも比較モーダル中のドロップ密度が過剰化しないことを確認。

### Outcome
- ドロップ総量を強く抑え、視認性と判断速度を優先したテンポへ変更した。
- 高レアの雪だるま増加を抑えるため、通常/ギフト/契約/報酬の全経路で同時に下方調整した。


## Iteration Update (2026-02-12 17:16Z, Always-latest web sharing setup)
- User feedback handled:
  - 「常に最新版をwebで触れるように」
  - 「知り合いに見せたい」

### Code Changes
- New file:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/.github/workflows/deploy-pages.yml`
  - `main` push / manual dispatch で GitHub Pages へ自動デプロイ。
  - 配信対象は `dist/web` artifact。

- New file:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/scripts/build_web_dist.sh`
  - 公開対象を `index.html / styles.css / game.js / assets` のみに絞って `dist/web` 生成。

- New file:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/DEPLOY_GITHUB_PAGES.md`
  - 初回公開手順（remote設定、push、Pages確認）と運用手順を記載。

### Validation
- `bash scripts/build_web_dist.sh` => pass
  - `dist/web` 出力確認（`index.html`, `styles.css`, `game.js`, `assets/`）
- `node --check game.js` => pass
- Mandatory loop (required):
  - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck`
  - 結果: pass (`errors-*.json` none)
  - `state-0..2.json`: `drops_on_ground:0`（前サイクルのドロップ抑制が維持）

### Outcome
- `main` に push するだけで公開URLが自動更新される運用基盤を追加した。
- 配布向けに必要最小の公開物だけを出す構成なので、知り合い共有用のURL運用が安定して行える。


## Iteration Update (2026-02-12 17:48Z, Repository link + first push completed)
- User feedback handled:
  - `https://github.com/137yugi/TRYGNU.git` への接続・公開準備

### Execution
- Remote設定:
  - `origin` を `git@github-3dtest:137yugi/TRYGNU.git` に設定
- Commit:
  - `feat: launch nunchaku survivors + auto pages deploy`
  - root commit `493b2e3`
- Push:
  - `git push -u origin master:main` 成功

### Verification
- GitHub Actions API確認:
  - workflow: `Deploy Web Game to GitHub Pages`
  - status: `completed`
  - conclusion: `success`
  - run: `https://github.com/137yugi/TRYGNU/actions/runs/21957853746`

### Note
- `https://api.github.com/repos/137yugi/TRYGNU/pages` は現時点 `404`。
- GitHub側で `Settings > Pages > Source: GitHub Actions` の有効化確認後、同workflowを再実行または次回pushで公開URLが確定する。

## Iteration Update (2026-02-12 19:25Z, 日本語UI + メニュー用語集)
- User feedback handled:
  - 「日本語にして欲しい、日本人を対象」
  - 「用語はリストと説明を作ってほしい」
  - 「メニューから表示したい」

### Code Changes
- Updated: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/index.html`
  - 主要UIラベルを日本語化（ステータス、装備、ログ、ランキング、モーダル文言）。
  - `メニュー` ボタンを追加。
  - 新規モーダルを追加:
    - `#menuModal`（メニュー）
    - `#glossaryModal`（用語集）
- Updated: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/styles.css`
  - 日本語フォント優先のフォントスタックへ変更。
  - メニュー/用語集UIスタイル (`.menu-card`, `.glossary-card`, `.glossary-list`, `.glossary-item`) を追加。
- Updated: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/game.js`
  - HUD、開始ボタン、比較モーダル、ラン終了オーバーレイ、イベントカード、ログ、フロートテキストを日本語寄りに更新。
  - `GLOSSARY_TERMS` を追加（用語 + 説明）。
  - メニュー/用語集の開閉処理を追加（`openMenuModal/openGlossaryModal` など）。
  - キーバインド追加: `M` でメニュー開閉。
  - 用語集開閉状態を `render_game_to_text` に追加:
    - `run.ui_panels.menu_open`
    - `run.ui_panels.glossary_open`
- New action files:
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_menu_glossary.json`
  - `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_menu_glossary_visual.json`

### Validation
- `node --check game.js` => pass
- Mandatory loop (required):
  - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck`
  - 結果: pass (`errors-*.json` none)
- Menu/Glossary flow check:
  - `... --actions-file test_actions_menu_glossary_visual.json --screenshot-dir output/web-game-menu-glossary-visual2`
  - 結果: pass (`errors-*.json` none)
  - state確認:
    - `state-0.json`: `run.ui_panels.menu_open:true`
    - `state-1.json`: `run.ui_panels.glossary_open:true`
    - `state-2.json`: 両方 `false`（閉じる挙動確認）

### Visual Check
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck/shot-2.png`
  - 失敗オーバーレイが日本語化（「ラン失敗」「再挑戦」）されていることを確認。
- `menu/glossary` はキャンバス外DOM要素のため、今回の標準スクショ（canvas切り抜き）では表示されない。`run.ui_panels` telemetryで開閉を検証。

### Outcome
- ゲーム内主要文言を日本語化し、日本人向けの初見理解を改善。
- メニュー経由で開ける用語集（用語+説明）を実装し、配信中の説明導線を追加。
