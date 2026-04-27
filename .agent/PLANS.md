# Diablo-like Web H&S: Continuous ExecPlan Loop (Compact)

This is a compact context version for autonomous iterations. Full history is archived at `.agent/PLANS.full.md`.

Status: COMPLETED
Owner: Codex
Last Updated: 2026-04-27
Overall Progress: OVERDRIVE rebuild, wave-reward adjustment, Diablo-like equipment, rich level-up skills, Docs/Product alignment, and target-workspace verification pass completed.

## Purpose / Big Picture

高密度配信向けの2Dハクスラ実装を継続し、Playwrightループで品質確認しながら進行不能・過密UI・不自然な即死を抑える。現行版は Phaser + TypeScript + Vite の `1ビット・ヌンチャクサバイバーズ: OVERDRIVE`。

## Current Documentation State

- [x] `README.md`: ユーザー向け取説として起動、操作、遊び方、メニュー、配信連動、検証、公開フック、クエリを整理。
- [x] `docs/features.md`: 実装済み/未実装・制限事項/検証方法を現行 `src/` 実装に合わせて更新。
- [x] `docs/rebuild-plan.md`: 次の自律開発バックログを追加。
- [x] `progress.md`: 2026-04-27 のDocs/Product作業を追記。
- [x] `docs/qa-plan.md` / `docs/action-spec.md`: QA worker優先のため本サイクルでは未編集。

## Progress

- [x] 2026-04-27: Phaser + TypeScript + Vite の OVERDRIVE 作り直しを実装。
- [x] 2026-04-27: PC/SP対応UI、分割simulation、検証フック、取説、機能リスト、QA docsを追加。
- [x] 2026-04-27: 戦闘中3秒選択をやめ、wave全滅後のXP/装備回収と安全時間選択へ変更。
- [x] 2026-04-27: レベルアップ能力を分裂ヌンチャク、高速回転、反射、衝撃波、連鎖、丸鋸、重力、低HP過給などのスタック型へ拡張。
- [x] 2026-04-27: Diablo風装備として6レア度、37アフィックス、レジェンダリー/エンシェント級の戦場変化効果、38レベルアップ能力を追加。
- [x] 2026-04-27: README / features / rebuild-plan / progress / PLANS を実装実態へ合わせて更新。
- [x] 2026-04-27: `npm run check` / `npm run build` / smoke / wave / equip / responsive / live / boss_debug / skill-check / pickup-discard 検証を対象workspaceで完了。
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

- 現行主要ファイル: `/src/main.ts`, `/src/sim/GameSim.ts`, `/src/scenes/GameScene.ts`, `/src/ui/dom.ts`, `/src/content/*`, `/index.html`
- 現行ドキュメント: `/README.md`, `/docs/features.md`, `/docs/controls.md`, `/docs/state-contract.md`, `/docs/live-hook.md`, `/docs/rebuild-plan.md`
- QA worker優先文書: `/docs/qa-plan.md`, `/docs/action-spec.md`
- 検証入力: `/test_actions_skill_loop.json`, `/test_actions_boss_longrun_safe.json`, `/test_actions_live_hook.json`
- 記録: `progress.md`（最新要約）

## Plan of Work

- [x] `applyGiftImpact` に新規イベント「岩壁封鎖」を追加し、`spawnGiftWallBundle` と `setGiftEvent` / `log` / フェードを接続。
- [x] HUD 表示と `renderGameToText` に岩壁数・岩壁情報を反映。
- [x] レベルアップ/装備比較のオーバーレイ表示を短時間タイマー化し、`pause` 状態でも進行が継続するように更新。
- [x] OVERDRIVE再構築後の取説・機能表・バックログ・進捗記録を現行実装に同期。
- [x] 対象workspaceで `npm run check` / `npm run build` / Playwright smoke・responsive・gameplay・boss_debug・live を再実行し、最終証跡ディレクトリで `errors-*.json` 新規なしを確認。

## Next Autonomous Backlog

1. P1: 通常seedと `boss_debug=1` の長尺バランスを複数seedで継続確認する。
2. P2: 保存済みローカルスコアの表示導線を検討する。
3. P2: `音 ON/OFF` を実音声へ接続するか、UI表記を調整する。
4. P2: モーダルのフォーカス移動などアクセシビリティを補強する。

## Concrete Validation Commands

```bash
npm run check
npm run build
npm run dev
npm run test:smoke
npm run test:wave
npm run test:equip
npm run test:responsive
npm run test:longrun
npm run test:live
```

`npm run dev` は別セッションで `http://127.0.0.1:5173` を起動してから Playwright 系コマンドを実行する。

## Validation and Acceptance

1. TypeScript check と Vite build が通る。
2. `render_game_to_text()` の主要キーが [docs/state-contract.md](../docs/state-contract.md) と一致する。
3. `errors-*.json` が新規生成されない。生成された場合は最初の新規エラーのみを追跡する。
4. PC/SP主要viewportでHUD、選択モーダル、メニュー、操作デッキが操作不能に重ならない。
5. ライブイベントは running 中に即時反映、menu/mutation/title/ended 中にキューされる。

## Artifacts and Notes

- 最新ドキュメント更新:
  - `README.md`
  - `docs/features.md`
  - `docs/rebuild-plan.md`
  - `progress.md`
  - `.agent/PLANS.md`
- 重要判断資料: 完全履歴は `.agent/PLANS.full.md` を参照。
- 今後のバックログ詳細は [docs/rebuild-plan.md](../docs/rebuild-plan.md) の `Next Autonomous Backlog` を参照。

## Note for context limits

この `PLANS.md` は要約版で運用。長文履歴は `PLANS.full.md` に保持し、必要時のみ参照する。
