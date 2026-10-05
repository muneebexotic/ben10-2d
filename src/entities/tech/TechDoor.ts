import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TECH } from '../../config/tech';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Controls } from '../../systems/InputMap';
import { playSfx } from '../../systems/audio/Sfx';
import type { Rect } from '../types';
import type { Machine, TechDeps } from './Machine';

const D = TECH.door;

/**
 * A security shutter with a dead keypad. Nothing breaks it: Upgrade pours into
 * the keypad, circuits climb the slats, and it rolls up for good.
 */
export class TechDoor implements Machine {
  readonly kind = 'door';
  readonly rect: Rect;
  readonly body: Phaser.Physics.Arcade.Image;
  private readonly face: Phaser.GameObjects.TileSprite;
  private readonly bar: Phaser.GameObjects.TileSprite;
  private readonly pads: Phaser.GameObjects.Image[] = [];
  private readonly circuits: Phaser.GameObjects.Graphics;
  private state: 'shut' | 'powering' | 'open' = 'shut';
  private t = 0;
  private side: 1 | -1 = 1;
  holding = false;
  anchorX = 0;
  anchorY = 0;

  constructor(
    private readonly d: TechDeps,
    readonly id: string,
    tx: number,
    ty: number,
    tw: number,
    th: number,
  ) {
    const scene = d.scene;
    this.rect = { x: tx * TILE, y: ty * TILE, w: tw * TILE, h: th * TILE };
    const r = this.rect;
    this.face = scene.add.tileSprite(r.x, r.y, r.w, r.h - 5, TEX.shutter).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
    this.bar = scene.add.tileSprite(r.x, r.y + r.h - 5, r.w, 5, TEX.shutterBar).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
    for (const dir of [-1, 1] as const) {
      const x = dir < 0 ? r.x - 6 : r.x + r.w + 6;
      this.pads.push(scene.add.image(x, r.y + r.h - 22, TEX.keypad, 0).setDepth(DEPTH.terrain + 2));
    }
    this.circuits = scene.add.graphics().setDepth(DEPTH.terrain + 2).setBlendMode(Phaser.BlendModes.ADD);
    this.body = scene.physics.add.staticImage(r.x + r.w / 2, r.y + r.h / 2, TEX.whitePx).setVisible(false);
    this.body.setDisplaySize(r.w, r.h).refreshBody();
    d.addSolid(this.rect);
  }

  get open(): boolean {
    return this.state === 'open';
  }

  mergeBox(out: Rect): boolean {
    if (this.state !== 'shut') return false;
    const r = this.rect;
    out.x = r.x - 12;
    out.y = r.y;
    out.w = r.w + 24;
    out.h = r.h;
    return true;
  }

  enter(facing: 1 | -1): void {
    this.state = 'powering';
    this.t = 0;
    this.holding = true;
    // He pours into the keypad on the side he came from.
    this.side = facing > 0 ? -1 : 1;
    const r = this.rect;
    this.anchorX = this.side < 0 ? r.x - 10 : r.x + r.w + 10;
    this.anchorY = r.y + r.h;
    this.pads[this.side < 0 ? 0 : 1].setFrame(1);
    playSfx('powerUp', 0.8);
  }

  /** Forced open by someone else (Kevin shorting the keypad on his way out). `label` null: already open (a restart past it). */
  openNow(label: string | null, color: number): void {
    if (this.state !== 'shut') return;
    this.state = 'open';
    for (const p of this.pads) p.setFrame(1);
    if (label !== null) {
      this.roll(label, color);
      return;
    }
    this.body.disableBody(true, true);
    this.d.removeSolid(this.rect);
    this.face.setVisible(false);
    this.bar.setVisible(false);
  }

  control(_c: Controls, _dtMs: number): void {
    // Nothing to steer: the door opens on its own once powered.
  }

  release(): void {
    this.holding = false;
  }

  update(dtMs: number): void {
    const r = this.rect;
    if (this.state === 'shut') {
      this.d.lighting.add(this.pads[0].x, this.pads[0].y - 4, 16, PALETTE.enemy, 0.6);
      this.d.lighting.add(this.pads[1].x, this.pads[1].y - 4, 16, PALETTE.enemy, 0.6);
      return;
    }
    if (this.state !== 'powering') return;
    this.t += dtMs;
    // Circuits climb the slats from the keypad.
    const k = Math.min(1, this.t / D.powerMs);
    const g = this.circuits;
    g.clear();
    g.lineStyle(1, PALETTE.upgrade, 0.9);
    const top = r.y + r.h - r.h * k;
    for (let x = r.x + 3; x < r.x + r.w; x += 5) g.lineBetween(x, r.y + r.h - 4, x, Math.max(top, r.y + 2));
    for (let y = r.y + r.h - 6; y > top; y -= 8) g.lineBetween(r.x + 2, y, r.x + r.w - 2, y);
    this.d.lighting.add(r.x + r.w / 2, top, 40, PALETTE.upgrade, 0.8);
    if (this.t >= D.powerMs && this.body.body?.enable) this.roll();
    if (this.t >= D.releaseMs) {
      this.state = 'open';
      this.holding = false;
      g.clear();
    }
  }

  /** Rolls up into the ceiling for good. */
  private roll(label = 'ACCESS GRANTED', color: number = PALETTE.upgrade): void {
    const r = this.rect;
    this.body.disableBody(true, true);
    this.d.removeSolid(this.rect);
    this.d.fx.burst('circuit', r.x + r.w / 2, r.y + r.h - 6, 14);
    this.d.fx.burst('dust', r.x + r.w / 2, r.y + r.h, 8);
    this.d.fx.popText(r.x + r.w / 2, r.y - 6, label, color);
    playSfx('shutter');
    this.d.scene.tweens.add({ targets: [this.face, this.bar], y: `-=${r.h}`, scaleY: 0.2, alpha: 0, duration: D.openMs, ease: 'Quad.easeIn' });
  }

  destroy(): void {
    this.face.destroy();
    this.bar.destroy();
    for (const p of this.pads) p.destroy();
    this.circuits.destroy();
  }
}
