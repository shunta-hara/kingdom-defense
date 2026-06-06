import type { GameState, SaveData, AudioSettings, SkillRank, SkillRanks } from '../types/game';
import { SAVE_VERSION, isSaveData, isSkillRank } from '../types/game';
import { createInitialUnits } from '../utils/rebirth';

export const SAVE_KEY = 'kingdom-defense-save';
export const AUDIO_SAVE_KEY = 'kingdom-defense-audio';

/**
 * ゲーム状態をlocalStorageに保存する
 */
export function saveGame(state: GameState): void {
  const data: SaveData = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    gold: state.gold,
    medals: state.medals,
    fragments: state.fragments,
    rebirthCount: state.rebirthCount,
    units: state.units,
    wave: state.wave,
    prophecyUpgrades: state.prophecyUpgrades,
    stats: state.stats,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage が利用不能な場合（プライベートモードなど）は無視
  }
}

/**
 * UnitState の skillRanks フィールドを型安全に読み込む
 * 無効な値を含む場合はデフォルト値（{}）を使用する
 */
function migrateSkillRanks(rawRanks: unknown): SkillRanks {
  if (typeof rawRanks !== 'object' || rawRanks === null) return {};
  const result: SkillRanks = {};
  for (const [key, val] of Object.entries(rawRanks as Record<string, unknown>)) {
    if (isSkillRank(val)) {
      result[key] = val as SkillRank;
    }
  }
  return result;
}

/**
 * localStorageからゲーム状態を読み込む
 * 型ガードで検証し、不正なデータの場合はnullを返す
 * v1 → v2 のマイグレーション（medals・skillRanks フィールド追加）を行う
 */
export function loadGame(): Partial<GameState> | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }

  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isSaveData(parsed)) return null;

  // バージョンが範囲外の場合は null を返す
  // サポート対象: v1（旧バージョン、マイグレーション対応）および v2（現行バージョン）
  const migratedVersion = parsed.version;
  if (migratedVersion < 1 || migratedVersion > SAVE_VERSION) return null;

  // units の skillRanks フィールドをマイグレーション
  const initialUnits = createInitialUnits();
  const rawUnits = parsed.units as Record<string, unknown>;
  const migratedUnits = Object.fromEntries(
    Object.entries(initialUnits).map(([id, defaultUnitState]) => {
      const raw = rawUnits[id];
      if (typeof raw !== 'object' || raw === null) return [id, defaultUnitState];
      const rawUnit = raw as Record<string, unknown>;
      const migratedUnit = {
        ...defaultUnitState,
        level: typeof rawUnit.level === 'number' ? rawUnit.level : 0,
        count: typeof rawUnit.count === 'number' ? rawUnit.count : 0,
        unlockedSkills: Array.isArray(rawUnit.unlockedSkills)
          ? (rawUnit.unlockedSkills as unknown[]).filter((s): s is string => typeof s === 'string')
          : [],
        skillRanks: migrateSkillRanks(rawUnit.skillRanks),
      };
      return [id, migratedUnit];
    })
  );

  // medals フィールドのマイグレーション（v1 データには medals が存在しない）
  const medals = typeof (parsed as Record<string, unknown>).medals === 'number'
    ? (parsed as Record<string, unknown>).medals as number
    : 0;

  const partial: Partial<GameState> = {
    gold: parsed.gold,
    medals,
    fragments: parsed.fragments,
    rebirthCount: parsed.rebirthCount,
    units: migratedUnits as GameState['units'],
    wave: parsed.wave,
    prophecyUpgrades: parsed.prophecyUpgrades,
    ...(parsed.stats ? { stats: parsed.stats } : {}),
  };

  return partial;
}

/**
 * セーブデータをlocalStorageから削除する
 */
export function resetSaveData(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // 無視
  }
}

/**
 * 音声設定をlocalStorageに保存する
 */
export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(AUDIO_SAVE_KEY, JSON.stringify(settings));
  } catch {
    // 無視
  }
}

/**
 * 音声設定をlocalStorageから読み込む
 */
export function loadAudioSettings(): AudioSettings | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(AUDIO_SAVE_KEY);
  } catch {
    return null;
  }

  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.isMuted !== 'boolean') return null;
  if (typeof obj.bgmVolume !== 'number') return null;
  if (typeof obj.seVolume !== 'number') return null;

  return {
    isMuted: obj.isMuted,
    bgmVolume: obj.bgmVolume,
    seVolume: obj.seVolume,
  };
}
