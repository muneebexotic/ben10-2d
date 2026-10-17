import Phaser from 'phaser';
import { PALETTE } from '../../config/palette';
import { CH5_TEX } from '../../scenes/preload/bounty/keys';
import { KRAAB_FRAME, KRAAB_FRAMES, SIXSIX_FRAME, SIXSIX_FRAMES, TETRAX_FRAME, TETRAX_FRAMES } from '../../scenes/preload/bounty/hunters';

export type HunterId = 'sixsix' | 'kraab' | 'tetrax';

const SHEETS = {
  sixsix: { texture: CH5_TEX.sixsix, frame: SIXSIX_FRAME, frames: SIXSIX_FRAMES as Record<string, readonly number[]> },
  kraab: { texture: CH5_TEX.kraab, frame: KRAAB_FRAME, frames: KRAAB_FRAMES as Record<string, readonly number[]> },
  tetrax: { texture: CH5_TEX.tetrax, frame: TETRAX_FRAME, frames: TETRAX_FRAMES as Record<string, readonly number[]> },
} as const;

/** Each hunter's signature colour (tells use it as the edge, lights and banners as the colour). */
export const HUNTER_COLOR: Record<HunterId, number> = { sixsix: PALETTE.sixsix, kraab: PALETTE.kraab, tetrax: PALETTE.tetrax };

/**
 * How a bounty hunter looks: one sprite, posed by name from its sheet
 * (`idle`, `fly`, `slash`...), positioned by its feet, facing left or right
 * (the art faces right). Story set pieces and the boss fight both drive it.
 */
export class HunterLook {
  readonly sprite: Phaser.GameObjects.Sprite;
  x = 0;
  feetY = 0;
  facing: 1 | -1 = 1;
  private flashLeft = 0;
  private current = '';

  constructor(
    scene: Phaser.Scene,
    readonly id: HunterId,
    depth: number,
  ) {
    const sheet = SHEETS[id];
    this.sprite = scene.add.sprite(0, 0, sheet.texture, 0).setOrigin(0.5, sheet.frame.feetY / sheet.frame.h).setDepth(depth);
    this.play('idle');
  }

  get height(): number {
    return SHEETS[this.id].frame.feetY;
  }

  /** Loops or plays an animation (`${id}-${name}`), or holds a single-frame pose. */
  play(name: string): void {
    if (this.current === name) return;
    this.current = name;
    const key = `${this.id}-${name}`;
    const frames = SHEETS[this.id].frames[name];
    if (frames && frames.length > 1 && this.sprite.scene.anims.exists(key)) {
      this.sprite.play(key, true);
    } else {
      this.sprite.stop();
      this.sprite.setFrame(frames?.[0] ?? 0);
    }
  }

  get pose(): string {
    return this.current;
  }

  place(x: number, feetY: number): void {
    this.x = x;
    this.feetY = feetY;
  }

  face(dir: number): void {
    if (dir !== 0) this.facing = dir > 0 ? 1 : -1;
  }

  /** A white flash when hit. */
  flash(ms = 80): void {
    this.flashLeft = Math.max(this.flashLeft, ms);
  }

  setVisible(on: boolean): void {
    this.sprite.setVisible(on);
  }

  get visible(): boolean {
    return this.sprite.visible;
  }

  /** Pushes position, facing and the hit flash to the sprite. `tint`: a colour multiplied over him (heat, fear). */
  render(dtMs: number, tint: number | null = null, shake = 0): void {
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    const s = this.sprite;
    s.setPosition(Math.round(this.x + (shake ? (Math.random() - 0.5) * shake : 0)), Math.round(this.feetY));
    s.setFlipX(this.facing < 0);
    if (this.flashLeft > 0) s.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
    else if (tint !== null) s.setTint(tint).setTintMode(Phaser.TintModes.MULTIPLY);
    else s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
