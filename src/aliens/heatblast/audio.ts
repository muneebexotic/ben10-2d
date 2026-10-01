import { audio } from '../../systems/audio/AudioEngine';
import { HERO_LAYER, type MusicLayerSpec } from '../../systems/audio/Music';
import type { SoundRecipe } from '../../systems/audio/Sfx';

const A = audio;

/** Ignition: a rushing whoomp as the flames catch. */
export const heatblastTransform: SoundRecipe = (v) => {
  A.noise({ duration: 0.5, volume: 0.28 * v, filter: 'bandpass', freq: 300, freqEnd: 3200, q: 0.8, attack: 0.08 });
  A.tone({ type: 'sine', freq: 90, freqEnd: 45, duration: 0.4, volume: 0.3 * v, when: A.now + 0.05 });
};

/** Swap-in flame nova. */
export const flameNova: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.4, volume: 0.35 * v, filter: 'lowpass', freq: 4500 * p, freqEnd: 200 });
  A.tone({ type: 'sawtooth', freq: 300 * p, freqEnd: 90 * p, duration: 0.3, volume: 0.08 * v });
};

/** Heatblast keeps the original hero layer: bright square arpeggio and a doubled lead. */
export const HEATBLAST_MUSIC: MusicLayerSpec = HERO_LAYER;
