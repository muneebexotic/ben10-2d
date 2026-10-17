import { ROCKLING } from '../../../config/magic';
import { TELL } from '../../../config/tells';
import { CH6_TEX } from '../../../scenes/preload/karachi/keys';
import { pace } from '../../../systems/Difficulty';
import { chance, damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';
import { show } from './kit';
import { MAGIC_SFX } from './sfx';

/**
 * Charmcaster's rockling: a lumpy little stone critter. It eyes Ben, its
 * seams flare (the tell), then it curls into a ball and bowls along the
 * floor at him until it hits a wall, then sits there dizzy and open. Jump
 * it, meet it with a hit, or let it bowl itself out.
 */
export class RocklingBrain implements DroneBrain {
  readonly kind = 'rockling' as const;
  readonly texture = CH6_TEX.rockling;
  readonly maxHp = ROCKLING.hp;
  readonly body = ROCKLING.body;
  readonly walker = true;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const R = ROCKLING;
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    const floor = d.y + R.body.height / 2;
    switch (d.state) {
      case 'idle':
        if (!notices(d, w, R.noticeX, 60) || !f.grounded) {
          patrol(d, f, R.patrolSpeed, 40);
          break;
        }
        setFace(d, p.x - d.x);
        d.vx = damp(d.vx, 0.8);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.vx = 0;
          d.setState('windup');
          w.threat(d, w.now + R.windupMs);
          playSfx(MAGIC_SFX.rumble, 0.6);
        }
        break;
      case 'windup': {
        d.vx = 0;
        const t = d.stateT / R.windupMs;
        // A streak along the floor where it's about to roll.
        w.telegraph.dashed(d.x, floor - 2, d.x + faceOf(d) * (60 + t * 80), floor - 2, TELL.charmcaster, 0.35 + t * 0.5, d.stateT * 0.08, 2);
        if (d.stateT >= R.windupMs) {
          d.memo.dir = faceOf(d);
          d.setState('roll');
        }
        break;
      }
      case 'roll':
        d.vx = (d.memo.dir ?? 1) * R.rollSpeed;
        if (chance(0.5)) w.fx.trail('dust', d.x, floor);
        if (f.wall || d.stateT >= R.rollMaxMs) {
          d.vx = 0;
          d.kx = -(d.memo.dir ?? 1) * 90;
          d.setState('dazed');
          w.fx.burst('debris', d.x + (d.memo.dir ?? 1) * 6, d.y, 6);
          playSfx(MAGIC_SFX.clunk, 0.7);
        }
        break;
      case 'dazed':
        d.vx = damp(d.vx, 0.8);
        if (d.stateT >= R.dazedMs) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(R.restMs));
        }
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'dazed';
  }

  contactDamage(d: Drone): number {
    return d.state === 'roll' ? ROCKLING.rollDamage : ROCKLING.contactDamage;
  }

  damageTakenMultiplier(d: Drone): number {
    return d.state === 'dazed' ? 1.5 : 1;
  }

  /** A hit mid-roll stops it dead. */
  onHurt(d: Drone, w: DroneWorld, _hit: Hit): void {
    if (d.state !== 'roll' && d.state !== 'windup') return;
    w.cancelThreat(d);
    d.vx = 0;
    d.setState('dazed');
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'roll') show(d, 'rockling-roll');
    else if (d.state === 'windup') show(d, 4);
    else if (d.state === 'dazed') show(d, 5);
    else show(d, 'rockling-idle');
  }
}
