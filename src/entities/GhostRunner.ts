import Phaser from 'phaser';
import { getForm, hasAlien } from '../aliens/registry';
import { DEPTH } from '../config/constants';
import { GHOST } from '../config/ghost';
import { PALETTE } from '../config/palette';
import { GHOST_HIDDEN_FRAME, ghostAt, type LoadedGhost } from '../systems/Ghost';
import { pixelText } from '../ui/text';
import { TEX } from '../scenes/preload/assetKeys';

/**
 * Your best run, replayed as a see-through blue Ben (or whichever alien you
 * were) racing alongside you on the same run clock. It fades out where that
 * run ended.
 */
export class GhostRunner {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly tag: Phaser.GameObjects.BitmapText;
  private form = -1;
  private done = false;

  constructor(private readonly scene: Phaser.Scene, private readonly ghost: LoadedGhost) {
    const first = getForm(this.formId(ghost.samples[0].form));
    this.sprite = scene.add
      .sprite(ghost.samples[0].x, ghost.samples[0].y, first.texture, 0)
      .setDepth(DEPTH.player - 1)
      .setAlpha(GHOST.alpha)
      .setTintMode(Phaser.TintModes.FILL)
      .setTint(GHOST.tint);
    this.tag = pixelText(scene, 0, 0, 'BEST', { originX: 0.5, originY: 1, color: GHOST.tint }).setAlpha(GHOST.alpha).setDepth(DEPTH.player - 1);
  }

  private formId(index: number): string {
    const id = this.ghost.forms[index] ?? 'ben';
    return id === 'ben' || hasAlien(id) ? id : 'ben';
  }

  update(runTimeMs: number): void {
    if (this.done) return;
    const s = ghostAt(this.ghost.samples, this.ghost.intervalMs, runTimeMs);
    if (!s) {
      if (runTimeMs > 0) this.finish();
      return;
    }
    if (s.form !== this.form) {
      this.form = s.form;
      const form = getForm(this.formId(s.form));
      this.sprite.setTexture(form.texture, 0).setOrigin(0.5, form.frame.feetY / form.frame.h);
    }
    const hidden = s.frame === GHOST_HIDDEN_FRAME;
    this.sprite.setVisible(!hidden);
    this.tag.setVisible(!hidden);
    const frames = this.sprite.texture.frameTotal - 1;
    if (!hidden && s.frame < frames) this.sprite.setFrame(s.frame);
    this.sprite.setPosition(s.x, s.y).setFlipX(s.flip);
    this.tag.setPosition(s.x, s.y - this.sprite.displayHeight * this.sprite.originY - 2);
  }

  private finish(): void {
    this.done = true;
    this.scene.tweens.add({ targets: [this.sprite, this.tag], alpha: 0, duration: GHOST.fadeMs, onComplete: () => this.destroy() });
    const puff = this.scene.add.particles(this.sprite.x, this.sprite.y - 12, TEX.spark, { lifespan: 500, speed: { min: 20, max: 80 }, scale: { start: 1.5, end: 0 }, tint: PALETTE.white, emitting: false });
    puff.explode(12);
    this.scene.time.delayedCall(700, () => puff.destroy());
  }

  destroy(): void {
    this.sprite.destroy();
    this.tag.destroy();
  }
}
