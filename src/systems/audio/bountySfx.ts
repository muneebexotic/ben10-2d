import { audio as A, midiToFreq } from './AudioEngine';
import type { SoundRecipe } from './Sfx';

/**
 * Chapter 5's sounds: the hunters' gear, the mine and the ghost town. Played
 * with `playSfx(recipe)` like any alien's own sounds.
 */

/** A tracker drone painting Ben: a thin rising whine. */
export const trackerPaint: SoundRecipe = (v, p) => {
  A.tone({ type: 'sine', freq: 1200 * p, freqEnd: 2400 * p, duration: 1.3, volume: 0.035 * v, attack: 0.2 });
  A.tone({ type: 'square', freq: 2400 * p, duration: 0.05, volume: 0.03 * v });
};

/** LOCKED: two hard beeps. */
export const trackerLock: SoundRecipe = (v, p) => {
  for (let i = 0; i < 2; i++) A.tone({ type: 'square', freq: 1760 * p, duration: 0.07, volume: 0.08 * v, when: A.now + i * 0.1 });
};

/** LOCK LOST: a falling blip. */
export const trackerLost: SoundRecipe = (v, p) => {
  A.tone({ type: 'triangle', freq: 1400 * p, freqEnd: 500 * p, duration: 0.2, volume: 0.08 * v });
};

/** A missile screaming in from the sky. */
export const missileIncoming: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 1800 * p, freqEnd: 700 * p, duration: 0.7, volume: 0.04 * v, filter: { type: 'bandpass', freq: 1500, q: 2 } });
  A.noise({ duration: 0.7, volume: 0.06 * v, filter: 'bandpass', freq: 2600, freqEnd: 900, q: 1.5 });
};

/** A missile hitting the ground. */
export const missileBoom: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.45, volume: 0.36 * v, filter: 'lowpass', freq: 3200 * p, freqEnd: 160 });
  A.tone({ type: 'sine', freq: 110 * p, freqEnd: 38, duration: 0.4, volume: 0.42 * v });
};

/** A crab-bot's legs on rock: dry clicks. */
export const crabClick: SoundRecipe = (v, p) => {
  for (let i = 0; i < 3; i++) A.noise({ duration: 0.018, volume: 0.07 * v, filter: 'highpass', freq: 3000 * p, when: A.now + i * 0.045 });
};

/** Something burrowing: a gritty rumble. */
export const burrow: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.5, volume: 0.2 * v, filter: 'lowpass', freq: 600 * p, freqEnd: 200 });
  A.tone({ type: 'sine', freq: 60 * p, freqEnd: 45, duration: 0.5, volume: 0.25 * v });
};

/** Erupting out of the ground, claws first. */
export const erupt: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.3, volume: 0.34 * v, filter: 'lowpass', freq: 2400 * p, freqEnd: 300 });
  A.tone({ type: 'square', freq: 300 * p, freqEnd: 90 * p, duration: 0.15, volume: 0.1 * v });
};

/** A claw snapping shut. */
export const pinch: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.05, volume: 0.25 * v, filter: 'bandpass', freq: 2200 * p, q: 3 });
  A.tone({ type: 'square', freq: 700 * p, freqEnd: 300 * p, duration: 0.05, volume: 0.08 * v });
};

/** A shell flipping over with a clang. */
export const shellFlip: SoundRecipe = (v, p) => {
  A.tone({ type: 'square', freq: 420 * p, freqEnd: 380 * p, duration: 0.25, volume: 0.07 * v, detune: 25 });
  A.noise({ duration: 0.2, volume: 0.15 * v, filter: 'highpass', freq: 2500 });
};

/** A crystal sentry's glint: a high chime. */
export const glint: SoundRecipe = (v, p) => {
  A.tone({ type: 'triangle', freq: midiToFreq(96) * p, duration: 0.5, volume: 0.07 * v });
  A.tone({ type: 'sine', freq: midiToFreq(103) * p, duration: 0.3, volume: 0.04 * v, when: A.now + 0.06 });
};

/** A volley of shards: glassy zips. */
export const shardVolley: SoundRecipe = (v, p) => {
  for (let i = 0; i < 3; i++) A.noise({ duration: 0.06, volume: 0.1 * v, filter: 'bandpass', freq: (4200 + i * 600) * p, q: 4, when: A.now + i * 0.03 });
};

/** Crystal breaking into pieces. */
export const crystalBreak: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.35, volume: 0.24 * v, filter: 'highpass', freq: 3800 * p, freqEnd: 1800 });
  for (const [i, n] of [91, 86, 95].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n) * p, duration: 0.25, volume: 0.05 * v, when: A.now + i * 0.04 });
};

/** A dynamite fuse fizzing. */
export const fuse: SoundRecipe = (v) => {
  A.noise({ duration: 0.9, volume: 0.1 * v, filter: 'highpass', freq: 5000 });
};

/** Dynamite going off: the biggest bang in the mine. */
export const dynamiteBoom: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.9, volume: 0.5 * v, filter: 'lowpass', freq: 4200 * p, freqEnd: 90 });
  A.tone({ type: 'sine', freq: 95 * p, freqEnd: 28, duration: 0.8, volume: 0.55 * v });
};

/** Dust trickling from the ceiling. */
export const trickle: SoundRecipe = (v) => {
  for (let i = 0; i < 5; i++) A.noise({ duration: 0.03, volume: 0.05 * v, filter: 'bandpass', freq: 1800 + Math.random() * 1500, q: 3, when: A.now + i * 0.07 });
};

/** A rock smashing on the floor. */
export const rockSmash: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.25, volume: 0.3 * v, filter: 'lowpass', freq: 1400 * p, freqEnd: 200 });
  A.tone({ type: 'sine', freq: 80 * p, freqEnd: 40, duration: 0.2, volume: 0.3 * v });
};

/** Sixsix's net snapping around something. */
export const netSnap: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 220 * p, freqEnd: 880 * p, duration: 0.2, volume: 0.07 * v, filter: { type: 'lowpass', freq: 2400 } });
  A.noise({ duration: 0.25, volume: 0.15 * v, filter: 'bandpass', freq: 3000, q: 2 });
};

/** A security laser's hum when Ben walks into it. */
export const laserBurn: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 180 * p, freqEnd: 140 * p, duration: 0.2, volume: 0.07 * v, filter: { type: 'lowpass', freq: 1600 } });
  A.noise({ duration: 0.15, volume: 0.1 * v, filter: 'bandpass', freq: 3200, q: 3 });
};

/** A receiver lighting up and a crystal gate cracking open. */
export const receiverOn: SoundRecipe = (v) => {
  for (const [i, n] of [79, 83, 86, 91].entries()) A.tone({ type: 'triangle', freq: midiToFreq(n), duration: 0.22, volume: 0.07 * v, when: A.now + i * 0.07 });
};

/** Saloon doors swinging: a creak. */
export const creak: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 300 * p, freqEnd: 520 * p, duration: 0.5, volume: 0.03 * v, filter: { type: 'bandpass', freq: 900, q: 6 } });
};

/** Sixsix speaks: clicks (he only speaks in clicks). `laugh`: a fast cackle of them. */
export const sixsixClicks: SoundRecipe = (v, p) => {
  for (let i = 0; i < 6; i++) A.noise({ duration: 0.02, volume: 0.12 * v, filter: 'bandpass', freq: (2600 + (i % 3) * 500) * p, q: 6, when: A.now + i * 0.06 });
};

export const sixsixLaugh: SoundRecipe = (v, p) => {
  for (let i = 0; i < 12; i++) A.noise({ duration: 0.018, volume: 0.13 * v, filter: 'bandpass', freq: (2200 + (i % 4) * 400) * p, q: 6, when: A.now + i * 0.045 });
};

/** A jetpack roaring. */
export const jetpack: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.5, volume: 0.18 * v, filter: 'bandpass', freq: 900 * p, freqEnd: 1600 * p, q: 0.8 });
  A.tone({ type: 'sawtooth', freq: 70 * p, freqEnd: 110 * p, duration: 0.5, volume: 0.06 * v, filter: { type: 'lowpass', freq: 600 } });
};

/** Kraab's claw cannon charging: a long rising hum. */
export const clawCharge: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 70 * p, freqEnd: 420 * p, duration: 1.2, volume: 0.07 * v, filter: { type: 'lowpass', freq: 1800 } });
  A.tone({ type: 'sine', freq: 140 * p, freqEnd: 840 * p, duration: 1.2, volume: 0.06 * v });
};

/** The claw cannon firing. */
export const clawFire: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.4, volume: 0.36 * v, filter: 'lowpass', freq: 3000 * p, freqEnd: 300 });
  A.tone({ type: 'square', freq: 520 * p, freqEnd: 90 * p, duration: 0.3, volume: 0.1 * v });
};

/** Wind across the empty town. */
export const windGust: SoundRecipe = (v) => {
  A.noise({ duration: 1.6, volume: 0.05 * v, filter: 'bandpass', freq: 500, freqEnd: 900, q: 1.2, attack: 0.6 });
};

/** A mine cart's wheels clacking over rail joints. */
export const railClack: SoundRecipe = (v, p) => {
  A.noise({ duration: 0.03, volume: 0.14 * v, filter: 'bandpass', freq: 1600 * p, q: 3 });
  A.tone({ type: 'square', freq: 180 * p, duration: 0.03, volume: 0.05 * v });
};

/** Brakes screeching on steel. */
export const brakeScreech: SoundRecipe = (v, p) => {
  A.tone({ type: 'sawtooth', freq: 2400 * p, freqEnd: 2100 * p, duration: 0.6, volume: 0.04 * v, filter: { type: 'bandpass', freq: 2600, q: 8 } });
  A.noise({ duration: 0.6, volume: 0.06 * v, filter: 'highpass', freq: 4000 });
};

/** A lift's chain rattling as it moves. */
export const liftRattle: SoundRecipe = (v) => {
  for (let i = 0; i < 8; i++) A.noise({ duration: 0.02, volume: 0.07 * v, filter: 'bandpass', freq: 1400 + (i % 2) * 600, q: 4, when: A.now + i * 0.08 });
};
