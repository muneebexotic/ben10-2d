import Phaser from 'phaser';
import { BOSS } from '../../config/boss';
import { DEPTH, FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { DroneKind } from '../../levels/types';
import { TEX } from '../../scenes/preload/assetKeys';
import { BOSS_EYE_FRAMES } from '../../scenes/preload/enemies';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { TimeController } from '../../systems/TimeController';
import { playSfx } from '../../systems/audio/Sfx';
import type { Telegraphs } from '../enemies/Telegraphs';
import type { Projectiles } from '../Projectiles';
import type { Damageable, Hazard, Hit, HitResult, Rect } from '../types';
import { ATTACKS, newAttack, type AttackKind, type AttackState } from './bossAttacks';
import type { BossHazards } from './BossHazards';
import { blinkOn } from '../../systems/Accessibility';
import { activeDifficulty, pace } from '../../systems/Difficulty';

export interface BossWorld {
  readonly now: number;
  fx: Fx;
  lighting: Lighting;
  telegraph: Telegraphs;
  projectiles: Projectiles;
  hazards: BossHazards;
  time: TimeController;
  player: { x: number; y: number; centerY: number; dead: boolean };
  arena: { left: number; right: number; floorY: number; top: number };
  spawnAdd(kind: DroneKind, x: number, y: number): void;
  aliveAdds(): number;
  dropPickup(x: number, y: number): void;
  onPhase2(): void;
  onHealth(ratio: number, phase: number): void;
  onDefeated(x: number, y: number): void;
  /** The boss's attack lands at game time `at` (perfect transform timing). Boss attacks are aimed at Ben, so range is unlimited. */
  threat(at: number): void;
  cancelThreat(): void;
}

type BossState = 'intro' | 'idle' | 'attack' | 'transition' | 'dying' | 'dead';
type EyeMode = 'idle' | 'charge' | 'vulnerable' | 'closed';

const PHASE_BAGS: AttackKind[][] = [
  ['volley', 'slam', 'summon', 'volley', 'slam'],
  ['beam', 'slam', 'volley', 'rain', 'summon', 'beam', 'slam'],
];

/** Chapter 1 boss: a Vilgax hunter-killer drone. Two phases, every attack telegraphed. */
export class HunterDrone implements Damageable, Hazard {
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  readonly damage = BOSS.contactDamage;
  x: number;
  y: number;
  hp: number = BOSS.maxHp;
  phase = 0;
  eye: EyeMode = 'closed';
  stuck = false;
  shake = 0;
  readonly hoverY: number;

  private state: BossState = 'intro';
  private stateT = 0;
  private attack: AttackState | null = null;
  private bag: AttackKind[] = [];
  private sinceSlam = 0;
  private tx: number;
  private ty: number;
  private rate = 2;
  private flashLeft = 0;
  private joltX = 0;
  private joltY = 0;
  private explodeTimer = 0;

  private readonly hull: Phaser.GameObjects.Image;
  private readonly plates: Phaser.GameObjects.Image[];
  private readonly eyeSprite: Phaser.GameObjects.Sprite;
  private readonly arms: Phaser.GameObjects.Sprite[];
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly thrusters: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly parts: Phaser.GameObjects.Components.Tint[];

  constructor(
    scene: Phaser.Scene,
    private readonly w: BossWorld,
    x: number,
  ) {
    this.x = this.tx = x;
    this.hoverY = w.arena.floorY - BOSS.hoverHeight;
    this.y = w.arena.top - 120;
    this.ty = this.hoverY;

    this.shadow = scene.add.image(x, w.arena.floorY, TEX.shadow).setDepth(DEPTH.decor).setAlpha(0.5);
    this.thrusters = scene.add.particles(0, 0, TEX.soft, {
      lifespan: { min: 180, max: 320 },
      speedY: { min: 60, max: 140 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.9, end: 0 },
      color: [PALETTE.white, PALETTE.enemyGlow, PALETTE.enemy, PALETTE.fire3],
      frequency: 30,
      blendMode: 'ADD',
    });
    this.thrusters.setDepth(DEPTH.boss - 1);
    this.arms = [-34, 34].map((dx) => scene.add.sprite(x + dx, this.y + 22, TEX.bossArm, 0).setOrigin(0.5, 0).setDepth(DEPTH.boss - 1));
    this.hull = scene.add.image(x, this.y, TEX.bossHull).setDepth(DEPTH.boss);
    this.plates = [
      scene.add.image(x - 38, this.y + 6, TEX.bossPlate).setDepth(DEPTH.boss + 1),
      scene.add.image(x + 38, this.y + 6, TEX.bossPlate).setFlipX(true).setDepth(DEPTH.boss + 1),
      scene.add.image(x, this.y - 20, TEX.bossTopPlate).setDepth(DEPTH.boss + 1),
    ];
    this.eyeSprite = scene.add.sprite(x, this.y - 2, TEX.bossEye, BOSS_EYE_FRAMES.closed).setDepth(DEPTH.emissive);
    this.parts = [this.hull, ...this.plates, ...this.arms];
    playSfx('roar', 0.8);
  }

  get eyeY(): number {
    return this.y - 2;
  }

  get alive(): boolean {
    return this.state !== 'dying' && this.state !== 'dead';
  }

  /** Still dropping in (its entrance roar). */
  get introducing(): boolean {
    return this.state === 'intro';
  }

  get defeated(): boolean {
    return this.state === 'dead';
  }

  get active(): boolean {
    return this.alive && this.state !== 'intro' && this.state !== 'transition' && !this.stuck;
  }

  private get invulnerable(): boolean {
    return this.state === 'intro' || this.state === 'transition' || !this.alive;
  }

  setTarget(x: number, y: number, rate: number): void {
    this.tx = x;
    this.ty = y;
    this.rate = rate;
  }

  jolt(dx: number, dy: number): void {
    this.joltX += dx;
    this.joltY += dy;
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    return this.box(out, 6);
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.state === 'intro') return false;
    return this.box(out, 0);
  }

  private box(out: Rect, shrink: number): boolean {
    const { width, height } = BOSS.hurtbox;
    out.x = this.x - width / 2 + shrink;
    out.y = this.y - height / 2 + shrink;
    out.w = width - shrink * 2;
    out.h = height - shrink * 2 + 6;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    if (this.invulnerable) {
      this.w.fx.burst('spark', hit.x, hit.y, 4);
      playSfx('droneHit', 0.5, 0.5);
      return 'blocked';
    }
    const mult = this.stuck ? BOSS.vulnerableDamageMultiplier : 1;
    this.hp = Math.max(0, this.hp - hit.damage * mult);
    this.flashLeft = 70;
    this.jolt(Math.sign(this.x - hit.x) * 3, -1);
    this.w.fx.burst(this.stuck ? 'fire' : 'spark', hit.x, hit.y, this.stuck ? 8 : 5);
    playSfx('droneHit', 0.9, this.stuck ? 0.7 : 0.8);
    this.w.onHealth(this.hp / BOSS.maxHp, this.phase);

    if (this.hp <= 0) {
      this.startDying();
      return 'killed';
    }
    if (this.phase === 0 && this.hp <= BOSS.maxHp * activeDifficulty().bossPhase2At) this.startTransition();
    return 'hit';
  }

  update(dtMs: number): void {
    if (this.state === 'dead') return;
    const dt = dtMs / 1000;
    this.stateT += dtMs;

    switch (this.state) {
      case 'intro':
        this.setTarget(this.x, this.hoverY, 1.6);
        if (this.stateT > 700) this.eye = 'charge';
        if (this.stateT >= BOSS.introMs) this.enter('idle');
        break;
      case 'idle':
        this.eye = 'idle';
        this.setTarget(this.x + Math.sin(this.stateT * 0.002) * 30, this.hoverY + Math.sin(this.stateT * 0.003) * 8, 1.2);
        if (this.stateT >= pace.bossRest(BOSS.idleMs[this.phase])) this.startAttack();
        break;
      case 'attack':
        if (this.attack) {
          this.attack.t += dtMs;
          if (ATTACKS[this.attack.kind](this, this.w, this.attack, dtMs)) {
            this.attack = null;
            this.stuck = false;
            this.shake = 0;
            this.enter('idle');
          }
        }
        break;
      case 'transition':
        this.updateTransition();
        break;
      case 'dying':
        this.updateDying(dtMs);
        break;
    }

    const k = 1 - Math.exp(-this.rate * dt);
    this.x += (this.tx - this.x) * k;
    this.y += (this.ty - this.y) * k;
    this.x = Math.max(this.w.arena.left + 50, Math.min(this.w.arena.right - 50, this.x));
    this.joltX *= Math.exp(-12 * dt);
    this.joltY *= Math.exp(-12 * dt);
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.render();
  }

  private enter(state: BossState): void {
    this.state = state;
    this.stateT = 0;
  }

  private startAttack(): void {
    if (this.bag.length === 0) this.bag = Phaser.Utils.Array.Shuffle([...PHASE_BAGS[this.phase]]);
    let kind = this.bag.shift()!;
    // Guarantee a slam (the punish window) at least every third attack.
    if (this.sinceSlam >= 2 && kind !== 'slam') {
      const i = this.bag.indexOf('slam');
      if (i >= 0) this.bag.splice(i, 1);
      this.bag.unshift(kind);
      kind = 'slam';
    }
    if (kind === 'summon' && this.w.aliveAdds() >= BOSS.maxAdds[this.phase]) kind = 'volley';
    this.sinceSlam = kind === 'slam' ? 0 : this.sinceSlam + 1;
    this.attack = newAttack(kind);
    this.enter('attack');
  }

  private startTransition(): void {
    this.phase = 1;
    this.w.cancelThreat();
    this.attack = null;
    this.stuck = false;
    this.shake = 0;
    this.w.hazards.clear();
    this.w.projectiles.clear('enemy', true);
    this.enter('transition');
    this.w.time.slowMo(0.3, 500, 400);
    playSfx('roar');
    this.w.fx.shake(FX.shakeHeavy, 700);
    this.w.onPhase2();
  }

  private updateTransition(): void {
    const cx = (this.w.arena.left + this.w.arena.right) / 2;
    this.setTarget(cx, this.hoverY - 10, 2);
    this.eye = blinkOn(this.stateT, 90) ? 'vulnerable' : 'charge';
    this.shake = 3;
    if (this.stateT > 700 && this.plates[0].visible) {
      // Armour blows off: phase 2 is faster and angrier.
      for (const [i, plate] of this.plates.entries()) {
        const dir = i === 0 ? -1 : i === 1 ? 1 : 0;
        this.w.fx.explosion(plate.x, plate.y, 'small');
        plate.scene.tweens.add({
          targets: plate,
          x: plate.x + dir * 90 + (dir === 0 ? 40 : 0),
          y: this.w.arena.floorY + 20,
          angle: dir * 400 + 200,
          alpha: 0,
          duration: 900,
          ease: 'Quad.easeIn',
          onComplete: () => plate.setVisible(false),
        });
      }
      this.w.fx.burst('debris', this.x, this.y, 20);
      this.w.fx.flash(this.x, this.y, PALETTE.enemy, 80, 400);
      this.w.dropPickup(cx, this.y + 20);
      playSfx('bigExplode', 0.7);
    }
    if (this.stateT >= BOSS.phaseTransitionMs) {
      this.shake = 0;
      this.enter('idle');
    }
  }

  private startDying(): void {
    this.w.cancelThreat();
    this.attack = null;
    this.stuck = false;
    this.w.hazards.clear();
    this.w.projectiles.clear('enemy', true);
    this.w.time.slowMo(0.25, BOSS.deathSlowMoMs, 600);
    this.enter('dying');
    this.eye = 'vulnerable';
    playSfx('roar', 1);
  }

  private updateDying(dtMs: number): void {
    this.shake = 4;
    this.setTarget(this.x, this.hoverY + 30, 0.8);
    this.explodeTimer -= dtMs;
    if (this.explodeTimer <= 0) {
      this.explodeTimer = 140 + Math.random() * 120;
      const ex = this.x + (Math.random() - 0.5) * 90;
      const ey = this.y + (Math.random() - 0.5) * 50;
      this.w.fx.explosion(ex, ey, Math.random() < 0.3 ? 'medium' : 'small');
      playSfx('explode', 0.8, 0.8 + Math.random() * 0.4);
    }
    if (this.stateT >= BOSS.deathSlowMoMs * 0.6) {
      this.enter('dead');
      this.w.fx.explosion(this.x, this.y, 'big');
      this.w.fx.burst('debris', this.x, this.y, 40);
      this.w.fx.burst('fire', this.x, this.y, 60);
      this.w.fx.rays(this.x, this.y, PALETTE.fire1, 300, 1200);
      this.w.fx.ring(this.x, this.y, PALETTE.white, 220, 800);
      this.w.fx.light(this.x, this.y, 400, PALETTE.fire1, 1500);
      playSfx('bigExplode');
      for (const part of [this.hull, ...this.plates, this.eyeSprite, ...this.arms, this.shadow]) part.setVisible(false);
      this.thrusters.stop();
      this.w.onDefeated(this.x, this.y);
    }
  }

  private render(): void {
    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 2 : 0;
    const sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const bob = this.state === 'idle' ? Math.sin(this.stateT * 0.004) * 2 : 0;
    const x = Math.round(this.x + this.joltX + sx);
    const y = Math.round(this.y + this.joltY + sy + bob);
    this.hull.setPosition(x, y);
    if (this.plates[0].alpha === 1) {
      this.plates[0].setPosition(x - 38, y + 6);
      this.plates[1].setPosition(x + 38, y + 6);
      this.plates[2].setPosition(x, y - 20);
    }
    const swing = Math.sin(this.stateT * 0.004) * 8;
    this.arms[0].setPosition(x - 34, y + 20).setAngle(this.stuck ? 30 : swing);
    this.arms[1].setPosition(x + 34, y + 20).setAngle(this.stuck ? -30 : -swing);
    this.eyeSprite.setPosition(x, y - 2);
    this.eyeSprite.setFrame(
      this.eye === 'charge' ? BOSS_EYE_FRAMES.charge : this.eye === 'vulnerable' ? BOSS_EYE_FRAMES.vulnerable : this.eye === 'closed' ? BOSS_EYE_FRAMES.closed : BOSS_EYE_FRAMES.idle,
    );
    this.thrusters.setPosition(x, y + 30);
    this.thrusters.emitting = !this.stuck && this.state !== 'dead';

    const altitude = Math.max(0, this.w.arena.floorY - (y + 32));
    this.shadow.setPosition(x, this.w.arena.floorY - 1).setScale(Math.max(0.5, 2.2 - altitude / 120), 1).setAlpha(Math.max(0.15, 0.6 - altitude / 400));

    const flash = this.flashLeft > 0;
    for (const p of this.parts) {
      if (flash) p.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
      else if (this.stuck) p.setTint(0xffb0a0).setTintMode(Phaser.TintModes.MULTIPLY);
      else p.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    }

    const eyeColor = this.eye === 'vulnerable' ? PALETTE.fire1 : PALETTE.enemy;
    this.w.lighting.add(x, y - 2, this.eye === 'charge' ? 110 : 80, eyeColor, 1);
    this.w.lighting.add(x, y + 34, 70, PALETTE.enemy, 0.8);
    if (this.phase === 1 && Math.random() < 0.2) this.w.fx.trail('smoke', x + (Math.random() - 0.5) * 60, y - 10);
  }
}
