import { describe, it, expect } from 'vitest';
import {
  calcNewComboCount,
  calcComboMultiplier,
  COMBO_TIMEOUT_MS,
} from '../combo';

describe('calcNewComboCount', () => {
  it('コンボ継続: 2秒以内のクリックでカウントが増加する', () => {
    const now = 10000;
    const lastClickTime = 9000; // 1秒前
    const result = calcNewComboCount(3, lastClickTime, now);
    expect(result).toBe(4);
  });

  it('コンボ継続: ちょうど2秒以内（境界値）でカウントが増加する', () => {
    const now = 10000;
    const lastClickTime = now - COMBO_TIMEOUT_MS; // ぴったり2秒前
    const result = calcNewComboCount(5, lastClickTime, now);
    expect(result).toBe(6);
  });

  it('コンボリセット: 2秒を超えた場合はカウントが0にリセットされる', () => {
    const now = 10000;
    const lastClickTime = 7000; // 3秒前（2秒超過）
    const result = calcNewComboCount(5, lastClickTime, now);
    expect(result).toBe(0);
  });

  it('コンボリセット: lastClickTimeが0（初回クリック）はリセット扱い', () => {
    const result = calcNewComboCount(0, 0, 10000);
    // 0から10000ms経過なのでリセット(0)
    expect(result).toBe(0);
  });

  it('コンボ開始: リセット後の次クリックはコンボ1から始まる', () => {
    const now = 20000;
    const lastClickTime = 19500; // 500ms前
    // 前回がリセットされてcomboCount=0だったとしても
    const result = calcNewComboCount(0, lastClickTime, now);
    expect(result).toBe(1);
  });
});

describe('calcComboMultiplier', () => {
  it('コンボ0のとき倍率は1.0', () => {
    expect(calcComboMultiplier(0)).toBe(1.0);
  });

  it('コンボ1のとき倍率は1.2', () => {
    expect(calcComboMultiplier(1)).toBeCloseTo(1.2);
  });

  it('コンボ5のとき倍率は2.0', () => {
    expect(calcComboMultiplier(5)).toBeCloseTo(2.0);
  });

  it('コンボ10のとき倍率は3.0', () => {
    expect(calcComboMultiplier(10)).toBeCloseTo(3.0);
  });

  it('コンボ20のとき倍率は5.0（上限）', () => {
    expect(calcComboMultiplier(20)).toBe(5.0);
  });

  it('コンボ50のとき倍率は上限5.0を超えない', () => {
    expect(calcComboMultiplier(50)).toBe(5.0);
  });

  it('コンボ100のとき倍率は上限5.0を超えない', () => {
    expect(calcComboMultiplier(100)).toBe(5.0);
  });

  it('コンボ19のとき倍率は4.8（上限未満）', () => {
    expect(calcComboMultiplier(19)).toBeCloseTo(4.8);
  });
});

describe('コンボシステム統合ロジック', () => {
  it('連続クリックでコンボが積み上がり倍率が増加する', () => {
    let comboCount = 0;
    let lastClickTime = 0;
    const now = 1000;

    // 5回連続クリック（各500ms間隔）
    // i=0: elapsed=1000ms(<=2s) → count=1
    // i=1: elapsed=500ms → count=2
    // i=2: elapsed=500ms → count=3
    // i=3: elapsed=500ms → count=4
    // i=4: elapsed=500ms → count=5
    for (let i = 0; i < 5; i++) {
      const clickTime = now + i * 500;
      comboCount = calcNewComboCount(comboCount, lastClickTime, clickTime);
      lastClickTime = clickTime;
    }

    expect(comboCount).toBe(5);
    expect(calcComboMultiplier(comboCount)).toBeCloseTo(2.0);
  });

  it('2秒間隔を置くとコンボがリセットされる', () => {
    let comboCount = 10; // コンボ10の状態から
    const lastClickTime = 5000;
    const laterClick = lastClickTime + 3000; // 3秒後

    comboCount = calcNewComboCount(comboCount, lastClickTime, laterClick);
    expect(comboCount).toBe(0);
    expect(calcComboMultiplier(comboCount)).toBe(1.0);
  });
});
