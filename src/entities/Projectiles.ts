import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import { PALETTE as P } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import type { Fx, BurstKind } from '../systems/Fx';
import type { Lighting } from '../systems/Lighting';
import { playSfx } from '../systems/audio/Sfx';

export type ProjectileKind = 'fireball' | 'laser' | 'bolt';
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
}

const STYLE: Record<ProjectileKind, KindStyle> = {
  fireball: { texture: TEX.fireball, anim: 'fireball-spin', trail: 'fire', trailChance: 1, light: 46, lightColor: P.fire1, impact: 'fire', rotate: true },
  laser: { texture: TEX.laser, trail: undefined, trailChance: 0, light: 26, lightColor: P.enemy, impact: 'red', rotate: true },
  bolt: { texture: TEX.bossBolt, trail: 'red', trailChance: 0.3, light: 30, lightColor: P.enemy, impact: 'red', rotate: false },
};

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
}

/** Pooled projectiles with manual movement; the Level resolves hits against targets. */
export class Projectiles {
  private readonly items: Projectile[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly lighting: Lighting,
  ) {}

  spawn(kind: ProjectileKind, team: Team, x: number, y: number, vx: number, vy: number, damage: number, lifeMs: number, radius: number): Projectile {
    let p = this.items.find((i) => !i.active);
    if (!p) {
      const sprite = this.scene.add.sprite(0, 0, STYLE[kind].texture);
      p = { sprite, active: false, kind, team, x: 0, y: 0, vx: 0, vy: 0, radius: 0, damage: 0, life: 0, reflected: false };
      this.items.push(p);
    }
    const style = STYLE[kind];
    Object.assign(p, { active: true, kind, team, x, y, vx, vy, radius, damage, life: lifeMs, reflected: false });
    const s = p.sprite;
    s.setTexture(style.texture).setPosition(x, y).setVisible(true).setActive(true).setDepth(DEPTH.projectiles).clearTint().setScale(1);
    s.setBlendMode(kind === 'fireball' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
    s.setRotation(style.rotate ? Math.atan2(vy, vx) : 0);
    if (style.anim) s.play(style.anim);
    else s.stop();
    return p;
  }

  update(dtMs: number, isSolid: (x: number, y: number) => boolean, view: Phaser.Geom.Rectangle): void {
    const dt = dtMs / 1000;
    for (const p of this.items) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dtMs;
      const style = STYLE[p.kind];
      p.sprite.setPosition(p.x, p.y);
      if (style.rotate) p.sprite.setRotation(Math.atan2(p.vy, p.vx));
      if (style.trail && Math.random() < style.trailChance) this.fx.trail(style.trail, p.x - p.vx * 0.012, p.y - p.vy * 0.012);
      this.lighting.add(p.x, p.y, style.light, p.reflected ? P.omnitrix : style.lightColor, 0.9);

      const far = p.x < view.x - 200 || p.x > view.right + 200 || p.y < view.y - 200 || p.y > view.bottom + 200;
      if (p.life <= 0 || far) {
        this.kill(p, false);
      } else if (isSolid(p.x, p.y)) {
        this.kill(p, true);
      }
    }
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
    p.team = 'player';
    p.reflected = true;
    p.damage = damage;
    p.vx = facing * speed;
    p.vy = -Math.abs(p.vy) * 0.2;
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
