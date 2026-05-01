# QA Plan

## 静的検証

- `npm run check`
- `npm run build`

## Playwright

開発サーバ起動後に実行します。

- smoke: `npm run test:smoke`
- wave reward/levelup: `npm run test:wave`
- equipment catalog/legendary: `npm run test:equip`
- smoke direct: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_smoke.json --iterations 2 --pause-ms 220 --screenshot-dir output/synapse-storm-smoke-direct`
- gameplay: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_gameplay.json --iterations 2 --pause-ms 240 --screenshot-dir output/synapse-storm-gameplay`
- menu/glossary: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_menu_glossary_visual.json --iterations 3 --pause-ms 180 --screenshot-dir output/synapse-storm-menu-glossary`
- boss/longrun: `npm run test:longrun`
- live: `npm run test:live`。標準スクリプトは `window.injectTikfinityEvent` を使うため、ローカル bridge なしで実行できます。
- responsive SP横: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_responsive.json --viewport 844x390 --iterations 2 --pause-ms 180 --screenshot-dir output/synapse-storm-responsive-844x390`
- responsive SP横 WebKit: `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_responsive.json --viewport 844x390 --iterations 2 --pause-ms 180 --screenshot-dir output/synapse-storm-responsive-844x390-webkit`
- responsive Safariバー縮小想定: `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_responsive.json --viewport 667x320 --iterations 1 --pause-ms 180 --screenshot-dir output/synapse-storm-responsive-667x320-webkit`
- responsive SP縦: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_responsive.json --viewport 390x844 --iterations 2 --pause-ms 180 --screenshot-dir output/synapse-storm-responsive-390x844`
- portrait stage shortcut: `npm run test:portrait`
- mobile forms shortcut: `npm run test:forms`
- ad obstruction shortcut: `npm run test:ad`
- mobile menu forms: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 390x844 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-mobile-menu-forms-390x844`
- ad obstacle: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_ad_obstacle.json --viewport 1280x720 --iterations 3 --pause-ms 220 --screenshot-dir output/synapse-storm-ad-obstacle-1280x720`

## 新機能QA（実装合流後の最終確認）

現行テストクライアントは `click_selectors`、`type_text`、`key_tap`、`inject_tikfinity_event`、`--viewport`、`--browser webkit` に対応済みです。TikTok設定、leaderboard、feedback、広告おじゃまのDOM実装が揃ったら、以下の action JSON を追加の回帰セットとして使います。

- `test_actions_mobile_menu_forms.json`: メニューを開き、TikTok設定フォーム入力/保存、leaderboard表示/閉じる、feedback入力/送信/閉じる、最後に開始操作まで確認します。
- `test_actions_ad_obstacle.json`: ラン開始後に `eventType: "ad_obstacle"` のTikfinity互換イベントを注入し、広告おじゃまが画面と `state-*.json` に出ることを確認します。

想定セレクタ契約:

- TikTok設定: `#openTikTokSettingsBtn` または `#tiktokSettingsBtn`、`#tiktokRoomInput`、`#tiktokBridgeUrlInput`、`#saveTikTokSettingsBtn`、`#closeTikTokSettingsBtn`
- leaderboard: `#openLeaderboardBtn` または `#leaderboardBtn`、`#closeLeaderboardBtn`
- feedback: `#openFeedbackBtn` または `#feedbackBtn`、`#feedbackNameInput`、`#feedbackMessageInput`、`#submitFeedbackBtn`、`#closeFeedbackBtn`
- 広告おじゃま: `window.injectTikfinityEvent({ eventType: "ad_obstacle", ... })` で発火し、`run.active_ads` または互換の `run.gift_obstacles` に可視要素が出ること

実装合流前の現状では、TikTok設定/leaderboard/feedbackのフォームDOMは未確認のため `test_actions_mobile_menu_forms.json` は失敗してよいです。DOM合流後は `optional` 指定を外してある主要セレクタの失敗を回帰として扱います。

## レスポンシブ重点観点

### PC

- `1280x720`: HUD、メニュー、TikTok設定、leaderboard、feedbackがCanvas上の重要領域を覆いすぎないこと。
- `1920x1080`: メニュー幅が広がりすぎず、フォームラベル/入力/ボタンの視線移動が破綻しないこと。
- コマンド:
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 1280x720 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-menu-forms-1280x720`
  - `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_ad_obstacle.json --viewport 1920x1080 --iterations 3 --pause-ms 220 --screenshot-dir output/synapse-storm-ad-obstacle-1920x1080`

### iPad

- `1024x768`: 横向き相当。メニュー/leaderboardが1画面内で閉じるボタンまで届くこと。広告おじゃまがHUDや操作ボタンに完全重なりしないこと。
- `1180x820`: iPad Air横向き相当。TikTok設定とfeedbackの入力中にキーボード想定の下部余白が不足しないこと。
- コマンド:
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 1024x768 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-menu-forms-ipad-1024x768`
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 1180x820 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-menu-forms-ipad-1180x820`
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_ad_obstacle.json --viewport 1024x768 --iterations 3 --pause-ms 220 --screenshot-dir output/synapse-storm-ad-obstacle-ipad-1024x768`

### SP縦

- `390x844`, `430x932`: メニューを開いた状態でフォーム入力欄、送信/保存、閉じるボタンがsafe-area内に残ること。
- mobile control deck、SNAP、開始ボタンがフォーム/leaderboard/feedbackの背面で誤タップを誘発しないこと。
- コマンド:
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 390x844 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-menu-forms-sp-390x844`
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 430x932 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-menu-forms-sp-430x932`

### SP横

- `844x390`, `932x430`, `667x320`: 下部固定デッキが出ない前提で、フォーム/leaderboard/feedbackが上下にはみ出さないこと。
- Safariバー縮小想定の `667x320` では、閉じるボタンと送信/保存ボタンが同時に操作可能な位置にあること。
- コマンド:
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 844x390 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-menu-forms-sp-844x390`
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_ad_obstacle.json --viewport 932x430 --iterations 3 --pause-ms 220 --screenshot-dir output/synapse-storm-ad-obstacle-sp-932x430`
  - `node web_game_playwright_client.mjs --browser webkit --url http://127.0.0.1:5173 --actions-file test_actions_mobile_menu_forms.json --viewport 667x320 --iterations 5 --pause-ms 220 --screenshot-dir output/synapse-storm-menu-forms-sp-667x320`

## Viewports

- PC: `1280x720`, `1920x1080`
- SP横: `667x320`, `844x390`, `932x360`, `932x430`
- SP縦: `390x844`, `430x932`
- iPad: `1024x768`, `1180x820`

`web_game_playwright_client.mjs` は `--viewport 844x390` を受け取り、Canvasスクショ `shot-N.png` とフルページ `page-N.png` を両方保存します。
`--browser webkit` で WebKit 検証もできます。各 iteration で `layout-N.json` を保存し、`visualViewport`、`.game-frame`、`canvas`、モバイル操作デッキの実測サイズを確認します。

- `shot-N.png`: Canvas優先。Canvasが透明/取得不可の場合はCanvas領域のpage screenshotへフォールバックします。
- `page-N.png`: full page。HUD、モーダル、safe-area、横スクロール確認用です。
- 失敗時: `diagnostic-failure.json` と `diagnostic-failure.png` を保存します。

SP responsive は action JSON 内で `click_selectors: ["#mobileStartBtn", "#startBtn"]` を使い、mobile開始ボタンを優先します。CLI の `--click-selector '#startBtn'` は失敗時に非ゼロ終了する必須クリックなので、SP検証では action JSON 側の fallback を使います。

## 合格条件

- `errors-*.json` 新規ゼロ
- `pageerror`, `console.error`, 404 ゼロ
- Canvas が非空
- `state-*.json` が parse 可能
- 最終 `state-*.json` のトップレベル `mode` が action JSON の `expect.final_mode(s)` を満たす。期待値未指定時は `mode !== "title"`。
- `mode`, `player`, `run`, `nunchaku`, `economy`, `enemies`, `drops` が欠落しない
- PC/SPでUI重なり、横スクロール、safe-area欠けがない
- SP横は `.game-frame` と Canvas が viewport 全域を使い、下部固定デッキが出ない
- SP縦は Canvas が viewport 全域を使い、下部操作デッキが overlay として収まる
- TikTok設定フォームは入力値保存後に再オープンしても値が保持される
- leaderboard はスコア0件/複数件の両方で横スクロールせず、閉じる操作でゲームに戻る
- feedback はSP縦横/iPadで入力中のテキスト、送信ボタン、閉じるボタンが欠けない
- 広告おじゃまは `page-*.png` 上で視認でき、`state-*.json` の `run.active_ads` / `run.ad_queue` または互換の `run.gift_obstacles` に対応状態が出る
