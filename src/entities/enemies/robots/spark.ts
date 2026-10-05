import { SPARK } from '../../../config/robots';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { blinkOn } from '../../../systems/Accessibility';
import { playSfx } from '../../../systems/audio/Sfx';
import { damp } from '../../../systems/Pacing';
import { steer } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';

/**
 * One of Kevin's sparks: power he stole and threw back. It drifts toward
 * Ben, crackles as a ring shows how far it'll reach (the tell), then
 * discharges and is gone. Raw power: Upgrade can't take it over.
 */
export class SparkBrain implements DroneBrain {
  readonly kind = 'spark' as const;
  readonly texture = TEX.sparkWisp;
  readonly maxHp = SPARK.hp;
  readonly body = SPARK.body;
  readonly hackable = false;

  update(d: Drone, w: DroneWorld): void {
    const p = w.player;
    switch (d.state) {
      case 'idle': {
        const t = w.now * 0.004 + d.seed;
        steer(d, p.x + Math.sin(t) * 30, p.centerY - 10 + Math.cos(t * 1.3) * 16, SPARK.driftSpeed, 1.4);
        const near = Math.hypot(p.x - d.x, p.centerY - d.y) < SPARK.triggerRange;
        if ((near && w.now >= d.nextActionAt && w.aggressive) || d.stateT > SPARK.lifeMs) {
          d.setState('charge');
          w.threat(d, w.now + SPARK.chargeMs);
          playSfx('zap', 0.4, 1.6);
        }
        break;
      }
      case 'charge':
        d.vx = damp(d.vx, 0.8);
        d.vy = damp(d.vy, 0.8);
        w.telegraph.circle(d.x, d.y, SPARK.zapRadius, PALETTE.kevin, blinkOn(d.stateT, 80) ? 0.9 : 0.4);
        if (d.stateT >= SPARK.chargeMs) this.zap(d, w);
        break;
    }
  }

  private zap(d: Drone, w: DroneWorld): void {
    const p = w.player;
    w.fx.burst('volt', d.x, d.y, 18);
    w.fx.flash(d.x, d.y, PALETTE.kevin, SPARK.zapRadius, 220);
    playSfx('sparkZap');
    // The discharge itself is a short-lived enemy blast centred on the spark.
    if (Math.hypot(p.x - d.x, p.centerY - d.y) <= SPARK.zapRadius) {
      w.projectiles.spawn('bolt', 'enemy', p.x, p.centerY, 0, 0, SPARK.zapDamage, 60, 6, { tint: PALETTE.kevin });
    }
    w.cancelThreat(d);
    d.vanish();
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return SPARK.contactDamage;
  }

  deathFx(d: Drone, w: DroneWorld): void {
    w.fx.burst('volt', d.x, d.y, 12);
    w.fx.flash(d.x, d.y, PALETTE.kevin, 16, 180);
  }

  render(d: Drone, w: DroneWorld): void {
    const k = d.state === 'charge' ? 1 + d.stateT / SPARK.chargeMs : 1;
    d.sprite.setScale(k);
    w.lighting.add(d.x, d.y, 22 * k, PALETTE.kevin, 0.9);
  }
}
