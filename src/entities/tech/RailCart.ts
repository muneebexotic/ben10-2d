import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TECH } from '../../config/tech';
import { CART_TILES } from '../../levels/reachability';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Controls } from '../../systems/InputMap';
import { playSfx } from '../../systems/audio/Sfx';
import { chance } from '../../systems/Pacing';
import type { Rect } from '../types';
import type { Machine, TechDeps } from './Machine';

const C = TECH.cart;
const W = CART_TILES * TILE;
const H = 30;

/**
 * A maintenance cart parked on a rail over the live track. Upgrade merges into
 * its motor and drives it: left and right, J sounds the horn (a blast that
 * shorts out machines ahead), and whatever's in front gets rammed. At full
 * speed it smashes the boards across the end of the line.
 */
export class RailCart implements Machine {
  readonly kind = 'cart';
  readonly rect: Rect;
  readonly body: Phaser.Physics.Arcade.Image;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly startX: number;
  private readonly endX: number;
  private readonly railY: number;
  private barrierImg: Phaser.GameObjects.Image | null = null;
  private readonly barrierRect: Rect | null = null;
  private barrierBody: Phaser.Physics.Arcade.Image | null = null;
  private vx = 0;
  private state: 'parked' | 'driving' | 'stopped' = 'parked';
  private atEndMs = 0;
  private hornReadyAt = 0;
  private ramKey: object = {};
  private ramResetAt = 0;
  private soundT = 0;
  holding = false;

  constructor(
    private readonly d: TechDeps,
    readonly id: string,
    tx: number,
    ty: number,
    toX: number,
    barrier: { x: number; y: number; h: number } | undefined,
  ) {
    this.railY = ty * TILE;
    this.startX = tx * TILE;
    this.endX = toX * TILE;
    this.rect = { x: this.startX, y: this.railY - H, w: W, h: H };
    this.sprite = d.scene.add.sprite(this.rect.x + W / 2, this.railY, TEX.cart, 0).setOrigin(0.5, 1).setDepth(DEPTH.decor + 1);
    this.body = d.scene.physics.add.staticImage(this.rect.x + W / 2, this.rect.y + H / 2 + 2, TEX.whitePx).setVisible(false);
    this.body.setDisplaySize(W - 4, H - 4).refreshBody();
    d.addSolid(this.rect);
    if (barrier) {
      this.barrierRect = { x: barrier.x * TILE, y: barrier.y * TILE, w: TILE, h: barrier.h * TILE };
      const b = this.barrierRect;
      this.barrierImg = d.scene.add.image(b.x + TILE / 2, b.y + b.h, TEX.cartBarrier).setOrigin(0.5, 1).setDepth(DEPTH.decor + 1);
      this.barrierBody = d.scene.physics.add.staticImage(b.x + TILE / 2, b.y + b.h / 2, TEX.whitePx).setVisible(false);
      this.barrierBody.setDisplaySize(TILE, b.h).refreshBody();
      d.addSolid(b);
    }
  }

  get anchorX(): number {
    return this.rect.x + W / 2;
  }

  get anchorY(): number {
    return this.rect.y;
  }

  /** The barrier's static body, for the player collider (null once smashed or if there is none). */
  get barrierCollider(): Phaser.Physics.Arcade.Image | null {
    return this.barrierBody;
  }

  mergeBox(out: Rect): boolean {
    if (this.state === 'driving') return false;
    const r = this.rect;
    out.x = r.x - 8;
    out.y = r.y - 18;
    out.w = r.w + 16;
    out.h = r.h + 18;
    return true;
  }

  enter(facing: 1 | -1): void {
    this.state = 'driving';
    this.holding = true;
    this.atEndMs = 0;
    this.sprite.setFrame(1).setFlipX(facing < 0);
    this.d.fx.popText(this.anchorX, this.rect.y - 10, 'ALL ABOARD!', PALETTE.upgrade);
    playSfx('powerUp', 0.8, 0.8);
  }

  control(c: Controls, dtMs: number): void {
    if (this.state !== 'driving') return;
    const dt = dtMs / 1000;
    const input = c.right && !c.left ? 1 : c.left && !c.right ? -1 : 0;
    if (input !== 0) {
      this.vx += input * C.accel * dt;
      this.sprite.setFlipX(input < 0);
    } else {
      this.vx -= Math.sign(this.vx) * Math.min(Math.abs(this.vx), C.friction * dt);
    }
    this.vx = Phaser.Math.Clamp(this.vx, -C.maxSpeed, C.maxSpeed);
    if (c.attackPressed && this.d.now() >= this.hornReadyAt) this.horn();
  }

  release(): void {
    this.holding = false;
    if (this.state === 'driving') this.state = 'stopped';
    this.sprite.setFrame(0);
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    if (this.state !== 'driving') {
      // Coasts to a stop with nobody at the controls.
      this.vx -= Math.sign(this.vx) * Math.min(Math.abs(this.vx), C.friction * 2 * dt);
    }
    if (this.vx !== 0) this.move(dt);
    const lamp = this.sprite.flipX ? this.rect.x : this.rect.x + W;
    if (this.state === 'driving') this.d.lighting.add(lamp + (this.sprite.flipX ? -30 : 30), this.rect.y + 14, 60, PALETTE.workLight, 0.8);
    this.d.lighting.add(this.anchorX, this.rect.y - 2, 18, this.state === 'driving' ? PALETTE.upgrade : 0xffb050, 0.6);
    if (this.state === 'driving' && this.rect.x >= this.endX - 1) {
      this.atEndMs += dtMs;
      if (this.atEndMs >= C.endEjectMs) {
        this.d.fx.popText(this.anchorX, this.rect.y - 12, 'END OF THE LINE!', PALETTE.gold);
        this.release();
      }
    }
  }

  private move(dt: number): void {
    const r = this.rect;
    let nx = r.x + this.vx * dt;
    // The barrier stops a slow cart dead; a fast one smashes through.
    const b = this.barrierRect;
    if (b && this.barrierBody && nx + W > b.x) {
      if (Math.abs(this.vx) >= C.barrierSpeed) this.smashBarrier();
      else {
        nx = b.x - W;
        this.vx = -this.vx * 0.3;
        playSfx('armorTink', 0.7, 0.7);
      }
    }
    nx = Phaser.Math.Clamp(nx, this.startX, this.endX);
    if (nx === this.endX || nx === this.startX) this.vx = 0;
    r.x = nx;
    this.sprite.setX(r.x + W / 2);
    this.body.setPosition(r.x + W / 2, r.y + H / 2 + 2).refreshBody();
    const speed = Math.abs(this.vx);
    if (speed > 40 && chance(0.6)) this.d.fx.trail('spark', r.x + (this.vx > 0 ? 8 : W - 8), this.railY - 2);
    this.soundT -= dt * 1000;
    if (speed > 30 && this.soundT <= 0) {
      this.soundT = 260 - speed * 0.6;
      playSfx('railClack', 0.5, 0.8 + speed / C.maxSpeed);
    }
    if (speed > 60) this.ram();
  }

  /** Whatever's in front of a moving cart gets flattened. */
  private ram(): void {
    const now = this.d.now();
    if (now >= this.ramResetAt) {
      this.ramKey = {};
      this.ramResetAt = now + C.ramEveryMs;
    }
    const dir = Math.sign(this.vx);
    const area: Rect = { x: dir > 0 ? this.rect.x + W - 4 : this.rect.x - 12, y: this.rect.y - 4, w: 16, h: H };
    const hits = this.d.ram(area, { damage: C.ramDamage, kind: 'melee', x: this.anchorX, y: this.rect.y + 10, knockback: C.ramKnockback, heavy: true, stunMs: C.ramStunMs }, this.ramKey);
    if (hits > 0) {
      this.d.fx.shake(0.008, 160);
      this.d.fx.popText(area.x + 8, this.rect.y - 8, 'WHAM!', PALETTE.gold);
      playSfx('punchHit', 1, 0.6);
    }
  }

  private horn(): void {
    this.hornReadyAt = this.d.now() + C.hornCooldownMs;
    const dir = this.sprite.flipX ? -1 : 1;
    const x = this.anchorX + dir * (W / 2 + C.hornRadius * 0.6);
    const y = this.rect.y + 12;
    this.d.blast(x, y, C.hornRadius, { damage: C.hornDamage, kind: 'tech', x: this.anchorX, y, knockback: 220, stunMs: C.hornStunMs });
    this.d.fx.flash(x, y, PALETTE.workLight, C.hornRadius, 260);
    this.d.fx.ring(this.anchorX + dir * W * 0.5, y, PALETTE.workLight, C.hornRadius, 300);
    this.d.lighting.flash(x, y, 120, PALETTE.workLight, 300);
    playSfx('horn');
  }

  private smashBarrier(): void {
    const b = this.barrierRect!;
    this.barrierBody?.disableBody(true, true);
    this.barrierBody = null;
    this.d.removeSolid(b);
    this.d.fx.burst('debris', b.x + 8, b.y + b.h / 2, 24);
    this.d.fx.burst('dust', b.x + 8, b.y + b.h, 12);
    this.d.fx.shake(0.014, 300);
    this.d.fx.popText(b.x + 8, b.y - 8, 'CRASH!', PALETTE.gold);
    playSfx('rockBreak', 1, 0.8);
    const img = this.barrierImg;
    if (img) this.d.scene.tweens.add({ targets: img, x: img.x + 60, y: img.y + 30, angle: 70, alpha: 0, duration: 500, ease: 'Quad.easeOut', onComplete: () => img.setVisible(false) });
  }

  destroy(): void {
    this.sprite.destroy();
    this.barrierImg?.destroy();
  }
}
