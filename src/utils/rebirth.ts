import type { UnitId, UnitsState } from '../types/game';
import { UNIT_IDS } from '../constants/units';

/**
 * 転生時に獲得する予知夢の欠片数を計算する
 */
export function calcRebirthFragments(wave: number): number {
  return Math.floor(wave / 2) + 1;
}

/**
 * 転生後のユニット初期状態を生成する
 */
export function createInitialUnits(): UnitsState {
  return Object.fromEntries(
    UNIT_IDS.map((id: UnitId) => [
      id,
      { level: 0, count: 0, unlockedSkills: [] as string[], skillRanks: {} },
    ])
  ) as unknown as UnitsState;
}

/**
 * 兵種のアンロック条件を確認する
 */
export function checkUnitUnlockCondition(
  _unitId: UnitId,
  units: UnitsState,
  unlockCond: Partial<Record<UnitId, number>> | undefined
): boolean {
  if (!unlockCond) return true;
  return Object.entries(unlockCond).every(
    ([reqId, reqLv]) => (units[reqId as UnitId]?.level ?? 0) >= (reqLv ?? 0)
  );
}

/**
 * 転生の価値を判定するためのスコアを計算する（Wave数が高いほど価値が高い）
 */
export function calcRebirthValue(wave: number): {
  fragments: number;
  isWorthIt: boolean;
} {
  const fragments = calcRebirthFragments(wave);
  // Wave 3以上（欠片2個以上）で転生に価値があると判断
  const isWorthIt = fragments >= 2;
  return { fragments, isWorthIt };
}
