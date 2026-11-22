import { audio } from '../../../systems/audio/AudioEngine';
import type { SoundRecipe } from '../../../systems/audio/Sfx';

const A = audio;

/** Chapter 8's goons and toys: horns, squeaks, springs and the high striker's bell. */
export const CIRCUS_SFX: Record<string, SoundRecipe> = {
  /** A clown horn: two squeezes. */
  honk: (v, p) => {
    A.tone({ type: 'sawtooth', freq: 380 * p, freqEnd: 340 * p, duration: 0.12, volume: 0.1 * v, filter: { type: 'lowpass', freq: 1600 } });
    A.tone({ type: 'sawtooth', freq: 300 * p, freqEnd: 270 * p, duration: 0.14, volume: 0.1 * v, filter: { type: 'lowpass', freq: 1400 }, when: A.now + 0.15 });
  },
  whoosh: (v, p) => A.noise({ duration: 0.22, volume: 0.16 * v, filter: 'bandpass', freq: 700 * p, freqEnd: 2200 * p, q: 1 }),
  /** One note of a music-box tune (the jack-in-the-box winding up). */
  tune: (v, p) => {
    A.tone({ type: 'triangle', freq: 880 * p, duration: 0.12, volume: 0.09 * v });
    A.tone({ type: 'sine', freq: 1760 * p, duration: 0.08, volume: 0.03 * v });
  },
  boing: (v, p) => {
    A.tone({ type: 'sine', freq: 140 * p, freqEnd: 620 * p, duration: 0.25, volume: 0.18 * v });
    A.tone({ type: 'sine', freq: 140 * p, freqEnd: 620 * p, duration: 0.25, volume: 0.08 * v, detune: 50 });
  },
  clunk: (v) => {
    A.tone({ type: 'square', freq: 120, freqEnd: 60, duration: 0.15, volume: 0.12 * v });
    A.noise({ duration: 0.12, volume: 0.14 * v, filter: 'lowpass', freq: 900 });
  },
  /** A balloon twisting. */
  squeak: (v, p) => {
    A.tone({ type: 'square', freq: 900 * p, freqEnd: 1300 * p, duration: 0.14, volume: 0.05 * v, filter: { type: 'bandpass', freq: 1200, q: 3 } });
    A.tone({ type: 'square', freq: 1100 * p, freqEnd: 800 * p, duration: 0.12, volume: 0.05 * v, filter: { type: 'bandpass', freq: 1100, q: 3 }, when: A.now + 0.12 });
  },
  pop: (v) => {
    A.noise({ duration: 0.08, volume: 0.3 * v, filter: 'highpass', freq: 1200 });
    A.tone({ type: 'sine', freq: 200, freqEnd: 60, duration: 0.08, volume: 0.15 * v });
  },
  timber: (v) => {
    A.tone({ type: 'triangle', freq: 260, freqEnd: 90, duration: 0.6, volume: 0.14 * v });
    A.noise({ duration: 0.3, volume: 0.2 * v, filter: 'lowpass', freq: 600, when: A.now + 0.45 });
  },
  glass: (v, p) => {
    for (let i = 0; i < 6; i++) A.tone({ type: 'sine', freq: (2200 + i * 340) * p, duration: 0.09, volume: 0.04 * v, when: A.now + i * 0.025 });
    A.noise({ duration: 0.18, volume: 0.14 * v, filter: 'highpass', freq: 3000 });
  },
  /** A pinball bumper: a bright electric DING. */
  ding: (v, p) => {
    A.tone({ type: 'square', freq: 1320 * p, duration: 0.1, volume: 0.07 * v, filter: { type: 'lowpass', freq: 4000 } });
    A.tone({ type: 'sine', freq: 2640 * p, duration: 0.18, volume: 0.05 * v });
  },
  /** The high striker: a thump and the puck's rattle up the pole. */
  thump: (v) => {
    A.tone({ type: 'sine', freq: 90, freqEnd: 40, duration: 0.2, volume: 0.3 * v });
    A.noise({ duration: 0.25, volume: 0.1 * v, filter: 'bandpass', freq: 1800, freqEnd: 3200, q: 2, when: A.now + 0.05 });
  },
  bell: (v) => {
    for (const [f, vol] of [[988, 0.12], [1976, 0.05], [2964, 0.03]] as const) A.tone({ type: 'sine', freq: f, duration: 1.2, volume: vol * v });
  },
  /** Fear gas hissing out. */
  hiss: (v) => A.noise({ duration: 0.5, volume: 0.1 * v, filter: 'bandpass', freq: 2600, freqEnd: 1400, q: 1.5 }),
  /** A cackle: three falling yelps. */
  cackle: (v, p) => {
    for (let i = 0; i < 4; i++) A.tone({ type: 'sawtooth', freq: (520 - i * 40) * p, freqEnd: (440 - i * 40) * p, duration: 0.09, volume: 0.06 * v, filter: { type: 'bandpass', freq: 1400, q: 1.4 }, when: A.now + i * 0.11 });
  },
};
