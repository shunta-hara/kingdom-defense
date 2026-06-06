import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { UNIT_DEFINITIONS, UNIT_IDS } from '../constants/units';
import { PROPHECY_UPGRADES } from '../constants/skills';
import { calcProphecyEffect, calcUnitAtk, calcUnitInterval, calcSplashDamages } from '../utils/combat';
import { calcEnemyReward, calcWaveClearBonus } from '../utils/wave';

export function useGameLoop(): void {
  const storeRef = useRef(useGameStore.getState());

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      storeRef.current = state;
    });
  }, []);

  // 1秒ごとのWaveタイマー
  useEffect(() => {
    const t = setInterval(() => {
      useGameStore.getState().tickWaveTimer();
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // 商人の定期収入（1秒ごと）
  useEffect(() => {
    const t = setInterval(() => {
      const state = useGameStore.getState();
      const merchantUnit = state.units['merchant'];
      if (!merchantUnit || merchantUnit.count === 0) return;
      const income = calcMerchantIncome(merchantUnit);
      if (income <= 0) return;
      const earned = Math.floor(income);
      useGameStore.getState().addGold(earned);
      useGameStore.getState().addFloat(`+${earned}G`, '#f1c40f', 30, 60);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // コンボタイムアウト監視（200ms精度）
  useEffect(() => {
    const t = setInterval(() => {
      const { comboCount, lastClickTime } = useGameStore.getState();
      if (comboCount > 0 && Date.now() - lastClickTime >= 2000) {
        useGameStore.setState({ comboCount: 0, comboMultiplier: 1.0 });
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setInterval>[] = [];

    for (const unitId of UNIT_IDS) {
      const tick = () => {
        const def = UNIT_DEFINITIONS[unitId];
        if (def.target === 'passive') return;

        const state = storeRef.current;
        const { waveActive, enemies, units } = state;
        if (!waveActive || enemies.length === 0 || units[unitId].count === 0) return;

        const prophecyEffect = calcProphecyEffect(state.prophecyUpgrades, PROPHECY_UPGRADES);
        const atk = calcUnitAtk(unitId, units[unitId], prophecyEffect);
        if (atk === 0) return;

        // 攻撃アニメーション用フラグをセット
        useGameStore.getState().setAttackingUnitId(unitId);

        // シーフ（paladin）は撃破ゴールドにボーナス倍率を適用
        const goldMultiplier = unitId === 'paladin'
          ? calcThiefGoldMultiplier(state.units[unitId])
          : 1;

        // 攻撃処理をストアに反映
        applyAttack(atk, def.target, state.wave, goldMultiplier);
      };

      // 初期インターバルで設定（動的インターバル変更はstoreRef経由で対応）
      const state = storeRef.current;
      const prophecyEffect = calcProphecyEffect(state.prophecyUpgrades, PROPHECY_UPGRADES);
      const interval = calcUnitInterval(
        unitId,
        state.units[unitId],
        prophecyEffect
      );

      const t = setInterval(tick, interval);
      timers.push(t);
    }

    return () => {
      for (const t of timers) clearInterval(t);
    };
  }, []); // マウント時に一度だけ設定
}

function calcMerchantIncome(unit: { count: number; level: number; unlockedSkills: string[] }): number {
  const def = UNIT_DEFINITIONS.merchant;
  const levelBonus = 1 + unit.level * 0.1;
  const skillBonus = unit.unlockedSkills.reduce((sum, skillId) => {
    const skill = def.skills.find((s) => s.id === skillId);
    return sum + (skill?.effect.goldBonus ?? 0);
  }, 0);
  return def.baseAtk * unit.count * levelBonus * (1 + skillBonus);
}

function calcThiefGoldMultiplier(unit: { count: number; unlockedSkills: string[] }): number {
  const baseBonus = unit.count * 0.1;
  const skillBonus = unit.unlockedSkills.reduce((sum, skillId) => {
    const skill = UNIT_DEFINITIONS.paladin.skills.find((s) => s.id === skillId);
    return sum + (skill?.effect.goldBonus ?? 0);
  }, 0);
  return 1 + baseBonus + skillBonus;
}

function applyAttack(
  atk: number,
  target: 'single' | 'dual' | 'all' | 'splash',
  wave: number,
  goldMultiplier = 1
): void {
  const store = useGameStore.getState();
  const { enemies } = store;

  if (enemies.length === 0) return;

  let updatedEnemies = [...enemies];

  if (target === 'single') {
    updatedEnemies[0] = { ...updatedEnemies[0], hp: updatedEnemies[0].hp - atk };
  } else if (target === 'dual') {
    updatedEnemies = updatedEnemies.map((e, i) =>
      i < 2 ? { ...e, hp: e.hp - atk } : e
    );
  } else if (target === 'splash') {
    const splashDmgs = calcSplashDamages(atk, updatedEnemies.length);
    updatedEnemies = updatedEnemies.map((e, i) => ({ ...e, hp: e.hp - splashDmgs[i] }));
  } else {
    // target === 'all'
    updatedEnemies = updatedEnemies.map((e) => ({ ...e, hp: e.hp - atk }));
  }

  const dead = updatedEnemies.filter((e) => e.hp <= 0);
  const alive = updatedEnemies.filter((e) => e.hp > 0);
  const reward = calcEnemyReward(wave);

  if (dead.length > 0) {
    const goldFromKills = Math.floor(dead.length * reward * goldMultiplier);
    store.addGold(goldFromKills);
    store.addFloat(`+${goldFromKills}G`, goldMultiplier > 1 ? '#f1c40f' : '#2ecc71', 70, 30);
    store.addKills(dead.length);
  }

  if (alive.length === 0 && enemies.length > 0) {
    // Wave クリア
    setTimeout(() => {
      const currentStore = useGameStore.getState();
      const bonus = calcWaveClearBonus(currentStore.wave);
      currentStore.addGold(bonus);
      currentStore.addLog(`🎉 Wave ${currentStore.wave} クリア！ボーナス +${bonus}G`);
      useGameStore.setState((s) => ({
        wave: s.wave + 1,
        waveActive: false,
        waveTimeLeft: 10,
        enemies: [],
        waveCleared: true,
        stats: {
          ...s.stats,
          bestWave: Math.max(s.stats.bestWave, s.wave + 1),
        },
      }));
      // 5秒後に次のWaveを自動開始
      setTimeout(() => {
        useGameStore.getState().startWave();
      }, 5000);
    }, 100);
  } else {
    useGameStore.setState({ enemies: alive });
  }
}
