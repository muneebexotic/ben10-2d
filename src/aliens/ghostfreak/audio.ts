import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** A detuned moan sliding down under a reversed-sounding swell of breath. */
export const ghostfreakTransform: SoundRecipe = (v) => {
  for (const d of [-30, 0, 25]) A.tone({ type: 'sine', freq: 660, freqEnd: 330, duration: 0.9, volume: 0.07 * v, detune: d, attack: 0.25 });
  A.noise({ duration: 0.6, volume: 0.1 * v, filter: 'bandpass', freq: 400, freqEnd: 2400, q: 3, attack: 0.45 });
  A.tone({ type: 'triangle', freq: 98, freqEnd: 73, duration: 0.8, volume: 0.16 * v, attack: 0.2 });
};

/** A wet whip of tentacles. */
export const lashWhip: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.09, volume: 0.16 * v, filter: 'bandpass', freq: 2400 * p, freqEnd: 700 * p, q: 2 });
  A.tone({ type: 'sine', freq: 520 * p, freqEnd: 180 * p, duration: 0.1, volume: 0.1 * v });
};

/** Slipping out of phase with the world: a hollow downward whoosh. */
export const phaseIn: SoundRecipe = (v) => {
  A.noise({ duration: 0.3, volume: 0.12 * v, filter: 'bandpass', freq: 1800, freqEnd: 300, q: 4 });
  A.tone({ type: 'sine', freq: 440, freqEnd: 220, duration: 0.3, volume: 0.06 * v, detune: 20 });
};

/** Back into the world: the whoosh in reverse. */
export const phaseOut: SoundRecipe = (v) => {
  A.noise({ duration: 0.22, volume: 0.1 * v, filter: 'bandpass', freq: 300, freqEnd: 1600, q: 4 });
  A.tone({ type: 'sine', freq: 220, freqEnd: 440, duration: 0.22, volume: 0.05 * v });
};

/** Fading out completely: a thin ringing that dies away. */
export const vanish: SoundRecipe = (v) => {
  A.tone({ type: 'sine', freq: 1760, freqEnd: 1700, duration: 0.6, volume: 0.03 * v, attack: 0.1 });
  A.tone({ type: 'sine', freq: 1766, freqEnd: 1700, duration: 0.6, volume: 0.03 * v, attack: 0.1 });
};

/** The scream: a shriek over a rumble. */
export const scream: SoundRecipe = (v) => {
  for (const d of [-40, 0, 35]) A.tone({ type: 'sawtooth', freq: 1100, freqEnd: 520, duration: 0.55, volume: 0.05 * v, detune: d, filter: { type: 'bandpass', freq: 1600, q: 1.5 } });
  A.noise({ duration: 0.5, volume: 0.18 * v, filter: 'bandpass', freq: 2200, freqEnd: 900, q: 1.2 });
  A.tone({ type: 'sine', freq: 70, freqEnd: 40, duration: 0.6, volume: 0.25 * v });
};

/** A whisper in the corner of the screen: breathy noise shaped like a word. */
export const whisper: SoundRecipe = (v) => {
  for (let i = 0; i < 3; i++) A.noise({ duration: 0.16, volume: 0.05 * v, filter: 'bandpass', freq: 2600 + i * 500, q: 6, attack: 0.05, when: A.now + i * 0.13 });
};

/**
 * A wrong-sounding voicing: a sine lead with a slow, sour detune (like a
 * theremin), a thin arpeggio dropped an octave, and no drums of its own.
 */
export const GHOSTFREAK_MUSIC: MusicLayerSpec = {
  arp: { wave: 'triangle', volume: 0.025, octave: -1, length: 1.4, filter: 1800, thin: true },
  lead: {
    wave: 'sine',
    volume: 0.06,
    octave: 0,
    length: 2.6,
    filter: 0,
    double: { wave: 'sine', volume: 0.035, octave: 0, length: 2.6, filter: 0, detune: 38 },
  },
};
