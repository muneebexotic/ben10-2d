import { ILLUSION } from '../../../config/magic';
import { PALETTE } from '../../../config/palette';
import { CH6_TEX } from '../../../scenes/preload/karachi/keys';
import { pace } from '../../../systems/Difficulty';
import { damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, setFace } from '../mutants/kit';
import { show } from './kit';
import { MAGIC_SFX } from './sfx';

/**
 * One of Hex's illusions: a perfect copy of the magician that drifts above
 * the floor and throws a slow spell bolt now and then. It pops at a touch.
 * Something that senses (Gwen's REVEAL, Wildmutt) sees through it: up close
 * it turns see-through and shimmers, so the real Hex stands out among them.
 */
export class IllusionBrain implements DroneBrain {
  readonly kind = 'illusion' as const;
  readonly texture = CH6_TEX.hex;
  readonly maxHp = ILLUSION.hp;
  readonly body = ILLUSION.body;
  readonly hackable = false;

  update(d: Drone, w: DroneWorld): void {
    const I = ILLUSION;
    const p = w.player;
    const dx = p.x - d.x;
    switch (d.state) {
      case 'idle': {
        setFace(d, dx);
        // Hover near home at a little above head height, edging toward Ben.
        const tx = d.homeX + Math.max(-60, Math.min(60, dx * 0.3));
        d.vx = Math.sign(tx - d.x) * Math.min(I.driftSpeed, Math.abs(tx - d.x) * 2);
        d.vy = (d.homeY - 6 + Math.sin(w.now * 0.003 + d.seed) * 4 - d.y) * 2;
        if (w.aggressive && Math.abs(dx) < I.noticeX && w.now >= d.nextActionAt && d.stunLeft <= 0 && w.onScreen(d.x, d.y, -10) && !p.dead) {
          d.setState('cast');
          w.threat(d, w.now + I.castMs);
        }
        break;
      }
      case 'cast':
        d.vx = damp(d.vx, 0.8);
        d.vy = damp(d.vy, 0.8);
        w.lighting.add(d.x + faceOf(d) * 10, d.y - 14, 18 + (d.stateT / I.castMs) * 20, PALETTE.hex, 0.9);
        if (d.stateT >= I.castMs) {
          const a = Math.atan2(p.centerY - (d.y - 14), p.x - d.x);
          w.projectiles.spawn('spell', 'enemy', d.x + faceOf(d) * 10, d.y - 14, Math.cos(a) * I.boltSpeed, Math.sin(a) * I.boltSpeed, I.boltDamage, 2600, 4, { hitKind: 'burst' });
          playSfx(MAGIC_SFX.zap, 0.6);
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(I.restMs));
        }
        break;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return ILLUSION.contactDamage;
  }

  deathFx(d: Drone, w: DroneWorld): void {
    w.fx.burst('mana', d.x, d.y, 18);
    w.fx.ring(d.x, d.y, PALETTE.hex, 28, 260);
    w.fx.popText(d.x, d.y - 26, 'POOF!', PALETTE.hex);
    playSfx(MAGIC_SFX.poof, 0.8);
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    show(d, d.state === 'cast' ? 3 : 'illusion-idle');
    // Seen through by anything that senses: see-through and shimmering.
    const p = w.player;
    const seen = p.senseRadius > 0 && Math.hypot(p.x - d.x, p.centerY - d.y) < p.senseRadius + 20;
    d.sprite.setAlpha(seen ? 0.35 + Math.sin(w.now * 0.03) * 0.15 : 1);
  }
}
