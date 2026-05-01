# Live Hook

ゲームは TikFinity 互換のローカルイベントを受け取れます。GitHub Pages などの静的配信では TikTok Live にブラウザから直接接続せず、手元の Node ブリッジを `127.0.0.1:8091` で起動してゲームが `/events` を読む構成にします。

## UI

メニューの `TikTok設定` を開くとTikTok IDとローカルBridge URLを入力できます。`IDで接続` は `POST /connect` に `{ username }` を送り、`ライブ連動: ON` は `http://127.0.0.1:8091/events?since=<cursor>&max=24` をポーリングします。cursorを保持するため、高頻度ギフトでも古いイベントを取り逃しにくい構成です。GitHub Pages のHTTPSページから127.0.0.1へアクセスできるよう、ゲーム側は `targetAddressSpace: "loopback"` を指定し、ブリッジはCORSに加えて `Access-Control-Allow-Private-Network: true` も返します。

Chrome 142以降のChromium系ブラウザでは、公開HTTPSページからlocalhost/127.0.0.1へ接続する際にLocal Network Accessの許可が必要です。プレイヤーが許可しない場合、ゲーム内のライブ連動ステータスは `ローカルネットワーク許可が必要` になります。Safari/Firefoxでは同じ制限がない場合がありますが、ブラウザ差分を吸収するためブリッジURLは設定画面から変更できます。

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

標準の `npm run test:live` は `window.injectTikfinityEvent` を直接使うため、ブリッジなしで実行できます。UIの `ライブ連動: OFF` ボタンから実ポーリングを確認する場合だけ、事前にブリッジを `127.0.0.1:8091` で起動します。

TikTok Live へTikTok IDだけで接続するブリッジ:

```bash
npm run live:tiktok -- your_tiktok_id
```

または:

```bash
TIKTOK_LIVE_USERNAME=your_tiktok_id npm run live:tiktok
```

IDなしでブリッジだけ起動し、ゲーム内UIから接続する場合:

```bash
npm run live:tiktok
```

このブリッジは `tiktok-live-connector` がインストール済みなら `gift` / `like` / `chat` / `follow` / `share` / `subscribe` / `member` を受け取り、ゲーム向けの共通イベントへ正規化します。ゲームが読むHTTPポーリングは `/events`、SSEで読みたい外部ツール向けには `/stream` も使えます。

```bash
curl http://127.0.0.1:8091/health
curl 'http://127.0.0.1:8091/events?since=0&max=12'
curl -X POST http://127.0.0.1:8091/connect \
  -H 'Content-Type: application/json' \
  -d '{"username":"your_tiktok_id"}'
```

`tiktok-live-connector` が未インストール、TikTok ID未指定、配信未開始、接続失敗の場合でもブリッジは起動します。`/health` と `/events` の `connector.error` にJSONで理由が出ます。依存を入れる場合は以下を実行します。

```bash
npm install tiktok-live-connector
```

デモ注入APIは依存なしで動きます。

```bash
curl -X POST http://127.0.0.1:8091/demo \
  -H 'Content-Type: application/json' \
  -d '{"sender":"demo_user","giftName":"Rose","diamondCount":15,"repeatCount":2}'
```

既存の TikFinity webhook 互換ブリッジも継続利用できます。

```bash
node scripts/tikfinity_webhook_bridge.mjs
```

## 注意事項

`tiktok-live-connector` は公式の本番APIではありません。TikTok側の仕様変更、地域/アカウント状態、配信開始前、レート制限などで接続できない可能性があります。公開版ゲームは静的配信のままにし、実TikTok接続はローカルNodeブリッジ経由に限定します。

## Playwright検証

公開HTTPSページからローカルブリッジまで含めて検証する場合は、ChromeのLocal Network Access許可を受け入れた状態として扱うため `--grant-local-network` を付けます。

```bash
node web_game_playwright_client.mjs \
  --url 'https://137yugi.github.io/TRYGNU/?v=<sha>' \
  --actions-file test_actions_mobile_menu_forms.json \
  --viewport 390x844 \
  --grant-local-network \
  --screenshot-dir output/stream-raid-online-forms-390x844
```
