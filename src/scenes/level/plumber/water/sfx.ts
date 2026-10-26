import { audio } from '../../../../systems/audio/AudioEngine';
import type { SoundRecipe } from '../../../../systems/audio/Sfx';

const A = audio;

/** A heavy door sliding: a pneumatic hiss over a rumble. */
export const doorHiss: SoundRecipe = (v) => {
  A.noise({ duration: 0.6, volume: 0.16 * v, filter: 'highpass', freq: 2400, freqEnd: 1200 });
  A.tone({ type: 'sawtooth', freq: 60, freqEnd: 90, duration: 0.6, volume: 0.06 * v, filter: { type: 'lowpass', freq: 400 } });
};

/** A door seating: a deep clunk. */
export const doorClunk: SoundRecipe = (v) => {
  A.tone({ type: 'sine', freq: 90, freqEnd: 40, duration: 0.25, volume: 0.4 * v });
  A.noise({ duration: 0.12, volume: 0.2 * v, filter: 'lowpass', freq: 900, freqEnd: 200 });
};

/** A pump starting: a motor spinning up and water churning. */
export const pumpStart: SoundRecipe = (v) => {
  A.tone({ type: 'sawtooth', freq: 40, freqEnd: 110, duration: 0.9, volume: 0.1 * v, filter: { type: 'lowpass', freq: 600 } });
  A.noise({ duration: 1.2, volume: 0.14 * v, filter: 'lowpass', freq: 500, freqEnd: 1400 });
};

/** A console booting: a chirp and a rising chime. */
export const consoleBoot: SoundRecipe = (v) => {
  A.tone({ type: 'square', freq: 660, duration: 0.05, volume: 0.05 * v });
  A.tone({ type: 'triangle', freq: 880, duration: 0.1, volume: 0.07 * v, when: A.now + 0.07 });
  A.tone({ type: 'triangle', freq: 1320, duration: 0.18, volume: 0.07 * v, when: A.now + 0.16 });
};

/** A valve wheel cranked round: metal squeal and rushing water. */
export const valveTurn: SoundRecipe = (v) => {
  A.tone({ type: 'square', freq: 520, freqEnd: 380, duration: 0.3, volume: 0.04 * v, filter: { type: 'bandpass', freq: 900 } });
  A.noise({ duration: 1.0, volume: 0.15 * v, filter: 'bandpass', freq: 700, freqEnd: 300, q: 0.8, when: A.now + 0.2 });
};

/** Lights thudding on, section by section. */
export const lightsThud: SoundRecipe = (v) => {
  A.tone({ type: 'sine', freq: 120, freqEnd: 60, duration: 0.18, volume: 0.3 * v });
  A.tone({ type: 'square', freq: 3000, duration: 0.02, volume: 0.02 * v, when: A.now + 0.02 });
};
