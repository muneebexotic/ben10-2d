import Phaser from 'phaser';
import { CHASE } from '../../config/chapter2';
import { DEPTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { HAULER_CAB, HAULER_TRAILER } from '../../scenes/preload/vehicles';
import { playSfx } from '../../systems/audio/Sfx';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../types';
import { bullseye, horn } from './audio';
import type { ChaseWorld } from './chaseWorld';
import { chance } from '../../systems/Pacing';

const H = CHASE.hauler;
type HaulerState = 'enter' | 'cruise' | 'crash' | 'gone';

/**
 * The runaway rig everything else is escorting: it roars past on the far lane,
 * cuts in ahead of the Rustbucket and dumps barrels (and Hornets) out of its
 * trailer hatch. Only something thrown hurts it: each hit is a BULLSEYE.
 */
export class Hauler implements Damageable {
  readonly countsAsEnemy = false;
  readonly stopsThrows = true;
  readonly cab: Phaser.GameObjects.Sprite;
  readonly trailer: Phaser.GameObjects.Sprite;
  /** Back of the trailer (world x). */
  rearX: number;
  bullseyes = 0;
  /** Opens to let Hornets and barrels out. */
  hatchOpen = false;
  /** A thrown thing hit it (the count so far). */
  onBullseye: ((count: number) => void) | null = null;
  private state: HaulerState = 'enter';
  private t = 0;
  private laneY: number;
  private readonly startRear: number;
  private flashLeft = 0;
  private swerve = 0;
  private crashT = 0;

  constructor(scene: Phaser.Scene, private readonly w: ChaseWorld) {
    const view = scene.cameras.main.worldView;
    this.startRear = view.x - HAULER_TRAILER.w - HAULER_CAB.w - 40;
    this.rearX = this.startRear;
    // It overtakes on the far lane (a little higher up the road, behind the RV), then cuts in.
    this.laneY = -9;
    this.trailer = scene.add.sprite(0, 0, TEX.haulerTrailer, 0).setOrigin(0, 1).setDepth(DEPTH.terrain + 3);
    this.cab = scene.add.sprite(0, 0, TEX.haulerCab, 0).setOrigin(0, 75 / HAULER_CAB.h).setDepth(DEPTH.terrain + 3);
    playSfx(horn, 1, 0.8);
    this.render();
  }

  get gone(): boolean {
    return this.state === 'gone';
  }

  get cruising(): boolean {
    return this.state === 'cruise';
  }

  /** Where barrels and Hornets come out. */
  get hatch(): { x: number; y: number } {
    return { x: this.rearX + HAULER_TRAILER.w / 2, y: this.roadY - HAULER_TRAILER.h + 2 };
  }

  private get roadY(): number {
    return this.w.rv.roadY;
  }

  private get cruiseRear(): number {
    return this.w.rv.frontX + H.gap;
  }

  update(dtMs: number): void {
    if (this.state === 'gone') return;
    const dt = dtMs / 1000;
    this.t += dtMs;
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.swerve *= Math.exp(-4 * dt);
    if (this.state === 'enter') {
      const k = Math.min(1, this.t / H.enterMs);
      const e = Phaser.Math.Easing.Sine.InOut(k);
      this.rearX = this.startRear + (this.cruiseRear - this.startRear) * e;
      // Merges into the RV's lane over the last third.
      this.laneY = -9 * (1 - Phaser.Math.Clamp((k - 0.66) / 0.34, 0, 1));
      if (k >= 1) this.state = 'cruise';
    } else if (this.state === 'cruise') {
      this.rearX = this.cruiseRear + Math.sin(this.t * 0.0016) * 6;
    } else if (this.state === 'crash') {
      this.updateCrash(dtMs, dt);
    }
    this.render();
  }

  /** Loses control: fishtails, sparks, then veers off the road ahead. */
  crash(): void {
    if (this.state === 'crash' || this.state === 'gone') return;
    this.state = 'crash';
    this.crashT = 0;
    this.hatchOpen = false;
    playSfx(horn, 1, 0.7);
    playSfx('alarm', 0.6);
  }

  private updateCrash(dtMs: number, dt: number): void {
    this.crashT += dtMs;
    const k = this.crashT / H.crashMs;
    this.rearX += (90 + 520 * k * k) * dt;
    this.swerve = Math.sin(this.crashT * 0.018) * (4 + 14 * k);
    if (chance(0.7)) this.w.fx.burst('spark', this.rearX + 20 + Math.random() * 200, this.roadY - 2, 2);
    if (chance(0.4)) this.w.fx.trail('smoke', this.rearX + 100, this.roadY - 50);
    if (this.crashT >= H.crashMs) {
      this.state = 'gone';
      this.cab.setVisible(false);
      this.trailer.setVisible(false);
    }
  }

  // ------------------------------------------------------------ Damageable

  get alive(): boolean {
    return this.state === 'cruise';
  }

  hurtbox(out: Rect): boolean {
    if (this.state !== 'cruise') return false;
    out.x = this.rearX - 4;
    out.y = this.roadY - HAULER_TRAILER.h;
    out.w = 70;
    out.h = HAULER_TRAILER.h - 12;
    return true;
  }

  /** Fireballs and fists bounce off the steel; only a throw counts. */
  accepts(kind: HitKind): boolean {
    return kind === 'smash';
  }

  takeHit(hit: Hit): HitResult {
    // Melee doesn't ask `accepts` first (blocked hits give feedback), so only a smash counts as a bullseye.
    if (this.state !== 'cruise' || !this.accepts(hit.kind)) return 'none';
    this.bullseyes++;
    this.flashLeft = 120;
    this.swerve = 10;
    const { fx } = this.w;
    fx.burst('spark', hit.x, hit.y, 18);
    fx.ring(hit.x, hit.y, PALETTE.gold, 40, 360);
    fx.popText(hit.x, hit.y - 20, 'BULLSEYE!', PALETTE.gold, 1.4);
    playSfx(bullseye);
    this.onBullseye?.(this.bullseyes);
    return 'hit';
  }

  // ------------------------------------------------------------ Look

  private render(): void {
    const roadY = this.roadY + Math.round(this.laneY);
    const bob = Math.round(Math.sin(this.t * 0.02) * 0.8);
    const tilt = Phaser.Math.DegToRad(this.swerve * 0.25);
    this.trailer.setPosition(Math.round(this.rearX), roadY + bob).setFrame(this.hatchOpen ? 1 : 0).setRotation(tilt);
    this.cab.setPosition(Math.round(this.rearX + HAULER_TRAILER.w - 8), roadY + bob).setFrame(Math.floor(this.t / 160) % 2).setRotation(-tilt * 0.6);
    if (this.flashLeft > 0) {
      // A warm glow on the hit, not a full-screen-sized white flash.
      this.trailer.setTintMode(Phaser.TintModes.ADD).setTint(0x6a4a20);
    } else {
      this.trailer.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    }
    const { lighting } = this.w;
    lighting.add(this.rearX + 3, roadY - 18, 26, PALETTE.enemy, 0.9);
    lighting.add(this.rearX + HAULER_TRAILER.w + 74, roadY - 26, 30, PALETTE.enemy, 0.9);
    if (this.hatchOpen) lighting.add(this.hatch.x, this.hatch.y, 60, PALETTE.enemy, 1);
  }

  destroy(): void {
    this.cab.destroy();
    this.trailer.destroy();
  }
}
