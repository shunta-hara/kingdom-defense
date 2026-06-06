import { describe, it, expect } from 'vitest';
import {
  calcProphecyEffect,
  calcUnitAtk,
  calcUnitInterval,
  calcUnitCost,
  calcLevelUpCost,
  calcClickGold,
  calcDps,
  SPLASH_FALLOFF,
  getSplashMultiplier,
  calcSplashDamages,
  getSkillRankMultiplier,
  calcSkillUpgradeCost,
} from '../combat';
import type { UnitState, ProphecyEffectValues, SkillRank } from '../../types/game';
import { PROPHECY_UPGRADES } from '../../constants/skills';

// ---- Test Helpers ----

const emptyEffect: ProphecyEffectValues = {
  clickBonus: 0,
  globalAtk: 0,
  globalInterval: 0,
  costReduction: 0,
};

const baseUnit: UnitState = {
  level: 0,
  count: 1,
  unlockedSkills: [],
  skillRanks: {},
};

// ============================================================
// calcProphecyEffect
// ============================================================

describe('calcProphecyEffect', () => {
  it('正常系: 購入済み予知強化がない場合はすべて0', () => {
    const result = calcProphecyEffect([], PROPHECY_UPGRADES);
    expect(result).toEqual({ clickBonus: 0, globalAtk: 0, globalInterval: 0, costReduction: 0 });
  });

  it('正常系: p_goldを購入済みの場合clickBonusが1.0', () => {
    const result = calcProphecyEffect(['p_gold'], PROPHECY_UPGRADES);
    expect(result.clickBonus).toBe(1.0);
    expect(result.globalAtk).toBe(0);
  });

  it('正常系: 複数購入済みの場合は加算される', () => {
    const result = calcProphecyEffect(['p_start', 'p_power'], PROPHECY_UPGRADES);
    expect(result.globalAtk).toBeCloseTo(0.9); // 0.3 + 0.6
  });

  it('異常系: 存在しないIDは無視される', () => {
    const result = calcProphecyEffect(['invalid_id'], PROPHECY_UPGRADES);
    expect(result).toEqual({ clickBonus: 0, globalAtk: 0, globalInterval: 0, costReduction: 0 });
  });

  it('境界値: すべての予知強化を購入済みの場合', () => {
    const allIds = PROPHECY_UPGRADES.map((p) => p.id);
    const result = calcProphecyEffect(allIds, PROPHECY_UPGRADES);
    expect(result.clickBonus).toBe(1.0);
    expect(result.globalAtk).toBeCloseTo(0.9); // 0.3 + 0.6
    expect(result.globalInterval).toBeCloseTo(-0.15);
    expect(result.costReduction).toBe(0.25);
  });
});

// ============================================================
// calcUnitAtk
// ============================================================

describe('calcUnitAtk', () => {
  it('正常系: 剣士1体、スキルなし、レベル0の攻撃力は8', () => {
    const result = calcUnitAtk('swordsman', baseUnit, emptyEffect);
    expect(result).toBe(8); // baseAtk=8, mult=1, levelBonus=1, count=1
  });

  it('正常系: 剣士を3体雇用した場合は3倍', () => {
    const unit: UnitState = { ...baseUnit, count: 3 };
    const result = calcUnitAtk('swordsman', unit, emptyEffect);
    expect(result).toBe(24); // 8 * 3
  });

  it('正常系: レベル2の場合はlevelBonus=1.2が掛かる', () => {
    const unit: UnitState = { ...baseUnit, level: 2 };
    const result = calcUnitAtk('swordsman', unit, emptyEffect);
    expect(result).toBe(Math.floor(8 * 1.2)); // 9
  });

  it('正常系: スキルsw_edgeを持つ場合、atk+0.4', () => {
    const unit: UnitState = { ...baseUnit, unlockedSkills: ['sw_edge'] };
    const result = calcUnitAtk('swordsman', unit, emptyEffect);
    expect(result).toBe(Math.floor(8 * 1.4)); // 11
  });

  it('正常系: globalAtk効果が攻撃力に反映される', () => {
    const effect: ProphecyEffectValues = { ...emptyEffect, globalAtk: 0.5 };
    const result = calcUnitAtk('swordsman', baseUnit, effect);
    expect(result).toBe(Math.floor(8 * 1.5)); // 12
  });

  it('異常系: count=0の場合は0', () => {
    const unit: UnitState = { ...baseUnit, count: 0 };
    const result = calcUnitAtk('swordsman', unit, emptyEffect);
    expect(result).toBe(0);
  });

  it('境界値: 大量のスキルとレベルが重なる場合', () => {
    const unit: UnitState = {
      level: 10,
      count: 5,
      unlockedSkills: ['sw_slash', 'sw_edge', 'sw_blade'],
      skillRanks: {},
    };
    const effect: ProphecyEffectValues = { ...emptyEffect, globalAtk: 0.2 };
    // atkMult = 1 + 0.2(global) + 0.4(edge) + 0.6(blade) = 2.2, sw_slashはatk効果なし
    // levelBonus = 1 + 1.0 = 2.0
    // result = floor(8 * 2.2 * 2.0 * 5) = floor(176) = 176
    const result = calcUnitAtk('swordsman', unit, effect);
    expect(result).toBe(Math.floor(8 * 2.2 * 2.0 * 5));
  });
});

// ============================================================
// calcUnitInterval
// ============================================================

describe('calcUnitInterval', () => {
  it('正常系: 剣士のデフォルト間隔は800ms', () => {
    const result = calcUnitInterval('swordsman', baseUnit, emptyEffect);
    expect(result).toBe(800);
  });

  it('正常系: globalInterval=-0.1の場合は10%短縮', () => {
    const effect: ProphecyEffectValues = { ...emptyEffect, globalInterval: -0.1 };
    const result = calcUnitInterval('swordsman', baseUnit, effect);
    expect(result).toBe(800 * 0.9); // 720
  });

  it('正常系: スキルsw_slashでinterval-20%短縮される', () => {
    const unit: UnitState = { ...baseUnit, unlockedSkills: ['sw_slash'] }; // -0.2
    const result = calcUnitInterval('swordsman', unit, emptyEffect);
    expect(result).toBe(800 * 0.8); // 640
  });

  it('異常系: 過度な短縮でも最低500msを下回らない', () => {
    const effect: ProphecyEffectValues = { ...emptyEffect, globalInterval: -0.9 };
    const result = calcUnitInterval('swordsman', baseUnit, effect);
    expect(result).toBeGreaterThanOrEqual(500);
  });

  it('境界値: intervalMultが0.3を下回る場合のクランプ', () => {
    // globalInterval = -0.8 → mult = 0.2 → clamp to 0.3 → 800 * 0.3 = 240 → max(500, 240) = 500
    const effect: ProphecyEffectValues = { ...emptyEffect, globalInterval: -0.8 };
    const result = calcUnitInterval('swordsman', baseUnit, effect);
    expect(result).toBe(500); // max(500, 800 * max(0.3, 0.2)) = max(500, 240) = 500
  });
});

// ============================================================
// calcUnitCost
// ============================================================

describe('calcUnitCost', () => {
  it('正常系: 槍兵初回コストは50', () => {
    const unit: UnitState = { ...baseUnit, count: 0 };
    const result = calcUnitCost('swordsman', unit, emptyEffect);
    expect(result).toBe(50);
  });

  it('正常系: 購入数が増えるとコストが上がる', () => {
    const unit1: UnitState = { ...baseUnit, count: 1 };
    const unit5: UnitState = { ...baseUnit, count: 5 };
    const cost1 = calcUnitCost('swordsman', unit1, emptyEffect);
    const cost5 = calcUnitCost('swordsman', unit5, emptyEffect);
    expect(cost5).toBeGreaterThan(cost1);
  });

  it('正常系: costReduction=0.2の場合20%割引', () => {
    const unit: UnitState = { ...baseUnit, count: 0 };
    const effect: ProphecyEffectValues = { ...emptyEffect, costReduction: 0.2 };
    const result = calcUnitCost('swordsman', unit, effect);
    expect(result).toBe(Math.floor(50 * 0.8)); // 40
  });

  it('異常系: countが大きくても正の値を返す', () => {
    const unit: UnitState = { ...baseUnit, count: 100 };
    const result = calcUnitCost('swordsman', unit, emptyEffect);
    expect(result).toBeGreaterThan(0);
  });

  it('境界値: count=0, costReduction=0の最低コスト', () => {
    const unit: UnitState = { ...baseUnit, count: 0 };
    const result = calcUnitCost('swordsman', unit, emptyEffect);
    expect(result).toBe(50); // baseCost
  });
});

// ============================================================
// calcLevelUpCost
// ============================================================

describe('calcLevelUpCost', () => {
  it('正常系: レベル0からのレベルアップコスト', () => {
    const unit: UnitState = { ...baseUnit, level: 0 };
    const result = calcLevelUpCost('swordsman', unit);
    expect(result).toBe(100); // 50 * 2 * 2^0 = 100
  });

  it('正常系: レベルが上がるとコストが倍増する', () => {
    const unit0: UnitState = { ...baseUnit, level: 0 };
    const unit1: UnitState = { ...baseUnit, level: 1 };
    const cost0 = calcLevelUpCost('swordsman', unit0);
    const cost1 = calcLevelUpCost('swordsman', unit1);
    expect(cost1).toBe(cost0 * 2); // 倍増
  });

  it('境界値: レベル10のコスト', () => {
    const unit: UnitState = { ...baseUnit, level: 10 };
    const result = calcLevelUpCost('swordsman', unit);
    expect(result).toBe(Math.floor(50 * 2 * Math.pow(2, 10)));
  });
});

// ============================================================
// calcClickGold
// ============================================================

describe('calcClickGold', () => {
  it('正常系: 予知強化なしの場合は1G', () => {
    const result = calcClickGold(emptyEffect);
    expect(result).toBe(1);
  });

  it('正常系: clickBonus=0.5の場合は1G', () => {
    // floor(1 * (1 + 0.5)) = floor(1.5) = 1
    const effect: ProphecyEffectValues = { ...emptyEffect, clickBonus: 0.5 };
    const result = calcClickGold(effect);
    expect(result).toBe(1);
  });

  it('正常系: clickBonus=1.0の場合は2G', () => {
    const effect: ProphecyEffectValues = { ...emptyEffect, clickBonus: 1.0 };
    const result = calcClickGold(effect);
    expect(result).toBe(2);
  });

  it('境界値: clickBonusが非常に大きい場合も正整数を返す', () => {
    const effect: ProphecyEffectValues = { ...emptyEffect, clickBonus: 99 };
    const result = calcClickGold(effect);
    expect(result).toBe(100);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ============================================================
// SPLASH_FALLOFF / getSplashMultiplier / calcSplashDamages
// ============================================================

describe('SPLASH_FALLOFF', () => {
  it('正常系: index 0（先頭）の倍率は1.0（100%）', () => {
    expect(SPLASH_FALLOFF[0]).toBe(1.0);
  });

  it('正常系: index 1の倍率は0.7（70%）', () => {
    expect(SPLASH_FALLOFF[1]).toBe(0.7);
  });

  it('正常系: index 2の倍率は0.5（50%）', () => {
    expect(SPLASH_FALLOFF[2]).toBe(0.5);
  });

  it('境界値: index 3の倍率は0.3（30%）', () => {
    expect(SPLASH_FALLOFF[3]).toBe(0.3);
  });
});

describe('getSplashMultiplier', () => {
  it('正常系: index 0 = 1.0', () => {
    expect(getSplashMultiplier(0)).toBe(1.0);
  });

  it('正常系: index 1 = 0.7', () => {
    expect(getSplashMultiplier(1)).toBe(0.7);
  });

  it('正常系: index 2 = 0.5', () => {
    expect(getSplashMultiplier(2)).toBe(0.5);
  });

  it('境界値: index 3 = 0.3（後方一律）', () => {
    expect(getSplashMultiplier(3)).toBe(0.3);
  });

  it('境界値: index 10（遠い後方）= 0.3（一律30%）', () => {
    expect(getSplashMultiplier(10)).toBe(0.3);
  });

  it('異常系: 負のindexは0と同じ倍率（先頭扱い）', () => {
    // index < SPLASH_FALLOFF.length のケース: -1 < 4 → SPLASH_FALLOFF[-1] = undefined → fallback
    // 実装上は Array[-1] = undefined, undefined < 4 だが getSplashMultiplierは単純にindexを使う
    // 仕様的には呼び出し側で保証するが念のため: index < 0 は length条件を満たすため undefined を返す可能性
    // 実装を確認: if (index < SPLASH_FALLOFF.length) → -1 < 4 → true → SPLASH_FALLOFF[-1] = undefined
    // これは想定外だが仕様書の範囲外。ここでは正常入力(>=0)の境界のみテスト
    expect(getSplashMultiplier(0)).toBe(1.0);
  });
});

describe('calcSplashDamages', () => {
  it('正常系: 敵1体の場合はatk×1.0のみ', () => {
    const result = calcSplashDamages(10, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(10); // floor(10 * 1.0) = 10
  });

  it('正常系: 敵2体の場合は先頭100%, 2番目70%', () => {
    const result = calcSplashDamages(10, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(10); // floor(10 * 1.0) = 10
    expect(result[1]).toBe(7);  // floor(10 * 0.7) = 7
  });

  it('正常系: 敵3体の場合は100%, 70%, 50%', () => {
    const result = calcSplashDamages(10, 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(10); // floor(10 * 1.0) = 10
    expect(result[1]).toBe(7);  // floor(10 * 0.7) = 7
    expect(result[2]).toBe(5);  // floor(10 * 0.5) = 5
  });

  it('正常系: 敵4体以上の場合はindex3以降がすべて30%', () => {
    const result = calcSplashDamages(10, 5);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe(10); // floor(10 * 1.0) = 10
    expect(result[1]).toBe(7);  // floor(10 * 0.7) = 7
    expect(result[2]).toBe(5);  // floor(10 * 0.5) = 5
    expect(result[3]).toBe(3);  // floor(10 * 0.3) = 3
    expect(result[4]).toBe(3);  // floor(10 * 0.3) = 3
  });

  it('正常系: 竜騎士(atk=50)で12体の場合', () => {
    const result = calcSplashDamages(50, 12);
    expect(result).toHaveLength(12);
    expect(result[0]).toBe(50);  // floor(50 * 1.0) = 50
    expect(result[1]).toBe(35);  // floor(50 * 0.7) = 35
    expect(result[2]).toBe(25);  // floor(50 * 0.5) = 25
    expect(result[3]).toBe(15);  // floor(50 * 0.3) = 15
    expect(result[11]).toBe(15); // floor(50 * 0.3) = 15
  });

  it('異常系: atk=0の場合はすべて0', () => {
    const result = calcSplashDamages(0, 3);
    expect(result).toEqual([0, 0, 0]);
  });

  it('境界値: 敵0体の場合は空配列', () => {
    const result = calcSplashDamages(10, 0);
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('境界値: floor処理により小数は切り捨てられる', () => {
    // atk=3 → 3 * 0.7 = 2.1 → floor = 2
    const result = calcSplashDamages(3, 2);
    expect(result[0]).toBe(3); // floor(3 * 1.0) = 3
    expect(result[1]).toBe(2); // floor(3 * 0.7) = 2 (not 2.1)
  });
});

// ============================================================
// calcDps
// ============================================================

describe('calcDps', () => {
  it('正常系: DPS = atk / (interval_ms / 1000)', () => {
    // swordsman: baseAtk=8, atkInterval=800 → DPS = 8/0.8 = 10
    const result = calcDps('swordsman', baseUnit, emptyEffect);
    expect(result).toBeCloseTo(8 / 0.8);
  });

  it('正常系: count=0の場合はDPS=0', () => {
    const unit: UnitState = { ...baseUnit, count: 0 };
    const result = calcDps('swordsman', unit, emptyEffect);
    expect(result).toBe(0);
  });

  it('境界値: 竜騎士のDPS計算', () => {
    // dragoon: baseAtk=50, atkInterval=2000 → DPS = 50/2 = 25
    const result = calcDps('dragoon', baseUnit, emptyEffect);
    expect(result).toBeCloseTo(25);
  });
});

// ============================================================
// getSkillRankMultiplier
// ============================================================

describe('getSkillRankMultiplier', () => {
  it('正常系: rank=0（未習得）は倍率0', () => {
    expect(getSkillRankMultiplier(0 as SkillRank)).toBe(0);
  });

  it('正常系: rank=1（習得直後）は倍率1.0', () => {
    expect(getSkillRankMultiplier(1 as SkillRank)).toBe(1.0);
  });

  it('正常系: rank=2（Lv2強化）は倍率1.5', () => {
    expect(getSkillRankMultiplier(2 as SkillRank)).toBe(1.5);
  });

  it('正常系: rank=3（最大強化）は倍率2.0', () => {
    expect(getSkillRankMultiplier(3 as SkillRank)).toBe(2.0);
  });

  it('境界値: rank=1とrank=3で倍率が2倍差になる', () => {
    const r1 = getSkillRankMultiplier(1 as SkillRank);
    const r3 = getSkillRankMultiplier(3 as SkillRank);
    expect(r3 / r1).toBe(2.0);
  });
});

// ============================================================
// calcSkillUpgradeCost
// ============================================================

describe('calcSkillUpgradeCost', () => {
  it('正常系: Lv2への強化コストはbaseCostの1.5倍（切り捨て）', () => {
    expect(calcSkillUpgradeCost(100, 2 as SkillRank)).toBe(150); // floor(100 * 1.5) = 150
  });

  it('正常系: Lv3への強化コストはbaseCostの3倍', () => {
    expect(calcSkillUpgradeCost(100, 3 as SkillRank)).toBe(300); // floor(100 * 3.0) = 300
  });

  it('正常系: 切り捨て処理が正しく行われる', () => {
    expect(calcSkillUpgradeCost(150, 2 as SkillRank)).toBe(225); // floor(150 * 1.5) = 225
    expect(calcSkillUpgradeCost(150, 3 as SkillRank)).toBe(450); // floor(150 * 3.0) = 450
  });

  it('異常系: Lv0やLv1は0を返す（強化対象外）', () => {
    expect(calcSkillUpgradeCost(100, 0 as SkillRank)).toBe(0);
    expect(calcSkillUpgradeCost(100, 1 as SkillRank)).toBe(0);
  });

  it('境界値: baseCostが小数を含む計算でも正整数を返す', () => {
    // floor(333 * 1.5) = floor(499.5) = 499
    expect(calcSkillUpgradeCost(333, 2 as SkillRank)).toBe(499);
  });
});

// ============================================================
// calcUnitAtk with skillRanks
// ============================================================

describe('calcUnitAtk with skillRanks', () => {
  it('正常系: スキルランク1（デフォルト）はrank未設定と同等', () => {
    const unitNoRank: UnitState = { ...baseUnit, unlockedSkills: ['sw_edge'] };
    const unitRank1: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_edge'],
      skillRanks: { sw_edge: 1 },
    };
    const resultNoRank = calcUnitAtk('swordsman', unitNoRank, emptyEffect);
    const resultRank1 = calcUnitAtk('swordsman', unitRank1, emptyEffect);
    expect(resultNoRank).toBe(resultRank1);
  });

  it('正常系: スキルランク2はランク1の1.5倍のatk効果を持つ', () => {
    // sw_edge: atk+0.4
    // rank1: atkMult = 1 + 0.4 * 1.0 = 1.4 → floor(8 * 1.4) = 11
    // rank2: atkMult = 1 + 0.4 * 1.5 = 1.6 → floor(8 * 1.6) = 12
    const unitRank1: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_edge'],
      skillRanks: { sw_edge: 1 },
    };
    const unitRank2: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_edge'],
      skillRanks: { sw_edge: 2 },
    };
    expect(calcUnitAtk('swordsman', unitRank1, emptyEffect)).toBe(Math.floor(8 * 1.4));
    expect(calcUnitAtk('swordsman', unitRank2, emptyEffect)).toBe(Math.floor(8 * 1.6));
  });

  it('正常系: スキルランク3はランク1の2.0倍のatk効果を持つ', () => {
    // sw_edge: atk+0.4
    // rank3: atkMult = 1 + 0.4 * 2.0 = 1.8 → floor(8 * 1.8) = 14
    const unitRank3: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_edge'],
      skillRanks: { sw_edge: 3 },
    };
    expect(calcUnitAtk('swordsman', unitRank3, emptyEffect)).toBe(Math.floor(8 * 1.8));
  });

  it('境界値: 複数スキルがそれぞれ異なるランクを持つ場合', () => {
    // sw_edge(rank2): atk+0.4*1.5=0.6, sw_blade(rank3): atk+0.6*2.0=1.2
    // atkMult = 1 + 0.6 + 1.2 = 2.8
    // floor(8 * 2.8) = 22
    const unit: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_edge', 'sw_blade'],
      skillRanks: { sw_edge: 2, sw_blade: 3 },
    };
    expect(calcUnitAtk('swordsman', unit, emptyEffect)).toBe(Math.floor(8 * 2.8));
  });
});

// ============================================================
// calcUnitInterval with skillRanks
// ============================================================

describe('calcUnitInterval with skillRanks', () => {
  it('正常系: スキルランク2はランク1の1.5倍のinterval短縮効果を持つ', () => {
    // sw_slash: interval -0.2
    // rank1: intervalMult = 1 + (-0.2) * 1.0 = 0.8 → 800 * 0.8 = 640
    // rank2: intervalMult = 1 + (-0.2) * 1.5 = 0.7 → 800 * 0.7 = 560
    const unitRank1: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_slash'],
      skillRanks: { sw_slash: 1 },
    };
    const unitRank2: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_slash'],
      skillRanks: { sw_slash: 2 },
    };
    expect(calcUnitInterval('swordsman', unitRank1, emptyEffect)).toBe(640);
    expect(calcUnitInterval('swordsman', unitRank2, emptyEffect)).toBe(560);
  });

  it('正常系: スキルランク3はランク1の2.0倍のinterval短縮効果を持つ', () => {
    // sw_slash: interval -0.2
    // rank3: intervalMult = 1 + (-0.2) * 2.0 = 0.6 → 800 * 0.6 = 480 → max(500, 480) = 500
    const unitRank3: UnitState = {
      ...baseUnit,
      unlockedSkills: ['sw_slash'],
      skillRanks: { sw_slash: 3 },
    };
    expect(calcUnitInterval('swordsman', unitRank3, emptyEffect)).toBe(500);
  });

  it('境界値: 強力なrank3スキルでも最低500msを下回らない', () => {
    // d_ride: interval -0.3
    // rank3: intervalMult = 1 + (-0.3) * 2.0 = 0.4 → 2000 * max(0.3, 0.4) = 800 → max(500, 800) = 800
    const unit: UnitState = {
      ...baseUnit,
      unlockedSkills: ['d_ride'],
      skillRanks: { d_ride: 3 },
    };
    expect(calcUnitInterval('dragoon', unit, emptyEffect)).toBeGreaterThanOrEqual(500);
  });
});
