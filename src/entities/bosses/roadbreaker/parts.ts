import Phaser from 'phaser';
import { ROADBREAKER as RB } from '../../../config/roadbreaker';
import { DEPTH } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import type { Fx } from '../../../systems/Fx';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Damageable, Hazard, Hit, HitKind, HitResult, Rect } from '../../types';
import { tireMultiplier } from './rules';

/** What the parts need from the boss they're bolted to. */
export interface PartOwner {
  readonly fx: Fx;
  /** Truck mode, rolling or dazed (tires can be hit). */
  readonly tiresExposed: boolean;
  /** Robot mode, standing (plates can be hit). */
  readonly platesExposed: boolean;
  onTirePopped(tire: RbTire): void;
  onPlateBroken(plate: RbPlate): void;
}

/**
 * One of the truck's two big tires. Melee (XLR8's cuts, Ben's fists) shreds
 * them; fire barely scorches the rubber. In robot mode they become shoulder
 * wheels (the saw attack throws them).
 */
export class RbTire implements Damageable {
  readonly countsAsEnemy = true;
  readonly sprite: Phaser.GameObjects.Sprite;
  hp: number = RB.truck.tire.hp;
  lastDamage = 0;
  x = 0;
  y = 0;
  private flashLeft = 0;

  constructor(scene: Phaser.Scene, private readonly owner: PartOwner) {
    this.sprite = scene.add.sprite(0, 0, TEX.rbWheel, 0).setDepth(DEPTH.boss + 1).play('rb-wheel');
  }

  get popped(): boolean {
    return this.hp <= 0;
  }

  get alive(): boolean {
    return !this.popped;
  }

  hurtbox(out: Rect): boolean {
    if (this.popped || !this.owner.tiresExposed) return false;
    out.x = this.x - 13;
    out.y = this.y - 13;
    out.w = 26;
    out.h = 26;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (this.popped || !this.owner.tiresExposed) return 'none';
    const mult = tireMultiplier(hit.kind);
    const dmg = hit.damage * mult;
    this.lastDamage = dmg;
    this.hp -= dmg;
    this.flashLeft = 70;
    this.owner.fx.burst('debris', this.x, this.y, mult > 1 ? 5 : 2);
    playSfx('droneHit', 0.7, 0.6);
    if (this.hp > 0) return 'hit';
    this.sprite.stop().setFrame(2);
    this.owner.fx.burst('smoke', this.x, this.y, 10);
    this.owner.fx.burst('debris', this.x, this.y, 14);
    this.owner.fx.popText(this.x, this.y - 18, 'POP!', PALETTE.fire1);
    playSfx('explode', 0.7, 1.4);
    this.owner.onTirePopped(this);
    return 'killed';
  }

  /** A fresh tire bolted on. */
  restore(): void {
    this.hp = RB.truck.tire.hp;
    this.sprite.play('rb-wheel').setVisible(true).setScale(1.4);
    this.sprite.scene.tweens.add({ targets: this.sprite, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  place(x: number, y: number, spinning: boolean, dtMs: number): void {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(Math.round(x), Math.round(y));
    if (!this.popped) {
      if (spinning && !this.sprite.anims.isPlaying) this.sprite.play('rb-wheel');
      if (!spinning && this.sprite.anims.isPlaying) this.sprite.stop();
    }
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    if (this.flashLeft > 0) this.sprite.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.white);
    else this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
  }
}

/** A hazard-striped chest plate. Only smash damage (Four Arms) cracks it; everything else glances off. */
export class RbPlate implements Damageable {
  readonly countsAsEnemy = true;
  readonly sprite: Phaser.GameObjects.Image;
  hp: number = RB.robot.plateHp;
  lastDamage = 0;
  x = 0;
  y = 0;
  broken = false;
  private flashLeft = 0;

  constructor(scene: Phaser.Scene, private readonly owner: PartOwner) {
    this.sprite = scene.add.image(0, 0, TEX.rbPlate, 0).setDepth(DEPTH.boss + 2).setVisible(false);
  }

  get alive(): boolean {
    return !this.broken;
  }

  accepts(kind: HitKind): boolean {
    return kind === 'smash';
  }

  hurtbox(out: Rect): boolean {
    if (this.broken || !this.owner.platesExposed) return false;
    out.x = this.x - 9;
    out.y = this.y - 7;
    out.w = 18;
    out.h = 14;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (this.broken || !this.owner.platesExposed) return 'none';
    if (hit.kind !== 'smash') {
      this.owner.fx.burst('spark', hit.x, hit.y, 3);
      playSfx('armorTink', 0.6, 1.1);
      return 'blocked';
    }
    this.lastDamage = hit.damage;
    this.hp -= hit.damage;
    this.flashLeft = 80;
    this.owner.fx.burst('spark', this.x, this.y, 8);
    playSfx('armorCrack', 0.9);
    if (this.hp > RB.robot.plateHp / 2) return 'hit';
    this.sprite.setFrame(1);
    if (this.hp > 0) return 'hit';
    this.broken = true;
    playSfx('armorBreak');
    this.owner.fx.burst('debris', this.x, this.y, 12);
    this.owner.fx.popText(this.x, this.y - 14, 'CRACK!', PALETTE.gold);
    const dir = Math.sign(this.x - hit.x) || 1;
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      x: this.x + dir * 70,
      y: this.y + 90,
      angle: dir * 360,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => this.sprite.setVisible(false),
    });
    this.owner.onPlateBroken(this);
    return 'killed';
  }

  /** Bolted on (the robot's transformation); `show` false hides it until then. */
  attach(show: boolean): void {
    this.broken = false;
    this.hp = RB.robot.plateHp;
    this.sprite.setFrame(0).setAlpha(1).setAngle(0).setVisible(show);
  }

  place(x: number, y: number, dtMs: number): void {
    this.x = x;
    this.y = y;
    if (this.broken) return;
    this.sprite.setPosition(Math.round(x), Math.round(y));
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    if (this.flashLeft > 0) this.sprite.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.white);
    else this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
  }
}

/**
 * A wheel the robot rips off and bowls along the floor. Jump it, or hit it
 * with a punch, a cut or a smash and it rolls back into the robot.
 */
export class RbSaw implements Damageable, Hazard {
  readonly countsAsEnemy = false;
  readonly damage = RB.robot.saw.damage;
  readonly sprite: Phaser.GameObjects.Sprite;
  x = 0;
  y = 0;
  vx = 0;
  rolling = false;
  /** Knocked back toward the robot: it hurts the robot, not Ben. */
  returned = false;
  private life = 0;
  private bounces = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly bounds: { left: number; right: number; floorY: number },
  ) {
    this.sprite = scene.add.sprite(0, 0, TEX.rbWheel, 0).setDepth(DEPTH.boss + 3).setVisible(false);
  }

  launch(x: number, dir: 1 | -1): void {
    const S = RB.robot.saw;
    this.x = x;
    this.y = this.bounds.floorY - S.radius;
    this.vx = dir * S.speed;
    this.rolling = true;
    this.returned = false;
    this.life = S.lifeMs;
    this.bounces = 0;
    this.sprite.setVisible(true).setPosition(x, this.y).clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
  }

  get active(): boolean {
    return this.rolling && !this.returned;
  }

  get alive(): boolean {
    return this.rolling && !this.returned;
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    const r = RB.robot.saw.radius - 2;
    out.x = this.x - r;
    out.y = this.y - r;
    out.w = r * 2;
    out.h = r * 2;
    return true;
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    const r = RB.robot.saw.radius + 4;
    out.x = this.x - r;
    out.y = this.y - r;
    out.w = r * 2;
    out.h = r * 2;
    return true;
  }

  accepts(kind: HitKind): boolean {
    return kind === 'melee' || kind === 'smash' || kind === 'reflect' || kind === 'transform';
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    // Batted back the way it came, faster.
    this.returned = true;
    this.vx = (Math.sign(this.x - hit.x) || -Math.sign(this.vx)) * RB.robot.saw.speed * 1.5;
    this.life = RB.robot.saw.lifeMs;
    this.fx.burst('spark', this.x, this.y, 10);
    this.fx.popText(this.x, this.y - 18, 'RETURN!', PALETTE.omnitrix);
    this.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xb8ffb0);
    playSfx('parry');
    return 'hit';
  }

  onHitPlayer(): void {
    this.burst();
  }

  update(dtMs: number): void {
    if (!this.rolling) return;
    const dt = dtMs / 1000;
    this.x += this.vx * dt;
    this.life -= dtMs;
    const r = RB.robot.saw.radius;
    if (this.x < this.bounds.left + r || this.x > this.bounds.right - r) {
      this.x = Phaser.Math.Clamp(this.x, this.bounds.left + r, this.bounds.right - r);
      if (this.bounces < RB.robot.saw.bounces && !this.returned) {
        this.bounces++;
        this.vx = -this.vx;
        this.fx.burst('spark', this.x, this.y, 8);
        playSfx('armorTink', 0.8, 0.7);
      } else {
        this.burst();
        return;
      }
    }
    if (this.life <= 0) {
      this.burst();
      return;
    }
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y));
    this.sprite.rotation += (this.vx / r) * dt;
    if (Math.random() < 0.6) this.fx.trail('spark', this.x - Math.sign(this.vx) * r, this.bounds.floorY - 1);
  }

  burst(): void {
    if (!this.rolling) return;
    this.rolling = false;
    this.sprite.setVisible(false);
    this.fx.explosion(this.x, this.y, 'small');
    playSfx('explode', 0.6, 1.2);
  }
}
