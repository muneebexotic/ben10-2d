import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import { COMBAT } from '../config/combat';
import { PALETTE as P } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import type { Fx, BurstKind } from '../systems/Fx';
import type { Lighting } from '../systems/Lighting';
import { playSfx } from '../systems/audio/Sfx';
import type { Damageable, HitKind } from './types';

export type ProjectileKind = 'fireball' | 'laser' | 'bolt' | 'wave' | 'needle' | 'shell';
export type Team = 'player' | 'enemy';

interface KindStyle {
  texture: string;
  anim?: string;
  trail?: BurstKind;
  trailChance: number;
  light: number;
  lightColor: number;
  impact: BurstKind;
  rotate: boolean;
  additive: boolean;
}

const STYLE: Record<ProjectileKind, KindStyle> = {
  fireball: { texture: TEX.fireball, anim: 'fireball-spin', trail: 'fire', trailChance: 1, light: 46, lightColor: P.fire1, impact: 'fire', rotate: true, additive: true },
  laser: { texture: TEX.laser, trail: undefined, trailChance: 0, light: 26, lightColor: P.enemy, impact: 'red', rotate: true, additive: false },
  bolt: { texture: TEX.bossBolt, trail: 'red', trailChance: 0.3, light: 30, lightColor: P.enemy, impact: 'red', rotate: false, additive: false },
  wave: { texture: TEX.wave, anim: 'wave-roll', trail: 'dust', trailChance: 0.5, light: 34, lightColor: P.fire2, impact: 'debris', rotate: false, additive: false },
  needle: { texture: TEX.needle, trail: 'red', trailChance: 0.4, light: 22, lightColor: P.enemyGlow, impact: 'red', rotate: true, additive: false },
  shell: { texture: TEX.shell, trail: 'smoke', trailChance: 0.35, light: 40, lightColor: P.enemy, impact: 'red', rotate: false, additive: false },
};

/** Extra behaviour for a shot. Defaults match the original fireballs and lasers. */
export interface ShotOptions {
  /** What kind of hit it lands on a target (player shots). */
  hitKind?: HitKind;
  knockback?: number;
  /** Pixels per second squared, pulling the shot down. */
  gravity?: number;
  /** Passes through targets, hitting each once. */
  pierce?: boolean;
  /** Rides along the ground (shockwaves); dies at walls and ledges. */
  hugGround?: boolean;
  stunMs?: number;
  tint?: number;
}

export interface Projectile {
  sprite: Phaser.GameObjects.Sprite;
  active: boolean;
  kind: ProjectileKind;
  team: Team;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  reflected: boolean;
  hitKind: HitKind;
  knockback: number;
  gravity: number;
  pierce: boolean;
  hugGround: boolean;
  stunMs: number;
  /** Targets a piercing shot already hit. */
  readonly hits: Damageable[];
}

/** Pooled projectiles with manual movement; the Level resolves hits against targets. */
export class Projectiles {
  private readonly items: Projectile[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly lighting: Lighting,
  ) {}

  spawn(
    kind: ProjectileKind,
    team: Team,
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    lifeMs: number,
    radius: number,
    opts: ShotOptions = {},
  ): Projectile {
    let p = this.items.find((i) => !i.active);
    if (!p) {
      const sprite = this.scene.add.sprite(0, 0, STYLE[kind].texture);
      p = {
        sprite, active: false, kind, team, x: 0, y: 0, vx: 0, vy: 0, radius: 0, damage: 0, life: 0, reflected: false,
        hitKind: 'fire', knockback: 0, gravity: 0, pierce: false, hugGround: false, stunMs: 0, hits: [],
      };
      this.items.push(p);
    }
    const style = STYLE[kind];
    Object.assign(p, {
      active: true, kind, team, x, y, vx, vy, radius, damage, life: lifeMs, reflected: false,
      hitKind: opts.hitKind ?? 'fire',
      knockback: opts.knockback ?? COMBAT.defaultKnockback,
      gravity: opts.gravity ?? 0,
      pierce: opts.pierce ?? false,
      hugGround: opts.hugGround ?? false,
      stunMs: opts.stunMs ?? 0,
    });
    p.hits.length = 0;
    const s = p.sprite;
    s.setTexture(style.texture).setPosition(x, y).setVisible(true).setActive(true).setDepth(DEPTH.projectiles).setScale(1).setAlpha(1);
    if (opts.tint !== undefined) s.setTint(opts.tint);
    else s.clearTint();
    s.setFlipX(kind === 'wave' && vx < 0);
    s.setBlendMode(style.additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
    s.setRotation(style.rotate ? Math.atan2(vy, vx) : 0);
    if (style.anim) s.play(style.anim);
    else s.stop();
    return p;
  }

  update(
    dtMs: number,
    isSolid: (x: number, y: number) => boolean,
    view: Phaser.Geom.Rectangle,
    groundBelow: (x: number, y: number) => number,
  ): void {
    const dt = dtMs / 1000;
    for (const p of this.items) {
      if (!p.active) continue;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dtMs;
      const style = STYLE[p.kind];
      if (p.hugGround && !this.followGround(p, isSolid, groundBelow)) {
        this.kill(p, true);
        continue;
      }
      p.sprite.setPosition(p.x, p.y);
      if (style.rotate) p.sprite.setRotation(Math.atan2(p.vy, p.vx));
      if (p.hugGround && p.life < 200) p.sprite.setAlpha(Math.max(0, p.life / 200));
      if (style.trail && Math.random() < style.trailChance) this.fx.trail(style.trail, p.x - p.vx * 0.012, p.y - p.vy * 0.012 + (p.hugGround ? p.radius : 0));
      this.lighting.add(p.x, p.y, style.light, p.reflected ? P.omnitrix : style.lightColor, 0.9);

      const far = p.x < view.x - 200 || p.x > view.right + 200 || p.y < view.y - 200 || p.y > view.bottom + 200;
      if (p.life <= 0 || far) {
        this.kill(p, false);
      } else if (!p.hugGround && isSolid(p.x, p.y)) {
        this.kill(p, true);
      }
    }
  }

  /** Keeps a shockwave on the floor. False when it runs into a wall or off a ledge. */
  private followGround(p: Projectile, isSolid: (x: number, y: number) => boolean, groundBelow: (x: number, y: number) => number): boolean {
    const feet = p.y + p.radius;
    if (isSolid(p.x + Math.sign(p.vx) * 4, feet - 6)) return false;
    const ground = groundBelow(p.x, feet - 4);
    if (ground - feet > 10) return false;
    p.y = ground - p.radius;
    return true;
  }

  kill(p: Projectile, impact: boolean): void {
    if (!p.active) return;
    p.active = false;
    p.sprite.setVisible(false).setActive(false).stop();
    if (!impact) return;
    const style = STYLE[p.kind];
    this.fx.burst(style.impact, p.x, p.y, p.kind === 'fireball' ? 8 : 5);
    if (p.kind === 'fireball') {
      this.fx.burst('smoke', p.x, p.y, 2);
      this.fx.light(p.x, p.y, 50, P.fire2, 180);
      playSfx('fireHit', 0.5);
    }
  }

  /** Punch-parry: an enemy shot turns green and flies back, faster and stronger. */
  reflect(p: Projectile, facing: 1 | -1, speedMultiplier: number, damage: number): void {
    const speed = Math.hypot(p.vx, p.vy) * speedMultiplier;
    this.turn(p, damage);
    p.vx = facing * speed;
    p.vy = -Math.abs(p.vy) * 0.2;
  }

  /** Perfect transform: an enemy shot turns green and flies off along `angle`. */
  redirect(p: Projectile, angle: number, speedMultiplier: number, damage: number): void {
    const speed = Math.hypot(p.vx, p.vy) * speedMultiplier;
    this.turn(p, damage);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
  }

  private turn(p: Projectile, damage: number): void {
    p.team = 'player';
    p.reflected = true;
    p.hitKind = 'reflect';
    p.damage = damage;
    p.gravity = 0;
    p.life = 1500;
    p.sprite.setTint(P.omnitrix);
    p.sprite.setScale(1.4);
  }

  forEachActive(team: Team, cb: (p: Projectile) => void): void {
    for (const p of this.items) if (p.active && p.team === team) cb(p);
  }

  clear(team?: Team, impact = false): void {
    for (const p of this.items) if (p.active && (!team || p.team === team)) this.kill(p, impact);
  }
}
