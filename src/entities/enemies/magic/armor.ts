import { ARMOR } from '../../../config/magic';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { CH6_TEX } from '../../../scenes/preload/karachi/keys';
import { pace } from '../../../systems/Difficulty';
import { damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';
import { show } from './kit';
import { MAGIC_SFX } from './sfx';

/** A hit that lands on the shield: from the front, and not heavy enough to knock it aside. */
export function shieldBlocks(face: 1 | -1, x: number, hit: Pick<Hit, 'x' | 'heavy' | 'kind'>): boolean {
  if (hit.heavy || hit.kind === 'smash') return false;
  return Math.sign(hit.x - x) === face;
}

/**
 * The palace's enchanted armor: an empty suit with a violet glow behind the
 * visor and a round shield it always keeps toward Ben. Front hits clang off.
 * It closes in, raises its sword (the tell: the blade rings) and strikes.
 * A smash (Four Arms), or any hit from behind, knocks the shield aside and
 * leaves it staggered and open.
 */
export class ArmorBrain implements DroneBrain {
  readonly kind = 'armor' as const;
  readonly texture = CH6_TEX.armor;
  readonly maxHp = ARMOR.hp;
  readonly body = ARMOR.body;
  readonly walker = true;
  readonly hackable = false;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const A = ARMOR;
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    const floor = d.y + A.body.height / 2;
    switch (d.state) {
      case 'idle': {
        if (!notices(d, w, A.noticeX, 70) || !f.grounded) {
          patrol(d, f, A.patrolSpeed, 48);
          break;
        }
        const dx = p.x - d.x;
        setFace(d, dx);
        if (Math.abs(dx) < A.strikeRange && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.vx = 0;
          d.setState('windup');
          w.threat(d, w.now + A.windupMs);
          playSfx(MAGIC_SFX.shing, 0.7);
        } else {
          d.vx = f.wall || f.ledge || Math.abs(dx) < 18 ? damp(d.vx, 0.7) : Math.sign(dx) * A.walkSpeed;
        }
        break;
      }
      case 'windup':
        d.vx = 0;
        w.telegraph.zone(d.x + faceOf(d) * 14 - 16, floor - 30, 32, 30, TELL.hex, 0.35 + (d.stateT / A.windupMs) * 0.55, d.stateT * 0.05, faceOf(d));
        if (d.stateT >= A.windupMs) {
          d.setState('strike');
          d.kx += faceOf(d) * 140;
        }
        break;
      case 'strike':
        d.vx = 0;
        if (d.stateT >= A.strikeMs) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(A.restMs));
        }
        break;
      case 'staggered':
        d.vx = damp(d.vx, 0.8);
        if (d.stateT >= pace.punish(A.staggeredMs)) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(A.restMs));
        }
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'staggered';
  }

  contactDamage(d: Drone): number {
    return d.state === 'strike' ? ARMOR.strikeDamage : ARMOR.contactDamage;
  }

  damageTakenMultiplier(d: Drone, hit: Hit): number {
    if (d.state === 'staggered') return ARMOR.staggeredMultiplier;
    return shieldBlocks(faceOf(d), d.x, hit) ? ARMOR.shieldMultiplier : 1;
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    if (d.state === 'staggered') return;
    if (shieldBlocks(faceOf(d), d.x, hit)) {
      w.fx.burst('spark', d.x + faceOf(d) * 10, d.y, 5);
      playSfx(MAGIC_SFX.clang, 0.7);
      return;
    }
    // Smashed, or hit from behind: the shield goes flying aside.
    w.cancelThreat(d);
    d.setState('staggered');
    w.fx.popText(d.x, d.y - 22, 'OPEN!', PALETTE.hex);
    playSfx(MAGIC_SFX.clang, 0.9, 0.7);
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'windup') show(d, 3);
    else if (d.state === 'strike') show(d, 4);
    else if (d.state === 'staggered') show(d, 5);
    else if (Math.abs(d.vx) > 3) show(d, 'armor-walk');
    else show(d, 0);
    w.lighting.add(d.x + faceOf(d) * 3, d.y - 10, 14, PALETTE.hex, 0.6);
  }
}
