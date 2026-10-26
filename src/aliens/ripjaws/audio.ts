import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** A rush of water over the boom, a deep whale-call groan and a bubbling roar. */
export const ripjawsTransform: SoundRecipe = (v) => {
  A.noise({ duration: 0.7, volume: 0.28 * v, filter: 'lowpass', freq: 2600, freqEnd: 300 });
  A.tone({ type: 'sine', freq: 110, freqEnd: 180, duration: 0.5, volume: 0.22 * v, attack: 0.08, when: A.now + 0.05 });
  A.tone({ type: 'sawtooth', freq: 70, freqEnd: 52, duration: 0.6, volume: 0.1 * v, filter: { type: 'lowpass', freq: 600 }, when: A.now + 0.12 });
  for (let i = 0; i < 6; i++) A.tone({ type: 'sine', freq: 600 + i * 140, freqEnd: 1100 + i * 160, duration: 0.05, volume: 0.04 * v, when: A.now + 0.2 + i * 0.05 });
};

/** Jaws snapping shut: a hard clack with a wet crunch. */
export const chompSnap: SoundRecipe = (v, p) => {
  A.tone({ type: 'square', freq: 420 * p, freqEnd: 140 * p, duration: 0.07, volume: 0.12 * v });
  A.noise({ duration: 0.09, volume: 0.22 * v, filter: 'bandpass', freq: 2200 * p, freqEnd: 700, q: 1.3 });
  A.tone({ type: 'sine', freq: 120 * p, freqEnd: 60, duration: 0.12, volume: 0.25 * v });
};

/** The tail whip: a fat wet whoosh and a slap. */
export const tailWhoosh: SoundRecipe = (v) => {
  A.noise({ duration: 0.28, volume: 0.2 * v, filter: 'bandpass', freq: 400, freqEnd: 1600, q: 0.9 });
  A.noise({ duration: 0.08, volume: 0.25 * v, filter: 'highpass', freq: 2000, when: A.now + 0.18 });
};

/** RIP DASH: a torpedo's rush and a trail of bubbles. */
export const ripDashRush: SoundRecipe = (v) => {
  A.noise({ duration: 0.45, volume: 0.24 * v, filter: 'lowpass', freq: 600, freqEnd: 2400 });
  A.tone({ type: 'sawtooth', freq: 90, freqEnd: 220, duration: 0.3, volume: 0.08 * v, filter: { type: 'lowpass', freq: 900 } });
  for (let i = 0; i < 5; i++) A.tone({ type: 'sine', freq: 900 + i * 220, duration: 0.04, volume: 0.035 * v, when: A.now + 0.08 + i * 0.05 });
};

/** Out of water: a dry, wheezing gasp. */
export const gaspHuff: SoundRecipe = (v) => {
  A.noise({ duration: 0.3, volume: 0.14 * v, filter: 'bandpass', freq: 1500, freqEnd: 700, q: 1.6 });
  A.noise({ duration: 0.25, volume: 0.1 * v, filter: 'bandpass', freq: 1100, freqEnd: 1700, q: 1.6, when: A.now + 0.35 });
};

/** Swap-in: a wave crashing out of nowhere. */
export const waterBurst: SoundRecipe = (v) => {
  A.noise({ duration: 0.6, volume: 0.4 * v, filter: 'lowpass', freq: 3000, freqEnd: 200 });
  A.tone({ type: 'sine', freq: 90, freqEnd: 40, duration: 0.4, volume: 0.4 * v });
};

/**
 * Deep and rolling: a low, slow triangle arpeggio an octave down, a sine
 * lead like a whale song doubled by a soft square, and rolling toms.
 */
export const RIPJAWS_MUSIC: MusicLayerSpec = {
  arp: { wave: 'triangle', volume: 0.032, octave: -1, length: 1.1, filter: 1500 },
  lead: { wave: 'sine', volume: 0.06, octave: 0, length: 2.2, filter: 0, double: { wave: 'square', volume: 0.016, octave: -1, length: 1.8, filter: 1400, detune: 6 } },
  toms: { steps: [10, 12, 14], volume: 0.1 },
};
