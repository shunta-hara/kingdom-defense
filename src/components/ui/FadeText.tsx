import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PROPHECY_UPGRADES } from '../../constants/skills';

const FADE_DURATION_MS = 3000;

const fadeTextStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    pointerEvents: 'none',
  },
  container: {
    fontFamily: "'Crimson Text', serif",
    color: '#c3a0e8',
    textAlign: 'center',
    animation: 'rebirthFadeInOut 3s ease-in-out forwards',
    padding: '24px 40px',
    background: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    border: '1px solid rgba(155,89,182,0.3)',
    maxWidth: 420,
  },
  flavorText: {
    fontSize: 28,
    fontWeight: 700,
    textShadow: '0 0 20px rgba(155,89,182,0.8), 0 0 40px rgba(155,89,182,0.4)',
    marginBottom: 16,
  },
  divider: {
    borderTop: '1px solid rgba(155,89,182,0.3)',
    marginBottom: 12,
  },
  rebirthTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e8c3f8',
    marginBottom: 8,
  },
  prophecyList: {
    fontSize: 14,
    color: '#c3a0e8',
    marginBottom: 12,
    lineHeight: 1.8,
    textAlign: 'left',
  },
  prophecyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  waveInfo: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 8,
  },
  waveArrow: {
    color: '#f1c40f',
    fontWeight: 700,
  },
};

export function FadeText() {
  const rebirthFlavorVisible = useGameStore((s) => s.rebirthFlavorVisible);
  const setRebirthFlavorVisible = useGameStore((s) => s.setRebirthFlavorVisible);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const prophecyUpgrades = useGameStore((s) => s.prophecyUpgrades);
  const prevSessionBestWave = useGameStore((s) => s.prevSessionBestWave);

  useEffect(() => {
    if (!rebirthFlavorVisible) return;
    const timer = setTimeout(() => {
      setRebirthFlavorVisible(false);
    }, FADE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [rebirthFlavorVisible, setRebirthFlavorVisible]);

  if (!rebirthFlavorVisible) return null;

  const ownedProphecies = PROPHECY_UPGRADES.filter((p) =>
    prophecyUpgrades.includes(p.id)
  );
  const targetWave = prevSessionBestWave > 0
    ? Math.ceil(prevSessionBestWave * 1.2)
    : null;

  return (
    <>
      <style>{`
        @keyframes rebirthFadeInOut {
          0%   { opacity: 0; transform: translateY(10px); }
          20%  { opacity: 1; transform: translateY(0); }
          70%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
      <div style={fadeTextStyles.overlay} aria-live="polite">
        <div style={fadeTextStyles.container}>
          <div style={fadeTextStyles.flavorText}>
            また同じ夢を見ている——
          </div>

          {(ownedProphecies.length > 0 || prevSessionBestWave > 0) && (
            <>
              <div style={fadeTextStyles.divider} />
              <div style={fadeTextStyles.rebirthTitle}>
                転生 {rebirthCount}周目
              </div>

              {ownedProphecies.length > 0 && (
                <div style={fadeTextStyles.prophecyList}>
                  <div style={{ marginBottom: 4, color: '#e8c3f8', fontSize: 13 }}>
                    獲得した予知夢の記憶：
                  </div>
                  {ownedProphecies.map((p) => (
                    <div key={p.id} style={fadeTextStyles.prophecyItem}>
                      <span>✨</span>
                      <span>
                        {p.name.replace('予知：', '')}（{p.desc}）
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {prevSessionBestWave > 0 && targetWave !== null && (
                <div style={fadeTextStyles.waveInfo}>
                  前周最高Wave: {prevSessionBestWave}
                  {'  '}
                  <span style={fadeTextStyles.waveArrow}>→</span>
                  {'  '}
                  今周の目標: Wave {targetWave}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
