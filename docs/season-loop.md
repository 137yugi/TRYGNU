# 2週間シーズン運用

## 実装

- シーズンは `src/systems/season.ts` で計算します。
- 基準日は 2026-01-05 UTC、期間は14日固定です。
- `seasonId` は `S{3桁index}-{UTC開始日YYYYMMDD}` です。例: `S001-20260105`。
- 現在シーズンは `synapse_storm_season_v1` に保存されます。キー名は旧開発名ですが互換維持のため残します。
- ランキングは `nunchaku_overdrive_scores_v1` に保存され、各行に `seasonId` / `seasonStartAt` / `seasonEndAt` を持ちます。
- 意見/文句は `synapse_storm_feedback_v1` に保存され、各行に `seasonId` と本文を持ちます。こちらもキー名は互換維持です。

外部APIは使いません。GitHub Pages の静的配信だけで動きます。

## 自己ベスト保持

自己ベストは専用の別キーではなく、`nunchaku_overdrive_scores_v1` の同一 `seasonId` 行から算出します。

1. ラン終了時またはボス撃破チェックポイントで `saveLeaderboardEntry(score, payload)` が呼ばれます。
2. 保存時点の `getCurrentSeason()` で `seasonId` / `seasonStartAt` / `seasonEndAt` を確定し、任意payloadでは上書きできません。
3. 保存後はシーズンごとにスコア降順、同点なら記録時刻昇順で並べ、各シーズン最大20件、保持シーズン最大12件へ trim します。
4. `getSeasonPersonalBest(seasonId)` は `getLeaderboardEntries(seasonId)[0]` を返します。記録なしなら score は `0`、entry_id/rank/at は `null` です。
5. `getLeaderboardSummary(seasonId)` と `window.render_game_to_text()` の `leaderboard` には `personal_best_score` / `personal_best_entry_id` / `personal_best_at` / `personal_best` が出ます。
6. `window.exportSeasonReview(seasonId?)` の `leaderboard.personal_best` にも同じ自己ベストが入ります。

プロフィールはランキング行の `profile: { name, sns, comment }` に保存します。互換用に同じ値を `name` / `sns` / `comment` にも複写します。プロフィール未入力でもスコア行は残り、後から `updateLeaderboardEntryProfile(entryId, profile)` で更新できます。

## ゲーム内フロー

1. メニューの「シーズン」で現在ID、期間、残日数、今シーズンのローカルランキングを表示します。
2. ラン終了時、ランキング上位20件に入ったスコアだけ名前/SNS/一言コメントの入力モーダルを出します。
3. メニューの「意見/文句」フォームは、2週間の間いつでも自由入力を受け付けます。
4. `運営用JSON` ボタンは現在シーズンの意見/ランキングをJSONとしてクリップボードへコピーします。ブラウザがクリップボードを拒否した場合はconsoleへ出力します。

ブラウザコンソールからは以下でも同じJSONを取得できます。

```js
window.exportSeasonReview()
window.exportSeasonReview("S001-20260105")
```

自己ベストだけを確認する場合:

```js
JSON.parse(window.render_game_to_text()).leaderboard.personal_best
```

## 次シーズン開始時のCodex運用

1. メニューの `運営用JSON` または `window.exportSeasonReview("<前シーズンID>")` でJSONを取得します。
2. Codex に貼り付け、重複、バグ報告、操作不満、バランス不満、要望、暴言/反映不可を分類させます。
4. 反映してよい内容だけを実装候補にします。個人情報、SNS、宣伝、攻撃的表現は仕様判断に使わず、必要なら要旨だけ残します。
5. 採用した変更を実装し、`progress.md` とこの文書にシーズン改善メモを追記します。

## 抽出例

```js
const rows = JSON.parse(localStorage.getItem("synapse_storm_feedback_v1") || "[]");
const target = rows.filter((row) => row.seasonId === "S001-20260105");
console.table(target.map(({ at, text }) => ({ at: new Date(at).toISOString(), text })));
```

ランキング宣伝欄はプレイヤー表示用です。改善判断で読む対象は原則として意見/文句フォームの本文だけにします。
