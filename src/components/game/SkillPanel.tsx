import { useGameStore } from '../../store/gameStore';
import { UNIT_DEFINITIONS, UNIT_IDS } from '../../constants/units';
import { PROPHECY_UPGRADES } from '../../constants/skills';
import { checkUnitUnlockCondition } from '../../utils/rebirth';
import { calcProphecyEffect, calcUnitAtk, calcDps } from '../../utils/combat';
import type { UnitId, UnitState, SkillDefinition, ProphecyEffectValues } from '../../types/game';

export function SkillPanel() {
  const gold = useGameStore((s) => s.gold);
  const units = useGameStore((s) => s.units);
  const selectedUnit = useGameStore((s) => s.selectedUnit);
  const setSelectedUnit = useGameStore((s) => s.setSelectedUnit);
  const buySkill = useGameStore((s) => s.buySkill);
  const prophecyUpgrades = useGameStore((s) => s.prophecyUpgrades);

  const prophecyEffect = calcProphecyEffect(prophecyUpgrades, PROPHECY_UPGRADES);
  const def = UNIT_DEFINITIONS[selectedUnit];
  const u = units[selectedUnit];

  return (
    <div>
      {/* Unit Selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {UNIT_IDS.filter((id: UnitId) =>
          checkUnitUnlockCondition(id, units, UNIT_DEFINITIONS[id].unlockCond)
        ).map((id: UnitId) => {
          const d = UNIT_DEFINITIONS[id];
          const isSelected = selectedUnit === id;
          return (
            <button
              key={id}
              style={{
                ...styles.btn,
                ...styles.btnSmall,
                ...(isSelected
                  ? { background: d.color, color: '#fff', borderColor: d.color }
                  : {}),
              }}
              onClick={() => setSelectedUnit(id)}
              aria-label={`${d.name}のスキルを表示`}
            >
              {d.emoji} {d.name}
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginBottom: 8,
          color: def.color,
          fontFamily: "'Crimson Text', serif",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {def.emoji} {def.name}のスキル
      </div>

      {def.skills.map((sk) => {
        const owned = u.unlockedSkills.includes(sk.id);
        return (
          <div
            key={sk.id}
            style={{ ...styles.skillCard, ...(owned ? styles.skillOwned : {}) }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: owned ? '#2ecc71' : '#ddd', fontSize: 14 }}>
                {owned ? '✅' : '🔒'} {sk.name}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{sk.desc}</div>
              {/* P3-9: 未習得スキルの習得後効果プレビュー */}
              {!owned && <SkillEffectPreview unitId={selectedUnit} unitState={u} skill={sk} prophecyEffect={prophecyEffect} />}
            </div>
            {!owned && (
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnSmall,
                  ...(gold >= sk.cost ? styles.btnPrimary : styles.btnDisabled),
                }}
                onClick={() => buySkill(selectedUnit, sk.id)}
                disabled={gold < sk.cost}
                aria-label={`スキル${sk.name}を習得 コスト${sk.cost}G`}
              >
                🪙{sk.cost}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// P3-9: 習得後効果プレビューコンポーネント
// ============================================================

type SkillEffectPreviewProps = {
  unitId: UnitId;
  unitState: UnitState;
  skill: SkillDefinition;
  prophecyEffect: ProphecyEffectValues;
};

function calcMerchantIncome(unitId: UnitId, unitState: UnitState): number {
  const def = UNIT_DEFINITIONS[unitId];
  const levelBonus = 1 + unitState.level * 0.1;
  const skillBonus = unitState.unlockedSkills.reduce((sum, skillId) => {
    const sk = def.skills.find((s) => s.id === skillId);
    return sum + (sk?.effect.goldBonus ?? 0);
  }, 0);
  return Math.floor(def.baseAtk * unitState.count * levelBonus * (1 + skillBonus));
}

function SkillEffectPreview({ unitId, unitState, skill, prophecyEffect }: SkillEffectPreviewProps) {
  const def = UNIT_DEFINITIONS[unitId];
  const afterState: UnitState = {
    ...unitState,
    unlockedSkills: [...unitState.unlockedSkills, skill.id],
  };

  if (def.target === 'passive') {
    // 商人: 収入プレビュー
    if (unitState.count === 0) return null;
    const before = calcMerchantIncome(unitId, unitState);
    const after = calcMerchantIncome(unitId, afterState);
    return (
      <div style={previewStyles.row}>
        <span style={previewStyles.label}>習得後: 収入</span>
        <span style={previewStyles.value}>
          {before}→{after} G/s
        </span>
      </div>
    );
  }

  // 通常兵種: ATK/DPS プレビュー
  const beforeAtk = calcUnitAtk(unitId, unitState, prophecyEffect);
  const afterAtk = calcUnitAtk(unitId, afterState, prophecyEffect);
  const beforeDps = calcDps(unitId, unitState, prophecyEffect);
  const afterDps = calcDps(unitId, afterState, prophecyEffect);
  const dpsPct = beforeDps > 0 ? Math.round(((afterDps - beforeDps) / beforeDps) * 100) : 0;

  return (
    <div style={previewStyles.row}>
      <span style={previewStyles.label}>習得後:</span>
      <span style={previewStyles.value}>ATK {beforeAtk}→{afterAtk}</span>
      <span style={previewStyles.sep}>|</span>
      <span style={previewStyles.value}>
        DPS {Math.floor(beforeDps)}→{Math.floor(afterDps)}
      </span>
      {dpsPct > 0 && (
        <span style={previewStyles.diff}>(+{dpsPct}%)</span>
      )}
    </div>
  );
}

const previewStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  label: {
    color: '#888',
  },
  value: {
    color: '#ccc',
  },
  sep: {
    color: '#555',
  },
  diff: {
    color: '#2ecc71',
    fontWeight: 700,
  },
};

const styles: Record<string, React.CSSProperties> = {
  skillCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '8px 10px',
    marginBottom: 6,
  },
  skillOwned: {
    border: '1px solid rgba(46,204,113,0.3)',
    background: 'rgba(46,204,113,0.05)',
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
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
