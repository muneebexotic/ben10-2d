import type Phaser from 'phaser';
import { MISSILE, TRACKER } from '../../config/bounty';
import { PALETTE } from '../../config/palette';
import { TELL } from '../../config/tells';
import { blinkOn } from '../../systems/Accessibility';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import { missileBoom, missileIncoming } from '../../systems/audio/bountySfx';
import type { Projectile, Projectiles } from '../Projectiles';
import type { Telegraphs } from '../enemies/Telegraphs';
import type { Blasts } from './Blasts';

export interface MissileWorld {
  fx: Fx;
  lighting: Lighting;
  telegraph: Telegraphs;
  projectiles: Projectiles;
  blasts: Blasts;
  view: Phaser.Geom.Rectangle;
  /** Missiles don't care whose side they're on: the blast hits enemies too (lure a crab-bot under a salvo). */
  blastEnemies(x: number, y: number, radius: number): void;
  /** Anything else a blast sets off (dynamite). */
  onExplode?(x: number, y: number, radius: number): void;
  /** When the strike lands (perfect transform timing). */
  threat?(key: object, at: number): void;
}

interface Strike {
  /** Where it lands. */
  x: number;
  y: number;
  /** Game time it launches; until then the marker shows. */
  launchAt: number;
  /** -1 or 1: the side of the sky it comes from. */
  side: number;
  missile: Projectile | null;
  lastX: number;
  lastY: number;
  done: boolean;
}

/**
 * Sixsix's missile strikes: a marker on the ground first (the tell, the same
 * length on every difficulty), then a missile screams in from the sky at an
 * angle and blows up where the marker was. A roof or a wall in the way takes
 * the hit instead, and Diamondhead's shield sends a missile back up.
 */
export class Missiles {
  private readonly strikes: Strike[] = [];
  private now = 0;

  constructor(private readonly w: MissileWorld) {}

  /** A salvo of `count` around (x, floorY): markers now, missiles after `warnMs`, `gapMs` apart. */
  salvo(x: number, floorY: number, count: number = TRACKER.salvo.missiles, spread: number = TRACKER.salvo.spreadPx, warnMs: number = TRACKER.salvo.warnMs, gapMs: number = TRACKER.salvo.gapMs, groundAt?: (x: number) => number): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < count; i++) {
      const sx = x + (i - (count - 1) / 2) * spread + (Math.random() - 0.5) * 8;
      const strike: Strike = { x: sx, y: groundAt ? groundAt(sx) : floorY, launchAt: this.now + warnMs + i * gapMs, side, missile: null, lastX: sx, lastY: floorY, done: false };
      this.strikes.push(strike);
      this.w.threat?.(strike, strike.launchAt + this.flightMs(strike));
    }
  }

  /** One missile at (x, floorY). */
  strike(x: number, floorY: number, warnMs: number): void {
    this.salvo(x, floorY, 1, 0, warnMs, 0);
  }

  get pending(): number {
    return this.strikes.length;
  }

  private flightMs(s: Strike): number {
    const height = s.y - (this.w.view.y - 30);
    return (height / (Math.cos(MISSILE.angle) * MISSILE.speed)) * 1000;
  }

  update(dtMs: number): void {
    this.now += dtMs;
    const { telegraph, projectiles } = this.w;
    for (const s of this.strikes) {
      if (s.done) continue;
      if (!s.missile) {
        const t = Math.min(1, 1 - (s.launchAt - this.now) / TRACKER.salvo.warnMs);
        telegraph.target(s.x, s.y - 2, 9 + (1 - t) * 6, TELL.sixsix, 0.45 + t * 0.45 + (blinkOn(this.now, 90) ? 0.1 : 0));
        if (this.now >= s.launchAt) this.launch(s);
        continue;
      }
      const m = s.missile;
      // Turned around by Diamondhead's shield: it's just a shot of Ben's now.
      if (m.active && m.team === 'player') {
        s.done = true;
        continue;
      }
      telegraph.target(s.x, s.y - 2, 9, TELL.sixsix, 0.9);
      if (m.active) {
        s.lastX = m.x;
        s.lastY = m.y;
        if (m.y >= s.y - 3) {
          projectiles.kill(m, false);
          this.explode(m.x, s.y - 4);
          s.done = true;
        }
      } else {
        // It hit something on the way down (a roof, Ben): it goes off there.
        this.explode(s.lastX, s.lastY);
        s.done = true;
      }
    }
    for (let i = this.strikes.length - 1; i >= 0; i--) if (this.strikes[i].done) this.strikes.splice(i, 1);
  }

  private launch(s: Strike): void {
    const vy = Math.cos(MISSILE.angle) * MISSILE.speed;
    const vx = Math.sin(MISSILE.angle) * MISSILE.speed * -s.side;
    const t = (s.y - (this.w.view.y - 30)) / vy;
    const x0 = s.x - vx * t;
    const y0 = s.y - vy * t;
    s.missile = this.w.projectiles.spawn('missile', 'enemy', x0, y0, vx, vy, MISSILE.damage, MISSILE.lifetimeMs, MISSILE.radius);
    s.lastX = x0;
    s.lastY = y0;
    playSfx(missileIncoming, 0.6, 0.9 + Math.random() * 0.2);
  }

  private explode(x: number, y: number): void {
    const { fx, blasts } = this.w;
    const r = MISSILE.blastRadius;
    fx.explosion(x, y, 'medium');
    fx.burst('debris', x, y, 8);
    fx.ring(x, y, PALETTE.sixsix, r, 260, 0.7);
    fx.light(x, y, 90, PALETTE.fire1, 260);
    fx.shake(0.005, 150);
    blasts.add(x, y - 4, r, MISSILE.damage);
    this.w.blastEnemies(x, y, r);
    this.w.onExplode?.(x, y, r);
    playSfx(missileBoom, 0.8, 0.9 + Math.random() * 0.2);
  }

  clear(): void {
    for (const s of this.strikes) if (s.missile?.active) this.w.projectiles.kill(s.missile, false);
    this.strikes.length = 0;
  }
}
