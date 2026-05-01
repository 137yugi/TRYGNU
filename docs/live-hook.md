# Live Hook

ゲームは TikFinity 互換のライブイベントを受け取れます。現行の本筋はローカル Node bridge ではなく、同一端末のブラウザ/配信補助ページ/自動化からゲーム画面へイベントを渡す端末入力方式です。

主要入力経路:

- `window.postMessage(envelope, "*")`
- `BroadcastChannel("stream-raid-live-v1").postMessage(envelope)`
- `localStorage.setItem("stream_raid_terminal_event_v1", JSON.stringify(envelope))`
- `window.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: envelope }))`
- `document.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: envelope }))`
- QA/Playwright向けの `window.injectTikfinityEvent(payload)`
- QA/Playwrightの端末入力一括投入向けの `window.receiveTerminalLiveEvent(envelope)`

`envelope` は `{ source: "stream-raid-terminal", channel: "stream-raid-live-v1", event }` または `{ source: "stream-raid-terminal", channel: "stream-raid-live-v1", events }` 形式です。各イベントは `eventType` / `type`, `sender` / `uniqueId`, `giftName`, `diamondCount` / `diamonds`, `repeatCount`, `id` などの TikFinity 互換フィールドを受け取り、ゲーム側で共通イベントへ正規化されます。端末入力がOFFの間、`source` が一致しないpayload、または `channel` が未指定/不一致のpayloadは無視します。

## UI

メニューの `端末入力` を開くと `TikTok ID` と `端末チャンネル` を入力できます。`TikTok ID` は表示/送信元メモ用で、ブラウザからTikTokへ直接接続するものではありません。`端末チャンネル` の既定値は `stream-raid-live-v1` です。

`端末受信ON` または `ライブ連動: OFF` を押すと端末入力の受信を開始します。受信ON中は以下を待ち受けます。

- `message`: 同一ウィンドウ/親子フレームからの `postMessage`
- `broadcast`: 指定チャンネルの `BroadcastChannel`
- `storage`: `stream_raid_terminal_event_v1` の storage event
- `customEvent`: `stream-raid-live-event`

`テスト受信` は同じ正規化経路へデモギフトを投入します。受信数、適用数、キュー数は `streamHookStatus` に表示されます。

## 端末ライブ入力ヘルパー

`public/terminal-live.html` はサーバー処理なしで使う同一オリジンの補助ページです。ゲーム側で `端末入力` を開いて `端末チャンネル` を合わせ、`端末受信ON` にしてから、メニュー内の `入力ヘルパー` を開きます。

ヘルパーではチャンネル名、ユーザー名、ギフト名、ダイヤ数、イベントIDを入力して送信できます。`like` / `chat` / `follow` / `share` / `gift` / `ad_obstacle` のプリセットを押すと、イベント種別、ラベル、ダイヤ数が即セットされ、手入力欄とプレビューに反映されます。送信時は `BroadcastChannel` と `localStorage` の両方へ投入し、ゲーム画面から開かれて `window.opener` が残っている場合は `opener.postMessage` も使います。

## 端末入力の例

ブラウザコンソール、TikFinity用の同一端末ヘルパー、Playwrightなどから:

```js
const event = {
  id: "demo-gift-1",
  eventType: "gift",
  sender: "demo_user",
  giftName: "Rose",
  diamondCount: 15,
  repeatCount: 2,
};

window.postMessage({ source: "stream-raid-terminal", channel: "stream-raid-live-v1", event }, "*");
```

BroadcastChannelを使う場合:

```js
const channel = new BroadcastChannel("stream-raid-live-v1");
channel.postMessage({ source: "stream-raid-terminal", channel: "stream-raid-live-v1", event });
```

storage eventを使う場合:

```js
// storage eventは別タブ/別ウィンドウから書き込んだ時にゲーム側へ届きます。
localStorage.setItem(
  "stream_raid_terminal_event_v1",
  JSON.stringify({ source: "stream-raid-terminal", channel: "stream-raid-live-v1", event, nonce: Date.now() })
);
```

CustomEventを使う場合:

```js
window.dispatchEvent(
  new CustomEvent("stream-raid-live-event", {
    detail: { source: "stream-raid-terminal", channel: "stream-raid-live-v1", event },
  })
);
```

QAの直接注入:

```js
window.injectTikfinityEvent({
  id: "qa-gift-1",
  eventType: "gift",
  sender: "demo_user",
  giftName: "Rose",
  diamondCount: 15,
  repeatCount: 2,
});
```

通常戦闘中、つまり `mode: running` / `pause_mode: null` / `run.wave_state: fighting` のときだけ即時反映します。

タイトル/終了/メニュー/レベルアップ/変異/装備比較/報酬回収/次wave出現中のイベントはキューされます。キューは次のwave頭では解放せず、waveが出揃ってから約2.4秒後に1件ずつ反映します。重複IDは無視します。キュー数と猶予は `run.live_queue` / `run.live_queue_release_timer` で確認します。

## イベント種別ごとの効果

正規化後のイベントは `gift` / `like` / `chat` / `follow` / `share` / `ad_obstacle` に分類されます。

- `like`: 高頻度入力向けの軽量効果。ギフト経済、敵、広告、ドロップを増やさず、呪鎖武器の小さなスピンと演出だけを入れます。
- `chat`: 小さな観客乱入。ギフトダイヤは増やさず、少数の敵を追加します。
- `follow`: 支援効果。デモエネルギー、微回復、短い無敵を付与します。
- `share`: 補給効果。プレイヤー付近へXP/低確率アイテムを落とします。
- `gift`: 既存のギフト挙動。ダイヤ加算、ランダムなギフト効果、広告キューを維持します。
- `ad_obstacle`: 既存のスポンサー広告おじゃま挙動。ダイヤ加算と広告表示/待機キューを維持します。

## live storm/連投耐久

連投耐久は、専用GameSimがなくても既存フックで確認できます。短時間に多数のTikFinity互換payloadを投入し、ゲーム本体は同じ正規化・重複排除・キュー制御を通します。

標準コマンドは `npm run test:live:storm` です。このテストは `#connectTikTokBtn` で端末入力をONにしたうえで、`window.receiveTerminalLiveEvent({ source: "stream-raid-terminal", channel, events })` から一括投入し、連投圧、キュー上限、重複ID、pause中キュー、復帰後の解放を確認します。個別の `postMessage` / `BroadcastChannel` / `localStorage` / `CustomEvent` 経路は `npm run test:live` 内の `scripts/test_terminal_live_input.mjs` が担当します。

確認する入力:

- `window.injectTikfinityEvent(payload)` の直接注入。
- 端末入力ON後の `window.receiveTerminalLiveEvent(envelope)` による一括投入。
- `scripts/test_terminal_live_input.mjs` による `window.postMessage(envelope, "*")`、`BroadcastChannel(<端末チャンネル>)`、`localStorage` の `stream_raid_terminal_event_v1`、`stream-raid-live-event` CustomEvent。

確認する状態:

- `run.live_queue` と `run.live_queue_release_timer` が数値として維持される
- `run.live_pressure`、`run.live_storm`、`run.dropped_live_events` で連投圧、スポンサー襲来状態、圧縮/破棄数を確認できる
- `run.gift_event`、`run.active_ads`、`run.ad_queue`、`run.gift_obstacles` が連投後もJSON化できる
- `score`、`economy.gift`、`economy.diamonds` が同一 `id` の重複投入で二重加算されない
- `#streamHookStatus` の受信数、適用数、キュー数が画面上で破綻しない

## ローカル Node bridge

Node bridge は現行の主経路ではなく、legacy/開発補助扱いです。標準の `npm run test:live` は直接注入と端末入力経路を使うため、ブリッジなしで実行できます。

TikTok Live へTikTok IDだけで接続する補助ブリッジ:

```bash
npm run live:bridge:tiktok -- your_tiktok_id
```

または:

```bash
TIKTOK_LIVE_USERNAME=your_tiktok_id npm run live:bridge:tiktok
```

IDなしでブリッジだけ起動し、補助ツール側から接続する場合:

```bash
npm run live:bridge:tiktok
```

このブリッジは `tiktok-live-connector` がインストール済みなら `gift` / `like` / `chat` / `follow` / `share` / `subscribe` / `member` を受け取り、ゲーム向けの共通イベントへ正規化します。HTTPポーリング用に `/events`、SSEで読みたい外部ツール向けに `/stream` も残っていますが、ゲーム本体の通常運用は同一端末ブラウザ入力へ寄せます。

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

既存の TikFinity webhook 互換ブリッジもlegacy補助として継続利用できます。

```bash
node scripts/tikfinity_webhook_bridge.mjs
```

## 注意事項

`tiktok-live-connector` は公式の本番APIではありません。TikTok側の仕様変更、地域/アカウント状態、配信開始前、レート制限などで接続できない可能性があります。公開版ゲームは静的配信のままにし、実運用のイベント受け渡しは同一端末ブラウザ入力を基本にします。Node bridgeは検証、移行、補助連携が必要な場合だけ使います。

## Playwright検証

標準のライブフック検証は、直接注入、端末入力UI、連投耐久を分けて実行します。

```bash
npm run test:live
npm run test:live:storm
```

端末入力UIまで含めて確認する場合は、メニューの `端末入力` を開き、`端末受信ON` 後に `postMessage` / `BroadcastChannel` / `storage` / `CustomEvent` のいずれかでイベントを投入します。Node bridgeまで含めたlegacy検証を行う場合だけ、ローカルネットワーク許可や `127.0.0.1:8091` の起動状態を別途確認します。
