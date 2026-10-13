import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { blinkOn } from '../../systems/Accessibility';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import type { Player } from '../Player';

interface Platform {
  id: number;
  image: Phaser.Physics.Arcade.Image;
  left: number;
  right: number;
  top: number;
  bornAt: number;
  lifeMs: number;
  warnMs: number;
}

const THICKNESS = 10;

/**
 * Diamondhead's crystal platforms: one-way ledges grown at runtime. Ben
 * stands on them (and drops through with Down+Jump); enemies and shots don't
 * notice them. Each one flickers before it shatters, and nothing standing on
 * one counts as safe ground for a pit respawn.
 */
export class CrystalPlatforms {
  private readonly list: Platform[] = [];
  private nextId = 1;
  private now = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly player: Player,
    private readonly isSolid: (x: number, y: number) => boolean,
  ) {}

  /** A ledge `width` wide with its top at `topY`, centred on `x`. Null when terrain is in the way. */
  grow(x: number, topY: number, width: number, lifeMs: number, warnMs: number): number | null {
    const left = Math.round(x - width / 2);
    const top = Math.round(topY);
    for (const px of [left + 2, x, left + width - 2]) {
      if (this.isSolid(px, top + 2) || this.isSolid(px, top + THICKNESS - 2)) return null;
    }
    const image = this.scene.physics.add.staticImage(left + width / 2, top + THICKNESS / 2, TEX.crystalPlatform).setDepth(DEPTH.props + 2);
    image.setDisplaySize(width, THICKNESS).refreshBody();
    const body = image.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    const player = this.player;
    this.scene.physics.add.collider(player.zone, image, undefined, () => player.now >= player.dropThroughUntil && player.vy >= 0 && player.y <= top + 6);
    image.setScale(image.scaleX * 0.2, image.scaleY);
    this.scene.tweens.add({ targets: image, scaleX: image.scaleX * 5, duration: 120, ease: 'Back.easeOut' });
    const p: Platform = { id: this.nextId++, image, left, right: left + width, top, bornAt: this.now, lifeMs, warnMs };
    this.list.push(p);
    return p.id;
  }

  /** Shatters one now (the oldest goes when a third grows). */
  shatter(id: number): void {
    const i = this.list.findIndex((p) => p.id === id);
    if (i < 0) return;
    const p = this.list[i];
    this.list.splice(i, 1);
    const cx = (p.left + p.right) / 2;
    this.fx.burst('crystal', cx, p.top + 4, 14);
    this.fx.burst('debris', cx, p.top + 4, 4);
    playSfx('glass', 0.5, 1.4);
    p.image.destroy();
  }

  /** Standing on one at (x, feetY): never a safe spot to respawn. */
  under(x: number, feetY: number): boolean {
    return this.list.some((p) => x >= p.left - 6 && x <= p.right + 6 && Math.abs(feetY - p.top) <= 3);
  }

  update(now: number): void {
    this.now = now;
    for (const p of [...this.list]) {
      const age = now - p.bornAt;
      if (age >= p.lifeMs) {
        this.shatter(p.id);
        continue;
      }
      const warn = age >= p.lifeMs - p.warnMs;
      p.image.setAlpha(warn && blinkOn(now, 90) ? 0.45 : 1);
      if (warn) p.image.setTint(PALETTE.diamondheadGlow);
    }
  }

  clear(): void {
    for (const p of this.list) p.image.destroy();
    this.list.length = 0;
  }
}
