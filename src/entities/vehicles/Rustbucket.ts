import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { RUSTBUCKET_CFG as R } from '../../config/chapter2';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { RUSTBUCKET } from '../../scenes/preload/vehicles';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { Rect } from '../types';

/**
 * Grandpa Max's RV as a live vehicle: it drives (wheels, exhaust, a gentle
 * bob), brakes, lights up at dusk, and its roof can be a platform Ben stands on.
 * `x` is its centre, `roadY` the road it rolls on.
 */
export class Rustbucket {
  readonly sprite: Phaser.GameObjects.Sprite;
  x: number;
  roadY: number;
  driving = false;
  private braking = false;
  private t = 0;
  private puff = 0;
  /** The roof as a solid for drones and shots (kept up to date while it exists). */
  readonly roofRect: Rect = { x: 0, y: 0, w: 0, h: 8 };
  roof: Phaser.Physics.Arcade.Image | null = null;
  /** Extra vertical offset (a pothole jolt), decays on its own. */
  private jolt = 0;

  constructor(private readonly scene: Phaser.Scene, x: number, roadY: number) {
    this.x = x;
    this.roadY = roadY;
    this.sprite = scene.add.sprite(x, roadY, TEX.rustbucket, 0).setOrigin(0.5, 66 / RUSTBUCKET.h).setDepth(DEPTH.decorBack + 2);
    this.updateRoofRect();
  }

  get roofY(): number {
    return this.roadY - R.roofHeight;
  }

  get roofLeft(): number {
    return this.x + R.roofFrom;
  }

  get roofRight(): number {
    return this.x + R.roofTo;
  }

  setDriving(on: boolean): void {
    this.driving = on;
    if (on) this.sprite.play('rustbucket-drive', true);
    else this.sprite.stop().setFrame(this.braking ? 2 : 0);
  }

  setBraking(on: boolean): void {
    this.braking = on;
    if (!this.driving) this.sprite.setFrame(on ? 2 : 0);
  }

  moveTo(x: number, roadY = this.roadY): void {
    this.x = x;
    this.roadY = roadY;
    this.updateRoofRect();
    if (this.roof) {
      this.roof.setPosition(this.x + (R.roofFrom + R.roofTo) / 2, this.roofY + 4);
      this.roof.refreshBody();
    }
  }

  /** Makes the roof a one-way platform for Ben. */
  enableRoof(collideWith: Phaser.GameObjects.GameObject): void {
    if (this.roof) return;
    const roof = this.scene.physics.add.staticImage(0, 0, TEX.whitePx).setVisible(false);
    roof.setDisplaySize(R.roofTo - R.roofFrom, 8);
    const body = roof.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    this.roof = roof;
    this.moveTo(this.x, this.roadY);
    this.scene.physics.add.collider(collideWith, roof);
  }

  disableRoof(): void {
    this.roof?.destroy();
    this.roof = null;
  }

  /** A pothole: the RV jolts (the chase bounces Ben with it). */
  bump(): void {
    this.jolt = -4;
  }

  update(dtMs: number, fx: Fx, lighting: Lighting, night: number): void {
    this.t += dtMs;
    this.jolt *= Math.exp(-10 * (dtMs / 1000));
    const bob = this.driving ? Math.round(Math.sin(this.t * 0.02) * R.bobAmplitude) : 0;
    this.sprite.setPosition(Math.round(this.x), Math.round(this.roadY + bob + this.jolt));
    if (this.driving) {
      this.puff -= dtMs;
      if (this.puff <= 0) {
        this.puff = 90;
        fx.trail('smoke', this.x - RUSTBUCKET.w / 2 + 4, this.roadY - 10);
        if (Math.random() < 0.5) fx.trail('dust', this.x - 40 + Math.random() * 80, this.roadY - 2);
      }
    }
    // Warm windows and headlights once the sun is going down.
    if (night > 0.25) {
      const k = Math.min(1, (night - 0.25) * 2);
      for (const dx of [-56, -26, 4]) lighting.add(this.x + dx, this.roadY - 44, 34, 0xffd890, 0.7 * k);
      lighting.add(this.x + RUSTBUCKET.w / 2 + 40, this.roadY - 18, R.headlightRadius, 0xfff0c0, 0.9 * k);
      lighting.add(this.x + RUSTBUCKET.w / 2 - 4, this.roadY - 20, 26, PALETTE.white, k);
    }
    if (this.braking) lighting.add(this.x - RUSTBUCKET.w / 2 + 10, this.roadY - 22, 30, 0xff3a3a, 0.9);
  }

  private updateRoofRect(): void {
    this.roofRect.x = this.roofLeft;
    this.roofRect.y = this.roofY;
    this.roofRect.w = R.roofTo - R.roofFrom;
  }

  destroy(): void {
    this.disableRoof();
    this.sprite.destroy();
  }
}
