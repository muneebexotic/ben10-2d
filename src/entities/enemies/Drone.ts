import Phaser from 'phaser';
import { DEPTH, FX } from '../../config/constants';
import { DRONE_SHARED } from '../../config/enemies';
import { PALETTE } from '../../config/palette';
import type { DroneKind } from '../../levels/types';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import type { Projectiles } from '../Projectiles';
import type { Damageable, Hazard, Hit, HitKind, HitResult, Liftable, Rect } from '../types';
import type { Telegraphs } from './Telegraphs';
import { pace } from '../../systems/Difficulty';

export interface DroneWorld {
  now: number;
  player: { x: number; y: number; centerY: number; dead: boolean; vx: number };
  fx: Fx;
  lighting: Lighting;
  projectiles: Projectiles;
  telegraph: Telegraphs;
  view: Phaser.Geom.Rectangle;
  /** False in Training's passive mode: drones move but never attack. */
  aggressive: boolean;
  onScreen(x: number, y: number, margin: number): boolean;
  /** World y of the first solid surface below (x, y), or the level floor. */
  groundBelow(x: number, y: number): number;
  isSolid(x: number, y: number): boolean;
  isWater(x: number, y: number): boolean;
  onKilled(drone: Drone): void;
  /** This drone's attack lands at game time `at` (perfect transform timing). */
  threat(drone: Drone, at: number): void;
  cancelThreat(drone: Drone): void;
}

/** Per-variant behaviour. Brains only steer; the Drone handles health, hits, knockdowns and death. */
export interface DroneBrain {
  readonly kind: DroneKind;
  readonly texture: string;
  readonly maxHp: number;
  readonly body: { width: number; height: number };
  update(d: Drone, w: DroneWorld, dtMs: number): void;
  harmful(d: Drone): boolean;
  onHurt?(d: Drone, w: DroneWorld, hit: Hit): void;
  /** Damage multiplier for a hit (armour, a Striker stuck in the ground). */
  damageTakenMultiplier?(d: Drone, hit: Hit): number;
  /** Stuck in place on its own (a Striker after a dive): strong aliens can pick it up. */
  pinned?(d: Drone): boolean;
  /** Called when a knockdown wears off, to reset the brain's state. */
  onRecover?(d: Drone, w: DroneWorld): void;
  /** Extra per-frame drawing (armour plates, glints). */
  render?(d: Drone, w: DroneWorld): void;
  contactDamage?(d: Drone): number;
  /** Too twitchy to lock onto: aim assist ignores it. */
  readonly evasive?: boolean;
}

type Carry = 'none' | 'held' | 'thrown';

export class Drone implements Damageable, Hazard, Liftable {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly countsAsEnemy = true;
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
  lastDamage = 0;
  /** Brains keep their own extra state here (armour, juke timers). */
  readonly memo: Record<string, number> = {};
  private flashLeft = 0;
  stunLeft = 0;
  /** Knocked out of the sky by a heavy hit: lying on the ground, harmless, liftable. */
  downedLeft = 0;
  private fallVy = 0;
  private grounded = false;
  private carryState: Carry = 'none';

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

  get evasive(): boolean {
    return this.brain.evasive ?? false;
  }

  /** Contact damage (a ramming Armored Drone hits harder). */
  get damage(): number {
    return this.brain.contactDamage?.(this) ?? DRONE_SHARED.contactDamage;
  }

  get downed(): boolean {
    return this.downedLeft > 0;
  }

  get active(): boolean {
    return this.alive && this.awake && this.carryState === 'none' && !this.downed && this.brain.harmful(this);
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    return this.box(out, 2);
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.carryState !== 'none') return false;
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
    if (!this.alive || this.carryState !== 'none') return 'none';
    this.awake = true;
    const dmg = hit.damage * (this.brain.damageTakenMultiplier?.(this, hit) ?? 1) * (this.downed ? DRONE_SHARED.downedDamageMultiplier : 1);
    this.lastDamage = dmg;
    this.hp -= dmg;
    this.flashLeft = DRONE_SHARED.hitFlashMs;
    const dir = Math.sign(this.x - hit.x) || 1;
    const push = hit.knockback / Math.max(1, this.brain.maxHp * 0.6);
    this.kx += dir * push;
    if (!this.downed) this.ky += Math.sign(this.y - hit.y || -1) * push * 0.35 - 30;
    playSfx('droneHit', 0.8, 0.9 + Math.random() * 0.2);
    if (this.hp <= 0) {
      this.kill();
      return 'killed';
    }
    this.brain.onHurt?.(this, this.world, hit);
    if (hit.stunMs) this.knockDown(hit.stunMs);
    return 'hit';
  }

  /** A heavy blow knocks the drone out of the sky; it lies sparking on the ground until it reboots. */
  knockDown(ms: number): void {
    if (!this.alive || this.carryState !== 'none') return;
    if (!this.downed) {
      this.fallVy = Math.max(0, this.ky);
      this.grounded = false;
      this.setCharging(false);
      this.world.cancelThreat(this);
      playSfx('droneDown', 0.8);
    }
    this.downedLeft = Math.max(this.downedLeft, ms);
  }

  update(dtMs: number): void {
    const w = this.world;
    if (!this.alive) return;
    const dt = dtMs / 1000;
    if (this.carryState !== 'none') {
      this.render(w.now);
      return;
    }
    if (!this.awake) {
      const cx = w.view.centerX;
      if (Math.abs(this.x - cx) < DRONE_SHARED.wakeDistance && Math.abs(this.y - w.view.centerY) < 320) {
        this.awake = true;
        const [lo, hi] = DRONE_SHARED.wakeDelayMs;
        this.nextActionAt = w.now + pace.wake(lo + Math.random() * (hi - lo));
      } else {
        this.render(w.now);
        return;
      }
    }

    this.stateT += dtMs;
    this.stunLeft = Math.max(0, this.stunLeft - dtMs);
    const decay = Math.exp(-DRONE_SHARED.knockbackDecay * dt);
    this.kx *= decay;
    this.ky *= decay;

    if (this.downed) {
      this.updateDowned(dtMs, dt);
    } else {
      this.brain.update(this, w, dtMs);
      this.x += (this.vx + this.kx) * dt;
      this.y += (this.vy + this.ky) * dt;
    }

    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.render(w.now);
    w.lighting.add(this.x, this.y, 30, PALETTE.enemy, this.downed ? 0.4 : 0.8);
  }

  private updateDowned(dtMs: number, dt: number): void {
    const w = this.world;
    const half = this.brain.body.height / 2;
    if (!this.grounded) {
      this.fallVy = Math.min(DRONE_SHARED.downedMaxFall, this.fallVy + DRONE_SHARED.downedGravity * dt);
      this.x += this.kx * dt;
      this.y += this.fallVy * dt;
      const ground = w.groundBelow(this.x, this.y - half);
      if (this.y + half >= ground) {
        this.y = ground - half;
        this.grounded = true;
        w.fx.burst(w.isWater(this.x, this.y + half + 2) ? 'splash' : 'dust', this.x, this.y + half, 8);
        w.fx.burst('spark', this.x, this.y, 6);
        playSfx('land', 0.9, 0.7);
      }
    } else if (Math.random() < 0.1) {
      w.fx.burst('spark', this.x + (Math.random() - 0.5) * 10, this.y - 4, 2);
    }
    this.downedLeft -= dtMs;
    if (this.downedLeft <= 0) this.recover();
  }

  private recover(): void {
    this.downedLeft = 0;
    this.grounded = false;
    this.ky = -60;
    this.setState('idle');
    this.nextActionAt = this.world.now + DRONE_SHARED.recoverDelayMs;
    this.brain.onRecover?.(this, this.world);
    this.world.fx.burst('red', this.x, this.y, 6);
  }

  private render(now: number): void {
    const bobY = this.downed || this.carryState !== 'none' ? 0 : Math.sin(now * 0.004 + this.seed) * 1.5;
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y + bobY));
    if (this.carryState === 'none') {
      const tilt = this.downed ? (this.grounded ? 160 : 140) : this.sprite.angle === 160 || this.sprite.angle === 140 ? 0 : this.sprite.angle;
      this.sprite.setAngle(tilt);
    }
    if (this.flashLeft > 0) this.sprite.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
    else if (this.downed) this.sprite.setTint(0x8a8aa0).setTintMode(Phaser.TintModes.MULTIPLY);
    else this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    this.brain.render?.(this, this.world);
  }

  /** Brains call this to show the charge frame or return to idle. */
  setCharging(on: boolean): void {
    if (on) this.sprite.stop().setFrame(2);
    else if (!this.sprite.anims.isPlaying) this.sprite.play(`${this.brain.kind}-idle`);
  }

  // ------------------------------------------------------------ Liftable

  get liftable(): boolean {
    return this.alive && this.carryState === 'none' && ((this.downed && this.grounded) || (this.brain.pinned?.(this) ?? false));
  }

  get height(): number {
    return this.brain.body.height + 2;
  }

  get self(): Damageable {
    return this;
  }

  liftBox(out: Rect): boolean {
    return this.box(out, -4);
  }

  lift(): void {
    this.carryState = 'held';
    this.world.cancelThreat(this);
    this.setCharging(false);
    this.sprite.setDepth(DEPTH.player + 1).setAngle(180);
    playSfx('grab', 0.9);
  }

  carry(x: number, bottomY: number, facing: 1 | -1): void {
    this.x = x;
    this.y = bottomY - this.brain.body.height / 2;
    this.sprite.setFlipX(facing < 0);
    if (Math.random() < 0.08) this.world.fx.burst('spark', x, this.y, 2);
  }

  fly(x: number, y: number, angle: number): void {
    this.carryState = 'thrown';
    this.x = x;
    this.y = y;
    this.sprite.setRotation(angle);
    if (Math.random() < 0.6) this.world.fx.trail('smoke', x, y);
    this.world.fx.trail('spark', x, y);
  }

  shatter(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.kill();
  }

  kill(): void {
    const w = this.world;
    if (!this.alive) return;
    this.alive = false;
    this.downedLeft = 0;
    this.sprite.setVisible(false);
    w.fx.explosion(this.x, this.y, this.brain.maxHp >= 5 || this.carryState === 'thrown' ? 'medium' : 'small');
    w.fx.hitStop(FX.hitStopKillMs);
    playSfx('explode', 0.8, 0.9 + Math.random() * 0.25);
    w.onKilled(this);
  }

  /** Removed without a fight (Training's clear): no explosion, no kill credit. */
  vanish(): void {
    if (!this.alive) return;
    this.alive = false;
    this.downedLeft = 0;
    this.sprite.setVisible(false);
    this.world.cancelThreat(this);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
