import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** Plates clattering shut over the boom, a deep metal gong and a rattle like a ball spinning up. */
export const ricochetTransform: SoundRecipe = (v) => {
  A.tone({ type: 'triangle', freq: 180, freqEnd: 120, duration: 0.9, volume: 0.2 * v, attack: 0.005 });
  A.tone({ type: 'sine', freq: 361, freqEnd: 350, duration: 0.7, volume: 0.08 * v, when: A.now + 0.01 });
  for (let i = 0; i < 7; i++) {
    A.noise({ duration: 0.03, volume: (0.12 - i * 0.012) * v, filter: 'bandpass', freq: 2400 + i * 300, q: 3, when: A.now + 0.12 + i * 0.045 });
  }
  A.tone({ type: 'square', freq: 90, freqEnd: 240, duration: 0.4, volume: 0.05 * v, filter: { type: 'lowpass', freq: 900 }, when: A.now + 0.2 });
};

/** A shell bash: a hard metallic thunk. */
export const shellThunk: SoundRecipe = (v, p) => {
  A.tone({ type: 'triangle', freq: 220 * p, freqEnd: 90 * p, duration: 0.12, volume: 0.22 * v });
  A.noise({ duration: 0.06, volume: 0.18 * v, filter: 'bandpass', freq: 1800 * p, q: 2.5 });
};

/** Curling up: plates sliding over each other and locking. */
export const curlClack: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.12, volume: 0.14 * v, filter: 'highpass', freq: 2600 * p, freqEnd: 1200 });
  A.tone({ type: 'square', freq: 520 * p, freqEnd: 260 * p, duration: 0.05, volume: 0.06 * v, when: A.now + 0.09 });
  A.tone({ type: 'triangle', freq: 160 * p, duration: 0.08, volume: 0.12 * v, when: A.now + 0.1 });
};

/** A wall hit at speed: BONK, a cartoon gong with a wobble. */
export const bonk: SoundRecipe = (v, p) => {
  A.tone({ type: 'triangle', freq: 300 * p, freqEnd: 150 * p, duration: 0.35, volume: 0.2 * v });
  // Two voices a little apart beat against each other: the gong's wobble.
  A.tone({ type: 'triangle', freq: 300 * p, freqEnd: 150 * p, duration: 0.35, volume: 0.1 * v, detune: 38 });
  A.tone({ type: 'sine', freq: 620 * p, freqEnd: 590 * p, duration: 0.25, volume: 0.07 * v });
  A.noise({ duration: 0.05, volume: 0.16 * v, filter: 'lowpass', freq: 1400 });
};

/** A bounce off the floor: a springy boing, pitched up the higher the chain goes. */
export const boing: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 180 * p, freqEnd: 520 * p, duration: 0.22, volume: 0.14 * v });
  A.tone({ type: 'sine', freq: 180 * p, freqEnd: 520 * p, duration: 0.22, volume: 0.08 * v, detune: 45 });
  A.tone({ type: 'triangle', freq: 90 * p, freqEnd: 60, duration: 0.1, volume: 0.14 * v });
};

/** Rolling: a low rumble tick (the faster he goes, the closer together). */
export const rollRumble: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.09, volume: 0.07 * v, filter: 'lowpass', freq: 380 * p, freqEnd: 220 });
  A.tone({ type: 'sine', freq: 55 * p, duration: 0.08, volume: 0.06 * v });
};

/** SPIN BOOST: a whirr spinning up. */
export const spinWhirr: SoundRecipe = (v) => {
  A.tone({ type: 'sawtooth', freq: 120, freqEnd: 680, duration: 0.28, volume: 0.07 * v, filter: { type: 'lowpass', freq: 2200 } });
  A.noise({ duration: 0.3, volume: 0.12 * v, filter: 'bandpass', freq: 900, freqEnd: 3200, q: 1.2 });
};

/** SHELL DROP's landing: a heavy crash and a ringing plate. */
export const shellCrash: SoundRecipe = (v) => {
  A.noise({ duration: 0.5, volume: 0.34 * v, filter: 'lowpass', freq: 1800, freqEnd: 140 });
  A.tone({ type: 'sine', freq: 80, freqEnd: 34, duration: 0.45, volume: 0.36 * v });
  A.tone({ type: 'triangle', freq: 410, freqEnd: 395, duration: 0.5, volume: 0.06 * v, when: A.now + 0.03 });
};

/** Swap-in: he arrives already rolling, a whoosh into a crash of pins. */
export const bowlingRush: SoundRecipe = (v) => {
  A.noise({ duration: 0.35, volume: 0.2 * v, filter: 'bandpass', freq: 500, freqEnd: 1800, q: 1 });
  for (let i = 0; i < 5; i++) A.noise({ duration: 0.04, volume: 0.1 * v, filter: 'bandpass', freq: 3000 - i * 250, q: 4, when: A.now + 0.28 + i * 0.03 });
};

/**
 * Bouncy: a plucky square arpeggio an octave up that hops, a triangle lead
 * with a springy vibrato, and tight toms on the offbeats like a ball skipping.
 */
export const RICOCHET_MUSIC: MusicLayerSpec = {
  arp: { wave: 'square', volume: 0.026, octave: 1, length: 0.35, filter: 2600 },
  lead: { wave: 'triangle', volume: 0.07, octave: 0, length: 0.9, filter: 0, double: { wave: 'square', volume: 0.014, octave: 1, length: 0.5, filter: 2000, detune: 4 } },
  toms: { steps: [3, 7, 11, 15], volume: 0.09 },
};
