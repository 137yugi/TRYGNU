---
name: exec-plan-web-game-loop
description: Use when running long autonomous iterations for this project with Codex Exec Plans. Trigger when user asks to continue repeatedly (e.g., "go", "続けて", "終わるまで"), and the workflow should read .agent/PLANS.md, execute one backlog slice, run Playwright validation, inspect screenshots, and update progress.md plus plan state every loop.
---

# Exec Plan Web Game Loop

Run this loop for each iteration:

1. Read `/.agent/PLANS.md`.
2. Read `/progress.md`.
3. Pick top unchecked task from `Backlog` (P0 first).
4. Implement the smallest useful change.
5. Run validation:
   - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir output/web-game-uicheck`
6. Inspect latest screenshots in `output/web-game-uicheck/`.
7. Fix the first new error if `errors-*.json` exists.
8. Append concrete notes to `/progress.md`.
9. Update `/.agent/PLANS.md` task checkboxes and notes.

Stop only when:

- `/.agent/PLANS.md` is `Status: DONE`, or
- a true blocker is recorded in `Blockers`.
