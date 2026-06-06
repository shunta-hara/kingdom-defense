import { useGameStore } from '../../store/gameStore';

function formatSaveTime(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function SaveButton() {
  const saveNow = useGameStore((s) => s.saveNow);
  const lastSaveTime = useGameStore((s) => s.lastSaveTime);

  const handleSave = () => {
    saveNow();
  };

  return (
    <div style={styles.container}>
      <button
        style={styles.button}
        onClick={handleSave}
        aria-label="手動セーブ"
      >
        保存
      </button>
      {lastSaveTime && (
        <span style={styles.savedAt}>
          保存済み {formatSaveTime(lastSaveTime)}
        </span>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  button: {
    background: 'rgba(193,154,107,0.2)',
    border: '1px solid rgba(193,154,107,0.5)',
    color: '#c19a6b',
    borderRadius: 6,
    padding: '3px 10px',
    cursor: 'pointer',
    fontFamily: "'Crimson Text', serif",
    fontSize: 13,
    transition: 'all 0.2s',
    minHeight: 44,
  },
  savedAt: {
    color: '#888',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
};
