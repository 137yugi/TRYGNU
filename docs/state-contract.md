# `render_game_to_text()` State Contract

`window.render_game_to_text()` は JSON 文字列を返します。Playwright と外部QAはこの契約を使います。

必須トップレベル:

- `coordinate_system`: `origin top-left, x right positive, y down positive, units=canvas px`
- `canvas`: `{ width, height }`
- `mode`: `title | running | ended`
- `pause_mode`: `null | menu | levelup | mutation | pickup_compare`
- `score`: 現在確定スコア
- `build`: 細胞コード名、免疫細胞タイプ、抗体鎖タイプ
- `combat`: 取得スキル/変異、戦闘補正、直近ヒット情報
- `player`: 位置、HP、レベル、XP、速度
- `run`: wave、time、enemy数、boss、gift、UIパネル、障害物
- `nunchaku`: 抗体ヌンチャクのhead位置、速度、長さ、テンション、stretch。内部キー名は互換維持で `nunchaku` のままです。
- `phantoms`: 分裂抗体ヌンチャク配列。未取得時は空配列
- `objective`: 契約状態または `null`
- `economy`: デモエネルギー、ギフト、レジェンダリー、スコア予測
- `inventory`: 現在装備、装備由来補正、pickup比較、レア度/アフィックスカタログ
- `enemies`: 画面上の主要病原体配列
- `drops`: 画面上の主要ドロップ配列

## 追加契約

ウェーブ進行:

- `run.wave_state`: `spawning | fighting | reward`。`reward` は全滅後の安全時間です。
- `run.wave_target`: 現ウェーブの出現予定数。
- `run.wave_spawned`: 現ウェーブで出現済みの数。
- `run.wave_remaining`: 現ウェーブで未撃破の目標数。
- `run.wave_clear_count`: 全滅済みウェーブ数。
- `run.wave_xp_required`: 現ウェーブ/レベル基準のXP要求量。
- `run.boss_defeated`: そのランで大型感染体を1体以上撃破したか。
- `run.boss_kills`: そのランで撃破した大型感染体数。
- `run.next_boss_wave`: 次に大型感染体が出る予定wave。初回はWave15、撃破後は10wave後へ更新されます。

スキル/分裂:

- `combat.skill_catalog_count`: レベルアップ能力の総数。現行は38以上。
- `combat.equipment_affix_catalog_count`: 装備アフィックス総数。現行は37以上。
- `combat.skill_stacks`: スキルIDごとの取得回数。分裂抗体ヌンチャク、高速回転、反射、衝撃波、連鎖、丸鋸、重力、低HP過給、会心、処刑、吸命、状態異常などの重複確認に使います。
- `combat.phantom_nunchaku`: 分裂抗体ヌンチャク数。
- `combat.effective_damage_multiplier`: 通常火力、丸鋸、低HP過給を含めた現在の実効火力倍率。
- `combat.rage_multiplier`: 低HP過給で上がる倍率。未取得またはHP十分なら `1`。
- `combat.spin_bonus` / `combat.reflect_stacks`: 高速回転と反射系の現在値。
- `phantoms[]`: 各分裂抗体ヌンチャクの `x/y/prev_x/prev_y/vx/vy/speed/rest_length/max_length/tension/stretch/snap_flash/r/source`。本体ヌンチャクと同じく慣性/テンションで動く追加ヘッドを追うための配列です。

装備:

- `inventory.rarity_order`: `common | magic | rare | epic | legendary | ancient` の6段階。表示ラベルと色も含みます。
- `inventory.affix_catalog_count`: 装備アフィックス総数。30未満は不合格です。
- `inventory.equipped_item`: 互換用の代表装備。抗体鎖装備を優先し、なければ細胞膜装備です。未装備時は `null`。
- `inventory.equipment_slots.body`: 細胞膜装備。`label/power/item` を持ちます。
- `inventory.equipment_slots.nunchaku`: 抗体鎖装備。`label/power/item` を持ちます。
- `inventory.equipment_mods`: 装備由来の最終補正。`damageMul`, `speedBonus`, `reachBonus`, `snapCdMul`, `pickupBonus`, `maxHpBonus`, `headRadiusBonus`, `critChance`, `bossDamage`, `xpMul`, `dropLuck`, `shockwaveStacks`, `chainStacks`, `reflectStacks`, `gravityStacks`, `bleedStacks`, `cloneCount` など。
- `inventory.slot_mods.body` / `inventory.slot_mods.nunchaku`: スロット別の装備補正。
- `inventory.pickup_compare.slot`: `body | nunchaku`。
- `inventory.pickup_compare.slot_label`: UI表示ラベル。テーマ上は `細胞膜装備 | 抗体鎖装備`、内部互換で旧ラベルが残る場合があります。
- `inventory.pickup_compare.drop_item`: 拾った装備候補。アフィックス一覧つき。
- `inventory.pickup_compare.current_item`: 現在装備。未装備時は `null`。
- 装備 item snapshot: `id/name/slot/slot_label/base_name/asset_id/rarity/rarity_label/color/power/wave/affixes` を持ちます。`asset_id` は装備画像と Phaser texture の照合に使います。
- `drops[].item`: 装備ドロップ時の item snapshot。XPの場合は `null`。

## 公開QAフック

- `window.render_game_to_text()`: 上記 snapshot を JSON 文字列で返します。
- `window.advanceTime(ms)`: `ms` を 60fps 相当の step 数に丸めて進め、描画/DOM同期後の snapshot JSON 文字列を返します。非数値や負数は安全値に丸められ、`0` は no-op です。このフック使用後は Playwright が決定的に進められるよう Phaser の自動 simulation step を抑止します。
- `window.injectTikfinityEvent(payload)`: TikFinity互換payloadを正規化して投入します。`mode: running` / `pause_mode: null` / `run.wave_state: fighting` の通常戦闘中だけ即時適用して `true` を返します。タイトル/終了/各種pause/報酬回収/次wave出現中はキューして `false` を返します。重複IDも `false` です。キュー数と猶予は `run.live_queue` / `run.live_queue_release_timer` で確認します。
- `window.set_nunchaku_stretch_limit(value)`: QA用に抗体ヌンチャク最大長を 88-220 の範囲へ丸めて変更します。内部API名は互換維持で `nunchaku` のままです。戻り値はありません。

互換維持:

- 旧 `?phase3_debug=1` は `?boss_debug=1` と同じ扱い。
- 旧 `?boss_phase3=A|B` は `?balance=A|B` と同じ扱い。
