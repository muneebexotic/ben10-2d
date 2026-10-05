import { AUDIO } from '../../config/audio';
import { audio, midiToFreq } from './AudioEngine';

/** A synthesized sound: `v` scales volume, `p` scales pitch. Aliens define their own in their audio module. */
export type SoundRecipe = (v: number, p: number) => void;
type Recipe = SoundRecipe;

const A = audio;

/** Sound recipes. `v` scales volume, `p` scales pitch. */
const RECIPES = {
  jump: (v, p) => A.tone({ type: 'square', freq: 260 * p, freqEnd: 520 * p, duration: 0.11, volume: 0.12 * v }),
  land: (v) => A.noise({ duration: 0.08, volume: 0.18 * v, filter: 'lowpass', freq: 500, freqEnd: 120 }),
  step: (v) => A.noise({ duration: 0.03, volume: 0.05 * v, filter: 'lowpass', freq: 900 }),
  swing: (v, p) => A.noise({ duration: 0.09, volume: 0.14 * v, filter: 'bandpass', freq: 1400 * p, freqEnd: 3000 * p, q: 1.5 }),
  punchHit: (v, p) => {
    A.tone({ type: 'square', freq: 180 * p, freqEnd: 60 * p, duration: 0.1, volume: 0.28 * v });
    A.noise({ duration: 0.07, volume: 0.25 * v, filter: 'lowpass', freq: 2500, freqEnd: 400 });
  },
  roll: (v) => A.noise({ duration: 0.2, volume: 0.12 * v, filter: 'bandpass', freq: 600, freqEnd: 1800, q: 1 }),
  fireball: (v, p) => {
    A.noise({ duration: 0.14, volume: 0.16 * v, filter: 'bandpass', freq: 2200 * p, freqEnd: 700 * p, q: 1.2 });
    A.tone({ type: 'sawtooth', freq: 420 * p, freqEnd: 180 * p, duration: 0.1, volume: 0.06 * v });
  },
  fireHit: (v, p) => {
    A.noise({ duration: 0.18, volume: 0.22 * v, filter: 'lowpass', freq: 3000 * p, freqEnd: 300 });
    A.tone({ type: 'square', freq: 220 * p, freqEnd: 90 * p, duration: 0.08, volume: 0.12 * v });
  },
  burst: (v, p) => {
    A.noise({ duration: 0.6, volume: 0.45 * v, filter: 'lowpass', freq: 5000 * p, freqEnd: 150 });
    A.tone({ type: 'sine', freq: 160 * p, freqEnd: 40, duration: 0.5, volume: 0.45 * v });
    A.tone({ type: 'sawtooth', freq: 880 * p, freqEnd: 220 * p, duration: 0.25, volume: 0.08 * v });
  },
  rocket: (v, p) => {
    A.noise({ duration: 0.35, volume: 0.3 * v, filter: 'bandpass', freq: 400 * p, freqEnd: 2600 * p, q: 0.9 });
    A.tone({ type: 'sine', freq: 90 * p, freqEnd: 45, duration: 0.25, volume: 0.35 * v });
  },
  transformCharge: (v) => {
    A.tone({ type: 'sawtooth', freq: 180, freqEnd: 1400, duration: 0.42, volume: 0.1 * v, filter: { type: 'lowpass', freq: 3000 } });
    A.tone({ type: 'square', freq: 360, freqEnd: 2800, duration: 0.42, volume: 0.05 * v, detune: 7 });
  },
  transformBoom: (v) => {
    A.tone({ type: 'sine', freq: 120, freqEnd: 35, duration: 0.7, volume: 0.55 * v });
    A.noise({ duration: 0.5, volume: 0.3 * v, filter: 'lowpass', freq: 6000, freqEnd: 200 });
    for (const [i, n] of [69, 76, 81].entries()) {
      A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.5, volume: 0.07 * v, when: A.now + i * 0.03, detune: 6 });
    }
    A.tone({ type: 'triangle', freq: midiToFreq(93), duration: 0.8, volume: 0.1 * v, when: A.now + 0.05 });
  },
  swap: (v) => {
    A.tone({ type: 'square', freq: 520, freqEnd: 2100, duration: 0.09, volume: 0.07 * v });
    A.tone({ type: 'sine', freq: 150, freqEnd: 55, duration: 0.22, volume: 0.4 * v, when: A.now + 0.05 });
    A.noise({ duration: 0.1, volume: 0.16 * v, filter: 'highpass', freq: 3500, when: A.now + 0.04 });
    A.tone({ type: 'triangle', freq: midiToFreq(88), duration: 0.18, volume: 0.06 * v, when: A.now + 0.06 });
  },
  /** The misfire: a DJ scratch ("wicka-wicka") and the needle lifting off the record. */
  recordScratch: (v) => {
    const t = A.now;
    const scrub = (when: number, from: number, to: number, dur: number) => {
      A.noise({ duration: dur, volume: 0.42 * v, filter: 'bandpass', freq: from, freqEnd: to, q: 3, when: t + when });
      A.tone({ type: 'sawtooth', freq: from / 6, freqEnd: to / 6, duration: dur, volume: 0.1 * v, filter: { type: 'bandpass', freq: 800, q: 1.2 }, when: t + when });
    };
    scrub(0, 380, 3400, 0.08);
    scrub(0.08, 3600, 260, 0.13);
    scrub(0.22, 420, 2600, 0.06);
    scrub(0.28, 2800, 160, 0.2);
    A.noise({ duration: 0.025, volume: 0.3 * v, filter: 'highpass', freq: 3500, when: t + 0.5 });
  },
  /** The Omnitrix sputtering before a misfire: the tell. */
  omnitrixGlitch: (v) => {
    for (let i = 0; i < 5; i++) {
      const when = A.now + i * 0.05;
      A.tone({ type: 'square', freq: 1500 - i * 210 + (i % 2) * 380, duration: 0.035, volume: 0.07 * v, when });
      A.noise({ duration: 0.03, volume: 0.1 * v, filter: 'bandpass', freq: 2600 - i * 300, q: 8, when });
    }
  },
  /** Rolled with the wrong alien and got a KO: a cheeky little "ta-daa". */
  improvise: (v) => {
    A.tone({ type: 'square', freq: midiToFreq(79), duration: 0.08, volume: 0.08 * v });
    A.tone({ type: 'square', freq: midiToFreq(84), duration: 0.08, volume: 0.08 * v, when: A.now + 0.08 });
    A.tone({ type: 'triangle', freq: midiToFreq(91), duration: 0.4, volume: 0.12 * v, when: A.now + 0.16 });
    A.tone({ type: 'square', freq: midiToFreq(86), duration: 0.36, volume: 0.05 * v, when: A.now + 0.16, detune: 8 });
  },
  tag: (v, p) => {
    for (const [i, n] of [79, 84, 88].entries()) A.tone({ type: 'square', freq: midiToFreq(n) * p, duration: 0.09, volume: 0.07 * v, when: A.now + i * 0.05 });
    A.tone({ type: 'triangle', freq: midiToFreq(91) * p, duration: 0.35, volume: 0.08 * v, when: A.now + 0.15 });
  },
  revert: (v) => {
    A.tone({ type: 'sawtooth', freq: 900, freqEnd: 110, duration: 0.55, volume: 0.12 * v, filter: { type: 'lowpass', freq: 2500 } });
    A.tone({ type: 'square', freq: 440, freqEnd: 90, duration: 0.45, volume: 0.06 * v, detune: -10 });
    A.noise({ duration: 0.3, volume: 0.12 * v, filter: 'highpass', freq: 3000 });
  },
  beep: (v, p) => A.tone({ type: 'square', freq: 1320 * p, duration: 0.07, volume: 0.1 * v }),
  beepFinal: (v) => {
    A.tone({ type: 'square', freq: 1320, duration: 0.07, volume: 0.12 * v });
    A.tone({ type: 'square', freq: 1320, duration: 0.07, volume: 0.12 * v, when: A.now + 0.11 });
  },
  ready: (v) => {
    A.tone({ type: 'square', freq: midiToFreq(81), duration: 0.09, volume: 0.1 * v });
    A.tone({ type: 'square', freq: midiToFreq(88), duration: 0.16, volume: 0.1 * v, when: A.now + 0.09 });
  },
  denied: (v) => A.tone({ type: 'square', freq: 140, freqEnd: 110, duration: 0.16, volume: 0.14 * v }),
  jammed: (v) => {
    A.noise({ duration: 0.3, volume: 0.2 * v, filter: 'bandpass', freq: 1800, q: 6 });
    A.tone({ type: 'sawtooth', freq: 70, duration: 0.3, volume: 0.12 * v });
  },
  laser: (v, p) => A.tone({ type: 'square', freq: 1400 * p, freqEnd: 260 * p, duration: 0.14, volume: 0.07 * v }),
  laserCharge: (v, p) => A.tone({ type: 'sine', freq: 300 * p, freqEnd: 1200 * p, duration: 0.5, volume: 0.05 * v }),
  diveLock: (v) => A.tone({ type: 'sawtooth', freq: 500, freqEnd: 1500, duration: 0.55, volume: 0.05 * v, filter: { type: 'lowpass', freq: 2200 } }),
  dive: (v) => A.noise({ duration: 0.3, volume: 0.15 * v, filter: 'bandpass', freq: 3000, freqEnd: 800, q: 2 }),
  droneDown: (v) => {
    A.tone({ type: 'square', freq: 700, freqEnd: 90, duration: 0.35, volume: 0.08 * v });
    A.noise({ duration: 0.2, volume: 0.15 * v, filter: 'bandpass', freq: 1500, q: 4 });
  },
  grab: (v) => {
    A.noise({ duration: 0.08, volume: 0.2 * v, filter: 'lowpass', freq: 1800 });
    A.tone({ type: 'square', freq: 160, freqEnd: 240, duration: 0.1, volume: 0.12 * v });
  },
  throw: (v, p) => {
    A.noise({ duration: 0.25, volume: 0.25 * v, filter: 'bandpass', freq: 500 * p, freqEnd: 2200 * p, q: 1 });
    A.tone({ type: 'sine', freq: 180 * p, freqEnd: 90, duration: 0.15, volume: 0.25 * v });
  },
  armorTink: (v, p) => {
    A.tone({ type: 'triangle', freq: 1900 * p, duration: 0.12, volume: 0.08 * v });
    A.tone({ type: 'square', freq: 2850 * p, duration: 0.05, volume: 0.04 * v });
  },
  armorCrack: (v) => {
    A.noise({ duration: 0.18, volume: 0.35 * v, filter: 'highpass', freq: 1200, freqEnd: 400 });
    A.tone({ type: 'square', freq: 220, freqEnd: 80, duration: 0.12, volume: 0.18 * v });
  },
  armorBreak: (v) => {
    A.noise({ duration: 0.6, volume: 0.45 * v, filter: 'lowpass', freq: 5000, freqEnd: 200 });
    A.tone({ type: 'square', freq: 400, freqEnd: 60, duration: 0.4, volume: 0.15 * v });
    for (const [i, n] of [76, 72, 69].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.12, volume: 0.06 * v, when: A.now + 0.1 + i * 0.06 });
  },
  ramCharge: (v) => A.tone({ type: 'sawtooth', freq: 60, freqEnd: 180, duration: 0.7, volume: 0.12 * v, filter: { type: 'lowpass', freq: 700 } }),
  cannon: (v) => {
    A.tone({ type: 'sine', freq: 140, freqEnd: 50, duration: 0.3, volume: 0.4 * v });
    A.noise({ duration: 0.2, volume: 0.25 * v, filter: 'lowpass', freq: 2000, freqEnd: 300 });
  },
  buzz: (v) => A.tone({ type: 'sawtooth', freq: 180, freqEnd: 420, duration: 0.4, volume: 0.06 * v, detune: 25, filter: { type: 'bandpass', freq: 900, q: 3 } }),
  hornetDash: (v) => A.noise({ duration: 0.25, volume: 0.18 * v, filter: 'bandpass', freq: 4200, freqEnd: 1400, q: 3 }),
  dummyHit: (v, p) => {
    A.tone({ type: 'square', freq: 320 * p, freqEnd: 180 * p, duration: 0.08, volume: 0.1 * v });
    A.tone({ type: 'triangle', freq: 1200 * p, duration: 0.06, volume: 0.05 * v });
    A.noise({ duration: 0.05, volume: 0.12 * v, filter: 'highpass', freq: 2500 });
  },
  rockBreak: (v) => {
    A.noise({ duration: 0.5, volume: 0.45 * v, filter: 'lowpass', freq: 2200, freqEnd: 120 });
    A.tone({ type: 'sine', freq: 110, freqEnd: 40, duration: 0.35, volume: 0.4 * v });
  },
  whiff: (v) => A.noise({ duration: 0.08, volume: 0.1 * v, filter: 'bandpass', freq: 2600, freqEnd: 5200, q: 2 }),
  droneHit: (v, p) => {
    A.tone({ type: 'square', freq: 520 * p, freqEnd: 260 * p, duration: 0.06, volume: 0.1 * v });
    A.noise({ duration: 0.05, volume: 0.12 * v, filter: 'highpass', freq: 2500 });
  },
  explode: (v, p) => {
    A.noise({ duration: 0.45, volume: 0.4 * v, filter: 'lowpass', freq: 3500 * p, freqEnd: 90 });
    A.tone({ type: 'sine', freq: 110 * p, freqEnd: 30, duration: 0.35, volume: 0.35 * v });
  },
  bigExplode: (v) => {
    A.noise({ duration: 1.4, volume: 0.6 * v, filter: 'lowpass', freq: 4000, freqEnd: 60 });
    A.tone({ type: 'sine', freq: 80, freqEnd: 24, duration: 1.2, volume: 0.6 * v });
  },
  hurt: (v) => {
    A.tone({ type: 'square', freq: 440, freqEnd: 120, duration: 0.22, volume: 0.16 * v });
    A.noise({ duration: 0.12, volume: 0.18 * v, filter: 'lowpass', freq: 1600 });
  },
  heal: (v) => {
    for (const [i, n] of [72, 76, 79, 84].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.14, volume: 0.14 * v, when: A.now + i * 0.06 });
  },
  card: (v) => {
    for (const [i, n] of [76, 79, 83, 88, 91].entries()) A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.12, volume: 0.08 * v, when: A.now + i * 0.07 });
    A.tone({ type: 'triangle', freq: midiToFreq(100), duration: 0.5, volume: 0.08 * v, when: A.now + 0.35 });
  },
  checkpoint: (v) => {
    A.tone({ type: 'triangle', freq: midiToFreq(72), duration: 0.12, volume: 0.14 * v });
    A.tone({ type: 'triangle', freq: midiToFreq(79), duration: 0.25, volume: 0.14 * v, when: A.now + 0.1 });
  },
  pod: (v) => {
    for (const [i, n] of [69, 72, 76, 81].entries()) A.tone({ type: 'sine', freq: midiToFreq(n), duration: 0.9, volume: 0.07 * v, when: A.now + i * 0.12 });
  },
  clamp: (v) => {
    A.tone({ type: 'square', freq: 90, freqEnd: 50, duration: 0.15, volume: 0.35 * v });
    A.noise({ duration: 0.06, volume: 0.3 * v, filter: 'highpass', freq: 2000 });
  },
  roar: (v) => {
    A.tone({ type: 'sawtooth', freq: 70, freqEnd: 40, duration: 1.1, volume: 0.35 * v, filter: { type: 'lowpass', freq: 900 } });
    A.tone({ type: 'square', freq: 140, freqEnd: 95, duration: 1.0, volume: 0.1 * v, detune: 20 });
    A.noise({ duration: 1.0, volume: 0.15 * v, filter: 'bandpass', freq: 500, q: 2 });
  },
  slam: (v) => {
    A.tone({ type: 'sine', freq: 70, freqEnd: 28, duration: 0.6, volume: 0.6 * v });
    A.noise({ duration: 0.5, volume: 0.4 * v, filter: 'lowpass', freq: 1400, freqEnd: 80 });
  },
  beamCharge: (v) => A.tone({ type: 'sawtooth', freq: 120, freqEnd: 900, duration: 1.0, volume: 0.1 * v, filter: { type: 'lowpass', freq: 1800 } }),
  beamFire: (v) => {
    A.noise({ duration: 0.45, volume: 0.35 * v, filter: 'bandpass', freq: 900, q: 0.7 });
    A.tone({ type: 'sawtooth', freq: 220, duration: 0.45, volume: 0.15 * v, detune: 30 });
  },
  whistle: (v, p) => A.tone({ type: 'sine', freq: 1800 * p, freqEnd: 500 * p, duration: 0.6, volume: 0.05 * v }),
  alarm: (v) => {
    for (let i = 0; i < 3; i++) {
      A.tone({ type: 'square', freq: 660, freqEnd: 440, duration: 0.25, volume: 0.07 * v, when: A.now + i * 0.3 });
    }
  },
  uiMove: (v) => A.tone({ type: 'square', freq: 700, duration: 0.04, volume: 0.07 * v }),
  uiSelect: (v) => {
    A.tone({ type: 'square', freq: midiToFreq(76), duration: 0.07, volume: 0.1 * v });
    A.tone({ type: 'square', freq: midiToFreq(83), duration: 0.12, volume: 0.1 * v, when: A.now + 0.07 });
  },
  uiBack: (v) => {
    A.tone({ type: 'square', freq: midiToFreq(83), duration: 0.06, volume: 0.08 * v });
    A.tone({ type: 'square', freq: midiToFreq(76), duration: 0.1, volume: 0.08 * v, when: A.now + 0.06 });
  },
  /** A bigger "yes": starting a file, a chapter, a difficulty. The Omnitrix powering up. */
  uiConfirm: (v) => {
    A.tone({ type: 'sawtooth', freq: 260, freqEnd: 1300, duration: 0.18, volume: 0.06 * v, filter: { type: 'lowpass', freq: 2600 } });
    for (const [i, n] of [72, 79, 84].entries()) A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.1, volume: 0.08 * v, when: A.now + 0.08 + i * 0.05 });
    A.tone({ type: 'triangle', freq: midiToFreq(91), duration: 0.35, volume: 0.1 * v, when: A.now + 0.23 });
  },
  /** Screen-to-screen transition. */
  whoosh: (v) => A.noise({ duration: 0.28, volume: 0.16 * v, filter: 'bandpass', freq: 500, freqEnd: 3200, q: 1.2, attack: 0.08 }),
  /** A save file being wiped. */
  erase: (v) => {
    A.tone({ type: 'sawtooth', freq: 600, freqEnd: 60, duration: 0.5, volume: 0.1 * v, filter: { type: 'lowpass', freq: 1800 } });
    A.noise({ duration: 0.4, volume: 0.18 * v, filter: 'highpass', freq: 2000, freqEnd: 300 });
  },
  /** A chapter title decoding on Chapter Select. */
  reveal: (v) => {
    for (const [i, n] of [76, 81, 83, 88].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.16, volume: 0.09 * v, when: A.now + i * 0.08 });
    A.tone({ type: 'sine', freq: midiToFreq(95), duration: 0.8, volume: 0.07 * v, when: A.now + 0.32 });
  },
  tick: (v, p) => A.tone({ type: 'square', freq: 1100 * p, duration: 0.025, volume: 0.06 * v }),
  stamp: (v) => {
    A.tone({ type: 'sine', freq: 100, freqEnd: 40, duration: 0.4, volume: 0.5 * v });
    A.noise({ duration: 0.25, volume: 0.35 * v, filter: 'lowpass', freq: 2500, freqEnd: 200 });
  },
  parry: (v) => {
    A.tone({ type: 'square', freq: midiToFreq(96), duration: 0.12, volume: 0.1 * v });
    A.tone({ type: 'triangle', freq: midiToFreq(103), duration: 0.25, volume: 0.1 * v, when: A.now + 0.03 });
    A.noise({ duration: 0.06, volume: 0.2 * v, filter: 'highpass', freq: 4000 });
  },
  splash: (v) => A.noise({ duration: 0.4, volume: 0.3 * v, filter: 'bandpass', freq: 1200, freqEnd: 400, q: 0.7 }),
  burn: (v) => A.noise({ duration: 0.9, volume: 0.3 * v, filter: 'bandpass', freq: 800, freqEnd: 2400, q: 0.6 }),
  gateDown: (v) => {
    A.tone({ type: 'sawtooth', freq: 800, freqEnd: 60, duration: 0.8, volume: 0.15 * v });
    A.noise({ duration: 0.5, volume: 0.25 * v, filter: 'highpass', freq: 1500, freqEnd: 300 });
  },
  meteor: (v) => A.noise({ duration: 1.3, volume: 0.25 * v, filter: 'bandpass', freq: 3000, freqEnd: 300, q: 1.5, attack: 0.4 }),
  combo: (v, p) => A.tone({ type: 'triangle', freq: 880 * p, duration: 0.06, volume: 0.06 * v }),
  holoOn: (v) => {
    A.tone({ type: 'sawtooth', freq: 55, freqEnd: 220, duration: 0.7, volume: 0.12 * v, filter: { type: 'lowpass', freq: 900 } });
    A.noise({ duration: 0.7, volume: 0.1 * v, filter: 'bandpass', freq: 1400, q: 5, attack: 0.25 });
  },
  holoOff: (v) => {
    A.tone({ type: 'square', freq: 900, freqEnd: 40, duration: 0.32, volume: 0.1 * v });
    A.noise({ duration: 0.18, volume: 0.15 * v, filter: 'highpass', freq: 3000 });
  },
  holoGlitch: (v) => A.noise({ duration: 0.07, volume: 0.1 * v, filter: 'bandpass', freq: 2600, q: 8 }),
  voice: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 92 * p, freqEnd: 74 * p, duration: 0.075, volume: 0.1 * v, filter: { type: 'lowpass', freq: 650 } });
    A.tone({ type: 'square', freq: 46 * p, duration: 0.07, volume: 0.05 * v });
  },
  perfect: (v) => {
    A.noise({ duration: 0.22, volume: 0.18 * v, filter: 'highpass', freq: 5200 });
    A.tone({ type: 'square', freq: midiToFreq(88), duration: 0.1, volume: 0.09 * v, detune: 6 });
    A.tone({ type: 'square', freq: midiToFreq(95), duration: 0.12, volume: 0.09 * v, when: A.now + 0.06, detune: -6 });
    A.tone({ type: 'triangle', freq: midiToFreq(100), duration: 0.9, volume: 0.16 * v, when: A.now + 0.12 });
    A.tone({ type: 'sine', freq: midiToFreq(76), duration: 0.9, volume: 0.12 * v, when: A.now + 0.12 });
  },
  /** New DNA: the watch scanning, a rising sweep stuttering with data blips. */
  dnaScan: (v) => {
    const t = A.now;
    A.tone({ type: 'sawtooth', freq: 120, freqEnd: 900, duration: 1.2, volume: 0.06 * v, filter: { type: 'lowpass', freq: 1600 } });
    for (let i = 0; i < 12; i++) A.tone({ type: 'square', freq: 700 + i * 90 + (i % 3) * 260, duration: 0.03, volume: 0.05 * v, when: t + i * 0.09 });
  },
  /** A new alien unlocked: a bright Omnitrix fanfare over a deep boom. */
  unlock: (v) => {
    const t = A.now;
    A.tone({ type: 'sine', freq: 90, freqEnd: 40, duration: 0.8, volume: 0.5 * v });
    A.noise({ duration: 0.5, volume: 0.22 * v, filter: 'lowpass', freq: 5000, freqEnd: 300 });
    for (const [i, n] of [72, 79, 84, 88, 91].entries()) A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.16, volume: 0.07 * v, when: t + 0.1 + i * 0.08, detune: 5 });
    A.tone({ type: 'triangle', freq: midiToFreq(96), duration: 1.1, volume: 0.13 * v, when: t + 0.5 });
    A.tone({ type: 'square', freq: midiToFreq(84), duration: 1.0, volume: 0.05 * v, when: t + 0.5, detune: -8 });
  },
  /** STRIKE!: a heavy ball thunk, pins clattering everywhere, then a bowling-alley fanfare. */
  strike: (v) => {
    const t = A.now;
    A.tone({ type: 'sine', freq: 110, freqEnd: 40, duration: 0.3, volume: 0.5 * v });
    for (let i = 0; i < 9; i++) {
      const when = t + 0.03 + i * 0.035 + Math.random() * 0.02;
      A.noise({ duration: 0.05, volume: (0.22 - i * 0.015) * v, filter: 'bandpass', freq: 2200 + Math.random() * 2600, q: 6, when });
      A.tone({ type: 'triangle', freq: 900 + Math.random() * 900, duration: 0.04, volume: 0.05 * v, when });
    }
    for (const [i, n] of [72, 76, 79, 84].entries()) A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.12, volume: 0.07 * v, when: t + 0.38 + i * 0.07 });
    A.tone({ type: 'triangle', freq: midiToFreq(88), duration: 0.6, volume: 0.12 * v, when: t + 0.66 });
  },
  /** The comic-panel freeze: a blade being drawn, then the page snaps. */
  comicCut: (v) => {
    const t = A.now;
    A.noise({ duration: 0.18, volume: 0.3 * v, filter: 'highpass', freq: 4200, freqEnd: 9000, attack: 0.05 });
    A.tone({ type: 'sawtooth', freq: 2400, freqEnd: 5200, duration: 0.16, volume: 0.04 * v, filter: { type: 'highpass', freq: 2000 } });
    A.tone({ type: 'square', freq: midiToFreq(76), duration: 0.08, volume: 0.06 * v, when: t + 0.12 });
    A.tone({ type: 'square', freq: midiToFreq(83), duration: 0.22, volume: 0.06 * v, when: t + 0.18 });
  },
  // ---- Dr. Animo's mutants and the museum
  /** Something soft and wet bursting (mutants, goo, slime landing). */
  splat: (v, p) => {
    A.noise({ duration: 0.16, volume: 0.28 * v, filter: 'lowpass', freq: 1600 * p, freqEnd: 200 });
    A.tone({ type: 'sine', freq: 320 * p, freqEnd: 90 * p, duration: 0.12, volume: 0.18 * v });
  },
  squeak: (v, p) => {
    A.tone({ type: 'square', freq: 1500 * p, freqEnd: 2300 * p, duration: 0.06, volume: 0.05 * v });
    A.tone({ type: 'square', freq: 2100 * p, freqEnd: 1600 * p, duration: 0.05, volume: 0.04 * v, when: A.now + 0.07 });
  },
  screech: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 2600 * p, freqEnd: 1700 * p, duration: 0.32, volume: 0.05 * v, detune: 40, filter: { type: 'bandpass', freq: 2400, q: 4 } });
    A.noise({ duration: 0.25, volume: 0.08 * v, filter: 'highpass', freq: 3500 });
  },
  hiss: (v, p) => A.noise({ duration: 0.45, volume: 0.16 * v, filter: 'highpass', freq: 3000 * p, freqEnd: 6000 * p, attack: 0.05 }),
  growl: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 95 * p, freqEnd: 70 * p, duration: 0.7, volume: 0.14 * v, detune: 30, filter: { type: 'lowpass', freq: 600 } });
    A.noise({ duration: 0.6, volume: 0.08 * v, filter: 'bandpass', freq: 380 * p, q: 3 });
  },
  skitter: (v, p) => {
    for (let i = 0; i < 5; i++) A.noise({ duration: 0.02, volume: 0.08 * v, filter: 'bandpass', freq: 3200 * p + i * 300, q: 5, when: A.now + i * 0.035 });
  },
  chestPound: (v) => {
    for (let i = 0; i < 4; i++) A.tone({ type: 'sine', freq: 120, freqEnd: 60, duration: 0.12, volume: 0.35 * v, when: A.now + i * 0.13 });
  },
  croak: (v, p) => {
    A.tone({ type: 'square', freq: 110 * p, freqEnd: 80 * p, duration: 0.35, volume: 0.16 * v, filter: { type: 'lowpass', freq: 900 } });
    A.tone({ type: 'sawtooth', freq: 140 * p, freqEnd: 70 * p, duration: 0.3, volume: 0.08 * v, when: A.now + 0.18, filter: { type: 'lowpass', freq: 700 } });
  },
  tongue: (v, p) => {
    A.noise({ duration: 0.18, volume: 0.2 * v, filter: 'bandpass', freq: 900 * p, freqEnd: 3200 * p, q: 2 });
    A.tone({ type: 'sine', freq: 500 * p, freqEnd: 1400 * p, duration: 0.12, volume: 0.08 * v });
  },
  gulp: (v) => {
    A.tone({ type: 'sine', freq: 300, freqEnd: 70, duration: 0.3, volume: 0.35 * v });
    A.noise({ duration: 0.2, volume: 0.15 * v, filter: 'lowpass', freq: 800, freqEnd: 200, when: A.now + 0.05 });
  },
  burp: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 85 * p, freqEnd: 60 * p, duration: 0.55, volume: 0.25 * v, detune: 35, filter: { type: 'lowpass', freq: 500 } });
    A.noise({ duration: 0.4, volume: 0.12 * v, filter: 'lowpass', freq: 400 });
  },
  /** Fire meets a stink cloud. */
  gasBoom: (v) => {
    A.noise({ duration: 0.9, volume: 0.5 * v, filter: 'lowpass', freq: 3200, freqEnd: 120 });
    A.tone({ type: 'sine', freq: 90, freqEnd: 30, duration: 0.7, volume: 0.55 * v });
    A.tone({ type: 'sawtooth', freq: 400, freqEnd: 60, duration: 0.4, volume: 0.08 * v, filter: { type: 'lowpass', freq: 1500 } });
  },
  /** The museum's power dying: generators whining down, then a clunk. */
  powerDown: (v) => {
    A.tone({ type: 'sawtooth', freq: 240, freqEnd: 30, duration: 1.4, volume: 0.12 * v, filter: { type: 'lowpass', freq: 900 } });
    A.tone({ type: 'sine', freq: 60, freqEnd: 25, duration: 0.5, volume: 0.4 * v, when: A.now + 1.3 });
    A.noise({ duration: 0.12, volume: 0.25 * v, filter: 'lowpass', freq: 900, when: A.now + 1.3 });
  },
  lightClunk: (v, p) => {
    A.tone({ type: 'square', freq: 80 * p, freqEnd: 45 * p, duration: 0.09, volume: 0.25 * v });
    A.noise({ duration: 0.05, volume: 0.15 * v, filter: 'highpass', freq: 2500 });
  },
  glass: (v, p) => {
    for (let i = 0; i < 6; i++) A.tone({ type: 'triangle', freq: (2400 + Math.random() * 2600) * p, duration: 0.08 + Math.random() * 0.1, volume: 0.05 * v, when: A.now + i * 0.03 });
    A.noise({ duration: 0.3, volume: 0.3 * v, filter: 'highpass', freq: 3000, freqEnd: 1500 });
  },
  /** Animo's Transmodulator: a wobbling, sci-fi mutation ray. */
  mutateRay: (v) => {
    A.tone({ type: 'sine', freq: 300, freqEnd: 1200, duration: 0.6, volume: 0.1 * v, detune: 50 });
    A.tone({ type: 'square', freq: 150, freqEnd: 600, duration: 0.6, volume: 0.05 * v, filter: { type: 'lowpass', freq: 1500 } });
  },
  /** A secret passage opening. */
  secret: (v) => {
    for (const [i, n] of [67, 74, 79, 86].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.3, volume: 0.09 * v, when: A.now + i * 0.09 });
    A.noise({ duration: 0.6, volume: 0.15 * v, filter: 'lowpass', freq: 700, freqEnd: 200 });
  },
  /** An act ends: a rising fanfare with a cymbal swell. */
  fanfare: (v) => {
    const t = A.now;
    A.noise({ duration: 1.6, volume: 0.12 * v, filter: 'highpass', freq: 5000, attack: 0.9 });
    for (const [i, n] of [60, 64, 67, 72, 76, 79, 84].entries()) A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.18, volume: 0.06 * v, when: t + i * 0.09, detune: 6 });
    A.tone({ type: 'triangle', freq: midiToFreq(88), duration: 1.6, volume: 0.15 * v, when: t + 0.66 });
    A.tone({ type: 'sawtooth', freq: midiToFreq(76), duration: 1.6, volume: 0.04 * v, when: t + 0.66, filter: { type: 'lowpass', freq: 2400 } });
    A.tone({ type: 'sine', freq: 70, freqEnd: 35, duration: 1.2, volume: 0.5 * v, when: t + 0.66 });
  },
  /** Electricity crawling into Kevin's hand. */
  zap: (v, p) => {
    for (let i = 0; i < 8; i++) A.tone({ type: 'square', freq: (800 + Math.random() * 1800) * p, duration: 0.03, volume: 0.05 * v, when: A.now + i * 0.04 });
    A.noise({ duration: 0.4, volume: 0.15 * v, filter: 'bandpass', freq: 2600, q: 3 });
  },

  // ---- Kevin 11: machines, the arcade, the subway, Kevin himself.
  /** Upgrade takes a robot over: an alarm chirp climbing as it overloads. */
  hackIn: (v, p) => {
    for (let i = 0; i < 5; i++) A.tone({ type: 'square', freq: (700 + i * 260) * p, duration: 0.05, volume: 0.06 * v, when: A.now + i * 0.1 });
    A.noise({ duration: 0.55, volume: 0.08 * v, filter: 'bandpass', freq: 3000, freqEnd: 6000, q: 4 });
  },
  /** The takeover blast: an explosion with a digital crunch on top. */
  hackBlast: (v, p) => {
    A.noise({ duration: 0.45, volume: 0.38 * v, filter: 'lowpass', freq: 4200 * p, freqEnd: 180 });
    A.tone({ type: 'sine', freq: 140 * p, freqEnd: 38, duration: 0.4, volume: 0.45 * v });
    for (let i = 0; i < 4; i++) A.tone({ type: 'square', freq: 1800 - i * 340, duration: 0.03, volume: 0.06 * v, when: A.now + i * 0.03 });
  },
  /** A dead machine wakes up: a rising whine and a relay click. */
  powerUp: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 90 * p, freqEnd: 520 * p, duration: 0.35, volume: 0.07 * v, filter: { type: 'lowpass', freq: 1800 } });
    A.noise({ duration: 0.02, volume: 0.2 * v, filter: 'highpass', freq: 3000, when: A.now + 0.33 });
  },
  /** A steel shutter rattling up into the ceiling. */
  shutter: (v) => {
    for (let i = 0; i < 9; i++) A.noise({ duration: 0.03, volume: 0.12 * v, filter: 'bandpass', freq: 900 + i * 60, q: 2, when: A.now + i * 0.03 });
    A.tone({ type: 'sine', freq: 60, freqEnd: 120, duration: 0.3, volume: 0.2 * v });
  },
  /** A scissor lift's hydraulic hum. */
  liftHum: (v) => {
    A.tone({ type: 'sawtooth', freq: 70, freqEnd: 110, duration: 0.9, volume: 0.08 * v, filter: { type: 'lowpass', freq: 500 } });
    A.noise({ duration: 0.9, volume: 0.05 * v, filter: 'bandpass', freq: 400, q: 1.5 });
  },
  /** Wheels over a rail joint. */
  railClack: (v, p) => {
    A.noise({ duration: 0.03, volume: 0.14 * v, filter: 'bandpass', freq: 1400 * p, q: 3 });
    A.noise({ duration: 0.03, volume: 0.1 * v, filter: 'bandpass', freq: 1100 * p, q: 3, when: A.now + 0.06 });
  },
  /** The cart's horn: two flat honks. */
  horn: (v) => {
    for (const [i, f] of [311, 349].entries()) {
      A.tone({ type: 'square', freq: f, duration: 0.16, volume: 0.09 * v, when: A.now + i * 0.04, filter: { type: 'lowpass', freq: 1600 } });
      A.tone({ type: 'sawtooth', freq: f * 1.5, duration: 0.16, volume: 0.04 * v, when: A.now + i * 0.04, filter: { type: 'lowpass', freq: 1600 } });
    }
  },
  /** An arcade cabinet booting: a power thunk and a coin-op jingle. */
  arcadeBoot: (v, p) => {
    A.tone({ type: 'sine', freq: 120, freqEnd: 50, duration: 0.12, volume: 0.25 * v });
    for (const [i, n] of [72, 76, 79, 84].entries()) A.tone({ type: 'square', freq: midiToFreq(n) * p, duration: 0.06, volume: 0.06 * v, when: A.now + 0.08 + i * 0.05 });
  },
  /** GAME OVER: the sad descending chiptune, slammed into a blast. */
  gameOver: (v) => {
    for (const [i, n] of [72, 67, 64, 60].entries()) A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.08, volume: 0.08 * v, when: A.now + i * 0.06 });
    A.noise({ duration: 0.35, volume: 0.3 * v, filter: 'lowpass', freq: 5000, freqEnd: 300 });
    A.tone({ type: 'sine', freq: 110, freqEnd: 40, duration: 0.3, volume: 0.35 * v });
  },
  /** Prize tickets spewing out of a machine. */
  tickets: (v) => {
    for (let i = 0; i < 10; i++) A.noise({ duration: 0.015, volume: 0.1 * v, filter: 'highpass', freq: 4000, when: A.now + i * 0.035 });
    A.tone({ type: 'triangle', freq: midiToFreq(88), duration: 0.2, volume: 0.06 * v, when: A.now + 0.1 });
  },
  /** A subway train's horn from down the tunnel. */
  trainHorn: (v) => {
    for (const f of [233, 294, 349]) A.tone({ type: 'sawtooth', freq: f, duration: 0.9, volume: 0.04 * v, attack: 0.08, filter: { type: 'lowpass', freq: 1300 } });
  },
  /** The train roaring through: a long wash of rumble and wheel clatter. */
  trainPass: (v) => {
    A.noise({ duration: 1.3, volume: 0.32 * v, filter: 'lowpass', freq: 900, freqEnd: 300, attack: 0.15 });
    A.tone({ type: 'sine', freq: 55, freqEnd: 40, duration: 1.2, volume: 0.3 * v, attack: 0.1 });
    for (let i = 0; i < 8; i++) A.noise({ duration: 0.03, volume: 0.14 * v, filter: 'bandpass', freq: 1300, q: 3, when: A.now + 0.1 + i * 0.13 });
  },
  /** An animatronic's servos whirring. */
  servo: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 300 * p, freqEnd: 480 * p, duration: 0.18, volume: 0.05 * v, filter: { type: 'bandpass', freq: 1200, q: 2 } });
  },
  /** Cymbals crashing into the floor. */
  clang: (v, p) => {
    A.noise({ duration: 0.5, volume: 0.28 * v, filter: 'highpass', freq: 3500 * p, freqEnd: 2000 * p });
    A.tone({ type: 'square', freq: 620 * p, freqEnd: 580 * p, duration: 0.3, volume: 0.06 * v, detune: 30 });
    A.tone({ type: 'sine', freq: 90, freqEnd: 40, duration: 0.25, volume: 0.35 * v });
  },
  /** A track-bot's grinder revving up. */
  grinder: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 120 * p, freqEnd: 900 * p, duration: 0.5, volume: 0.07 * v, filter: { type: 'lowpass', freq: 2600 } });
    A.noise({ duration: 0.5, volume: 0.1 * v, filter: 'bandpass', freq: 2400 * p, q: 2 });
  },
  /** One of Kevin's sparks discharging. */
  sparkZap: (v, p) => {
    A.noise({ duration: 0.12, volume: 0.18 * v, filter: 'bandpass', freq: 3600 * p, freqEnd: 1200 * p, q: 3 });
    A.tone({ type: 'square', freq: 1400 * p, freqEnd: 300 * p, duration: 0.08, volume: 0.06 * v });
  },
  /** Kevin drinking power: a rising electric slurp. */
  absorb: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 80 * p, freqEnd: 640 * p, duration: 0.7, volume: 0.09 * v, filter: { type: 'lowpass', freq: 2200 } });
    for (let i = 0; i < 10; i++) A.noise({ duration: 0.025, volume: 0.07 * v, filter: 'bandpass', freq: 2000 + Math.random() * 2400, q: 4, when: A.now + i * 0.06 });
  },
  /** Kevin's bolt: a purple crack. */
  kevinBolt: (v, p) => {
    A.noise({ duration: 0.1, volume: 0.2 * v, filter: 'bandpass', freq: 2800 * p, freqEnd: 900 * p, q: 2 });
    A.tone({ type: 'square', freq: 900 * p, freqEnd: 180 * p, duration: 0.12, volume: 0.07 * v });
  },
  /** A breaker slammed with stolen power: the whole building surges on. */
  powerSurge: (v) => {
    A.tone({ type: 'sine', freq: 40, freqEnd: 120, duration: 0.7, volume: 0.35 * v });
    A.tone({ type: 'sawtooth', freq: 60, freqEnd: 240, duration: 0.7, volume: 0.07 * v, filter: { type: 'lowpass', freq: 900 } });
    A.noise({ duration: 0.6, volume: 0.15 * v, filter: 'bandpass', freq: 1800, freqEnd: 5200, q: 2 });
  },
  /** A tesla coil building charge. */
  coilCharge: (v) => {
    A.tone({ type: 'sawtooth', freq: 60, freqEnd: 300, duration: 0.8, volume: 0.06 * v, filter: { type: 'lowpass', freq: 1200 } });
    A.noise({ duration: 0.8, volume: 0.06 * v, filter: 'bandpass', freq: 4000, q: 6, attack: 0.5 });
  },
  /** A coil discharging: a sharp crack of lightning. */
  coilZap: (v) => {
    A.noise({ duration: 0.3, volume: 0.42 * v, filter: 'highpass', freq: 1500, freqEnd: 400 });
    A.tone({ type: 'square', freq: 2000, freqEnd: 100, duration: 0.2, volume: 0.1 * v });
    A.tone({ type: 'sine', freq: 80, freqEnd: 40, duration: 0.3, volume: 0.35 * v });
  },
  /** Sumo Slammers mini-game: a slap, a big shove, the win and the loss jingles. */
  sumoSlap: (v, p) => {
    A.noise({ duration: 0.04, volume: 0.22 * v, filter: 'bandpass', freq: 1500 * p, q: 2 });
    A.tone({ type: 'square', freq: 260 * p, freqEnd: 180 * p, duration: 0.05, volume: 0.06 * v });
  },
  sumoShove: (v) => {
    A.tone({ type: 'sine', freq: 160, freqEnd: 60, duration: 0.25, volume: 0.4 * v });
    A.noise({ duration: 0.15, volume: 0.2 * v, filter: 'lowpass', freq: 1500 });
  },
  sumoWin: (v) => {
    for (const [i, n] of [60, 64, 67, 72, 76, 72, 79].entries()) A.tone({ type: 'square', freq: midiToFreq(n), duration: 0.09, volume: 0.07 * v, when: A.now + i * 0.08 });
  },
  sumoLose: (v) => {
    for (const [i, n] of [67, 63, 60, 55].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.16, volume: 0.1 * v, when: A.now + i * 0.13 });
  },
} satisfies Record<string, Recipe>;

export type SfxName = keyof typeof RECIPES;

const lastPlayed = new Map<SfxName | SoundRecipe, number>();

/** Plays a shared effect by name, or any sound recipe. Rapid repeats of the same sound are throttled. */
export function playSfx(sound: SfxName | SoundRecipe, volume = 1, pitch = 1): void {
  if (!audio.ready || audio.muted) return;
  const now = performance.now();
  const last = lastPlayed.get(sound) ?? -Infinity;
  if (now - last < AUDIO.sfxMinIntervalMs) return;
  lastPlayed.set(sound, now);
  try {
    const recipe: Recipe = typeof sound === 'function' ? sound : RECIPES[sound];
    recipe(volume, pitch);
  } catch {
    // Audio is decoration; never let it break gameplay.
  }
}

/** A held sound (Heatblast's charge hum) that follows a 0..1 intensity. */
export class ChargeHum {
  private osc: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  start(): void {
    const ctx = audio.ctx;
    if (!ctx || !audio.ready || this.osc) return;
    try {
      this.osc = ctx.createOscillator();
      this.osc.type = 'sawtooth';
      this.osc.frequency.value = 110;
      this.osc2 = ctx.createOscillator();
      this.osc2.type = 'square';
      this.osc2.frequency.value = 220;
      this.osc2.detune.value = 8;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      this.gain = ctx.createGain();
      this.gain.gain.value = 0.0001;
      this.gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.1);
      this.osc.connect(filter);
      this.osc2.connect(filter);
      filter.connect(this.gain).connect(audio.loopBus);
      this.osc.start();
      this.osc2.start();
    } catch {
      this.stop();
    }
  }

  set(intensity: number): void {
    const ctx = audio.ctx;
    if (!ctx || !this.osc || !this.osc2) return;
    const f = 110 + intensity * 330;
    this.osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.03);
    this.osc2.frequency.setTargetAtTime(f * 2 + (intensity >= 1 ? Math.sin(ctx.currentTime * 40) * 30 : 0), ctx.currentTime, 0.03);
  }

  stop(): void {
    const ctx = audio.ctx;
    try {
      if (ctx && this.gain) {
        this.gain.gain.cancelScheduledValues(ctx.currentTime);
        this.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
      }
      const end = (ctx?.currentTime ?? 0) + 0.1;
      this.osc?.stop(end);
      this.osc2?.stop(end);
    } catch {
      // already stopped
    }
    this.osc = null;
    this.osc2 = null;
    this.gain = null;
  }
}
