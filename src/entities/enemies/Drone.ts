import Phaser from 'phaser';
import { DEPTH, FX } from '../../config/constants';
import { DRONE_SHARED } from '../../config/enemies';
import { PALETTE } from '../../config/palette';
import type { DroneKind } from '../../levels/types';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import type { Projectiles } from '../Projectiles';
import type { Damageable, Hazard, Hit, HitKind, HitResult, Rect } from '../types';
import type { Telegraphs } from './Telegraphs';

export interface DroneWorld {
  now: number;
  player: { x: number; y: number; centerY: number; dead: boolean };
  fx: Fx;
  lighting: Lighting;
  projectiles: Projectiles;
  telegraph: Telegraphs;
  view: Phaser.Geom.Rectangle;
  onScreen(x: number, y: number, margin: number): boolean;
  /** World y of the first solid surface below (x, y), or the level floor. */
  groundBelow(x: number, y: number): number;
  isSolid(x: number, y: number): boolean;
  isWater(x: number, y: number): boolean;
  onKilled(drone: Drone): void;
}

/** Per-variant behaviour. Brains only steer; the Drone handles health, hits and death. */
export interface DroneBrain {
  readonly kind: DroneKind;
  readonly texture: string;
  readonly maxHp: number;
  readonly body: { width: number; height: number };
  update(d: Drone, w: DroneWorld, dtMs: number): void;
  harmful(d: Drone): boolean;
  onHurt?(d: Drone, w: DroneWorld): void;
  /** Extra damage multiplier while vulnerable (e.g. a Striker stuck in the ground). */
  damageTakenMultiplier?(d: Drone): number;
}

export class Drone implements Damageable, Hazard {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly countsAsEnemy = true;
  readonly damage: number = DRONE_SHARED.contactDamage;
  x: number;
  y: number;
  /** Steering velocity set by the brain. */
  vx = 0;
  vy = 0;
  /** Knockback velocity, decays on its own. */
  kx = 0;
  ky = 0;
  homeX: number;
  homeY: number;
  hp: number;
  alive = true;
  awake = false;
  state = 'idle';
  stateT = 0;
  nextActionAt = 0;
  side: 1 | -1 = 1;
  aim = 0;
  lockX = 0;
  lockY = 0;
  seed = Math.random() * 1000;
  private flashLeft = 0;
  stunLeft = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly world: DroneWorld,
    x: number,
    y: number,
    readonly brain: DroneBrain,
  ) {
    this.x = this.homeX = x;
    this.y = this.homeY = y;
    this.hp = brain.maxHp;
    this.sprite = scene.add.sprite(x, y, brain.texture, 0).setDepth(DEPTH.enemies);
    this.sprite.play(`${brain.kind}-idle`);
  }

  get active(): boolean {
    return this.alive && this.awake && this.brain.harmful(this);
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    return this.box(out, 2);
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    return this.box(out, -2);
  }

  private box(out: Rect, shrink: number): boolean {
    const { width, height } = this.brain.body;
    out.x = this.x - width / 2 + shrink;
    out.y = this.y - height / 2 + shrink;
    out.w = width - shrink * 2;
    out.h = height - shrink * 2;
    return true;
  }

  accepts(_kind: HitKind): boolean {
    return true;
  }

  setState(state: string): void {
    this.state = state;
    this.stateT = 0;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    this.awake = true;
    const dmg = hit.damage * (this.brain.damageTakenMultiplier?.(this) ?? 1);
    this.hp -= dmg;
    this.flashLeft = DRONE_SHARED.hitFlashMs;
    const dir = Math.sign(this.x - hit.x) || 1;
    const push = hit.knockback / Math.max(1, this.brain.maxHp * 0.6);
    this.kx += dir * push;
    this.ky += Math.sign(this.y - hit.y || -1) * push * 0.35 - 30;
    playSfx('droneHit', 0.8, 0.9 + Math.random() * 0.2);
    if (this.hp <= 0) {
      this.kill();
      return 'killed';
    }
    this.brain.onHurt?.(this, this.world);
    return 'hit';
  }

  update(dtMs: number): void {
    const w = this.world;
    if (!this.alive) return;
    const dt = dtMs / 1000;
    if (!this.awake) {
      const cx = w.view.centerX;
      if (Math.abs(this.x - cx) < DRONE_SHARED.wakeDistance && Math.abs(this.y - w.view.centerY) < 320) {
        this.awake = true;
        const [lo, hi] = DRONE_SHARED.wakeDelayMs;
        this.nextActionAt = w.now + lo + Math.random() * (hi - lo);
      } else {
        this.bob(w.now);
        return;
      }
    }

    this.stateT += dtMs;
    this.stunLeft = Math.max(0, this.stunLeft - dtMs);
    this.brain.update(this, w, dtMs);

    const decay = Math.exp(-DRONE_SHARED.knockbackDecay * dt);
    this.kx *= decay;
    this.ky *= decay;
    this.x += (this.vx + this.kx) * dt;
    this.y += (this.vy + this.ky) * dt;

    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.bob(w.now);
    w.lighting.add(this.x, this.y, 30, PALETTE.enemy, 0.8);
  }

  private bob(now: number): void {
    const bobY = Math.sin(now * 0.004 + this.seed) * 1.5;
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y + bobY));
    if (this.flashLeft > 0) this.sprite.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
  }

  /** Brains call this to show the charge frame or return to idle. */
  setCharging(on: boolean): void {
    if (on) this.sprite.stop().setFrame(2);
    else if (!this.sprite.anims.isPlaying) this.sprite.play(`${this.brain.kind}-idle`);
  }

  kill(): void {
    const w = this.world;
    if (!this.alive) return;
    this.alive = false;
    this.sprite.setVisible(false);
    w.fx.explosion(this.x, this.y, this.brain.maxHp >= 5 ? 'medium' : 'small');
    w.fx.hitStop(FX.hitStopKillMs);
    playSfx('explode', 0.8, 0.9 + Math.random() * 0.25);
    w.onKilled(this);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
