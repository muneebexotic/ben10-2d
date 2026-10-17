import { audio, midiToFreq } from '../../../systems/audio/AudioEngine';
import type { SoundRecipe } from '../../../systems/audio/Sfx';

const A = audio;

/** Chapter 6's enemy sounds: stone grinding, clanking armor, flapping paper, a magician's sparkle. */
export const MAGIC_SFX = {
  /** A rockling curling up: a gravelly rumble. */
  rumble: ((v, p) => A.noise({ duration: 0.3, volume: 0.18 * v, filter: 'lowpass', freq: 500 * p, freqEnd: 200 })) as SoundRecipe,
  /** Stone hitting stone (a rockling bounces off a wall, a gargoyle shrugs off a hit while it's still stone). */
  clunk: ((v, p) => {
    A.tone({ type: 'square', freq: 140 * p, freqEnd: 70 * p, duration: 0.08, volume: 0.2 * v });
    A.noise({ duration: 0.1, volume: 0.18 * v, filter: 'bandpass', freq: 900 * p, q: 2 });
  }) as SoundRecipe,
  /** A golem's slam: a deep thud and a crack. */
  slam: ((v) => {
    A.tone({ type: 'sine', freq: 90, freqEnd: 30, duration: 0.6, volume: 0.55 * v });
    A.noise({ duration: 0.4, volume: 0.35 * v, filter: 'lowpass', freq: 2200, freqEnd: 120 });
  }) as SoundRecipe,
  /** Fists going up: grinding stone. */
  grind: ((v) => A.noise({ duration: 0.8, volume: 0.14 * v, filter: 'bandpass', freq: 300, freqEnd: 900, q: 3 })) as SoundRecipe,
  /** Enchanted armor: a sword ringing as it's raised, and a clang off the shield. */
  shing: ((v, p) => A.tone({ type: 'triangle', freq: 1800 * p, freqEnd: 2400 * p, duration: 0.2, volume: 0.08 * v })) as SoundRecipe,
  clang: ((v, p) => {
    A.tone({ type: 'square', freq: 620 * p, duration: 0.12, volume: 0.1 * v });
    A.tone({ type: 'triangle', freq: 1240 * p, duration: 0.3, volume: 0.06 * v });
  }) as SoundRecipe,
  /** A gargoyle waking: stone cracking, then a screech. */
  screech: ((v, p) => {
    A.noise({ duration: 0.15, volume: 0.2 * v, filter: 'highpass', freq: 1500 });
    A.tone({ type: 'sawtooth', freq: 900 * p, freqEnd: 1400 * p, duration: 0.25, volume: 0.06 * v, filter: { type: 'bandpass', freq: 1200, q: 2 }, when: A.now + 0.1 });
  }) as SoundRecipe,
  /** Paper flapping (a kite dives). */
  flap: ((v, p) => A.noise({ duration: 0.18, volume: 0.12 * v, filter: 'bandpass', freq: 2400 * p, freqEnd: 1200 * p, q: 1.5 })) as SoundRecipe,
  /** An illusion popping: a soft "poof" and a bell. */
  poof: ((v) => {
    A.noise({ duration: 0.2, volume: 0.18 * v, filter: 'lowpass', freq: 1800, freqEnd: 300 });
    A.tone({ type: 'triangle', freq: midiToFreq(88), duration: 0.15, volume: 0.06 * v });
  }) as SoundRecipe,
  /** A ship's horn across the harbour (and the Rustbucket's, on its way through a gate). */
  horn: ((v, p) => {
    A.tone({ type: 'sawtooth', freq: 98 * p, duration: 1.1, volume: 0.08 * v, attack: 0.08, filter: { type: 'lowpass', freq: 600 } });
    A.tone({ type: 'sawtooth', freq: 147 * p, duration: 1.1, volume: 0.05 * v, attack: 0.08, filter: { type: 'lowpass', freq: 700 } });
  }) as SoundRecipe,
  /** Max's fire extinguisher: a long hiss of foam. */
  spray: ((v) => A.noise({ duration: 0.5, volume: 0.16 * v, filter: 'highpass', freq: 2600, freqEnd: 1800 })) as SoundRecipe,
  /** A spell bolt leaving a hand. */
  zap: ((v, p) => {
    A.tone({ type: 'sine', freq: 700 * p, freqEnd: 1400 * p, duration: 0.14, volume: 0.08 * v });
    A.noise({ duration: 0.1, volume: 0.06 * v, filter: 'bandpass', freq: 4000 * p, q: 4 });
  }) as SoundRecipe,
};
