import { create } from 'zustand';
import type { GameStore, UnitId, Enemy, ToastType, GameStats } from '../types/game';
import { UNIT_DEFINITIONS, UNIT_IDS } from '../constants/units';
import { PROPHECY_UPGRADES } from '../constants/skills';
import { ACHIEVEMENTS } from '../constants/achievements';
import {
  calcProphecyEffect,
  calcUnitCost,
  calcLevelUpCost,
  calcClickGold,
  calcUnitAtk,
  calcUnitInterval,
  calcSkillUpgradeCost,
} from '../utils/combat';
import { generateWaveEnemies, calcEnemyReward, calcWaveClearBonus } from '../utils/wave';
import { calcRebirthFragments, createInitialUnits, checkUnitUnlockCondition } from '../utils/rebirth';
import { checkNewAchievements } from '../utils/achievements';
import { saveGame, loadGame, resetSaveData } from './saveManager';
import { calcNewComboCount, calcComboMultiplier } from '../utils/combo';

let floatIdCounter = 0;

const savedState = loadGame();

const initialStats: GameStats = {
  totalPlayTime: 0,
  totalClicks: 0,
  bestWave: 1,
  rebirthCount: 0,
  totalKills: 0,
  unlockedAchievements: [],
};

export const useGameStore = create<GameStore>()((set, get) => ({
  // ---- Initial State ----
  gold: 0,
  medals: 0,
  fragments: 0,
  rebirthCount: 0,
  units: createInitialUnits(),
  enemies: [],
  wave: 1,
  waveActive: false,
  waveCleared: false,
  waveTimeLeft: 10,
  selectedUnit: 'swordsman',
  activeTab: 'units',
  prophecyUpgrades: [],
  floats: [],
  battleLog: [],
  toasts: [],
  showRebirth: false,
  clickPos: null,
  lastSaveTime: null,
  attackingUnitIds: new Set(),
  isMuted: false,
  bgmVolume: 0.4,
  seVolume: 0.6,
  sessionStartTime: Date.now(),
  sessionBestWave: 1,
  rebirthFlavorVisible: false,
  prevSessionBestWave: 0,
  stats: initialStats,
  // ---- Combo ----
  comboCount: 0,
  comboMultiplier: 1.0,
  lastClickTime: 0,
  // ---- Settings ----
  particlesEnabled: true,

  // セーブデータからの復元（存在する場合）
  ...(savedState ?? {}),

  // ---- Gold Actions ----
  setGold: (gold) => set({ gold }),
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  spendGold: (amount) => set((state) => ({ gold: state.gold - amount })),

  // ---- Fragments Actions ----
  setFragments: (fragments) => set({ fragments }),
  addFragments: (amount) => set((state) => ({ fragments: state.fragments + amount })),
  spendFragments: (amount) => set((state) => ({ fragments: state.fragments - amount })),

  // ---- Rebirth Count ----
  setRebirthCount: (count) => set({ rebirthCount: count }),

  // ---- Units Actions ----
  setUnits: (units) => set({ units }),
  updateUnit: (unitId, update) =>
    set((state) => ({
      units: {
        ...state.units,
        [unitId]: { ...state.units[unitId], ...update },
      },
    })),

  // ---- Enemy Actions ----
  setEnemies: (enemies) => set({ enemies }),
  damageEnemy: (enemyId, damage) =>
    set((state) => ({
      enemies: state.enemies.map((e) =>
        e.id === enemyId ? { ...e, hp: e.hp - damage } : e
      ),
    })),
  damageAllEnemies: (damage) =>
    set((state) => ({
      enemies: state.enemies.map((e) => ({ ...e, hp: e.hp - damage })),
    })),

  // ---- Wave Actions ----
  setWave: (wave) => set({ wave }),
  setWaveActive: (active) => set({ waveActive: active }),

  // ---- UI Actions ----
  setSelectedUnit: (unitId) => set({ selectedUnit: unitId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addProphecyUpgrade: (upgradeId) =>
    set((state) => ({ prophecyUpgrades: [...state.prophecyUpgrades, upgradeId] })),

  addFloat: (text, color, x, y) => {
    const id = ++floatIdCounter;
    set((state) => ({
      floats: [...state.floats, { id, text, color, x, y }],
    }));
    setTimeout(() => {
      set((state) => ({
        floats: state.floats.filter((f) => f.id !== id),
      }));
    }, 1200);
  },

  removeFloat: (id) =>
    set((state) => ({
      floats: state.floats.filter((f) => f.id !== id),
    })),

  addLog: (msg) =>
    set((state) => {
      const stamp = `[Wave ${state.wave}]`;
      const entry = `${stamp} ${msg}`;
      return {
        battleLog: [entry, ...state.battleLog].slice(0, 20),
      };
    }),

  addToast: (message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setShowRebirth: (show) => set({ showRebirth: show }),
  setClickPos: (pos) => set({ clickPos: pos }),
  setLastSaveTime: (time) => set({ lastSaveTime: time }),
  setWaveCleared: (cleared) => set({ waveCleared: cleared }),

  setAttackingUnitId: (unitId) => {
    set((state) => {
      const next = new Set(state.attackingUnitIds);
      next.add(unitId);
      return { attackingUnitIds: next };
    });
    setTimeout(() => {
      set((state) => {
        const next = new Set(state.attackingUnitIds);
        next.delete(unitId);
        return { attackingUnitIds: next };
      });
    }, 300);
  },

  setMuted: (muted: boolean) => set({ isMuted: muted }),
  setVolume: (bgm: number, se: number) => set({ bgmVolume: bgm, seVolume: se }),
  setRebirthFlavorVisible: (visible: boolean) => set({ rebirthFlavorVisible: visible }),
  setParticlesEnabled: (enabled: boolean) => set({ particlesEnabled: enabled }),

  // ---- Stats Actions ----
  addKills: (count: number) => {
    set((state) => ({
      stats: { ...state.stats, totalKills: state.stats.totalKills + count },
    }));
    runAchievementCheck(get);
  },

  updatePlayTime: (seconds: number) => {
    set((state) => ({
      stats: { ...state.stats, totalPlayTime: state.stats.totalPlayTime + seconds },
    }));
  },

  unlockAchievement: (id: string) => {
    set((state) => {
      if (state.stats.unlockedAchievements.includes(id)) return {};
      return {
        stats: {
          ...state.stats,
          unlockedAchievements: [...state.stats.unlockedAchievements, id],
        },
      };
    });
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) {
      get().addToast(`${def.icon} 実績解除：${def.name}`, 'success');
    }
  },

  saveNow: () => {
    const state = get();
    saveGame(state);
    set({ lastSaveTime: new Date().toISOString() });
  },

  resetSave: () => {
    resetSaveData();
    set({
      gold: 0,
      medals: 0,
      fragments: 0,
      rebirthCount: 0,
      units: createInitialUnits(),
      enemies: [],
      wave: 1,
      waveActive: false,
      waveCleared: false,
      waveTimeLeft: 10,
      prophecyUpgrades: [],
      floats: [],
      battleLog: [],
      toasts: [],
      showRebirth: false,
      lastSaveTime: null,
      sessionStartTime: Date.now(),
      sessionBestWave: 1,
      rebirthFlavorVisible: false,
      stats: initialStats,
      comboCount: 0,
      comboMultiplier: 1.0,
      lastClickTime: 0,
    });
  },

  // ---- Game Logic Actions ----

  buyUnit: (unitId: UnitId) => {
    const state = get();
    const { units, gold, prophecyUpgrades } = state;
    const prophecyEffect = calcProphecyEffect(prophecyUpgrades, PROPHECY_UPGRADES);
    const cost = calcUnitCost(unitId, units[unitId], prophecyEffect);
    if (gold < cost) return;

    const def = UNIT_DEFINITIONS[unitId];
    const isFirstHire = units[unitId].count === 0;
    const beforeDps = selectTotalDps(get());
    set((s) => ({
      gold: s.gold - cost,
      units: {
        ...s.units,
        [unitId]: { ...s.units[unitId], count: s.units[unitId].count + 1 },
      },
    }));
    const afterDps = selectTotalDps(get());
    const dpsDiff = Math.floor(afterDps - beforeDps);
    if (dpsDiff > 0) {
      get().addFloat(`+${def.name} → DPS +${dpsDiff}↑`, '#f1c40f', 50, 40);
    } else {
      get().addFloat(`${def.name} 雇用！`, def.color, 30, 50);
    }
    if (isFirstHire) {
      get().addToast(`${def.name} を解放した！`, 'success');
    }
    runAchievementCheck(get);
  },

  levelUpUnit: (unitId: UnitId) => {
    const state = get();
    const { units, gold } = state;
    const cost = calcLevelUpCost(unitId, units[unitId]);
    if (gold < cost) return;

    const def = UNIT_DEFINITIONS[unitId];
    const nextLevel = units[unitId].level + 1;
    const beforeDps = selectTotalDps(get());
    set((s) => ({
      gold: s.gold - cost,
      units: {
        ...s.units,
        [unitId]: { ...s.units[unitId], level: nextLevel },
      },
    }));
    const afterDps = selectTotalDps(get());
    const dpsDiff = Math.floor(afterDps - beforeDps);
    if (dpsDiff > 0) {
      get().addFloat(`${def.name} Lv${nextLevel}! DPS +${dpsDiff}↑`, '#3498db', 50, 40);
    }
    get().addLog(`📈 ${def.name} がLv${nextLevel}になった！`);

    // アンロック条件チェック
    const newUnits = get().units;
    for (const id of UNIT_IDS) {
      const unitDef = UNIT_DEFINITIONS[id];
      if (!unitDef.unlockCond) continue;
      if (checkUnitUnlockCondition(id, newUnits, unitDef.unlockCond)) {
        get().addLog(`✨ 上級兵種【${unitDef.name}】が解放された！`);
      }
    }
  },

  buySkill: (unitId: UnitId, skillId: string) => {
    const state = get();
    const { units, gold } = state;
    const def = UNIT_DEFINITIONS[unitId];
    const sk = def.skills.find((s) => s.id === skillId);
    if (!sk || gold < sk.cost) return;
    if (units[unitId].unlockedSkills.includes(skillId)) return;

    const beforeDps = selectTotalDps(get());
    set((s) => ({
      gold: s.gold - sk.cost,
      units: {
        ...s.units,
        [unitId]: {
          ...s.units[unitId],
          unlockedSkills: [...s.units[unitId].unlockedSkills, skillId],
        },
      },
    }));
    const afterDps = selectTotalDps(get());
    const dpsDiff = Math.floor(afterDps - beforeDps);
    get().addLog(`✨ スキル【${sk.name}】習得！`);
    if (dpsDiff > 0) {
      get().addToast(`✨ ${sk.name} 習得！ DPS +${dpsDiff}↑`, 'success');
    } else {
      get().addToast(`スキル【${sk.name}】を習得した！`, 'info');
    }
  },

  upgradeSkill: (unitId: UnitId, skillId: string) => {
    const state = get();
    const { units, gold } = state;
    const def = UNIT_DEFINITIONS[unitId];
    const sk = def.skills.find((s) => s.id === skillId);
    if (!sk) return;

    // 習得済みかつランクが3未満のスキルのみ強化可能
    if (!units[unitId].unlockedSkills.includes(skillId)) return;

    const currentRank = units[unitId].skillRanks[skillId] ?? 1;
    if (currentRank >= 3) return;

    const nextRank = (currentRank + 1) as 2 | 3;
    const cost = calcSkillUpgradeCost(sk.cost, nextRank);
    if (gold < cost) return;

    const beforeDps = selectTotalDps(get());
    set((s) => ({
      gold: s.gold - cost,
      units: {
        ...s.units,
        [unitId]: {
          ...s.units[unitId],
          skillRanks: {
            ...s.units[unitId].skillRanks,
            [skillId]: nextRank,
          },
        },
      },
    }));
    const afterDps = selectTotalDps(get());
    const dpsDiff = Math.floor(afterDps - beforeDps);
    get().addLog(`✨ スキル【${sk.name}】強化！Lv${nextRank}になった！`);
    if (dpsDiff > 0) {
      get().addToast(`✨ ${sk.name} Lv${nextRank}! DPS +${dpsDiff}↑`, 'success');
    } else {
      get().addToast(`スキル【${sk.name}】をLv${nextRank}に強化した！`, 'info');
    }
  },

  buyProphecy: (upgradeId: string) => {
    const state = get();
    const { prophecyUpgrades, fragments } = state;
    const pu = PROPHECY_UPGRADES.find((p) => p.id === upgradeId);
    if (!pu || fragments < pu.cost) return;
    if (prophecyUpgrades.includes(upgradeId)) return;

    set((s) => ({
      fragments: s.fragments - pu.cost,
      prophecyUpgrades: [...s.prophecyUpgrades, upgradeId],
    }));
    get().addLog(`🔮 予知【${pu.name}】が解放された！`);
    runAchievementCheck(get);
  },

  startWave: () => {
    const state = get();
    if (state.waveActive) return;
    const newEnemies = generateWaveEnemies(state.wave, state.rebirthCount);
    const newBestWave = Math.max(state.sessionBestWave, state.wave);
    const newStatsBestWave = Math.max(state.stats.bestWave, state.wave);
    set((s) => ({
      enemies: newEnemies,
      waveActive: true,
      waveTimeLeft: 10,
      sessionBestWave: newBestWave,
      stats: { ...s.stats, bestWave: newStatsBestWave },
    }));
    get().addLog(`⚔️ Wave ${state.wave} 開始！敵${newEnemies.length}体が攻め込んでくる！`);
    runAchievementCheck(get);
  },

  tickWaveTimer: () => {
    const { waveActive, waveTimeLeft, wave } = get();
    if (!waveActive) return;
    if (waveTimeLeft <= 1) {
      set({ waveActive: false, waveTimeLeft: 10, enemies: [] });
      get().addLog(`⏰ 時間切れ！Wave ${wave} 失敗。再挑戦するには Wave 開始を押してください`);
    } else {
      set({ waveTimeLeft: waveTimeLeft - 1 });
    }
  },

  doRebirth: () => {
    const state = get();
    const earned = calcRebirthFragments(state.wave);
    const newRebirthCount = state.rebirthCount + 1;
    const prevBest = Math.max(state.sessionBestWave, state.wave);
    set((s) => ({
      fragments: s.fragments + earned,
      rebirthCount: newRebirthCount,
      gold: 0,
      medals: 0,
      units: createInitialUnits(),
      enemies: [],
      wave: 1,
      waveActive: false,
      waveTimeLeft: 10,
      showRebirth: false,
      rebirthFlavorVisible: true,
      sessionStartTime: Date.now(),
      sessionBestWave: 1,
      prevSessionBestWave: prevBest,
      stats: {
        ...s.stats,
        rebirthCount: newRebirthCount,
      },
    }));
    get().addLog(`💫 予知夢の中で目覚めた…欠片を${earned}個手に入れた`);
    runAchievementCheck(get);
  },

  handleCastleClick: (x: number, y: number) => {
    const state = get();
    const now = Date.now();

    // コンボ計算
    const newComboCount = calcNewComboCount(state.comboCount, state.lastClickTime, now);
    const newMultiplier = calcComboMultiplier(newComboCount);

    const prophecyEffect = calcProphecyEffect(state.prophecyUpgrades, PROPHECY_UPGRADES);
    const baseAmount = calcClickGold(prophecyEffect);
    const amount = Math.floor(baseAmount * newMultiplier);

    set((s) => ({
      gold: s.gold + amount,
      stats: { ...s.stats, totalClicks: s.stats.totalClicks + 1 },
      comboCount: newComboCount,
      comboMultiplier: newMultiplier,
      lastClickTime: now,
    }));

    const floatText = newComboCount >= 2
      ? `+${amount}G ×${newMultiplier.toFixed(1)}`
      : `+${amount}G`;
    get().addFloat(floatText, '#f1c40f', x, y);
    set({ clickPos: { x, y, id: now } });
    runAchievementCheck(get);
  },
}));

// ---- Selector Helpers ----

export function selectProphecyEffect(state: GameStore) {
  return calcProphecyEffect(state.prophecyUpgrades, PROPHECY_UPGRADES);
}

export function selectIsUnitUnlocked(unitId: UnitId) {
  return (state: GameStore): boolean => {
    const def = UNIT_DEFINITIONS[unitId];
    return checkUnitUnlockCondition(unitId, state.units, def.unlockCond);
  };
}

export function selectTotalDps(state: GameStore) {
  const prophecyEffect = calcProphecyEffect(state.prophecyUpgrades, PROPHECY_UPGRADES);
  return UNIT_IDS.filter((id) => {
    const def = UNIT_DEFINITIONS[id];
    if (def.target === 'passive') return false;
    const unlocked = checkUnitUnlockCondition(id, state.units, def.unlockCond);
    return unlocked && (state.units[id]?.count ?? 0) > 0;
  }).reduce((sum, id) => {
    const atk = calcUnitAtk(id, state.units[id], prophecyEffect);
    const interval = calcUnitInterval(id, state.units[id], prophecyEffect);
    return sum + atk / (interval / 1000);
  }, 0);
}

// ---- Achievement Check Helper ----

/**
 * 現在のストア状態に基づいて実績チェックを行い、新規解除があればトーストを表示する
 */
function runAchievementCheck(get: () => GameStore): void {
  const state = get();
  const newIds = checkNewAchievements({
    stats: state.stats,
    units: state.units,
    prophecyUpgrades: state.prophecyUpgrades,
  });
  for (const id of newIds) {
    get().unlockAchievement(id);
  }
}

// ---- Combat Loop Helper ----

/**
 * 戦闘ループ内で敵を攻撃し、死亡処理・Wave完了判定を行う
 */
export function processCombatTick(
  atk: number,
  target: 'single' | 'all' | 'splash',
  enemies: Enemy[],
  wave: number
): { updatedEnemies: Enemy[]; goldReward: number; waveClear: boolean } {
  if (enemies.length === 0 || atk === 0) {
    return { updatedEnemies: enemies, goldReward: 0, waveClear: false };
  }

  let updated = [...enemies];

  if (target === 'single') {
    updated[0] = { ...updated[0], hp: updated[0].hp - atk };
  } else {
    updated = updated.map((e) => ({ ...e, hp: e.hp - atk }));
  }

  const dead = updated.filter((e) => e.hp <= 0);
  const alive = updated.filter((e) => e.hp > 0);
  const reward = calcEnemyReward(wave);
  const goldReward = dead.length * reward;

  const waveClear = alive.length === 0 && enemies.length > 0;

  if (waveClear) {
    const bonus = calcWaveClearBonus(wave);
    return { updatedEnemies: alive, goldReward: goldReward + bonus, waveClear: true };
  }

  return { updatedEnemies: alive, goldReward, waveClear: false };
}
