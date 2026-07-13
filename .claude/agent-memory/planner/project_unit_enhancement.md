---
name: unit-enhancement-spec
description: 兵種強化拡張仕様書の概要。スキルランク強化・特性ツリー・ランクアップ（メダル通貨）の3層構造で16機能・10スプリント。
metadata:
  type: project
---

2026-06-06 に `docs/spec-unit-enhancement.md` を作成。

**Why:** スキル取得後の成長が止まり、長期プレイの動機が弱くなっている問題への対処。

**How to apply:** Sprint 1 からgenerator agentに渡す際は `sprint=1 spec=docs/spec-unit-enhancement.md` を使う。

## 3層強化構造

1. スキルランク強化（FEAT-001, FEAT-005）— 習得済みスキルをLv1→Lv3に強化
2. 特性ツリー（FEAT-002, FEAT-006, FEAT-007）— 攻撃・速度・ユーティリティの3パス×3ノード
3. ランクアップ（FEAT-003, FEAT-008）— ブロンズ→プラチナの4段階、メダル通貨（FEAT-004）が必要

## キー設計判断

- メダルは転生時にリセット（ゴールドと同様）
- 欠片ショップにスキル強化引き継ぎ・特性継承の選択肢を追加（FEAT-009, FEAT-010）
- 装備スロットはSprint 10でプレースホルダーのみ（FEAT-014）
- 既存UnitStateにスキルランクマップ・ランクフィールドを追加、セーブデータマイグレーション必須

## Must 機能（Sprint 1〜7対象）

FEAT-001〜FEAT-007

## Should 機能（Sprint 8〜9対象）

FEAT-008〜FEAT-012

## Could 機能（Sprint 10対象）

FEAT-013〜FEAT-016
