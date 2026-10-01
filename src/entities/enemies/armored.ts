import { ARMORED } from '../../config/enemies';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { playSfx } from '../../systems/audio/Sfx';
import { blinkOn } from '../../systems/Accessibility';
import type { Hit } from '../types';
import type { Drone, DroneBrain, DroneWorld } from './Drone';
import { canShoot, rand, steer } from './brainKit';
import { pace } from '../../systems/Difficulty';

const A = ARMORED;

/** Damage multiplier against the Armored Drone. Pure so the rule is unit tested. */
export function armoredMultiplier(kind: Hit['kind'], exposed: boolean): number {
  if (exposed) return A.exposedMultiplier;
  return kind === 'smash' ? 1 : A.chipMultiplier;
}

/**
 * A slow hovering tank with a lobbed cannon and a short-range ram. Armour
 * shrugs off everything but smash hits; breaking it knocks the drone down and
 * opens a window where every alien hits hard: smash it, then swap and burst it.
 */
export class ArmoredBrain implements DroneBrain {
  readonly kind = 'armored' as const;
  readonly texture = TEX.armored;
  readonly maxHp = A.hp;
  readonly body = A.body;

  private exposed(d: Drone): boolean {
    return (d.memo.exposedUntil ?? 0) > (d.memo.now ?? 0);
  }

  private armor(d: Drone): number {
    return d.memo.armor ?? A.armorHp;
  }

  update(d: Drone, w: DroneWorld): void {
    d.memo.now = w.now;
    const p = w.player;
    switch (d.state) {
      case 'idle': {
        if (Math.abs(p.x - d.x) > 30) d.side = d.x < p.x ? -1 : 1;
        const ground = w.groundBelow(d.x, d.y);
        const tx = p.x + d.side * A.keepDistance;
        const ty = Math.min(p.centerY + A.hoverOffsetY, ground - 28) + Math.sin(w.now * 0.002 + d.seed) * 3;
        steer(d, tx, ty, A.moveSpeed, 1.1);
        if (w.now < d.nextActionAt || d.stunLeft > 0 || !canShoot(d, w, A.aggroRange)) break;
        if (Math.abs(p.x - d.x) < A.ramRange && Math.abs(p.centerY - d.y) < 46) {
          d.memo.ramDir = p.x > d.x ? 1 : -1;
          d.setState('ramWind');
          d.setCharging(true);
          w.threat(d, w.now + A.ramTelegraphMs);
          playSfx('ramCharge', 0.8);
        } else {
          d.setState('telegraph');
          d.setCharging(true);
          w.threat(d, w.now + A.telegraphMs);
          playSfx('laserCharge', 0.8, 0.5);
        }
        break;
      }
      case 'telegraph': {
        d.vx *= 0.85;
        d.vy *= 0.85;
        if (d.stateT < A.telegraphMs - A.aimLockMs) {
          d.lockX = p.x;
          d.lockY = w.groundBelow(p.x, p.y - 8) - 4;
        }
        const t = d.stateT / A.telegraphMs;
        const locked = d.stateT >= A.telegraphMs - A.aimLockMs;
        w.telegraph.reticle(d.lockX, d.lockY, locked ? PALETTE.white : PALETTE.enemy, 1.8 - t * 0.6, d.stateT * 0.25);
        w.telegraph.dashed(d.x, d.y + 8, d.lockX, d.lockY, PALETTE.enemy, 0.2 + t * 0.4, d.stateT * 0.05);
        w.lighting.add(d.x, d.y + 8, 30 + t * 30, PALETTE.enemy, 1);
        if (d.stateT >= A.telegraphMs) {
          this.fireShell(d, w);
          w.threat(d, w.now);
          d.setCharging(false);
          d.setState('recover');
        }
        break;
      }
      case 'ramWind': {
        // Drops to Ben's height while it revs up, so the ram can't sail over his head.
        d.vx = 0;
        d.vy = Math.max(-80, Math.min(80, (p.centerY - 2 - d.y) * 5));
        d.kx += (Math.random() - 0.5) * 24;
        const dir = d.memo.ramDir ?? 1;
        const len = (A.ramSpeed * A.ramMs) / 1000;
        const alpha = 0.35 + (blinkOn(d.stateT, 90) ? 0.35 : 0.1);
        w.telegraph.rect(dir > 0 ? d.x : d.x - len, d.y - A.body.height / 2, len, A.body.height, PALETTE.enemy, alpha * 0.35);
        w.telegraph.dashed(d.x, d.y, d.x + dir * len, d.y, PALETTE.enemy, alpha, d.stateT * 0.1, 2);
        if (d.stateT >= A.ramTelegraphMs) {
          d.setCharging(false);
          d.setState('ram');
          playSfx('dive', 1, 0.6);
        }
        break;
      }
      case 'ram': {
        const dir = d.memo.ramDir ?? 1;
        d.vx = dir * A.ramSpeed;
        d.vy = 0;
        w.fx.trail('red', d.x - dir * 12, d.y, 2);
        w.fx.trail('smoke', d.x - dir * 14, d.y + 4);
        if (w.isSolid(d.x + dir * (A.body.width / 2 + 2), d.y) || d.stateT > A.ramMs) {
          if (w.isSolid(d.x + dir * (A.body.width / 2 + 2), d.y)) {
            d.kx = -dir * 120;
            w.fx.burst('spark', d.x + dir * 12, d.y, 10);
            w.fx.shake(0.006, 140);
            playSfx('slam', 0.5);
          }
          d.setState('recover');
        }
        break;
      }
      case 'recover': {
        d.vx *= 0.9;
        d.vy *= 0.9;
        if (d.stateT > A.recoverMs) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(A.fireIntervalMs));
        }
        break;
      }
    }
  }

  /** A heavy shell lobbed onto the marked spot. */
  private fireShell(d: Drone, w: DroneWorld): void {
    const ox = d.x;
    const oy = d.y + 10;
    const t = A.shellFlightMs / 1000;
    const vx = (d.lockX - ox) / t;
    const vy = (d.lockY - oy - 0.5 * A.shellGravity * t * t) / t;
    w.projectiles.spawn('shell', 'enemy', ox, oy, vx, vy, A.shellDamage, A.shellFlightMs + 900, A.shellRadius, { gravity: A.shellGravity });
    w.fx.burst('smoke', ox, oy, 6);
    w.fx.burst('red', ox, oy, 6);
    w.lighting.flash(ox, oy, 60, PALETTE.enemy, 160);
    d.ky -= 40;
    playSfx('cannon', 0.9);
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(d: Drone): number {
    return d.state === 'ram' ? A.ramDamage : 1;
  }

  damageTakenMultiplier(d: Drone, hit: Hit): number {
    return armoredMultiplier(hit.kind, this.exposed(d));
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    if (this.exposed(d)) return;
    if (hit.kind !== 'smash') {
      w.fx.burst('spark', hit.x + (d.x - hit.x) * 0.5, d.y, 6);
      playSfx('armorTink', 0.8, 0.9 + Math.random() * 0.3);
      if (w.now >= (d.memo.tinkTextAt ?? 0)) {
        d.memo.tinkTextAt = w.now + A.tinkTextEveryMs;
        w.fx.popText(d.x, d.y - 16, 'ARMOR!', PALETTE.metal3);
      }
      return;
    }
    d.memo.armor = this.armor(d) - hit.damage;
    w.fx.burst('debris', d.x, d.y, 10);
    playSfx('armorCrack', 0.9);
    if (d.memo.armor > 0) {
      w.fx.popText(d.x, d.y - 16, 'CRACK!', PALETTE.fire1);
      return;
    }
    // Armour shatters: the drone drops, its core glows, and every hit counts.
    d.memo.armor = A.armorHp;
    d.memo.exposedUntil = w.now + pace.punish(A.exposedMs);
    d.setCharging(false);
    d.setState('idle');
    w.cancelThreat(d);
    d.knockDown(A.breakStunMs);
    w.fx.explosion(d.x, d.y, 'small');
    w.fx.burst('debris', d.x, d.y, 24);
    w.fx.popText(d.x, d.y - 20, 'ARMOR BROKEN!', PALETTE.gold);
    playSfx('armorBreak');
  }

  render(d: Drone, w: DroneWorld): void {
    d.memo.now = w.now;
    if (d.state === 'telegraph' || d.state === 'ramWind') return;
    const exposed = this.exposed(d);
    const key = exposed ? 'armored-exposed' : this.armor(d) <= A.armorHp / 2 ? 'armored-cracked' : 'armored-idle';
    if (d.sprite.anims.currentAnim?.key !== key || !d.sprite.anims.isPlaying) d.sprite.play(key, true);
    if (exposed) {
      w.lighting.add(d.x, d.y, 36 + Math.sin(w.now * 0.02) * 6, PALETTE.fire1, 1);
      if (Math.random() < 0.2) w.fx.trail('fire', d.x + (Math.random() - 0.5) * 12, d.y);
    }
  }
}
