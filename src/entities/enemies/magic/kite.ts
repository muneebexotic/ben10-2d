import { KITE } from '../../../config/magic';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { CH6_TEX } from '../../../scenes/preload/karachi/keys';
import { pace } from '../../../systems/Difficulty';
import { damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Hit } from '../../types';
import { rand, steer } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { show } from './kit';
import { MAGIC_SFX } from './sfx';

/**
 * A paper kite Hex bewitched at the fair: painted eyes glowing violet, it
 * rides the sea breeze high over Ben, lines up (a dashed line) and dives
 * along it, then flutters back up. Paper: one hit tears it, and fire burns
 * it on the spot.
 */
export class KiteBrain implements DroneBrain {
  readonly kind = 'kite' as const;
  readonly texture = CH6_TEX.kite;
  readonly maxHp = KITE.hp;
  readonly body = KITE.body;
  readonly hackable = false;
  readonly organic = { glow: PALETTE.hex };

  update(d: Drone, w: DroneWorld): void {
    const K = KITE;
    const p = w.player;
    switch (d.state) {
      case 'idle': {
        const ground = w.groundBelow(p.x, p.y - 4);
        const tx = p.x + Math.sin(w.now * 0.0011 + d.seed) * 90;
        steer(d, tx, Math.min(ground, p.y) - K.hoverAbove + Math.sin(w.now * 0.003 + d.seed) * 10, K.flySpeed, 1.2);
        if (w.aggressive && w.now >= d.nextActionAt && d.stunLeft <= 0 && !p.dead && w.onScreen(d.x, d.y, 0) && d.y < p.y - 40) {
          d.setState('lock');
          w.threat(d, w.now + K.lockMs);
        }
        break;
      }
      case 'lock': {
        d.vx = damp(d.vx, 0.85);
        d.vy = damp(d.vy, 0.85);
        if (d.stateT < K.lockMs - 140) {
          d.lockX = p.x;
          d.lockY = p.centerY;
        }
        const t = d.stateT / K.lockMs;
        w.telegraph.dashed(d.x, d.y, d.lockX, d.lockY, TELL.hex, 0.3 + t * 0.6, d.stateT * 0.08, t > 0.75 ? 2 : 1);
        if (d.stateT >= K.lockMs) {
          d.aim = Math.atan2(d.lockY - d.y, d.lockX - d.x);
          d.setState('dive');
          playSfx(MAGIC_SFX.flap, 0.8);
        }
        break;
      }
      case 'dive':
        d.vx = Math.cos(d.aim) * K.diveSpeed;
        d.vy = Math.sin(d.aim) * K.diveSpeed;
        if (d.stateT >= K.diveMaxMs || w.isSolid(d.x, d.y + 8)) {
          d.setState('idle');
          d.ky = -120;
          d.nextActionAt = w.now + pace.rest(rand(K.restMs));
        }
        break;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(d: Drone): number {
    return d.state === 'dive' ? KITE.diveDamage : KITE.contactDamage;
  }

  /** Paper: fire burns it at once. */
  damageTakenMultiplier(_d: Drone, hit: Hit): number {
    return hit.kind === 'fire' ? 10 : 1;
  }

  deathFx(d: Drone, w: DroneWorld): void {
    w.fx.burst(d.lastHitKind === 'fire' ? 'fire' : 'debris', d.x, d.y, 10);
    w.fx.burst('mana', d.x, d.y, 6);
    playSfx(MAGIC_SFX.flap, 0.9, 1.4);
  }

  render(d: Drone): void {
    show(d, d.state === 'dive' ? 2 : 'kite-hover');
    d.sprite.setRotation(d.state === 'dive' ? d.aim - Math.PI / 2 : Math.sin(d.seed + d.stateT * 0.004) * 0.2);
  }
}
