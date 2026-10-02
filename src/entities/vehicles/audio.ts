import { audio as A, midiToFreq } from '../../systems/audio/AudioEngine';
import type { SoundRecipe } from '../../systems/audio/Sfx';

/** Road sounds for the chase: big-rig horns, engines, crunching metal. Play them with `playSfx`. */

/** An air horn: two detuned blasts. */
export const horn: SoundRecipe = (v, p) => {
  for (const n of [55, 58]) A.tone({ type: 'sawtooth', freq: midiToFreq(n) * p, duration: 0.55, volume: 0.07 * v, detune: 12, filter: { type: 'lowpass', freq: 1600 } });
};

/** A diesel engine winding up before a ram. */
export const engineRev: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 48 * p, freqEnd: 150 * p, duration: 0.9, volume: 0.14 * v, filter: { type: 'lowpass', freq: 600 } });
  A.noise({ duration: 0.9, volume: 0.08 * v, filter: 'bandpass', freq: 220, freqEnd: 700, q: 2 });
};

/** Bumper on bumper. */
export const crunch: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.35, volume: 0.42 * v, filter: 'lowpass', freq: 2600 * p, freqEnd: 200 });
  A.tone({ type: 'square', freq: 80 * p, freqEnd: 40, duration: 0.25, volume: 0.22 * v });
  A.noise({ duration: 0.12, volume: 0.2 * v, filter: 'highpass', freq: 3200, when: A.now + 0.05 });
};

/** A tire hitting the roof. */
export const boing: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 140 * p, freqEnd: 70 * p, duration: 0.16, volume: 0.25 * v });
  A.noise({ duration: 0.05, volume: 0.1 * v, filter: 'lowpass', freq: 700 });
};

/** A barrel clanging down and rolling. */
export const clang: SoundRecipe = (v, p) => {
  A.tone({ type: 'triangle', freq: 520 * p, freqEnd: 480 * p, duration: 0.22, volume: 0.1 * v });
  A.tone({ type: 'triangle', freq: 790 * p, duration: 0.14, volume: 0.06 * v });
  A.noise({ duration: 0.06, volume: 0.14 * v, filter: 'bandpass', freq: 1800, q: 3 });
};

/** A thrown rig landing on the asphalt and tumbling away. */
export const wreck: SoundRecipe = (v) => {
  const t = A.now;
  A.noise({ duration: 1.1, volume: 0.5 * v, filter: 'lowpass', freq: 3000, freqEnd: 80 });
  A.tone({ type: 'sine', freq: 70, freqEnd: 26, duration: 0.9, volume: 0.5 * v });
  for (let i = 0; i < 5; i++) A.noise({ duration: 0.07, volume: 0.16 * v, filter: 'bandpass', freq: 1400 + Math.random() * 2400, q: 5, when: t + 0.12 + i * 0.11 });
};

/** BULLSEYE!: a dart-board thunk and a bell. */
export const bullseye: SoundRecipe = (v) => {
  const t = A.now;
  A.tone({ type: 'sine', freq: 180, freqEnd: 60, duration: 0.2, volume: 0.4 * v });
  for (const [i, n] of [84, 88, 91, 96].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.3, volume: 0.09 * v, when: t + 0.08 + i * 0.06 });
};

/** The pothole thump under the wheels. */
export const pothole: SoundRecipe = (v) => {
  A.tone({ type: 'sine', freq: 90, freqEnd: 34, duration: 0.3, volume: 0.45 * v });
  A.noise({ duration: 0.18, volume: 0.25 * v, filter: 'lowpass', freq: 900, freqEnd: 120 });
};
