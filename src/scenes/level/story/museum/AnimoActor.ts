import Phaser from 'phaser';
import { DEPTH } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import type { Fx } from '../../../../systems/Fx';
import type { Lighting } from '../../../../systems/Lighting';
import { playSfx } from '../../../../systems/audio/Sfx';
import { TEX } from '../../../preload/assetKeys';

/**
 * Dr. Animo in person during set pieces: he appears in a purple flare,
 * gestures while he talks, zaps exhibits to life with the Transmodulator,
 * and leaves dangling from a giant mutant bat.
 */
export class AnimoActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly beam: Phaser.GameObjects.Graphics;
  private bat: Phaser.GameObjects.Sprite | null = null;
  private glow = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly lighting: Lighting,
    x: number,
    feetY: number,
  ) {
    this.sprite = scene.add.sprite(x, feetY, TEX.animo, 0).setOrigin(0.5, 1).setDepth(DEPTH.enemies - 1).setFlipX(true).setVisible(false);
    this.beam = scene.add.graphics().setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD);
  }

  get x(): number {
    return this.sprite.x;
  }

  appear(): void {
    const s = this.sprite;
    s.setVisible(true).setAlpha(0).play('animo-idle');
    this.scene.tweens.add({ targets: s, alpha: 1, duration: 400 });
    this.fx.flash(s.x, s.y - 24, PALETTE.animo, 40, 400);
    this.fx.burst('mutagen', s.x, s.y - 20, 18);
    playSfx('mutateRay', 0.6);
  }

  face(dir: 1 | -1): void {
    this.sprite.setFlipX(dir < 0);
  }

  /** Arms up while he speechifies. */
  gesture(on: boolean): void {
    if (on) this.sprite.stop().setFrame(2);
    else this.sprite.play('animo-idle');
  }

  /** Points the Transmodulator at each target: purple bolts, flashes, then `onHit` for each. */
  zap(targets: ReadonlyArray<{ x: number; y: number }>, onHit: (t: { x: number; y: number }, i: number) => void): void {
    const s = this.sprite;
    s.stop().setFrame(3);
    playSfx('mutateRay');
    const gemX = s.x + (s.flipX ? -14 : 14);
    const gemY = s.y - 26;
    targets.forEach((t, i) => {
      this.scene.time.delayedCall(i * 120, () => {
        this.beam.lineStyle(2, PALETTE.animo, 0.9).lineBetween(gemX, gemY, t.x, t.y);
        this.beam.lineStyle(1, PALETTE.white, 0.9).lineBetween(gemX, gemY, t.x, t.y);
        this.fx.flash(t.x, t.y, PALETTE.animo, 20, 250);
        this.fx.burst('mutagen', t.x, t.y, 10);
        onHit(t, i);
        this.scene.time.delayedCall(140, () => this.beam.clear());
      });
    });
    this.glow = 600;
  }

  /** A giant bat swoops in, grabs him by the coat and carries him off toward `toX`. */
  exitByBat(toX: number, ms: number, onDone?: () => void): void {
    const s = this.sprite;
    const startX = s.x + (toX > s.x ? -260 : 260);
    const bat = this.scene.add.sprite(startX, s.y - 120, TEX.bat, 0).setScale(3).setDepth(DEPTH.enemies).play('bat-idle');
    bat.setFlipX(toX < s.x);
    this.bat = bat;
    playSfx('screech', 0.8, 0.8);
    this.scene.tweens.add({
      targets: bat,
      x: s.x,
      y: s.y - 52,
      duration: ms * 0.4,
      ease: 'Quad.easeOut',
      onComplete: () => {
        s.stop().setFrame(2);
        this.fx.burst('dust', s.x, s.y, 8);
        playSfx('gulp', 0.5, 1.6);
        this.scene.tweens.add({ targets: [bat], x: toX, y: s.y - 200, duration: ms * 0.6, ease: 'Quad.easeIn' });
        this.scene.tweens.add({
          targets: s,
          x: toX,
          y: s.y - 148,
          duration: ms * 0.6,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.hide();
            onDone?.();
          },
        });
      },
    });
  }

  /** Walks off toward `toX` and disappears. */
  walkOff(toX: number, ms: number, onDone?: () => void): void {
    const s = this.sprite;
    s.setFlipX(toX < s.x).play('animo-walk');
    this.scene.tweens.add({
      targets: s,
      x: toX,
      duration: ms,
      onComplete: () => {
        this.hide();
        onDone?.();
      },
    });
  }

  update(dtMs: number): void {
    if (!this.sprite.visible) return;
    this.glow = Math.max(0, this.glow - dtMs);
    const s = this.sprite;
    this.lighting.add(s.x, s.y - 40, 26 + (this.glow > 0 ? 40 : 0), PALETTE.animo, 0.9);
    this.lighting.add(s.x, s.y - 20, 50, 0xd8d0ff, 0.4);
    if (this.bat) this.lighting.add(this.bat.x, this.bat.y, 40, PALETTE.animo, 0.6);
  }

  hide(): void {
    this.sprite.setVisible(false);
    this.bat?.destroy();
    this.bat = null;
  }

  destroy(): void {
    this.beam.destroy();
    this.bat?.destroy();
    this.sprite.destroy();
  }
}
