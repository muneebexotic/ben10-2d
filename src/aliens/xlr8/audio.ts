import { audio, midiToFreq } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** A zip that climbs out of hearing range. */
export const xlr8Transform: SoundRecipe = (v) => {
  A.noise({ duration: 0.38, volume: 0.22 * v, filter: 'bandpass', freq: 500, freqEnd: 7000, q: 1.4, attack: 0.03 });
  A.tone({ type: 'square', freq: 300, freqEnd: 2600, duration: 0.24, volume: 0.06 * v });
  A.tone({ type: 'triangle', freq: midiToFreq(91), duration: 0.3, volume: 0.07 * v, when: A.now + 0.18 });
};

export const strikeWhiff: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.04, volume: 0.1 * v, filter: 'bandpass', freq: 3200 * p, freqEnd: 6000 * p, q: 2 });
};

export const strikeHit: SoundRecipe = (v, p) => {
  A.tone({ type: 'square', freq: 820 * p, freqEnd: 300 * p, duration: 0.045, volume: 0.12 * v });
  A.noise({ duration: 0.04, volume: 0.16 * v, filter: 'highpass', freq: 3000 });
};

export const kickHit: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 230 * p, freqEnd: 60, duration: 0.18, volume: 0.45 * v });
  A.noise({ duration: 0.1, volume: 0.25 * v, filter: 'lowpass', freq: 3500, freqEnd: 400 });
};

export const dashWhoosh: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.18, volume: 0.28 * v, filter: 'bandpass', freq: 1200 * p, freqEnd: 5200 * p, q: 1.1 });
  A.tone({ type: 'sine', freq: 950 * p, freqEnd: 260 * p, duration: 0.14, volume: 0.07 * v });
};

/** Every enemy the dash passed through gets cut at once: a bright "shing". */
export const dashSlash: SoundRecipe = (v, p) => {
  A.tone({ type: 'triangle', freq: 2600 * p, duration: 0.22, volume: 0.09 * v });
  A.tone({ type: 'triangle', freq: 3900 * p, duration: 0.18, volume: 0.06 * v, when: A.now + 0.02 });
  A.noise({ duration: 0.12, volume: 0.22 * v, filter: 'highpass', freq: 5000 });
  A.tone({ type: 'sine', freq: 160, freqEnd: 50, duration: 0.2, volume: 0.3 * v });
};

/** Dodged a shot mid-dash: time drops out from under everything. */
export const tooSlow: SoundRecipe = (v) => {
  A.tone({ type: 'sawtooth', freq: 1400, freqEnd: 220, duration: 0.45, volume: 0.06 * v, filter: { type: 'lowpass', freq: 2400 } });
  for (const [i, n] of [84, 88, 91, 96].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.25, volume: 0.06 * v, when: A.now + 0.05 + i * 0.04 });
};

export const waterStep: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.06, volume: 0.12 * v, filter: 'bandpass', freq: 1800 * p, freqEnd: 900 * p, q: 1.5 });
};

/** Driving double-time hats, a bright staccato arpeggio up an octave and a clipped lead. */
export const XLR8_MUSIC: MusicLayerSpec = {
  arp: { wave: 'square', volume: 0.026, octave: 1, length: 0.45, filter: 5200 },
  lead: {
    wave: 'sawtooth',
    volume: 0.034,
    octave: 0,
    length: 0.9,
    filter: 3600,
    double: { wave: 'square', volume: 0.018, octave: 1, length: 0.5, filter: 6000, detune: 4 },
  },
  hats16: 0.035,
};

/** Rushing wind that follows XLR8's speed. */
export class WindLoop {
  private src: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;

  /** 0 = still, 1 = full speed (dashes go above). */
  set(intensity: number): void {
    const ctx = audio.ctx;
    if (!ctx || !audio.ready) return;
    if (!this.src) {
      if (intensity < 0.05) return;
      this.start(ctx);
    }
    const k = Math.min(1.4, Math.max(0, intensity));
    this.gain?.gain.setTargetAtTime(0.0001 + 0.075 * k * k, ctx.currentTime, 0.06);
    this.filter?.frequency.setTargetAtTime(500 + 2600 * k, ctx.currentTime, 0.08);
  }

  private start(ctx: AudioContext): void {
    try {
      this.src = audio.createNoiseSource();
      if (!this.src) return;
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'bandpass';
      this.filter.Q.value = 0.7;
      this.filter.frequency.value = 600;
      this.gain = ctx.createGain();
      this.gain.gain.value = 0.0001;
      this.src.connect(this.filter).connect(this.gain).connect(audio.loopBus);
      this.src.start();
    } catch {
      this.stop();
    }
  }

  stop(): void {
    const ctx = audio.ctx;
    try {
      if (ctx && this.gain) this.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
      this.src?.stop((ctx?.currentTime ?? 0) + 0.15);
    } catch {
      // already stopped
    }
    this.src = null;
    this.filter = null;
    this.gain = null;
  }
}
