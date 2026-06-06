import type { Enemy } from '../types/game';

const ENEMY_EMOJIS = ['👹', '💀', '👿', '🔥'] as const;

/**
 * Waveの敵絵文字を取得する
 */
export function getEnemyEmoji(wave: number): string {
  if (wave < 5) return ENEMY_EMOJIS[0];
  if (wave < 10) return ENEMY_EMOJIS[1];
  if (wave < 20) return ENEMY_EMOJIS[2];
  return ENEMY_EMOJIS[3];
}

/**
 * 指定Waveの敵数を計算する（最大12体）
 */
export function calcEnemyCount(wave: number): number {
  const base = Math.floor(3 + wave * 1.5);
  return Math.min(base, 12);
}

/**
 * 指定Waveの敵HPを計算する
 */
export function calcEnemyHp(wave: number, rebirthCount: number): number {
  return Math.floor(25 * Math.pow(1.32, wave - 1) * (1 + rebirthCount * 0.08));
}

/**
 * 敵撃破時の報酬金貨を計算する
 */
export function calcEnemyReward(wave: number): number {
  return Math.floor(12 * Math.pow(1.22, wave - 1));
}

/**
 * Waveクリア時のボーナス金貨を計算する
 */
export function calcWaveClearBonus(wave: number): number {
  return Math.floor(60 * wave);
}

let enemyIdCounter = 0;

/**
 * Waveの敵配列を生成する
 * ボスWave（10・20・30の倍数）は敵数半減・HP2倍
 */
export function generateWaveEnemies(wave: number, rebirthCount: number): Enemy[] {
  const boss = isBossWave(wave);
  const baseCount = calcEnemyCount(wave);
  const baseHp = calcEnemyHp(wave, rebirthCount);

  const count = boss ? Math.max(1, Math.floor(baseCount / 2)) : baseCount;
  const hp = boss ? baseHp * 2 : baseHp;
  const emoji = getEnemyEmoji(wave);

  return Array.from({ length: count }, () => {
    const id = ++enemyIdCounter;
    return { id, maxHp: hp, hp, emoji };
  });
}

/**
 * テスト用にカウンターをリセットする
 */
export function resetEnemyIdCounter(): void {
  enemyIdCounter = 0;
}

/**
 * 指定WaveがボスWaveかどうかを判定する（10・20・30の倍数）
 */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 10 === 0;
}

/**
 * 次Waveの予告情報を計算する
 */
export type WavePreview = {
  wave: number;
  count: number;
  hp: number;
  isBoss: boolean;
};

export function calcWavePreview(wave: number, rebirthCount: number): WavePreview {
  const boss = isBossWave(wave);
  const baseCount = calcEnemyCount(wave);
  const baseHp = calcEnemyHp(wave, rebirthCount);

  // ボスWaveは敵数半減・HP2倍
  const count = boss ? Math.max(1, Math.floor(baseCount / 2)) : baseCount;
  const hp = boss ? baseHp * 2 : baseHp;

  return { wave, count, hp, isBoss: boss };
}
