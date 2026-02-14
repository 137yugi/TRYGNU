# Compact Progress Log

## Last Updated (2026-02-14)
- 2026-02-14: ギフト岩壁イベントの最終接続作業を再開。
  - `applyGiftImpact` に 4分岐目として「岩壁封鎖」を実装し、`spawnGiftWallBundle()` を接続。
  - HUD の `HZ` 表示を `HZ + GW` 表記へ更新（コンパクト/詳細）。
  - `render_game_to_text` に岩壁障害物配列 `run.gift_obstacles` を追加（x/y/w/h/elapsed/life_left/type）。
  - `game.js` の最小差分変更を完了。`node --check game.js` で構文確認済み（成功）。
  - Playwright mandatory ループ再実行は macOS の `mach port rendezvous` 権限エラー（`SIGTRAP`）で取得不可。`errors-*.json` は未生成。
- 2026-02-14: レベルアップ/装備比較 UI を右下オーバーレイ化し、ゲーム進行を止めずに表示する方向へ更新。
  - `LEVEL_UP_OVERLAY_BATCH_TARGET/LIMIT` を追加し、レベル停止頻度を抑制（重複レベルアップをまとめて自動処理）。
  - `state.pauseMode` 分岐を `mutation/menu` のみブロック対象へ分離し、`updateState` の時間進行とギフトイベント適用を継続。
  - `openLevelChoiceModal` / `openPickupCompareModal` に `hud-overlay-modal` クラスを適用し、開始タイマーを短縮設定。
  - `game.js` で `drawPickupCompareCanvasOverlay` を削除し、DOM側の重なり表示に一本化。
  - Playwright mandatoryコマンドは `node --check game.js` で通過後、`web_game_playwright_client.mjs` 実行時に同じく `mach port rendezvous` 権限エラー（SIGTRAP）で未完了、`errors-*.json` 未生成。
- 2026-02-14: phase3 A/B 最終検証を再実行し、最終プロファイルを `A` に確定。
  - 必須ループ: `test_actions_skill_loop.json` を3iterで再実行（`output/web-game-uicheck`）。最新 `shot-2.png` を目視確認。
  - 長尺比較: `test_actions_boss_longrun_safe.json` を `boss_phase3=A/B` で各14iter実行（`output/web-game-phase3-resume-A1`, `output/web-game-phase3-resume-B1`）。
  - phase3強制比較: `phase3_debug=1` + `test_actions_phase3_profile_compare.json` を `A/B` 各10iter（`output/web-game-phase3-resume-debug-A1`, `output/web-game-phase3-resume-debug-B1`）。
  - 集計結果: `maxBossPhase=3` は A/B とも到達、`ended` は `A=2/10`, `B=3/10`、`errors-*.json` 新規生成なし。
  - 視認チェック: `.../web-game-phase3-resume-debug-A1/shot-9.png` は戦闘継続、`.../web-game-phase3-resume-debug-B1/shot-9.png` は失敗オーバーレイ。
- `progress.md` をこのファイルで要約運用に変更。全文履歴は `progress.full.md` に保管。
- `game.js` / `index.html` / `styles.css` は既更新済み。
- `uicheck` ループは直近で pass。
- `ui_audit_2026-02-14.md` を追加し、表示UI/未表示UI/機能画面一覧を固定化。
- 2026-02-14: `ui_audit_2026-02-14.md` を追記し、  
  - 画面別表示可否（ゲーム/メニュー/一時イベント）  
  - 非表示UI(DOM削除済/残存)  
  - 機能一覧  
  - 画面への掲載可否  
  を一体化して確定。
- 2026-02-14: メニュー内未使用パーツ（ゲーム内ヒント、ドロップ/ログ/ランキング）を `index.html` から物理削除し、`game.js` 側で `log/drop/ranking` 描画を非存在時にガードする形で残りロジックを保護。
- 2026-02-14  : ゲーム画面を「画面内のみ（フレーム外は周辺UI/背景）」として扱う整理を再確認。インベントリ/ルーン領域をゲーム表示から除外し、メニューボタンはゲーム画面内に保持。  
  - 追加/変更根拠: HUD系の見出しレイアウトを撤去し、メニュー画面を主UIとして維持。`index.html` 上の `#menuSourceColumn` を `#menuModal` へ移植するための構成を確認。  
  - メニューは `openMenuModal()` 経由で `#menuModal` 全画面表示に移す構成を維持。
- 2026-02-14  : Playwright必須コマンドは以下で実行を試行。
  - 参考: `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck`
  - 結果: `python3 -m http.server 8081` 起動で `PermissionError: [Errno 1] Operation not permitted`、続いて chromium 起動時に macOS の `mach port rendezvous` 権限エラー（SIGTRAP）で画面差分取得は未完了。  
- 2026-02-14 : Playwright必須コマンドは再実行（`output/web-game-uicheck-latest`）を試行したが、同様に `mach port rendezvous` 権限エラーで未完了。  
- 2026-02-14 : `output/web-game-uicheck-latest` は未生成。最新の確認済み差分は `output/web-game-uicheck-2026-02-14-ui-clean` を使用。`errors-*.json` は確認時点で未作成。
- 2026-02-13  : メニュー表示の整理（インベントリ/ルーン領域を非表示化、既存メニューボタンを維持してフルスクリーンメニュー運用を継続可能化）。  
  - 対象変更: `index.html`（`gear-panel` に非表示クラス付与）、`styles.css`（`menu-hidden-section` 追加）。  
  - 本サイクルでは Playwright 検証は未実施（次回最優先タスクとして同時実行）。

## 直近の実装サマリー
- 2026-02-13 01:12
  - ドロップ抑制を横断的に実施（`ITEM_DROP_RATE_MULT=0.1` / `HIGH_RARITY_RATE_MULT=0.08` / `LEGENDARY_RATE_MULT=0.06`）。
  - `applyGiftImpact`, `applyDrop`, `rollRarity`, `legendaryChance` を全体調整。
  - `uicheck`/`legendary-dropnerf1` で `errors-*.json` なし。
- 2026-02-12 17:16
  - GitHub Pages デプロイ基盤追加（`scripts/build_web_dist.sh`, `deploy-pages.yml`）。
  - push→main デプロイで公開導線を整備。
- 2026-02-12 19:25
  - 日本語UI + メニュー/用語集導線追加。
  - `run.ui_panels.menu_open / glossary_open` を `render_game_to_text` へ追加。
  - Playwright で menu/glossary フローを確認。
- 2026-02-12〜13
  - phase3関連調整（ボスphase過密対策、接触ダメージ上限、phase連動キャップ）継続。
  - 2026-02-14に phase3 A/B の最終決定まで完了（`boss_phase3=A` を採用）。

## 進行中の重要事項
- 現在ステータス: `.agent/PLANS.md` は `Status: IN_PROGRESS`。
- 次回再開時の優先: 新規要求が出るまで現状係数（phase3 profile A）を維持し、回帰のみ監視。

## 今回の Playwright 実行（再利用）
- 固定コマンド
  - `node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck`
  - `node ... --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_boss_longrun_safe.json --click-selector '#startBtn' --iterations 14 --pause-ms 280 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-boss-longrun-safeN`

## 追加運用ルール
- `errors-*.json` が出ても、まず「最初の新規エラー」だけを修正。
- `output/*` は `...N` で世代分け。
- 2000行を超えるメモには追記せず、`progress.full.md` へ追送する。

## 参照先
- 完全履歴: `progress.full.md`
- 実行ループ設定: `scripts/run_exec_plan_loop.sh`
- まとめ: `.agent/PLANS.md`
