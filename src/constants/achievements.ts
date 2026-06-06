import type { AchievementDefinition } from '../types/game';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'ach_wave5',
    name: '王城の守護者',
    desc: '初めてWave 5を突破する',
    icon: '🏰',
  },
  {
    id: 'ach_all_basic',
    name: '精鋭部隊',
    desc: '全4種の基本兵士を雇用する',
    icon: '⚔️',
  },
  {
    id: 'ach_first_rebirth',
    name: '夢の始まり',
    desc: '初めて転生する',
    icon: '🌙',
  },
  {
    id: 'ach_100clicks',
    name: '百の夢',
    desc: '100回クリックする',
    icon: '✨',
  },
  {
    id: 'ach_dragoon',
    name: '竜の目覚め',
    desc: '竜騎士を解放する',
    icon: '🐉',
  },
  {
    id: 'ach_wave10',
    name: '夢の探求者',
    desc: 'Wave 10を突破する',
    icon: '🔭',
  },
  {
    id: 'ach_wave20',
    name: '不屈の城主',
    desc: 'Wave 20を突破する',
    icon: '🛡️',
  },
  {
    id: 'ach_all_prophecy',
    name: '予知の達人',
    desc: '全5種の予知強化を購入する',
    icon: '🔮',
  },
  {
    id: 'ach_swordmaster',
    name: '魔剣の継承',
    desc: '魔剣士を解放する',
    icon: '⚡',
  },
  {
    id: 'ach_1000kills',
    name: '勝利の記憶',
    desc: '累計1000体の敵を撃破する',
    icon: '💀',
  },
];

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((a) => a.id);
