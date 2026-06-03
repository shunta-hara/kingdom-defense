# テストルール

- テストフレームワーク: Vitest + @testing-library/react
- テストファイルは `src/**/__tests__/` または `src/**/*.test.ts(x)` に置く
- ゲームロジック（utils/・hooks/）は単体テスト必須
- コンポーネントは主要な表示ロジックのみテストする（スタイルの検証は不要）
- 各テストに正常系・異常系・境界値の3種を含める
- モックは外部依存（localStorage・AudioContext）のみ。ゲームロジックはモックしない
- テストコマンド: `npm run test`（= `vitest run`）
