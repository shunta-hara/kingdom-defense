import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGame, loadGame, resetSaveData, SAVE_KEY } from '../saveManager';
import type { GameState, GameStats } from '../../types/game';
import { SAVE_VERSION } from '../../types/game';
import { createInitialUnits } from '../../utils/rebirth';

// ---- localStorage mock ----

type LocalStorageMock = {
  getItem: ReturnType<typeof vi.fn> & ((key: string) => string | null);
  setItem: ReturnType<typeof vi.fn> & ((key: string, value: string) => void);
  removeItem: ReturnType<typeof vi.fn> & ((key: string) => void);
  clear: ReturnType<typeof vi.fn> & (() => void);
};

function createLocalStorageMock(): LocalStorageMock {
  const store: Record<string, string> = {};
  const mock = {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => { store[key] = value; }),
    removeItem: vi.fn((key: string): void => { delete store[key]; }),
    clear: vi.fn((): void => { Object.keys(store).forEach((k) => delete store[k]); }),
  };
  return mock as LocalStorageMock;
}

let localStorageMock: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  localStorageMock = createLocalStorageMock();
  vi.stubGlobal('localStorage', localStorageMock);
});

// ---- Helpers ----

const initialStats: GameStats = {
  totalPlayTime: 0,
  totalClicks: 0,
  bestWave: 1,
  rebirthCount: 0,
  totalKills: 0,
  unlockedAchievements: [],
};

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    gold: 100,
    medals: 0,
    fragments: 5,
    rebirthCount: 0,
    units: createInitialUnits(),
    enemies: [],
    wave: 3,
    waveActive: false,
    waveCleared: false,
    waveTimeLeft: 10,
    selectedUnit: 'swordsman',
    activeTab: 'units',
    prophecyUpgrades: ['atk-up-1'],
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
    comboCount: 0,
    comboMultiplier: 1.0,
    lastClickTime: 0,
    particlesEnabled: true,
    ...overrides,
  };
}

// ============================================================
// 正常系テスト
// ============================================================

describe('saveGame', () => {
  it('localStorageにセーブデータを書き込む', () => {
    const state = makeGameState();
    saveGame(state);

    expect(localStorageMock.setItem).toHaveBeenCalledOnce();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(SAVE_KEY, expect.any(String));
  });

  it('保存データにversionフィールドが含まれる', () => {
    const state = makeGameState();
    saveGame(state);

    const raw = localStorageMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.version).toBe(SAVE_VERSION);
  });

  it('保存データにsavedAtフィールドが含まれる', () => {
    const state = makeGameState();
    saveGame(state);

    const raw = localStorageMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(typeof parsed.savedAt).toBe('string');
    expect(parsed.savedAt).not.toBe('');
  });

  it('gold, fragments, wave, prophecyUpgradesが正しく保存される', () => {
    const state = makeGameState({ gold: 999, fragments: 42, wave: 10 });
    saveGame(state);

    const raw = localStorageMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.gold).toBe(999);
    expect(parsed.fragments).toBe(42);
    expect(parsed.wave).toBe(10);
    expect(parsed.prophecyUpgrades).toEqual(['atk-up-1']);
  });
});

describe('loadGame (正常系)', () => {
  it('保存したデータを正しく読み込める', () => {
    const state = makeGameState({ gold: 500, wave: 7 });
    saveGame(state);

    // getItemがsetItemで保存した値を返すように設定
    const savedRaw = localStorageMock.setItem.mock.calls[0][1] as string;
    localStorageMock.getItem.mockReturnValue(savedRaw);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.gold).toBe(500);
    expect(loaded?.wave).toBe(7);
  });

  it('prophecyUpgradesが正しく復元される', () => {
    const state = makeGameState({ prophecyUpgrades: ['atk-up-1', 'atk-up-2'] });
    saveGame(state);

    const savedRaw = localStorageMock.setItem.mock.calls[0][1] as string;
    localStorageMock.getItem.mockReturnValue(savedRaw);

    const loaded = loadGame();
    expect(loaded?.prophecyUpgrades).toEqual(['atk-up-1', 'atk-up-2']);
  });
});

describe('resetSaveData', () => {
  it('localStorageからセーブキーを削除する', () => {
    resetSaveData();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(SAVE_KEY);
  });
});

// ============================================================
// 異常系テスト
// ============================================================

describe('loadGame (異常系)', () => {
  it('localStorageが空のときnullを返す', () => {
    localStorageMock.getItem.mockReturnValue(null);
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('JSONが破損しているときnullを返す', () => {
    localStorageMock.getItem.mockReturnValue('{ broken json :::');
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('不正なオブジェクト（フィールド欠落）のときnullを返す', () => {
    const invalid = JSON.stringify({ version: SAVE_VERSION, gold: 100 }); // 必須フィールド欠落
    localStorageMock.getItem.mockReturnValue(invalid);
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('バージョンが異なるときnullを返す', () => {
    const oldData = JSON.stringify({
      version: 0, // 旧バージョン
      savedAt: '2024-01-01T00:00:00Z',
      gold: 100,
      fragments: 0,
      rebirthCount: 0,
      units: createInitialUnits(),
      wave: 1,
      prophecyUpgrades: [],
    });
    localStorageMock.getItem.mockReturnValue(oldData);
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('null値が渡されたときnullを返す', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(null));
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('配列が渡されたときnullを返す', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1, 2, 3]));
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('文字列が渡されたときnullを返す', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('not an object'));
    const result = loadGame();
    expect(result).toBeNull();
  });

  it('localStorageのgetItemが例外をスローしてもnullを返す', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    const result = loadGame();
    expect(result).toBeNull();
  });
});

describe('saveGame (異常系)', () => {
  it('localStorageのsetItemが例外をスローしてもクラッシュしない', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const state = makeGameState();
    expect(() => saveGame(state)).not.toThrow();
  });
});

describe('resetSaveData (異常系)', () => {
  it('localStorageのremoveItemが例外をスローしてもクラッシュしない', () => {
    localStorageMock.removeItem.mockImplementation(() => {
      throw new Error('removeItem error');
    });
    expect(() => resetSaveData()).not.toThrow();
  });
});

// ============================================================
// 境界値テスト
// ============================================================

describe('境界値テスト', () => {
  it('gold=0、wave=1、prophecyUpgrades=[] の初期状態を保存・復元できる', () => {
    const state = makeGameState({ gold: 0, wave: 1, prophecyUpgrades: [] });
    saveGame(state);

    const savedRaw = localStorageMock.setItem.mock.calls[0][1] as string;
    localStorageMock.getItem.mockReturnValue(savedRaw);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.gold).toBe(0);
    expect(loaded?.wave).toBe(1);
    expect(loaded?.prophecyUpgrades).toEqual([]);
  });

  it('非常に大きなgold値を保存・復元できる', () => {
    const state = makeGameState({ gold: Number.MAX_SAFE_INTEGER });
    saveGame(state);

    const savedRaw = localStorageMock.setItem.mock.calls[0][1] as string;
    localStorageMock.getItem.mockReturnValue(savedRaw);

    const loaded = loadGame();
    expect(loaded?.gold).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('prophecyUpgradesが多数あっても保存・復元できる', () => {
    const upgrades = Array.from({ length: 50 }, (_, i) => `upgrade-${i}`);
    const state = makeGameState({ prophecyUpgrades: upgrades });
    saveGame(state);

    const savedRaw = localStorageMock.setItem.mock.calls[0][1] as string;
    localStorageMock.getItem.mockReturnValue(savedRaw);

    const loaded = loadGame();
    expect(loaded?.prophecyUpgrades).toHaveLength(50);
    expect(loaded?.prophecyUpgrades).toEqual(upgrades);
  });

  it('空文字列のJSONキーでもnullを返す', () => {
    localStorageMock.getItem.mockReturnValue('');
    const result = loadGame();
    expect(result).toBeNull();
  });
});

// ============================================================
// メダル (medals) の保存・復元テスト
// ============================================================

describe('medals フィールドの保存・復元', () => {
  it('正常系: medals値が正しく保存される', () => {
    const state = makeGameState({ medals: 42 });
    saveGame(state);

    const raw = localStorageMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.medals).toBe(42);
  });

  it('正常系: medals値が正しく復元される', () => {
    const state = makeGameState({ medals: 15 });
    saveGame(state);

    const savedRaw = localStorageMock.setItem.mock.calls[0][1] as string;
    localStorageMock.getItem.mockReturnValue(savedRaw);

    const loaded = loadGame();
    expect(loaded?.medals).toBe(15);
  });

  it('正常系: medals=0の場合も正しく保存・復元される', () => {
    const state = makeGameState({ medals: 0 });
    saveGame(state);

    const savedRaw = localStorageMock.setItem.mock.calls[0][1] as string;
    localStorageMock.getItem.mockReturnValue(savedRaw);

    const loaded = loadGame();
    expect(loaded?.medals).toBe(0);
  });
});

// ============================================================
// マイグレーションテスト（v1 → v2）
// ============================================================

describe('loadGame マイグレーション (v1 → v2)', () => {
  it('正常系: v1データ（medalsなし）はmedals=0でマイグレーションされる', () => {
    const v1Data = JSON.stringify({
      version: 1,
      savedAt: '2024-01-01T00:00:00Z',
      gold: 200,
      fragments: 3,
      rebirthCount: 0,
      units: createInitialUnits(),
      wave: 5,
      prophecyUpgrades: ['p_gold'],
      // medals フィールドなし
    });
    localStorageMock.getItem.mockReturnValue(v1Data);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.gold).toBe(200);
    expect(loaded?.medals).toBe(0); // マイグレーションでデフォルト0
  });

  it('正常系: v1データの skillRanks なし UnitState は {} でマイグレーションされる', () => {
    const units = createInitialUnits();
    // v1データ: skillRanks フィールドなし（旧フォーマット）
    const v1Units = Object.fromEntries(
      Object.entries(units).map(([id, u]) => [
        id,
        { level: u.level, count: u.count, unlockedSkills: u.unlockedSkills },
        // skillRanks を意図的に含めない
      ])
    );
    const v1Data = JSON.stringify({
      version: 1,
      savedAt: '2024-01-01T00:00:00Z',
      gold: 0,
      fragments: 0,
      rebirthCount: 0,
      units: v1Units,
      wave: 1,
      prophecyUpgrades: [],
    });
    localStorageMock.getItem.mockReturnValue(v1Data);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.units?.swordsman.skillRanks).toEqual({});
  });

  it('正常系: v2データのskillRanksが正しく復元される', () => {
    const units = createInitialUnits();
    units.swordsman = {
      ...units.swordsman,
      unlockedSkills: ['sw_edge'],
      skillRanks: { sw_edge: 2 },
    };
    const v2Data = JSON.stringify({
      version: 2,
      savedAt: '2024-01-01T00:00:00Z',
      gold: 0,
      medals: 10,
      fragments: 0,
      rebirthCount: 0,
      units,
      wave: 1,
      prophecyUpgrades: [],
    });
    localStorageMock.getItem.mockReturnValue(v2Data);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.units?.swordsman.skillRanks).toEqual({ sw_edge: 2 });
    expect(loaded?.medals).toBe(10);
  });

  it('異常系: v0データはnullを返す（未対応バージョン）', () => {
    const v0Data = JSON.stringify({
      version: 0,
      savedAt: '2024-01-01T00:00:00Z',
      gold: 100,
      fragments: 0,
      rebirthCount: 0,
      units: createInitialUnits(),
      wave: 1,
      prophecyUpgrades: [],
    });
    localStorageMock.getItem.mockReturnValue(v0Data);

    const result = loadGame();
    expect(result).toBeNull();
  });

  it('異常系: v3以降のデータはnullを返す（未対応バージョン）', () => {
    const futureData = JSON.stringify({
      version: 3,
      savedAt: '2024-01-01T00:00:00Z',
      gold: 100,
      medals: 5,
      fragments: 0,
      rebirthCount: 0,
      units: createInitialUnits(),
      wave: 1,
      prophecyUpgrades: [],
    });
    localStorageMock.getItem.mockReturnValue(futureData);

    const result = loadGame();
    expect(result).toBeNull();
  });
});
