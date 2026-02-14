# Diablo-like Web H&S: Continuous ExecPlan Loop (Compact)

This is a compact context version for autonomous iterations. Full history is archived at `.agent/PLANS.full.md`.

Status: IN_PROGRESS
Owner: Codex
Last Updated: 2026-02-14
Overall Progress: 72% (既存検証サイクル完了後に、ギフト岩壁イベントを再開発中)

## Purpose / Big Picture
高密度配信向けの2Dハクスラ実装を継続し、Playwrightループで品質確認しながら進行不能・過密UI・不自然な即死を抑える。

## Progress
- [x] 2026-02-12: ボス/phase3の敵圧や被ダメージ上限を再設計、長尺検証戦略を分割化。
- [x] 2026-02-12: 長距離配信・公開基盤（GitHub Pages）を整備。
- [x] 2026-02-12: 日本語UI / メニュー / 用語集 / HUDコンパクト化を導入。
- [x] 2026-02-13: ドロップ率・レア率・レジェ率を全経路で大幅に低下。
- [x] 2026-02-14: ゲーム画面表示を「ゲーム画面＋メニュー」構成へ簡素化し、インベントリ/ルーンUIをゲーム外表示から除外。
- [x] 2026-02-14: `index.html`から未使用側UI（ヒント/ドロップ/ログ/ランキング）を除去し、参照側ガードを追加。
- [x] 2026-02-14: `ui_audit_2026-02-14.md` を更新し、非表示UI・画面別掲載可否・機能一覧を確定。
- [x] 2026-02-14: phase3専用シナリオ（A/B比較）を再検証し、`boss_phase3=A` を最終採用。
- [x] 2026-02-14: レベルアップ・装備比較の停止UIをゲーム進行中でも止まらない右下オーバーレイ化（時間制限付き）。

## Context and Orientation
- 主要ファイル: `/index.html`, `/styles.css`, `/game.js`, `/web_game_playwright_client.mjs`
- 検証入力: `/test_actions_skill_loop.json`, `/test_actions_boss_longrun_safe.json`, `/test_actions_occultist.json`
- 記録: `progress.md`（最新要約）

## Plan of Work
- [x] `applyGiftImpact` に新規イベント「岩壁封鎖」を追加し、`spawnGiftWallBundle` と `setGiftEvent` / `log` / フェードを接続。
- [x] HUD 表示と `renderGameToText` に岩壁数・岩壁情報を反映。
- [x] レベルアップ/装備比較のオーバーレイ表示を短時間タイマー化し、`pause` 状態でも進行が継続するように更新。
- [ ] `web_game_playwright_client.mjs` の mandatory 3iter ループを再実行し、`errors-*.json` と生成スクショで最小検証。

## Concrete Steps
1) サーバ起動: `python3 -m http.server 8081`
2) 必須検証:
   - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck`
   - `node ... --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_boss_longrun_safe.json --click-selector '#startBtn' --iterations 14 --pause-ms 280 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-boss-longrun-safeN`
3) `output/web-game-*` の `state-*.json` と `errors-*.json` を確認し、最初の新規エラーだけを追跡。

## Validation and Acceptance
1) HUD可読性が崩れず、演出/重要情報が競合しない。
2) `SW` / `SELF` / `swing_combo` / `run.progress_pct` が観測できる。
3) `errors-*.json` が新規生成されない。
4) `boss` phase3で `maxBossPhase:3` と `ended` 率が許容範囲。

## Artifacts and Notes
- 最新証跡:
  - `output/web-game-uicheck`
  - `output/web-game-phase3-resume-A1`
  - `output/web-game-phase3-resume-B1`
  - `output/web-game-phase3-resume-debug-A1`
  - `output/web-game-phase3-resume-debug-B1`
- 重要判断資料: 完全履歴は `.agent/PLANS.full.md` を参照。

## Note for context limits
今回からこの `PLANS.md` は要約版で運用。長文履歴は `PLANS.full.md` に保持し、必要時のみ参照する。
