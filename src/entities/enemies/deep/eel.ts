import { EEL } from '../../../config/plumber';
import { TELL } from '../../../config/tells';
import { DEEP_TEX } from '../../../scenes/preload/cartoon/plumber/deepSheets';
import { pace } from '../../../systems/Difficulty';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { show } from '../magic/kit';
import { faceOf, setFace } from '../mutants/kit';
import { seesBen, swimPhysics } from './kit';
import { DEEP_SFX } from './sfx';

const ZAP = 0x8af0ff;

/**
 * A zapper eel: it winds slow loops through its patch of dark water. Close to
 * Ben it coils, glows and crackles (the tell: a red ring where the shock will
 * reach), then a shock ring goes out through the water. Drained out of its
 * tank, it just flops (and takes double).
 */
export class EelBrain implements DroneBrain {
  readonly kind = 'eel' as const;
  readonly texture = DEEP_TEX.eel;
  readonly maxHp = EEL.hp;
  readonly body = EEL.body;
  readonly organic = { glow: ZAP };

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const E = EEL;
    const wet = swimPhysics(d, w, dtMs);
    if (!wet) {
      if (d.state !== 'dry') {
        w.cancelThreat(d);
        d.setState('dry');
      }
      if (chance(0.03)) d.kx += (Math.random() - 0.5) * 60;
      return;
    }
    if (d.state === 'dry') d.setState('idle');
    const p = w.player;
    switch (d.state) {
      case 'idle': {
        // A slow figure of eight around home.
        const t = w.now * 0.001 * (E.swimSpeed / E.roam) + d.seed;
        const tx = d.homeX + Math.sin(t) * E.roam;
        const ty = d.homeY + Math.sin(t * 2) * E.roam * 0.2;
        d.vx = Math.max(-E.swimSpeed, Math.min(E.swimSpeed, (tx - d.x) * 2));
        d.vy = Math.max(-E.swimSpeed, Math.min(E.swimSpeed, (ty - d.y) * 2));
        if (Math.abs(d.vx) > 4) setFace(d, d.vx);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0 && seesBen(d, w, E.noticeRange)) {
          d.setState('charge');
          setFace(d, p.x - d.x);
          w.threat(d, w.now + E.chargeMs);
          playSfx(DEEP_SFX.crackle, 0.8);
        }
        break;
      }
      case 'charge': {
        d.vx *= 0.85;
        d.vy *= 0.85;
        const k = d.stateT / E.chargeMs;
        w.telegraph.circle(d.x, d.y, E.shockRadius, TELL.deepmaw, 0.2 + k * 0.6);
        w.telegraph.circle(d.x, d.y, E.shockRadius * k, TELL.deepmaw, 0.5);
        w.lighting.add(d.x, d.y, 30 + k * 30, ZAP, 0.5 + k * 0.5);
        if (chance(0.5)) w.fx.burst('volt', d.x + (Math.random() - 0.5) * 18, d.y + (Math.random() - 0.5) * 8, 1);
        if (d.stateT >= E.chargeMs) {
          // The shock: one burst as wide as the ring (a still, invisible shot).
          const shot = w.projectiles.spawn('mana', 'enemy', d.x, d.y, 0, 0, E.shockDamage, E.shockMs, E.shockRadius, { knockback: 160 });
          shot.sprite.setAlpha(0);
          w.lighting.flash(d.x, d.y, E.shockRadius * 2, ZAP, 220);
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            w.fx.burst('volt', d.x + Math.cos(a) * E.shockRadius * 0.8, d.y + Math.sin(a) * E.shockRadius * 0.8, 1);
          }
          w.fx.shake(0.003, 140);
          playSfx(DEEP_SFX.zap, 1);
          d.setState('zap');
        }
        break;
      }
      case 'zap':
        d.vx = 0;
        d.vy = 0;
        if (d.stateT >= E.shockMs + 200) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(E.restMs));
        }
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'dry';
  }

  contactDamage(): number {
    return EEL.contactDamage;
  }

  damageTakenMultiplier(d: Drone): number {
    return d.state === 'dry' ? EEL.dryDamageTaken : 1;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    // A good hit breaks its charge.
    if (d.state !== 'charge') return;
    w.cancelThreat(d);
    d.setState('idle');
    d.nextActionAt = w.now + pace.rest(rand(EEL.restMs));
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'dry') show(d, 'eel-flop');
    else if (d.state === 'charge') show(d, 'eel-charge');
    else if (d.state === 'zap') show(d, 'eel-zap');
    else show(d, 'eel-swim');
    if (d.alive && d.state !== 'dry') w.lighting.add(d.x, d.y, 22, ZAP, 0.45);
  }
}
