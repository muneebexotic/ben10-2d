import Phaser from 'phaser';
import type { FormDefinition } from '../../aliens/types';
import { PALETTE } from '../../config/palette';
import { shakeCamera } from '../../systems/Accessibility';
import { playSfx } from '../../systems/audio/Sfx';
import { TEX } from '../preload/assetKeys';

/**
 * ACT COMPLETE's Omnitrix dial: every alien so far slams onto its ring one
 * by one, with a thud and a jolt, until the dial is full.
 */
export class AlienDial {
  private landed = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly radius: number,
    private readonly aliens: readonly FormDefinition[],
  ) {
    const ring = scene.add.graphics();
    ring.fillStyle(PALETTE.ink, 0.85).fillCircle(x, y, radius + 22);
    ring.lineStyle(3, PALETTE.omnitrixDark, 1).strokeCircle(x, y, radius + 22);
    ring.lineStyle(1, PALETTE.omnitrix, 0.5).strokeCircle(x, y, radius);
    const core = scene.add.image(x, y, TEX.hourglass).setTint(PALETTE.omnitrix).setScale(0.7).setAlpha(0.9);
    scene.tweens.add({ targets: core, scale: 0.78, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  get full(): boolean {
    return this.landed >= this.aliens.length;
  }

  /** The next alien slams onto its place on the ring. */
  slam(): void {
    if (this.full) return;
    const i = this.landed++;
    const a = this.aliens[i];
    const angle = -Math.PI / 2 + (i / this.aliens.length) * Math.PI * 2;
    const ax = this.x + Math.cos(angle) * this.radius;
    const ay = this.y + Math.sin(angle) * this.radius;
    const disc = this.scene.add.circle(ax, ay, 15, PALETTE.ink, 1).setStrokeStyle(2, a.theme.color);
    const icon = this.scene.add.image(ax, ay, a.hudIcon).setTint(a.theme.color).setScale(1.5);
    const c = this.scene.add.container(0, 0, [disc, icon]);
    // From big and above the screen, down onto the ring.
    for (const o of [disc, icon]) {
      const s = o.scale;
      o.setScale(s * 3).setAlpha(0);
      this.scene.tweens.add({ targets: o, scale: s, alpha: 1, duration: 170, ease: 'Quad.In' });
    }
    this.scene.time.delayedCall(170, () => {
      shakeCamera(this.scene.cameras.main, 90, 0.006, false);
      playSfx('stamp', 0.5, 0.9 + i * 0.05);
      const ring = this.scene.add.circle(ax, ay, 16).setStrokeStyle(2, a.theme.color, 0.9);
      this.scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
    });
    c.setDepth(2);
  }
}
