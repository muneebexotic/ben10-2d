import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** A wet wingbeat buzz that rises into a whine. */
export const stinkflyTransform: SoundRecipe = (v) => {
  A.tone({ type: 'sawtooth', freq: 160, freqEnd: 420, duration: 0.45, volume: 0.09 * v, detune: 30, filter: { type: 'bandpass', freq: 900, q: 2 } });
  A.tone({ type: 'square', freq: 210, freqEnd: 520, duration: 0.45, volume: 0.04 * v, detune: -25 });
  A.noise({ duration: 0.2, volume: 0.15 * v, filter: 'lowpass', freq: 1200, freqEnd: 300, when: A.now + 0.3 });
};

/** One wingbeat: played in quick succession it becomes the flight buzz. */
export const buzz: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 190 * p, freqEnd: 170 * p, duration: 0.07, volume: 0.05 * v, filter: { type: 'bandpass', freq: 1100 * p, q: 3 } });
};

export const takeoff: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.16, volume: 0.16 * v, filter: 'bandpass', freq: 700 * p, freqEnd: 2200 * p, q: 1.3 });
  A.tone({ type: 'sawtooth', freq: 150 * p, freqEnd: 260 * p, duration: 0.16, volume: 0.06 * v, filter: { type: 'lowpass', freq: 1600 } });
};

/** A wet "PTOO" from the eyestalks. */
export const slimeSpit: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 520 * p, freqEnd: 180 * p, duration: 0.09, volume: 0.16 * v });
  A.noise({ duration: 0.08, volume: 0.12 * v, filter: 'bandpass', freq: 1500 * p, freqEnd: 600 * p, q: 2 });
};

/** A long, rude hiss of gas. */
export const stinkVent: SoundRecipe = (v) => {
  A.noise({ duration: 0.6, volume: 0.16 * v, filter: 'bandpass', freq: 500, freqEnd: 260, q: 1.5, attack: 0.03 });
  A.tone({ type: 'sawtooth', freq: 70, freqEnd: 55, duration: 0.5, volume: 0.07 * v, detune: 40, filter: { type: 'lowpass', freq: 420 } });
};

/** A bouncy, buzzing layer: a nasal saw lead and offbeat hats. */
export const STINKFLY_MUSIC: MusicLayerSpec = {
  arp: { wave: 'square', volume: 0.024, octave: 1, length: 0.35, filter: 3800, thin: true },
  lead: {
    wave: 'sawtooth',
    volume: 0.03,
    octave: 0,
    length: 0.8,
    filter: 2400,
    double: { wave: 'square', volume: 0.016, octave: 1, length: 0.4, filter: 4200, detune: 12 },
  },
  hats16: 0.026,
};
