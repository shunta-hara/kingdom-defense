import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/audioEngine';
import { saveAudioSettings, loadAudioSettings } from '../store/saveManager';

/**
 * オーディオ初期化・効果音制御フック。
 * - 初回クリック時に AudioContext を init してBGMを開始する
 * - Zustandの音声設定変更を監視して audioEngine に反映する
 * - コイン獲得・攻撃・Wave開始・転生のイベントを監視して効果音を鳴らす
 */
export function useAudio(): void {
  const isMuted = useGameStore((s) => s.isMuted);
  const bgmVolume = useGameStore((s) => s.bgmVolume);
  const seVolume = useGameStore((s) => s.seVolume);
  const setMuted = useGameStore((s) => s.setMuted);
  const setVolume = useGameStore((s) => s.setVolume);

  // 初回クリックでBGMを開始するためのフラグ
  const audioStarted = useRef(false);

  // 効果音トリガー用の前回値を記憶するref
  const prevGold = useRef<number>(useGameStore.getState().gold);
  const prevWave = useRef<number>(useGameStore.getState().wave);
  const prevRebirthCount = useRef<number>(useGameStore.getState().rebirthCount);
  const prevAttackingUnits = useRef<Set<string>>(new Set());

  // localStorageから音声設定を復元する（初回のみ）
  useEffect(() => {
    const saved = loadAudioSettings();
    if (saved) {
      setMuted(saved.isMuted);
      setVolume(saved.bgmVolume, saved.seVolume);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 初回クリックでAudioContextを初期化してBGMを開始
  useEffect(() => {
    const handleFirstClick = () => {
      if (audioStarted.current) return;
      audioStarted.current = true;
      audioEngine.init();
      audioEngine.setMuted(isMuted);
      audioEngine.setVolume(bgmVolume, seVolume);
      audioEngine.startBGM();
      document.removeEventListener('click', handleFirstClick);
    };

    document.addEventListener('click', handleFirstClick);
    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // isMuted 変更を audioEngine に反映し、localStorage に保存
  useEffect(() => {
    audioEngine.setMuted(isMuted);
    saveAudioSettings({ isMuted, bgmVolume, seVolume });
  }, [isMuted, bgmVolume, seVolume]);

  // bgmVolume / seVolume 変更を audioEngine に反映
  useEffect(() => {
    audioEngine.setVolume(bgmVolume, seVolume);
  }, [bgmVolume, seVolume]);

  // ゲーム状態を監視して効果音を鳴らす
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      // コイン獲得音（gold が増加した場合）
      if (state.gold > prevGold.current) {
        audioEngine.playCoin();
      }
      prevGold.current = state.gold;

      // 攻撃音（新しい attackingUnitId が追加された場合）
      const currentAttacking = state.attackingUnitIds;
      const prevAttacking = prevAttackingUnits.current;
      let hasNewAttack = false;
      currentAttacking.forEach((id) => {
        if (!prevAttacking.has(id)) hasNewAttack = true;
      });
      if (hasNewAttack) {
        audioEngine.playAttack();
      }
      prevAttackingUnits.current = new Set(currentAttacking);

      // Wave開始音（wave番号が増加した場合）
      if (state.wave > prevWave.current) {
        audioEngine.playWaveStart();
      }
      prevWave.current = state.wave;

      // 転生音（rebirthCount が増加した場合）
      if (state.rebirthCount > prevRebirthCount.current) {
        audioEngine.playRebirth();
      }
      prevRebirthCount.current = state.rebirthCount;
    });

    return unsubscribe;
  }, []);
}
