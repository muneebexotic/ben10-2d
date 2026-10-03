/**
 * Gameplay and effects were tuned at 60 frames per second, and some of them
 * are written per frame: a 30% chance of a smoke puff each frame, damping a
 * velocity by 0.85 each frame, closing 6% of a gap each frame. On a 120 Hz
 * screen those happen twice as often per second (enemies brake harder, trails
 * spawn twice the particles); at 30 fps half as often.
 *
 * The Level reports the real length of each frame once, first thing in its
 * update. These helpers then turn a per-60Hz-frame number into the same rate
 * per second at any refresh rate. At 60 Hz they give exactly the old numbers,
 * and they follow real time like the per-frame code did (they keep running
 * through hit-stop and slow motion, as before).
 */
export const REFERENCE_FRAME_MS = 1000 / 60;

/** Frame times on a 60 Hz screen wobble by a few percent; within this they count as exactly one frame. */
const SNAP = 0.05;

let scale = 1;

/** Call once per frame with the real (unscaled) frame length. */
export function setFrameLength(realDtMs: number): void {
  const s = Math.max(0, realDtMs) / REFERENCE_FRAME_MS;
  scale = Math.abs(s - 1) < SNAP ? 1 : s;
}

/** This frame's length in 60 Hz frames (1 at 60 Hz, 0.5 at 120 Hz, 2 at 30 fps). */
export function frameScale(): number {
  return scale;
}

/** A per-60Hz-frame probability, as this frame's chance. */
export function chance(perFrame: number, rng: () => number = Math.random): boolean {
  return rng() < perFrame * scale;
}

/** `value * perFrame` once per 60 Hz frame of real time. */
export function damp(value: number, perFrame: number): number {
  return value * Math.pow(perFrame, scale);
}

/** Moves `value` toward `target` by `perFrame` of the remaining gap per 60 Hz frame. */
export function approach(value: number, target: number, perFrame: number): number {
  return target + (value - target) * Math.pow(1 - perFrame, scale);
}

/** A per-60Hz-frame amount (e.g. "+0.5 each frame") for this frame. */
export function perFrame(amount: number): number {
  return amount * scale;
}
