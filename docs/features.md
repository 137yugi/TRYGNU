# 機能リスト

実装状態は 2026-05-02 時点の `src/` 実装に合わせたものです。検証は原則として `npm run check` / `npm run build` と、開発サーバ起動後の Playwright コマンドで確認します。

## 実装済み

| 機能 | UI入口/API | 実装状態 | 検証方法 | 合格条件 |
| --- | --- | --- | --- | --- |
| ラン開始/再挑戦 | `#startBtn`, `#mobileStartBtn`, `Enter`, キャンバスクリック | 実装済み | `npm run test:smoke` | `mode` が `running` になり、終了後に再開始できる |
| PC移動 | `WASD` / 矢印 | 実装済み | `npm run test:smoke`、`render_game_to_text()` | `player.x/y` が変化し、ワールド外へ出ない |
| ポインタ/SP移動 | キャンバスクリック/ドラッグ | 実装済み | `npm run test:responsive` | `player.target_x/y` がポインタ位置へ更新される |
| SP全画面ステージ | CSS `visualViewport`, PWA meta, `#fullscreenBtn` | 実装済み | WebKit/Chromium responsive | SP横/縦で `.game-frame` と Canvas が viewport 全体を使う |
| SP縦長ステージ | `configureWorldForViewport()`, `canvas.layout` | 実装済み | `390x844`, `768x1024` Playwright | 縦画面では `canvas.layout: portrait` になり、内部座標も縦長になる |
| SP縦操作デッキ | `#mobileStartBtn`, `#mobileSnapBtn`, `#mobileMenuBtn` | 実装済み | `npm run test:responsive` | 縦画面でも下部overlayから開始/スナップ/メニューに到達できる |
| 呪鎖ヌンチャク慣性 | Canvas描画、simulation | 実装済み | `render_game_to_text()` | 内部互換キー `nunchaku.speed/tension/stretch` が有限値で更新される |
| スナップ | `Space`, `#snapTouchBtn`, `#mobileSnapBtn`, `#burstBtn` | 実装済み | `npm run test:smoke` | `run.snap_cd` が発生し、呪鎖ヘッド速度が上がる |
| HP/被弾/失敗 | 接触ダメージ | 実装済み | longrun、状態JSON | HP0で `mode: ended`、`run.ended_reason: HP_ZERO` |
| ウェーブ報酬回収 | wave clear、XP/装備ドロップ | 実装済み | smoke / longrun、状態JSON | `run.wave_state: reward` でドロップを回収し、回収後に次の選択/ウェーブへ進む |
| XP/レベルアップ3択 | ウェーブ全滅後、`1/2/3`、クリック | 実装済み | `npm run test:wave` / pause recovery | `run.ui_panels.levelup_open` が開き、38種類以上の能力から選択で復帰 |
| スタック可能スキル | レベルアップ3択、変異 | 実装済み | skill loop、状態JSON | `combat.skill_stacks` に分裂呪鎖/高速回転/反射/衝撃波/連鎖/丸鋸/重力/低HP過給/会心/処刑/吸命/状態異常などの重複数が出る |
| 契約目標 | HUD `#objectiveChip` | 実装済み | longrun、状態JSON | `objective` に type/progress/target/timer が出る |
| 変異2択 | Wave10ごと | 実装済み | `npm run test:longrun` | `run.ui_panels.mutation_open` から選択で復帰 |
| Diablo風装備 | ウェーブ報酬回収、pickup compare | 実装済み | `npm run test:equip` | 闘士防具/呪鎖武器装備として6レア度、37アフィックス、複数affix、`inventory.equipment_slots/equipment_mods` が出る |
| 本体/ヌンチャク装備分離 | pickup compare, state JSON | 実装済み | `npm run test:equip` | 内部スロット `body` と `nunchaku` の2枠が別々に保持され、合算modが再計算される |
| 装備比較 | ウェーブ報酬回収、`1/2`、装備/破棄ボタン | 実装済み | pickup compare / `npm run test:equip` | `inventory.pickup_compare.drop_item.asset_id` が出て、候補/現在装備の画像を表示し、装備/破棄を選ぶと復帰する |
| 観客モンスター | chaser / stalker / bruiser / zoner | 実装済み | longrun、状態JSON | `enemies[].role` が観測でき、敵数がcap内に収まる |
| 王者ボス/無限ウェーブ | Wave15、以後10waveごと、`?boss_debug=1`、`?phase3_debug=1` | 実装済み | `npm run test:longrun` | `run.boss` が出現し、撃破で `run.boss_kills` が増え、`run.next_boss_wave` が更新され、`mode: running` のまま継続する |
| ボスバランス互換 | `?balance=A|B`, `?boss_phase3=A|B` | 実装済み | URL付きlongrun | 指定プロファイルで起動し、互換クエリでもエラーにならない |
| ギフト4種 | `#gift100Btn`, `#gift500Btn`, `#gift1000Btn`, live event | 実装済み | `npm run test:live` | 観客乱入/報酬/封鎖/過給系のギフト効果が `run.gift_event` に反映 |
| ギフト壁封鎖 | gift wall event | 実装済み | live / 状態JSON | `run.gift_obstacles` に `type: gift_wall` が出る |
| 広告おじゃま | ギフトボタン、live event、`src/content/ads.ts` | 実装済み | live / 状態JSON / screenshot | ギフトごとに `run.selected_ad_id` が更新され、`run.active_ads` または `run.ad_queue` にバナー/動画風広告が出る |
| 運営広告カタログ | `public/config/ads.json`, `src/content/ads.ts`, `docs/ad-obstruction.md` | 実装済み | `npm run test:ad`、docs確認 | 広告ごとに `type/weight/minWave/duration/lane/speed/opacity/rarity` を調整できる |
| レジェンダリー | legendary drop | 実装済み | longrun / legendary scenario | `economy.legendary` が増え、`drops[].kind: legendary` が出る |
| メニュー | `#menuFloatingBtn`, `#mobileMenuBtn`, `M` | 実装済み | menu/glossary flow | `run.ui_panels.menu_open` が true になる |
| ビルド選択 | job/weapon select、character roll | 実装済み | menu flow、状態JSON | 闘士ジョブ/呪鎖武器の選択がラン前ステータスへ反映される |
| ラスター/ファンタジービジュアル | `public/assets/generated`, Phaser preload | 実装済み | responsive screenshots / `npm run test:equip` | 闘士/武器/観客モンスター/ボス/装備/ドロップが画像アセットで描画される |
| 音声/表示設定 | 音、詳細HUD、フラッシュ、シェイク | 実装済み | menu flow、`H` | Web Audio効果音、`run.debug_hud`、ボタン表示が同期する |
| 用語集 | `#openGlossaryBtn` | 実装済み | menu/glossary flow | DOM表示と `run.ui_panels.glossary_open` が一致 |
| ライブ連動 | `#streamHookBtn`, `window.injectTikfinityEvent` | 実装済み | `npm run test:live` | 通常戦闘中は即時反映、選択/報酬/次wave出現中は `run.live_queue` に積まれ、wave頭を避けて順次反映される |
| シーズン | 2週間ID、残日数、ランキング紐づけ | 実装済み | menu / localStorage確認 | `synapse_storm_season_v1` とスコア行の `seasonId` が同期 |
| ローカルスコア | boss clear checkpoint / HP0終了 | 実装済み | restart / localStorage確認 | ボス撃破時と終了時に `nunchaku_overdrive_scores_v1` へシーズン別最大20件保存 |
| ランキング宣伝 | 終了時フォーム | 実装済み | ended flow / localStorage確認 | 名前/SNS/一言コメントをランキング行へ保存 |
| 意見/文句 | メニュー内フォーム | 実装済み | menu / localStorage確認 | `synapse_storm_feedback_v1` へシーズンID付きで自由入力を保存 |
| 運営用シーズンJSON | `#seasonExportBtn`, `window.exportSeasonReview()` | 実装済み | console / menu | 意見/ランキングを次シーズン改善レビュー用JSONとして取得できる |
| QA公開フック | `render_game_to_text`, `advanceTime`, `injectTikfinityEvent`, `exportSeasonReview`, `set_nunchaku_stretch_limit` | 実装済み | Playwright / console | APIが例外なく状態JSON / boolean / string / void を仕様通り返す |
| PC/SPレスポンシブ | CSS viewport, WebKit option | 実装済み | `npm run test:responsive`, `npm run test:responsive:webkit` | 主要viewportでHUD/ボタン/モーダルが操作不能に重ならない |

## 未実装 / 制限事項

| 項目 | 状態 | 理由/現状 | 次の検証観点 |
| --- | --- | --- | --- |
| オンラインランキング | 未実装 | スコアはローカル `localStorage` のみ | 永続API/失敗時フォールバックの仕様化 |
| 実課金/収益計算 | 未実装 | 旧課金UIは削除済み、デモエネルギーとイベント換算のみ | 配信イベントの安全なデモ表現を維持 |
| セーブデータ移行 | 未実装 | 旧 `game.js` 版からの移行処理なし | 旧キーが残る環境で副作用がないか確認 |
| アクセシビリティ完全対応 | 部分実装 | `aria-label` とdialog属性はあるが、フォーカストラップ/読み上げ検証は未完 | キーボードのみ操作とスクリーンリーダー検証 |
| 実機タッチ検証 | 未完 | 自動responsive検証が中心 | iOS Safari / Android Chromeで入力遅延とviewportを確認 |

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
npm run test:responsive
npm run test:longrun
npm run test:live
```

関連ドキュメント:

- [controls.md](controls.md)
- [equipment-design.md](equipment-design.md)
- [state-contract.md](state-contract.md)
- [ad-obstruction.md](ad-obstruction.md)
- [live-hook.md](live-hook.md)
- [action-spec.md](action-spec.md)
- [qa-plan.md](qa-plan.md)
