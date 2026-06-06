import type { GameStats, UnitsState } from '../types/game';

/**
 * 達成チェックのコンテキスト型
 */
export type AchievementContext = {
  stats: GameStats;
  units: UnitsState;
  prophecyUpgrades: string[];
};

/**
 * 各実績の達成条件チェック関数マップ
 * true を返せば未解除 → 解除へ遷移する
 */
export const ACHIEVEMENT_CHECKERS: Record<
  string,
  (ctx: AchievementContext) => boolean
> = {
  ach_wave5: (ctx) => ctx.stats.bestWave >= 5,
  ach_all_basic: (ctx) =>
    ctx.units['spearman'].count > 0 &&
    ctx.units['archer'].count > 0 &&
    ctx.units['mage'].count > 0 &&
    ctx.units['paladin'].count > 0,
  ach_first_rebirth: (ctx) => ctx.stats.rebirthCount >= 1,
  ach_100clicks: (ctx) => ctx.stats.totalClicks >= 100,
  ach_dragoon: (ctx) => ctx.units['dragoon'].count > 0,
  ach_wave10: (ctx) => ctx.stats.bestWave >= 10,
  ach_wave20: (ctx) => ctx.stats.bestWave >= 20,
  ach_all_prophecy: (ctx) => ctx.prophecyUpgrades.length >= 5,
  ach_swordmaster: (ctx) => ctx.units['swordmaster'].count > 0,
  ach_1000kills: (ctx) => ctx.stats.totalKills >= 1000,
};

/**
 * 現在のコンテキストに基づいて新たに解除される実績IDの一覧を返す
 */
export function checkNewAchievements(ctx: AchievementContext): string[] {
  const { stats } = ctx;
  const newlyUnlocked: string[] = [];

  for (const [id, checker] of Object.entries(ACHIEVEMENT_CHECKERS)) {
    if (stats.unlockedAchievements.includes(id)) continue;
    if (checker(ctx)) {
      newlyUnlocked.push(id);
    }
  }

  return newlyUnlocked;
}
