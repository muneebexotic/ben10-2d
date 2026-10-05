import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** A dial-up warble that resolves into a three-note boot chime. */
export const upgradeTransform: SoundRecipe = (v) => {
  for (let i = 0; i < 6; i++) {
    A.tone({ type: 'square', freq: 900 + (i % 2) * 700, duration: 0.035, volume: 0.05 * v, when: A.now + i * 0.04, filter: { type: 'bandpass', freq: 1800, q: 2 } });
  }
  for (const [i, f] of [523, 784, 1047].entries()) {
    A.tone({ type: 'triangle', freq: f, duration: 0.16, volume: 0.11 * v, when: A.now + 0.26 + i * 0.07 });
  }
  A.noise({ duration: 0.2, volume: 0.08 * v, filter: 'highpass', freq: 5000, when: A.now + 0.24 });
};

/** The eye laser: a tight, bright zap. */
export const laserZap: SoundRecipe = (v, p) => {
  A.tone({ type: 'square', freq: 1700 * p, freqEnd: 620 * p, duration: 0.07, volume: 0.07 * v, filter: { type: 'lowpass', freq: 5200 } });
  A.tone({ type: 'sine', freq: 2400 * p, freqEnd: 1800 * p, duration: 0.05, volume: 0.05 * v });
};

/** The triple beam: the zap with a chorus behind it. */
export const laserTriple: SoundRecipe = (v, p) => {
  for (const d of [-14, 0, 14]) A.tone({ type: 'sawtooth', freq: 1500 * p, freqEnd: 500 * p, duration: 0.11, volume: 0.04 * v, detune: d, filter: { type: 'lowpass', freq: 4200 } });
  A.noise({ duration: 0.06, volume: 0.07 * v, filter: 'highpass', freq: 6000 });
};

/** Melting into a puddle: a wet gloop and a falling chirp. */
export const mergeIn: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 420 * p, freqEnd: 120 * p, duration: 0.16, volume: 0.22 * v });
  A.noise({ duration: 0.12, volume: 0.1 * v, filter: 'bandpass', freq: 900 * p, freqEnd: 300 * p, q: 3 });
  A.tone({ type: 'square', freq: 2200 * p, freqEnd: 900 * p, duration: 0.06, volume: 0.04 * v, when: A.now + 0.05 });
};

/** Pouring into a machine: the gloop, then a handshake of beeps as it powers up. */
export const mergeMachine: SoundRecipe = (v) => {
  mergeIn(v, 0.85);
  for (const [i, f] of [660, 990, 1320, 1980].entries()) A.tone({ type: 'square', freq: f, duration: 0.04, volume: 0.05 * v, when: A.now + 0.14 + i * 0.045 });
};

/** Popping back out: a rising slurp. */
export const mergeOut: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 160 * p, freqEnd: 520 * p, duration: 0.14, volume: 0.2 * v });
  A.noise({ duration: 0.08, volume: 0.08 * v, filter: 'bandpass', freq: 600 * p, freqEnd: 1600 * p, q: 3 });
};

/** The swap-in nanite splash: a crackle that drops into a low buzz. */
export const empSplash: SoundRecipe = (v) => {
  A.noise({ duration: 0.3, volume: 0.2 * v, filter: 'bandpass', freq: 3200, freqEnd: 600, q: 1.4 });
  A.tone({ type: 'sawtooth', freq: 220, freqEnd: 55, duration: 0.4, volume: 0.1 * v, filter: { type: 'lowpass', freq: 900 } });
  A.tone({ type: 'sine', freq: 90, freqEnd: 40, duration: 0.3, volume: 0.3 * v });
};

/**
 * Clean digital voicing: a fast square arpeggio, a crisp pulse lead with a
 * glassy fifth above, and driving 16th-note hats.
 */
export const UPGRADE_MUSIC: MusicLayerSpec = {
  arp: { wave: 'square', volume: 0.03, octave: 1, length: 0.5, filter: 5200 },
  lead: {
    wave: 'square',
    volume: 0.04,
    octave: 0,
    length: 1.2,
    filter: 3600,
    double: { wave: 'triangle', volume: 0.022, octave: 1, length: 1.1, filter: 0, detune: 702 },
  },
  hats16: 0.03,
};
