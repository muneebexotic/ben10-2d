import { JELLY } from '../../../config/plumber';
import { DEEP_TEX } from '../../../scenes/preload/cartoon/plumber/deepSheets';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { show } from '../magic/kit';
import { deepEnv, seesBen, swimPhysics } from './kit';
import { DEEP_SFX } from './sfx';

const GLOW = 0xff8ad8;

/**
 * A jelly mine: a pulsing bell of stinging tendrils, drifting. It wanders a
 * little, and closes in slowly when Ben is near. Touch it and it stings; hit
 * it and it pops, and its pop sets off every jelly close to it, one after
 * another (lure a few together and pop the lot from range).
 */
export class JellyBrain implements DroneBrain {
  readonly kind = 'jelly' as const;
  readonly texture = DEEP_TEX.jelly;
  readonly maxHp = JELLY.hp;
  readonly body = JELLY.body;
  readonly organic = { glow: GLOW };
  readonly slimeGroundsAt = 99;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const J = JELLY;
    deepEnv.jellies.add(d);
    if (!swimPhysics(d, w, dtMs)) return;
    const p = w.player;
    const t = w.now * 0.001 + d.seed;
    if (seesBen(d, w, J.seekRange)) {
      const a = Math.atan2(p.centerY - d.y, p.x - d.x);
      d.vx = Math.cos(a) * J.seekSpeed;
      d.vy = Math.sin(a) * J.seekSpeed;
    } else {
      // Pulsing: a push up on each beat, a slow sink between.
      d.vx = (d.homeX + Math.sin(t * 0.4) * 14 - d.x) * 0.8;
      d.vy = (Math.sin(t * 3) > 0.6 ? -J.drift * 2 : J.drift * 0.6) + (d.homeY - d.y) * 0.5;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return JELLY.contactDamage;
  }

  /** It pops, and so does every jelly close by, one after another. */
  deathFx(d: Drone, w: DroneWorld): void {
    deepEnv.jellies.delete(d);
    w.fx.burst('bubble', d.x, d.y, 12);
    w.fx.burst('mana', d.x, d.y, 8);
    w.lighting.flash(d.x, d.y, 50, GLOW, 200);
    playSfx(DEEP_SFX.pop, 0.9, 0.9 + Math.random() * 0.3);
    const scene = d.sprite.scene;
    let delay = JELLY.chainDelayMs;
    for (const o of deepEnv.jellies) {
      if (!o.alive || Math.hypot(o.x - d.x, o.y - d.y) > JELLY.chainRadius) continue;
      deepEnv.jellies.delete(o);
      scene.time.delayedCall(delay, () => {
        if (o.alive) o.takeHit({ damage: 99, kind: 'burst', x: d.x, y: d.y, knockback: 0 });
      });
      delay += JELLY.chainDelayMs;
    }
  }

  render(d: Drone, w: DroneWorld): void {
    show(d, 'jelly-pulse');
    if (d.alive) w.lighting.add(d.x, d.y, 24, GLOW, 0.5 + 0.2 * Math.sin(w.now * 0.006 + d.seed));
  }
}
