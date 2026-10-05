import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TECH } from '../../config/tech';
import { TEX } from '../../scenes/preload/assetKeys';
import { blinkOn } from '../../systems/Accessibility';
import { playSfx } from '../../systems/audio/Sfx';
import type { Hazard, Rect } from '../types';
import type { TechDeps } from './Machine';

const TR = TECH.trains;
const CAR_W = 128;
const CAR_H = 52;

/**
 * Trains roaring along a track bed on a timer. Every one is announced the
 * same way on every difficulty: the platform lamps flash, the horn sounds and
 * headlights grow in the tunnel mouth, then the train comes through. Anyone
 * on the tracks gets hit; the platform is safe.
 */
export class Trains implements Hazard {
  readonly damage = TR.damage;
  private readonly cars: Phaser.GameObjects.Image[] = [];
  private readonly lamps: Phaser.GameObjects.Sprite[] = [];
  private readonly rails: Phaser.GameObjects.TileSprite;
  private readonly left: number;
  private readonly right: number;
  private readonly wheelsY: number;
  private state: 'wait' | 'warn' | 'pass' = 'wait';
  private t: number;
  private x = 0;
  /** Paused while a set piece owns the station (the drain). */
  enabled = true;

  constructor(
    private readonly d: TechDeps,
    fromX: number,
    toX: number,
    y: number,
    private readonly everyMs: number,
    firstMs: number,
  ) {
    this.left = fromX * TILE;
    this.right = toX * TILE;
    this.wheelsY = y * TILE;
    this.t = firstMs;
    for (let i = 0; i < TR.cars; i++) {
      // Behind the terrain: a train runs out of sight into the tunnel at the end of the line.
      this.cars.push(d.scene.add.image(0, this.wheelsY, TEX.trainCar, i === 0 ? 0 : 1).setOrigin(0, 1).setDepth(DEPTH.terrain - 1).setVisible(false));
    }
    // Warning lamps every few tiles, hanging under the platform's lip over the tracks.
    for (let x = this.left + 40; x < this.right - 20; x += 112) {
      this.lamps.push(d.scene.add.sprite(x, this.wheelsY - CAR_H + 8, TEX.warnLamp, 0).setOrigin(0.5, 1).setDepth(DEPTH.decor).setFlipY(true));
    }
    // The rails along the bed.
    this.rails = d.scene.add.tileSprite(this.left, this.wheelsY - 4, this.right - this.left, 8, TEX.rails).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
  }

  get active(): boolean {
    return this.state === 'pass';
  }

  hitbox(out: Rect): boolean {
    if (this.state !== 'pass') return false;
    out.x = this.x;
    out.y = this.wheelsY - CAR_H + 6;
    out.w = CAR_W * TR.cars;
    out.h = CAR_H - 6;
    return true;
  }

  update(dtMs: number): void {
    if (!this.enabled && this.state === 'wait') return;
    this.t -= dtMs;
    const near = this.d.player.x > this.left - 300 && this.d.player.x < this.right + 300;
    if (this.state === 'wait') {
      if (this.t > 0) return;
      // Trains only run while Ben is near enough to see them.
      if (!near) {
        this.t = 1000;
        return;
      }
      this.state = 'warn';
      this.t = TR.warnMs;
      playSfx('trainHorn', 0.8);
      return;
    }
    if (this.state === 'warn') {
      const k = 1 - this.t / TR.warnMs;
      const on = blinkOn(this.t, 180);
      for (const l of this.lamps) {
        l.setFrame(on ? 1 : 0);
        if (on) this.d.lighting.add(l.x, l.y - 6, 26, PALETTE.hazard, 0.8);
      }
      // Headlights growing in the tunnel mouth on the left.
      this.d.lighting.add(this.left + 10, this.wheelsY - 22, 30 + k * 90, PALETTE.white, 0.5 + k * 0.5);
      if (this.t > 0) return;
      this.state = 'pass';
      this.x = this.left - CAR_W * TR.cars;
      for (const c of this.cars) c.setVisible(true);
      for (const l of this.lamps) l.setFrame(0);
      playSfx('trainPass', 1);
      this.d.fx.shake(0.006, 900);
      return;
    }
    this.x += TR.speed * (dtMs / 1000);
    this.cars.forEach((c, i) => c.setX(this.x + (TR.cars - 1 - i) * CAR_W));
    // The front car leads on the right, its headlight sweeping ahead.
    this.d.lighting.add(this.x + CAR_W * TR.cars + 30, this.wheelsY - 16, 90, PALETTE.white, 0.9);
    for (let i = 0; i < TR.cars; i++) this.d.lighting.add(this.x + i * CAR_W + CAR_W / 2, this.wheelsY - 30, 60, 0xffe7a0, 0.5);
    if (this.x > this.right + 40) {
      this.state = 'wait';
      this.t = this.everyMs;
      for (const c of this.cars) c.setVisible(false);
    }
  }

  /** Called when the train actually hit Ben: he's flung up onto the platform side. */
  onHitPlayer(): void {
    playSfx('punchHit', 1, 0.5);
    this.d.fx.popText(this.d.player.x, this.d.player.y - 40, 'WHAM!', PALETTE.gold);
  }

  destroy(): void {
    for (const c of this.cars) c.destroy();
    for (const l of this.lamps) l.destroy();
    this.rails.destroy();
  }
}
