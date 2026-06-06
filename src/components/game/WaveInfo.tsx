import { useGameStore } from '../../store/gameStore';
import { calcWavePreview } from '../../utils/wave';

const waveInfoStyles: Record<string, React.CSSProperties> = {
  container: {
    fontSize: 12,
    fontFamily: "'Georgia', serif",
    color: '#bbb',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  bossWarning: {
    color: '#e74c3c',
    fontWeight: 700,
    fontSize: 12,
    padding: '2px 6px',
    background: 'rgba(231,76,60,0.15)',
    border: '1px solid rgba(231,76,60,0.4)',
    borderRadius: 4,
    animation: 'bossPulse 1s ease-in-out infinite alternate',
  },
  stat: {
    color: '#aaa',
  },
  highlight: {
    color: '#f39c12',
    fontWeight: 600,
  },
};

export function WaveInfo() {
  const wave = useGameStore((s) => s.wave);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const waveActive = useGameStore((s) => s.waveActive);

  if (waveActive) return <div aria-hidden="true" style={{ height: 22 }} />;

  const preview = calcWavePreview(wave, rebirthCount);

  return (
    <>
      <style>{`
        @keyframes bossPulse {
          from { opacity: 0.7; }
          to   { opacity: 1; }
        }
      `}</style>
      <div style={waveInfoStyles.container}>
        <div style={waveInfoStyles.preview}>
          <span style={waveInfoStyles.stat}>次の敵：</span>
          <span style={waveInfoStyles.highlight}>{preview.count}体</span>
          <span style={waveInfoStyles.stat}>/</span>
          <span style={waveInfoStyles.stat}>HP</span>
          <span style={waveInfoStyles.highlight}>{preview.hp}</span>
          {preview.isBoss && (
            <span style={waveInfoStyles.bossWarning}>
              ⚠️ BOSS WAVE
            </span>
          )}
        </div>
      </div>
    </>
  );
}
