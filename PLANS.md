# Codex Execution Plans (ExecPlans) Repository Policy

このリポジトリでは、実行計画ドキュメント（ExecPlan）を実装の唯一の進行基準として扱う。ExecPlan は、現在のワーキングツリーと当該 ExecPlan ファイルだけで、初学者でも再開・完遂できる自己完結ドキュメントでなければならない。

## Non-Negotiable Requirements

ExecPlan は常に自己完結であること。進捗、発見、設計判断、結果の記録を含む「生きた文書」であること。説明は動作確認可能なユーザー価値から始めること。曖昧さは計画内で解決し、読者に重要判断を丸投げしないこと。定義されていない専門用語を使わないこと。内部実装だけでなく、実際に動作を確認する検証手順を必ず含めること。

## Required Sections

すべての ExecPlan は以下のセクションを必須とする。

- Purpose / Big Picture
- Progress（チェックボックス + タイムスタンプ）
- Surprises & Discoveries
- Decision Log
- Outcomes & Retrospective
- Context and Orientation
- Plan of Work
- Concrete Steps
- Validation and Acceptance
- Idempotence and Recovery
- Artifacts and Notes
- Interfaces and Dependencies

## Milestones

マイルストーンは独立検証可能であること。各マイルストーンは「何が新しく有効化されるか」「何を実行して何を観測すべきか」を明確に記述すること。プロトタイプや並行実装を使う場合は、採用/破棄判断基準を明記すること。

## Updating Rules

計画変更時は、進捗・判断・成果をすべての関連セクションに反映する。文書末尾に「何を、なぜ変えたか」を更新ノートとして残す。停止時点では、次の実装者が即再開できる状態を保証する。
