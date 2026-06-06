/**
 * UnitPanel の補助コンポーネント群
 * P1-1: 攻撃タイプバッジ
 * P1-2/P1-3: 雇用・LvUpプレビュー行
 * P2-4: スキル習得インジケーター
 * P2-5: 解放条件プログレスバー
 */

import type { UnitId, UnitState, AttackTarget, ProphecyEffectValues, UnitsState } from '../../types/game';
import { UNIT_DEFINITIONS } from '../../constants/units';
import { calcUnitAtk, calcDps } from '../../utils/combat';

// ============================================================
// P1-1: 攻撃タイプバッジ
// ============================================================

type AttackTargetBadgeProps = {
  target: AttackTarget;
};

const TARGET_LABELS: Record<AttackTarget, string> = {
  single: '単体',
  dual: '貫通2体',
  all: '全体',
  splash: '範囲',
  passive: '収入',
};

const TARGET_COLORS: Record<AttackTarget, string> = {
  single: '#e74c3c',
  dual: '#e67e22',
  all: '#3498db',
  splash: '#9b59b6',
  passive: '#f1c40f',
};

export function AttackTargetBadge({ target }: AttackTargetBadgeProps) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: TARGET_COLORS[target],
        background: `${TARGET_COLORS[target]}22`,
        border: `1px solid ${TARGET_COLORS[target]}66`,
        borderRadius: 4,
        padding: '1px 5px',
        marginLeft: 4,
        fontFamily: "'Georgia', serif",
        whiteSpace: 'nowrap',
      }}
    >
      {TARGET_LABELS[target]}
    </span>
  );
}

// ============================================================
// 共通スタイル（previewStyles + skillStyles を統合）
// ============================================================

const componentStyles: Record<string, React.CSSProperties> = {
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
  },
  label: {
    color: '#888',
  },
  value: {
    color: '#ccc',
  },
  sep: {
    color: '#555',
    margin: '0 1px',
  },
  diff: {
    color: '#2ecc71',
    fontWeight: 700,
  },
  skillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
    fontSize: 10,
  },
  skillLabel: {
    color: '#888',
    fontSize: 10,
    marginRight: 2,
  },
};

// ============================================================
// P1-2/P1-3: 雇用・LvUpプレビュー行（共通コンポーネント）
// ============================================================

function calcMerchantIncome(unitId: UnitId, unitState: UnitState): number {
  const def = UNIT_DEFINITIONS[unitId];
  const levelBonus = 1 + unitState.level * 0.1;
  const skillBonus = unitState.unlockedSkills.reduce((sum, skillId) => {
    const skill = def.skills.find((s) => s.id === skillId);
    return sum + (skill?.effect.goldBonus ?? 0);
  }, 0);
  return Math.floor(def.baseAtk * unitState.count * levelBonus * (1 + skillBonus));
}

type PreviewRowProps = {
  unitId: UnitId;
  unitState: UnitState;
  afterState: UnitState;
  prophecyEffect: ProphecyEffectValues;
};

function PreviewRow({ unitId, unitState, afterState, prophecyEffect }: PreviewRowProps) {
  const def = UNIT_DEFINITIONS[unitId];

  if (def.target === 'passive') {
    const before = calcMerchantIncome(unitId, unitState);
    const after = calcMerchantIncome(unitId, afterState);
    const diff = after - before;
    return (
      <div style={componentStyles.previewRow}>
        <span style={componentStyles.label}>収入</span>
        <span style={componentStyles.value}>
          {before}→{after}
          <span style={componentStyles.diff}> +{diff}G/s</span>
        </span>
      </div>
    );
  }

  const beforeAtk = unitState.count > 0 ? calcUnitAtk(unitId, unitState, prophecyEffect) : 0;
  const afterAtk = calcUnitAtk(unitId, afterState, prophecyEffect);
  const beforeDps = unitState.count > 0 ? calcDps(unitId, unitState, prophecyEffect) : 0;
  const afterDps = calcDps(unitId, afterState, prophecyEffect);
  const dpsDiff = afterDps - beforeDps;

  return (
    <div style={componentStyles.previewRow}>
      <span style={componentStyles.label}>ATK</span>
      <span style={componentStyles.value}>
        {beforeAtk}→{afterAtk}
      </span>
      <span style={componentStyles.sep}>|</span>
      <span style={componentStyles.label}>DPS</span>
      <span style={componentStyles.value}>
        {Math.floor(beforeDps)}→{Math.floor(afterDps)}
        {dpsDiff > 0 && (
          <span style={componentStyles.diff}> +{Math.floor(dpsDiff)}</span>
        )}
      </span>
    </div>
  );
}

type BuyPreviewProps = {
  unitId: UnitId;
  unitState: UnitState;
  prophecyEffect: ProphecyEffectValues;
};

/** 雇用後のプレビュー行 */
export function BuyPreview({ unitId, unitState, prophecyEffect }: BuyPreviewProps) {
  const afterState: UnitState = { ...unitState, count: unitState.count + 1 };
  return <PreviewRow unitId={unitId} unitState={unitState} afterState={afterState} prophecyEffect={prophecyEffect} />;
}

type LvUpPreviewProps = {
  unitId: UnitId;
  unitState: UnitState;
  prophecyEffect: ProphecyEffectValues;
};

/** LvUp後のプレビュー行 */
export function LvUpPreview({ unitId, unitState, prophecyEffect }: LvUpPreviewProps) {
  const afterState: UnitState = { ...unitState, level: unitState.level + 1 };
  return <PreviewRow unitId={unitId} unitState={unitState} afterState={afterState} prophecyEffect={prophecyEffect} />;
}

// ============================================================
// P2-4: スキル習得インジケーター
// ============================================================

type SkillIndicatorProps = {
  unitId: UnitId;
  unitState: UnitState;
};

export function SkillIndicator({ unitId, unitState }: SkillIndicatorProps) {
  const def = UNIT_DEFINITIONS[unitId];
  const allUnlocked = def.skills.every((s) => unitState.unlockedSkills.includes(s.id));

  if (allUnlocked && def.skills.length > 0) {
    return (
      <div style={componentStyles.skillRow}>
        <span style={componentStyles.skillLabel}>スキル:</span>
        <span style={{ fontSize: 11, marginLeft: 2 }}>✨ 完全習得</span>
      </div>
    );
  }

  return (
    <div style={componentStyles.skillRow}>
      <span style={componentStyles.skillLabel}>スキル:</span>
      {def.skills.map((skill) => (
        <span key={skill.id} style={{ fontSize: 11 }}>
          {unitState.unlockedSkills.includes(skill.id) ? '✅' : '🔒'}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// P2-5: 解放条件プログレスバー
// ============================================================

type UnlockProgressProps = {
  unitId: UnitId;
  units: UnitsState;
};

export function UnlockProgress({ unitId, units }: UnlockProgressProps) {
  const def = UNIT_DEFINITIONS[unitId];
  if (!def.unlockCond) return null;

  const entries = Object.entries(def.unlockCond) as [UnitId, number][];

  return (
    <div style={progressStyles.container}>
      {entries.map(([reqId, reqLv]) => {
        const currentLv = units[reqId]?.level ?? 0;
        const pct = Math.min(100, (currentLv / reqLv) * 100);
        const done = currentLv >= reqLv;
        const reqDef = UNIT_DEFINITIONS[reqId];

        return (
          <div key={reqId} style={progressStyles.row}>
            <span style={{ fontSize: 10, color: done ? '#2ecc71' : '#aaa', minWidth: 60 }}>
              {done ? '✅' : reqDef.emoji} {reqDef.name} {currentLv}/{reqLv}
            </span>
            <div style={progressStyles.barBg}>
              <div
                style={{
                  ...progressStyles.barFill,
                  width: `${pct}%`,
                  background: done ? '#2ecc71' : '#c19a6b',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const progressStyles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  barBg: {
    flex: 1,
    height: 5,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    minWidth: 60,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
};
