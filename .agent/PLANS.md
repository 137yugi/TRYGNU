# Diablo-like Web H&S: Continuous ExecPlan Loop (Compact)

This is a compact context version for autonomous iterations. Full history is archived at `.agent/PLANS.full.md`.

Status: IN_PROGRESS
Owner: Codex
Last Updated: 2026-05-02
Overall Progress: STREAM RAID ARENA is active. Live integration has moved from server/Node bridge as the main path to same-device browser terminal input; docs and QA contracts are being synchronized to that implementation.

## Purpose / Big Picture

高密度配信向けの2Dハクスラ実装を継続し、Playwrightループで品質確認しながら進行不能・過密UI・不自然な即死を抑える。現行版は Phaser + TypeScript + Vite の `呪われた配信闘技場: STREAM RAID ARENA`。

## Current Documentation State

- [x] `README.md`: ユーザー向け取説として起動、操作、遊び方、メニュー、配信連動、検証、公開フック、クエリを整理。
- [x] `docs/features.md`: 実装済み/未実装・制限事項/検証方法を現行 `src/` 実装に合わせて更新。
- [x] `docs/live-hook.md` / `docs/state-contract.md`: 同一端末ブラウザ入力をライブ連携の主経路として記載。
- [x] `progress.md`: 2026-05-02 の端末入力方針、タイマー、サブエージェント回収状況を追記。
- [x] `docs/qa-plan.md`: 端末入力UIの `#terminalChannelInput`, `#terminalTestEventBtn`, `#streamHookBtn` 契約へ同期。
- [ ] `docs/action-spec.md`: 必要に応じて端末入力QA actionとの表現差分を確認する。

## Progress

- [x] 2026-05-02: ライブ連携を端末側ブラウザ入力へ切替。`#terminalChannelInput`, `#terminalTestEventBtn`, `#streamHookBtn` をUI契約にし、Node bridge は legacy/開発補助扱いへ整理。
- [x] 2026-05-02: `scripts/test_terminal_live_input.mjs` を追加し、`postMessage` / `BroadcastChannel` / `CustomEvent` / `storage` の端末入力経路を検証対象に追加。
- [x] 2026-05-02: 8時間タイマーでサブエージェント完了/レビュー回収/枠復旧/再展開のチェックポイントを記録し、以後は親エージェント主導で文書同期を継続。
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
- 現行ドキュメント: `/README.md`, `/docs/features.md`, `/docs/controls.md`, `/docs/state-contract.md`, `/docs/live-hook.md`, `/docs/rebuild-plan.md`, `/docs/qa-plan.md`
- QA worker優先文書: `/docs/qa-plan.md`, `/docs/action-spec.md`
- 検証入力: `/test_actions_skill_loop.json`, `/test_actions_boss_longrun_safe.json`, `/test_actions_live_hook.json`, `/test_actions_mobile_menu_forms.json`
- 端末入力検証: `/scripts/test_terminal_live_input.mjs`, `/scripts/test_live_queue.mjs`
- 記録: `progress.md`（最新要約）

## Plan of Work

- [x] サーバーbridge本線の記述を撤回し、端末入力を主経路として `docs/live-hook.md` / `docs/state-contract.md` / `docs/features.md` に反映。
- [x] `docs/qa-plan.md` の旧Bridge系セレクタ/旧設定表現を端末入力QAへ更新。
- [x] `progress.md` に端末入力方針、タイマー状態、サブエージェント回収状況を追記。
- [x] `.agent/PLANS.md` を `Status: IN_PROGRESS` に戻し、現在のACTIVEな文書同期作業へ合わせる。
- [ ] 端末入力の最終回帰として `npm run test:live` と `npm run test:forms` を必要タイミングで再実行する。

## Next Autonomous Backlog

1. P1: 端末入力ライブ連携の `npm run test:live` / `npm run test:forms` / responsive を再確認する。
2. P1: `docs/action-spec.md` に端末入力QAの action 記述差分があれば同期する。
3. P2: 通常seedと `boss_debug=1` の長尺バランスを複数seedで継続確認する。
4. P2: 保存済みローカルスコアの表示導線を検討する。

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
npm run test:forms
```

`npm run dev` は別セッションで `http://127.0.0.1:5173` を起動してから Playwright 系コマンドを実行する。

## Validation and Acceptance

1. TypeScript check と Vite build が通る。
2. `render_game_to_text()` の主要キーが [docs/state-contract.md](../docs/state-contract.md) と一致する。
3. `errors-*.json` が新規生成されない。生成された場合は最初の新規エラーのみを追跡する。
4. PC/SP主要viewportでHUD、選択モーダル、メニュー、操作デッキが操作不能に重ならない。
5. ライブイベントは running 中に即時反映、menu/mutation/title/ended 中にキューされる。
6. 端末入力は `#terminalChannelInput` のチャンネルで `BroadcastChannel` を開き、`postMessage` / `storage` / `CustomEvent` も受信できる。Node bridge は本線の合格条件に含めない。

## Artifacts and Notes

- 最新ドキュメント更新:
  - `README.md`
  - `docs/features.md`
  - `docs/rebuild-plan.md`
  - `docs/qa-plan.md`
  - `progress.md`
  - `.agent/PLANS.md`
- タイマー状態: `runtime/agent-work-timer.json` に端末入力実装/文書同期とサブエージェント枠回収のチェックポイントあり。
- 重要判断資料: 完全履歴は `.agent/PLANS.full.md` を参照。
- 今後のバックログ詳細は [docs/rebuild-plan.md](../docs/rebuild-plan.md) の `Next Autonomous Backlog` を参照。

## Note for context limits

この `PLANS.md` は要約版で運用。長文履歴は `PLANS.full.md` に保持し、必要時のみ参照する。
