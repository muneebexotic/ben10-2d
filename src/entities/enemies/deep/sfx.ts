import { audio } from '../../../systems/audio/AudioEngine';
import type { SoundRecipe } from '../../../systems/audio/Sfx';

const A = audio;

/** Chapter 7's enemy sounds: a sentry's lock chirp and beam, harpoons, glass, electric eels, jelly pops, a school turning. */
export const DEEP_SFX = {
  /** A sentry locking on: two rising chirps. */
  lock: ((v) => {
    A.tone({ type: 'square', freq: 1200, duration: 0.06, volume: 0.07 * v });
    A.tone({ type: 'square', freq: 1600, duration: 0.08, volume: 0.07 * v, when: A.now + 0.09 });
  }) as SoundRecipe,
  /** Its stun beam: a sharp zap down. */
  beam: ((v) => A.tone({ type: 'sawtooth', freq: 1800, freqEnd: 300, duration: 0.18, volume: 0.1 * v, filter: { type: 'lowpass', freq: 3000 } })) as SoundRecipe,
  /** A grunt cocking its harpoon: a ratchet. */
  harpoonCock: ((v) => {
    for (let i = 0; i < 3; i++) A.noise({ duration: 0.03, volume: 0.14 * v, filter: 'bandpass', freq: 2400, q: 6, when: A.now + i * 0.07 });
  }) as SoundRecipe,
  /** The throw: a whoosh. */
  harpoon: ((v) => A.noise({ duration: 0.25, volume: 0.16 * v, filter: 'bandpass', freq: 800, freqEnd: 2600, q: 2 })) as SoundRecipe,
  /** A fishbowl breaking. */
  glass: ((v) => {
    A.noise({ duration: 0.35, volume: 0.22 * v, filter: 'highpass', freq: 3000 });
    for (let i = 0; i < 4; i++) A.tone({ type: 'triangle', freq: 2600 + i * 700, duration: 0.12, volume: 0.05 * v, when: A.now + i * 0.03 });
  }) as SoundRecipe,
  /** An eel charging: an electric crackle. */
  crackle: ((v) => {
    for (let i = 0; i < 6; i++) A.noise({ duration: 0.025, volume: 0.12 * v, filter: 'highpass', freq: 4000, when: A.now + i * 0.11 + Math.random() * 0.04 });
    A.tone({ type: 'sawtooth', freq: 60, freqEnd: 120, duration: 0.8, volume: 0.05 * v, filter: { type: 'lowpass', freq: 500 } });
  }) as SoundRecipe,
  /** The shock: a fat electric buzz. */
  zap: ((v) => {
    A.tone({ type: 'square', freq: 90, duration: 0.25, volume: 0.12 * v, filter: { type: 'lowpass', freq: 1400 } });
    A.noise({ duration: 0.25, volume: 0.18 * v, filter: 'bandpass', freq: 2200, q: 1.5 });
  }) as SoundRecipe,
  /** A jelly popping: a wet blip. */
  pop: ((v, p) => A.tone({ type: 'sine', freq: 500 * p, freqEnd: 1400 * p, duration: 0.09, volume: 0.18 * v })) as SoundRecipe,
  /** A school turning: a flurry of little splashes. */
  school: ((v) => {
    for (let i = 0; i < 5; i++) A.noise({ duration: 0.05, volume: 0.08 * v, filter: 'bandpass', freq: 1400 + i * 300, q: 3, when: A.now + i * 0.05 });
  }) as SoundRecipe,
};
