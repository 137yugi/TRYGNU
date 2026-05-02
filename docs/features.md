# 機能リスト

実装状態は 2026-05-03 時点の `src/` 実装に合わせたものです。検証は原則として `npm run check` / `npm run build` と、開発サーバ起動後の Playwright コマンドで確認します。

## 実装済み

| 機能 | UI入口/API | 実装状態 | 検証方法 | 合格条件 |
| --- | --- | --- | --- | --- |
| スタート画面 | `#startScreen`, `.start-shell`, `#startJobSelect`, `#startWeaponSelect`, `#startJobImage`, `#startWeaponImage`, `#openStartMenuBtn` | 実装済み | `npm run test:start:style:rare`, `npm run test:smoke`, responsive screenshots | タイトル/シーズン帯をビルド枠外に出し、ビルド面が全幅を使う。SP縦でも武器運用まで初期表示内に収まり、PC/SP縦横で開始/メニューへ到達できる |
| ラン開始/再挑戦 | `#startBtn`, `#mobileStartBtn`, `Enter`, キャンバスクリック | 実装済み | `npm run test:smoke` | `mode` が `running` になり、終了後に再開始できる |
| PC移動 | `WASD` / 矢印 | 実装済み | `npm run test:smoke`、`render_game_to_text()` | `player.x/y` が変化し、ワールド外へ出ない |
| ポインタ/SP移動 | キャンバスクリック/ドラッグ | 実装済み | `npm run test:responsive` | `player.target_x/y` がポインタ位置へ更新される |
| SP全画面ステージ | CSS `visualViewport`, PWA meta, `display_override`, `#fullscreenBtn` | 実装済み | WebKit/Chromium responsive | SP横/縦で `.game-frame` と Canvas が viewport 全体を使い、Safari通常タブではブラウザバー分を差し引いて操作UIがsafe-area内に残る |
| SP縦長ステージ | `configureWorldForViewport()`, `canvas.layout` | 実装済み | `390x844`, `768x1024` Playwright | 縦画面では `canvas.layout: portrait` になり、内部座標も縦長になる |
| SP縦操作デッキ | `#mobileStartBtn`, `#mobileMenuBtn` | 実装済み | `npm run test:responsive` | 縦画面でも下部overlayから開始/メニューに到達できる |
| 呪鎖ヌンチャク慣性 | 移動入力、Canvas描画、simulation | 実装済み | `npm run test:nunchaku:inertia`, `render_game_to_text()` | 停止中は過剰に回り続けず、移動/方向転換でヘッドと分身が慣性追従し、途中の装備/射程更新でも速度が消えない |
| 進行方向近接スラッシュ | `comet_knuckle`, `anchor_mace`, `combat.visual_effects` | 実装済み | `npm run test:melee:slash` | 近接武器はプレイヤー進行方向の半円内だけを斬り、命中時に `kind: melee_slash` の専用斬撃FXを出す。背面の敵には発火せず、旧 `reflect` FX に誤分類されない |
| HP/被弾/失敗 | 接触ダメージ | 実装済み | longrun、状態JSON | HP0で `mode: ended`、`run.ended_reason: HP_ZERO` |
| ウェーブ報酬回収 | wave clear、XP/装備ドロップ | 実装済み | smoke / longrun、状態JSON | `run.wave_state: reward` でドロップを回収し、回収後に次の選択/ウェーブへ進む |
| XP/レベルアップ3択 | ウェーブ全滅後、`1/2/3`、クリック | 実装済み | `npm run test:wave` / pause recovery | `run.ui_panels.levelup_open` が開き、38種類以上の能力から選択で復帰 |
| スタック可能スキル | レベルアップ3択、変異 | 実装済み | skill loop、状態JSON | `combat.skill_stacks` に分裂呪鎖/高速回転/反射/衝撃波/連鎖/丸鋸/重力/低HP過給/会心/処刑/吸命/状態異常などの重複数が出る |
| スタイリッシュランク倍率 | `#styleMeterPanel`, `combat.style` | 実装済み | `npm run test:start:style:rare`, `npm run test:style:applause:slot` | 呪鎖武器の高速移動と連続撃破で `rank` と `multiplier` が上がり、以前より速く減衰して0まで落ちるとDへ戻る。倍率はXP、ドロップ運、撃破ボーナスに他効果と重複する |
| 契約目標 | HUD `#objectiveChip` | 実装済み | longrun、状態JSON | `objective` に type/progress/target/timer が出る |
| 変異2択 | Wave10ごと | 実装済み | `npm run test:longrun` | `run.ui_panels.mutation_open` から選択で復帰 |
| Diablo風装備 | ウェーブ報酬回収、pickup compare | 実装済み | `npm run test:equip` | 闘士防具/呪鎖武器装備として6レア度、37アフィックス、複数affix、`inventory.equipment_slots/equipment_mods` が出る |
| 本体/ヌンチャク装備分離 | pickup compare, state JSON | 実装済み | `npm run test:equip` | 内部スロット `body` と `nunchaku` の2枠が別々に保持され、合算modが再計算される |
| 装備比較 | ウェーブ報酬回収、`1/2`、装備/破棄ボタン | 実装済み | pickup compare / `npm run test:equip` | `inventory.pickup_compare.drop_item.asset_id` が出て、候補/現在装備の画像を表示し、装備/破棄を選ぶと復帰する |
| 装備スロット演出 | pickup compare内 `#slotEffectStage`, `inventory.slot_event` | 実装済み | `npm run test:style:applause:slot` | 装備pickup時に低確率で無料スロット演出が出て、3リール、settled表示、bonus/jackpot報酬、WebAudio SFXが装備比較を壊さず動く |
| レアドロップ射倖演出 | Phaser drop beam, WebAudio `rareDrop` / `ancientDrop` | 実装済み | `npm run test:start:style:rare` | レア以上の装備ドロップ時に光柱、星形レイ、フラッシュ、シェイク、`RARE/EPIC/LEGENDARY/ANCIENT DROP` 表示が出る。レジェンダリー以上は専用ジングルを要求する |
| 観客モンスター | chaser / stalker / bruiser / zoner | 実装済み | longrun、状態JSON | `enemies[].role` が観測でき、敵数がcap内に収まる |
| 王者ボス/無限ウェーブ | Wave15、以後10waveごと、`?boss_debug=1`、`?phase3_debug=1` | 実装済み | `npm run test:longrun` | `run.boss` が出現し、撃破で `run.boss_kills` が増え、`run.next_boss_wave` が更新され、`mode: running` のまま継続する |
| ボスバランス互換 | `?balance=A|B`, `?boss_phase3=A|B` | 実装済み | URL付きlongrun | 指定プロファイルで起動し、互換クエリでもエラーにならない |
| ギフト4種 | `#gift100Btn`, `#gift500Btn`, `#gift1000Btn`, live event | 実装済み | `npm run test:live` | 観客乱入/報酬/封鎖/過給系のギフト効果が `run.gift_event` に反映 |
| ギフト壁封鎖 | gift wall event | 実装済み | live / 状態JSON | `run.gift_obstacles` に `type: gift_wall` が出る |
| 広告おじゃま | ギフトボタン、live event、`src/content/ads.ts` | 実装済み | live / 状態JSON / screenshot | ギフトごとに `run.selected_ad_id` が更新され、`run.active_ads` または `run.ad_queue` にバナー/動画風広告が出る |
| 運営広告カタログ | `public/config/ads.json`, `src/content/ads.ts`, `docs/ad-obstruction.md` | 実装済み | `npm run test:ad`、docs確認 | 広告ごとに `type/weight/minWave/duration/lane/speed/opacity/rarity` を調整できる |
| TikTok喝采フィーバー | `run.live_applause_*`, `run.live_wave_score_bonus`, `run.live_wave_drop_bonus` | 実装済み | `npm run test:live:variety`, `npm run test:live:storm` | いいね・コメント・シェアでwave別の喝采量を計測し、満タンなら次wave頭にフィーバー。直前wave獲得量の120%へ次上限を上げ、ギフト経済とは別軸で進むほど溜まりにくくする |
| レジェンダリー | legendary drop | 実装済み | longrun / legendary scenario | `economy.legendary` が増え、`drops[].kind: legendary` が出る |
| メニュー | `#menuFloatingBtn`, `#mobileMenuBtn`, `M` | 実装済み | menu/glossary flow / responsive screenshots | `run.ui_panels.menu_open` が true になり、全画面メニューがPC/SP横/SP縦/iPadで操作できる |
| ビルド選択 | `#jobSelect`, `#weaponSelect`, `#startJobSelect`, `#startWeaponSelect`, `#startJobImage`, `#startWeaponImage`, `#menuJobImage`, `#menuWeaponImage`, character roll | 実装済み | `npm run test:melee:slash`, menu flow、状態JSON、responsive screenshots | 闘士ジョブ/呪鎖武器の選択がラン前ステータスと画像プレビューへ反映され、ロール、難度、HP/速度/火力倍率、初期HP、移動速度、武器込み火力、説明、立ち回り、おすすめ武器、武器射程/打点/火力/特性/説明/運用がスタート画面とメニューの両方で同期する |
| ゲーム内ステータス確認 | `#runBuildPanel`, `#runHpDetailVal`, `#runSpeedDetailVal`, `#runPowerDetailVal` | 実装済み | smoke / responsive screenshots | ラン中に現在HP、速度、武器込み火力、ジョブロール、wave/LV/闘士名を小型パネルで確認でき、PC/SP縦横/iPadで操作UIを塞がない |
| ラスター/ファンタジービジュアル | `public/assets/generated`, Phaser preload | 実装済み | responsive screenshots / `npm run test:equip` | 闘士/武器/観客モンスター/ボス/装備/ドロップが画像アセットで描画される。背景は `arena-map.png` を1枚絵としてcover表示し、巨大な図形クロップが出ない |
| 音声/表示設定 | 音、詳細HUD、フラッシュ、シェイク | 実装済み | menu flow、`H` | Web Audio効果音、`run.debug_hud`、ボタン表示が同期する |
| 用語集 | `#openGlossaryBtn` | 実装済み | menu/glossary flow | DOM表示と `run.ui_panels.glossary_open` が一致 |
| ライブ連動 / Smart Connect | `#streamHookBtn`, `#tiktokRoomInput`, `public/config/live-relay.json`, `window.injectTikfinityEvent`、legacy Node bridge | 実装済み | `npm run test:live`, `npm run test:live:browser-relay`, `npm run test:live:direct-spike`, `npm run test:live:ui`, `npm run test:bridge:endpoints` | 通常UIではTikTok IDとライブ入力ONだけを見せ、設定ファイル由来の外部WSSへ `{room}` / `{channel}` を置換して接続する。詳細WSS、接続ページ、直結診断、合言葉、受信テストは `?admin=1` のみ表示。TikFinity風JSONは既存ライブ処理へ流し、通常戦闘中は即時反映、選択/報酬/次wave出現中は `run.live_queue` に積まれ、重複IDは無視され、猶予後に順次反映される |
| Safari/PWA直結診断 | `public/tiktok-direct-spike.html`, `#tiktokDirectProbeLink` | 実装済み | `npm run test:live:direct-spike` | iOS/iPad Safari/PWA単体でTikTok Live直結を試し、`DIRECT_OK` または `CORS_BLOCKED` / `SIGNED_WS_REQUIRED` / `BROWSER_WS_BLOCKED` / `TIKTOK_OFFLINE` / `UNKNOWN` をJSONで保存・表示する。通常UIには出さず管理者診断として扱う |
| シーズン | 2週間ID、残日数、ランキング紐づけ | 実装済み | menu / localStorage確認 / `npm run test:season:storage` | `synapse_storm_season_v1` とスコア行の `seasonId` が同期 |
| ローカルスコア | boss clear checkpoint / HP0終了 / メニューのシーズン欄 / `getSeasonPersonalBest(seasonId)` | 実装済み | restart / localStorage確認 / `npm run test:season:storage` | ボス撃破時と終了時に `nunchaku_overdrive_scores_v1` へシーズン別最大20件保存し、同一 `seasonId` の最高スコアを自己ベストとして返す。メニュー一覧は上位6件のみ表示し、保存記録/登録済み件数は上位6件ではなく保存済み行全体から数える |
| ランキング宣伝 | 終了時フォーム | 実装済み | ended flow / localStorage確認 | 名前/SNS/一言コメントをランキング行へ保存 |
| オンラインランキング | Worker API, `public/config/leaderboard.json`, `?leaderboard=...` | 実装済み / エンドポイント設定待ち | remote leaderboard mock / `npm run check` | ローカル保存成功時に `POST /leaderboard` へ非同期送信し、メニューで `GET /leaderboard?season=...` のグローバル上位を表示。失敗時はローカルランキングへフォールバック |
| 意見/文句 | メニュー内フォーム | 実装済み | menu / localStorage確認 | `synapse_storm_feedback_v1` へシーズンID付きで自由入力を保存 |
| 運営用シーズンJSON/CSV | `#seasonExportBtn`, `#seasonCsvExportBtn`, `window.exportSeasonReview()` | 実装済み | console / menu / `npm run test:season:storage` | 意見/ランキングを次シーズン改善レビュー用JSONとして取得できる。通常UIでは管理者向けボタンを非表示にし、JSON内の `csv.leaderboard` / `csv.feedback` とCSVコピー機能は管理/デバッグ用として維持する |
| QA公開フック | `render_game_to_text`, `advanceTime`, `injectTikfinityEvent`, `exportSeasonReview`, `set_nunchaku_stretch_limit` | 実装済み | Playwright / console | APIが例外なく状態JSON / boolean / string / void を仕様通り返す |
| PC/SPレスポンシブ | CSS viewport, WebKit option | 実装済み | `npm run test:responsive`, `npm run test:responsive:webkit` | 主要viewportでHUD/ボタン/モーダルが操作不能に重ならない |

## 未実装 / 制限事項

| 項目 | 状態 | 理由/現状 | 次の検証観点 |
| --- | --- | --- | --- |
| オンラインランキング本番接続 | 設定待ち | Cloudflare Worker雛形とクライアント同期は実装済み。公開運用にはWorker/KVまたはDurable Objectを作成し、`public/config/leaderboard.json` の `endpoint` を差し替える必要がある。GitHubへ直接書き込む方式はトークン露出と競合があるため不採用 | `workers/leaderboard-worker.js` をCloudflareへ配置し、Pages版から `GET /leaderboard` / `POST /leaderboard` を実データで確認 |
| 実課金/収益計算 | 未実装 | 旧課金UIは削除済み、デモエネルギーとイベント換算のみ | 配信イベントの安全なデモ表現を維持 |
| セーブデータ移行 | 未実装 | 旧 `game.js` 版からの移行処理なし | 旧キーが残る環境で副作用がないか確認 |
| アクセシビリティ完全対応 | 部分実装 | `aria-label`、dialog属性、表示中overlayのTab循環は実装済み。読み上げ検証は未完 | キーボードのみ操作とスクリーンリーダー検証 |
| 実機タッチ検証 | 未完 | 自動responsive検証が中心 | iOS Safari / Android Chromeで入力遅延とviewportを確認 |
| `file://` 直開き | 部分対応 | `dist/web/index.html` は相対パスでJS/CSS/assetsを参照するが、リポジトリ直下の `index.html` は Vite 開発用の `/src/main.ts` を読むため直開き対象外 | ローカル確認は `npm run dev`、直開き確認は `npm run build` 後の `dist/web/index.html` で行う |

## 検証コマンド

```bash
npm run check
npm run build
```

開発サーバ起動後:

```bash
npm run test:smoke
npm run test:wave
npm run test:equip
npm run test:nunchaku:inertia
npm run test:responsive
npm run test:responsive:webkit
npm run test:portrait
npm run test:forms
npm run test:ad
npm run test:longrun
npm run test:live
npm run test:live:storm
npm run test:melee:slash
npm run test:start:style:rare
npm run test:style:applause:slot
npm run test:season:storage
```

関連ドキュメント:

- [controls.md](controls.md)
- [equipment-design.md](equipment-design.md)
- [state-contract.md](state-contract.md)
- [ad-obstruction.md](ad-obstruction.md)
- [live-hook.md](live-hook.md)
- [leaderboard-backend.md](leaderboard-backend.md)
- [action-spec.md](action-spec.md)
- [qa-plan.md](qa-plan.md)
