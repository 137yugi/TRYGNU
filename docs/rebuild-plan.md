# Rebuild Plan

## Milestone 1: Phaser/Vite基盤

- [x] `src/` に分割実装を作る
- [x] `render_game_to_text`, `advanceTime`, `injectTikfinityEvent` を公開
- [x] `npm run check` と `npm run build` の実行導線を作る

## Milestone 2: コアプレイ

- [x] 慣性ヌンチャク、敵群、スナップ、被弾、XP、レベルアップ
- [x] レベルアップ能力を数値UP中心から、分裂/高速回転/反射/衝撃波/連鎖/丸鋸/重力/低HP過給などのスタック構成へ拡張
- [x] レベルアップ能力を38種類へ拡張し、装備アフィックスとは別系統で重複可能にする
- [x] PC/SP入力とレスポンシブHUD
- [x] smoke Playwrightで状態JSONを確認する導線を作る

## Milestone 3: ラン体験

- [x] 契約、変異、ボス、レジェンダリー、装備比較
- [x] Diablo風の6レア度装備、37アフィックス、レジェンダリー/エンシェント級の戦場変化効果を追加
- [x] 戦闘中3秒選択をやめ、ウェーブ全滅後にXPオーブと装備を回収して安全時間で選択する
- [x] 終了/スコア/即リトライ
- [x] longrun Playwrightでボス状態を確認する導線を作る

## Milestone 4: 配信連動/文書

- [x] ギフト4種とライブキュー
- [x] README、取説、機能リスト、QA計画を更新
- [x] responsiveスクショでPC/SPを確認する導線を作る

## Next Autonomous Backlog

優先度は上から順です。実装workerは `src/**` とテストクライアント、Docs/Product workerは `README.md` / `docs/**` / `progress.md` / `.agent/PLANS.md` を担当します。

| 優先 | バックログ | 目的 | 受け入れ条件 | 推奨検証 |
| --- | --- | --- | --- | --- |
| P0 | 対象workspaceで正式検証を完了 | stagingではなくこのプロジェクトで品質証跡を残す | `npm run check` / `npm run build` / smoke / longrun / live の結果が `output/` に残り、失敗時は最初の新規エラーが記録される | `npm run test:smoke`, `npm run test:longrun`, `npm run test:live` |
| P0 | responsive実機相当確認 | SP縦横の操作不能を防ぐ | 390x844、844x390、1280x720相当でHUD/モーダル/操作デッキが重ならない | `npm run test:responsive` とスクショ目視 |
| P1 | 報酬フェーズの表示整合 | ウェーブ全滅後の回収/選択を分かりやすく見せる | `run.wave_state: reward`、XP回収、装備比較、レベルアップ表示が順に追える | smoke + 手動/Playwrightで state contract を観測 |
| P1 | スタック能力の長尺バランス確認 | 分裂/反射/連鎖などの組み合わせが極端に壊れないようにする | `combat.skill_stacks` と `phantoms` が増えてもフレーム落ちや即死偏重がない | skill loop、longrun seed 複数回 |
| P1 | ライブイベントの重複/キュー耐久 | 配信中の連投で破綻しないようにする | 重複IDは無視され、選択/報酬/次wave出現中キューがwave頭を避けて順次処理される | `npm run test:live`、追加連投アクション |
| P1 | ボス/変異の長尺バランス再確認 | 3分30秒ランの成功/失敗が極端に偏らないようにする | `boss_debug=1` と通常seedで `BOSS_DEFEATED` / `SURVIVED` / `HP_ZERO` が観測可能 | longrun seed 複数回 |
| P2 | ローカルスコア表示導線 | 保存済みスコアがユーザーから見えるようにする | メニューまたは終了画面で直近/最高スコアを確認できる | restart flow、localStorage確認 |
| P2 | 音声実装の方針決定 | `音 ON/OFF` を実機能にするか、UI表記を調整する | 実音声を入れる場合はミュートが効く。入れない場合はドキュメントとUIで誤解がない | 手動確認 |
| P2 | アクセシビリティ補強 | キーボード/読み上げ利用時の操作不能を減らす | モーダルのフォーカス移動、Esc、ボタン名、選択肢が確認できる | キーボードのみ操作 |

## Documentation Backlog

- 検証が終わったら [features.md](features.md) の各検証欄に最新の出力ディレクトリ名を追記する。
- [qa-plan.md](qa-plan.md) はQA worker優先のため、Docs/Product workerは検証事実が出た場合のみ追記する。
- [action-spec.md](action-spec.md) はQA worker優先のため、テストアクション仕様が変わった場合のみ追記する。
- READMEはユーザー向け、`docs/features.md` は実装/QA向け、`progress.md` と `.agent/PLANS.md` は引き継ぎ向けとして役割を分ける。
