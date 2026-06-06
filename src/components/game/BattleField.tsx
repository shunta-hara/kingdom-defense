import { useEffect, useRef, useState } from 'react'; // useRef/useState: EnemyCard内のhit flash制御で使用
import { useGameStore, selectTotalDps } from '../../store/gameStore';
import type { Enemy } from '../../types/game';
import styles from './BattleField.module.css';
import { UnitDisplay } from './UnitDisplay';
import { WaveInfo } from './WaveInfo';
import { DpsPanel } from './DpsPanel';

// ---- Wave Tier helpers ----

type WaveTier = 'normal' | 'warning' | 'danger' | 'boss';

function getWaveTier(wave: number): WaveTier {
  if (wave >= 20) return 'boss';
  if (wave >= 10) return 'danger';
  if (wave >= 5) return 'warning';
  return 'normal';
}

type TierStyle = {
  fontSize: string;
  tierClass: string;
};

const TIER_STYLES: Record<WaveTier, TierStyle> = {
  normal:  { fontSize: '1.5rem', tierClass: styles.tierNormal },
  warning: { fontSize: '1.8rem', tierClass: styles.tierWarning },
  danger:  { fontSize: '2.2rem', tierClass: styles.tierDanger },
  boss:    { fontSize: '2.8rem', tierClass: styles.tierBoss },
};

// ---- EnemyCard ----

type EnemyCardProps = {
  enemy: Enemy;
  wave: number;
};

function EnemyCard({ enemy, wave }: EnemyCardProps) {
  const [flashing, setFlashing] = useState(false);
  const prevHpRef = useRef(enemy.hp);

  useEffect(() => {
    if (enemy.hp < prevHpRef.current) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 300);
      prevHpRef.current = enemy.hp;
      return () => clearTimeout(timer);
    }
    prevHpRef.current = enemy.hp;
  }, [enemy.hp]);

  const pct = (enemy.hp / enemy.maxHp) * 100;
  const hpColor = pct > 50 ? '#2ecc71' : pct > 25 ? '#f39c12' : '#e74c3c';

  const tier = getWaveTier(wave);
  const { fontSize, tierClass } = TIER_STYLES[tier];

  const cardClasses = [
    styles.enemy,
    tierClass,
    flashing ? styles.hitFlash : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses}>
      <div className={styles.enemyEmoji} style={{ fontSize }}>
        {enemy.emoji}
      </div>
      <div className={styles.hpBar}>
        <div
          className={styles.hpBarFill}
          style={{ width: `${pct}%`, backgroundColor: hpColor }}
        />
      </div>
      <div style={{ fontSize: 9, color: '#aaa' }}>{Math.max(0, Math.floor(enemy.hp))}</div>
    </div>
  );
}

// ---- BattleField ----

export function BattleField() {
  const wave = useGameStore((s) => s.wave);
  const waveActive = useGameStore((s) => s.waveActive);
  const enemies = useGameStore((s) => s.enemies);
  const battleLog = useGameStore((s) => s.battleLog);
  const floats = useGameStore((s) => s.floats);
  const startWave = useGameStore((s) => s.startWave);
  const setShowRebirth = useGameStore((s) => s.setShowRebirth);
  const handleCastleClick = useGameStore((s) => s.handleCastleClick);
  const units = useGameStore((s) => s.units);
  const attackingUnitIds = useGameStore((s) => s.attackingUnitIds);
  const comboCount = useGameStore((s) => s.comboCount);
  const comboMultiplier = useGameStore((s) => s.comboMultiplier);
  const waveTimeLeft = useGameStore((s) => s.waveTimeLeft);
  const totalDps = useGameStore(selectTotalDps);

  // 推定残り秒数の計算: 残り敵の総HP ÷ 総DPS（切り上げ）
  const totalEnemyHp = enemies.reduce((sum, e) => sum + Math.max(0, e.hp), 0);
  const estimatedSeconds = waveActive && totalDps > 0 && totalEnemyHp > 0
    ? Math.ceil(totalEnemyHp / totalDps)
    : null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    handleCastleClick(x, y);
  };

  return (
    <div style={inlineStyles.battlefield}>
      {/* Battle Header */}
      <div style={inlineStyles.battleHeader}>
        <div style={inlineStyles.waveInfo}>
          {waveActive ? (
            <span style={{ color: '#e74c3c' }}>
              ⚔️ WAVE {wave} 進行中 — 残り {enemies.length}体
              {estimatedSeconds !== null && (
                <span style={{
                  marginLeft: 6,
                  color: estimatedSeconds > waveTimeLeft ? '#e74c3c' : '#aaa',
                  fontWeight: estimatedSeconds > waveTimeLeft ? 'bold' : 'normal',
                  fontSize: 12,
                }}>
                  / 推定 {estimatedSeconds}s
                </span>
              )}
              <span style={{
                marginLeft: 8,
                color: waveTimeLeft <= 10 ? '#e74c3c' : '#f39c12',
                fontWeight: waveTimeLeft <= 10 ? 'bold' : 'normal',
              }}>
                ⏱ {waveTimeLeft}s
              </span>
            </span>
          ) : (
            <span style={{ color: '#2ecc71' }}>✅ WAVE {wave} 待機中</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                ...inlineStyles.btn,
                ...(!waveActive ? inlineStyles.btnPrimary : inlineStyles.btnDisabled),
              }}
              onClick={startWave}
              disabled={waveActive}
              aria-label={waveActive ? '戦闘中' : `Wave ${wave} 開始`}
            >
              {waveActive ? '戦闘中...' : `Wave ${wave} 開始`}
            </button>
            <button
              style={{ ...inlineStyles.btn, ...inlineStyles.btnRebirth }}
              onClick={() => setShowRebirth(true)}
              aria-label="転生する"
            >
              💫 転生
            </button>
          </div>
          <WaveInfo />
        </div>
      </div>

      {/* DPS Panel */}
      <DpsPanel />

      {/* Click Area */}
      <div
        style={inlineStyles.clickZone}
        onClick={handleClick}
        role="button"
        aria-label="城をクリックして金貨獲得"
      >
        <div style={inlineStyles.castleIcon}>🏰</div>
        <div style={inlineStyles.clickHint}>クリックで金貨獲得</div>
        {comboCount >= 2 && (
          <div style={inlineStyles.comboDisplay}>
            コンボ x{comboCount} ({comboMultiplier >= 5.0 ? '×5.0 MAX!' : `×${comboMultiplier.toFixed(1)}`})
          </div>
        )}
        {floats.map((f) => (
          <div
            key={f.id}
            style={{
              ...inlineStyles.floatText,
              color: f.color,
              left: `${f.x}%`,
              top: `${f.y}%`,
            }}
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Battle Area: units (left) + enemies (right) */}
      <div style={inlineStyles.battleArea}>
        {/* Friendly Units */}
        <UnitDisplay units={units} attackingUnitIds={attackingUnitIds} />

        {/* Enemies */}
        <div style={inlineStyles.enemyArea}>
          <div className={styles.enemyContainer}>
            {enemies.map((e: Enemy) => (
              <EnemyCard
                key={e.id}
                enemy={e}
                wave={wave}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div style={inlineStyles.logBox}>
        {battleLog.slice(0, 6).map((msg, i) => (
          <div key={i} style={{ ...inlineStyles.logLine, opacity: 1 - i * 0.15 }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

const inlineStyles: Record<string, React.CSSProperties> = {
  battlefield: {
    flex: '0 0 55%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '2px solid rgba(193,154,107,0.2)',
    padding: 12,
    gap: 8,
  },
  battleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  waveInfo: {
    fontSize: 13,
    fontFamily: "'Crimson Text', serif",
  },
  clickZone: {
    background: 'linear-gradient(135deg, rgba(30,15,5,0.8) 0%, rgba(15,30,15,0.8) 100%)',
    border: '2px solid rgba(193,154,107,0.3)',
    borderRadius: 12,
    padding: '20px',
    cursor: 'pointer',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
    transition: 'transform 0.1s',
    minHeight: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  castleIcon: { fontSize: 48, lineHeight: 1 },
  clickHint: { fontSize: 11, color: '#666', marginTop: 4 },
  comboDisplay: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: 700,
    fontFamily: "'Crimson Text', serif",
    marginTop: 4,
    textShadow: '0 0 8px rgba(243,156,18,0.6)',
  },
  floatText: {
    position: 'absolute',
    fontFamily: "'Crimson Text', serif",
    fontWeight: 700,
    fontSize: 16,
    pointerEvents: 'none',
    animation: 'floatUp 1.2s ease-out forwards',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
  },
  battleArea: {
    display: 'flex',
    gap: 8,
    flex: 1,
    minHeight: 80,
    alignItems: 'flex-start',
  },
  enemyArea: {
    flex: 1,
    minHeight: 80,
  },
  logBox: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 8,
    maxHeight: 120,
    overflow: 'hidden',
  },
  logLine: {
    fontSize: 11,
    color: '#bbb',
    lineHeight: 1.6,
    fontFamily: "'Georgia', serif",
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
  btnPrimary: {
    background: 'linear-gradient(135deg, #c19a6b, #a07850)',
    border: '1px solid #c19a6b',
    color: '#fff',
  },
  btnRebirth: {
    background: 'linear-gradient(135deg, #6c3483, #4a235a)',
    border: '1px solid #9b59b6',
    color: '#ddd',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
