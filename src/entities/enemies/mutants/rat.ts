import { MUTANT_SHARED, RAT } from '../../../config/mutants';
import { TEX } from '../../../scenes/preload/assetKeys';
import { playSfx } from '../../../systems/audio/Sfx';
import { pace } from '../../../systems/Difficulty';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from './kit';

/**
 * Mutant rat: comes in packs. Scurries at Ben, crouches with a squeak (the
 * tell), then leaps. Fragile on its own; a pack is what hurts. Wildmutt's
 * rakes and pounce, XLR8's flurries and Four Arms' slam clear a pack.
 */
export class RatBrain implements DroneBrain {
  readonly kind = 'rat' as const;
  readonly texture = TEX.rat;
  readonly maxHp = RAT.hp;
  readonly body = RAT.body;
  readonly walker = true;
  readonly organic = { glow: MUTANT_SHARED.glow };

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    switch (d.state) {
      case 'idle':
        patrol(d, f, RAT.patrolSpeed, 50);
        if (notices(d, w)) d.setState('chase');
        break;
      case 'chase': {
        const dx = p.x - d.x;
        setFace(d, dx);
        if (f.grounded) d.vx = Math.sign(dx) * RAT.runSpeed * (f.ledge ? 0 : 1);
        if (!notices(d, w, MUTANT_SHARED.noticeX * 1.4, MUTANT_SHARED.noticeY * 1.5)) d.setState('idle');
        else if (Math.abs(dx) < RAT.leapRange && f.grounded && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.setState('crouch');
          d.setCharging(true);
          w.threat(d, w.now + RAT.crouchMs + 120);
          playSfx('squeak', 0.7, 0.9 + Math.random() * 0.3);
        }
        break;
      }
      case 'crouch':
        d.vx *= 0.7;
        if (d.stateT >= RAT.crouchMs) {
          const dir = faceOf(d);
          d.vx = dir * RAT.leapVx;
          d.vy = -RAT.leapVy;
          d.setState('leap');
          d.sprite.setFrame(3);
          playSfx('skitter', 0.6);
        }
        break;
      case 'leap':
        if (f.grounded && d.stateT > 120) {
          d.vx = 0;
          w.cancelThreat(d);
          d.setState('recover');
          d.setCharging(false);
          w.fx.burst('dust', d.x, d.y + RAT.body.height / 2, 3);
        }
        break;
      case 'recover':
        d.vx *= 0.8;
        if (d.stateT > 300) {
          d.nextActionAt = w.now + pace.rest(rand(RAT.recoverMs));
          d.setState('chase');
        }
        break;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return RAT.contactDamage;
  }

  onRecover(d: Drone): void {
    d.setState('chase');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'chase' || d.state === 'idle') {
      const key = Math.abs(d.vx) > 80 ? 'rat-run' : 'rat-idle';
      if (d.sprite.anims.currentAnim?.key !== key || !d.sprite.anims.isPlaying) d.sprite.play(key, true);
    }
  }
}
