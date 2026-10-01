import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { BOULDER } from '../../config/training';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import type { Liftable, Rect } from '../types';

const W = 18;
const H = 16;

/** A boulder that strong aliens can lift and hurl. Solid until picked up. */
export class Boulder implements Liftable {
  readonly image: Phaser.Physics.Arcade.Image;
  readonly height = H;
  private readonly homeX: number;
  private readonly homeY: number;
  private state: 'resting' | 'held' | 'thrown' | 'gone' = 'resting';
  private respawnLeft = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    tx: number,
    surfaceY: number,
    private readonly fx: Fx,
    private readonly respawns: boolean,
  ) {
    this.homeX = tx * TILE + TILE / 2;
    this.homeY = surfaceY * TILE - H / 2;
    this.image = scene.physics.add.staticImage(this.homeX, this.homeY, TEX.boulder).setDepth(DEPTH.props);
  }

  get liftable(): boolean {
    return this.state === 'resting';
  }

  /** True when it is back on its spot and Combat should list it again. */
  get resting(): boolean {
    return this.state === 'resting';
  }

  liftBox(out: Rect): boolean {
    out.x = this.image.x - W / 2 - 2;
    out.y = this.image.y - H / 2 - 2;
    out.w = W + 4;
    out.h = H + 4;
    return true;
  }

  lift(): void {
    this.state = 'held';
    this.image.disableBody(false, false);
    this.image.setDepth(DEPTH.player + 1);
    this.fx.burst('dust', this.image.x, this.image.y + H / 2, 6);
    playSfx('grab', 1, 0.8);
  }

  carry(x: number, bottomY: number): void {
    this.image.setPosition(x, bottomY - H / 2);
  }

  fly(x: number, y: number, angle: number): void {
    this.state = 'thrown';
    this.image.setPosition(x, y).setRotation(angle);
    if (Math.random() < 0.5) this.fx.trail('dust', x, y);
  }

  shatter(x: number, y: number): void {
    this.state = 'gone';
    this.image.setVisible(false).setRotation(0);
    this.fx.burst('debris', x, y, 22);
    this.fx.burst('dust', x, y, 12);
    this.fx.burst('smoke', x, y, 6);
    this.fx.shake(0.01, 220);
    playSfx('rockBreak');
    this.respawnLeft = this.respawns ? BOULDER.respawnMs : Infinity;
  }

  /** Returns true on the frame it reappears (the level re-registers it as liftable). */
  update(dtMs: number): boolean {
    if (this.state !== 'gone' || !Number.isFinite(this.respawnLeft)) return false;
    this.respawnLeft -= dtMs;
    if (this.respawnLeft > 0) return false;
    this.state = 'resting';
    this.image.enableBody(true, this.homeX, this.homeY, true, true).setDepth(DEPTH.props).setAlpha(0).setScale(1.4);
    this.scene.tweens.add({ targets: this.image, alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.fx.ring(this.homeX, this.homeY, PALETTE.omnitrix, 18, 300);
    this.fx.burst('green', this.homeX, this.homeY, 10);
    return true;
  }
}
