import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** A snarl that rises into a full-throated bark. */
export const wildmuttTransform: SoundRecipe = (v) => {
  A.tone({ type: 'sawtooth', freq: 110, freqEnd: 240, duration: 0.3, volume: 0.16 * v, detune: 30, filter: { type: 'lowpass', freq: 1100 } });
  A.noise({ duration: 0.3, volume: 0.14 * v, filter: 'bandpass', freq: 600, freqEnd: 1400, q: 2 });
  A.tone({ type: 'square', freq: 260, freqEnd: 150, duration: 0.22, volume: 0.1 * v, when: A.now + 0.3, filter: { type: 'lowpass', freq: 1400 } });
  A.noise({ duration: 0.18, volume: 0.22 * v, filter: 'bandpass', freq: 900, freqEnd: 400, q: 1.5, when: A.now + 0.3 });
};

/** The swap-in roar: a wall of growl with a bark on top. */
export const roarSound: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 90 * p, freqEnd: 150 * p, duration: 0.55, volume: 0.2 * v, detune: 40, filter: { type: 'lowpass', freq: 900 } });
  A.tone({ type: 'square', freq: 180 * p, freqEnd: 120 * p, duration: 0.5, volume: 0.07 * v, detune: 25 });
  A.noise({ duration: 0.55, volume: 0.22 * v, filter: 'bandpass', freq: 500 * p, freqEnd: 1100 * p, q: 1.2 });
  A.tone({ type: 'sine', freq: 70, freqEnd: 35, duration: 0.4, volume: 0.35 * v });
};

export const clawSwipe: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.07, volume: 0.13 * v, filter: 'bandpass', freq: 2200 * p, freqEnd: 4800 * p, q: 2.5 });
};

export const clawHit: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.08, volume: 0.24 * v, filter: 'bandpass', freq: 1800 * p, freqEnd: 700 * p, q: 1.6 });
  A.tone({ type: 'square', freq: 420 * p, freqEnd: 160 * p, duration: 0.06, volume: 0.1 * v });
  A.tone({ type: 'sine', freq: 140 * p, freqEnd: 60, duration: 0.12, volume: 0.25 * v });
};

export const pounceLeap: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.2, volume: 0.18 * v, filter: 'bandpass', freq: 900 * p, freqEnd: 2600 * p, q: 1.2 });
  A.tone({ type: 'sawtooth', freq: 160 * p, freqEnd: 300 * p, duration: 0.16, volume: 0.07 * v, filter: { type: 'lowpass', freq: 1200 } });
};

/** Landing on something's back: a crunching thump and a snarl. */
export const pounceLand: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 160 * p, freqEnd: 45, duration: 0.22, volume: 0.5 * v });
  A.noise({ duration: 0.14, volume: 0.32 * v, filter: 'lowpass', freq: 2600, freqEnd: 300 });
  A.tone({ type: 'sawtooth', freq: 130 * p, freqEnd: 95 * p, duration: 0.25, volume: 0.1 * v, detune: 30, when: A.now + 0.05, filter: { type: 'lowpass', freq: 900 } });
};

/** Claws biting into a wall. */
export const wallScratch: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.09, volume: 0.11 * v, filter: 'highpass', freq: 2600 * p, freqEnd: 1800 * p });
  A.noise({ duration: 0.04, volume: 0.07 * v, filter: 'bandpass', freq: 5200 * p, q: 3, when: A.now + 0.05 });
};

/** Two quick snuffles through the gills. */
export const sniff: SoundRecipe = (v, p) => {
  for (let i = 0; i < 2; i++) A.noise({ duration: 0.07, volume: 0.07 * v, filter: 'bandpass', freq: 1400 * p + i * 300, q: 2.2, when: A.now + i * 0.11 });
};

/** Senses lock onto something hidden: a low hum with a bright ping. */
export const senseFound: SoundRecipe = (v) => {
  A.tone({ type: 'sine', freq: 220, freqEnd: 330, duration: 0.4, volume: 0.12 * v });
  A.tone({ type: 'triangle', freq: 1320, duration: 0.25, volume: 0.06 * v, when: A.now + 0.08 });
};

/** Pounding tribal toms, a growling low lead and a sparse arp. */
export const WILDMUTT_MUSIC: MusicLayerSpec = {
  arp: { wave: 'triangle', volume: 0.026, octave: 0, length: 0.6, filter: 2600, thin: true },
  lead: {
    wave: 'sawtooth',
    volume: 0.036,
    octave: -1,
    length: 1.4,
    filter: 1600,
    double: { wave: 'square', volume: 0.016, octave: 0, length: 1, filter: 2200, detune: -10 },
  },
  toms: { steps: [0, 3, 6, 10, 12, 14], volume: 0.26 },
};
