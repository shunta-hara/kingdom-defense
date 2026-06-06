import { useGameStore } from '../../store/gameStore';
import { UNIT_DEFINITIONS, UNIT_IDS } from '../../constants/units';
import { PROPHECY_UPGRADES } from '../../constants/skills';
import { calcProphecyEffect, calcUnitAtk, calcUnitInterval, calcUnitCost, calcLevelUpCost } from '../../utils/combat';
import { checkUnitUnlockCondition } from '../../utils/rebirth';
import type { UnitId } from '../../types/game';
import { DpsBadge } from './DpsPanel';
import {
  AttackTargetBadge,
  BuyPreview,
  LvUpPreview,
  SkillIndicator,
  UnlockProgress,
} from './UnitPanelParts';
import { SkillSummary } from './SkillSummary';

export function UnitPanel() {
  const gold = useGameStore((s) => s.gold);
  const units = useGameStore((s) => s.units);
  const selectedUnit = useGameStore((s) => s.selectedUnit);
  const prophecyUpgrades = useGameStore((s) => s.prophecyUpgrades);
  const setSelectedUnit = useGameStore((s) => s.setSelectedUnit);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const buyUnit = useGameStore((s) => s.buyUnit);
  const levelUpUnit = useGameStore((s) => s.levelUpUnit);

  const prophecyEffect = calcProphecyEffect(prophecyUpgrades, PROPHECY_UPGRADES);

  return (
    <div>
      {UNIT_IDS.map((id: UnitId) => {
        const def = UNIT_DEFINITIONS[id];
        const u = units[id];
        const unlocked = checkUnitUnlockCondition(id, units, def.unlockCond);
        const cost = calcUnitCost(id, u, prophecyEffect);
        const lvCost = calcLevelUpCost(id, u);
        const atk = calcUnitAtk(id, u, prophecyEffect);
        const interval = calcUnitInterval(id, u, prophecyEffect);

        const unlockCondText = def.unlockCond
          ? Object.entries(def.unlockCond)
              .map(([k, v]) => `${UNIT_DEFINITIONS[k as UnitId].name}Lv${v}`)
              .join('+')
          : '';

        return (
          <div
            key={id}
            style={{
              ...styles.unitCard,
              ...(selectedUnit === id ? styles.unitCardSelected : {}),
              ...(!unlocked ? styles.unitCardLocked : {}),
            }}
            onClick={() => unlocked && setSelectedUnit(id)}
          >
            {/* ヘッダー行 */}
            <div style={styles.unitHeader}>
              <span style={{ fontSize: 22 }}>{def.emoji}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: def.color,
                    fontFamily: "'Crimson Text', serif",
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  {def.name}{' '}
                  <span style={{ color: '#888', fontWeight: 400, fontSize: 12 }}>×{u.count}</span>
                  {u.level > 0 && (
                    <span style={{ color: '#f1c40f', fontSize: 11, marginLeft: 4 }}>
                      Lv{u.level}
                    </span>
                  )}
                  {/* P1-1: 攻撃タイプバッジ */}
                  <AttackTargetBadge target={def.target} />
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  {unlocked ? def.desc : unlockCondText ? `解放条件: ${unlockCondText}` : ''}
                </div>
              </div>
              {unlocked && u.count > 0 && (
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>
                  <div>ATK: {atk}</div>
                  <div>{(interval / 1000).toFixed(1)}s</div>
                </div>
              )}
            </div>

            {/* P2-4: スキル習得インジケーター（count > 0 の兵種のみ） */}
            {unlocked && u.count > 0 && (
              <SkillIndicator unitId={id} unitState={u} />
            )}

            {/* P3-8: スキルサマリー（count > 0 かつスキルあり） */}
            {unlocked && u.count > 0 && (
              <SkillSummary
                unitId={id}
                unitState={u}
                onNavigate={() => {
                  setSelectedUnit(id);
                  setActiveTab('skills');
                }}
              />
            )}

            {/* P2-5: 解放条件プログレスバー（未解放 + unlockCond あり） */}
            {!unlocked && def.unlockCond && (
              <UnlockProgress unitId={id} units={units} />
            )}

            {/* アクション行 */}
            {unlocked && (
              <div style={styles.unitActions}>
                {/* 雇用ボタン + プレビュー */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    style={{
                      ...styles.btn,
                      ...styles.btnSmall,
                      ...(gold >= cost ? styles.btnPrimary : styles.btnDisabled),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      buyUnit(id);
                    }}
                    disabled={gold < cost}
                    aria-label={`${def.name}を雇用 コスト${cost}G`}
                  >
                    雇用 🪙{cost}
                  </button>
                  {/* P1-2/P1-3: 雇用後プレビュー */}
                  <BuyPreview unitId={id} unitState={u} prophecyEffect={prophecyEffect} />
                  <DpsBadge unitId={id} />
                </div>

                {/* LvUpボタン + プレビュー */}
                {u.count > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      style={{
                        ...styles.btn,
                        ...styles.btnSmall,
                        ...(gold >= lvCost ? styles.btnLevel : styles.btnDisabled),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        levelUpUnit(id);
                      }}
                      disabled={gold < lvCost}
                      aria-label={`${def.name}をレベルアップ コスト${lvCost}G`}
                    >
                      Lv↑ 🪙{lvCost}
                    </button>
                    {/* P1-2/P1-3: LvUp後プレビュー */}
                    <LvUpPreview unitId={id} unitState={u} prophecyEffect={prophecyEffect} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  unitCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '8px 10px',
    marginBottom: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  unitCardSelected: {
    border: '1px solid rgba(193,154,107,0.5)',
    background: 'rgba(193,154,107,0.08)',
  },
  unitCardLocked: {
    opacity: 0.5,
    cursor: 'default',
    filter: 'grayscale(0.5)',
  },
  unitHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  unitActions: {
    display: 'flex',
    gap: 6,
    marginTop: 6,
    alignItems: 'flex-start',
  },
  btn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#ccc',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
    fontSize: 12,
    transition: 'all 0.15s',
    minHeight: 44,
  },
  btnSmall: {
    padding: '4px 8px',
    fontSize: 11,
    minHeight: 44,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #c19a6b, #a07850)',
    border: '1px solid #c19a6b',
    color: '#fff',
  },
  btnLevel: {
    background: 'linear-gradient(135deg, #2980b9, #1a5276)',
    border: '1px solid #3498db',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
