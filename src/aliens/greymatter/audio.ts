import { audio } from '../../systems/audio/AudioEngine';
import type { MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** Shrinking down over the boom: a falling whistle and a little "computing" chirp sequence. */
export const greymatterTransform: SoundRecipe = (v) => {
  A.tone({ type: 'sine', freq: 1400, freqEnd: 2800, duration: 0.35, volume: 0.07 * v });
  A.tone({ type: 'triangle', freq: 600, freqEnd: 150, duration: 0.4, volume: 0.1 * v });
  for (const [i, f] of [1760, 2349, 1976, 2637, 3136].entries()) A.tone({ type: 'square', freq: f, duration: 0.04, volume: 0.035 * v, when: A.now + 0.18 + i * 0.05 });
};

/** A tiny nip. */
export const biteSnap: SoundRecipe = (v, p) => {
  A.tone({ type: 'square', freq: 1500 * p, freqEnd: 900 * p, duration: 0.04, volume: 0.06 * v });
  A.noise({ duration: 0.03, volume: 0.07 * v, filter: 'highpass', freq: 4000 });
};

/** The scan sweeping out: a rising data-modem warble. */
export const scanSweep: SoundRecipe = (v) => {
  for (let i = 0; i < 6; i++) A.tone({ type: 'square', freq: 900 + i * 260 + (i % 2) * 400, duration: 0.035, volume: 0.03 * v, when: A.now + i * 0.045 });
  A.tone({ type: 'sine', freq: 500, freqEnd: 1800, duration: 0.3, volume: 0.04 * v });
};

/** Weak point found: a bright two-note "got it". */
export const weakFound: SoundRecipe = (v) => {
  A.tone({ type: 'triangle', freq: 1568, duration: 0.08, volume: 0.07 * v });
  A.tone({ type: 'triangle', freq: 2349, duration: 0.18, volume: 0.07 * v, when: A.now + 0.08 });
};

/** Nothing to analyse: a short dismissive buzz. */
export const scanMiss: SoundRecipe = (v) => {
  A.tone({ type: 'square', freq: 220, freqEnd: 180, duration: 0.12, volume: 0.04 * v, filter: { type: 'lowpass', freq: 1200 } });
};

/** A hit on a weak point: a heavy thunk with a ringing ping on top. */
export const weakHit: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 140 * p, freqEnd: 50, duration: 0.18, volume: 0.3 * v });
  A.tone({ type: 'triangle', freq: 2637 * p, duration: 0.22, volume: 0.06 * v });
  A.noise({ duration: 0.08, volume: 0.12 * v, filter: 'lowpass', freq: 3000, freqEnd: 500 });
};

/**
 * A clever, precise voicing: a staccato square arpeggio two octaves up (like
 * a calculator thinking), a clean triangle lead, and quick hats.
 */
export const GREYMATTER_MUSIC: MusicLayerSpec = {
  arp: { wave: 'square', volume: 0.026, octave: 1, length: 0.45, filter: 4200 },
  lead: { wave: 'triangle', volume: 0.055, octave: 0, length: 1.2, filter: 0, double: { wave: 'square', volume: 0.018, octave: 1, length: 0.6, filter: 3000 } },
  hats16: 0.025,
};
