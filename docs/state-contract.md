# `render_game_to_text()` State Contract

`window.render_game_to_text()` は JSON 文字列を返します。Playwright と外部QAはこの契約を使います。

必須トップレベル:

- `coordinate_system`: `origin top-left, x right positive, y down positive, units=canvas px`
- `canvas`: `{ width, height, layout, play_bounds }`。`layout` は `landscape | portrait`。縦画面起動時は内部ステージ座標も縦長になります。`play_bounds` はHUD/操作デッキに隠れない実プレイ範囲です。
- `mode`: `title | running | ended`
- `pause_mode`: `null | menu | levelup | mutation | pickup_compare`
- `score`: 現在確定スコア
- `build`: 闘士名、ジョブ、呪鎖武器タイプ
- `season`: 2週間シーズンID、開始/終了時刻、残日数
- `leaderboard`: シーズン別ローカルランキング件数、最高スコア、自己ベスト、プロフィール入力済み件数
- `feedback`: シーズン別の意見/文句保存件数
- `combat`: 取得スキル/変異、戦闘補正、直近ヒット情報
- `input`: キーボード/ポインタ入力状態、SP/iPad相対ドラッグの仮想スティック状態
- `player`: 位置、HP、レベル、XP、速度
- `run`: wave、time、enemy数、boss、gift、UIパネル、障害物
- `nunchaku`: 呪鎖武器headの位置、速度、長さ、テンション、stretch。内部キー名は互換維持で `nunchaku` のままです。
- `phantoms`: 分裂導線配列。未取得時は空配列
- `objective`: 契約状態または `null`
- `economy`: デモエネルギー、ギフト、レジェンダリー、スコア予測
- `inventory`: 現在装備、装備由来補正、pickup比較、レア度/アフィックスカタログ
- `enemies`: 画面上の主要観客モンスター配列
- `drops`: 画面上の主要ドロップ配列

## 追加契約

シーズン/ランキング:

- `season.storage_key`: 現在シーズン保存キー。現行は `synapse_storm_season_v1`。
- `season.id`: `S{3桁index}-{UTC開始日YYYYMMDD}`。14日ごとに進みます。
- `leaderboard.storage_key`: ランキング保存キー。現行は `nunchaku_overdrive_scores_v1`。
- `leaderboard.season_id`: 集計対象の `season.id`。
- `leaderboard.top_score`: 対象シーズンの最高スコア。自己ベストと同値です。
- `leaderboard.personal_best_score`: 対象シーズンの自己ベストスコア。記録なしなら `0`。
- `leaderboard.personal_best_entry_id`: 自己ベスト行のID。記録なしなら `null`。
- `leaderboard.personal_best_at`: 自己ベスト記録時刻ms。記録なしなら `null`。
- `leaderboard.personal_best`: `{ storage_key, season_id, score, entry_id, at, rank, profile, has_profile }`。
- `leaderboard.profiles`: 対象シーズンでプロフィール入力済みのランキング行数。

入力:

- `input.left/right/up/down`: キーボード方向入力の押下状態。
- `input.pointer_active`: Canvas上のポインタ入力が継続中か。
- `input.pointer_mode`: `absolute | relative`。PCマウスは移動先指定の `absolute`、SP/iPadのタッチ/ペンは相対ドラッグの `relative` です。
- `input.pointer_x/y`: 現在のポインタ位置。座標系はCanvas pxです。
- `input.drag_start_x/y`: 相対ドラッグ開始点。
- `input.drag_delta_x/y`: 開始点から現在点までの差分。仮想スティック半径を超えていても生の差分を保持します。
- `input.joystick_x/y`: `-1..1` に正規化した仮想スティック入力。離すと `0` へ戻ります。
- `input.joystick_radius`: 相対ドラッグを最大入力として扱う半径px。現行は `72`。

ウェーブ進行:

- `run.wave_state`: `spawning | fighting | reward`。`reward` は全滅後の安全時間です。
- `run.wave_target`: 現ウェーブの出現予定数。
- `run.wave_spawned`: 現ウェーブで出現済みの数。
- `run.wave_remaining`: 現ウェーブで未撃破の目標数。
- `run.wave_clear_count`: 全滅済みウェーブ数。
- `run.wave_xp_required`: 現ウェーブ/レベル基準のXP要求量。
- `run.boss_defeated`: そのランで王者ボスを1体以上撃破したか。
- `run.boss_kills`: そのランで撃破した王者ボス数。
- `run.next_boss_wave`: 次に王者ボスが出る予定wave。初回はWave15、撃破後は10wave後へ更新されます。

ギフト/広告:

- `run.gift_event`: 直近ギフト効果。`kind/timer/source` を持ちます。
- `run.gift_obstacles`: 呪い看板封鎖など、物理的に進路を塞ぐギフト障害物。
- `run.selected_ad_id`: 直近ギフトで抽選された広告ID。未発生時は `null`。
- `run.active_ads`: 画面上を流れている広告おじゃま。`instance_id/id/type/brand/lane/x/y/w/h/life_left/speed/opacity/rarity` を持ちます。
- `run.ad_queue`: 同時表示上限を超えて待機中の広告。`id/source/diamonds/tier/queued_at` を持ちます。
- `run.ad_catalog_count`: 運営管理カタログの広告件数。

スキル/分裂:

- `combat.skill_catalog_count`: レベルアップ能力の総数。現行は38以上。
- `combat.equipment_affix_catalog_count`: 装備アフィックス総数。現行は37以上。
- `combat.skill_stacks`: スキルIDごとの取得回数。分裂導線、高速回転、反射、衝撃波、連鎖、丸鋸、重力、低HP過給、会心、処刑、吸命、状態異常などの重複確認に使います。
- `combat.phantom_nunchaku`: 分裂導線数。内部キー名は互換維持で `phantom_nunchaku` のままです。
- `combat.effective_damage_multiplier`: 通常火力、丸鋸、低HP過給を含めた現在の実効火力倍率。
- `combat.rage_multiplier`: 低HP過給で上がる倍率。未取得またはHP十分なら `1`。
- `combat.spin_bonus` / `combat.reflect_stacks`: 高速回転と反射系の現在値。
- `combat.melee_cd`: 近接武器の短い再発動待ち秒数。
- `combat.melee_facing`: 近接半円判定に使うプレイヤー進行方向ベクトル `{ x, y }`。移動停止中は直前の向きを保持します。
- `combat.visual_effects[]`: 戦闘演出の公開配列。`id/kind/x/y/x2/y2/radius/color/life_left/max_life/angle` を持ちます。`kind: melee_slash` は近接武器命中時の進行方向半円斬撃、`angle` は `x/y` から `x2/y2` への向きです。
- `combat.style`: DMC風のスタイリッシュランク状態。`rank/gauge/max/progress/multiplier/kill_chain/chain_timer/bonus_score/peak_multiplier/rank_ups` を持ちます。高速の呪鎖武器運動と短時間連続撃破で上がり、戦闘中に0まで落ちると `rank: D` / `multiplier: 1` へ戻ります。倍率は以後のXP、ドロップ運、撃破ボーナスに重複適用されます。
- `phantoms[]`: 各分裂導線の `x/y/prev_x/prev_y/vx/vy/speed/rest_length/max_length/tension/stretch/r/source`。本体 `nunchaku` と同じく慣性/テンションで動く追加ヘッドを追うための配列です。

装備:

- `inventory.rarity_order`: `common | magic | rare | epic | legendary | ancient` の6段階。表示ラベルと色も含みます。
- `inventory.affix_catalog_count`: 装備アフィックス総数。30未満は不合格です。
- `inventory.equipped_item`: 互換用の代表装備。呪鎖武器装備を優先し、なければ闘士防具です。未装備時は `null`。
- `inventory.equipment_slots.body`: 闘士防具。`label/power/item` を持ちます。
- `inventory.equipment_slots.nunchaku`: 呪鎖武器装備。`label/power/item` を持ちます。
- `inventory.equipment_mods`: 装備由来の最終補正。`damageMul`, `speedBonus`, `reachBonus`, `pickupBonus`, `maxHpBonus`, `headRadiusBonus`, `critChance`, `bossDamage`, `xpMul`, `dropLuck`, `shockwaveStacks`, `chainStacks`, `reflectStacks`, `gravityStacks`, `bleedStacks`, `cloneCount` など。
- `inventory.slot_mods.body` / `inventory.slot_mods.nunchaku`: スロット別の装備補正。
- `inventory.pickup_compare.slot`: `body | nunchaku`。
- `inventory.pickup_compare.slot_label`: UI表示ラベル。テーマ上は `本体装備 | ヌンチャク装備`、内部互換で旧ラベルが残る場合があります。
- `inventory.pickup_compare.drop_item`: 拾った装備候補。アフィックス一覧つき。
- `inventory.pickup_compare.current_item`: 現在装備。未装備時は `null`。
- `inventory.slot_event`: 装備ドロップ比較中に低確率で出る無料スロット演出。`id/item_name/rarity/symbols/outcome/label/multiplier/timer/max_timer/settled` を持ちます。実課金ではなくゲーム内演出で、bonus/jackpot時は装備powerやXP/デモエネルギーなどのラン内報酬へ反映されます。
- 装備 item snapshot: `id/name/slot/slot_label/base_name/asset_id/rarity/rarity_label/color/power/wave/affixes` を持ちます。`asset_id` は装備画像と Phaser texture の照合に使います。
- `drops[].item`: 装備ドロップ時の item snapshot。XPの場合は `null`。

## 公開QAフック

- `window.render_game_to_text()`: 上記 snapshot を JSON 文字列で返します。
- `window.advanceTime(ms)`: `ms` を 60fps 相当の step 数に丸めて進め、描画/DOM同期後の snapshot JSON 文字列を返します。非数値や負数は安全値に丸められ、`0` は no-op です。このフック使用後は Playwright が決定的に進められるよう Phaser の自動 simulation step を抑止します。
- `window.injectTikfinityEvent(payload)`: TikFinity互換payloadを正規化して投入します。`mode: running` / `pause_mode: null` / `run.wave_state: fighting` の通常戦闘中だけ即時適用して `true` を返します。タイトル/終了/各種pause/報酬回収/次wave出現中はキューして `false` を返します。重複IDも `false` です。キュー数と猶予は `run.live_queue` / `run.live_queue_release_timer` で確認します。
- `window.receiveTerminalLiveEvent(envelope)`: 端末入力ON中だけ、`{ source: "stream-raid-terminal", channel, event }` または `{ source: "stream-raid-terminal", channel, events }` を受信します。戻り値は受信できたイベント数です。OFF中、`source` 不一致、または `channel` 未指定/不一致のpayloadは `0` を返します。
- `window.exportSeasonReview(seasonId?)`: 指定シーズンまたは現シーズンの意見/ランキングを、次シーズン改善レビュー用JSON文字列で返します。`storage_keys` と `leaderboard.personal_best` を含みます。
- `window.set_nunchaku_stretch_limit(value)`: QA用に呪鎖武器の最大長を 88-220 の範囲へ丸めて変更します。内部API名は互換維持で `nunchaku` のままです。戻り値はありません。

## ライブ入力契約

同一端末ブラウザ入力が現行の主経路です。メニューの `ライブ入力` で `TikTok ID` を保存して受信ONにすると、ゲームは以下の入力を待ち受けます。通常UIではチャンネル入力を隠し、既定チャンネル `stream-raid-live-v1` を使います。

- `window.postMessage(envelope, "*")`
- `BroadcastChannel(<端末チャンネル>)`。既定チャンネルは `stream-raid-live-v1`。
- `localStorage` の `stream_raid_terminal_event_v1` にJSON文字列を書き込んだときの storage event。
- `window` または `document` へ投げる `stream-raid-live-event` CustomEvent。

`envelope` は端末チャンネル名と単一イベントまたはイベント配列を含むオブジェクトです。`channel` が現在の受信チャンネルと一致しない場合は受信しません。各イベントは `eventType` / `type`, `sender` / `uniqueId`, `giftName`, `diamondCount` / `diamonds`, `repeatCount`, `id` などの TikFinity 互換payloadを受け取り、内部では `window.injectTikfinityEvent(payload)` と同じ正規化・重複排除・キュー制御へ流れます。

イベント種別は正規化後に `gift` / `like` / `chat` / `follow` / `share` / `ad_obstacle` として扱われます。`like` は高頻度入力向けに軽量で、ギフト経済、敵、広告、ドロップを増やしません。`chat` は小規模な敵追加、`follow` は支援エネルギー/回復、`share` は補給ドロップ、`gift` は既存ギフト、`ad_obstacle` は既存広告おじゃまです。

ローカル Node bridge は legacy/開発補助扱いです。`/events` ポーリングや `/stream` SSE は外部ツール検証用に残りますが、状態契約としては同一端末ブラウザ入力と `window.injectTikfinityEvent(payload)` を優先します。

### live storm/連投耐久で使う既存キー

連投耐久テストは GameSim 専用状態を前提にせず、次の既存キーを観測します。

- `run.live_queue`: pause中、報酬回収中、wave出現中など、即時適用できないライブイベントの待機数。
- `run.live_queue_release_timer`: キュー解放までの猶予。数値で、負数/NaNにならないこと。
- `run.live_pressure`: 直近のライブ入力圧。時間で減衰し、連投時に上がります。
- `run.live_storm`: 連投圧が閾値を超えてスポンサー襲来状態になっているか。
- `run.live_storm_timer`: `live_storm` 残り秒数。
- `run.live_applause_gauge` / `run.live_applause_gauge_max`: いいね・コメント・シェアで溜まるラン内の喝采ゲージ。ギフトとは別軸。
- `run.live_applause_wave_gain`: 現waveで獲得した喝采量。満タン超過分もここに含めます。
- `run.live_applause_last_wave_gain` / `run.live_applause_last_wave`: 直前waveの喝采量と対象wave番号。
- `run.live_applause_next_cap_preview`: 現wave獲得量の120%を反映した次上限候補。上限は下がらず、進むほど溜まりにくくなります。
- `run.live_applause_fever_ready`: 満タン到達済みで、次wave頭に喝采フィーバーを予約しているか。
- `run.live_applause_fever_active`: 現wave頭で喝采フィーバーが発生し、`run.live_wave_score_bonus` / `run.live_wave_drop_bonus` が有効か。
- `run.dropped_live_events`: キュー上限超過時に圧縮/破棄したライブイベント数。
- `run.gift_event`: 直近で適用されたギフト効果。連投時も `kind/timer/source` が破損しないこと。
- `run.active_ads` / `run.ad_queue` / `run.gift_obstacles`: 広告おじゃま、待機広告、物理障害物の同時表示/待機状態。
- `score` / `economy.gift` / `economy.diamonds`: 重複IDが二重加算されないことを確認する集計値。
- `mode` / `pause_mode` / `run.wave_state`: 即時適用かキュー投入かを判定する状態。

追加の状態キーを増やす場合は、既存の `run` 配下に集約し、`live_received_count`、`live_applied_count`、`live_dropped_duplicate_count`、`live_last_event_id` のように端末入力UIの表示値と照合できる集計に限定します。

互換維持:

- 旧 `?phase3_debug=1` は `?boss_debug=1` と同じ扱い。
- 旧 `?boss_phase3=A|B` は `?balance=A|B` と同じ扱い。
