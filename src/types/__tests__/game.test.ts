import { describe, it, expect } from 'vitest';
import { isSkillRank, isSkillRanks, isSaveData } from '../game';

// ============================================================
// isSkillRank
// ============================================================

describe('isSkillRank', () => {
  it('正常系: 0, 1, 2, 3 はすべて有効なSkillRank', () => {
    expect(isSkillRank(0)).toBe(true);
    expect(isSkillRank(1)).toBe(true);
    expect(isSkillRank(2)).toBe(true);
    expect(isSkillRank(3)).toBe(true);
  });

  it('異常系: 4以上は無効', () => {
    expect(isSkillRank(4)).toBe(false);
    expect(isSkillRank(10)).toBe(false);
  });

  it('異常系: 負の数は無効', () => {
    expect(isSkillRank(-1)).toBe(false);
  });

  it('異常系: 文字列は無効', () => {
    expect(isSkillRank('1')).toBe(false);
    expect(isSkillRank('rank')).toBe(false);
  });

  it('異常系: null・undefined は無効', () => {
    expect(isSkillRank(null)).toBe(false);
    expect(isSkillRank(undefined)).toBe(false);
  });

  it('境界値: 小数は無効（0.0は0と同値なので有効）', () => {
    expect(isSkillRank(1.5)).toBe(false);
    expect(isSkillRank(0.0)).toBe(true); // 0.0 === 0 なので有効
    expect(isSkillRank(0)).toBe(true);
  });
});

// ============================================================
// isSkillRanks
// ============================================================

describe('isSkillRanks', () => {
  it('正常系: 空オブジェクトは有効', () => {
    expect(isSkillRanks({})).toBe(true);
  });

  it('正常系: 有効なSkillRank値のみを持つオブジェクトは有効', () => {
    expect(isSkillRanks({ sw_edge: 1, sw_blade: 3 })).toBe(true);
  });

  it('正常系: すべてのランク値が混在していても有効', () => {
    expect(isSkillRanks({ a: 0, b: 1, c: 2, d: 3 })).toBe(true);
  });

  it('異常系: 無効なランク値（4以上）を含む場合は無効', () => {
    expect(isSkillRanks({ sw_edge: 4 })).toBe(false);
  });

  it('異常系: 文字列値を含む場合は無効', () => {
    expect(isSkillRanks({ sw_edge: 'rank1' })).toBe(false);
  });

  it('異常系: null は無効', () => {
    expect(isSkillRanks(null)).toBe(false);
  });

  it('異常系: 配列は無効', () => {
    expect(isSkillRanks([1, 2, 3])).toBe(false);
  });

  it('境界値: 大量のスキルエントリを持つオブジェクトも有効', () => {
    const ranks: Record<string, unknown> = {};
    for (let i = 0; i < 20; i++) {
      ranks[`skill_${i}`] = (i % 4) as 0 | 1 | 2 | 3;
    }
    expect(isSkillRanks(ranks)).toBe(true);
  });
});

// ============================================================
// isSaveData (既存の型ガードの動作確認)
// ============================================================

describe('isSaveData', () => {
  const validBase = {
    version: 2,
    savedAt: '2024-01-01T00:00:00Z',
    gold: 100,
    medals: 5,
    fragments: 0,
    rebirthCount: 0,
    units: {},
    wave: 1,
    prophecyUpgrades: [],
  };

  it('正常系: 必須フィールドをすべて含む場合はtrue', () => {
    expect(isSaveData(validBase)).toBe(true);
  });

  it('正常系: medals フィールドがなくてもtrue（後方互換のため）', () => {
    const withoutMedals = { ...validBase };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (withoutMedals as Record<string, unknown>).medals;
    expect(isSaveData(withoutMedals)).toBe(true);
  });

  it('異常系: version がない場合はfalse', () => {
    const { version: _v, ...noVersion } = validBase;
    expect(isSaveData(noVersion)).toBe(false);
  });

  it('異常系: units が null の場合はfalse', () => {
    expect(isSaveData({ ...validBase, units: null })).toBe(false);
  });

  it('境界値: 空オブジェクト {} はfalse', () => {
    expect(isSaveData({})).toBe(false);
  });
});
