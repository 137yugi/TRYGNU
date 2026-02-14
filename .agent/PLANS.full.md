# Diablo-like Web H&S: Continuous ExecPlan Loop

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Reference policy: `/PLANS.md` from repository root. This document must be maintained in accordance with `/PLANS.md`.

Status: IN_PROGRESS
Owner: Codex
Last Updated: 2026-02-13
Overall Progress: 100% (phase3定数接続完了。boss personality + stop hardening + TikFinity + nunchaku direct-control removal + no-auto-retract/磁気牽引/speed capless + self-damage-equals-weapon + 日本語UI/用語集導線実装 + phase3 spike対策は次回検証待ち)

## Purpose / Big Picture

この変更が完了すると、プレイヤーは iPhone 横向き配信を想定した 2D ハクスラを、装備厳選・Occultist クラフト・Glitch ON/OFF・ギフト連動の高圧戦闘として遊べる。さらに開発側は、`go` の都度停止せず、ExecPlan に従って実装と検証を連続実行できる。動作確認はローカルサーバー起動後に Playwright でスクリーンショットと `render_game_to_text` を取り、UI 可読性、戦闘難度、クラフト操作の整合を観測して行う。

## Progress

- [x] (2026-02-09 11:19Z) Playwright 実行環境と `web_game_playwright_client.mjs` の検証ループを整備し、定期スクリーンショット取得を可能化した。
- [x] (2026-02-09 20:31Z) 生存調整パス（接触ダメージの離散化、圧力緩和、ノックバック）を導入し、即死頻度を下げた。
- [x] (2026-02-09 21:20Z) Occultist（Extract/Imprint/Reforge）とルーン在庫 UI を導入し、実行中の装備再設計ループを実装した。
- [x] (2026-02-09 21:23Z) 敵ロール制御（chaser/bruiser/zoner）を導入し、近接過密を緩和した。
- [x] (2026-02-09 21:32Z) レジェンダリー演出（柱・シグナル・音）を強化し、視覚聴覚ピークを作った。
- [x] (2026-02-09 21:47Z) 装備比較差分、ランキング追加指標（Flow/K-H）、ギフトイベント分岐を追加した。
- [x] (2026-02-09 23:42Z) in-canvas HUD の可読性再設計（THREAT表示、演出重なり回避）を反映した。
- [x] (2026-02-09 23:42Z) 敵圧再調整（速度/接触ダメ/エンレイジ + 同時出現数キャップ）を反映した。
- [x] (2026-02-09 23:42Z) 3 シナリオ（UI/Occultist/Legendary）再検証を完了し、成果物を `progress.md` に反映した。
- [x] (2026-02-09 23:45Z) 次サイクル: クラフトUIの情報密度改善（長文説明の短文化 + 重要値の強調）を実施した。
- [x] (2026-02-10 05:33Z) 次サイクル: ギフト時の敵質強化と報酬演出のバランス再調整を実施した。
- [x] (2026-02-10 05:33Z) 進行不能対策: Run失敗後の再スタート再現試験を追加し、2回目開始成功を検証した。
- [x] (2026-02-10 07:19Z) 戦闘中「Reinforce/Surge」イベントの文字演出重なりを整理し、LEGENDARY文言との視認競合を下げた。
- [x] (2026-02-10 07:19Z) 高圧時の瞬間致死を抑えるため、接触ダメージの同時多段を平滑化した。
- [x] (2026-02-10 10:32Z) 平滑化後の生存性を維持しつつ、終盤スリルを落とし過ぎない微調整を反映した。
- [x] (2026-02-10 13:06Z) レベルアップ/変異ポーズ滞留時の再開導線を強化した（Startボタンで強制解消、モーダル外タップ解消、canvasタップ解消）。
- [x] (2026-02-10 13:06Z) 必須ループを再実行し、`web-game-uicheck15` で回帰なし（`errors-*.json` なし）を確認した。
- [x] (2026-02-10 13:06Z) ユーザー報告の「ボタンが押せない」再発要因を特定し、停止解除フェイルセーフを実装した。
- [x] (2026-02-10 13:06Z) 画面内情報の過密を減らすため、Top HUD文言を2段階表示（通常/詳細）に分離した。
- [x] (2026-02-10 14:01Z) UI/System専念として System Focusトグル（Text/Flash/Shake）を追加し、演出密度を実行時に制御可能にした。
- [x] (2026-02-10 14:01Z) 必須 + Occultist + Legendary の3シナリオ再検証で `errors-*.json` なしを確認した。
- [x] (2026-02-10 14:58Z) Legendary/Dangerの右上アラートをカードスタック化し、中央帯の重なりを除去した。
- [x] (2026-02-10 15:06Z) 重要フロート文言の重複抑制（LEGENDARY/DANGER）を追加し、過密時の判読性を改善した。
- [x] (2026-02-10 15:12Z) pause復帰フェイルセーフを強化し、連続レベルアップ時の復帰不能を回避した。
- [x] (2026-02-10 15:32Z) レベルアップ連鎖時の自動判定シナリオ（pause recovery）とアサートを追加し、`running` 復帰を確認した。
- [x] (2026-02-10 15:50Z) 右上Alertカード中のフロート表示優先度ルールを実装し、表示上限を動的に圧縮した。
- [x] (2026-02-10 16:00Z) Alertカード幅を可変化し、HUD詳細モードでも重なりにくい配置に調整した。
- [x] (2026-02-10 16:12Z) Legendaryカード表示中の同系フロート（LEGENDARY DROP / PITY LEGENDARY）を抑制した。
- [x] (2026-02-10 16:40Z) HUD詳細モードの文言を短文化し、2行目を圧縮表記へ変更した。
- [x] (2026-02-10 17:08Z) 次サイクル: レベルアップ中HUDの表示行を専用短縮フォーマットへ切り替え、`render_game_to_text` に `pause_mode / level_queue / level_autopick_timer` を追加した。
- [x] (2026-02-11 05:18Z) 再起動後の再開確認として `/.agent/PLANS.md`・`progress.md`・適用Skill手順を再読し、停止要因が環境ではなく設計未完了であることを確認した。
- [x] (2026-02-11 05:28Z) ヌンチャク戦闘を再調整し、照準追従（aim assist）・軌跡線分ヒット（swept segment）・自己被弾リスク強化を実装した。
- [x] (2026-02-11 05:29Z) HUDに `COMBO` と `Mutation/Boss進捗%` を追加し、`render_game_to_text` に `run.swing_combo` と `run.progress_pct` を追加した。
- [x] (2026-02-11 05:40Z) `uicheck32 / nunchaku-swing2 / nunchaku-selfhit4 / legendary24` を実行し、全出力で `errors-*.json` なしを確認した。
- [x] (2026-02-10 20:55Z) 通常密度シーン（uicheck系）での `COMBO` 発火率をさらに上げるため、バースト連動コンボ加算を導入して通常戦闘でもコンボが立ち上がるよう再調整した。
- [x] (2026-02-10 20:55Z) Weapon/Armorの見た目差（輪郭・色段階）を追加し、装備更新時の視覚的差分を強化した。
- [x] (2026-02-10 21:20Z) 停止報告を再現調査し、`pickup_compare` が state では発火しているのにUI表示されない不整合を特定した。
- [x] (2026-02-10 21:20Z) `pendingPickupItem` のデータ形状を正規化し、比較ポーズ中の判定/描画/`render_game_to_text` を同一経路に統一した。
- [x] (2026-02-10 21:20Z) 必須ループ再検証（`web-game-uicheck37`）と比較再現検証（`web-game-pickup-compare4`）を実施し、`errors-*.json` なしを確認した。
- [x] (2026-02-10 21:38Z) 装備比較をcanvas全画面オーバーレイとして描画し、Playwrightスクリーンショットで見え方を最終確認した（`web-game-pickup-compare5` / `web-game-pickup-compare-resolve1`）。
- [x] (2026-02-11 09:00Z) ミニボスを固定名からプロファイル方式へ再設計し、`DUELIST/JUGGERNAUT/HUNTER/WARLORD` の挙動差（dash/slam/call係数）を実装した。
- [x] (2026-02-11 09:00Z) ボス撃破報酬 `Boss Boon` を追加し、HUD / `render_game_to_text` へ `boss_boons` と `boss.profile/role` を出力した。
- [x] (2026-02-11 09:00Z) `pickup_compare` 停止再発を抑えるため、モーダル無し時の復旧ログと canvas比較表示の常時描画を追加した。
- [x] (2026-02-11 09:00Z) 検証 `uicheck43` / `boss-brush7` / `pickup-compare-resolve6` / `legendary26` を実行し、全ディレクトリで `errors-*.json` なしを確認した。
- [x] (2026-02-11 09:20Z) ボス戦中の同時出現キャップを phase連動（P1/P2/P3 = 42/36/30%）へ変更し、過密死を緩和した。
- [x] (2026-02-11 09:20Z) ボス接触ダメージ/ハザードダメージに「最大HP割合キャップ」を追加し、単発理不尽死を抑制した。
- [x] (2026-02-11 09:20Z) `boss-brush10` で再検証し、`errors-*.json` なし・4iteration中に即終了しないことを確認した。
- [x] (2026-02-11 16:11Z) 配信連動強化として `LIVE HOOK` UI（ON/OFF + 状態表示）を追加し、通常プレイ時はOFF既定で回帰しない構成にした。
- [x] (2026-02-11 16:11Z) `scripts/tikfinity_webhook_bridge.mjs` を追加し、`POST /webhook/tikfinity` と `GET /events` のローカルWebhookブリッジを実装した。
- [x] (2026-02-11 16:11Z) LIVEイベント取り込みを `game.js` に実装し、重複排除・ダイヤ換算・キュー排出（pause/idle時は保留）を既存Giftイベントに統合した。
- [x] (2026-02-11 16:11Z) `uicheck` 必須ループ + `livehook1` 検証を実行し、`errors-*.json` なし・`stream_hook.total_events`/`gift_event.source:LIVE` を確認した。
- [x] (2026-02-11 17:08Z) ヌンチャクの直接操作要素（照準追従/ポインタ駆動）を除去し、自機運動と紐物理のみで武器が釣られて動く仕様へ変更した。
- [x] (2026-02-11 17:08Z) 慣性トルク + 微ランダム揺らぎを追加し、狙い過ぎない不規則挙動を付与した。
- [x] (2026-02-11 17:08Z) `uicheck48` / `nunchaku-swing8` / `nunchaku-selfhit9` を実行し、`errors-*.json` なしを確認した。
- [x] (2026-02-11 17:16Z) ヌンチャクをさらに簡素化し、武器挙動を「自機移動 + 紐バネ + ときどきゴム化」へ再設計（回転抵抗ロジック撤去）した。
- [x] (2026-02-11 17:16Z) `uicheck49` / `nunchaku-swing9` / `nunchaku-selfhit10` を再検証し、`errors-*.json` なしを確認した。
- [x] (2026-02-12 03:59Z) `triggerGift` のtier誤適用（`cost`流用）を修正し、ローカルギフトの過剰強化バグを解消した。
- [x] (2026-02-12 03:59Z) 敵基礎式（HP/DMG）を再スケーリングし、Wave1長尺での過剰EHPを解消した。
- [x] (2026-02-12 03:59Z) 緊急ボスゲートをWave1長尺条件（time+kill）で解放するよう変更した。
- [x] (2026-02-12 04:13Z) `boss_longrun_safe` を再実行し、`wave:2` 到達と `boss_boons.count:1` を確認した。
- [x] (2026-02-12 04:13Z) `render_game_to_text` に `run.kills_total` / `run.gift_value` を追加し、長尺評価の可観測性を強化した。
- [x] (2026-02-12 04:13Z) ミニボス被弾テンポ改善として対ボス限定ダメージ補正を追加し、通常敵のテンポを維持した。
- [x] (2026-02-12 04:40Z) `boss-brush12` の20iteration検証でPlaywrightハングを再現し、プロセス監視と停止手順を確立。評価は `safe4` / `brush11` を正式採用した。
- [x] (2026-02-12 04:13Z) ボス撃破まで到達する長尺シナリオ（30-60s）を追加し、`boss_boons.count` の増加（`safe4`で `count:1`）と敗北率偏りを再評価した。
- [x] (2026-02-12 08:15Z) ヌンチャクの自動収縮を停止し、粘度高めの減衰へ調整した（`restLength` 自動補間撤去 + 速度粘性ダンピング強化）。
- [x] (2026-02-12 08:15Z) 必須ループ `output/web-game-uicheck` を再実行し、`errors-*.json` なし・挙動回帰なしを確認した。
- [x] (2026-02-12 09:59Z) 紐長を短縮し、ゴム伸長上限を抑え、同角度固定化を抑制するための接線方向トルク（anchor acceleration由来）を追加した。
- [x] (2026-02-12 09:59Z) 必須ループ + `nunchaku-swing` を再検証し、`errors-*.json` なし、`angle_span_deg:291.1` を確認した。
- [x] (2026-02-12 10:20Z) 回転維持火力のため「回転時だけ紐が伸びる」遠心伸長（tangential speed依存）を導入した。
- [x] (2026-02-12 10:20Z) `nunchaku-swing-long`（8iter）で `angle_span_deg:336.1`, `len_span:55.2`, `max_speed:203.2` を確認し、周回維持が成立することを検証した。
- [x] (2026-02-12 10:45Z) 紐の内側拘束（minLength clamp）を除去し、紐に当たり判定を持たせない構造へ変更した。
- [x] (2026-02-12 10:45Z) 磁気牽引（radial magnetic pull + tangential yank）を主力加速へ移行し、`stretchLimit` を指定可能にした（HUD/telemetry/API対応）。
- [x] (2026-02-12 10:45Z) 必須ループ + `nunchaku-swing` + `nunchaku-selfhit` で `errors-*.json` なしを確認し、`stretch_limit` 出力を検証した。
- [x] (2026-02-12 11:10Z) 自機反発の根本要因を除去するため、引力を pull-only 化（内向きのみ）し、武器の接線減衰/dragを削除した。
- [x] (2026-02-12 11:10Z) 武器反動と壁反射の係数上限を撤去し、速度上限/摩擦なし仕様へ寄せた。
- [x] (2026-02-12 11:10Z) 必須ループ + selfhit再検証で `max_hits_taken:6`, `max_speed:267.23`, `errors-*.json` なしを確認した。
- [x] (2026-02-12 11:26Z) 自爆ダメージ式を通常攻撃と同一化（`computeSwingImpactDamage(impactSpeed)`）し、最終段のみガード軽減を適用した。
- [x] (2026-02-12 11:26Z) 必須ループ + selfhit検証で `SELF 1244` 表示と `hp:-1071.6` を確認し、火力連動の自爆成立を確認した。
- [x] (2026-02-12 12:47Z) プレイヤー体力を敵クラスへ引き上げるため、`PLAYER_HP_CLASS_MUL=8` と `scalePlayerHpBase/scalePlayerHpDelta` を導入し、初期値/ビルド/レベル/変異/Boon/目的達成/Legendary回復の全HP経路へ反映した。
- [x] (2026-02-12 12:47Z) 必須ループ `output/web-game-uicheck` を再実行し、`errors-*.json` なし・進行不能なしを確認した。
- [x] (2026-02-12 12:47Z) `output/web-game-uicheck/state-0..2.json` で `player.max_hp:1376` を確認し、プレイヤーHPが敵同等クラスへ移行したことを検証した。
- [x] (2026-02-12 13:22Z) ユーザー要望「壁反射なし」に対応し、ヌンチャク頭部の壁反射反転（`n.vx *= -1`, `n.vy *= -1`）を削除してクランプのみへ変更した。
- [x] (2026-02-12 13:22Z) 新規Affix `Shrapnel(PROC%)` を追加し、ヌンチャク命中時に確率で追撃弾（proc shot）を発射する処理（更新/描画/ダメージ）を実装した。
- [x] (2026-02-12 13:22Z) 必須ループ `uicheck` + 追加 `nunchaku-swing` を再検証し、両方 `errors-*.json` なしを確認した。
- [x] (2026-02-12 13:57Z) インベントリ運用を廃止し、ドロップは常に `Gear Drop Compare`（装備/破棄）の2択に統一した（在庫保存なし）。
- [x] (2026-02-12 13:57Z) `equipItemDirect` と `pendingPickupQueue` を導入し、比較モーダル連鎖時でも進行不能なく処理されるようにした。
- [x] (2026-02-12 13:57Z) 必須 `uicheck` + `legendary` 再検証で `errors-*.json` なし、`inventory.count:0` 維持と `pickup_compare` 動作を確認した。
- [x] (2026-02-12 14:45Z) 添付トンマナ（白黒1-bitピクセル）準拠の描画基盤を追加し、`assets/retro/*.svg` のクラウド/遠景/前景/パネルパターンをキャンバス背景へ統合した。
- [x] (2026-02-12 14:45Z) HUD/ボス帯/アラート/比較モーダル/開始オーバーレイを `drawRetroPanel` へ統一し、モノクロ寄りレトロUIへ寄せた（フォントをmonospace系へ統一）。
- [x] (2026-02-12 14:45Z) `scripts/generate_retro_assets_with_imagegen.sh` を追加し、`OPENAI_API_KEY` 設定後に imagegen CLI で生成アセットへ即差し替えできる導線を整備した（現環境はKey未設定のため実生成は保留）。
- [x] (2026-02-13 01:12Z) 要望「アイテムドロップ10分の1・高レアさらに低下」に対応し、通常ドロップ率/レア率/レジェ率/ギフト雨の全経路を一段低下させた。
- [x] (2026-02-13 01:12Z) レジェ拾得時の追加 `rare` 配布を停止し、高レア雪だるま化を抑制した。
- [x] (2026-02-13 01:12Z) 必須 `uicheck` + `legendary-dropnerf1` で `errors-*.json` なし、`drops_on_ground` 低下（uicheckで連続0）を確認した。
- [x] (2026-02-12 17:16Z) 「常に最新版をwebで触れる」要望に対応し、`scripts/build_web_dist.sh` と `.github/workflows/deploy-pages.yml` を追加して `main` pushで自動公開更新される構成を実装した。
- [x] (2026-02-12 17:16Z) 共有用の手順書 `DEPLOY_GITHUB_PAGES.md` を追加し、初回公開から日次更新までを定義した。
- [x] (2026-02-12 17:16Z) 必須 `uicheck` を再実行し `errors-*.json` なし、ドロップ抑制回帰なし（`drops_on_ground:0`）を確認した。
- [x] (2026-02-12 17:48Z) `origin` を `git@github-3dtest:137yugi/TRYGNU.git` に設定し、`master` を `origin/main` へ push した。
- [x] (2026-02-12 17:48Z) GitHub Actions `Deploy Web Game to GitHub Pages` の成功実行（run id: `21957853746`）を確認した。
- [x] (2026-02-12 19:25Z) 日本語向けUI文言へ刷新し、HUD/比較モーダル/開始・失敗オーバーレイ/イベントカードの主要テキストを日本語化した。
- [x] (2026-02-12 19:25Z) `メニュー` から開ける `用語集` モーダルを追加し、Playwright検証で `run.ui_panels.menu_open/glossary_open` の開閉状態を確認した。
- [x] (2026-02-12 19:25Z) 必須 `uicheck` + `menu-glossary-visual2` を再実行し、両ディレクトリ `errors-*.json` なしを確認した。
- [x] (2026-02-11 16:36Z) ヌンチャク物理を再設計し、紐の弾性（rest/max length）・遠心項・伸縮テンション・アンカー加速度ポンプを導入した。
- [x] (2026-02-11 16:36Z) HUDに `TN%`（テンション）を追加し、`render_game_to_text` の `nunchaku` に `rest_length/max_length/tension/stretch/elastic_boost` を出力した。
- [x] (2026-02-11 16:36Z) `uicheck47` / `nunchaku-swing7` / `nunchaku-selfhit8` を再検証し、すべて `errors-*.json` なしを確認した。
- [ ] (2026-02-12 04:13Z) ボスphase3時の雑魚同時数とtouch damage係数をA/B調整し、理不尽死を抑えつつ脅威維持する（phase2までは再調整済み、phase3専用シナリオで最終確認を残す）。
- [x] (2026-02-13 16:00Z) ユーザー要件「ゲーム画面外は枠外、UIはメニュー内のみ」に合わせ、ゲーム画面では `menuFloatingBtn` のみ表示し、`#menuSourceColumn .info-grid` の非表示制約を除去してメニュー内に装備・ルーン・クラフト欄を再表示。
- [x] (2026-02-13 16:00Z) ループ検証を `output/web-game-ui-menu-min` / `output/web-game-uicheck2` で実行。`menu_open:true` 開閉と、開始後 `mode:running` 遷移を確認。

## Surprises & Discoveries

Observation: `pickup_compare` は `state` が正でも、`running` 条件でoverlayを描く設計だと終了/遷移境界で「止まったように見える」。
Evidence: `output/web-game-legendary26/state-0..5.json` は連続 `pause_mode:"pickup_compare"`。overlay常時描画へ変更後、`output/web-game-legendary26/shot-2.png` で比較パネルが安定表示。

Observation: プレイヤーHPをクラス倍率化すると、自己被弾の危険性を残しながらも入力継続時間が伸び、操作不能ではなく「削られていく」体験になる。
Evidence: `output/web-game-uicheck/state-0..2.json` で `player.max_hp:1376`、同runで `hp:817.9 -> 319.2 -> 19.5` と段階的減衰を確認し、3ステップとも `mode:"running"` を維持。

Observation: ヌンチャクの壁反射を外しても、位置クランプのみで進行不能や描画崩れは発生しない。
Evidence: `output/web-game-uicheck` と `output/web-game-nunchaku-swing` の再検証で `errors-*.json` 未生成、`mode:"running"` 継続を確認。

Observation: On-hit弾Affixは常時発火ではなく、装備ロール依存で初めて発火するため、通常runで `projectile_count:0` は仕様上正常。
Evidence: `output/web-game-uicheck/state-0..2.json` と `output/web-game-nunchaku-swing/state-0..3.json` で `projectile_count:0`、同時に新stat `PROC%` を装備計算経路へ追加済み。

Observation: 在庫を廃止しても、`pendingPickupQueue` で比較モーダルを直列処理すればドロップ連打時の取りこぼしや停止を回避できる。
Evidence: `output/web-game-legendary/state-0..3.json` で連続 `pause_mode:"pickup_compare"` を維持しつつ `inventory.count:0` のまま進行、`errors-*.json` は未生成。

Observation: 白黒ピクセルトンマナは、背景を画像タイル化しつつHUDパネルを共通描画関数化すると、既存ゲームロジックを壊さず短時間で反映できる。
Evidence: `output/web-game-uicheck-imagegen1/shot-0.png` と `output/web-game-uicheck/shot-2.png` でクラウド/地形帯/レトロUIが表示され、両ランで `errors-*.json` 未生成。

Observation: 現環境では `OPENAI_API_KEY` が未設定のため imagegen 本実行は不可だが、生成シェルを先置きすればキー投入後の差し替えは即時可能。
Evidence: `python3 ~/.codex/skills/imagegen/scripts/image_gen.py generate --dry-run` は成功、`echo OPENAI_API_KEY` は空。

Observation: ドロップ率を1/10へ下げると、通常ループで地面ドロップが0を維持しやすくなり、視認ノイズが大きく減る。
Evidence: `output/web-game-uicheck/state-0..2.json` で `run.drops_on_ground:0` を確認、`errors-*.json` は未生成。

Observation: ギフト系の高レア雨を同時に絞らないと、通常ドロップだけ下げてもLegendary showcaseで再び過密になる。
Evidence: 絞り込み後 `output/web-game-legendary-dropnerf1/state-0..3.json` で `drops_on_ground:2` に留まり、`legendary_on_ground:false` を維持。

Observation: 静的配信のため、公開対象を `dist/web` に限定するとローカル専用ファイルや検証成果物を含めずに安全に「常に最新版」公開ができる。
Evidence: `bash scripts/build_web_dist.sh` 後の `dist/web` は `index.html/styles.css/game.js/assets` のみ。

Observation: Emergency bossの早期出現は成立しているが、phase3で雑魚密度が残るとプレイヤー体感が「対処不能」に寄りやすい。
Evidence: `output/web-game-boss-brush7/state-2.json` で `boss.phase:3` かつ `enemies_alive:12`、`threat_score:148`、直後 `state-3.json` で敗北。

Observation: ボス戦の即死主因は接触よりも `slam/omega` の生ダメージ上振れだった。
Evidence: `output/web-game-boss-brush9/state-2.json` で `hits_taken:4` に対して `hp:-6808.8`。ハザードにHP割合キャップ導入後の `boss-brush10/state-0..3.json` は継続 `mode:"pickup_compare"` で即終了を回避。

Observation: LIVE HookをONにした直後に過去イベントを一括適用すると、Wave1開始直後の密度が急騰しやすい。
Evidence: 初回実装時は `state-0` で同時高密度化。キュー排出（`pending_count`）へ変更後 `output/web-game-livehook1/state-0..3.json` で段階適用を確認。

Observation: 敵を単純に増やすだけでは難しくなる一方で視認性が急落し、戦闘判断より描画ノイズが支配的になる。
Evidence: `output/web-game-legendary2/state-3.json` で `enemies_alive: 61` かつ `drops_on_ground: 6`。同時にスクリーンショットで中心部が密集し情報判読が困難。

Observation: ルーン/装備クラフトは UI が成立していても、比較情報が弱いと意思決定速度が落ちる。
Evidence: `item power delta` の色分けと差分表記を `index.html` / `styles.css` / `game.js` に反映済み。

Observation: 承認済み prefix があっても、相対パス実行にすると再承認ダイアログが再発する。
Evidence: 絶対パス prefix 承認後に相対パス `node web_game_playwright_client.mjs ...` 実行で承認UIが再表示。絶対パス固定で再発なし。

Observation: 進行不能の主訴（Run Failed後に押せない）は、ボタンだけに依存するとUI重なりや視線誤差で再発しやすい。
Evidence: `output/web-game-restart2/state-0.json` と `state-1.json` は `mode:\"ended\"`。同シナリオで `state-2.json` は `mode:\"running\"` へ復帰し、再スタート成功を確認。

Observation: 高密度演出時、LEGENDARY上部文言とGiftイベントカードが右上で競合し可読性が低下した。
Evidence: `output/web-game-legendary6/shot-3.png` で重なりを確認。修正後 `output/web-game-legendary7/shot-2.png` で分離を確認。

Observation: 接触ダメージの同時多段を緩和すると、高密度でも「即死」より「瀕死で粘る」状態が増える。
Evidence: `output/web-game-restart7/state-0.json` で `hp:63.3`、`state-1.json` で `mode:levelup` と継戦を確認（同条件で従来は急落しやすかった）。

Observation: 平滑化後に終盤係数を戻しても、levelup ポーズ滞留中は restart 検証で `mode:levelup` が持続し再開導線確認が難しくなる。
Evidence: `output/web-game-restart8/state-0..2.json` が連続 `mode:levelup`。クラッシュではなくエラーなしで停止しており、UI選択待ちが原因。

Observation: 「ボタンが押せない」主因はクリック自体の無効化ではなく、`pauseMode=levelup/mutation` で操作意図が Start に集約されないことだった。
Evidence: 修正前 `output/web-game-uicheck14/state-1..2.json` が連続 `mode:levelup`。修正後 `output/web-game-pause-resume4/state-0..1.json` は連続 `mode:running` を維持。

Observation: Compact HUD化で左上占有面積が減り、Legendary演出中でもプレイヤー位置とドロップ判読がしやすくなった。
Evidence: `output/web-game-uicheck17/shot-2.png` と `output/web-game-occultist14/shot-2.png` で、旧6行HUDより行数減少を確認。

Observation: Text/Flash/Shake を個別トグル化すると、プレイヤーが端末負荷や視認性に合わせて即時に情報密度を調整できる。
Evidence: `output/web-game-uicheck18/state-2.json` に `run.system_focus` が出力され、同時に `errors-*.json` は未生成。

Observation: Legendary/Dangerを右上カードへ統合すると、中央帯の戦闘視認性を保ったまま重要通知を維持できる。
Evidence: `output/web-game-legendary13/shot-3.png` で右上に `LEGENDARY` カードのみ表示され、旧中央バナー重なりが消失。

Observation: pause-resume シナリオで `mode: levelup` が継続するケースは、クラッシュではなく連続レベルアップ待機が主因。
Evidence: `output/web-game-pause-resume6/state-0..2.json` は連続 `mode:"levelup"` だが `errors-*.json` 未生成。`output/web-game-restart9/state-1.json` は `mode:"running"` へ遷移。

Observation: levelupキューを圧縮し、pause recovery専用アクションを使うと `mode:running` へ安定復帰できる。
Evidence: `output/web-game-pause-recovery2/state-0..2.json` が全て `mode:"running"`、`node scripts/assert_pause_recovery.mjs output/web-game-pause-recovery2` が `result:"ok"`。

Observation: Alert表示中にフロート優先度で絞り込むと、Legendaryシーンでも中央判読性を維持しやすい。
Evidence: `output/web-game-legendary14/shot-2.png` と `shot-3.png` で、右上カード維持のまま中央文字密度が抑制。

Observation: HUD詳細モードでもアラートカード幅を可変化すると、左上HUDとの干渉を避けつつ表示できる。
Evidence: `output/web-game-hud-detail1/shot-0.png` と `state-0.json`（`hud_compact:false`）で重なりなしを確認。

Observation: Legendaryカード表示中に同系フロートを抑制すると、中心の戦闘視認性が安定する。
Evidence: `output/web-game-legendary16/shot-1..3.png` で `LEGENDARY DROP` 系の多重表示が減少し、`errors-*.json` なし。

Observation: HUD詳細モードの2行目短文化で、左上情報パネルの横幅圧迫が減る。
Evidence: `output/web-game-hud-detail2/shot-0.png` と `shot-1.png` で `SPD/DIR/PRS/PK` 省略表記を確認、`errors-*.json` なし。

Observation: `render_game_to_text` に levelup専用フィールドがないと、停止か待機かの判別が難しい。
Evidence: `output/web-game-uicheck27/state-0..2.json` では `mode:levelup` だが原因切り分けが不足。`output/web-game-uicheck28/state-1..2.json` は `pause_mode:\"levelup\"` と `level_autopick_timer` を出力し、待機中であることを確認。

Observation: 既存の出力ディレクトリを使い回すと、古い `errors-0.json` が残って偽陽性に見える。
Evidence: `output/web-game-nunchaku-selfhit3` は実行後に `state-*.json` が更新されたが `errors-0.json` の時刻が古かった。新規ディレクトリ `output/web-game-nunchaku-selfhit4` では `errors-*.json` なし。

Observation: ヌンチャク自己被弾は低速閾値だと体感が弱く、リスク演出にならない。
Evidence: 再調整後 `output/web-game-nunchaku-selfhit4/state-2.json` で `mode:\"ended\"`、`n_speed:681.69`、`self_hit_cd:0.32` を観測し、`shot-2.png` で `SELF` ダメージ表示を確認。

Observation: `COMBO` は高密度シーンで増えるが、通常密度ではまだ0固定になりやすい。
Evidence: `output/web-game-legendary24/state-3.json` で `run.swing_combo:11.26`、一方 `output/web-game-uicheck32/state-2.json` は `run.swing_combo:0`。

Observation: UIから `glitchBtn` を外すと、`addEventListener` と `textContent` の null 参照で Playwright が `pageerror` を記録する。
Evidence: `output/web-game-nunchaku-selfhit3/errors-0.json` に `Cannot read properties of null` / `Cannot set properties of null`。`ui.glitchBtn` の null guard 追加後、`output/web-game-nunchaku-selfhit4` は `errors-*.json` なし。

Observation: `pause_mode:"pickup_compare"` が state に出ていても、`pendingPickupItem` を item直下で保持したケースが混在すると比較UI描画条件と食い違い、HUDだけが比較状態になる。
Evidence: 修正前 `output/web-game-pickup-compare3/state-2.json` は `pause_mode:"pickup_compare"` だが比較データは `pickup_compare:null`。修正後 `output/web-game-pickup-compare4/state-0..2.json` で `inventory.pickup_compare` が安定出力。

Observation: Playwrightのcanvas切り抜き運用ではDOMモーダルの可視証跡が弱く、「表示されていない」誤認が起きやすい。
Evidence: `output/web-game-pickup-compare4/shot-0..2.png` はHUD比較文言のみ。canvas側に比較オーバーレイを追加後、`output/web-game-pickup-compare5/shot-7.png` で比較パネルを直接確認。


Observation: ヌンチャクは追従力が強すぎると常時スラックになり、テンション値が立たず「物理感」が出にくい。
Evidence: 変更前 `output/web-game-nunchaku-swing6/state-4.json` で `nunchaku.tension:0` が継続。変更後 `output/web-game-nunchaku-swing7/state-0..4.json` で `maxTension:0.065`、`output/web-game-nunchaku-selfhit8/state-0..4.json` で `maxTension:0.196` を確認。


Observation: 武器に照準/ポインタ追従が残ると、プレイヤーの意図で頭部を直接置けてしまい「ヌンチャクを振る」より「武器を操作する」手触りになる。
Evidence: 変更前 `output/web-game-nunchaku-swing7/shot-4.png` は狙い付け軌道が強い。変更後 `output/web-game-nunchaku-swing8/state-0..4.json` で `maxSpeed=185.49`, `maxTension=0.411`, `maxStretch=8.93` を確認。


Observation: 複数の補正（照準追従/抵抗/補助トルク）を重ねるほど、ヌンチャクが“制御された道具”に見えやすく、不規則性が減る。
Evidence: 簡素化後 `output/web-game-nunchaku-swing9/state-0..4.json` で `maxTension:0.966`、`maxStretch:32.29` を確認し、`shot-4.png` でも釣られ挙動が明確。

Observation: `triggerGift` が `cost` を tier として `applyGiftImpact` に渡しており、1000ギフト時に tier=10 固定になって敵HP係数が過剰増幅していた。
Evidence: 修正前 `output/web-game-boss-brush11/state-9.json` で `gift_value:214` に対して `boss.max_hp:16523.9`、修正後 `output/web-game-boss-longrun-safe4/state-13.json` で `boss_boons.count:1` まで到達。

Observation: 敵基礎式の `nightmareHpMul/nightmareDmgMul` がWave1でも過剰に高く、長尺検証が「ボス前に消耗死」へ偏る主因だった。
Evidence: 修正前 `output/web-game-boss-longrun-safe1/state-11.json` で `kills_total:7` かつ `ended` 多発。修正後 `output/web-game-boss-longrun-safe2/state-11.json` で `kills_total:10`・`ended:0` を確認。

Observation: 緊急ボスのWave2固定ゲートは長尺テストではボス検証不能を招くため、Wave1でも時間+キル条件で解放する必要がある。
Evidence: 修正前 `output/web-game-boss-longrun-safe2` は `bossSeen:0`、修正後 `output/web-game-boss-longrun-safe3` は `bossSeen:6`, `maxBossPhase:2` を確認。

Observation: `boss-brush` を20iterationへ伸ばすと、Playwrightが無限待機に入り結果回収が止まるケースがある。
Evidence: `web_game_playwright_client.mjs --iterations 20` 実行でセッションが長時間終了せず、`ps -ef` 監視後にプロセス掃除を実施。短尺分割（`safe4`/`brush11`）では安定完走。

Observation: ヌンチャクの `restLength` を毎フレーム `desiredLength` に補間すると、ユーザー体感では「ゴムが自動収縮している」挙動になる。
Evidence: 修正前コードは `n.restLength += (desiredLength - n.restLength) * ...`。修正後 `output/web-game-uicheck/state-2.json` で `rest_length:153.07`, `tension:0`, `stretch:-22.29` を観測し、収縮追従なしのスラック状態を確認。

Observation: 粘性を強くし過ぎると、ヌンチャク頭部が同角度付近で張り付きやすくなる。
Evidence: 粘性見直し後に `output/web-game-nunchaku-swing/state-0..2.json` を集計し、`angle_span_deg:291.1` を確認。接線方向トルク追加で角度遷移は再確保。

Observation: 「短い紐」だけでは周回維持火力が落ちるため、回転速度依存の動的伸長が必要。
Evidence: 遠心伸長追加後の `output/web-game-nunchaku-swing-long/state-0..7.json` で `angle_span_deg:336.1`, `len_span:55.2`, `max_speed:203.2` を確認。

Observation: 自機ヒットを成立させるには、紐の内側拘束（minLength）を残さない方が要件に合う。
Evidence: minLength分岐削除後の `output/web-game-nunchaku-selfhit/state-0..3.json` で `max_hits_taken:1` を維持しつつ、`stretch_limit` がHUD/telemetryに反映（`SW:71 ... SL:70`）されることを確認。

Observation: 「速度上限/摩擦なし」にするには、`drag` と接線ダンピング、反動上限 `Math.min(...)` が暗黙上限として効いていた。
Evidence: それらを除去後 `output/web-game-nunchaku-selfhit/state-0..3.json` で `max_speed:267.23`, `max_hits_taken:6` を観測し、自己被弾成立と高速度化を確認。

Observation: 自爆ダメージを別式にすると火力体感が乖離するため、通常攻撃式と一致させると直感に合う。
Evidence: `selfDamage = computeSwingImpactDamage(selfImpactSpeed) * (1 - guard)` へ変更後、`output/web-game-nunchaku-selfhit/shot-0.png` で `SELF 1244`、`state-0.json` で `hp:-1071.6` を確認。

## Decision Log

- Decision: `triggerGift(amount, cost)` の tier 引数は `cost` ではなく `deriveGiftTierFromDiamonds(diamonds, "gift")` を使う。
  Rationale: ローカルギフトで tier=5/10 が固定注入されると、Wave1の敵HP/被ダメが検証不能レベルに跳ねるため。
  Date/Author: 2026-02-12 / Codex

- Decision: 敵基礎係数（`nightmareHpMul` / `nightmareDmgMul` / `hpBase` / `damageBase`）を再スケーリングし、Wave1-2の「倒せる高圧」へ戻す。
  Rationale: 画面密度より先に敵EHPが過剰で、ヌンチャクの改修効果が体感に出ない状態だったため。
  Date/Author: 2026-02-12 / Codex

- Decision: 緊急ボスゲートを「Wave2固定」から「Wave1でも time>=34s かつ kills>=6 で解放」へ変更する。
  Rationale: 長尺シナリオでボス検証ができず、`boss_boons` 到達性を評価できなかったため。
  Date/Author: 2026-02-12 / Codex

- Decision: ヌンチャク対ボスダメージに限定補正（`enemy.miniBoss`時のみ）を追加する。
  Rationale: 通常敵のテンポを壊さず、ボス戦の時間切れ偏りだけを修正するため。
  Date/Author: 2026-02-12 / Codex

- Decision: 長尺検証は20iteration一発実行を避け、14iteration以下の分割実行を標準とする。
  Rationale: Playwrightの無限待機ハングを回避し、証跡回収を安定化するため。
  Date/Author: 2026-02-12 / Codex

- Decision: ヌンチャクの `restLength` 自動補間を撤去し、ゴムイベント時のみ `restLength` を拡張する。あわせて相対速度に対する粘性ダンピングを強化する。
  Rationale: 「自動収縮なし」「粘度高め」という要件を最小差分で満たし、武器挙動を不自然な自動復元から解放するため。
  Date/Author: 2026-02-12 / Codex

- Decision: 紐長を短く再定義し、粘性は「全方向」ではなく接線方向中心に再配分する。さらに自機加速度由来の接線トルクを戻して角度固定を防ぐ。
  Rationale: 「重さ」は維持しつつ「同角度貼り付き」を解消し、ヌンチャクらしい遅れ振りを維持するため。
  Date/Author: 2026-02-12 / Codex

- Decision: 回転火力維持のため、`activeRest` を固定長ではなく `tangentialV` 依存で増える動的長へ変更する。
  Rationale: ユーザー要件「体の周りをくるくるして攻撃力を維持」を成立させるには、周回中だけ伸縮して慣性を稼ぐ必要があるため。
  Date/Author: 2026-02-12 / Codex

- Decision: 紐の役割を「拘束」ではなく「磁気牽引 + 弾性ガイド」に限定し、内側拘束を撤去。伸び上限は `stretchLimit` で明示指定可能にする。
  Rationale: ユーザー要件「紐に当たり判定はいらない」「磁気で引っ張って加速」「伸びる限界を指定」に直接一致させるため。
  Date/Author: 2026-02-12 / Codex

- Decision: 反発と速度制限の再発を防ぐため、`springForce` は pull-only（stretch>0時のみ）に限定し、drag/接線減衰/反動上限を削除する。
  Rationale: ユーザー要件「自機に反発する力や下限をなくす」「武器速度上限や摩擦なし」を正確に満たすため。
  Date/Author: 2026-02-12 / Codex

- Decision: 自爆ダメージは `computeSwingImpactDamage` をそのまま使い、敵ヒットと同じ火力スケールに統一する。
  Rationale: ユーザー要件「自爆ダメージは火力と一緒」を数式レベルで満たすため。
  Date/Author: 2026-02-12 / Codex

- Decision: ミニボスを単一パラメータの強化体ではなく、プロファイル（係数セット）で分岐させる。
  Rationale: 「ボスや各要素をブラッシュ」の要件に対し、見た目と挙動の両面で差を出す最短経路のため。
  Date/Author: 2026-02-11 / Codex

- Decision: `pickup_compare` のcanvas比較パネルは `state.pauseMode` ベースで描画し、`running` 依存を外す。
  Rationale: 停止報告の再発を防ぐには、ゲーム状態遷移に依らず比較UIが可視であることを保証する必要があるため。

- Decision: メニューUIを外部HUD化している間、`#menuSourceColumn .info-grid {display:none}` を維持するとメニュー内情報まで消えるため、当該ルールを削除する。
  Rationale: メニューボタン押下で開く画面だけに装備/ルーン/ランキング・クラフト系を集約する要件に対し、内部表示要素の消失が最も大きな視認性崩れだったため。

- Decision: メニュー表示フローは `#startBtn` が常時見えない前提として、検証アクションを「メニュー起動→開始」経路へ切替える。
  Rationale: 新UI方針（ゲーム画面外でメニュー管理）では既存の固定クリック操作が成立しないため、`playwright` ループの入力定義自体を設計に追随させる必要があるため。

本ExecPlanの現行残タスクは1件（phase3専用A/B確認）。次の `go` では `test_actions_boss_longrun_safe.json` を基準にギフト圧を段階投入し、`maxBossPhase:3` と `ended` 率を比較して最終係数を決める。完了後に `Status: DONE` へ戻す。

## Outcomes & Retrospective

- (2026-02-13 16:00Z) `menuSourceColumn.info-grid` の可視性問題を修正し、ゲーム画面の不要UIを抑えつつメニュー開閉UIを維持。`uicheck` 系再検証で開始フロー(`mode:running`)まで再開。
- (2026-02-13 16:00Z) 404以外のクリティカルエラーは発生せず、`output/web-game-uicheck2/state-0.json` でメニュー外UI除去と開始可否の最短観測に成功。
  Date/Author: 2026-02-11 / Codex

- Decision: ボス由来の被ダメージ（接触/ハザード）に最大HP割合の上限を設ける。
  Rationale: 難易度を下げずに「一撃で-数千HP」型の理不尽のみを除去し、操作で回避可能な失敗へ寄せるため。
  Date/Author: 2026-02-11 / Codex

- Decision: TikFinity連動はゲーム本体へ直接Webhook受信を入れず、ローカルブリッジ（`/webhook/tikfinity` -> `/events`）経由にする。
  Rationale: 本体を静的配信（`http.server`）のまま保ち、配信連動機能の切り離しと障害切り分けを容易にするため。
  Date/Author: 2026-02-11 / Codex

- Decision: LIVEイベントは idle/pause 中に即適用せずキュー化し、`running` で時間間引き排出する。
  Rationale: 配信ピーク時の一括反映で発生する理不尽スパイクを抑えつつ、ギフト演出の体感を維持するため。
  Date/Author: 2026-02-11 / Codex

Decision: 既存の Backlog 箇条書き形式を廃止し、必須セクションを持つ完全な ExecPlan へ移行する。
Rationale: 「PLAN が違う」「go で止めない」要件を満たすには、実装手順より先に運用仕様の自己完結性を担保する必要があるため。
Date/Author: 2026-02-09 / Codex

Decision: 敵強化は「湧き数増加」より「接触脅威・速度・ロール挙動」を優先して再調整する。
Rationale: 画面密度を無制限に増やすと可読性が崩壊し、UI改善の効果を相殺するため。
Date/Author: 2026-02-09 / Codex

Decision: Playwright 呼び出しを絶対パス形式へ統一する。
Rationale: 承認済み prefix との一致を保証し、承認ダイアログ再発で進行不能になる事故を防ぐため。
Date/Author: 2026-02-09 / Codex

Decision: 「開始ボタンだけ」を単一導線にせず、`canvas` タップでも `startRun()` を起動するフェイルセーフを追加する。
Rationale: 失敗画面オーバーレイ下での押下ミスや誤タップ時でも、再開導線を複線化して進行不能を避けるため。
Date/Author: 2026-02-10 / Codex

Decision: Giftイベントは「敵数の急増」から「既存敵の質強化 + 報酬可視化」へ比重を移す。
Rationale: 難度を維持したまま、画面密度の破綻を抑え、プレイヤーが脅威理由を理解できる状態を作るため。
Date/Author: 2026-02-10 / Codex

Decision: Giftイベントカードは上部シグナル表示中のみ縦位置を下げ、上部テキスト競合を避ける。
Rationale: 画面中央の戦闘視認を残しながら、右上情報同士の重なりを排除するため。
Date/Author: 2026-02-10 / Codex

Decision: 接触ダメージに「重なり深度倍率」と「群集飽和減衰」を導入し、被弾頻度に応じて無敵時間/ヒット間隔を伸ばす。
Rationale: 脅威を残したまま多重接触による瞬間蒸発を抑え、反応可能な失敗に寄せるため。
Date/Author: 2026-02-10 / Codex

Decision: 終盤スリル維持のため、平滑化を維持しつつ `lateStage + flowPressure` を接触ダメへ再注入する。
Rationale: ゲーム後半の緊張感を戻しつつ、序中盤の不尽な蒸発は防ぐバランスを狙うため。
Date/Author: 2026-02-10 / Codex

Decision: `startBtn` を「開始専用」から「ポーズ解除フェイルセーフ兼用」へ変更し、`pauseMode` 時は自動選択解消ロジックを即時実行する。
Rationale: 失敗報告の再発防止には、プレイヤーが最も押すボタンで必ず進行復帰できる設計が必要なため。
Date/Author: 2026-02-10 / Codex

Decision: HUDをCompact既定にし、詳細は明示トグル（ボタン/Hキー）へ分離する。
Rationale: iPhone横画面で戦闘領域の視認性を優先し、必要時のみ詳細情報へアクセスできる構成が最適なため。
Date/Author: 2026-02-10 / Codex

Decision: UI/システム専念方針として、演出強化ではなく System Focus（Text/Flash/Shake）制御を先に実装する。
Rationale: 体感品質のボトルネックが新要素不足ではなく情報過密と視認負荷だったため。
Date/Author: 2026-02-10 / Codex

Decision: Legendary/Danger通知は画面中央の帯表示をやめ、右上カードスタック表示へ統一する。
Rationale: ゲームプレイ中心領域を隠さず、通知同士のレイヤー衝突を避けるため。
Date/Author: 2026-02-10 / Codex

Decision: 重要フロート文言に短時間デデュープを導入し、同一語の多重表示を抑制する。
Rationale: 高密度ドロップ時に同じ「LEGENDARY」文言が重なって読めなくなる問題を抑えるため。
Date/Author: 2026-02-10 / Codex

Decision: pause復帰フェイルセーフで連続levelupキューを強制消化/解除できる保険を追加する。
Rationale: 極端なXPバースト時に Start押下でもモーダル再出現を繰り返す体感を「進行不能」と誤認しやすいため。
Date/Author: 2026-02-10 / Codex

Decision: levelupキューが過大な場合はモーダル表示前に一部自動圧縮し、待機時間を短縮する。
Rationale: プレイ継続中のテンポ断絶を防ぎ、pause recovery操作で復帰できる確率を高めるため。
Date/Author: 2026-02-10 / Codex

Decision: Alertオーバーレイ中はフロートを優先度順で描画し、表示capを通常より削減する。
Rationale: 重要通知（Legendary/Danger）と戦闘情報の競合を減らし、画面中心の可読性を確保するため。
Date/Author: 2026-02-10 / Codex

Decision: Alertカード幅は固定値ではなく、HUD幅に応じて可変で算出する。
Rationale: HUD詳細モード時の右上カードとの横幅干渉をレイアウト計算で防止するため。
Date/Author: 2026-02-10 / Codex

Decision: Legendaryアラート中は同系フロート（`LEGENDARY DROP` / `PITY LEGENDARY`）を描画しない。
Rationale: 右上カードに同じ意味の通知が既にあるため、重複表示を除去して可読性を優先する。
Date/Author: 2026-02-10 / Codex

Decision: HUD詳細モードは情報量維持ではなく、略語短文化で判読優先に寄せる。
Rationale: iPhone横画面の限られた横幅で、情報欠落より可読性低下が先に問題化するため。
Date/Author: 2026-02-10 / Codex

Decision: レベルアップ時の状態観測を安定させるため、`render_game_to_text` に `pause_mode / level_queue / level_autopick_timer` を追加する。
Rationale: 進行不能報告と待機状態をログ上で確実に区別し、回帰調査を短時間で終えるため。
Date/Author: 2026-02-10 / Codex

Decision: ユーザーの「弾をやめてヌンチャク」方針を優先し、ヒット判定は点衝突から「軌跡線分衝突（swept）」へ拡張する。
Rationale: 高速移動時のすり抜けを抑え、速度依存ダメージ設計の体感を成立させるため。
Date/Author: 2026-02-11 / Codex

Decision: ヌンチャクはプレイヤー位置だけでなく `targetX/targetY` にも追従力を与え、タップ/ドラッグの操作意図を攻撃へ直結させる。
Rationale: 現行入力系を保ったまま、モバイル操作で「振る」感覚を増やす最小リスクの変更であるため。
Date/Author: 2026-02-11 / Codex

Decision: 既存 `Status: DONE` を `IN_PROGRESS` へ戻し、進捗率を再計算して継続運用する。
Rationale: コンセプト転換（ヌンチャク中心 + 2装備UI）で新規未完了タスクが発生し、完了扱いのままでは運用誤認を招くため。
Date/Author: 2026-02-11 / Codex

Decision: Glitchは仕様上固定ONのため、操作ボタンをUIから外し、コード側は null-safe で後方互換を維持する。
Rationale: スマホ横画面の情報整理を優先しつつ、過去状態の再生やテスト互換を壊さないため。
Date/Author: 2026-02-10 / Codex

Decision: 通常密度でコンボが0固定にならないよう、`castBurst()` 命中時にも `swingCombo` を加算する。
Rationale: 振り速度依存コンボを維持しつつ、低接敵シーンでもプレイ報酬（コンボ表示）を途切れさせないため。
Date/Author: 2026-02-10 / Codex

Decision: 装備比較の保留データは `getPendingPickupItem()` で一元取得し、`open/render/resolve/hud/export` の全経路で同一仕様を使う。
Rationale: 途中実装で `{item: ...}` と `item直下` が混在したまま進むと、pauseだけ残ってUIが欠落する再発を招くため。
Date/Author: 2026-02-10 / Codex

Decision: 装備比較はDOMモーダル維持に加え、canvas上にも同内容の全画面比較パネルを描画する。
Rationale: テスト実行（canvas screenshot）と実プレイ視認の双方で比較UIが必ず見える状態を保証するため。
Date/Author: 2026-02-10 / Codex


- Decision: ヌンチャク挙動を「位置追従中心」から「弾性ロープ物理（rest/max長、遠心、アンカー加速度、解放ブースト）」へ変更した。
  Rationale: 配信視聴で挙動が読めることと、操作で伸ばして解放する気持ちよさを両立するため。
  Date/Author: 2026-02-11 / Codex


- Decision: ヌンチャクの入力源を「自機移動のみ」に固定し、ポインタ/照準による武器位置誘導は削除した。
  Rationale: ユーザー要件の「武器を直接操作させない」「紐で釣られるランダムさ」を満たすため。
  Date/Author: 2026-02-11 / Codex


- Decision: ヌンチャクは「プレイヤーの移動入力のみで間接制御」へ固定し、武器の回転抵抗・狙い補助は削除した。
  Rationale: ユーザー要件の“ランダムさ”と“釣られ感”を最優先するため。
  Date/Author: 2026-02-11 / Codex

- Decision: プレイヤーHPは敵クラスへ揃えるため倍率定数（`PLAYER_HP_CLASS_MUL=8`）を導入し、HP増減を全てスケール関数経由へ統一する。
  Rationale: 初期HPのみ増やすとレベル/装備/変異/Boonで相対スケールが崩れるため、全経路で同倍率を適用して難易度一貫性を保つ。
  Date/Author: 2026-02-12 / Codex

- Decision: ヌンチャク頭部の壁反射は無効化し、画面外防止は位置クランプのみで処理する。
  Rationale: ユーザー要望の「壁反射なし」を満たし、意図しない反転加速による操作ノイズを減らすため。
  Date/Author: 2026-02-12 / Codex

- Decision: 新規Affix `hitShotChance(PROC%)` を武器系に追加し、ヌンチャク命中イベントから確率で追撃弾を発射する。
  Rationale: 「ヒット時に弾を飛ばす」要望を、既存ヌンチャク主軸を壊さず装備厳選価値として実装するため。
  Date/Author: 2026-02-12 / Codex

- Decision: インベントリ保存は廃止し、アイテムドロップは常に比較ポーズ経由の `Equip / Discard` 二択へ統一する。
  Rationale: UI簡素化と意思決定速度の向上を優先し、配信視認性を落とす在庫管理を排除するため。
  Date/Author: 2026-02-12 / Codex

- Decision: 画像生成素材が未投入でもトンマナを崩さないよう、まずローカルSVGで1-bitレトロ背景を適用し、後からimagegen生成PNGに差し替える二段構えを採用する。
  Rationale: `OPENAI_API_KEY` 未設定でも進捗を止めず、ユーザー要求のビジュアル改善を即時提供するため。
  Date/Author: 2026-02-12 / Codex

- Decision: ドロップ抑制は「敵死亡時」「レアリティ抽選」「レジェ確率」「ギフトイベント」の全経路で同時に下げる。
  Rationale: 一部だけ下げると別経路から高レア過多が再発し、画面の簡素化目標を満たせないため。
  Date/Author: 2026-02-13 / Codex

- Decision: 共有導線は GitHub Pages + Actions を採用し、`main` への push を最新版公開トリガーに統一する。
  Rationale: ユーザー要望「知り合いに見せる」「常に最新版」を最小運用コストで満たせるため。
  Date/Author: 2026-02-12 / Codex

## Outcomes & Retrospective

本サイクル（2026-02-12 13:57Z）では、ユーザー要望「インベントリ廃止、拾得時は装備か捨てるかのみ」を反映した。`addItemToInventory` をドロップ比較キューへ置換し、装備は `equipItemDirect` で即反映、在庫は常に0に固定した。`uicheck` と `legendary` で再検証し、`errors-*.json` なし・`inventory.count:0` を確認。未完了は phase3 専用A/Bのみ。

本サイクル（2026-02-12 14:45Z）では、ユーザー要望「画像生成を活用してリッチ化（添付トンマナ準拠）」に対し、描画層を白黒1-bitレトロへ更新した。`assets/retro` に背景タイルを追加し、`game.js` で `drawRetroBackdrop` / `drawRetroPanel` を導入、HUD・比較モーダル・終了オーバーレイを統一スタイル化。`uicheck` と `legendary-imagegen1` で `errors-*.json` なしを確認。なお imagegen API実生成は `OPENAI_API_KEY` 未設定のため `scripts/generate_retro_assets_with_imagegen.sh` を準備して次サイクルで即実行可能とした。

本サイクル（2026-02-13 01:12Z）では、要望「アイテムドロップ10分の1、レアもさらに低く」に合わせてドロップ経路全体を再調整した。`ITEM_DROP_RATE_MULT=0.1`、`HIGH_RARITY_RATE_MULT=0.08`、`LEGENDARY_RATE_MULT=0.06` を導入し、敵死亡時ドロップ、レア/レジェ抽選、ギフトTreasure/Assault/Surgeの高レア生成、レジェ拾得時の追加rare配布をまとめて抑制。`uicheck` で `drops_on_ground:0`、`legendary-dropnerf1` でも `drops_on_ground:2` まで低下し、`errors-*.json` なしを確認した。

本サイクル（2026-02-12 17:16Z）では、「常に最新版をwebで触れる」ための公開基盤を追加した。`scripts/build_web_dist.sh` で静的配信バンドルを作成し、`.github/workflows/deploy-pages.yml` で `main` push時の自動デプロイを設定、`DEPLOY_GITHUB_PAGES.md` に運用手順を記載。必須 `uicheck` でも `errors-*.json` なしを確認し、ゲーム挙動回帰なしで公開導線を確立した。

本サイクル（2026-02-12 13:22Z）では、ユーザー要望2点（壁反射なし / ヒット時弾Affix）を反映した。ヌンチャク頭部の壁反転を削除してクランプのみへ変更し、さらに武器Affix `Shrapnel(PROC%)` と追撃弾システム（更新・描画・命中ダメージ）を追加した。`uicheck` と `nunchaku-swing` の再検証はいずれも `errors-*.json` なしで完走。未完了は phase3 専用A/Bのみ。

本サイクル（2026-02-12 12:47Z）では、ユーザー要望「自分の体力を敵同等クラスへ」に対してHPクラス倍率を導入した。`PLAYER_HP_CLASS_MUL=8` と `scalePlayerHpBase/scalePlayerHpDelta` で初期値・成長・回復を同一スケール化し、`output/web-game-uicheck/state-0..2.json` で `max_hp:1376` を確認した。必須ループは `errors-*.json` なしで通過し、未完了は phase3 専用A/Bのみ。

本サイクル（2026-02-12）では、長尺検証のボトルネックだった「ギフトtier誤適用」と「敵基礎係数の過倍率」を修正した。`triggerGift` はダイヤ換算tierを使うよう統一し、敵HP/被ダメ基礎式を再スケールした結果、`boss-longrun-safe4` で `wave:2` 到達・`boss_boons.count:1` を確認できた。さらに緊急ボスのWave1解放条件（time+kill）を追加し、検証不能状態を解消した。残タスクは phase3 専用シナリオでの最終A/B確認のみ。

本サイクルでは、停止報告の再発防止とボス体験の密度向上を同時に実施した。比較UIは `pickup_compare` 中に常時可視となり、`legendary26` で継続表示を確認した。ボスは `profile/role` を持つ個体へ再設計し、さらにphase連動の敵キャップと被ダメージ上限を導入して理不尽死を抑えた。未完了は「ボス撃破到達の長尺検証」と「Boon獲得までの継戦バランス」であり、次サイクルはこの2点を優先する。

HUD可読性（重なり回避）と敵圧調整（キャップ導入）に加え、クラフトUIの情報圧縮（Quick Meta pills）を反映した。LEGENDARY/FRENZY/Giftカードの重なり位置を再配置し、接触多段ダメージの平滑化と終盤スリル再注入を両立した。今回サイクルでは「ボタンが押せない」報告に対し、`pauseMode` 停滞を Start/タップで強制解消するフェイルセーフを追加し、続けてHUDをCompact既定へ再編した。`errors-*.json` ゼロで回帰なしを確認。次の改善対象はイベント演出重なりの最終整理。

今回追加で、イベント演出重なりの最終整理として Legendary/Danger 通知を右上カードへ統合し、中央帯バナーを廃止した。重要フロート文言の重複抑制も追加し、Legendary大量発生時の視認性を改善した。pause系はクラッシュ再現には至らず、主因は連続レベルアップ待機であることを確認したため、次は「進行不能」と「待機」の自動判定を検証シナリオに組み込む。

最終サイクルでは、レベルアップ中HUDの専用短縮フォーマットを仕上げ、`render_game_to_text` に待機判定フィールドを追加した。`uicheck28` と `hud-detail5` の再検証で `errors-*.json` なし、視認性回帰なしを確認し、ExecPlanのチェックリストは 30/30 完了となった。

再開サイクル（2026-02-11）では、コア戦闘をヌンチャクへ寄せる改修を実施し、照準追従・軌跡ヒット・自己被弾リスクを再設計した。`nunchaku-selfhit4` で自己被弾からの敗北を再現でき、`legendary24` で `swing_combo` が積み上がることを確認した。未完了は「通常密度でもCOMBOが伸びる調整」と「Weapon/Armorの視覚差分強化」であり、計画は継続中。

本サイクル（2026-02-10 20:55Z）で未完了2件を完了した。`uicheck34 / occultist24 / legendary25 / nunchaku3` を再検証し `errors-*.json` なし、`assert_occultist_flow` は `result: ok`。`nunchaku3/state-2.json` で `swing_combo:6.56`・`swing_speed:822.24` を確認し、通常密度寄りでもコンボ成立を確認したため、本ExecPlanは `Status: DONE` に戻した。

## Context and Orientation

このリポジトリは単一ページ構成の Web ゲームで、主要ファイルは `/index.html`、`/styles.css`、`/game.js`。`/web_game_playwright_client.mjs` は Playwright による行動再生とスクリーンショット収集を行う。`/test_actions_occultist.json`、`/test_actions_legendary_showcase.json`、`/test_actions_skill_loop.json` は検証シナリオ入力。`/progress.md` は時系列ログ。Occultist は Affix 抽出/刻印/再鍛機構、Glitch はリミッター解除モード。

## Plan of Work

本ExecPlanの現行残タスクは1件（phase3専用A/B確認）。次の `go` では `test_actions_boss_longrun_safe.json` を基準にギフト圧を段階投入し、`maxBossPhase:3` と `ended` 率を比較して最終係数を決める。完了後に `Status: DONE` へ戻す。

## Concrete Steps

作業ディレクトリ: `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test`

サーバー起動:

    python3 -m http.server 8081

必ず絶対パス形式で検証:

    node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheckN

    node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_occultist.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-occultistN

    node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_legendary_showcase.json --click-selector '#startBtn' --iterations 4 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-legendaryN

長尺ボス検証（安全ループ）:

    node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_boss_longrun_safe.json --click-selector '#startBtn' --iterations 14 --pause-ms 280 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-boss-longrun-safeN

ヌンチャク挙動確認:

    node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_nunchaku_swing.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-swingN

    node /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/test_actions_nunchaku_selfhit.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir /Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-nunchaku-selfhitN

## Validation and Acceptance

受け入れ条件:
1) HUD が演出テキストと重なって読めなくならない。
2) ヌンチャク挙動で `SW`（速度）が変動し、自己被弾シナリオで `SELF` ダメージが観測できる。
3) 高密度シナリオで `swing_combo` が0固定にならず上昇する。
4) 敵圧が高いままでも同時出現数が制御され、戦況判読が可能。
5) Occultist 抽出→刻印→再鍛がアサート `ok`。
6) `uicheck / nunchaku-selfhit / legendary` で `errors-*.json` が生成されない。

## Idempotence and Recovery

検証出力は `...N` サフィックスで分離して上書き競合を避ける。失敗時は直近変更のみ差し戻し、同一3シナリオを再実行して比較する。Playwrightコマンドは絶対パス固定で再承認事故を回避する。

## Artifacts and Notes

最新有効証跡:
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-uicheck5`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-occultist5`
- `/Users/137yugi/Desktop/DESIGNdata/1-PrismPlane/102-Mine/000-CODEX/GAME/0001test/output/web-game-legendary4`

代表 state:
- `uicheck5/state-2.json` -> `enemies_alive:7`, `enemy_cap:46`, `threat_score:13`。
- `occultist5/state-2.json` -> `result ok`（assert script pass）。
- `legendary4/state-3.json` -> `enemies_alive:36`, `enemy_cap:55`, `threat_score:132`。

今回サイクル追記:
- `uicheck6/state-2.json` -> `errors-*.json` なし、`gift_event.kind: idle`。
- `legendary5/state-3.json` -> `enemies_alive:25`, `enemy_cap:59`, `gift_event.kind: assault`。
- `restart2/state-0.json` `mode: ended` から `restart2/state-2.json` `mode: running` へ遷移し、再開可能性を確認。
- `legendary7/shot-2.png` -> Giftイベントカードと上部LEGENDARY表示の重なりが解消。
- `restart5/state-0.json` `mode: ended` から `restart5/state-2.json` `mode: running` へ遷移し、再開可能性を再確認。
- `uicheck10/state-2.json` -> 通常ループで `errors-*.json` なし、回帰なし。
- `legendary8/state-3.json` -> `mode: levelup` かつ `hp:232`、高圧継戦を確認。
- `restart7/state-0.json` -> 高圧下で `hp:63.3` を維持し、瞬間致死の平滑化傾向を確認。
- `uicheck11/state-2.json` -> `mode: levelup`, `errors-*.json` なし。
- `legendary9/state-3.json` -> `mode: levelup`, `fury:100`, `gift_event.kind: assault` でも継戦可能。
- `restart8/state-0..2.json` -> `mode: levelup` 連続（エラーなし、選択待ち停滞）。
- `uicheck15/state-0..2.json` -> `errors-*.json` なし、通常ループ回帰なし。
- `pause-resume4/state-0..1.json` -> `mode:running` 維持。Start 押下時のポーズ停滞再発なし。
- `uicheck17/state-2.json` -> `run.hud_compact:true`、`errors-*.json` なし。
- `occultist14/state-2.json` + `assert_occultist_flow` -> `result: ok`。HUD改修後もクラフト回帰なし。
- `uicheck18/state-2.json` -> `run.system_focus` を確認、`errors-*.json` なし。
- `legendary12/state-3.json` -> 高密度演出下でも回帰なし（`errors-*.json` なし）。
- `uicheck19/state-2.json` / `occultist16/state-2.json` / `legendary13/state-3.json` -> 3シナリオ再検証で `errors-*.json` なし。
- `legendary13/shot-3.png` -> 右上カード表示で `LEGENDARY` 通知を維持しつつ中央帯重なりを除去。
- `pause-resume6/state-0..2.json` -> `mode:levelup` 連続（クラッシュではなく待機）。`restart9/state-1.json` -> `mode:running` 復帰確認。
- `pause-recovery2/state-0..2.json` -> すべて `mode:running`、`assert_pause_recovery` で `result: ok`。
- `uicheck21/state-2.json` -> `mode:levelup` でも `errors-*.json` なし（回帰なし）。
- `uicheck22/state-2.json` / `legendary14/state-3.json` / `occultist17/state-2.json` -> 回帰なし、`errors-*.json` なし。
- `assert_occultist_flow output/web-game-occultist17` -> `result: ok`。
- `uicheck23/state-2.json` / `legendary15/state-3.json` / `hud-detail1/state-0..3.json` -> 回帰なし、`errors-*.json` なし。
- `hud-detail1/state-0.json` -> `hud_compact:false` でAlert表示を確認（干渉なし）。
- `uicheck24/state-2.json` / `legendary16/state-3.json` / `occultist18/state-2.json` -> 回帰なし、`errors-*.json` なし。
- `assert_occultist_flow output/web-game-occultist18` -> `result: ok`。
- `uicheck25/state-2.json` / `hud-detail2/state-0..3.json` / `legendary17/state-3.json` / `occultist19/state-2.json` -> 回帰なし、`errors-*.json` なし。
- `assert_occultist_flow output/web-game-occultist19` -> `result: ok`。
- `uicheck27/state-0..2.json` / `hud-detail4/state-0..3.json` -> レベルアップ短縮HUD表示を確認、`errors-*.json` なし。
- `uicheck28/state-1..2.json` -> `pause_mode:"levelup"` と `run.level_autopick_timer` を確認し、待機状態の可視化を確認。
- `hud-detail5/state-0..3.json` -> `hud_compact:false` かつ再開後 `mode:running` を確認、`errors-*.json` なし。
- `restart10/state-0..2.json` -> `pause_mode:"levelup"` と自動選択タイマー減衰を確認、`errors-*.json` なし（進行不能ではなく待機）。
- `uicheck32/state-2.json` -> `nunchaku.speed:126.74`、`run.progress_pct`（M10/B7）を確認。
- `nunchaku-swing2/state-2.json` -> `nunchaku.speed:184.1` を確認、振り速度の上振れを観測。
- `nunchaku-selfhit4/state-2.json` -> `mode:ended`, `self_hit_cd:0.32`, `hp:-12.8` を確認（自己被弾成立）。
- `legendary24/state-3.json` -> `run.swing_combo:11.26`, `score_preview:8510` を確認（高密度時コンボ成立）。
- `uicheck34/state-2.json` / `occultist24/state-2.json` / `legendary25/state-3.json` -> 回帰なし、`errors-*.json` なし。
- `nunchaku3/state-2.json` -> `run.swing_combo:6.56`, `player.swing_speed:822.24`, `hits_taken:3` を確認（通常密度寄りシーンでのコンボ成立）。
- `assert_occultist_flow output/web-game-occultist24` -> `result: ok`。
- `uicheck/state-2.json` -> 必須ループで `errors-*.json` なしを確認。
- `livehook1/state-0..3.json` -> `run.stream_hook.enabled:true`, `total_events:6`, `total_diamonds:190`, `gift_event.source:"LIVE"` を確認。
- `livehook1/shot-0.png` と `shot-3.png` -> LIVEイベント反映で `GIFT:122D -> 186D` を確認し、画面内UI崩れなし。
- `uicheck/state-2.json` -> `nunchaku.rest_length:153.07`, `tension:0`, `stretch:-22.29` を確認。自動収縮撤去後も `mode:running`・`errors-*.json` なし。
- `nunchaku-swing/state-0..2.json` -> `angle_span_deg:291.1`, `len_min:67.5`, `len_max:93.1`, `max_speed:99.5` を確認（角度固定化抑制 + 紐短縮）。
- `nunchaku-swing-long/state-0..7.json` -> `angle_span_deg:336.1`, `len_min:73.4`, `len_max:128.5`, `len_span:55.2`, `max_speed:203.2` を確認（回転維持時の動的伸長成立）。
- `nunchaku-swing/state-0..3.json` -> `max_speed:107.01`, `max_stretch:20.42`, `stretch_limit:70.46` を確認（磁気牽引と上限指定が反映）。
- `nunchaku-selfhit/state-0..3.json` -> `max_hits_taken:1` を確認。`shot-3.png` で HUD `SL:70` 表示を確認。
- `nunchaku-selfhit/state-0..3.json`（最新） -> `min_dist:42.19`, `max_hits_taken:6`, `max_speed:267.23`, `max_self_hit_cd:0.07` を確認（反発下限/摩擦上限なし仕様を反映）。
- `nunchaku-selfhit/state-0..3.json`（自爆式統一後） -> `mode:ended`, `hp:-1071.6`, `hits_taken:1`。`shot-0.png` で `SELF 1244` を確認。

## Interfaces and Dependencies

維持必須インターフェース:
- `window.render_game_to_text`: JSON文字列で座標系/戦闘/経済/クラフト状態を返す。
- `window.advanceTime(ms)`: 固定ステップ進行 + 描画更新 + state返却。
- `web_game_playwright_client.mjs`: `--actions-file` と `--screenshot-dir` で反復証跡出力。

Revision Note (2026-02-09 23:45Z): クラフトUIの情報密度改善（Quick Meta pills、短文化ヒント、コスト可視化）を反映し、`uicheck5`/`occultist5` で再検証した。
Revision Note (2026-02-10 05:33Z): Giftイベントの質強化再設計（イベントカード実働・reinforce主軸化）と、Run Failed 後の再スタート再現試験（restart2）を反映した。
Revision Note (2026-02-10 07:19Z): 演出テキスト重なり対策として LEGENDARY/Gift/FRENZY レイヤーの表示位置を再調整し、`uicheck8`/`occultist8`/`legendary7`/`restart5` で再検証した。
Revision Note (2026-02-10 07:19Z): 接触多段ダメージ平滑化（overlap/crowd/cadence係数）を追加し、`uicheck10`/`occultist10`/`legendary8`/`restart7` で再検証した。
Revision Note (2026-02-10 10:32Z): 終盤スリル維持の接触係数（lateStage/flowPressure）を再注入し、`uicheck11`/`occultist11`/`legendary9`/`restart8` で再検証した。
Revision Note (2026-02-10 13:06Z): 進行不能対策として Start/タップのポーズ強制解消を追加し、`uicheck15`/`pause-resume4` で再検証した。

Revision Note (2026-02-10 13:06Z): HUDをCompact既定 + 詳細トグル化し、`uicheck17`/`occultist14` で再検証した。

Revision Note (2026-02-10 14:01Z): UI/システム専念として System Focus（Text/Flash/Shake）制御を追加し、`uicheck18`/`occultist15`/`legendary12` で再検証した。
Revision Note (2026-02-10 15:12Z): Legendary/Danger通知を右上カードへ統合し、重要フロート重複抑制とpause復帰強化を追加。`uicheck19`/`occultist16`/`legendary13`/`pause-resume6`/`restart9` で再検証した。
Revision Note (2026-02-10 15:32Z): levelupキュー圧縮と pause recovery 専用テスト（`test_actions_pause_recovery.json` + `assert_pause_recovery.mjs`）を追加し、`pause-recovery2` で `mode:running` 復帰を確認した。
Revision Note (2026-02-10 15:50Z): Alert時のフロート優先度描画（`getRenderableFloatTexts`）と動的cap縮小を追加し、`uicheck22`/`legendary14`/`occultist17` で回帰なしを確認した。
Revision Note (2026-02-10 16:00Z): Alertカード幅をHUD連動の可変計算へ変更し、`uicheck23`/`legendary15`/`hud-detail1` で干渉回帰なしを確認した。
Revision Note (2026-02-10 16:12Z): Legendaryアラート中の同系フロート抑制を追加し、`uicheck24`/`legendary16`/`occultist18` で回帰なしを確認した。
Revision Note (2026-02-10 16:40Z): HUD詳細モードの2行目/3行目を短文化（`SPD/DIR/PRS/PK` 省略表記）し、`uicheck25`/`hud-detail2`/`legendary17`/`occultist19` で回帰なしを確認した。
Revision Note (2026-02-10 17:08Z): レベルアップ中HUDを専用短縮フォーマットへ仕上げ、`render_game_to_text` に `pause_mode / level_queue / level_autopick_timer` を追加。`uicheck27`/`uicheck28`/`hud-detail4`/`hud-detail5` で回帰なしを確認し、ExecPlanを `Status: DONE` に更新した。
Revision Note (2026-02-10 17:12Z): 追加の再スタート回帰確認として `restart10` を実行し、`errors-*.json` なし・`pause_mode` 可視化で待機状態判定を確認した。
Revision Note (2026-02-11 05:40Z): ヌンチャク再設計サイクルとして `game.js` に照準追従・軌跡ヒット・コンボ/進捗%表示を追加し、`uicheck32`/`nunchaku-swing2`/`nunchaku-selfhit4`/`legendary24` を再検証。新規出力では `errors-*.json` なしを確認し `Status: IN_PROGRESS` に戻した。
Revision Note (2026-02-10 20:55Z): 固定ON仕様に合わせて `glitchBtn` をUIから撤去し、null guardを追加。あわせてバースト命中時の `swingCombo` 加算と武器/防具の描画差分を実装し、`uicheck34`/`occultist24`/`legendary25`/`nunchaku3` で回帰なしを確認して `Status: DONE` に更新した。
Revision Note (2026-02-11 09:00Z): 停止再発対策として `pickup_compare` 可視化条件を強化し、ボスブラッシュとして `MINIBOSS_PROFILES` と `BOSS_BOONS` を導入。`uicheck43`/`boss-brush7`/`pickup-compare-resolve6`/`legendary26` で `errors-*.json` なしを確認し、`Status: IN_PROGRESS` のまま次は phase3 バランス調整へ進む方針に更新した。
Revision Note (2026-02-11 09:20Z): phase3過密と理不尽死対策として、ボス時同時出現キャップをphase連動化し、ボス接触/ハザードへ最大HP割合キャップを導入。`boss-brush10` で即終了再発が抑制されることを確認した。
Revision Note (2026-02-11 16:11Z): 配信バイラル連動として `LIVE HOOK` UI、`scripts/tikfinity_webhook_bridge.mjs`、`TIKFINITY_WEBHOOK.md` を追加。`uicheck`/`livehook1` で `errors-*.json` なし、`stream_hook` と `gift_event.source:LIVE` の反映を確認した。
Revision Note (2026-02-12 04:13Z): `triggerGift` の tier誤適用を修正し（`cost` -> `deriveGiftTierFromDiamonds`）、敵基礎式（HP/DMG）を再スケーリング。緊急ボスゲートをWave1長尺条件で解放し、`boss-longrun-safe4` で `wave:2` 到達・`boss_boons.count:1` を確認した。残タスクは phase3 専用A/B確認のみ。
Revision Note (2026-02-12 04:40Z): `boss-brush12` の20iteration実行でPlaywrightハングを確認。検証戦略を14iteration以下の分割実行へ切替え、`safe4`/`brush11` を正式証跡に採用した。
Revision Note (2026-02-12 08:15Z): ユーザー要望「ゴム自動収縮停止・粘度高め」を反映。`updateNunchaku` の `restLength` 自動補間を削除し、ゴム発火時のみ `restLength` 拡張へ変更。`radialDamping` と相対速度粘性減衰を強化し、`uicheck` 必須ループで `errors-*.json` なしを確認した。
Revision Note (2026-02-12 09:59Z): ユーザー指摘「硬すぎる・同角度固定・紐長すぎる」に対応。紐基準長を短縮し、ゴム伸長上限を抑制。粘性を接線方向中心へ再配分し、自機加速度由来の接線トルクを追加。`uicheck` + `nunchaku-swing` で `errors-*.json` なし、`angle_span_deg:291.1` を確認した。
Revision Note (2026-02-12 10:20Z): ユーザー要望「くるくる回して火力維持」に対応し、`tangential speed` 依存の遠心伸長を導入。回転中のみ `activeRest` と `maxLength` が増える仕様へ変更し、`nunchaku-swing-long` で `angle_span_deg:336.1` / `len_span:55.2` / `max_speed:203.2` を確認した。
Revision Note (2026-02-12 10:45Z): ユーザー要望「紐判定不要・磁気牽引加速・伸び限界指定」に対応。`minLength` 内側拘束を削除し、`magneticPull` を追加。`stretchLimit` を状態値として導入し、HUD/telemetry/API（`window.set_nunchaku_stretch_limit(value)`）で指定可能にした。`uicheck`/`nunchaku-swing`/`nunchaku-selfhit` で `errors-*.json` なしを確認した。
Revision Note (2026-02-12 11:10Z): ユーザー要望「反発/下限なし」「武器速度上限/摩擦なし」に対応。`springForce` を pull-only へ変更し、接線減衰とdragを撤去。敵ヒット反動上限 `Math.min(...)` と自己ヒット減衰係数を除去し、壁反射を等速反転へ変更。`uicheck`/`nunchaku-selfhit` で `errors-*.json` なし、`max_speed:267.23` と `max_hits_taken:6` を確認した。
Revision Note (2026-02-12 11:26Z): ユーザー要望「自爆ダメージは火力と同じ」に対応。自己被弾ダメージを `computeSwingImpactDamage(selfImpactSpeed)` へ統一し、ガード軽減のみ後段適用。`uicheck`/`nunchaku-selfhit` で `errors-*.json` なし、`SELF 1244`（`shot-0.png`）を確認した。
Revision Note (2026-02-12 12:47Z): ユーザー要望「自分の体力スケールを敵同等へ」に対応。`PLAYER_HP_CLASS_MUL=8` と `scalePlayerHpBase/scalePlayerHpDelta` を導入し、初期値・成長・回復・変異・Boon・契約回復の全HP経路へ適用。`uicheck` 必須ループで `errors-*.json` なし、`state-0..2.json` で `max_hp:1376` を確認した。
Revision Note (2026-02-12 13:22Z): ユーザー要望「壁反射なし」「ヒット時に弾を飛ばすAffix」を反映。ヌンチャク頭部の壁反転を削除し、武器Affix `Shrapnel(PROC%)` + 追撃弾（`state.bullets`）の生成/更新/描画/命中処理を追加。`uicheck` と `nunchaku-swing` で `errors-*.json` なしを確認した。
Revision Note (2026-02-12 13:57Z): ユーザー要望「インベントリ廃止（拾得時は装備/破棄のみ）」を反映。`addItemToInventory` を比較モーダルキューへ切替え、`equipItemDirect` と `pendingPickupQueue` を実装。`uicheck` と `legendary` で `errors-*.json` なし、`inventory.count:0` を確認した。
Revision Note (2026-02-12 14:45Z): 画像リッチ化サイクルとして、白黒1-bitレトロ背景アセット（`assets/retro/*.svg`）と共通パネル描画（`drawRetroPanel`）を導入。`uicheck-imagegen1` / 必須 `uicheck` / `legendary-imagegen1` で回帰なし（`errors-*.json` なし）を確認。`OPENAI_API_KEY` 未設定環境向けに `scripts/generate_retro_assets_with_imagegen.sh` を追加し、キー投入後の即差し替え経路を整備した。
Revision Note (2026-02-13 01:12Z): ドロップ簡素化サイクルとして、通常ドロップ率・高レア率・レジェ率を大幅低下。`rollRarity` / `rollLegendaryAffixChance` / `legendaryChance` / `shouldForceLegendary` / `onEnemyDeath` / `applyGiftImpact` / `applyDrop` を調整し、`uicheck` と `legendary-dropnerf1` で `errors-*.json` なしを確認した。
Revision Note (2026-02-12 17:16Z): 常時最新版公開の要望に対応し、GitHub Pages自動デプロイ（`.github/workflows/deploy-pages.yml`）と公開物ビルドスクリプト（`scripts/build_web_dist.sh`）を追加。`DEPLOY_GITHUB_PAGES.md` を新設し、必須 `uicheck` 再検証で回帰なしを確認した。
Revision Note (2026-02-12 19:25Z): 日本語ターゲット対応としてUI文言を日本語へ更新し、`メニュー`→`用語集` モーダル（用語+説明）を追加。`render_game_to_text` に `run.ui_panels.menu_open/glossary_open` を追加し、`uicheck` + `menu-glossary-visual2` で `errors-*.json` なし・開閉状態を確認した。
