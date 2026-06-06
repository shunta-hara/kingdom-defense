type ResetModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ResetModal({ isOpen, onConfirm, onCancel }: ResetModalProps) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div style={styles.modal}>
        <h2 id="reset-title" style={styles.title}>データをリセットしますか？</h2>
        <p style={styles.message}>
          すべての進行状況（金貨・兵種・Wave・予知夢）が削除されます。
          この操作は取り消せません。
        </p>
        <div style={styles.buttons}>
          <button style={styles.cancelButton} onClick={onCancel} aria-label="キャンセル">
            キャンセル
          </button>
          <button style={styles.confirmButton} onClick={onConfirm} aria-label="リセットを確認">
            リセット
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'linear-gradient(135deg, #1a0a2e 0%, #0d1a0a 100%)',
    border: '2px solid rgba(193,154,107,0.4)',
    borderRadius: 12,
    padding: '24px 28px',
    maxWidth: 380,
    width: '90%',
    color: '#e0d5c5',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  title: {
    fontFamily: "'Crimson Text', 'Georgia', serif",
    fontSize: 18,
    color: '#c19a6b',
    marginTop: 0,
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 1.6,
    marginBottom: 20,
  },
  buttons: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#888',
    borderRadius: 6,
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 13,
  },
  confirmButton: {
    background: 'rgba(231,76,60,0.2)',
    border: '1px solid rgba(231,76,60,0.5)',
    color: '#e74c3c',
    borderRadius: 6,
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 13,
  },
};
