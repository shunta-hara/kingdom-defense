import { describe, it, expect } from 'vitest';
import {
  calcRebirthFragments,
  createInitialUnits,
  checkUnitUnlockCondition,
  calcRebirthValue,
} from '../rebirth';
import { UNIT_IDS } from '../../constants/units';
import type { UnitsState } from '../../types/game';

// ---- Test Helpers ----

function makeUnits(overrides: Partial<Record<string, { level: number }>> = {}): UnitsState {
  const base = createInitialUnits();
  for (const [id, data] of Object.entries(overrides)) {
    if (id in base) {
      base[id as keyof UnitsState] = { ...base[id as keyof UnitsState], ...data };
    }
  }
  return base;
}

// ============================================================
// calcRebirthFragments
// ============================================================

describe('calcRebirthFragments', () => {
  it('正常系: Wave1の場合1個（floor(1/2) + 1 = 1）', () => {
    expect(calcRebirthFragments(1)).toBe(1);
  });

  it('正常系: Wave3の場合2個（floor(3/2) + 1 = 2）', () => {
    expect(calcRebirthFragments(3)).toBe(2);
  });

  it('正常系: Wave6の場合4個（floor(6/2) + 1 = 4）', () => {
    expect(calcRebirthFragments(6)).toBe(4);
  });

  it('正常系: Wave10の場合6個（floor(10/2) + 1 = 6）', () => {
    expect(calcRebirthFragments(10)).toBe(6);
  });

  it('異常系: Wave0でも最低1個を返す', () => {
    expect(calcRebirthFragments(0)).toBe(1);
  });

  it('境界値: Wave30の場合16個', () => {
    expect(calcRebirthFragments(30)).toBe(16); // floor(30/2) + 1 = 15 + 1
  });
});

// ============================================================
// createInitialUnits
// ============================================================

describe('createInitialUnits', () => {
  it('正常系: すべての兵種IDを含む', () => {
    const units = createInitialUnits();
    for (const id of UNIT_IDS) {
      expect(units[id]).toBeDefined();
    }
  });

  it('正常系: すべての兵種が初期状態（level=0, count=0, skillRanks={}）', () => {
    const units = createInitialUnits();
    for (const id of UNIT_IDS) {
      expect(units[id].level).toBe(0);
      expect(units[id].count).toBe(0);
      expect(units[id].unlockedSkills).toEqual([]);
      expect(units[id].skillRanks).toEqual({});
    }
  });

  it('異常系: 返り値はミュータブルな新しいオブジェクト', () => {
    const units1 = createInitialUnits();
    const units2 = createInitialUnits();
    units1.spearman.level = 5;
    expect(units2.spearman.level).toBe(0); // 独立したオブジェクト
  });
});

// ============================================================
// checkUnitUnlockCondition
// ============================================================

describe('checkUnitUnlockCondition', () => {
  it('正常系: unlockCondがundefinedの場合は常にtrue（基本兵種）', () => {
    const units = createInitialUnits();
    expect(checkUnitUnlockCondition('spearman', units, undefined)).toBe(true);
    expect(checkUnitUnlockCondition('archer', units, undefined)).toBe(true);
  });

  it('正常系: 条件を満たした場合はtrue', () => {
    const units = makeUnits({ spearman: { level: 5 }, mage: { level: 5 } });
    expect(checkUnitUnlockCondition('swordmaster', units, { spearman: 5, mage: 5 })).toBe(true);
  });

  it('正常系: 条件を満たさない場合はfalse', () => {
    const units = makeUnits({ spearman: { level: 4 }, mage: { level: 5 } });
    expect(checkUnitUnlockCondition('swordmaster', units, { spearman: 5, mage: 5 })).toBe(false);
  });

  it('異常系: 条件のひとつでも不足すればfalse', () => {
    const units = makeUnits({ archer: { level: 5 }, paladin: { level: 3 } });
    expect(checkUnitUnlockCondition('dragoon', units, { archer: 5, paladin: 5 })).toBe(false);
  });

  it('境界値: 条件レベルをちょうど満たす場合はtrue', () => {
    const units = makeUnits({ spearman: { level: 5 }, mage: { level: 5 } });
    expect(checkUnitUnlockCondition('swordmaster', units, { spearman: 5, mage: 5 })).toBe(true);
  });

  it('境界値: 条件レベルを1だけ下回る場合はfalse', () => {
    const units = makeUnits({ spearman: { level: 4 }, mage: { level: 5 } });
    expect(checkUnitUnlockCondition('swordmaster', units, { spearman: 5, mage: 5 })).toBe(false);
  });
});

// ============================================================
// calcRebirthValue
// ============================================================

describe('calcRebirthValue', () => {
  it('正常系: Wave1では転生価値が低い（1欠片）', () => {
    const result = calcRebirthValue(1);
    expect(result.fragments).toBe(1);
    expect(result.isWorthIt).toBe(false);
  });

  it('正常系: Wave3以上では転生に価値がある（2欠片以上）', () => {
    const result = calcRebirthValue(3);
    expect(result.fragments).toBe(2);
    expect(result.isWorthIt).toBe(true);
  });

  it('正常系: Wave10では十分な欠片が得られる', () => {
    const result = calcRebirthValue(10);
    expect(result.fragments).toBe(6);
    expect(result.isWorthIt).toBe(true);
  });

  it('境界値: isWorthItはfragments >= 2で判定される', () => {
    expect(calcRebirthValue(1).isWorthIt).toBe(false); // floor(1/2) + 1 = 1
    expect(calcRebirthValue(2).isWorthIt).toBe(true);  // floor(2/2) + 1 = 2
  });
});
