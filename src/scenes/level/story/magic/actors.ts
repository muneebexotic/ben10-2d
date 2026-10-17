import Phaser from 'phaser';
import { DEPTH } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import { playSfx } from '../../../../systems/audio/Sfx';
import { TEX } from '../../../preload/assetKeys';
import { MAX_FRAME, MAX_FRAMES } from '../../../preload/family';
import { CH6_TEX } from '../../../preload/karachi/keys';
import { HEX_FRAME, CHARMCASTER_FRAME } from '../../../preload/karachi/cast';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import { FamilyActor } from '../../family/FamilyActor';
import type { StoryKit } from '../StoryKit';

/** Grandpa Max in the field (the gate, the tunnel, the tower top). */
export function createMax(kit: StoryKit): FamilyActor {
  const look = { texture: TEX.max, prefix: 'max', frameWidth: MAX_FRAME.w, frameHeight: MAX_FRAME.h, feetY: MAX_FRAME.feetY, frames: MAX_FRAMES, handHeight: 18 };
  return new FamilyActor(kit.scene, look, DEPTH.player - 2);
}

/**
 * Hex or Charmcaster in a set piece: a sprite that appears and vanishes in a
 * burst of violet (or magenta) light, floats, casts and points. The boss
 * fight has its own bodies; these are for the story.
 */
export class MagicActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  private floatT = 0;
  floating = false;

  constructor(
    private readonly kit: StoryKit,
    readonly who: 'hex' | 'charmcaster',
  ) {
    const texture = who === 'hex' ? CH6_TEX.hex : CH6_TEX.charmcaster;
    const frame = who === 'hex' ? HEX_FRAME : CHARMCASTER_FRAME;
    this.sprite = kit.scene.add.sprite(0, 0, texture, 0).setOrigin(0.5, (frame.feetY + 1) / frame.h).setDepth(DEPTH.boss).setVisible(false);
  }

  get color(): number {
    return this.who === 'hex' ? PALETTE.hex : PALETTE.charmcaster;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  /** Pops in at (x, feetY) in a burst of light. */
  appear(x: number, feetY: number, face: 1 | -1 = -1): void {
    this.sprite.setPosition(x, feetY).setVisible(true).setFlipX(face < 0).setAlpha(1);
    this.idle();
    this.kit.fx.burst('mana', x, feetY - 18, 16);
    this.kit.fx.flash(x, feetY - 18, this.color, 30, 260);
    playSfx(MAGIC_SFX.poof, 0.8, this.who === 'hex' ? 0.8 : 1.2);
  }

  vanish(): void {
    if (!this.sprite.visible) return;
    this.kit.fx.burst('mana', this.sprite.x, this.sprite.y - 18, 16);
    this.kit.fx.ring(this.sprite.x, this.sprite.y - 18, this.color, 30, 280);
    playSfx(MAGIC_SFX.poof, 0.8, 0.9);
    this.sprite.setVisible(false);
    this.floating = false;
  }

  idle(): void {
    this.sprite.play(`${this.who}-idle`, true);
  }

  /** A held pose: cast, point, throw, summon, hurt (frame indices from the sheets). */
  pose(frame: number): void {
    this.sprite.stop().setFrame(frame);
  }

  face(dir: 1 | -1): void {
    this.sprite.setFlipX(dir < 0);
  }

  update(dtMs: number): void {
    if (!this.sprite.visible) return;
    this.floatT += dtMs;
    if (this.floating) this.sprite.y += Math.sin(this.floatT * 0.004) * 0.15;
    this.kit.lighting.add(this.sprite.x, this.sprite.y - 20, 40, this.color, 0.7);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
