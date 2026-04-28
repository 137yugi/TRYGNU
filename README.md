# 1ビット・ヌンチャクサバイバーズ: OVERDRIVE

Phaser + TypeScript + Vite で再構築した、PC/SP対応の短時間サバイバーゲームです。プレイヤー本体を動かして慣性ヌンチャクの軌道を作り、敵群・契約・ギフトイベント・ボス戦を処理します。1ランは約3分30秒です。

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
2. プレイヤーを動かし、ヌンチャクのヘッドを敵に当てて倒します。
3. ウェーブを全滅させると安全時間に入り、XPオーブと装備を回収します。
4. 報酬回収後にレベルアップ3択や装備比較を選び、10ウェーブごとに変異を選びます。
5. 15ウェーブまたは `?boss_debug=1` で出るボスを倒します。
6. HPが0になると失敗です。ボス撃破、または制限時間生存でラン成功です。

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

- ビルド: メニューからジョブ8種と武器タイプ8種を選べます。
- スナップ: クールダウン制の高火力ヌンチャク加速です。
- 契約目標: 撃破、ノーダメージ、スナップ回数などの短期目標です。
- レベルアップ: ウェーブ全滅後の安全時間で3択スキルを選びます。38種類の能力があり、分裂ヌンチャク、高速回転、反射、衝撃波、連鎖、丸鋸、重力、低HP過給、会心、処刑、吸命、毒/炎/凍結、ドロップ運などをスタックできます。
- 変異: 10ウェーブごとの2択強化です。
- 装備比較: Diablo風の本体装備/ヌンチャク装備です。白コモン、青マジック、黄色レア、紫エピック、オレンジレジェンダリー、赤エンシェントの6段階で、37種類のスロット別アフィックスから複数付与されます。装備効果はレベルアップ能力とは別枠で重複します。
- 見た目: `public/assets/pixel/` のドット調SVGを Phaser に読み込み、職業、武器タイプ、敵、ドロップの見た目に反映します。
- ギフトイベント: 強襲、宝箱ラッシュ、岩壁封鎖、急襲ブーストの4種です。
- レジェンダリー: 金色の柱演出付きドロップです。
- ローカルスコア: ラン終了時にブラウザの `localStorage` に保存されます。

## メニュー

ゲーム中の `メニュー` / `M` で一時停止メニューを開けます。

- ビルド: キャラクター名生成、ジョブ、武器の選択
- 操作: 音ON/OFF、スナップ、詳細HUD、フラッシュ、シェイク
- 配信イベント: デモギフト、デモエネルギー補充、ライブ連動ON/OFF
- 取説: 用語集

メニュー中と変異選択中はゲーム進行が止まります。レベルアップと装備比較は、戦闘中の3秒選択ではなくウェーブ全滅後の安全時間で処理されます。

## 配信連動

メニューで `ライブ連動: ON` にすると `http://127.0.0.1:8091/events?max=12` を約900ms間隔でポーリングします。通常戦闘中は即時反映し、レベルアップ/装備比較/変異/報酬回収/次wave出現中はキューされます。キューはwaveが出揃ってから短い猶予後に1件ずつ反映します。

ローカルの TikFinity 互換ブリッジ:

```bash
node scripts/tikfinity_webhook_bridge.mjs
```

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
npm run test:longrun
npm run test:live
```

スクリーンショット、`state-*.json`、`errors-*.json` は `output/` に保存されます。

ブラウザ上の公開フック:

- `window.render_game_to_text()`: QA向け状態JSON文字列を返す
- `window.advanceTime(ms)`: シミュレーションを指定ミリ秒進めて状態JSON文字列を返す
- `window.injectTikfinityEvent(payload)`: ライブイベントを注入する
- `window.set_nunchaku_stretch_limit(value)`: ヌンチャク最大長を調整する

状態JSONの契約は [docs/state-contract.md](docs/state-contract.md)、機能別の実装/検証状況は [docs/features.md](docs/features.md)、QA方針は [docs/qa-plan.md](docs/qa-plan.md) を参照してください。

## クエリパラメータ

- `?seed=任意文字列`: ランの初期シードを指定
- `?boss_debug=1`: 開始直後にボスを出す
- `?phase3_debug=1`: `boss_debug` の互換指定
- `?balance=A|B`: バランスプロファイル指定
- `?boss_phase3=A|B`: `balance` の互換指定

## ドキュメント

- [docs/features.md](docs/features.md): 機能リストと検証方法
- [docs/controls.md](docs/controls.md): 操作取説
- [docs/equipment-design.md](docs/equipment-design.md): 装備レア度とアフィックス設計
- [docs/state-contract.md](docs/state-contract.md): `render_game_to_text()` 契約
- [docs/live-hook.md](docs/live-hook.md): ライブ連動
- [docs/action-spec.md](docs/action-spec.md): テストアクション仕様
- [docs/qa-plan.md](docs/qa-plan.md): QA計画
- [docs/rebuild-plan.md](docs/rebuild-plan.md): 再構築計画と次バックログ
- [progress.md](progress.md): 進捗要約
