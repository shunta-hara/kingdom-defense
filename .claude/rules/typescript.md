# TypeScript ルール

- `any` 型を使わない。型が不明な場合は `unknown` を使って型ガードで絞り込む
- 型定義は `src/types/` に集約する。コンポーネントファイルに型定義を埋め込まない
- `interface` よりも `type` を優先する（ゲームの状態型など、拡張が不要なものが多いため）
- 外部データ（localStorage・API）は必ず型アサーションせず、型ガード関数で検証する
- `as` キャストは DOM 操作など型が確実な場面のみ許可する
- `strict: true` を維持する（tsconfig.app.json の設定を緩めない）
