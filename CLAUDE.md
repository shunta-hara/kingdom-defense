# 王都防衛戦記〜予知夢の戦記〜 — Claude 指示書

## プロジェクト概要

ブラウザで動くクリッカー×育成ゲーム。ファンタジー世界観で兵士を育てて押し寄せる敵のWaveを自動撃退する。  
技術スタック: React + Vite + TypeScript + npm + Vitest

## ルール

@.claude/rules/typescript.md
@.claude/rules/architecture.md
@.claude/rules/testing.md

## エージェント（.claude/agents/）

開発サイクル: **Planner → Generator → Evaluator** の順で使う。

| エージェント名 | 内容 |
|---|---|
| `planner` | アイデア（1〜4行）を詳細な製品仕様書（最大16機能・10スプリント）に展開する |
| `generator` | 仕様書の1スプリントを実装し、自己評価8項目をパスしてからエバリュエーターへ引き渡す |
| `evaluator` | 実装を実際に動かして評価し、合否と具体的な修正指示を出力する |

### いつエージェントサイクルを使うか

**サイクルを起動する（新機能・新スプリント）**:
- 複数ファイルにまたがる新機能の実装
- 仕様書（`docs/spec-*.md`）に基づくスプリント実行

**直接対応する（サイクルを使わない）**:
- 既存コードの1ファイル以内のバグ修正・小改修
- 設定変更・ドキュメント更新・質問への回答

### サイクルの進め方（オーケストレーター手順）

```
仕様書がない場合:
  → planner を呼ぶ
  → docs/spec-<feature>.md が生成されるまで待つ

実装ループ（全スプリント完了まで繰り返す）:
  1. generator を呼ぶ（sprint=N spec=docs/spec-<feature>.md）
  2. generator から「✅ 実装完了」が返ったら evaluator を呼ぶ（同じ引数）
  3a. evaluator「✅ 合格」→ N を +1 して 1. へ戻る
  3b. evaluator「❌ 不合格」→ 失敗レポートを添えて generator を再呼び出し（sprint=N）
  3c. 同一スプリントで3回連続不合格 → ループを停止しユーザーに報告
```

### エージェント間の情報の渡し方

- generator・evaluator には必ず `sprint=N spec=docs/spec-<feature>.md` を明示する
- evaluator が「❌ 不合格」を返したとき、失敗レポートを**要約せず全文**を generator に渡す
- スプリント番号の管理はオーケストレーター（メイン Claude）が行う

### オーケストレーターの禁止事項

- エージェントサイクル中にメイン Claude が自らコードを実装する
- evaluator を省略して次のスプリントへ進む
- 1回の generator 呼び出しで複数スプリントを実装させる
- 不合格レポートを要約・編集してから generator に渡す

## スキル（スラッシュコマンド）

| コマンド | 内容 |
|---|---|
| `/project:write-test` | テスト作成 |
| `/project:code-review` | コードレビュー |

## 重要な設計メモ

- プロトタイプは `prototype/kingdom-defense.jsx` に保存済み（参考実装として使う）
- セーブデータは `localStorage` に保存する
- ゲームループは `requestAnimationFrame` ベースで実装する
- 型定義は `src/types/` に集約する
