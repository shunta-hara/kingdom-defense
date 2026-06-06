import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEnemyEmoji,
  calcEnemyCount,
  calcEnemyHp,
  calcEnemyReward,
  calcWaveClearBonus,
  generateWaveEnemies,
  resetEnemyIdCounter,
  isBossWave,
  calcWavePreview,
} from '../wave';

beforeEach(() => {
  resetEnemyIdCounter();
});

// ============================================================
// getEnemyEmoji
// ============================================================

describe('getEnemyEmoji', () => {
  it('正常系: Wave1-4は👹', () => {
    expect(getEnemyEmoji(1)).toBe('👹');
    expect(getEnemyEmoji(4)).toBe('👹');
  });

  it('正常系: Wave5-9は💀', () => {
    expect(getEnemyEmoji(5)).toBe('💀');
    expect(getEnemyEmoji(9)).toBe('💀');
  });

  it('正常系: Wave10-19は👿', () => {
    expect(getEnemyEmoji(10)).toBe('👿');
    expect(getEnemyEmoji(19)).toBe('👿');
  });

  it('正常系: Wave20以上は🔥', () => {
    expect(getEnemyEmoji(20)).toBe('🔥');
    expect(getEnemyEmoji(100)).toBe('🔥');
  });

  it('境界値: Wave5の境界', () => {
    expect(getEnemyEmoji(4)).toBe('👹');
    expect(getEnemyEmoji(5)).toBe('💀');
  });
});

// ============================================================
// calcEnemyCount
// ============================================================

describe('calcEnemyCount', () => {
  it('正常系: Wave1の敵数は4体（floor(3 + 1.5) = 4）', () => {
    expect(calcEnemyCount(1)).toBe(4);
  });

  it('正常系: Wave2の敵数は6体（floor(3 + 3) = 6）', () => {
    expect(calcEnemyCount(2)).toBe(6);
  });

  it('正常系: 最大12体を超えない', () => {
    expect(calcEnemyCount(20)).toBeLessThanOrEqual(12);
    expect(calcEnemyCount(100)).toBeLessThanOrEqual(12);
  });

  it('異常系: 非常に大きいWaveでも最大12体', () => {
    expect(calcEnemyCount(1000)).toBe(12);
  });

  it('境界値: 12体に到達するWave', () => {
    // floor(3 + wave * 1.5) = 12 → wave * 1.5 = 9 → wave = 6
    expect(calcEnemyCount(6)).toBe(12);
    expect(calcEnemyCount(7)).toBe(12); // clamp
  });
});

// ============================================================
// calcEnemyHp
// ============================================================

describe('calcEnemyHp', () => {
  it('正常系: Wave1、転生0のHP', () => {
    const result = calcEnemyHp(1, 0);
    expect(result).toBe(25); // floor(25 * 1.32^0 * 1) = 25
  });

  it('正常系: Wave2のHPはWave1より高い', () => {
    const hp1 = calcEnemyHp(1, 0);
    const hp2 = calcEnemyHp(2, 0);
    expect(hp2).toBeGreaterThan(hp1);
  });

  it('正常系: 転生数が多いほどHPが上がる', () => {
    const hp0 = calcEnemyHp(1, 0);
    const hp3 = calcEnemyHp(1, 3);
    expect(hp3).toBeGreaterThan(hp0);
  });

  it('異常系: 転生0でも正のHPを返す', () => {
    expect(calcEnemyHp(1, 0)).toBeGreaterThan(0);
  });

  it('境界値: Wave1、転生10の場合', () => {
    // floor(25 * 1 * (1 + 10 * 0.08)) = floor(25 * 1.8) = 45
    expect(calcEnemyHp(1, 10)).toBe(45);
  });
});

// ============================================================
// calcEnemyReward
// ============================================================

describe('calcEnemyReward', () => {
  it('正常系: Wave1の報酬は12G', () => {
    expect(calcEnemyReward(1)).toBe(12);
  });

  it('正常系: Waveが上がるほど報酬が増える', () => {
    const r1 = calcEnemyReward(1);
    const r5 = calcEnemyReward(5);
    expect(r5).toBeGreaterThan(r1);
  });

  it('境界値: Wave10の報酬', () => {
    const result = calcEnemyReward(10);
    expect(result).toBe(Math.floor(12 * Math.pow(1.22, 9)));
  });
});

// ============================================================
// calcWaveClearBonus
// ============================================================

describe('calcWaveClearBonus', () => {
  it('正常系: Wave1のクリアボーナスは60G', () => {
    expect(calcWaveClearBonus(1)).toBe(60);
  });

  it('正常系: Wave5のクリアボーナスは300G', () => {
    expect(calcWaveClearBonus(5)).toBe(300);
  });

  it('境界値: Waveが大きくなると線形にボーナスが増える', () => {
    expect(calcWaveClearBonus(10)).toBe(600);
    expect(calcWaveClearBonus(20)).toBe(1200);
  });
});

// ============================================================
// generateWaveEnemies
// ============================================================

describe('generateWaveEnemies', () => {
  it('正常系: Wave1、転生0で正しい敵配列を生成', () => {
    const enemies = generateWaveEnemies(1, 0);
    expect(enemies.length).toBe(4); // Wave1の敵数
    expect(enemies[0].maxHp).toBe(25);
    expect(enemies[0].hp).toBe(25);
    expect(enemies[0].emoji).toBe('👹');
  });

  it('正常系: 各敵はユニークなIDを持つ', () => {
    const enemies = generateWaveEnemies(1, 0);
    const ids = enemies.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(enemies.length);
  });

  it('正常系: hp === maxHp（初期状態）', () => {
    const enemies = generateWaveEnemies(3, 0);
    for (const enemy of enemies) {
      expect(enemy.hp).toBe(enemy.maxHp);
    }
  });

  it('異常系: Wave100でも有効な敵配列を返す', () => {
    const enemies = generateWaveEnemies(100, 0);
    expect(enemies.length).toBeGreaterThan(0);
    expect(enemies.length).toBeLessThanOrEqual(12);
    for (const enemy of enemies) {
      expect(enemy.maxHp).toBeGreaterThan(0);
    }
  });

  it('境界値: 転生10の場合HPが増加している', () => {
    const enemies0 = generateWaveEnemies(1, 0);
    const enemies10 = generateWaveEnemies(1, 10);
    expect(enemies10[0].maxHp).toBeGreaterThan(enemies0[0].maxHp);
  });

  it('ボスWave: Wave10では敵数が半減しHPが2倍', () => {
    const normalEnemies = generateWaveEnemies(9, 0);
    resetEnemyIdCounter();
    const bossEnemies = generateWaveEnemies(10, 0);
    const bossHp = calcEnemyHp(10, 0);
    // ボスWaveは敵数半減
    expect(bossEnemies.length).toBeLessThan(normalEnemies.length);
    // ボスWaveはHP2倍
    expect(bossEnemies[0].maxHp).toBe(bossHp * 2);
  });

  it('ボスWave: Wave20はボスWave', () => {
    const enemies = generateWaveEnemies(20, 0);
    const baseHp = calcEnemyHp(20, 0);
    expect(enemies[0].maxHp).toBe(baseHp * 2);
  });

  it('ボスWave: Wave30はボスWave', () => {
    const enemies = generateWaveEnemies(30, 0);
    const baseHp = calcEnemyHp(30, 0);
    expect(enemies[0].maxHp).toBe(baseHp * 2);
  });
});

// ============================================================
// isBossWave
// ============================================================

describe('isBossWave', () => {
  it('正常系: Wave10はボスWave', () => {
    expect(isBossWave(10)).toBe(true);
  });

  it('正常系: Wave20はボスWave', () => {
    expect(isBossWave(20)).toBe(true);
  });

  it('正常系: Wave30はボスWave', () => {
    expect(isBossWave(30)).toBe(true);
  });

  it('正常系: Wave9はボスWaveではない', () => {
    expect(isBossWave(9)).toBe(false);
  });

  it('正常系: Wave11はボスWaveではない', () => {
    expect(isBossWave(11)).toBe(false);
  });

  it('異常系: Wave0はボスWaveではない', () => {
    expect(isBossWave(0)).toBe(false);
  });

  it('境界値: Wave100はボスWave', () => {
    expect(isBossWave(100)).toBe(true);
  });
});

// ============================================================
// calcWavePreview
// ============================================================

describe('calcWavePreview', () => {
  it('正常系: 通常Waveは敵数・HPをそのまま返す', () => {
    const preview = calcWavePreview(1, 0);
    expect(preview.isBoss).toBe(false);
    expect(preview.count).toBe(calcEnemyCount(1));
    expect(preview.hp).toBe(calcEnemyHp(1, 0));
  });

  it('ボスWave: Wave10では敵数半減・HP2倍', () => {
    const preview = calcWavePreview(10, 0);
    const baseCount = calcEnemyCount(10);
    const baseHp = calcEnemyHp(10, 0);
    expect(preview.isBoss).toBe(true);
    expect(preview.count).toBe(Math.max(1, Math.floor(baseCount / 2)));
    expect(preview.hp).toBe(baseHp * 2);
  });

  it('ボスWave: Wave20は正しく計算される', () => {
    const preview = calcWavePreview(20, 0);
    expect(preview.isBoss).toBe(true);
  });

  it('ボスWave: 転生数が反映される', () => {
    const preview0 = calcWavePreview(10, 0);
    const preview5 = calcWavePreview(10, 5);
    expect(preview5.hp).toBeGreaterThan(preview0.hp);
  });
});
