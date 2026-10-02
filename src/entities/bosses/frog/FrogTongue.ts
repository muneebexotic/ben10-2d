import Phaser from 'phaser';
import { DEPTH } from '../../../config/constants';
import { FROG } from '../../../config/frog';
import { TEX } from '../../../scenes/preload/assetKeys';
import type { Damageable, Hazard, Hit, HitResult, Rect } from '../../types';

type TongueState = 'in' | 'out' | 'hold' | 'back';

/** What the tongue reports back to its frog. */
export interface TongueOwner {
  onTongueHit(hit: Hit): HitResult;
}

/**
 * The frog's tongue: shoots out along a locked line, hangs there a moment
 * (hit it! a smash yanks the frog off its feet), then snaps back. Only the
 * sticky tip hurts Ben.
 */
export class FrogTongue implements Damageable, Hazard {
  readonly countsAsEnemy = true;
  readonly damage = FROG.tongue.damage;
  private readonly body: Phaser.GameObjects.TileSprite;
  private readonly tip: Phaser.GameObjects.Image;
  private state: TongueState = 'in';
  private t = 0;
  private len = 0;
  private x = 0;
  private y = 0;
  private angle = 0;
  lastDamage = 0;
  /** Touched Ben this lash (the tip only stings once). */
  private stung = false;

  constructor(scene: Phaser.Scene, private readonly owner: TongueOwner) {
    this.body = scene.add.tileSprite(0, 0, 8, 6, TEX.tongue, 0).setOrigin(0, 0.5).setDepth(DEPTH.boss + 1).setVisible(false);
    this.tip = scene.add.image(0, 0, TEX.tongue, 1).setDepth(DEPTH.boss + 2).setVisible(false).setScale(2);
  }

  get alive(): boolean {
    return this.state === 'out' || this.state === 'hold';
  }

  get active(): boolean {
    return (this.state === 'out' || this.state === 'hold') && !this.stung;
  }

  get extended(): boolean {
    return this.state !== 'in';
  }

  get tipX(): number {
    return this.x + Math.cos(this.angle) * this.len;
  }

  get tipY(): number {
    return this.y + Math.sin(this.angle) * this.len;
  }

  lash(angle: number): void {
    this.state = 'out';
    this.t = 0;
    this.len = 0;
    this.angle = angle;
    this.stung = false;
    this.body.setVisible(true);
    this.tip.setVisible(true);
  }

  /** Yanked or the frog was interrupted: snap it back now. */
  retract(): void {
    if (this.state === 'in') return;
    this.state = 'back';
    this.t = 0;
  }

  /** Follows the frog's mouth. Returns true once the tongue is home. */
  update(dtMs: number, mouthX: number, mouthY: number): boolean {
    this.x = mouthX;
    this.y = mouthY;
    const T = FROG.tongue;
    this.t += dtMs;
    if (this.state === 'out') {
      this.len = Math.min(T.reach, this.len + (T.speed * dtMs) / 1000);
      if (this.len >= T.reach) {
        this.state = 'hold';
        this.t = 0;
      }
    } else if (this.state === 'hold' && this.t >= T.holdMs) {
      this.state = 'back';
      this.t = 0;
    } else if (this.state === 'back') {
      this.len = Math.max(0, this.len - (T.reach * dtMs) / T.retractMs);
      if (this.len <= 0) {
        this.state = 'in';
        this.body.setVisible(false);
        this.tip.setVisible(false);
        return true;
      }
    }
    this.body.setPosition(mouthX, mouthY).setRotation(this.angle).setSize(Math.max(1, this.len), 6);
    this.tip.setPosition(this.tipX, this.tipY);
    return this.state === 'in';
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = this.tipX - 7;
    out.y = this.tipY - 7;
    out.w = 14;
    out.h = 14;
    return true;
  }

  onHitPlayer(): void {
    this.stung = true;
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.len < 20) return false;
    const x1 = this.tipX;
    const y1 = this.tipY;
    out.x = Math.min(this.x, x1) - 4;
    out.y = Math.min(this.y, y1) - 7;
    out.w = Math.abs(x1 - this.x) + 8;
    out.h = Math.abs(y1 - this.y) + 14;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    const r = this.owner.onTongueHit(hit);
    this.lastDamage = hit.damage * FROG.tongue.hitMultiplier;
    return r;
  }

  hide(): void {
    this.state = 'in';
    this.body.setVisible(false);
    this.tip.setVisible(false);
  }
}
