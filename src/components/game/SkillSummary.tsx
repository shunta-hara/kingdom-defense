/**
 * P3-8: カード内スキルサマリー
 * count > 0 かつスキルが1個以上ある兵種のカードに表示する
 * クリックで SkillPanel に遷移する
 */

import type { UnitId, UnitState } from '../../types/game';
import { UNIT_DEFINITIONS } from '../../constants/units';

type SkillSummaryProps = {
  unitId: UnitId;
  unitState: UnitState;
  onNavigate: () => void;
};

export function SkillSummary({ unitId, unitState, onNavigate }: SkillSummaryProps) {
  const def = UNIT_DEFINITIONS[unitId];

  if (def.skills.length === 0) return null;
  if (unitState.count === 0) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      style={styles.container}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onNavigate();
        }
      }}
      aria-label={`${def.name}のスキルパネルを開く`}
      title="クリックでスキルパネルへ"
    >
      <span style={styles.label}>スキル:</span>
      <div style={styles.badges}>
        {def.skills.map((sk) => {
          const owned = unitState.unlockedSkills.includes(sk.id);
          return owned ? (
            <span key={sk.id} style={styles.ownedBadge}>
              ✅ {sk.name}
            </span>
          ) : (
            <span key={sk.id} style={styles.lockedBadge}>
              🔒 {sk.name} 🪙{sk.cost}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    padding: '3px 6px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontSize: 10,
  },
  label: {
    color: '#888',
    fontSize: 10,
    flexShrink: 0,
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  ownedBadge: {
    color: '#2ecc71',
    background: 'rgba(46,204,113,0.12)',
    border: '1px solid rgba(46,204,113,0.3)',
    borderRadius: 3,
    padding: '1px 5px',
    fontSize: 10,
    whiteSpace: 'nowrap',
  },
  lockedBadge: {
    color: '#aaa',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 3,
    padding: '1px 5px',
    fontSize: 10,
    whiteSpace: 'nowrap',
  },
};
