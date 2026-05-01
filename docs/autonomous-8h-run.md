# 8時間自律運用メモ

## 目的
- 8時間タイマーを `runtime/agent-work-timer.json` で管理し、残り時間が0になるまで作業サイクルを継続する。
- 各作業の完了時に必ずタイマーを確認し、残り時間があれば次タスクを登録する。
- この運用担当は管理ファイルとスクリプトのみを扱い、ゲーム実装やUIには触れない。

## タイマーコマンド
- 開始: `node scripts/agent_work_timer.mjs start 8h`
- 状態確認: `node scripts/agent_work_timer.mjs status`
- チェックポイント記録: `node scripts/agent_work_timer.mjs checkpoint "message"`
- 次タスク登録: `node scripts/agent_work_timer.mjs next "task"`

## チェックポイント方針
- 作業開始時、作業完了時、検証完了時、権限判断時に `checkpoint` を残す。
- `status` の `expired` が `false` なら、次に進める具体タスクを `next` に登録する。
- `expired` が `true` なら新規タスクを発生させず、最終状態を報告する。

## 権限確認方針
- 破壊的コマンドは実行しない。
- サンドボックス外への書き込み、ネットワークアクセス、GUI操作など権限が必要な処理は事前に確認する。
- 他者の変更は戻さず、対象ファイル外の差分は触らない。
