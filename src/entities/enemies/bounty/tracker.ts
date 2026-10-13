import { TRACKER } from '../../../config/bounty';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { CH5_TEX } from '../../../scenes/preload/bounty';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import { trackerLock, trackerLost, trackerPaint } from '../../../systems/audio/bountySfx';
import { damp } from '../../../systems/Pacing';
import { canShoot, lineOfSight, rand, steer } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';

/**
 * Sixsix's tracker drone. Hovers high over Ben and paints him with a
 * targeting laser that thickens as the lock builds (the tell). Hold the line
 * of sight to the end and it's LOCKED: markers hit the ground and a missile
 * salvo lands a beat later. Duck under a roof, get behind a wall, phase out of
 * sight or shoot it down and the lock is lost.
 */
export class TrackerBrain implements DroneBrain {
  readonly kind = 'tracker' as const;
  readonly texture = CH5_TEX.tracker;
  readonly maxHp = TRACKER.hp;
  readonly body = TRACKER.body;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const p = w.player;
    if (d.state === 'idle') {
      if (Math.abs(p.x - d.x) > 30) d.side = d.x < p.x ? -1 : 1;
      const ground = w.groundBelow(p.x, p.y - 4);
      const tx = p.x + d.side * TRACKER.hoverOffsetX + Math.sin(w.now * 0.0013 + d.seed) * 22;
      const ty = Math.min(ground, p.y) - TRACKER.hoverAbove + Math.sin(w.now * 0.0035 + d.seed) * 5;
      steer(d, tx, ty, TRACKER.moveSpeed, 1.4);
      if (w.now >= d.nextActionAt && d.stunLeft <= 0 && canShoot(d, w, TRACKER.aggroRange) && lineOfSight(w, d.x, d.y, p.x, p.centerY)) {
        d.setState('paint');
        d.memo.blind = 0;
        d.setCharging(true);
        w.threat(d, w.now + TRACKER.paintMs + TRACKER.salvo.warnMs);
        playSfx(trackerPaint, 0.6);
      }
      return;
    }
    if (d.state === 'paint') {
      d.vx = damp(d.vx, 0.85);
      d.vy = damp(d.vy, 0.85);
      const seen = !p.dead && !p.cloaked && lineOfSight(w, d.x, d.y, p.x, p.centerY);
      d.memo.blind = seen ? 0 : (d.memo.blind ?? 0) + dtMs;
      if (d.memo.blind > TRACKER.sightGraceMs) {
        this.loseLock(d, w);
        return;
      }
      const t = Math.min(1, d.stateT / TRACKER.paintMs);
      const lx = d.x + 6 * (p.x > d.x ? 1 : -1);
      // The beam stops at whatever's in the way (it's the lock you see, not a shot).
      if (seen) {
        const flicker = blinkOn(d.stateT, t > 0.75 ? 50 : 110) ? 0.25 : 0;
        w.telegraph.line(lx, d.y + 1, p.x, p.centerY, TELL.sixsix, 0.35 + t * 0.5 + flicker, t > 0.6 ? 2 : 1);
        w.telegraph.reticle(p.x, p.centerY, TELL.sixsix, 1.8 - t * 0.8, d.stateT * 0.006, 0.4 + t * 0.6);
      }
      w.lighting.add(d.x, d.y, 18 + t * 26, PALETTE.sixsix, 0.9);
      if (d.stateT >= TRACKER.paintMs) {
        w.fx.popText(p.x, p.y - 50, 'LOCKED!', PALETTE.enemy);
        playSfx(trackerLock, 0.9);
        w.salvo?.(p.x, w.groundBelow(p.x, p.y - 4), d);
        d.setCharging(false);
        d.setState('recover');
      }
      return;
    }
    if (d.state === 'recover') {
      d.vx = damp(d.vx, 0.9);
      d.vy = damp(d.vy, 0.9) - 6;
      if (d.stateT > 500) {
        d.setState('idle');
        d.nextActionAt = w.now + pace.rest(rand(TRACKER.restMs));
      }
    }
  }

  private loseLock(d: Drone, w: DroneWorld): void {
    w.cancelThreat(d);
    w.fx.popText(d.x, d.y - 12, 'LOCK LOST', PALETTE.sixsix);
    playSfx(trackerLost, 0.7);
    d.setCharging(false);
    d.setState('recover');
  }

  harmful(): boolean {
    return true;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    d.stunLeft = TRACKER.hurtStunMs;
    if (d.state === 'paint') this.loseLock(d, w);
  }

  render(d: Drone): void {
    d.sprite.setFlipX(d.side > 0);
  }
}
