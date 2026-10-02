import { BAT } from '../../../config/mutants';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { playSfx } from '../../../systems/audio/Sfx';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { aimAt, canShoot, rand, steer } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';

/**
 * Mutant bat: hangs asleep until Ben comes close, flutters above him, then
 * screeches (red eyes, the tell) and swoops along a locked line. A single
 * slime glob gums its wings and drops it; fire works too.
 */
export class BatBrain implements DroneBrain {
  readonly kind = 'bat' as const;
  readonly texture = TEX.bat;
  readonly maxHp = BAT.hp;
  readonly body = BAT.body;
  readonly organic = { glow: PALETTE.animo };
  readonly slimeGroundsAt = BAT.slimeGroundsAt;

  update(d: Drone, w: DroneWorld): void {
    const p = w.player;
    switch (d.state) {
      case 'idle':
        // Roosting: hangs still until Ben is close.
        d.vx = 0;
        d.vy = 0;
        if (Math.abs(p.x - d.x) < BAT.wakeRange && !p.dead && w.aggressive) {
          d.setState('hover');
          playSfx('screech', 0.35, 1.4);
          d.sprite.play('bat-idle');
        }
        break;
      case 'hover': {
        const t = w.now * 0.003 + d.seed;
        const ground = w.groundBelow(d.x, d.y);
        const ty = Math.min(p.centerY + BAT.hoverOffsetY + Math.sin(t * 1.7) * 12, ground - 30);
        steer(d, p.x + Math.sin(t) * 60, ty, BAT.hoverSpeed, 2.6);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0 && canShoot(d, w, 260)) {
          d.setState('screech');
          d.setCharging(true);
          w.threat(d, w.now + BAT.screechMs + 120);
          playSfx('screech', 0.6);
        }
        break;
      }
      case 'screech': {
        d.vx *= 0.85;
        d.vy *= 0.85;
        if (d.stateT < BAT.screechMs - 120) d.aim = aimAt(d, w);
        const locked = d.stateT >= BAT.screechMs - 120;
        w.telegraph.dashed(d.x, d.y, d.x + Math.cos(d.aim) * 140, d.y + Math.sin(d.aim) * 140, PALETTE.animo, locked ? 0.9 : blinkOn(d.stateT, 60) ? 0.5 : 0.25, d.stateT * 0.06, locked ? 2 : 1);
        if (d.stateT >= BAT.screechMs) {
          d.setCharging(false);
          d.setState('swoop');
        }
        break;
      }
      case 'swoop':
        d.vx = Math.cos(d.aim) * BAT.swoopSpeed;
        d.vy = Math.sin(d.aim) * BAT.swoopSpeed;
        if (d.stateT >= BAT.swoopMs || w.isSolid(d.x + Math.sign(d.vx) * 9, d.y) || w.isSolid(d.x, d.y + 7)) {
          w.cancelThreat(d);
          d.nextActionAt = w.now + pace.rest(rand(BAT.recoverMs));
          d.setState('hover');
        }
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'idle';
  }

  contactDamage(): number {
    return BAT.contactDamage;
  }

  onRecover(d: Drone): void {
    d.setState('hover');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(d.vx < -5);
    if (d.state === 'idle') d.sprite.stop().setFrame(3);
  }
}
