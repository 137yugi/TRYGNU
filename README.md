# 呪われた配信闘技場 / STREAM RAID ARENA

Phaser + TypeScript + Vite で再構築した、PC/SP/iPad対応のウェーブ制サバイバーゲームです。呪われた闘技場の挑戦者を動かして呪鎖武器の軌道を作り、観客モンスター、興行契約、配信ギフト由来の罠、王者ボス戦を処理します。ボス撃破で終了せず、HPが尽きるまでウェーブと王者ボスが強化され続けます。

コンセプトは「呪われた配信闘技場: STREAM RAID ARENA」です。TikTokギフトは観客席から投げ込まれる呪い、宝箱、看板罠、スポットライト過熱として戦場に落ち、配信映えする事故と稼ぎどころを作ります。

内部API名や保存キーには互換維持のため `nunchaku` / `body` / `nunchaku_overdrive_scores_v1` などの旧名が残ります。文書とUI表示では「呪われた配信闘技場: STREAM RAID ARENA」を正とし、旧名はテスト/外部QA/既存セーブ互換のための内部キーとして扱います。

## 起動

```bash
npm install
npm run dev
```

ブラウザで `http://127.0.0.1:5173` を開きます。

本番ビルド:

```bash
npm run build
```

型チェック:

```bash
npm run check
```

## 遊び方

1. `ラン開始` を押す、または `Enter` / キャンバスクリックで開始します。
2. 挑戦者を動かし、呪鎖武器のヘッドを観客モンスターに当てて倒します。
3. ウェーブを全滅させると安全時間に入り、XPオーブと装備を回収します。
4. 報酬回収後にレベルアップ3択や装備比較を選び、10ウェーブごとに変異を選びます。
5. 15ウェーブまたは `?boss_debug=1` で出る王者ボスを倒します。
6. 王者ボス撃破後も次のウェーブへ進み、以後は10ウェーブごとにさらに強い王者ボスが出ます。
7. HPが0になるとラン終了です。ボス突破時と終了時にローカルスコアが保存されます。

## 操作

| 環境 | 操作 |
| --- | --- |
| キーボード | `WASD` / 矢印で移動、`Space` でスナップ、`Enter` で開始/選択、`M` でメニュー、`Esc` で閉じる、`1/2/3` で選択 |
| 追加キー | `F` でフルスクリーン、`H` でデバッグHUD |
| マウス | キャンバスをクリック/ドラッグして移動、`SNAP` ボタンでスナップ |
| SP横 | ステージ全画面。画面ドラッグで移動、右下 `SNAP`、右上 `メニュー` / `全画面` |
| SP縦 | ステージ全画面。下部オーバーレイに `開始/再開` / `スナップ` / `メニュー` |

詳しい操作は [docs/controls.md](docs/controls.md) を参照してください。

## ラン中の要素

- ビルド: メニューから闘士タイプ8種と呪鎖武器タイプ8種を選べます。
- スナップ: クールダウン制の高火力な呪鎖武器加速です。
- 契約目標: 撃破、ノーダメージ、スナップ回数などの興行チャレンジです。
- レベルアップ: ウェーブ全滅後の安全時間で3択スキルを選びます。38種類の能力があり、幻影鎖、高速回転、反射、衝撃波、連鎖、鋸鉄球、重力、低HP過給、会心、処刑、吸命、毒/炎/凍結、ドロップ運などをスタックできます。
- 変異: 10ウェーブごとの2択強化です。
- 装備比較: Diablo風の闘士防具/呪鎖武器装備です。白コモン、青マジック、黄色レア、紫エピック、オレンジレジェンダリー、赤エンシェントの6段階で、37種類のスロット別アフィックスから複数付与されます。装備効果はレベルアップ能力とは別枠で重複します。
- 見た目: Image 2で生成した `public/assets/generated/` のラスターアセットを Phaser に読み込み、闘士タイプ、呪鎖武器タイプ、敵、ボス、装備の見た目に反映します。装備比較にも候補/現在装備の画像を表示します。床/オーブなどの軽量補助素材だけ既存SVGを残しています。
- ギフトイベント: 観客乱入、宝箱投げ込み、呪い看板封鎖、スポットライト過熱の4種です。
- レジェンダリー: 金色の柱演出付きドロップです。
- ローカルスコア: 2週間ごとのシーズンID付きで、王者ボス撃破チェックポイントとラン終了時にブラウザの `localStorage` に保存されます。ランクイン時は名前/SNS/一言コメントを任意入力できます。
- 意見/文句: メニューのフォームから自由入力でき、シーズンID付きで `localStorage` に保存されます。

## メニュー

ゲーム中の `メニュー` / `M` で一時停止メニューを開けます。

- ビルド: 闘士名生成、闘士タイプ、呪鎖武器タイプの選択
- 操作: 音ON/OFF、スナップ、詳細HUD、フラッシュ、シェイク
- 配信イベント: デモギフト、歓声補充、ライブ連動ON/OFF
- 取説: 用語集
- シーズン: 現在の2週間シーズン、ローカルランキング
- 意見/文句: 次シーズン改善用の自由入力フォーム

メニュー中と変異選択中はゲーム進行が止まります。レベルアップと装備比較は、戦闘中の3秒選択ではなくウェーブ全滅後の安全時間で処理されます。

## 配信連動

本線は端末側ブラウザ入力です。配信用PCやスマホのブラウザでゲームを開き、メニューの `配信イベント` からデモギフトまたはブラウザ入力イベントを入れると、サーバー常駐なしでギフトイベントとして処理されます。自動テストや配信ツール連携では `window.injectTikfinityEvent(payload)` にイベントを渡します。通常戦闘中は即時反映し、レベルアップ/装備比較/変異/報酬回収/次wave出現中はキューされます。キューは重複IDを無視し、waveが出揃ってから短い猶予後に1件ずつ反映します。

Node bridge は legacy 補助です。常駐サーバーを本線にせず、必要な検証や既存配信環境の互換用にだけ使います。起動すると `/events` と `/stream` を外部ツール向けに公開しますが、現行ゲームUIは通常運用でこのbridgeをポーリングしません。bridge由来のイベントを使う場合は、端末入力ヘルパーや自動化から `window.receiveTerminalLiveEvent()` へ渡します。

legacy Node bridge をTikTok IDだけで接続する場合:

```bash
npm run live:bridge:tiktok -- your_tiktok_id
```

legacy Node bridge をIDなしで起動し、外部補助ツール側から接続先IDを渡すこともできます。

```bash
npm run live:bridge:tiktok
```

`tiktok-live-connector` が入っていれば TikTok Live のギフトなどを `/events` と `/stream` で提供します。未インストールでも legacy Node bridge は起動し、`/health` のJSONに `dependency_missing` が出ます。デモ注入は依存なしで使えます。

GitHub Pages版から legacy Node bridge へ接続する場合、Chrome 142以降のChromium系ブラウザではLocal Network Accessの許可が必要です。ゲーム内ステータスが `ローカルネットワーク許可が必要` になった場合は、ブラウザのローカルネットワーク接続許可を有効にしてください。ローカル開発URL `http://127.0.0.1:5173/` で遊ぶ場合は同一ローカル側なのでこの制限を受けにくくなります。

```bash
curl -X POST http://127.0.0.1:8091/demo \
  -H 'Content-Type: application/json' \
  -d '{"sender":"demo_user","giftName":"Rose","diamondCount":15}'
```

依存を入れる場合:

```bash
npm install tiktok-live-connector
```

ローカルの TikFinity 互換ブリッジ:

```bash
node scripts/tikfinity_webhook_bridge.mjs
```

`tiktok-live-connector` は公式の本番APIではないため、TikTok側の仕様変更や配信/アカウント状態で接続できない場合があります。

自動テストやブラウザコンソールでは以下でも注入できます。

```js
window.injectTikfinityEvent({
  eventType: "gift",
  sender: "demo_user",
  giftName: "Rose",
  diamondCount: 15,
  repeatCount: 2
});
```

詳細は [docs/live-hook.md](docs/live-hook.md) を参照してください。

## デバッグ/検証

開発サーバ起動後に Playwright クライアントを実行します。

```bash
npm run test:smoke
npm run test:wave
npm run test:equip
npm run test:responsive
npm run test:portrait
npm run test:forms
npm run test:ad
npm run test:longrun
npm run test:live
```

スクリーンショット、`state-*.json`、`errors-*.json` は `output/` に保存されます。

ブラウザ上の公開フック:

- `window.render_game_to_text()`: QA向け状態JSON文字列を返す
- `window.advanceTime(ms)`: シミュレーションを指定ミリ秒進めて状態JSON文字列を返す
- `window.injectTikfinityEvent(payload)`: ライブイベントを注入する
- `window.set_nunchaku_stretch_limit(value)`: 呪鎖武器の最大長を調整する。内部API名は互換維持で `nunchaku` のままです。

状態JSONの契約は [docs/state-contract.md](docs/state-contract.md)、機能別の実装/検証状況は [docs/features.md](docs/features.md)、QA方針は [docs/qa-plan.md](docs/qa-plan.md) を参照してください。

## クエリパラメータ

- `?seed=任意文字列`: ランの初期シードを指定
- `?boss_debug=1`: 開始直後に王者ボスを出す
- `?phase3_debug=1`: `boss_debug` の互換指定
- `?balance=A|B`: バランスプロファイル指定
- `?boss_phase3=A|B`: `balance` の互換指定

## ドキュメント

- [docs/features.md](docs/features.md): 機能リストと検証方法
- [docs/controls.md](docs/controls.md): 操作取説
- [docs/equipment-design.md](docs/equipment-design.md): 装備レア度とアフィックス設計
- [docs/state-contract.md](docs/state-contract.md): `render_game_to_text()` 契約
- [docs/season-loop.md](docs/season-loop.md): 2週間シーズンとCodex改善運用
- [docs/live-hook.md](docs/live-hook.md): ライブ連動
- [docs/action-spec.md](docs/action-spec.md): テストアクション仕様
- [docs/qa-plan.md](docs/qa-plan.md): QA計画
- [docs/rebuild-plan.md](docs/rebuild-plan.md): 再構築計画と次バックログ
- [progress.md](progress.md): 進捗要約
