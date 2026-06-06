import styles from './BattleField.module.css';
import { UNIT_DEFINITIONS, UNIT_IDS } from '../../constants/units';
import type { UnitId, UnitsState } from '../../types/game';

// 最大個別表示数
const MAX_INDIVIDUAL = 8;

type UnitDisplayProps = {
  units: UnitsState;
  attackingUnitIds: Set<UnitId>;
};

type DeployedUnit = {
  id: UnitId;
  name: string;
  emoji: string;
  count: number;
};

function buildDeployedUnits(units: UnitsState): DeployedUnit[] {
  return UNIT_IDS.filter((id) => units[id].count > 0 && UNIT_DEFINITIONS[id].target !== 'passive').map((id) => ({
    id,
    name: UNIT_DEFINITIONS[id].name,
    emoji: UNIT_DEFINITIONS[id].emoji,
    count: units[id].count,
  }));
}

// 合計体数を計算
function totalCount(deployed: DeployedUnit[]): number {
  return deployed.reduce((sum, u) => sum + u.count, 0);
}

export function UnitDisplay({ units, attackingUnitIds }: UnitDisplayProps) {
  const deployed = buildDeployedUnits(units);

  if (deployed.length === 0) {
    return (
      <div className={styles.unitDisplayEmpty}>
        兵士未配備
      </div>
    );
  }

  const total = totalCount(deployed);

  // 8体以内: 個別絵文字表示
  if (total <= MAX_INDIVIDUAL) {
    const icons: Array<{ key: string; unitId: UnitId; emoji: string }> = [];
    for (const unit of deployed) {
      for (let i = 0; i < unit.count; i++) {
        icons.push({ key: `${unit.id}-${i}`, unitId: unit.id, emoji: unit.emoji });
      }
    }

    return (
      <div className={styles.unitDisplayArea}>
        <div className={styles.unitDisplayLabel}>味方兵士</div>
        <div className={styles.unitIconGrid}>
          {icons.map(({ key, unitId, emoji }) => {
            const isAttacking = attackingUnitIds.has(unitId);
            return (
              <span
                key={key}
                className={`${styles.unitIcon} ${isAttacking ? styles.unitAttack : ''}`}
                title={UNIT_DEFINITIONS[unitId].name}
              >
                {emoji}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // 8体超: 兵種ごとに「名前×N」省略表示
  return (
    <div className={styles.unitDisplayArea}>
      <div className={styles.unitDisplayLabel}>味方兵士</div>
      <div className={styles.unitSummaryList}>
        {deployed.map((unit) => {
          const isAttacking = attackingUnitIds.has(unit.id);
          return (
            <div
              key={unit.id}
              className={`${styles.unitSummaryItem} ${isAttacking ? styles.unitAttack : ''}`}
            >
              <span className={styles.unitSummaryEmoji}>{unit.emoji}</span>
              <span className={styles.unitSummaryText}>
                {unit.name}×{unit.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
