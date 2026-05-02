# Live Hook

ゲームは TikFinity 互換のライブイベントを受け取れます。現行の本筋はローカル Node bridge ではなく、同一端末のブラウザ/配信補助ページ/自動化からゲーム画面へイベントを渡すライブ入力方式です。ゲーム本体は静的ページとして動き、サーバ常駐を前提にしません。

主要入力経路:

- `window.postMessage(envelope, "*")`
- `BroadcastChannel("stream-raid-live-v1").postMessage(envelope)`
- `localStorage.setItem("stream_raid_terminal_event_v1", JSON.stringify(envelope))`
- `window.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: envelope }))`
- `document.dispatchEvent(new CustomEvent("stream-raid-live-event", { detail: envelope }))`
- QA/Playwright向けの `window.injectTikfinityEvent(payload)`
- QA/Playwrightのライブ入力一括投入向けの `window.receiveTerminalLiveEvent(envelope)`

`envelope` は `{ source: "stream-raid-terminal", channel: "stream-raid-live-v1", event }` または `{ source: "stream-raid-terminal", channel: "stream-raid-live-v1", events }` 形式です。各イベントは `eventType` / `type`, `sender` / `uniqueId`, `nickname`, `user`, `giftName`, `comment` / `text` / `message`, `diamondCount` / `diamonds`, `repeatCount`, `id` などの TikFinity 互換フィールドを受け取り、ゲーム側で共通イベントへ正規化されます。ライブ入力がOFFの間、`source` が一致しないpayload、または `channel` が未指定/不一致のpayloadは無視します。

## UI

メニューの `ライブ入力` を開くと `TikTok ID` を入力できます。`@yrachac` のように `@` 付きで入れても保存時に整形されます。このIDは表示/送信元メモ用で、ゲーム本体がブラウザからTikTokへ直接接続するものではありません。内部の連携合言葉の既定値は `stream-raid-live-v1` です。通常メニューでは見せず、運営/QA確認時だけ `?admin=1` で表示します。

`ライブ入力ON` または `ライブ連動: OFF` を押すとライブ入力の受信を開始します。受信ON中は以下を待ち受けます。

- `message`: 同一ウィンドウ/親子フレームからの `postMessage`
- `broadcast`: 指定チャンネルの `BroadcastChannel`
- `storage`: `stream_raid_terminal_event_v1` の storage event
- `customEvent`: `stream-raid-live-event`

`受信テスト` は `?admin=1` の運営/QA表示だけに出し、同じ正規化経路へデモ反応を投入します。受信数、反映数、待機数は `streamHookStatus` に表示されます。`streamGaugeStatus` には `like` / `comment` で増える観客ゲージ、次ウェーブ頭の襲来予約、フォローによる追加ボス予約、発動中のスコア/ドロップ補正が表示されます。戦闘画面のライブオーバーレイには、ギフト/いいね/シェア/コメント/フォローが誰から来たかを表示します。

## 端末ライブ入力ヘルパー

`public/terminal-live.html` はサーバー処理なしで使う同一オリジンの補助ページです。ゲーム側で `ライブ入力` を開き、`TikTok ID` を保存して `ライブ入力ON` にしてから、メニュー内の `TikTok接続ページ` を開きます。接続ページURLには `room=<TikTok ID>` と内部チャンネルが付与されます。連携合言葉や受信テストは通常プレイヤーには出さず、運営/QA確認時だけ `?admin=1` で表示します。

ヘルパーではチャンネル名、ユーザー名、ギフト名、ダイヤ数、イベントIDを入力して送信できます。`like` / `chat` / `follow` / `share` / `gift` / `ad_obstacle` のプリセットを押すと、イベント種別、ラベル、ダイヤ数が即セットされ、手入力欄とプレビューに反映されます。送信時は `BroadcastChannel` と `localStorage` の両方へ投入し、ゲーム画面から開かれて `window.opener` が残っている場合は `opener.postMessage` も使います。

同じヘルパーからローカル TikTok Live bridge も読めますが、これは任意の開発/配信補助です。`Bridge確認` は `GET <Bridge URL>/health` で依存関係、接続状態、cursor、エラー詳細を表示します。`TikTok ID` を入れて `ID接続+開始` を押すと、ヘルパーがブラウザ上で入力された `Bridge URL` と `TikTok ID` を使い、端末内の bridge へ `POST <Bridge URL>/connect` を送り、そのまま受信を開始します。bridge未起動時は `npm run live:bridge:tiktok` の起動手順を表示します。`Bridge URL` は既定で `http://127.0.0.1:8091`、ポーリング間隔は既定で `1000ms` です。`Bridge開始` を押した場合は既存のbridge状態をそのまま読みます。受信開始時はまず `GET <Bridge URL>/stream` のSSE購読を試し、`status` で現在cursorへ同期し、以後の `liveEvent` だけをライブ入力へ流します。SSE非対応、起動失敗、open timeout、またはcursor未確定のopen直後errorでは `GET <Bridge URL>/events?since=0&max=1` で現在cursorへ同期し、過去イベントは再投入せず、以後 `GET <Bridge URL>/events?since=<cursor>&max=100` をブラウザ側でfetchします。cursor確定後の接続errorでは再同期せず、最後に受け取ったcursorからpollへ継続します。どちらの経路でも取得したイベントは `{ source: "stream-raid-terminal", channel, events }` envelope に変換し、手動送信と同じ `BroadcastChannel` / `localStorage` / `opener.postMessage` 経路へ流します。TikTok接続、`/connect`、`/stream`、`/events` は端末側Node bridgeとヘルパーだけの責務で、公開ゲーム本体はTikTokやbridgeへ直接接続しません。ゲーム本体にサーバー処理は追加しません。

bridge読み取りはブラウザのCORSとPrivate Network Access制約を受けます。`scripts/tiktok_live_bridge.mjs` は `Access-Control-Allow-Private-Network: true` を返し、Originは既定で `https://137yugi.github.io`、`file://` 相当の `null`、`localhost`、`127.0.0.1`、`::1` だけを許可します。必要なら `TIKTOK_LIVE_BRIDGE_ALLOWED_ORIGINS` にカンマ区切りで許可Originを追加します。ブラウザやOSの設定、HTTPSページからHTTP localhostへアクセスする構成、または `127.0.0.1` と `localhost` の混在でブロックされることがあります。静的配信した公開ページから配信者PCの `127.0.0.1` へ接続することはできず、そのページを開いている端末自身のlocalhostだけを指します。実運用ではゲーム画面とヘルパーを同じ端末・同じブラウザで開き、bridge URL は `http://127.0.0.1:8091` か `http://localhost:8091` に揃えてください。

## ライブ入力の例

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

タイトル/終了/メニュー/レベル選択/レベルアップ/変異/装備比較/報酬回収/次wave出現中のイベントはキューされます。レベル選択中に受けたギフトは次wave頭の反映対象として保持されますが、キューはwave開始直後には解放せず、waveが出揃ってから約2.4秒後に1件ずつ反映します。重複IDは無視します。キュー数と猶予は `run.live_queue` / `run.live_queue_release_timer` で確認します。

## イベント種別ごとの効果

正規化後のイベントは `gift` / `like` / `chat` / `follow` / `share` / `ad_obstacle` に分類されます。これは課金システムではなく、無料ライブ反応とギフトイベントをゲーム内の支援/妨害へ変換する仕組みです。

- `like`: 高頻度入力向けの軽量効果。ギフト経済、敵、広告、ドロップを増やさず、呪鎖武器の小さなスピンと演出だけを入れます。連打で喝采ゲージを加算し、満タンになると次ウェーブ頭の喝采フィーバーを予約します。
- `chat` / `comment`: 小さな観客乱入。ギフトダイヤは増やさず、少数の敵を追加します。コメントは喝采ゲージを大きめに加算します。
- `follow`: 支援効果。デモエネルギー、微回復、短い無敵を付与し、次ウェーブ頭に追加大ボスを予約します。
- `share`: 補給効果。プレイヤー付近へXP/低確率アイテムを落とし、喝采ゲージも加算します。
- `gift`: 既存のギフト挙動。ダイヤ加算、ランダムなギフト効果、広告キューを維持します。
- `ad_obstacle`: 既存のスポンサー広告おじゃま挙動。ダイヤ加算と広告表示/待機キューを維持します。

喝采ゲージは1ラン内で使うライブ入力軸で、1waveごとの獲得量を `run.live_applause_wave_gain` に計測します。いいね・コメント・シェアで加算され、ギフトのダイヤ/広告/ギフト効果とは別扱いです。満タンになると `run.live_applause_fever_ready` と `run.live_pending_surges` が立ち、次の `startWave` で喝采フィーバーが発生します。このウェーブ中は `run.live_applause_fever_active`、`run.live_wave_score_bonus`、`run.live_wave_drop_bonus` で確認でき、スコア倍率とドロップ抽選に補正が乗ります。次上限は直前waveの獲得量を超過分込みで120%した値へ更新し、下げないため進むほど溜まりにくくなります。フォロー予約は `run.live_pending_bosses` で確認でき、次ウェーブ頭に通常ボスとは別の大ボスが追加されます。どちらもサーバー実装なしで `window.injectTikfinityEvent({ eventType: "like" | "comment" | "share" | "follow", ... })` から検証できます。

## live storm/連投耐久

連投耐久は、専用GameSimがなくても既存フックで確認できます。短時間に多数のTikFinity互換payloadを投入し、ゲーム本体は同じ正規化・重複排除・キュー制御を通します。

標準コマンドは `npm run test:live:storm` です。このテストは `#connectTikTokBtn` でライブ入力をONにしたうえで、`window.receiveTerminalLiveEvent({ source: "stream-raid-terminal", channel, events })` から一括投入し、連投圧、キュー上限、重複ID、pause中キュー、復帰後の解放を確認します。個別の `postMessage` / `BroadcastChannel` / `localStorage` / `CustomEvent` 経路は `scripts/test_terminal_live_input.mjs` が担当し、通常UIで管理者機能が隠れ、送信者オーバーレイが出ることは `scripts/test_tiktok_live_overlay_ui.mjs` が担当します。

確認する入力:

- `window.injectTikfinityEvent(payload)` の直接注入。
- ライブ入力ON後の `window.receiveTerminalLiveEvent(envelope)` による一括投入。
- `scripts/test_terminal_live_input.mjs` による `window.postMessage(envelope, "*")`、`BroadcastChannel(<連携合言葉>)`、`localStorage` の `stream_raid_terminal_event_v1`、`stream-raid-live-event` CustomEvent。

確認する状態:

- `run.live_queue` と `run.live_queue_release_timer` が数値として維持される
- `run.live_pressure`、`run.live_storm`、`run.dropped_live_events` で連投圧、スポンサー襲来状態、圧縮/破棄数を確認できる
- `run.gift_event`、`run.active_ads`、`run.ad_queue`、`run.gift_obstacles` が連投後もJSON化できる
- `score`、`economy.gift`、`economy.diamonds` が同一 `id` の重複投入で二重加算されない
- `#streamHookStatus` の受信数、適用数、キュー数が画面上で破綻しない

## ローカル Node bridge

Node bridge は現行の主経路ではなく、legacy/開発補助扱いです。公開ゲーム本体はbridgeへ直接接続しません。`?admin=1&local_bridge=1` のQA/debug時だけ旧直結経路を明示的に使えます。標準の `npm run test:live` は直接注入、ライブ入力UI、端末ヘルパー、bridge endpoint の回帰をまとめて確認します。

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

このブリッジは `tiktok-live-connector` がインストール済みなら `gift` / `like` / `chat` / `follow` / `share` / `subscribe` / `member` を受け取り、ゲーム向けの共通イベントへ正規化します。`/connect` はTikTok IDへの接続開始、`/events` はHTTPポーリング、`/stream` は低遅延SSEを担当します。`/stream` は `id` と `retry` を出し、再接続時は `Last-Event-ID` または `?since=` から保持済みの未配信イベントを再送します。保持件数は `TIKTOK_LIVE_BRIDGE_MAX_EVENTS` で、既定は800件です。ゲーム本体はbridgeへ直接接続せず、`public/terminal-live.html` がブラウザから `/connect`、`/stream` 優先、失敗時 `/events` で読み取り、ライブ入力envelopeへ中継します。公開ゲーム本体はTikTok接続用の秘密情報、外部接続状態、bridge URLを保持しません。

```bash
curl http://127.0.0.1:8091/health
curl 'http://127.0.0.1:8091/events?since=0&max=12'
curl -X POST http://127.0.0.1:8091/connect \
  -H 'Content-Type: application/json' \
  -d '{"username":"your_tiktok_id"}'
```

`tiktok-live-connector` が未インストール、TikTok ID未指定、配信未開始、接続失敗の場合でもブリッジは起動します。`/health` と `/events` の `connector.error` にJSONで理由が出ます。エラーは `{ code, message, detail, at }` 形式に揃えます。依存を入れる場合は以下を実行します。

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

標準のライブフック検証は、直接注入、ライブ入力UI、連投耐久を分けて実行します。

```bash
npm run test:live
npm run test:live:storm
```

ライブ入力UIまで含めて確認する場合は、メニューの `ライブ入力` を開き、`ライブ入力ON` 後に `postMessage` / `BroadcastChannel` / `storage` / `CustomEvent` のいずれかでイベントを投入します。通常UIで `TikTok接続ページ` と `配信権限登録` が見え、連携合言葉や受信テストが隠れることは `npm run test:live:ui` で確認します。Node bridgeまで含めた実配信確認を行う場合は、`npm run live:bridge:tiktok` を起動したうえで `public/terminal-live.html` の `ID接続+開始` を使います。

ヘルパー単体の `/events` ポーリングfallbackと `/stream` SSE変換は以下で確認できます。

```bash
npm run test:live:terminal-helper
```
