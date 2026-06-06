import { useGameStore } from '../../store/gameStore';

/**
 * ミュートボタンコンポーネント。
 * クリックするとミュート状態をトグルする。
 * 音量アイコンでミュート/アンミュートを表示する。
 */
export function MuteButton() {
  const isMuted = useGameStore((s) => s.isMuted);
  const setMuted = useGameStore((s) => s.setMuted);

  const handleClick = () => {
    setMuted(!isMuted);
  };

  return (
    <button
      style={styles.button}
      onClick={handleClick}
      aria-label={isMuted ? 'ミュート解除' : 'ミュート'}
      title={isMuted ? 'ミュート解除' : 'ミュート'}
    >
      <span style={styles.icon}>{isMuted ? '🔇' : '🔊'}</span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '3px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    transition: 'background 0.2s',
  },
  icon: {
    fontSize: 16,
    lineHeight: 1,
  },
};
