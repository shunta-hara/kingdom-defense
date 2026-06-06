/**
 * コンボシステムのロジック
 */

export const COMBO_TIMEOUT_MS = 2000;

/**
 * コンボカウントを計算する
 * @param prevComboCount 前回のコンボカウント
 * @param lastClickTime 前回クリック時刻（Date.now() 相当）
 * @param now 現在時刻（Date.now() 相当）
 * @returns 新しいコンボカウント
 */
export function calcNewComboCount(
  prevComboCount: number,
  lastClickTime: number,
  now: number
): number {
  const elapsed = now - lastClickTime;
  return elapsed <= COMBO_TIMEOUT_MS ? prevComboCount + 1 : 0;
}

/**
 * コンボ倍率を計算する
 * コンボ0で×1.0、コンボ20で上限×5.0
 * @param comboCount コンボカウント
 * @returns 倍率（1.0〜5.0）
 */
export function calcComboMultiplier(comboCount: number): number {
  return Math.min(1.0 + comboCount * 0.2, 5.0);
}
