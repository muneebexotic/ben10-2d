import Phaser from 'phaser';
import { DEPTH } from '../../../config/constants';
import { COILS } from '../../../config/kevin';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import type { Controls } from '../../../systems/InputMap';
import type { Fx } from '../../../systems/Fx';
import type { Lighting } from '../../../systems/Lighting';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Machine } from '../../tech/Machine';
import type { Rect } from '../../types';

const H = 80;

/**
 * One of the substation hall's tesla coils. Kevin drains them in phase 2
 * (they light up, then arcs rake the floor). Upgrade can merge into one: it
 * charges with a rising hum and discharges straight into Kevin (OVERLOAD!),
 * then pops him back out. A spent coil needs a few seconds to recharge.
 */
export class Coil implements Machine {
  readonly kind = 'coil';
  readonly id: string;
  readonly anchorX: number;
  readonly anchorY: number;
  holding = false;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private state: 'ready' | 'charging' | 'cooldown' = 'ready';
  private t = 0;
  /** Kevin is draining it (lit, crackling). */
  draining = false;
  private spentUntil = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly lighting: Lighting,
    private readonly now: () => number,
    x: number,
    floorY: number,
    index: number,
    /** Upgrade fired it: the bolt leaves from (x, y). */
    private readonly onDischarge: (x: number, y: number) => void,
  ) {
    this.id = `kevin-coil-${index}`;
    this.anchorX = x;
    this.anchorY = floorY - 30;
    this.sprite = scene.add.sprite(x, floorY, TEX.teslaCoil, 0).setOrigin(0.5, 1).setDepth(DEPTH.decor + 1);
  }

  /** The torus on top, where bolts leave from. */
  get topX(): number {
    return this.anchorX;
  }

  get topY(): number {
    return this.sprite.y - H + 10;
  }

  get possessed(): boolean {
    return this.state === 'charging';
  }

  mergeBox(out: Rect): boolean {
    if (this.state !== 'ready' || this.now() < this.spentUntil) return false;
    out.x = this.anchorX - 14;
    out.y = this.sprite.y - 40;
    out.w = 28;
    out.h = 40;
    return true;
  }

  enter(): void {
    this.state = 'charging';
    this.holding = true;
    this.t = 0;
    playSfx('coilCharge', 1, 1.1);
  }

  control(_c: Controls, _dtMs: number): void {
    // Nothing to steer: the coil knows where Kevin is.
  }

  release(): void {
    this.holding = false;
    if (this.state === 'charging') this.state = 'ready';
  }

  update(dtMs: number): void {
    const lit = this.draining || this.state === 'charging';
    this.sprite.setFrame(lit ? 1 : 0);
    const spent = this.now() < this.spentUntil;
    this.sprite.setAlpha(spent ? 0.75 : 1);
    if (lit) {
      this.lighting.add(this.topX, this.topY, 50 + Math.random() * 20, this.state === 'charging' ? PALETTE.upgrade : PALETTE.kevin, 1);
      if (chance(0.5)) this.fx.burst(this.state === 'charging' ? 'circuit' : 'volt', this.topX + (Math.random() - 0.5) * 20, this.topY, 1);
    } else if (!spent) {
      this.lighting.add(this.topX, this.topY, 22, 0x9ab8ff, 0.4);
    }
    if (this.state !== 'charging') return;
    this.t += dtMs;
    // Upgrade's circuits climb the winding as it charges.
    const k = this.t / COILS.overload.chargeMs;
    this.lighting.add(this.anchorX, this.sprite.y - H * k, 30, PALETTE.upgrade, 0.9);
    if (this.t < COILS.overload.chargeMs) return;
    this.onDischarge(this.topX, this.topY);
    this.state = 'cooldown';
    this.spentUntil = this.now() + COILS.overload.cooldownMs;
    this.holding = false;
    this.state = 'ready';
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
