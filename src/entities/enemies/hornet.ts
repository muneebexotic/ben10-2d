import { HORNET } from '../../config/enemies';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { playSfx } from '../../systems/audio/Sfx';
import { blinkOn } from '../../systems/Accessibility';
import type { Drone, DroneBrain, DroneWorld } from './Drone';
import { aimAt, canShoot, rand, steer } from './brainKit';
import { pace } from '../../systems/Difficulty';

const H = HORNET;
const DEG = Math.PI / 180;

/**
 * Should a hornet at (hx, hy) dodge a shot at (px, py) moving (vx, vy)? Only
 * shots that are close and still coming towards it. Pure so it is unit tested.
 */
export function shouldEvade(hx: number, hy: number, px: number, py: number, vx: number, vy: number, radius: number): boolean {
  const dx = hx - px;
  const dy = hy - py;
  if (dx * dx + dy * dy > radius * radius) return false;
  return vx * dx + vy * dy > 0;
}

/**
 * Tiny interceptor: kites Ben at a distance, sidesteps fireballs, scrambles
 * aim assist, and alternates a darting ram with a needle spread. Heatblast and
 * Four Arms can't catch it; XLR8 can, and his strikes can't be dodged.
 */
export class HornetBrain implements DroneBrain {
  readonly kind = 'hornet' as const;
  readonly texture = TEX.hornet;
  readonly maxHp = H.hp;
  readonly body = H.body;
  readonly evasive = true;

  update(d: Drone, w: DroneWorld): void {
    const p = w.player;
    if (d.state !== 'dash' && d.stunLeft <= 0) this.tryEvade(d, w);
    switch (d.state) {
      case 'idle': {
        // Kite: hold a distance on whichever side it's on, bolt when Ben closes in.
        const dx = p.x - d.x;
        if (Math.abs(dx) > 24) d.side = dx > 0 ? -1 : 1;
        const t = w.now * 0.002 + d.seed;
        const near = Math.abs(dx) < H.fleeRange;
        const tx = p.x + d.side * (near ? H.fleeDistance : H.keepDistance) + Math.sin(t) * H.wobble;
        const ground = w.groundBelow(d.x, d.y);
        const ty = Math.min(p.centerY + H.hoverOffsetY + Math.sin(t * 2.3) * 14, ground - 22);
        steer(d, tx, ty, H.moveSpeed, 3.2);
        d.vx += (Math.random() - 0.5) * 60;
        d.vy += (Math.random() - 0.5) * 40;
        if (w.now >= d.nextActionAt && d.stunLeft <= 0 && canShoot(d, w, H.aggroRange)) {
          d.memo.attack = ((d.memo.attack ?? 0) + 1) % 2;
          d.setState('telegraph');
          d.setCharging(true);
          w.threat(d, w.now + H.telegraphMs);
          playSfx('buzz', 0.8);
        }
        break;
      }
      case 'telegraph': {
        d.vx *= 0.8;
        d.vy *= 0.8;
        if (d.stateT < H.telegraphMs - H.aimLockMs) d.aim = aimAt(d, w);
        const locked = d.stateT >= H.telegraphMs - H.aimLockMs;
        const alpha = locked ? 0.95 : blinkOn(d.stateT, 50) ? 0.6 : 0.25;
        if (d.memo.attack === 1) {
          w.telegraph.line(d.x, d.y, d.x + Math.cos(d.aim) * 240, d.y + Math.sin(d.aim) * 240, PALETTE.enemy, alpha, locked ? 2 : 1);
        } else {
          for (let i = -1; i <= 1; i++) {
            const a = d.aim + i * H.needles.spreadDeg * DEG;
            w.telegraph.dashed(d.x, d.y, d.x + Math.cos(a) * 120, d.y + Math.sin(a) * 120, PALETTE.enemyGlow, alpha * 0.8, d.stateT * 0.08);
          }
        }
        w.lighting.add(d.x, d.y, 26, PALETTE.enemy, 1);
        if (d.stateT >= H.telegraphMs) {
          d.setCharging(false);
          w.threat(d, w.now);
          if (d.memo.attack === 1) {
            d.setState('dash');
            playSfx('hornetDash', 0.9);
          } else {
            this.fireNeedles(d, w);
            d.setState('recover');
          }
        }
        break;
      }
      case 'dash': {
        d.vx = Math.cos(d.aim) * H.dashSpeed;
        d.vy = Math.sin(d.aim) * H.dashSpeed;
        w.fx.trail('red', d.x, d.y, 2);
        const hitWall = w.isSolid(d.x + Math.cos(d.aim) * 8, d.y + Math.sin(d.aim) * 8);
        if (hitWall || d.stateT > H.dashMs) {
          if (hitWall) {
            d.kx = -d.vx * 0.4;
            d.ky = -d.vy * 0.4;
            w.fx.burst('spark', d.x, d.y, 6);
          }
          d.setState('recover');
        }
        break;
      }
      case 'recover': {
        d.vx *= 0.88;
        d.vy *= 0.88;
        if (d.stateT > H.recoverMs) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(H.attackIntervalMs));
        }
        break;
      }
    }
  }

  private fireNeedles(d: Drone, w: DroneWorld): void {
    const n = H.needles;
    for (let i = 0; i < n.count; i++) {
      const a = d.aim + (i - (n.count - 1) / 2) * n.spreadDeg * DEG;
      w.projectiles.spawn('needle', 'enemy', d.x, d.y, Math.cos(a) * n.speed, Math.sin(a) * n.speed, n.damage, 1800, n.radius);
    }
    w.fx.burst('red', d.x, d.y, 4);
    playSfx('laser', 0.6, 1.5);
  }

  /** Sidesteps an incoming shot, perpendicular to its path. */
  private tryEvade(d: Drone, w: DroneWorld): void {
    if (w.now < (d.memo.evadeAt ?? -Infinity) + H.evade.cooldownMs) return;
    let dodged = false;
    w.projectiles.forEachActive('player', (p) => {
      if (dodged || p.hugGround || !shouldEvade(d.x, d.y, p.x, p.y, p.vx, p.vy, H.evade.radius)) return;
      const len = Math.hypot(p.vx, p.vy) || 1;
      let nx = -p.vy / len;
      let ny = p.vx / len;
      // Juke to whichever side of the shot's path it is already on.
      if (nx * (d.x - p.x) + ny * (d.y - p.y) < 0) {
        nx = -nx;
        ny = -ny;
      }
      d.kx += nx * H.evade.impulse;
      d.ky += ny * H.evade.impulse;
      dodged = true;
    });
    if (!dodged) return;
    d.memo.evadeAt = w.now;
    w.fx.trail('red', d.x, d.y, 3);
    playSfx('whiff', 0.7);
    if (w.now >= (d.memo.dodgeTextAt ?? 0)) {
      d.memo.dodgeTextAt = w.now + H.evade.textEveryMs;
      w.fx.popText(d.x, d.y - 10, 'DODGED!', PALETTE.enemyGlow);
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return H.dashDamage;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    d.stunLeft = H.hurtStunMs;
    if (d.state === 'telegraph') {
      d.setCharging(false);
      d.setState('idle');
      d.nextActionAt = w.now + 600;
      w.cancelThreat(d);
    }
  }
}
