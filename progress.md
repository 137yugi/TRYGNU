# Compact Progress Log

## Last Updated (2026-04-28)
- 2026-04-28: SP全画面化、Safari対策、ドット調ビジュアル、装備/ビルド多様化を実装。
  - SP横/縦とも `.game-frame` と Canvas を `visualViewport` 全体へ広げ、縦は下部操作を overlay 化。`manifest.webmanifest` と Apple standalone meta、`#fullscreenBtn`、resize/visualViewport/fullscreen refresh を追加。
  - `web_game_playwright_client.mjs` に `--browser webkit` と `layout-N.json` を追加し、WebKit/Chromiumで frame/canvas/deck の実測を保存。
  - `public/assets/pixel/` に職業8種、武器タイプ8種、敵、ドロップ、アイコンのドット調SVGを生成し、Phaser preload + sprite overlay で描画。
  - ジョブを8種、武器タイプを8種に拡張。装備を `body` / `nunchaku` の2スロットへ分離し、`inventory.equipment_slots` / `slot_mods` を state contract に追加。
  - 検証: `npm run check`, `npm run build`, `node scripts/test_equipment_catalog.mjs http://127.0.0.1:5174 output/overdrive-equipment-catalog-v2`, Chromium/WebKit responsive `844x390`, `932x360`, `667x320`, `390x844`, `430x932` が pass。
- 2026-04-27: GitHub Pages公開を更新。
  - Vercel旧APIはCLI案内のみ返すため、既存 GitHub Pages workflow を使うルートへ切替。
  - workflow に `setup-node` / `npm ci` を追加し、`https://137yugi.github.io/TRYGNU/` の公開更新とオンライン smoke を確認。
- 2026-04-27: Diablo風の装備システムと大幅な能力バリエーションを追加。
  - 装備を `ItemState` + 6レア度 + 複数アフィックス + `equipment_mods` 方式へ変更。過去装備の火力加算が残らないよう、装備交換時は現在装備から補正を再計算する。
  - レア度は白コモン/青マジック/黄色レア/紫エピック/オレンジレジェンダリー/赤エンシェント。エピック以降は低確率、レジェンダリー以降は強力な戦場変化アフィックスを含む。
  - 装備アフィックス37種、レベルアップ能力38種へ拡張。装備効果とレベルアップ能力は別系統で重複可能。
  - `docs/equipment-design.md` と `npm run test:equip` を追加。検証は `npm run check`, `npm run build`, `npm run test:equip`, `npm run test:wave`, `npm run test:smoke`, SP縦装備比較 `output/overdrive-equipment-mobile` が pass。`errors-*` / `diagnostic-*` なし。
- 2026-04-27: ユーザー追加要望に合わせて、レベルアップ能力とラン進行を調整。
  - レベルアップ能力を Archero 風の組み合わせ型へ拡張。分裂ヌンチャク、高速回転、反射、衝撃波、連鎖、丸鋸ヘッド、重力井戸、低HP過給を追加し、`combat.skill_stacks` / `phantoms` / `effective_damage_multiplier` で検証可能にした。
  - 戦闘中3秒選択を廃止し、wave全滅後に `run.wave_state: reward` へ入り、XPオーブと装備を回収してから選択する流れに変更。
  - `npm run test:wave` と `test_actions_wave_clear.json` を追加。Playwright クライアントは実行開始時に stale な `errors-*` / `diagnostic-*` のみ掃除する。
  - 最新検証: `npm run check`, `npm run build`, `npm run test:smoke`, `npm run test:wave`, `npm run test:responsive`, `npm run test:live`, `npm run test:longrun`, SP縦/PC追加responsive、skill-check、pickup-discard が pass。証跡は `output/overdrive-smoke`, `output/overdrive-wave`, `output/overdrive-responsive`, `output/overdrive-live`, `output/overdrive-longrun`, `output/overdrive-responsive-390x844`, `output/overdrive-responsive-1280x720`, `output/overdrive-skill-check`, `output/overdrive-pickup-discard`。
- 2026-04-27: レベルアップ/装備/変異/報酬/次wave出現中の投げ銭が次wave頭で暴発しないよう、ライブイベントキューの解放条件を調整。
  - 即時反映は `mode: running` / `pause_mode: null` / `run.wave_state: fighting` の通常戦闘中だけに限定。
  - キューはwaveが出揃ってから約2.4秒後に1件ずつ反映し、`run.live_queue_release_timer` で観測可能にした。
  - 検証: `npm run check`, `npm run build`, `npm run test:live`, `npm run test:wave`, 直接再現 `output/overdrive-live-levelup-queue` が pass。`errors-*` / `diagnostic-*` なし。
- 2026-04-27: OVERDRIVE 対象workspaceでの最終実装/検証を完了。
  - `GameSim` の pause/menu 安全性、固定 seed 再現性、live event pause queue、`advanceTime(0)` no-op、manualClock 化を修正。
  - `boss_debug=1` は通常ランに影響しない範囲で初期密度/敵上限/接触ダメージを検証向けに調整し、ボス戦を観測しやすくした。
  - `web_game_playwright_client.mjs` に `inject_tikfinity_event` step、full page + canvas screenshot、final mode assertion、失敗診断を追加/維持。
  - 最終検証: `npm run check`, `npm run build`, smoke, responsive 844x390/390x844, gameplay, live hook, boss_debug, deterministic seed 比較が pass。最終証跡は `output/overdrive-final-smoke-4`, `output/overdrive-final-responsive-844x390-4`, `output/overdrive-final-responsive-390x844-4`, `output/overdrive-final-live-5`, `output/overdrive-final-gameplay-2`, `output/overdrive-final-boss-3`, `output/overdrive-final-determinism-a/b`。
- 2026-04-27: Docs/Product workerとして、OVERDRIVE再構築後の実装実態に合わせてユーザー向け/引き継ぎ向けドキュメントを更新。
  - `README.md` を取説として再整理し、起動、遊び方、操作、ラン要素、メニュー、配信連動、検証、公開フック、クエリパラメータ、関連ドキュメントを掲載。
  - `docs/features.md` を実装済み/未実装・制限事項/検証コマンドが分かる形へ更新。`src/` の現行実装に合わせ、ビルド選択、QA公開フック、ライブキュー、ローカルスコアキー `nunchaku_overdrive_scores_v1` も反映。
  - `docs/rebuild-plan.md` に次の自律開発バックログを追加。正式検証、responsive確認、タイマー表示整合、ライブ連投耐久、長尺バランス、スコア表示、音声方針、アクセシビリティを優先順で整理。
  - `.agent/PLANS.md` を現在の再構築/文書整備状況に合わせて更新。
  - 本サイクルでは所有範囲外の `src/**` とテストクライアントは編集していない。Markdownリンク/ファイル名整合は文書内参照を確認する。
- 2026-04-27: `1ビット・ヌンチャクサバイバーズ: OVERDRIVE` として Phaser + TypeScript + Vite へ作り直し。
  - `src/` を新設し、simulation / scene / content / UI / platform / systems へ分割。
  - `render_game_to_text()`, `advanceTime(ms)`, `injectTikfinityEvent(payload)`, `set_nunchaku_stretch_limit(value)` を継続/追加。
  - PC/SP操作、慣性ヌンチャク、スナップ、敵4種、ボス2種、レベル3択、変異、契約、装備比較、ギフト4種、レジェンダリー、ローカルスコアを v1 実装。
  - `README.md` と `docs/features.md` / `docs/controls.md` / `docs/qa-plan.md` / `docs/state-contract.md` / `docs/live-hook.md` / `docs/action-spec.md` / `docs/rebuild-plan.md` を追加。
  - staging環境で `tsc --noEmit` と `vite build --configLoader runner` は成功。対象プロジェクト反映後に正式 `npm run check` / `npm run build` / Playwright smoke を実行する。

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
