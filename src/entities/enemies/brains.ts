import { DRONE_SHARED, GUNNER, LASER, SCOUT, STRIKER } from '../../config/enemies';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { playSfx } from '../../systems/audio/Sfx';
import type { Drone, DroneBrain, DroneWorld } from './Drone';
import { blinkOn } from '../../systems/Accessibility';

const rand = (range: readonly [number, number]) => range[0] + Math.random() * (range[1] - range[0]);

function steer(d: Drone, tx: number, ty: number, speed: number, gain = 2.2): void {
  // Boss adds (homeX < 0) roam the arena; level drones stay near home so they never pile up behind Ben.
  if (d.homeX >= 0) tx = Math.max(d.homeX - DRONE_SHARED.leash, Math.min(d.homeX + DRONE_SHARED.leash, tx));
  const dx = tx - d.x;
  const dy = ty - d.y;
  d.vx = Math.max(-speed, Math.min(speed, dx * gain));
  d.vy = Math.max(-speed, Math.min(speed, dy * gain));
}

function aimAt(d: Drone, w: DroneWorld): number {
  return Math.atan2(w.player.centerY - d.y, w.player.x - d.x);
}

function canShoot(d: Drone, w: DroneWorld, range: number): boolean {
  return !w.player.dead && w.onScreen(d.x, d.y, 10) && Math.abs(w.player.x - d.x) < range;
}

function fireLaser(d: Drone, w: DroneWorld, angle: number, speed: number, damage: number): void {
  const ox = d.x + Math.cos(angle) * 8;
  const oy = d.y + Math.sin(angle) * 8;
  w.projectiles.spawn('laser', 'enemy', ox, oy, Math.cos(angle) * speed, Math.sin(angle) * speed, damage, LASER.lifetimeMs, LASER.radius);
  w.fx.burst('red', ox, oy, 4);
  w.lighting.flash(ox, oy, 40, PALETTE.enemy, 120);
}

/** Hovers at a comfortable offset, telegraphs with a flickering aim line, then fires one aimed laser. */
export class ScoutBrain implements DroneBrain {
  readonly kind = 'scout' as const;
  readonly texture = TEX.scout;
  readonly maxHp = SCOUT.hp;
  readonly body = SCOUT.body;

  update(d: Drone, w: DroneWorld): void {
    const p = w.player;
    if (d.state === 'idle') {
      if (Math.abs(p.x - d.x) > 24) d.side = d.x < p.x ? -1 : 1;
      const tx = p.x + d.side * SCOUT.hoverOffsetX + Math.sin(w.now * 0.0015 + d.seed) * 18;
      const ground = w.groundBelow(d.x, d.y);
      const ty = Math.min(p.centerY + SCOUT.hoverOffsetY, ground - 48) + Math.sin(w.now * 0.003 * SCOUT.bobSpeed + d.seed) * SCOUT.bobAmplitude;
      steer(d, tx, ty, SCOUT.moveSpeed);
      if (w.now >= d.nextActionAt && d.stunLeft <= 0 && canShoot(d, w, SCOUT.aggroRange)) {
        d.setState('telegraph');
        d.setCharging(true);
        w.threat(d, w.now + SCOUT.telegraphMs);
        playSfx('laserCharge', 0.6);
      }
    } else if (d.state === 'telegraph') {
      d.vx *= 0.85;
      d.vy *= 0.85;
      if (d.stateT < SCOUT.telegraphMs - SCOUT.aimLockMs) d.aim = aimAt(d, w);
      const t = d.stateT / SCOUT.telegraphMs;
      const locked = d.stateT >= SCOUT.telegraphMs - SCOUT.aimLockMs;
      const len = 420;
      const alpha = locked ? 0.95 : 0.25 + 0.35 * t + (blinkOn(d.stateT, 60) ? 0 : 0.15);
      w.telegraph.dashed(d.x, d.y, d.x + Math.cos(d.aim) * len, d.y + Math.sin(d.aim) * len, PALETTE.enemy, alpha, d.stateT * 0.05, locked ? 2 : 1);
      w.lighting.add(d.x, d.y, 30 + t * 30, PALETTE.enemy, 1);
      if (d.stateT >= SCOUT.telegraphMs) {
        fireLaser(d, w, d.aim, SCOUT.laserSpeed, SCOUT.laserDamage);
        w.threat(d, w.now);
        playSfx('laser', 0.9);
        d.kx -= Math.cos(d.aim) * SCOUT.recoil;
        d.ky -= Math.sin(d.aim) * SCOUT.recoil;
        d.setCharging(false);
        d.setState('recover');
      }
    } else if (d.state === 'recover') {
      d.vx *= 0.9;
      d.vy *= 0.9;
      if (d.stateT > 420) {
        d.setState('idle');
        d.nextActionAt = w.now + rand(SCOUT.fireIntervalMs);
      }
    }
  }

  harmful(): boolean {
    return true;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    d.stunLeft = SCOUT.hurtStunMs;
    if (d.state === 'telegraph') {
      d.setCharging(false);
      d.setState('idle');
      d.nextActionAt = w.now + 700;
      w.cancelThreat(d);
    }
  }
}

/** Patrols high, locks a reticle onto Ben, dive-bombs the spot, then gets stuck: a punish window even for human Ben. */
export class StrikerBrain implements DroneBrain {
  readonly kind = 'striker' as const;
  readonly texture = TEX.striker;
  readonly maxHp = STRIKER.hp;
  readonly body = STRIKER.body;

  update(d: Drone, w: DroneWorld): void {
    const p = w.player;
    switch (d.state) {
      case 'idle': {
        const ground = w.groundBelow(p.x, p.y - 4);
        const tx = p.x + Math.sin(w.now * 0.002 + d.seed) * 50;
        const ty = Math.min(ground, p.y) - STRIKER.altitude + Math.sin(w.now * 0.004 + d.seed) * 6;
        steer(d, tx, ty, STRIKER.patrolSpeed, 1.6);
        const inRange = Math.abs(p.x - d.x) < STRIKER.triggerRange && d.y < p.y - 30;
        if (inRange && w.now >= d.nextActionAt && d.stunLeft <= 0 && !p.dead && w.onScreen(d.x, d.y, 10)) {
          d.setState('lock');
          d.setCharging(true);
          w.threat(d, w.now + STRIKER.lockMs);
          playSfx('diveLock', 0.7);
        }
        break;
      }
      case 'lock': {
        d.vx = Math.sin(d.stateT * 0.9) * 40;
        d.vy = -8;
        if (d.stateT < STRIKER.lockMs - STRIKER.lockFreezeMs) {
          d.lockX = p.x;
          d.lockY = p.y - 8;
        }
        const t = d.stateT / STRIKER.lockMs;
        const frozen = d.stateT >= STRIKER.lockMs - STRIKER.lockFreezeMs;
        w.telegraph.reticle(d.lockX, d.lockY, frozen ? 0xffffff : PALETTE.enemy, 1.6 - t * 0.6, d.stateT * 0.4);
        w.telegraph.dashed(d.x, d.y, d.lockX, d.lockY, PALETTE.enemy, 0.3 + t * 0.5, d.stateT * 0.08);
        if (d.stateT >= STRIKER.lockMs) {
          const a = Math.atan2(d.lockY - d.y, d.lockX - d.x);
          d.aim = a;
          d.setState('dive');
          playSfx('dive');
        }
        break;
      }
      case 'dive': {
        d.vx = Math.cos(d.aim) * STRIKER.diveSpeed;
        d.vy = Math.sin(d.aim) * STRIKER.diveSpeed;
        w.fx.trail('red', d.x, d.y, 2);
        // Keep diving through the target until it hits ground or water: a miss ends embedded and helpless.
        if (d.y >= d.lockY) d.aim = Math.PI / 2;
        const splash = w.isWater(d.x, d.y + 6);
        if (w.isSolid(d.x, d.y + 8) || splash || d.stateT > 1400) {
          d.vx = 0;
          d.vy = 0;
          d.setState('stuck');
          d.sprite.setAngle(d.aim > Math.PI / 2 ? -25 : 25);
          w.fx.burst(splash ? 'splash' : 'dust', d.x, d.y + 6, 10);
          w.fx.burst('red', d.x, d.y + 4, 6);
          playSfx(splash ? 'splash' : 'land', 1.2);
        }
        break;
      }
      case 'stuck': {
        d.vx = 0;
        d.vy = 0;
        if (Math.random() < 0.08) w.fx.burst('spark', d.x + (Math.random() - 0.5) * 12, d.y - 4, 2);
        if (d.stateT >= STRIKER.stuckMs) {
          d.sprite.setAngle(0);
          d.setCharging(false);
          d.setState('rise');
        }
        break;
      }
      case 'rise': {
        const ground = w.groundBelow(d.x, d.y);
        steer(d, d.x, ground - STRIKER.altitude, STRIKER.riseSpeed, 3);
        if (d.stateT > 900 || Math.abs(d.y - (ground - STRIKER.altitude)) < 6) {
          d.setState('idle');
          d.nextActionAt = w.now + STRIKER.cooldownMs;
        }
        break;
      }
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'stuck';
  }

  damageTakenMultiplier(d: Drone): number {
    return d.state === 'stuck' ? 1.5 : 1;
  }

  onHurt(d: Drone): void {
    if (d.state === 'idle' || d.state === 'rise') d.stunLeft = STRIKER.hurtStunMs;
  }
}

/** Heavy gunship: keeps its distance and fires a three-way spread after a long, obvious charge. */
export class GunnerBrain implements DroneBrain {
  readonly kind = 'gunner' as const;
  readonly texture = TEX.gunner;
  readonly maxHp = GUNNER.hp;
  readonly body = GUNNER.body;

  update(d: Drone, w: DroneWorld): void {
    const p = w.player;
    if (d.state === 'idle') {
      if (Math.abs(p.x - d.x) > 40) d.side = d.x < p.x ? -1 : 1;
      const ground = w.groundBelow(d.x, d.y);
      const tx = p.x + d.side * GUNNER.keepDistance;
      const ty = Math.min(p.centerY + GUNNER.hoverOffsetY, ground - 56) + Math.sin(w.now * 0.002 + d.seed) * 5;
      steer(d, tx, ty, GUNNER.moveSpeed, 1.2);
      if (w.now >= d.nextActionAt && d.stunLeft <= 0 && canShoot(d, w, GUNNER.aggroRange)) {
        d.setState('telegraph');
        d.setCharging(true);
        w.threat(d, w.now + GUNNER.telegraphMs);
        playSfx('laserCharge', 0.8, 0.7);
      }
    } else if (d.state === 'telegraph') {
      d.vx *= 0.8;
      d.vy *= 0.8;
      if (d.stateT < GUNNER.telegraphMs - GUNNER.aimLockMs) d.aim = aimAt(d, w);
      const t = d.stateT / GUNNER.telegraphMs;
      const locked = d.stateT >= GUNNER.telegraphMs - GUNNER.aimLockMs;
      const spread = (GUNNER.spreadDeg * Math.PI) / 180;
      for (let i = -1; i <= 1; i++) {
        const a = d.aim + i * spread;
        w.telegraph.dashed(d.x, d.y + 6, d.x + Math.cos(a) * 360, d.y + 6 + Math.sin(a) * 360, PALETTE.enemy, locked ? 0.9 : 0.2 + t * 0.4, d.stateT * 0.05, locked ? 2 : 1);
      }
      w.lighting.add(d.x, d.y, 40 + t * 40, PALETTE.enemy, 1);
      if (d.stateT >= GUNNER.telegraphMs) {
        for (let i = -1; i <= 1; i++) fireLaser(d, w, d.aim + i * spread, GUNNER.laserSpeed, GUNNER.laserDamage);
        w.threat(d, w.now);
        playSfx('laser', 1, 0.7);
        d.kx -= Math.cos(d.aim) * GUNNER.recoil;
        d.setCharging(false);
        d.setState('recover');
      }
    } else if (d.state === 'recover') {
      d.vx *= 0.9;
      d.vy *= 0.9;
      if (d.stateT > 600) {
        d.setState('idle');
        d.nextActionAt = w.now + rand(GUNNER.fireIntervalMs);
      }
    }
  }

  harmful(): boolean {
    return true;
  }

  onHurt(d: Drone): void {
    d.stunLeft = GUNNER.hurtStunMs;
  }
}

export function createBrain(kind: 'scout' | 'striker' | 'gunner'): DroneBrain {
  if (kind === 'scout') return new ScoutBrain();
  if (kind === 'striker') return new StrikerBrain();
  return new GunnerBrain();
}
