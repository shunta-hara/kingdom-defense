import { useEffect, useRef, useState } from 'react';
import { useGameStore, selectTotalDps } from '../../store/gameStore';
import { UNIT_DEFINITIONS, UNIT_IDS } from '../../constants/units';
import { PROPHECY_UPGRADES } from '../../constants/skills';
import { calcProphecyEffect, calcDps } from '../../utils/combat';
import { checkUnitUnlockCondition } from '../../utils/rebirth';

// ---- Utility ----

export function formatDps(dps: number): string {
  if (dps >= 1_000_000) return `${(dps / 1_000_000).toFixed(1)}M`;
  if (dps >= 1000) return `${(dps / 1000).toFixed(1)}k`;
  return `${Math.floor(dps)}`;
}

// ---- DpsBreakdown ----

type DpsBreakdownProps = {
  totalDps: number;
};

function DpsBreakdown({ totalDps }: DpsBreakdownProps) {
  const units = useGameStore((s) => s.units);
  const prophecyUpgrades = useGameStore((s) => s.prophecyUpgrades);
  const prophecyEffect = calcProphecyEffect(prophecyUpgrades, PROPHECY_UPGRADES);

  const rows = UNIT_IDS.filter((id) => {
    const def = UNIT_DEFINITIONS[id];
    const unlocked = checkUnitUnlockCondition(id, units, def.unlockCond);
    return unlocked && (units[id]?.count ?? 0) > 0;
  }).map((id) => {
    const def = UNIT_DEFINITIONS[id];
    const dps = calcDps(id, units[id], prophecyEffect);
    const pct = totalDps > 0 ? Math.round((dps / totalDps) * 100) : 0;
    return { id, name: def.name, color: def.color, dps, pct };
  });

  if (rows.length === 0) return null;

  return (
    <div style={styles.breakdownContainer}>
      {rows.map((row) => (
        <div key={row.id} style={styles.breakdownRow}>
          <span style={{ color: row.color, fontSize: 11, fontWeight: 600 }}>
            {row.name}:
          </span>
          <span style={{ color: '#ccc', fontSize: 11 }}>
            {' '}{formatDps(row.dps)} DPS ({row.pct}%)
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- DpsPanel ----

export function DpsPanel() {
  const totalDps = useGameStore(selectTotalDps);
  const waveActive = useGameStore((s) => s.waveActive);

  // Wave開始時のDPSをrefで記録
  const prevWaveActiveRef = useRef(waveActive);
  const waveStartDpsRef = useRef(0);

  // DPS差分表示の状態
  const [dpsDiff, setDpsDiff] = useState(0);
  const [diffVisible, setDiffVisible] = useState(false);
  const diffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // パルスアニメーション状態
  const [pulsing, setPulsing] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 現在のtotalDpsをrefで追跡（差分検知用）
  const prevDpsRef = useRef(totalDps);

  // Wave開始検知: false -> true になったタイミングでDPSを記録
  useEffect(() => {
    if (!prevWaveActiveRef.current && waveActive) {
      waveStartDpsRef.current = totalDps;
    }
    prevWaveActiveRef.current = waveActive;
  }, [waveActive, totalDps]);

  // DPS増加検知: パルスと差分表示
  useEffect(() => {
    if (totalDps > prevDpsRef.current) {
      // パルスアニメーション
      setPulsing(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setPulsing(false), 500);

      // 差分表示（Wave開始時との差分）
      const diff = totalDps - waveStartDpsRef.current;
      if (diff > 0) {
        setDpsDiff(diff);
        setDiffVisible(true);
        if (diffTimerRef.current) clearTimeout(diffTimerRef.current);
        diffTimerRef.current = setTimeout(() => setDiffVisible(false), 2000);
      }
    }
    prevDpsRef.current = totalDps;
  }, [totalDps]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (diffTimerRef.current) clearTimeout(diffTimerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  return (
    <div
      style={{
        ...styles.panel,
        ...(pulsing ? styles.panelPulse : {}),
      }}
    >
      <div style={styles.header}>
        <span style={styles.label}>総DPS</span>
        <span style={styles.totalDps}>{formatDps(totalDps)}</span>
        {diffVisible && dpsDiff > 0 && (
          <span style={styles.diffBadge}>
            +{formatDps(dpsDiff)} DPS ↑
          </span>
        )}
      </div>
      <DpsBreakdown totalDps={totalDps} />
    </div>
  );
}

// ---- DpsBadge（UnitPanel内で使用する小バッジ） ----

type DpsBadgeProps = {
  unitId: string;
};

export function DpsBadge({ unitId }: DpsBadgeProps) {
  const units = useGameStore((s) => s.units);
  const prophecyUpgrades = useGameStore((s) => s.prophecyUpgrades);
  const totalDps = useGameStore(selectTotalDps);

  // UnitIdとして安全にアクセスするためにUIDS確認
  if (!UNIT_IDS.includes(unitId as (typeof UNIT_IDS)[number])) return null;

  const id = unitId as (typeof UNIT_IDS)[number];
  const unitState = units[id];
  if (!unitState || unitState.count === 0) return null;

  // 商人（passive）は収入/秒を表示
  if (UNIT_DEFINITIONS[id].target === 'passive') {
    const def = UNIT_DEFINITIONS[id];
    const levelBonus = 1 + unitState.level * 0.1;
    const skillBonus = unitState.unlockedSkills.reduce((sum, skillId) => {
      const skill = def.skills.find((s) => s.id === skillId);
      return sum + (skill?.effect.goldBonus ?? 0);
    }, 0);
    const income = Math.floor(def.baseAtk * unitState.count * levelBonus * (1 + skillBonus));
    return (
      <span style={{ ...styles.badge, color: '#f1c40f' }}>
        {income}G/s
      </span>
    );
  }

  const prophecyEffect = calcProphecyEffect(prophecyUpgrades, PROPHECY_UPGRADES);
  const dps = calcDps(id, unitState, prophecyEffect);
  const pct = totalDps > 0 ? Math.round((dps / totalDps) * 100) : 0;

  return (
    <span style={styles.badge}>
      {formatDps(dps)} DPS ({pct}%)
    </span>
  );
}

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: 'rgba(52, 152, 219, 0.08)',
    border: '1px solid rgba(52,152,219,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    transition: 'background 0.3s, border-color 0.3s',
  },
  panelPulse: {
    background: 'rgba(46, 204, 113, 0.15)',
    border: '1px solid rgba(46,204,113,0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 11,
    color: '#888',
    fontFamily: "'Georgia', serif",
  },
  totalDps: {
    fontSize: 20,
    fontWeight: 700,
    color: '#3498db',
    fontFamily: "'Crimson Text', serif",
  },
  diffBadge: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: 600,
    fontFamily: "'Crimson Text', serif",
    animation: 'fadeInOut 2s ease-out forwards',
  },
  breakdownContainer: {
    marginTop: 4,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px 12px',
    maxHeight: 52,
    overflow: 'hidden',
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    fontSize: 10,
    color: '#3498db',
    background: 'rgba(52,152,219,0.12)',
    borderRadius: 4,
    padding: '1px 5px',
    fontFamily: "'Georgia', serif",
    marginLeft: 4,
  },
};
