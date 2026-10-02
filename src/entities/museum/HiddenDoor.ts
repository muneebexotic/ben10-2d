import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { FRAME } from '../../levels/tiles';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import type { Rect } from '../types';

/**
 * A secret passage that looks exactly like the stone around it. A form that
 * senses (Wildmutt) coming within range makes its outline glow; a moment
 * later it grinds open for good.
 */
export class HiddenDoor {
  readonly body: Phaser.Physics.Arcade.Image;
  readonly rect: Rect;
  private readonly face: Phaser.GameObjects.TileSprite;
  private readonly outline: Phaser.GameObjects.Graphics;
  private sensedMs = 0;
  open = false;
  onOpened: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    tx: number,
    ty: number,
    tw: number,
    th: number,
    private readonly fx: Fx,
    textureKey: string = TEX.tilesMuseum,
  ) {
    this.rect = { x: tx * TILE, y: ty * TILE, w: tw * TILE, h: th * TILE };
    const cx = this.rect.x + this.rect.w / 2;
    const cy = this.rect.y + this.rect.h / 2;
    this.face = scene.add.tileSprite(this.rect.x, this.rect.y, this.rect.w, this.rect.h, textureKey, FRAME.ROCK).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
    this.body = scene.physics.add.staticImage(cx, cy, TEX.whitePx).setVisible(false);
    this.body.setDisplaySize(this.rect.w, this.rect.h).refreshBody();
    this.outline = scene.add.graphics().setDepth(DEPTH.emissive);
  }

  /** `senseRadius` around (x, y): how close the senses reach. Returns true the frame it opens. */
  update(dtMs: number, x: number, y: number, senseRadius: number): boolean {
    this.outline.clear();
    if (this.open) return false;
    const r = this.rect;
    const nx = Math.max(r.x, Math.min(x, r.x + r.w));
    const ny = Math.max(r.y, Math.min(y, r.y + r.h));
    const inRange = senseRadius > 0 && Math.hypot(x - nx, y - ny) <= senseRadius;
    this.sensedMs = inRange ? this.sensedMs + dtMs : Math.max(0, this.sensedMs - dtMs);
    if (this.sensedMs <= 0) return false;
    // The outline traces itself in, warm and pulsing: his senses found something.
    const k = Math.min(1, this.sensedMs / 500);
    this.outline.lineStyle(2, 0xffb070, 0.4 + 0.5 * k * (0.7 + Math.sin(this.sensedMs * 0.02) * 0.3));
    this.outline.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    if (Math.random() < 0.2) this.fx.burst('sense', r.x + Math.random() * r.w, r.y + Math.random() * r.h, 1);
    if (this.sensedMs < 700) return false;
    this.openNow();
    return true;
  }

  openNow(): void {
    if (this.open) return;
    this.open = true;
    this.outline.clear();
    this.body.disableBody(true, true);
    const r = this.rect;
    this.fx.burst('dust', r.x + r.w / 2, r.y + r.h, 14);
    this.fx.burst('sense', r.x + r.w / 2, r.y + r.h / 2, 16);
    this.fx.popText(r.x + r.w / 2, r.y - 6, 'HIDDEN PATH!', PALETTE.gold);
    this.fx.shake(0.004, 300);
    playSfx('secret');
    this.face.scene.tweens.add({ targets: this.face, y: r.y - r.h, alpha: 0, duration: 650, ease: 'Quad.easeIn', onComplete: () => this.face.setVisible(false) });
    this.onOpened?.();
  }
}
