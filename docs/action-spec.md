# Action JSON Spec

`web_game_playwright_client.mjs` は以下を受け付けます。

```json
{
  "expect": { "final_modes": ["running", "ended"] },
  "steps": [
    { "buttons": ["right"], "frames": 20 },
    { "buttons": ["space"], "frames": 3 },
    { "click_selector": "#menuFloatingBtn", "frames": 2 },
    { "buttons": ["1"], "frames": 2 }
  ]
}
```

対応ボタン:

- `up`, `down`, `left`, `right`
- `enter`, `space`
- `a`, `b`, `h`, `m`
- `escape`, `esc`
- `1`, `2`, `3`
- `left_mouse_button`, `right_mouse_button`

Stepキー:

- `click_selector`: クリック対象の単一セレクタ。
- `click_selectors`: クリック対象のフォールバック配列。responsive では `["#mobileStartBtn", "#startBtn"]` のように使います。
- `buttons`: 押下し続けるボタン配列。
- `frames`: `window.advanceTime` で進めるフレーム数。
- `wait_ms`: 実時間 wait。
- `optional`: true の場合、その step の click 失敗だけ warning にします。
- `timeout_ms` / `step_timeout_ms`: step 単位のタイムアウト上書き。
- `key_tap`, `type_text`, `click_page_x`, `click_page_y`, `mouse_x`, `mouse_y`。
- `inject_tikfinity_event`: `window.injectTikfinityEvent(payload)` を直接呼びます。サーバなしの live hook 検証に使います。

追加オプション:

- `--viewport 844x390`
- `--actions-json '{"steps":[...]}'`
- `--click 320,180`
- `--click-selector '#startBtn'`
- `--click-selector-optional`
- `--expect-final-mode running,ended`
- `--allow-final-title`
- `--headless 0`
- `--action-timeout-ms 5000`
- `--step-timeout-ms 15000`
- `--navigation-timeout-ms 15000`
- `--screenshot-dir output/name`

`--click-selector` はデフォルト必須です。失敗時は非ゼロ終了します。任意クリックにしたい場合だけ `--click-selector-optional` を併用します。action JSON 内では `optional: true` を step ごとに指定します。

最終 state assertion:

- action JSON の `expect.final_mode` または `expect.final_modes` がある場合、トップレベル `mode` だけを合格判定します。
- `mode` の値は `title | running | ended` です。`levelup` / `mutation` / `pickup_compare` / `menu` は `pause_mode` なので、`final_modes` には入れません。
- 未指定の場合、最終 `mode === "title"` は未開始扱いで非ゼロ終了します。
- メニュー/用語集のように開始しない検証は `{"expect": {"final_mode": "title"}}` を明示します。

セレクタは現行UIのIDを使います。旧 `#pickupPickBtn` は `#pickupKeepBtn` に正規化されますが、新規JSONでは `#pickupKeepBtn` を使います。

スクリーンショット保存:

- `shot-N.png`: Canvas優先のゲーム画面スクリーンショット。Canvasが透明/取得不可の場合はCanvas領域のpage screenshotへフォールバックします。
- `page-N.png`: full page screenshot。HUD、モーダル、safe-area確認に使います。
- 失敗時は `diagnostic-failure.json` と `diagnostic-failure.png` を保存します。
