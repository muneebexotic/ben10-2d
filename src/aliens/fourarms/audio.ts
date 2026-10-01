import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** A chest-beating bellow over a ground-shaking thud. */
export const fourArmsTransform: SoundRecipe = (v) => {
  A.tone({ type: 'sawtooth', freq: 95, freqEnd: 70, duration: 0.55, volume: 0.22 * v, filter: { type: 'lowpass', freq: 700 }, attack: 0.04 });
  A.tone({ type: 'square', freq: 190, freqEnd: 140, duration: 0.45, volume: 0.07 * v, detune: 18 });
  A.tone({ type: 'sine', freq: 70, freqEnd: 28, duration: 0.5, volume: 0.55 * v, when: A.now + 0.12 });
  A.noise({ duration: 0.3, volume: 0.3 * v, filter: 'lowpass', freq: 900, freqEnd: 90, when: A.now + 0.12 });
};

export const heavySwing: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.13, volume: 0.18 * v, filter: 'bandpass', freq: 500 * p, freqEnd: 1300 * p, q: 1.1 });
};

export const heavyHit: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 150 * p, freqEnd: 45, duration: 0.24, volume: 0.55 * v });
  A.tone({ type: 'square', freq: 120 * p, freqEnd: 60, duration: 0.12, volume: 0.18 * v });
  A.noise({ duration: 0.16, volume: 0.35 * v, filter: 'lowpass', freq: 2200, freqEnd: 250 });
};

export const clapBoom: SoundRecipe = (v) => {
  A.noise({ duration: 0.06, volume: 0.5 * v, filter: 'highpass', freq: 1500 });
  A.noise({ duration: 0.45, volume: 0.3 * v, filter: 'bandpass', freq: 900, freqEnd: 200, q: 0.6, when: A.now + 0.03 });
  A.tone({ type: 'sine', freq: 120, freqEnd: 50, duration: 0.3, volume: 0.35 * v, when: A.now + 0.02 });
};

/** Ground slam: the floor itself booms. */
export const quake: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 85 * p, freqEnd: 24, duration: 0.8, volume: 0.7 * v });
  A.noise({ duration: 0.7, volume: 0.5 * v, filter: 'lowpass', freq: 1600, freqEnd: 60 });
  A.tone({ type: 'square', freq: 60 * p, freqEnd: 35, duration: 0.3, volume: 0.15 * v, detune: 20 });
};

export const plunge: SoundRecipe = (v) => {
  A.noise({ duration: 0.35, volume: 0.2 * v, filter: 'bandpass', freq: 2400, freqEnd: 500, q: 1.4 });
};

export const thud: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 95 * p, freqEnd: 45, duration: 0.14, volume: 0.32 * v });
  A.noise({ duration: 0.06, volume: 0.12 * v, filter: 'lowpass', freq: 600 });
};

/** Stomping power chords on the downbeats, floor toms, and a low growling lead. */
export const FOURARMS_MUSIC: MusicLayerSpec = {
  arp: { wave: 'triangle', volume: 0.03, octave: -1, length: 0.8, filter: 2000, thin: true },
  lead: {
    wave: 'square',
    volume: 0.042,
    octave: -1,
    length: 1.9,
    filter: 2200,
    double: { wave: 'sawtooth', volume: 0.022, octave: 0, length: 1.6, filter: 1800, detune: -8 },
  },
  stabs: { steps: [0, 6, 8, 14], voice: { wave: 'sawtooth', volume: 0.026, octave: 0, length: 1.2, filter: 1300 } },
  toms: { steps: [4, 12], volume: 0.32 },
};

