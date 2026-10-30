import { audio } from '../../../systems/audio/AudioEngine';
import type { SoundRecipe } from '../../../systems/audio/Sfx';

const A = audio;

/** DEEPMAW's sounds: the lure's sonar ping, the flare's whine, his chomp, the flash, a belly flop, the flood klaxon, the hatch tearing, the whirlpool, the stasis field. */
export const DEEPMAW_SFX = {
  /** The bait: a soft sonar ping from the lure. */
  ping: ((v) => {
    A.tone({ type: 'sine', freq: 1320, freqEnd: 1180, duration: 0.5, volume: 0.07 * v });
    A.tone({ type: 'sine', freq: 1320, freqEnd: 1180, duration: 0.4, volume: 0.03 * v, when: A.now + 0.18 });
  }) as SoundRecipe,
  /** The flare (the tell): a rising whine. */
  flare: ((v) => {
    A.tone({ type: 'sawtooth', freq: 300, freqEnd: 1600, duration: 0.6, volume: 0.06 * v, filter: { type: 'lowpass', freq: 2600 } });
    A.tone({ type: 'sine', freq: 600, freqEnd: 2400, duration: 0.6, volume: 0.05 * v });
  }) as SoundRecipe,
  /** The jaws snapping shut. */
  chomp: ((v) => {
    A.noise({ duration: 0.14, volume: 0.3 * v, filter: 'lowpass', freq: 1400, freqEnd: 300 });
    A.tone({ type: 'square', freq: 120, freqEnd: 50, duration: 0.16, volume: 0.16 * v, filter: { type: 'lowpass', freq: 700 } });
  }) as SoundRecipe,
  /** The lure flash: a bright crack and a fizz. */
  flash: ((v) => {
    A.noise({ duration: 0.3, volume: 0.26 * v, filter: 'highpass', freq: 2400, freqEnd: 6000 });
    A.tone({ type: 'triangle', freq: 2400, freqEnd: 600, duration: 0.35, volume: 0.08 * v });
  }) as SoundRecipe,
  /** A belly flop or a tail slam: a heavy wet smack. */
  smack: ((v) => {
    A.tone({ type: 'sine', freq: 80, freqEnd: 30, duration: 0.4, volume: 0.5 * v });
    A.noise({ duration: 0.4, volume: 0.3 * v, filter: 'lowpass', freq: 1800, freqEnd: 300 });
  }) as SoundRecipe,
  /** FLOOD WARNING: two klaxon blares. */
  klaxon: ((v) => {
    for (let i = 0; i < 2; i++) A.tone({ type: 'square', freq: 440, freqEnd: 330, duration: 0.32, volume: 0.07 * v, when: A.now + i * 0.42, filter: { type: 'lowpass', freq: 1800 } });
  }) as SoundRecipe,
  /** The outer hatch torn open: shrieking metal and a rush of sea. */
  hatch: ((v) => {
    A.tone({ type: 'sawtooth', freq: 220, freqEnd: 70, duration: 0.9, volume: 0.1 * v, filter: { type: 'bandpass', freq: 900, q: 2 } });
    A.noise({ duration: 1.6, volume: 0.24 * v, filter: 'lowpass', freq: 600, freqEnd: 2000 });
  }) as SoundRecipe,
  /** The whirlpool's suck while he swallows. */
  suck: ((v) => A.noise({ duration: 1.2, volume: 0.16 * v, filter: 'bandpass', freq: 300, freqEnd: 1100, q: 1.2 })) as SoundRecipe,
  /** Gwen's shield: a glassy chime. */
  shield: ((v) => {
    A.tone({ type: 'triangle', freq: 880, duration: 0.2, volume: 0.07 * v });
    A.tone({ type: 'triangle', freq: 1320, duration: 0.3, volume: 0.06 * v, when: A.now + 0.08 });
  }) as SoundRecipe,
  /** The containment field closing: a rising hum and a lock. */
  stasis: ((v) => {
    A.tone({ type: 'sawtooth', freq: 80, freqEnd: 320, duration: 1.1, volume: 0.08 * v, filter: { type: 'lowpass', freq: 1200 } });
    A.tone({ type: 'sine', freq: 660, duration: 0.3, volume: 0.08 * v, when: A.now + 1.0 });
  }) as SoundRecipe,
};
