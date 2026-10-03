import type Phaser from 'phaser';
import { REFERENCE_FRAME_MS } from './Pacing';

const REFERENCE_DT = REFERENCE_FRAME_MS / 1000;

/**
 * Arcade physics updates velocity, then moves the body by the new velocity
 * (semi-implicit Euler) over the real frame length. Under gravity that path
 * depends on the frame length: a jump peaks higher on a 120 Hz screen and
 * lower at 30 fps than at the 60 Hz everything was tuned at.
 *
 * Under constant acceleration the 60 Hz stepped path is exactly a parabola
 * (as if launched half a 60 Hz frame of acceleration later), so any frame
 * length can follow it: move by the new velocity plus half the velocity
 * change times (60 Hz frame - this frame). At 60 Hz the extra term is zero,
 * so nothing changes there; elsewhere jumps, knockbacks and thrown things
 * land where they would at 60 Hz.
 */
export function referenceOffset(velocityBefore: number, velocityAfter: number, dtSec: number): number {
  return 0.5 * (velocityAfter - velocityBefore) * (REFERENCE_DT - dtSec);
}

const installed = new WeakSet<Phaser.Physics.Arcade.World>();

/** Wraps the world's per-body velocity update to add the 60 Hz-matching offset before the body moves. */
export function installReferenceIntegration(world: Phaser.Physics.Arcade.World): void {
  if (installed.has(world)) return;
  installed.add(world);
  const updateMotion = world.updateMotion.bind(world);
  world.updateMotion = (body: Phaser.Physics.Arcade.Body, delta: number) => {
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    updateMotion(body, delta);
    if (body.directControl) return;
    body.position.x += referenceOffset(vx, body.velocity.x, delta);
    body.position.y += referenceOffset(vy, body.velocity.y, delta);
  };
}
