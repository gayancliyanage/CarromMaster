/**
 * Procedural Sound Manager using Web Audio API
 * No external files needed - generates all sounds programmatically
 */

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private ensureContext(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = enabled ? 0.5 : 0;
    }
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Piece-to-piece collision sound
   * A satisfying "clack" like billiard balls
   */
  playCollision(intensity: number = 0.5): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    const duration = 0.08;

    // Create oscillator for the "click" part
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + intensity * 400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + duration);
    
    oscGain.gain.setValueAtTime(0.3 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);

    // Add noise burst for texture
    this.playNoiseHit(intensity * 0.3, 0.05);
  }

  /**
   * Striker hitting pieces - more powerful sound
   */
  playStrikerHit(intensity: number = 0.7): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    
    // Low thump
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain1.gain.setValueAtTime(0.4 * intensity, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // High click
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain2.gain.setValueAtTime(0.2 * intensity, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 0.05);

    // Noise texture
    this.playNoiseHit(intensity * 0.4, 0.08);
  }

  /**
   * Piece falling into pocket - satisfying drop sound
   */
  playPocket(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;

    // Descending tone (falling feeling)
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);

    // Satisfying "plop" 
    setTimeout(() => {
      if (!this.audioContext || !this.masterGain) return;
      const plop = this.audioContext.createOscillator();
      const plopGain = this.audioContext.createGain();
      plop.type = 'sine';
      plop.frequency.setValueAtTime(200, this.audioContext.currentTime);
      plop.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.1);
      plopGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      plopGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
      plop.connect(plopGain);
      plopGain.connect(this.masterGain);
      plop.start(this.audioContext.currentTime);
      plop.stop(this.audioContext.currentTime + 0.15);
    }, 100);

    // Celebration chime
    setTimeout(() => this.playSuccessChime(), 200);
  }

  /**
   * Success chime for scoring
   */
  private playSuccessChime(): void {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }

  /**
   * Wall bounce sound
   */
  playWallBounce(intensity: number = 0.5): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300 + intensity * 200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);
    gain.gain.setValueAtTime(0.15 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);

    this.playNoiseHit(intensity * 0.2, 0.03);
  }

  /**
   * Foul sound (striker pocketed)
   */
  playFoul(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    
    // Descending "buzzer" tone
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * UI click sound
   */
  playClick(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Noise burst helper - adds texture to sounds
   */
  private playNoiseHit(volume: number, duration: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noise.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noiseGain.gain.value = volume;
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noise.start(this.audioContext.currentTime);
  }

  /**
   * Game start fanfare
   */
  playGameStart(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    const notes = [392, 440, 494, 523, 587, 659]; // G4 to E5

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = now + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  /**
   * Victory fanfare
   */
  playVictory(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    this.ensureContext();

    const now = this.audioContext.currentTime;
    // Triumphant chord progression
    const chords = [
      [523, 659, 784],      // C major
      [587, 740, 880],      // D major  
      [659, 784, 988],      // E minor-ish
      [784, 988, 1175],     // G major high
    ];

    chords.forEach((chord, i) => {
      chord.forEach((freq) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = now + i * 0.25;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
        gain.gain.setValueAtTime(0.12, startTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    });
  }
}

// Singleton instance
export const soundManager = new SoundManager();
