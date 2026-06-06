import { useGameStore } from '../../store/gameStore';
import { calcRebirthFragments } from '../../utils/rebirth';
import { PROPHECY_UPGRADES } from '../../constants/skills';

function formatPlayTime(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}分${seconds}秒`;
}

export function RebirthModal() {
  const wave = useGameStore((s) => s.wave);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const showRebirth = useGameStore((s) => s.showRebirth);
  const doRebirth = useGameStore((s) => s.doRebirth);
  const setShowRebirth = useGameStore((s) => s.setShowRebirth);
  const sessionBestWave = useGameStore((s) => s.sessionBestWave);
  const sessionStartTime = useGameStore((s) => s.sessionStartTime);
  const fragments = useGameStore((s) => s.fragments);
  const prophecyUpgrades = useGameStore((s) => s.prophecyUpgrades);

  if (!showRebirth) return null;

  const earned = calcRebirthFragments(wave);
  const bestWave = Math.max(sessionBestWave, wave);
  const playTime = formatPlayTime(sessionStartTime);

  const totalAfter = fragments + earned;
  const unpurchased = PROPHECY_UPGRADES.filter((p) => !prophecyUpgrades.includes(p.id));
  const newlyAffordable = unpurchased.filter((p) => p.cost <= totalAfter);

  const cheapestUnaffordable = unpurchased
    .filter((p) => p.cost > totalAfter)
    .sort((a, b) => a.cost - b.cost)[0];
  const fragmentsNeeded = cheapestUnaffordable
    ? cheapestUnaffordable.cost - totalAfter
    : null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>💫 予知夢の中へ</div>
        <div style={styles.modalFlavorText}>
          「また同じ夢を見ている——勇者よ。
          <br />
          あの戦場の記憶は消えない。
          <br />
          だが次の命では、もっと多くを知っているはずだ」
        </div>
        <div style={styles.modalInfo}>
          <div>
            現在のWave:{' '}
            <strong style={{ color: '#e74c3c' }}>{wave}</strong>
          </div>
          <div>
            今周回の最高Wave:{' '}
            <strong style={{ color: '#e67e22' }}>{bestWave}</strong>
          </div>
          <div>
            プレイ時間:{' '}
            <strong style={{ color: '#3498db' }}>{playTime}</strong>
          </div>
          <div>
            転生回数: <strong style={{ color: '#aaa' }}>{rebirthCount}回</strong>
          </div>
          <div>
            獲得できる予知夢の欠片:{' '}
            <strong style={{ color: '#9b59b6' }}>🔮 {earned}個</strong>
          </div>
          <div style={{ color: '#e74c3c', marginTop: 8, fontSize: 13 }}>
            ⚠️ 金貨と兵士はすべてリセットされます
          </div>
        </div>

        {/* 欠片プレビューセクション */}
        <div style={styles.previewSection}>
          <div style={styles.previewTitle}>🔮 次の予知夢ロードマップ</div>
          <div style={styles.fragmentCalc}>
            現在の欠片: {fragments}
            {'  ＋  '}
            今回: {earned}
            {'  ＝  '}
            <strong style={{ color: '#9b59b6' }}>{totalAfter}欠片</strong>
          </div>

          {newlyAffordable.length > 0 ? (
            <div style={styles.affordableList}>
              {newlyAffordable.map((p) => (
                <div key={p.id} style={styles.affordableItem}>
                  💡 次は「{p.name.replace('予知：', '')}」（{p.cost}欠片）が購入可能！
                </div>
              ))}
            </div>
          ) : fragmentsNeeded !== null ? (
            <div style={styles.notAffordable}>
              次の予知夢まであと{' '}
              <strong style={{ color: '#f39c12' }}>{fragmentsNeeded}欠片</strong>
            </div>
          ) : (
            <div style={styles.notAffordable}>
              すべての予知夢を取得済みです！
            </div>
          )}
        </div>

        <div style={styles.modalActions}>
          <button
            style={{ ...styles.btn, ...styles.btnRebirth, padding: '10px 24px' }}
            onClick={doRebirth}
            aria-label="転生を実行する"
          >
            💫 転生する
          </button>
          <button
            style={{ ...styles.btn, padding: '10px 24px' }}
            onClick={() => setShowRebirth(false)}
            aria-label="転生をキャンセルして戻る"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: 'linear-gradient(160deg, #1a0a2e 0%, #0d0d1a 100%)',
    border: '2px solid rgba(155,89,182,0.5)',
    borderRadius: 16,
    padding: 28,
    maxWidth: 420,
    width: '90%',
    textAlign: 'center',
  },
  modalTitle: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 24,
    fontWeight: 700,
    color: '#9b59b6',
    marginBottom: 16,
  },
  modalFlavorText: {
    fontStyle: 'italic',
    color: '#aaa',
    fontSize: 14,
    lineHeight: 1.8,
    marginBottom: 20,
    padding: '12px 16px',
    background: 'rgba(155,89,182,0.1)',
    borderRadius: 8,
    borderLeft: '3px solid rgba(155,89,182,0.5)',
  },
  modalInfo: {
    fontSize: 14,
    lineHeight: 2,
    marginBottom: 20,
  },
  previewSection: {
    background: 'rgba(155,89,182,0.08)',
    border: '1px solid rgba(155,89,182,0.25)',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 20,
    textAlign: 'left',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#c3a0e8',
    marginBottom: 8,
  },
  fragmentCalc: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 8,
  },
  affordableList: {
    fontSize: 13,
    lineHeight: 1.8,
  },
  affordableItem: {
    color: '#2ecc71',
    marginBottom: 2,
  },
  notAffordable: {
    fontSize: 13,
    color: '#aaa',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
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
  btnRebirth: {
    background: 'linear-gradient(135deg, #6c3483, #4a235a)',
    border: '1px solid #9b59b6',
    color: '#ddd',
  },
};
