// ============================================================
// AudioEngine - Web Audio API Wrapper
// ============================================================

/**
 * AudioContextをラップするシングルトンクラス。
 * 初回ユーザー操作後に init() を呼んで AudioContext を生成する。
 * BGM はプロシージャル生成（OscillatorNode）、効果音も同様。
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private seGain: GainNode | null = null;

  private bgmOscillators: OscillatorNode[] = [];
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private bgmActive = false;

  private _isMuted = false;
  private _bgmVolume = 0.4;
  private _seVolume = 0.6;

  /**
   * AudioContext を初期化する。ユーザー操作後に呼ぶこと。
   * 既に初期化済みの場合は何もしない。
   */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._isMuted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    // BGM gain
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = this._bgmVolume;
    this.bgmGain.connect(this.masterGain);

    // SE gain
    this.seGain = this.ctx.createGain();
    this.seGain.gain.value = this._seVolume;
    this.seGain.connect(this.masterGain);
  }

  /**
   * ファンタジー風メロディーBGMをシーケンサーで再生する。
   * Cマイナーペンタトニック系のメロディーとベースを交互に鳴らす。
   */
  startBGM(): void {
    if (!this.ctx || !this.bgmGain) return;
    if (this.bgmActive) return;
    this.bgmActive = true;

    // Cマイナー風ファンタジーメロディー（Hz）
    const MELODY = [261, 311, 349, 392, 349, 311, 261, 233];
    const BASS   = [130, 155, 130, 174];
    const BEAT_MS = 500; // BPM 120
    let beat = 0;

    const tick = () => {
      if (!this.ctx || !this.bgmGain) return;
      const melodyFreq = MELODY[beat % MELODY.length];
      const bassFreq   = BASS[Math.floor(beat / 2) % BASS.length];

      this.playNote(melodyFreq, 'triangle', 0.13, 0.42, this.bgmGain);
      this.playNote(bassFreq,   'sine',     0.18, 0.46, this.bgmGain);
      // 4拍おきにハーモニー
      if (beat % 4 === 0) {
        this.playNote(melodyFreq * 1.498, 'sine', 0.06, 0.46, this.bgmGain);
      }
      beat++;
    };

    tick();
    this.bgmInterval = setInterval(tick, BEAT_MS);
  }

  /** 短いノートを1音鳴らす内部ヘルパー */
  private playNote(
    freq: number,
    type: OscillatorType,
    volume: number,
    duration: number,
    dest: GainNode
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.setValueAtTime(volume, now + duration * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * BGMを停止する。
   */
  stopBGM(): void {
    if (!this.bgmActive) return;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmOscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* 停止済み */ }
    });
    this.bgmOscillators = [];
    this.bgmActive = false;
  }

  /**
   * ミュート切り替え。
   */
  setMuted(muted: boolean): void {
    this._isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }

  /**
   * 音量設定。
   */
  setVolume(bgm: number, se: number): void {
    this._bgmVolume = bgm;
    this._seVolume = se;
    if (this.bgmGain) this.bgmGain.gain.value = bgm;
    if (this.seGain) this.seGain.gain.value = se;
  }

  /**
   * コイン獲得効果音（短い上昇音）。
   */
  playCoin(): void {
    if (!this.ctx || !this.seGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.seGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * 攻撃効果音（短い打撃音）。
   */
  playAttack(): void {
    if (!this.ctx || !this.seGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.seGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  /**
   * Wave開始効果音（ファンファーレ風）。
   */
  playWaveStart(): void {
    if (!this.ctx || !this.seGain) return;

    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = this.ctx!.createGain();
      const startTime = this.ctx!.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.seGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  /**
   * 転生効果音（神秘的な音）。
   */
  playRebirth(): void {
    if (!this.ctx || !this.seGain) return;

    // 上昇するアルペジオ
    const notes = [261, 329, 392, 523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx!.createGain();
      const startTime = this.ctx!.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.seGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });

    // 最後にシマーリング効果
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1047, this.ctx.currentTime + 0.7);
    shimmer.frequency.linearRampToValueAtTime(2093, this.ctx.currentTime + 1.2);

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.15, this.ctx.currentTime + 0.7);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.seGain);
    shimmer.start(this.ctx.currentTime + 0.7);
    shimmer.stop(this.ctx.currentTime + 1.2);
  }

  get isInitialized(): boolean {
    return this.ctx !== null;
  }

  get isMuted(): boolean {
    return this._isMuted;
  }
}

// シングルトンをエクスポート
export const audioEngine = new AudioEngine();
