// ============================================================
// Game Types
// ============================================================

export type UnitId =
  | 'swordsman'
  | 'spearman'
  | 'archer'
  | 'mage'
  | 'paladin'
  | 'merchant'
  | 'swordmaster'
  | 'dragoon';

export type AttackTarget = 'single' | 'dual' | 'all' | 'splash' | 'passive';

export type SkillEffect = {
  atk?: number;
  interval?: number;
  goldBonus?: number;
};

export type SkillDefinition = {
  id: string;
  name: string;
  desc: string;
  cost: number;
  effect: SkillEffect;
};

export type UnlockCondition = Partial<Record<UnitId, number>>;

export type UnitDefinition = {
  id: UnitId;
  name: string;
  emoji: string;
  desc: string;
  baseCost: number;
  baseAtk: number;
  atkInterval: number;
  target: AttackTarget;
  color: string;
  unlocked: boolean;
  unlockCond?: UnlockCondition;
  skills: SkillDefinition[];
};

/**
 * スキルランク: 0 = 未習得, 1 = 習得済み(Lv1), 2 = 強化済み(Lv2), 3 = 最大強化(Lv3)
 */
export type SkillRank = 0 | 1 | 2 | 3;

/**
 * スキルID → ランクのマップ（未習得スキルは含まれないか 0 として扱う）
 */
export type SkillRanks = Record<string, SkillRank>;

export type UnitState = {
  level: number;
  count: number;
  unlockedSkills: string[];
  /** スキルランク情報（スキルIDとランク0〜3のマップ） */
  skillRanks: SkillRanks;
};

export type UnitsState = Record<UnitId, UnitState>;

export type Enemy = {
  id: number;
  maxHp: number;
  hp: number;
  emoji: string;
};

export type ProphecyEffectValues = {
  clickBonus: number;
  globalAtk: number;
  globalInterval: number;
  costReduction: number;
};

export type ProphecyUpgradeEffect = {
  clickBonus?: number;
  globalAtk?: number;
  globalInterval?: number;
  costReduction?: number;
};

export type ProphecyUpgradeDefinition = {
  id: string;
  name: string;
  desc: string;
  cost: number;
  effect: ProphecyUpgradeEffect;
};

export type FloatText = {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
};

export type ToastType = 'info' | 'success' | 'warning';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

export type ClickPosition = {
  x: number;
  y: number;
  id: number;
};

export type ActiveTab = 'units' | 'skills' | 'prophecy' | 'stats';

// ============================================================
// Stats & Achievement Types
// ============================================================

export type GameStats = {
  totalPlayTime: number;       // 秒（累積）
  totalClicks: number;
  bestWave: number;            // 全転生通じての最高Wave
  rebirthCount: number;
  totalKills: number;
  unlockedAchievements: string[]; // achievement ID の配列
};

export type AchievementDefinition = {
  id: string;
  name: string;
  desc: string;
  icon: string;
};

// ============================================================
// Audio Types
// ============================================================

export type AudioSettings = {
  isMuted: boolean;
  bgmVolume: number; // 0.0 - 1.0
  seVolume: number;  // 0.0 - 1.0
};

// ============================================================
// Game Store State
// ============================================================

export type GameState = {
  gold: number;
  medals: number;
  fragments: number;
  rebirthCount: number;
  units: UnitsState;
  enemies: Enemy[];
  wave: number;
  waveActive: boolean;
  waveCleared: boolean;
  waveTimeLeft: number;
  selectedUnit: UnitId;
  activeTab: ActiveTab;
  prophecyUpgrades: string[];
  floats: FloatText[];
  battleLog: string[];
  toasts: Toast[];
  showRebirth: boolean;
  clickPos: ClickPosition | null;
  lastSaveTime: string | null; // ISO 8601 string or null
  attackingUnitIds: Set<UnitId>; // currently animating attack units
  isMuted: boolean;
  bgmVolume: number;
  seVolume: number;
  sessionStartTime: number; // 現周回の開始時刻（Date.now()）
  sessionBestWave: number;  // 現周回の最高Wave
  rebirthFlavorVisible: boolean; // 転生フレーバーテキスト表示フラグ
  prevSessionBestWave: number;  // 前周回の最高Wave（転生直後の演出用）
  stats: GameStats;
  // ---- Combo State ----
  comboCount: number;        // 連続クリック数
  comboMultiplier: number;   // 倍率 1.0 〜 5.0
  lastClickTime: number;     // 最後にクリックした時刻（Date.now()）
  // ---- Settings ----
  particlesEnabled: boolean; // パーティクルエフェクトのON/OFF
};

export type GameActions = {
  setGold: (gold: number) => void;
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => void;
  setFragments: (fragments: number) => void;
  addFragments: (amount: number) => void;
  spendFragments: (amount: number) => void;
  setRebirthCount: (count: number) => void;
  setUnits: (units: UnitsState) => void;
  updateUnit: (unitId: UnitId, update: Partial<UnitState>) => void;
  setEnemies: (enemies: Enemy[]) => void;
  damageEnemy: (enemyId: number, damage: number) => void;
  damageAllEnemies: (damage: number) => void;
  setWave: (wave: number) => void;
  setWaveActive: (active: boolean) => void;
  setSelectedUnit: (unitId: UnitId) => void;
  setActiveTab: (tab: ActiveTab) => void;
  addProphecyUpgrade: (upgradeId: string) => void;
  addFloat: (text: string, color: string, x: number, y: number) => void;
  removeFloat: (id: number) => void;
  addLog: (msg: string) => void;
  setShowRebirth: (show: boolean) => void;
  setClickPos: (pos: ClickPosition | null) => void;
  setLastSaveTime: (time: string | null) => void;
  setWaveCleared: (cleared: boolean) => void;
  setAttackingUnitId: (unitId: UnitId) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (bgm: number, se: number) => void;
  saveNow: () => void;
  resetSave: () => void;
  setRebirthFlavorVisible: (visible: boolean) => void;
  buyUnit: (unitId: UnitId) => void;
  levelUpUnit: (unitId: UnitId) => void;
  buySkill: (unitId: UnitId, skillId: string) => void;
  upgradeSkill: (unitId: UnitId, skillId: string) => void;
  buyProphecy: (upgradeId: string) => void;
  startWave: () => void;
  tickWaveTimer: () => void;
  doRebirth: () => void;
  handleCastleClick: (x: number, y: number) => void;
  addKills: (count: number) => void;
  updatePlayTime: (seconds: number) => void;
  unlockAchievement: (id: string) => void;
  setParticlesEnabled: (enabled: boolean) => void;
};

export type GameStore = GameState & GameActions;

// ============================================================
// Save Data Types
// ============================================================

export const SAVE_VERSION = 2;

export type SaveData = {
  version: number;
  savedAt: string; // ISO 8601 string
  gold: number;
  medals: number;
  fragments: number;
  rebirthCount: number;
  units: UnitsState;
  wave: number;
  prophecyUpgrades: string[];
  stats?: GameStats;
};

export function isSaveData(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.version !== 'number') return false;
  if (typeof obj.savedAt !== 'string') return false;
  if (typeof obj.gold !== 'number') return false;
  // medals は v2 から追加。旧データは後でマイグレーションするため型ガードでは省略
  if (typeof obj.fragments !== 'number') return false;
  if (typeof obj.rebirthCount !== 'number') return false;
  if (typeof obj.wave !== 'number') return false;
  if (!Array.isArray(obj.prophecyUpgrades)) return false;
  if (typeof obj.units !== 'object' || obj.units === null) return false;
  return true;
}

/**
 * スキルランクの値が有効な SkillRank (0 | 1 | 2 | 3) かを確認する
 */
export function isSkillRank(value: unknown): value is SkillRank {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/**
 * SkillRanks オブジェクトの型ガード
 */
export function isSkillRanks(value: unknown): value is SkillRanks {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(isSkillRank);
}
