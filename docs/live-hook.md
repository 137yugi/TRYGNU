# Live Hook

ゲームは TikFinity 互換のローカルイベントを受け取れます。

## UI

メニューの `ライブ連動: OFF` を押すと `http://127.0.0.1:8091/events?max=12` をポーリングします。

## テスト注入

ブラウザコンソールまたはPlaywrightから:

```js
window.injectTikfinityEvent({
  eventType: "gift",
  sender: "demo_user",
  giftName: "Rose",
  diamondCount: 15,
  repeatCount: 2
});
```

通常戦闘中、つまり `mode: running` / `pause_mode: null` / `run.wave_state: fighting` のときだけ即時反映します。

タイトル/終了/メニュー/レベルアップ/変異/装備比較/報酬回収/次wave出現中のイベントはキューされます。キューは次のwave頭では解放せず、waveが出揃ってから約2.4秒後に1件ずつ反映します。重複IDは無視します。キュー数と猶予は `run.live_queue` / `run.live_queue_release_timer` で確認します。

## ローカルブリッジ

既存の `scripts/tikfinity_webhook_bridge.mjs` を継続利用します。標準の `npm run test:live` は `window.injectTikfinityEvent` を直接使うため、ブリッジなしで実行できます。UIの `ライブ連動: OFF` ボタンから実ポーリングを確認する場合だけ、事前にブリッジを `127.0.0.1:8091` で起動します。

```bash
node scripts/tikfinity_webhook_bridge.mjs
```
