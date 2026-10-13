import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** Crystal growing over the boom: a cascade of glassy pings climbing, and a deep resonant hum. */
export const diamondheadTransform: SoundRecipe = (v) => {
  for (const [i, f] of [1568, 2093, 2637, 3136, 4186].entries()) {
    A.tone({ type: 'sine', freq: f, duration: 0.45, volume: 0.06 * v, when: A.now + i * 0.045 });
    A.tone({ type: 'triangle', freq: f * 1.5, duration: 0.2, volume: 0.025 * v, when: A.now + i * 0.045 + 0.01 });
  }
  A.tone({ type: 'sine', freq: 110, freqEnd: 82, duration: 0.6, volume: 0.22 * v });
  A.noise({ duration: 0.18, volume: 0.06 * v, filter: 'highpass', freq: 7000, when: A.now + 0.05 });
};

/** A shard leaving the fist: a short glassy zip. */
export const shardShot: SoundRecipe = (v, p) => {
  A.tone({ type: 'triangle', freq: 2600 * p, freqEnd: 1400 * p, duration: 0.07, volume: 0.07 * v });
  A.tone({ type: 'sine', freq: 3900 * p, duration: 0.09, volume: 0.035 * v, when: A.now + 0.01 });
  A.noise({ duration: 0.04, volume: 0.05 * v, filter: 'highpass', freq: 6000 });
};

/** The shield going up: a rising shimmer of glass. */
export const shieldUp: SoundRecipe = (v) => {
  for (let i = 0; i < 4; i++) A.tone({ type: 'sine', freq: 1200 + i * 420, duration: 0.18, volume: 0.04 * v, when: A.now + i * 0.03 });
  A.noise({ duration: 0.15, volume: 0.06 * v, filter: 'bandpass', freq: 5200, q: 3 });
};

/** A shot bouncing off the shield: a bright clang that rings. */
export const shieldClang: SoundRecipe = (v, p) => {
  A.tone({ type: 'square', freq: 1800 * p, freqEnd: 1200 * p, duration: 0.05, volume: 0.06 * v, filter: { type: 'bandpass', freq: 3000, q: 2 } });
  A.tone({ type: 'sine', freq: 2489 * p, duration: 0.5, volume: 0.07 * v });
  A.tone({ type: 'sine', freq: 3729 * p, duration: 0.35, volume: 0.04 * v });
  A.noise({ duration: 0.05, volume: 0.1 * v, filter: 'highpass', freq: 4500 });
};

/** A platform crackling into being. */
export const platformGrow: SoundRecipe = (v, p) => {
  for (let i = 0; i < 6; i++) A.tone({ type: 'triangle', freq: (900 + i * 260) * p, duration: 0.05, volume: 0.04 * v, when: A.now + i * 0.022 });
  A.tone({ type: 'sine', freq: 2093 * p, duration: 0.3, volume: 0.05 * v, when: A.now + 0.13 });
  A.noise({ duration: 0.12, volume: 0.05 * v, filter: 'bandpass', freq: 3000, freqEnd: 6000, q: 2 });
};

/** A single glassy ping (landings, absorbing a shard, a cracked shield). */
export const crystalChime: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 2093 * p, duration: 0.35, volume: 0.06 * v });
  A.tone({ type: 'sine', freq: 3136 * p, duration: 0.25, volume: 0.03 * v, when: A.now + 0.02 });
};

/** Spikes erupting: a gravel crunch under breaking glass. */
export const spikeBurst: SoundRecipe = (v) => {
  A.noise({ duration: 0.25, volume: 0.22 * v, filter: 'lowpass', freq: 900, freqEnd: 300 });
  A.tone({ type: 'sine', freq: 90, freqEnd: 45, duration: 0.3, volume: 0.3 * v });
  for (let i = 0; i < 5; i++) A.tone({ type: 'triangle', freq: 2000 + Math.random() * 2500, duration: 0.08, volume: 0.04 * v, when: A.now + 0.04 + i * 0.03 });
};

/**
 * Glass voicing: a bell-like sine arpeggio an octave up with a ringing
 * length, a triangle lead doubled a twelfth above (like struck crystal),
 * and soft high stabs.
 */
export const DIAMONDHEAD_MUSIC: MusicLayerSpec = {
  arp: { wave: 'sine', volume: 0.05, octave: 1, length: 2.4, filter: 0 },
  lead: {
    wave: 'triangle',
    volume: 0.05,
    octave: 0,
    length: 2.2,
    filter: 0,
    double: { wave: 'sine', volume: 0.022, octave: 1, length: 1.8, filter: 0, detune: 702 },
  },
  stabs: { steps: [0, 10], voice: { wave: 'sine', volume: 0.018, octave: 1, length: 3, filter: 0 } },
};
