import { wave, type Pose } from '../../rig';
import type { FrameClip } from '../../cutout/frameRig';

const hover = (amount: number) => (t: number, p: Pose) => p.move('body', 0, wave(t) * amount);

/**
 * The drone's drawings (docs/art-refs/drone-model-sheet.webp): on its beat (the game's
 * green light glows in its lens) and locked on, red; it fires locked on, kicking back.
 */
export const WARDEN_FRAME_CLIPS: Readonly<Record<string, FrameClip>> = {
  idle: { frames: ['idle'], ms: 1400, loop: true, motion: hover(0.8) },
  lock: { frames: ['lock'], ms: 400, loop: true, motion: (t, p) => p.move('body', 0.6, wave(t) * 0.3) },
  fire: { frames: ['lock'], ms: 300, loop: false, motion: (t, p) => p.move('body', -1.6 * Math.sin(Math.PI * Math.min(1, t * 2)), 0) },
};
