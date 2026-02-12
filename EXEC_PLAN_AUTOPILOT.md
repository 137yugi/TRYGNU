# Exec Plan Autopilot

`Codex Exec Plans` の運用をこのプロジェクトで固定化するための実行手順。

## 1. Start local server

```bash
python3 -m http.server 8081
```

## 2. Run long loop

```bash
./scripts/run_exec_plan_loop.sh 24
```

- 既定では毎回 `codex exec --full-auto ... "<自律継続プロンプト>"` を実行する。
- 初回起動後は `go` を再入力しなくても、`Status: DONE` または blocker まで継続する前提。
- 反復ログは `output/exec-plan-loop/` に保存される。
- `/.agent/PLANS.md` が `Status: DONE` になったら自動停止する。

## 3. Optional overrides

```bash
PROMPT_TEXT="continue autonomous execplan loop until done" SLEEP_SEC=2 ./scripts/run_exec_plan_loop.sh 40
```

## Project rules used by loop

- エージェント規約: `/AGENTS.md`
- 実行計画: `/.agent/PLANS.md`
- 実装ログ: `/progress.md`
