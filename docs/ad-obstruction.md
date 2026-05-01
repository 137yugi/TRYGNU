# 広告おじゃま運営設定

広告おじゃまはギフト発生時に、既存のギフト効果へ追加で必ず抽選されます。ライブ連動とローカルデモボタンはどちらも `GameSim.applyGift()` に集約されるため、同じ広告妨害ルールが適用されます。

## 管理ファイル

- 既定カタログ: `src/content/ads.ts`
- 運営差し替えJSON: `public/config/ads.json`
- 表示: `src/scenes/GameScene.ts`
- 状態/抽選: `src/sim/GameSim.ts`
- QA状態: `render_game_to_text()` の `run.selected_ad_id` / `run.active_ads` / `run.ad_queue`

公開版は起動時に `./config/ads.json` を読み、成功した場合はその内容を広告カタログとして使います。別ファイルを試す場合は `?ads_config=https://example.com/ads.json`、読み込みを止める場合は `?ads_config=off` を付けます。

## カタログ項目

`AD_CATALOG` と `public/config/ads.json` の各広告は以下で管理します。

| 項目 | 意味 |
| --- | --- |
| `id` | 運営管理用の一意ID |
| `type` | `banner` または `video`。動画は現時点では実動画ではなく動画風パネル |
| `brand` / `title` / `copy` | 画面表示テキスト |
| `weight` | 抽選重み。大きいほど出やすい |
| `minWave` | 出現開始wave |
| `duration` | 表示秒数 |
| `lane` | `top` / `middle` / `bottom` / `random` |
| `speed` | 横スクロール速度。正数は左から右、負数は右から左 |
| `opacity` | 透明度。SP操作不能を避けるため概ね `0.38-0.82` 推奨 |
| `rarity` | `common` / `rare` / `epic` / `legendary`。表示アクセント色に使う |

## 初期広告

- `banner-ion-drink`: `GUILD TONIC`。上段を横切る低透明度バナー
- `banner-blacksmith-sale`: `BLACKSMITH SALE`。下段を逆方向へ流れる鍛冶屋バナー
- `banner-neuro-bank`: `CROWN BANK`。中央視界を圧迫する長めの賞金前借りバナー
- `video-glia-news`: `ARENA NEWS`。スキャンライン付き速報動画風パネル
- `video-axon-stream`: `BARD STREAM`。再生バー付き動画風パネル
- `video-boss-sponsor`: `DRAGON SPONSOR`。Wave12以降の大型スポンサー動画風パネル

## 抽選ルール

1. ギフト発生時に `minWave <= current wave` の広告から抽選します。
2. `weight` を基本確率に使います。
3. ギフトtierが高いほど動画広告の重みが少し上がります。
4. 同時表示上限は序盤2件、Wave10以降3件です。上限を超えた分は `run.ad_queue` に入り、空き次第流れます。

## QA観点

- ギフトボタンまたは `window.injectTikfinityEvent()` 後に `run.selected_ad_id` が入る。
- `run.active_ads[]` に `id/type/x/y/w/h/life_left/speed/opacity/rarity` が出る。
- `eventType: "ad_obstacle"` は通常ギフト効果を出さず、広告だけを発火する専用検証イベントとして扱う。
- 連続ギフト時に同時表示上限を超えた分が `run.ad_queue[]` へ積まれる。
- SP横/縦で操作ボタンがDOM側に残り、広告はCanvas内の視界妨害だけに留まる。
