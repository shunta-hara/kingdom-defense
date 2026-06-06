import { describe, it, expect } from 'vitest';
import { checkNewAchievements } from '../achievements';
import type { AchievementContext } from '../achievements';
import type { GameStats, UnitsState } from '../../types/game';

function makeStats(overrides: Partial<GameStats> = {}): GameStats {
  return {
    totalPlayTime: 0,
    totalClicks: 0,
    bestWave: 1,
    rebirthCount: 0,
    totalKills: 0,
    unlockedAchievements: [],
    ...overrides,
  };
}

function makeUnits(overrides: Partial<UnitsState> = {}): UnitsState {
  const base: UnitsState = {
    swordsman: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
    spearman: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
    archer: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
    mage: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
    paladin: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
    merchant: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
    swordmaster: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
    dragoon: { level: 0, count: 0, unlockedSkills: [], skillRanks: {} },
  };
  return { ...base, ...overrides };
}

function makeCtx(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    stats: makeStats(),
    units: makeUnits(),
    prophecyUpgrades: [],
    ...overrides,
  };
}

describe('checkNewAchievements', () => {
  it('初期状態では実績が解除されない', () => {
    const result = checkNewAchievements(makeCtx());
    expect(result).toHaveLength(0);
  });

  it('ach_wave5: bestWave >= 5 で解除される', () => {
    const ctx = makeCtx({ stats: makeStats({ bestWave: 5 }) });
    expect(checkNewAchievements(ctx)).toContain('ach_wave5');
  });

  it('ach_wave5: bestWave 4 では解除されない', () => {
    const ctx = makeCtx({ stats: makeStats({ bestWave: 4 }) });
    expect(checkNewAchievements(ctx)).not.toContain('ach_wave5');
  });

  it('ach_all_basic: 全4種雇用で解除される', () => {
    const ctx = makeCtx({
      units: makeUnits({
        spearman: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
        archer: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
        mage: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
        paladin: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
      }),
    });
    expect(checkNewAchievements(ctx)).toContain('ach_all_basic');
  });

  it('ach_all_basic: 3種のみでは解除されない', () => {
    const ctx = makeCtx({
      units: makeUnits({
        spearman: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
        archer: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
        mage: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
      }),
    });
    expect(checkNewAchievements(ctx)).not.toContain('ach_all_basic');
  });

  it('ach_first_rebirth: rebirthCount >= 1 で解除される', () => {
    const ctx = makeCtx({ stats: makeStats({ rebirthCount: 1 }) });
    expect(checkNewAchievements(ctx)).toContain('ach_first_rebirth');
  });

  it('ach_100clicks: totalClicks >= 100 で解除される', () => {
    const ctx = makeCtx({ stats: makeStats({ totalClicks: 100 }) });
    expect(checkNewAchievements(ctx)).toContain('ach_100clicks');
  });

  it('ach_100clicks: 99クリックでは解除されない', () => {
    const ctx = makeCtx({ stats: makeStats({ totalClicks: 99 }) });
    expect(checkNewAchievements(ctx)).not.toContain('ach_100clicks');
  });

  it('ach_dragoon: 竜騎士 count > 0 で解除される', () => {
    const ctx = makeCtx({
      units: makeUnits({
        dragoon: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
      }),
    });
    expect(checkNewAchievements(ctx)).toContain('ach_dragoon');
  });

  it('ach_wave10: bestWave >= 10 で解除される', () => {
    const ctx = makeCtx({ stats: makeStats({ bestWave: 10 }) });
    expect(checkNewAchievements(ctx)).toContain('ach_wave10');
  });

  it('ach_wave20: bestWave >= 20 で解除される', () => {
    const ctx = makeCtx({ stats: makeStats({ bestWave: 20 }) });
    expect(checkNewAchievements(ctx)).toContain('ach_wave20');
  });

  it('ach_wave20: bestWave 19 では解除されない', () => {
    const ctx = makeCtx({ stats: makeStats({ bestWave: 19 }) });
    expect(checkNewAchievements(ctx)).not.toContain('ach_wave20');
  });

  it('ach_all_prophecy: 予知5種購入で解除される', () => {
    const ctx = makeCtx({
      prophecyUpgrades: ['p_gold', 'p_start', 'p_speed', 'p_cost', 'p_power'],
    });
    expect(checkNewAchievements(ctx)).toContain('ach_all_prophecy');
  });

  it('ach_all_prophecy: 4種では解除されない', () => {
    const ctx = makeCtx({
      prophecyUpgrades: ['p_gold', 'p_start', 'p_speed', 'p_cost'],
    });
    expect(checkNewAchievements(ctx)).not.toContain('ach_all_prophecy');
  });

  it('ach_swordmaster: 魔剣士 count > 0 で解除される', () => {
    const ctx = makeCtx({
      units: makeUnits({
        swordmaster: { level: 0, count: 1, unlockedSkills: [], skillRanks: {} },
      }),
    });
    expect(checkNewAchievements(ctx)).toContain('ach_swordmaster');
  });

  it('ach_1000kills: totalKills >= 1000 で解除される', () => {
    const ctx = makeCtx({ stats: makeStats({ totalKills: 1000 }) });
    expect(checkNewAchievements(ctx)).toContain('ach_1000kills');
  });

  it('ach_1000kills: 999体では解除されない', () => {
    const ctx = makeCtx({ stats: makeStats({ totalKills: 999 }) });
    expect(checkNewAchievements(ctx)).not.toContain('ach_1000kills');
  });

  it('既に解除済みの実績は再度リストに含まれない', () => {
    const ctx = makeCtx({
      stats: makeStats({
        bestWave: 5,
        unlockedAchievements: ['ach_wave5'],
      }),
    });
    expect(checkNewAchievements(ctx)).not.toContain('ach_wave5');
  });

  it('複数の実績が同時に解除される', () => {
    const ctx = makeCtx({
      stats: makeStats({
        bestWave: 10,
        totalClicks: 100,
      }),
    });
    const result = checkNewAchievements(ctx);
    expect(result).toContain('ach_wave5');
    expect(result).toContain('ach_wave10');
    expect(result).toContain('ach_100clicks');
  });
});
