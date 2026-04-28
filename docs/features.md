# 機能リスト

実装状態は 2026-04-28 時点の `src/` 実装に合わせたものです。検証は原則として `npm run check` / `npm run build` と、開発サーバ起動後の Playwright コマンドで確認します。

## 実装済み

| 機能 | UI入口/API | 実装状態 | 検証方法 | 合格条件 |
| --- | --- | --- | --- | --- |
| ラン開始/再挑戦 | `#startBtn`, `#mobileStartBtn`, `Enter`, キャンバスクリック | 実装済み | `npm run test:smoke` | `mode` が `running` になり、終了後に再開始できる |
| PC移動 | `WASD` / 矢印 | 実装済み | `npm run test:smoke`、`render_game_to_text()` | `player.x/y` が変化し、ワールド外へ出ない |
| ポインタ/SP移動 | キャンバスクリック/ドラッグ | 実装済み | `npm run test:responsive` | `player.target_x/y` がポインタ位置へ更新される |
| SP全画面ステージ | CSS `visualViewport`, PWA meta, `#fullscreenBtn` | 実装済み | WebKit/Chromium responsive | SP横/縦で `.game-frame` と Canvas が viewport 全体を使う |
| SP縦操作デッキ | `#mobileStartBtn`, `#mobileSnapBtn`, `#mobileMenuBtn` | 実装済み | `npm run test:responsive` | 縦画面でも下部overlayから開始/スナップ/メニューに到達できる |
| 抗体ヌンチャク慣性 | Canvas描画、simulation | 実装済み | `render_game_to_text()` | `nunchaku.speed/tension/stretch` が有限値で更新される |
| スナップ | `Space`, `#snapTouchBtn`, `#mobileSnapBtn`, `#burstBtn` | 実装済み | `npm run test:smoke` | `run.snap_cd` が発生し、抗体ヌンチャク速度が上がる |
| HP/被弾/失敗 | 接触ダメージ | 実装済み | longrun、状態JSON | HP0で `mode: ended`、`run.ended_reason: HP_ZERO` |
| ウェーブ報酬回収 | wave clear、XP/装備ドロップ | 実装済み | smoke / longrun、状態JSON | `run.wave_state: reward` でドロップを回収し、回収後に次の選択/ウェーブへ進む |
| XP/レベルアップ3択 | ウェーブ全滅後、`1/2/3`、クリック | 実装済み | `npm run test:wave` / pause recovery | `run.ui_panels.levelup_open` が開き、38種類以上の能力から選択で復帰 |
| スタック可能スキル | レベルアップ3択、変異 | 実装済み | skill loop、状態JSON | `combat.skill_stacks` に分裂抗体ヌンチャク/高速回転/反射/衝撃波/連鎖/丸鋸/重力/低HP過給/会心/処刑/吸命/状態異常などの重複数が出る |
| 契約目標 | HUD `#objectiveChip` | 実装済み | longrun、状態JSON | `objective` に type/progress/target/timer が出る |
| 変異2択 | Wave10ごと | 実装済み | `npm run test:longrun` | `run.ui_panels.mutation_open` から選択で復帰 |
| Diablo風装備 | ウェーブ報酬回収、pickup compare | 実装済み | `npm run test:equip` | 細胞膜装備/抗体鎖装備として6レア度、37アフィックス、複数affix、`inventory.equipment_slots/equipment_mods` が出る |
| 細胞膜/抗体鎖装備分離 | pickup compare, state JSON | 実装済み | `npm run test:equip` | 内部スロット `body` と `nunchaku` の2枠が別々に保持され、合算modが再計算される |
| 装備比較 | ウェーブ報酬回収、`1/2`、装備/破棄ボタン | 実装済み | pickup compare / `npm run test:equip` | `inventory.pickup_compare.drop_item` が出て、装備/破棄を選ぶと復帰する |
| 病原体ロール | chaser / stalker / bruiser / zoner | 実装済み | longrun、状態JSON | `enemies[].role` が観測でき、病原体数がcap内に収まる |
| 大型感染体 | Wave15、`?boss_debug=1`、`?phase3_debug=1` | 実装済み | `npm run test:longrun` | `run.boss` が出現し、撃破で `BOSS_DEFEATED` |
| 大型感染体バランス互換 | `?balance=A|B`, `?boss_phase3=A|B` | 実装済み | URL付きlongrun | 指定プロファイルで起動し、互換クエリでもエラーにならない |
| ギフト4種 | `#gift100Btn`, `#gift500Btn`, `#gift1000Btn`, live event | 実装済み | `npm run test:live` | サイトカイン嵐/栄養小胞/血栓封鎖/ATP過給が `run.gift_event` に反映 |
| 血栓封鎖 | gift wall event | 実装済み | live / 状態JSON | `run.gift_obstacles` に `type: gift_wall` が出る |
| レジェンダリー | legendary drop | 実装済み | longrun / legendary scenario | `economy.legendary` が増え、`drops[].kind: legendary` が出る |
| メニュー | `#menuFloatingBtn`, `#mobileMenuBtn`, `M` | 実装済み | menu/glossary flow | `run.ui_panels.menu_open` が true になる |
| ビルド選択 | job/weapon select、character roll | 実装済み | menu flow、状態JSON | 免疫細胞タイプ8種/抗体鎖タイプ8種の選択がラン前ステータスへ反映される |
| ドット調ビジュアル | `public/assets/pixel`, Phaser preload | 実装済み | responsive screenshots | 免疫細胞タイプ/抗体鎖タイプ/病原体/ドロップが画像アセットで描画される |
| 表示設定 | 音、詳細HUD、フラッシュ、シェイク | 実装済み | menu flow、`H` | `run.debug_hud` とボタン表示が同期する |
| 用語集 | `#openGlossaryBtn` | 実装済み | menu/glossary flow | DOM表示と `run.ui_panels.glossary_open` が一致 |
| ライブ連動 | `#streamHookBtn`, `window.injectTikfinityEvent` | 実装済み | `npm run test:live` | 通常戦闘中は即時反映、選択/報酬/次wave出現中は `run.live_queue` に積まれ、wave頭を避けて順次反映される |
| ローカルスコア | run end | 実装済み | restart / localStorage確認 | 終了時に `nunchaku_overdrive_scores_v1` へ最大20件保存 |
| QA公開フック | `render_game_to_text`, `advanceTime`, `injectTikfinityEvent`, `set_nunchaku_stretch_limit` | 実装済み | Playwright / console | APIが例外なく状態JSON / boolean / void を仕様通り返す |
| PC/SPレスポンシブ | CSS viewport, WebKit option | 実装済み | `npm run test:responsive`, `npm run test:responsive:webkit` | 主要viewportでHUD/ボタン/モーダルが操作不能に重ならない |

## 未実装 / 制限事項

| 項目 | 状態 | 理由/現状 | 次の検証観点 |
| --- | --- | --- | --- |
| 実音声再生 | 未実装 | `audio` 設定はUI状態のみで、音源再生処理は未接続 | 音源アセットとミュート状態の自動テストを追加 |
| オンラインランキング | 未実装 | スコアはローカル `localStorage` のみ | 永続API/失敗時フォールバックの仕様化 |
| 実課金/収益計算 | 未実装 | 旧課金UIは削除済み、デモエネルギーとイベント換算のみ | 配信イベントの安全なデモ表現を維持 |
| セーブデータ移行 | 未実装 | OVERDRIVE再構築により旧 `game.js` 版からの移行処理なし | 旧キーが残る環境で副作用がないか確認 |
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
- [live-hook.md](live-hook.md)
- [action-spec.md](action-spec.md)
- [qa-plan.md](qa-plan.md)
