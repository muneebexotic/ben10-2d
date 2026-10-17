import { audio, midiToFreq } from '../../../systems/audio/AudioEngine';
import type { SoundRecipe } from '../../../systems/audio/Sfx';

const A = audio;

/** A shimmer of three bell tones: every spell starts with it. */
const shimmer = (v: number, p: number, notes: readonly number[]) => {
  for (const [i, n] of notes.entries()) A.tone({ type: 'triangle', freq: midiToFreq(n) * p, duration: 0.22, volume: 0.07 * v, when: A.now + i * 0.045 });
};

/** Gwen's spells and bolt: glassy, bright, a little sparkly (Ben's aliens are all grit). */
export const GWEN_SFX = {
  bolt: ((v, p) => {
    A.tone({ type: 'sine', freq: 1300 * p, freqEnd: 700 * p, duration: 0.12, volume: 0.07 * v });
    A.noise({ duration: 0.06, volume: 0.06 * v, filter: 'bandpass', freq: 5000 * p, q: 5 });
  }) as SoundRecipe,
  shield: ((v, p) => {
    shimmer(v, p, [79, 83, 86]);
    A.tone({ type: 'sine', freq: 220 * p, freqEnd: 330 * p, duration: 0.4, volume: 0.12 * v });
  }) as SoundRecipe,
  /** A shot pops on the bubble. */
  shieldPing: ((v, p) => A.tone({ type: 'triangle', freq: 1800 * p, freqEnd: 2400 * p, duration: 0.06, volume: 0.06 * v })) as SoundRecipe,
  /** The bubble eats a hit and bursts. */
  shieldPop: ((v, p) => {
    A.noise({ duration: 0.18, volume: 0.2 * v, filter: 'highpass', freq: 2400 * p, freqEnd: 900 });
    shimmer(v, p, [91, 86, 79]);
  }) as SoundRecipe,
  stun: ((v, p) => {
    shimmer(v, p, [74, 81, 86]);
    A.tone({ type: 'sine', freq: 180 * p, freqEnd: 50, duration: 0.45, volume: 0.35 * v });
    A.noise({ duration: 0.3, volume: 0.16 * v, filter: 'bandpass', freq: 3000 * p, freqEnd: 600, q: 1.4 });
  }) as SoundRecipe,
  reveal: ((v, p) => {
    shimmer(v, p, [76, 83, 88, 95]);
    A.tone({ type: 'sine', freq: 440 * p, freqEnd: 880 * p, duration: 0.6, volume: 0.05 * v, attack: 0.2 });
  }) as SoundRecipe,
  /** Not ready (or not learned): a soft wrong note. */
  dud: ((v) => {
    A.tone({ type: 'triangle', freq: midiToFreq(62), duration: 0.08, volume: 0.07 * v });
    A.tone({ type: 'triangle', freq: midiToFreq(61), duration: 0.12, volume: 0.07 * v, when: A.now + 0.07 });
  }) as SoundRecipe,
  /** A spell learned: a little rising fanfare. */
  learned: ((v) => {
    for (const [i, n] of [72, 76, 79, 84, 88].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.18, volume: 0.09 * v, when: A.now + i * 0.07 });
  }) as SoundRecipe,
};
