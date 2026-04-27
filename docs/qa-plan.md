# QA Plan

## 静的検証

- `npm run check`
- `npm run build`

## Playwright

開発サーバ起動後に実行します。

- smoke: `npm run test:smoke`
- wave reward/levelup: `npm run test:wave`
- equipment catalog/legendary: `npm run test:equip`
- smoke direct: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_smoke.json --iterations 2 --pause-ms 220 --screenshot-dir output/overdrive-smoke-direct`
- gameplay: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_gameplay.json --iterations 2 --pause-ms 240 --screenshot-dir output/overdrive-gameplay`
- menu/glossary: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_menu_glossary_visual.json --iterations 3 --pause-ms 180 --screenshot-dir output/overdrive-menu-glossary`
- boss/longrun: `npm run test:longrun`
- live: `npm run test:live`。標準スクリプトは `window.injectTikfinityEvent` を使うため、ローカル bridge なしで実行できます。
- responsive SP横: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_responsive.json --viewport 844x390 --iterations 2 --pause-ms 180 --screenshot-dir output/overdrive-responsive-844x390`
- responsive SP縦: `node web_game_playwright_client.mjs --url http://127.0.0.1:5173 --actions-file test_actions_responsive.json --viewport 390x844 --iterations 2 --pause-ms 180 --screenshot-dir output/overdrive-responsive-390x844`

## Viewports

- PC: `1280x720`, `1920x1080`
- SP横: `844x390`, `932x430`
- SP縦: `390x844`

`web_game_playwright_client.mjs` は `--viewport 844x390` を受け取り、Canvasスクショ `shot-N.png` とフルページ `page-N.png` を両方保存します。

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
