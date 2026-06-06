import type { UnitId, UnitState, ProphecyEffectValues, SkillRank } from '../types/game';
import { UNIT_DEFINITIONS } from '../constants/units';

/**
 * スキルランクに応じた効果倍率を返す
 * Lv1（習得直後）= 1.0倍、Lv2 = 1.5倍、Lv3 = 2.0倍
 */
export function getSkillRankMultiplier(rank: SkillRank): number {
  switch (rank) {
    case 0: return 0;
    case 1: return 1.0;
    case 2: return 1.5;
    case 3: return 2.0;
  }
}

/**
 * スキルランク強化コストを計算する
 * Lv2への強化コスト = baseCost * 1.5
 * Lv3への強化コスト = baseCost * 3.0
 */
export function calcSkillUpgradeCost(baseCost: number, targetRank: SkillRank): number {
  switch (targetRank) {
    case 2: return Math.floor(baseCost * 1.5);
    case 3: return Math.floor(baseCost * 3.0);
    default: return 0;
  }
}

/**
 * splash 攻撃の敵インデックス別ダメージ倍率
 * index 0（先頭）= 100%, index 1 = 70%, index 2 = 50%, index 3以降 = 30%
 */
export const SPLASH_FALLOFF: readonly number[] = [1.0, 0.7, 0.5, 0.3];

/**
 * splash 攻撃の index i に対するダメージ倍率を返す
 */
export function getSplashMultiplier(index: number): number {
  if (index < SPLASH_FALLOFF.length) {
    return SPLASH_FALLOFF[index];
  }
  return SPLASH_FALLOFF[SPLASH_FALLOFF.length - 1];
}

/**
 * splash 攻撃で n 体の敵に与えるダメージ配列を計算する
 * result[i] = floor(atk * getSplashMultiplier(i))
 */
export function calcSplashDamages(atk: number, enemyCount: number): number[] {
  return Array.from({ length: enemyCount }, (_, i) =>
    Math.floor(atk * getSplashMultiplier(i))
  );
}

/**
 * 予知強化の効果を計算する
 */
export function calcProphecyEffect(
  prophecyUpgrades: string[],
  prophecyDefinitions: ReadonlyArray<{
    id: string;
    effect: {
      clickBonus?: number;
      globalAtk?: number;
      globalInterval?: number;
      costReduction?: number;
    };
  }>
): ProphecyEffectValues {
  let clickBonus = 0;
  let globalAtk = 0;
  let globalInterval = 0;
  let costReduction = 0;

  for (const id of prophecyUpgrades) {
    const upgrade = prophecyDefinitions.find((p) => p.id === id);
    if (!upgrade) continue;
    if (upgrade.effect.clickBonus) clickBonus += upgrade.effect.clickBonus;
    if (upgrade.effect.globalAtk) globalAtk += upgrade.effect.globalAtk;
    if (upgrade.effect.globalInterval) globalInterval += upgrade.effect.globalInterval;
    if (upgrade.effect.costReduction) costReduction += upgrade.effect.costReduction;
  }

  return { clickBonus, globalAtk, globalInterval, costReduction };
}

/**
 * 兵種の実際の攻撃力を計算する（総ダメージ = 一体あたり * 数）
 * スキルランクに応じてスキル効果量が増加する（rank1=1.0倍, rank2=1.5倍, rank3=2.0倍）
 */
export function calcUnitAtk(
  unitId: UnitId,
  unitState: UnitState,
  prophecyEffect: ProphecyEffectValues
): number {
  const def = UNIT_DEFINITIONS[unitId];
  let atkMult = 1 + prophecyEffect.globalAtk;

  for (const sid of unitState.unlockedSkills) {
    const sk = def.skills.find((s) => s.id === sid);
    if (sk?.effect.atk) {
      const rank: SkillRank = unitState.skillRanks[sid] ?? 1;
      const rankMult = getSkillRankMultiplier(rank);
      atkMult += sk.effect.atk * rankMult;
    }
  }

  const levelBonus = 1 + unitState.level * 0.1;
  return Math.floor(def.baseAtk * atkMult * levelBonus * unitState.count);
}

/**
 * 兵種の実際の攻撃間隔（ms）を計算する
 * スキルランクに応じてinterval短縮効果量が増加する（rank1=1.0倍, rank2=1.5倍, rank3=2.0倍）
 */
export function calcUnitInterval(
  unitId: UnitId,
  unitState: UnitState,
  prophecyEffect: ProphecyEffectValues
): number {
  const def = UNIT_DEFINITIONS[unitId];
  let intervalMult = 1 + prophecyEffect.globalInterval;

  for (const sid of unitState.unlockedSkills) {
    const sk = def.skills.find((s) => s.id === sid);
    if (sk?.effect.interval) {
      const rank: SkillRank = unitState.skillRanks[sid] ?? 1;
      const rankMult = getSkillRankMultiplier(rank);
      intervalMult += sk.effect.interval * rankMult;
    }
  }

  return Math.max(500, def.atkInterval * Math.max(0.3, intervalMult));
}

/**
 * 兵種の雇用コストを計算する（購入済み数に応じてスケール）
 */
export function calcUnitCost(
  unitId: UnitId,
  unitState: UnitState,
  prophecyEffect: ProphecyEffectValues
): number {
  const def = UNIT_DEFINITIONS[unitId];
  const reduction = prophecyEffect.costReduction;
  return Math.floor(def.baseCost * Math.pow(1.12, unitState.count) * (1 - reduction));
}

/**
 * 兵種のレベルアップコストを計算する
 */
export function calcLevelUpCost(unitId: UnitId, unitState: UnitState): number {
  const def = UNIT_DEFINITIONS[unitId];
  return Math.floor(def.baseCost * 2 * Math.pow(2, unitState.level));
}

/**
 * クリック時の金貨獲得量を計算する
 */
export function calcClickGold(prophecyEffect: ProphecyEffectValues): number {
  return Math.floor(1 * (1 + prophecyEffect.clickBonus));
}

/**
 * DPS（秒あたりダメージ）を計算する
 */
export function calcDps(
  unitId: UnitId,
  unitState: UnitState,
  prophecyEffect: ProphecyEffectValues
): number {
  const atk = calcUnitAtk(unitId, unitState, prophecyEffect);
  const interval = calcUnitInterval(unitId, unitState, prophecyEffect);
  return atk / (interval / 1000);
}
