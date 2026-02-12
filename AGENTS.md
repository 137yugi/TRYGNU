# Project Agent Guide

このリポジトリでは、開始後は追加の `go` なしで長時間継続する `Exec Plan` 運用を標準にする。

## Core Rule

- まず `/.agent/PLANS.md` を開き、次に `/progress.md` を読む。
- 最優先の未完了タスクを 1-3 個進める。
- 実装後は必ず検証を回す。
- 結果を `/.agent/PLANS.md` と `/progress.md` に反映する。
- `Status: DONE` になるまで、停止条件に当たらない限り自律継続する（`go` 再入力は不要）。

## Mandatory Loop (Every Cycle)

1. `/.agent/PLANS.md` の `Backlog` 先頭から着手対象を決める。
2. 最小差分で実装する。
3. 次を最低 1 回実行する。
   - `node web_game_playwright_client.mjs --url http://127.0.0.1:8081 --actions-file test_actions_skill_loop.json --click-selector '#startBtn' --iterations 3 --pause-ms 260 --screenshot-dir output/web-game-uicheck`
4. 最新スクリーンショットを目視で確認する。
5. `errors-*.json` があれば最初の新規エラーを最優先で修正する。
6. `/.agent/PLANS.md` の該当タスクを更新し、`/progress.md` に実施内容を追記する。

起動時の初回トリガーは任意の短い指示でよい。2サイクル目以降は同一セッション内で自動継続すること。

## Stop Conditions

- `/.agent/PLANS.md` の `Status` が `DONE`。
- 重要な外部判断が必要で、自己解決不能。
- テスト環境が壊れており復旧不能。

ブロック時は `/.agent/PLANS.md` の `Blockers` に事実ベースで追記して停止する。

## Quality Bar

- 変更ごとにゲームが起動し、操作不能にならないこと。
- 追加要素は UI から触れること。
- 画面外/視認性/モバイル横向き崩れを再発させないこと。
