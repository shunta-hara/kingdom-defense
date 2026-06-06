import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

const AUTO_SAVE_INTERVAL_MS = 30_000;

/**
 * 30秒ごとの自動保存とWaveクリア時の自動保存を行うフック
 */
export function useAutoSave(): void {
  const saveNow = useGameStore((s) => s.saveNow);
  const setWaveCleared = useGameStore((s) => s.setWaveCleared);

  // 30秒ごとの自動保存
  useEffect(() => {
    const timer = setInterval(() => {
      saveNow();
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [saveNow]);

  // Waveクリア時の自動保存
  const prevWaveClearedRef = useRef(false);

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      if (state.waveCleared && !prevWaveClearedRef.current) {
        prevWaveClearedRef.current = true;
        saveNow();
        // フラグをリセット
        setWaveCleared(false);
      } else if (!state.waveCleared) {
        prevWaveClearedRef.current = false;
      }
    });
  }, [saveNow, setWaveCleared]);
}
