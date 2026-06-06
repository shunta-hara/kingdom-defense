import { useGameStore } from '../../store/gameStore';
import { PROPHECY_UPGRADES } from '../../constants/skills';

export function ProphecyPanel() {
  const fragments = useGameStore((s) => s.fragments);
  const rebirthCount = useGameStore((s) => s.rebirthCount);
  const prophecyUpgrades = useGameStore((s) => s.prophecyUpgrades);
  const buyProphecy = useGameStore((s) => s.buyProphecy);

  return (
    <div>
      <div style={styles.prophecyHeader}>
        <div
          style={{
            color: '#9b59b6',
            fontFamily: "'Crimson Text', serif",
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          🔮 予知夢の啓示
        </div>
        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginTop: 4 }}>
          「また同じ夢を見ている——
          <br />
          次の命では、もっとうまくやれる」
        </div>
        <div style={{ marginTop: 8, color: '#9b59b6' }}>
          転生回数: {rebirthCount} / 欠片: {fragments}個
        </div>
      </div>

      {PROPHECY_UPGRADES.map((pu) => {
        const owned = prophecyUpgrades.includes(pu.id);
        return (
          <div
            key={pu.id}
            style={{ ...styles.skillCard, ...(owned ? styles.skillOwned : {}) }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{ fontWeight: 700, color: owned ? '#9b59b6' : '#ddd', fontSize: 14 }}
              >
                {owned ? '✨' : '🔒'} {pu.name}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{pu.desc}</div>
            </div>
            {!owned && (
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnSmall,
                  ...(fragments >= pu.cost ? styles.btnProphecy : styles.btnDisabled),
                }}
                onClick={() => buyProphecy(pu.id)}
                disabled={fragments < pu.cost}
                aria-label={`予知強化${pu.name}を購入 コスト${pu.cost}欠片`}
              >
                🔮{pu.cost}
              </button>
            )}
          </div>
        );
      })}

      <div style={styles.infoBox}>
        💡 転生すると所持金と兵士はリセットされますが、予知夢の欠片を獲得できます。
        <br />
        欠片でWaveの進度に応じた永続強化を解放できます。
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  prophecyHeader: {
    marginBottom: 12,
    padding: 12,
    background: 'rgba(155,89,182,0.1)',
    borderRadius: 8,
    border: '1px solid rgba(155,89,182,0.3)',
  },
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
    border: '1px solid rgba(155,89,182,0.3)',
    background: 'rgba(155,89,182,0.05)',
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    background: 'rgba(155,89,182,0.1)',
    borderRadius: 8,
    border: '1px solid rgba(155,89,182,0.3)',
    fontSize: 12,
    color: '#aaa',
    lineHeight: 1.8,
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
  btnProphecy: {
    background: 'linear-gradient(135deg, #6c3483, #4a235a)',
    border: '1px solid #9b59b6',
    color: '#ddd',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
