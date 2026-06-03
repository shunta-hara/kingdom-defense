# /project:write-test

指定したファイルのテストを作成する。

## 手順

1. 対象ファイルを読んで、テスト対象の関数・フックを把握する
2. 正常系・異常系・境界値を含むテストケースを列挙する
3. `src/__tests__/` または対象ファイルと同階層の `*.test.ts(x)` にテストを書く
4. `npm run test` を実行してすべてパスすることを確認する

## 使い方

```
/project:write-test src/utils/combat.ts
```
