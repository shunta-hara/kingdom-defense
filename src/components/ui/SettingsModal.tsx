import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { audioEngine } from '../../audio/audioEngine';
import { saveAudioSettings } from '../../store/saveManager';
import { ResetModal } from './ResetModal';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const isMuted = useGameStore((s) => s.isMuted);
  const bgmVolume = useGameStore((s) => s.bgmVolume);
  const seVolume = useGameStore((s) => s.seVolume);
  const particlesEnabled = useGameStore((s) => s.particlesEnabled);
  const setMuted = useGameStore((s) => s.setMuted);
  const setVolume = useGameStore((s) => s.setVolume);
  const setParticlesEnabled = useGameStore((s) => s.setParticlesEnabled);
  const resetSave = useGameStore((s) => s.resetSave);

  const [showResetModal, setShowResetModal] = useState(false);

  if (!isOpen) return null;

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setVolume(val, seVolume);
    audioEngine.setVolume(val, seVolume);
    saveAudioSettings({ isMuted, bgmVolume: val, seVolume });
  };

  const handleSeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setVolume(bgmVolume, val);
    audioEngine.setVolume(bgmVolume, val);
    saveAudioSettings({ isMuted, bgmVolume, seVolume: val });
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setMuted(next);
    audioEngine.setMuted(next);
    saveAudioSettings({ isMuted: next, bgmVolume, seVolume });
  };

  const handleParticlesToggle = () => {
    setParticlesEnabled(!particlesEnabled);
  };

  return (
    <>
      <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div style={styles.modal}>
          <div style={styles.header}>
            <h2 id="settings-title" style={styles.title}>設定</h2>
            <button style={styles.closeButton} onClick={onClose} aria-label="閉じる">
              ✕
            </button>
          </div>

          {/* 音声セクション */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>音声</h3>

            <div style={styles.row}>
              <label style={styles.label}>ミュート</label>
              <button
                style={{ ...styles.toggleButton, ...(isMuted ? styles.toggleOn : styles.toggleOff) }}
                onClick={handleMuteToggle}
                aria-pressed={isMuted}
                aria-label={isMuted ? 'ミュート解除' : 'ミュート'}
              >
                {isMuted ? '🔇 オフ' : '🔊 オン'}
              </button>
            </div>

            <div style={styles.sliderRow}>
              <label style={styles.label} htmlFor="bgm-volume">
                BGM音量
              </label>
              <div style={styles.sliderGroup}>
                <input
                  id="bgm-volume"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(bgmVolume * 100)}
                  onChange={handleBgmChange}
                  disabled={isMuted}
                  style={styles.slider}
                  aria-label="BGM音量"
                />
                <span style={styles.sliderValue}>{Math.round(bgmVolume * 100)}%</span>
              </div>
            </div>

            <div style={styles.sliderRow}>
              <label style={styles.label} htmlFor="se-volume">
                SE音量
              </label>
              <div style={styles.sliderGroup}>
                <input
                  id="se-volume"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(seVolume * 100)}
                  onChange={handleSeChange}
                  disabled={isMuted}
                  style={styles.slider}
                  aria-label="SE音量"
                />
                <span style={styles.sliderValue}>{Math.round(seVolume * 100)}%</span>
              </div>
            </div>
          </section>

          {/* グラフィックセクション */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>グラフィック</h3>

            <div style={styles.row}>
              <label style={styles.label}>パーティクル</label>
              <button
                style={{ ...styles.toggleButton, ...(particlesEnabled ? styles.toggleOn : styles.toggleOff) }}
                onClick={handleParticlesToggle}
                aria-pressed={particlesEnabled}
                aria-label={particlesEnabled ? 'パーティクルをオフにする' : 'パーティクルをオンにする'}
              >
                {particlesEnabled ? '✨ オン' : '✨ オフ'}
              </button>
            </div>
          </section>

          {/* データセクション */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>データ</h3>
            <button
              style={styles.resetButton}
              onClick={() => setShowResetModal(true)}
              aria-label="データをリセット"
            >
              データをリセット
            </button>
          </section>

          <div style={styles.footer}>
            <button style={styles.closeBtn} onClick={onClose} aria-label="設定を閉じる">
              閉じる
            </button>
          </div>
        </div>
      </div>

      <ResetModal
        isOpen={showResetModal}
        onConfirm={() => {
          resetSave();
          setShowResetModal(false);
          onClose();
        }}
        onCancel={() => setShowResetModal(false)}
      />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  },
  modal: {
    background: 'linear-gradient(135deg, #1a0a2e 0%, #0d1a0a 100%)',
    border: '2px solid rgba(193,154,107,0.4)',
    borderRadius: 12,
    padding: '20px 24px',
    maxWidth: 420,
    width: '92%',
    color: '#e0d5c5',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Crimson Text', 'Georgia', serif",
    fontSize: 20,
    color: '#c19a6b',
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: 18,
    cursor: 'pointer',
    lineHeight: 1,
    padding: '4px 8px',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(193,154,107,0.15)',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#c19a6b',
    fontFamily: "'Crimson Text', 'Georgia', serif",
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  sliderGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  label: {
    fontSize: 13,
    color: '#ccc',
    minWidth: 80,
  },
  slider: {
    width: 140,
    accentColor: '#c19a6b',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: 12,
    color: '#aaa',
    minWidth: 36,
    textAlign: 'right',
  },
  toggleButton: {
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: "'Georgia', serif",
    minWidth: 80,
    textAlign: 'center',
  },
  toggleOn: {
    background: 'rgba(193,154,107,0.2)',
    color: '#c19a6b',
    borderColor: 'rgba(193,154,107,0.5)',
  },
  toggleOff: {
    background: 'rgba(255,255,255,0.05)',
    color: '#666',
  },
  resetButton: {
    background: 'rgba(231,76,60,0.15)',
    border: '1px solid rgba(231,76,60,0.4)',
    color: '#e74c3c',
    borderRadius: 6,
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'Georgia', serif",
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#aaa',
    borderRadius: 6,
    padding: '6px 20px',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'Georgia', serif",
  },
};
