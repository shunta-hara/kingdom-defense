import type { ProphecyUpgradeDefinition } from '../types/game';

export const PROPHECY_UPGRADES: ProphecyUpgradeDefinition[] = [
  {
    id: 'p_gold',
    name: '予知：黄金の時代',
    desc: 'クリック金貨+100%',
    cost: 2,
    effect: { clickBonus: 1.0 },
  },
  {
    id: 'p_start',
    name: '予知：早熟の才',
    desc: '全兵種の初期攻撃力+30%',
    cost: 4,
    effect: { globalAtk: 0.3 },
  },
  {
    id: 'p_speed',
    name: '予知：疾風の記憶',
    desc: '全兵種の攻撃間隔-15%',
    cost: 6,
    effect: { globalInterval: -0.15 },
  },
  {
    id: 'p_cost',
    name: '予知：節約の智恵',
    desc: '全兵種のコスト-25%',
    cost: 8,
    effect: { costReduction: 0.25 },
  },
  {
    id: 'p_power',
    name: '予知：英雄の血脈',
    desc: '全兵種の攻撃力+60%',
    cost: 12,
    effect: { globalAtk: 0.6 },
  },
];
