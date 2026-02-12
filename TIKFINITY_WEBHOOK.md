# TikFinity Webhook Bridge

このプロジェクトでは、TikFinity からの Webhook をローカルで受けてゲームへ取り込むために `scripts/tikfinity_webhook_bridge.mjs` を使います。

## 起動

1. ゲームを配信

    python3 -m http.server 8081

2. Webhook ブリッジを別ターミナルで起動

    node scripts/tikfinity_webhook_bridge.mjs

3. ゲーム画面で `LIVE HOOK: OFF` を押して `ON` に変更  
   既定接続先は `http://127.0.0.1:8091/events` です。

## TikFinity 側設定

- Webhook URL: `http://<配信PCのIP>:8091/webhook/tikfinity`
- 受信形式: JSON (`Content-Type: application/json`)

## 受信イベント対応（初期マッピング）

- `gift`: payload の `diamonds/diamondCount/value` を優先してダイヤ換算
- `like`: `likeCount` を 120 で割ってダイヤ換算（最低 1）
- `share`: 2 ダイヤ
- `follow`: 1 ダイヤ
- `subscription/member`: 22 ダイヤ
- `chat/comment`: 1 ダイヤ

## テスト送信例

    curl -X POST http://127.0.0.1:8091/webhook/tikfinity \
      -H "Content-Type: application/json" \
      -d '{"eventType":"gift","sender":"demo_user","giftName":"Rose","diamondCount":15,"repeatCount":2}'

イベント確認:

    curl -s "http://127.0.0.1:8091/events?since=0&max=10"

## 備考

- 重複 `id/eventId/messageId/msgId` はブリッジ側で排除します。
- ゲームが `pause` 中または非実行中に届いたイベントはログに記録され、戦闘効果は即時適用しません。
