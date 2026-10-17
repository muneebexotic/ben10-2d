import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { CH6_TEX } from '../../scenes/preload/karachi/keys';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { chance } from '../../systems/Pacing';

export type PickupKind = 'smoothy' | 'card';

/** What a health pickup looks like: a Mr. Smoothy cup, or (Karachi) a glass of chai or of fresh juice. */
export type DrinkLook = 'smoothy' | 'chai' | 'juice';

const DRINK: Record<DrinkLook, { texture: string; glow: number }> = {
  smoothy: { texture: TEX.smoothy, glow: 0xff8fc8 },
  chai: { texture: CH6_TEX.chai, glow: 0xffc070 },
  juice: { texture: CH6_TEX.juice, glow: 0xffa02a },
};

/** Mr. Smoothy cups (and Karachi's chai and juice) heal; Sumo Slammers cards are the chapter's secrets. */
export class Pickup {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly x: number;
  readonly baseY: number;
  collected = false;
  private readonly seed = Math.random() * 10;

  constructor(
    scene: Phaser.Scene,
    readonly kind: PickupKind,
    readonly id: string,
    tx: number,
    ty: number,
    readonly look: DrinkLook = 'smoothy',
  ) {
    this.x = tx * TILE + TILE / 2;
    this.baseY = ty * TILE - (kind === 'card' ? 14 : 12);
    const texture = kind === 'card' ? TEX.card : DRINK[look].texture;
    this.sprite = scene.add.sprite(this.x, this.baseY, texture, 0).setDepth(kind === 'card' ? DEPTH.emissive : DEPTH.pickups);
  }

  touches(px: number, py: number): boolean {
    return !this.collected && Math.abs(px - this.x) < 12 && py > this.baseY - 6 && py - 26 < this.baseY + 10;
  }

  update(fx: Fx, lighting: Lighting, now: number): void {
    if (this.collected) return;
    const t = now * 0.001 + this.seed;
    const y = this.baseY + Math.sin(t * 3) * 2;
    this.sprite.setY(Math.round(y));
    if (this.kind === 'card') {
      // Fake a 3D spin by squashing X and swapping to the card back at the edge.
      const spin = Math.cos(t * 2.4);
      this.sprite.setScale(Math.max(0.1, Math.abs(spin)), 1);
      this.sprite.setFrame(spin >= 0 ? 0 : 1);
      if (chance(0.06)) fx.trail('gold', this.x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 16);
      lighting.add(this.x, y, 46, PALETTE.gold, 0.7 + Math.sin(t * 5) * 0.2);
    } else {
      lighting.add(this.x, y, 36, DRINK[this.look].glow, 0.6);
    }
  }

  collect(fx: Fx): void {
    this.collected = true;
    this.sprite.setVisible(false);
    const color = this.kind === 'card' ? PALETTE.gold : DRINK[this.look].glow;
    fx.ring(this.x, this.baseY, color, 30, 400);
    fx.burst(this.kind === 'card' ? 'gold' : 'white', this.x, this.baseY, 16);
    fx.flash(this.x, this.baseY, color, 24, 300);
  }
}
