import Phaser from 'phaser';
import { ACHIEVEMENT_TOAST_MS, type AchievementDef } from '../config/achievements';
import { PALETTE } from '../config/palette';
import { playSfx } from '../systems/audio/Sfx';
import { achievementBadge } from './achievementBadge';
import { drawPanel } from './menu/widgets';
import { pixelText } from './text';

const W = 190;
const H = 34;

/**
 * ACHIEVEMENT UNLOCKED: a small panel that slides in from the left edge, under
 * the HUD's dial, holds, and slides back out. Several in a row queue up.
 */
export class AchievementToast {
  private readonly queue: AchievementDef[] = [];
  private busy = false;
  private left = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly y = 92,
    private readonly depth = 400,
  ) {}

  /** Frame x of the screen's left edge (wide screens). */
  setLeft(left: number): void {
    this.left = left;
  }

  show(def: AchievementDef): void {
    this.queue.push(def);
    if (!this.busy) this.next();
  }

  private next(): void {
    const def = this.queue.shift();
    if (!def) {
      this.busy = false;
      return;
    }
    this.busy = true;
    const scene = this.scene;
    const g = scene.add.graphics();
    drawPanel(g, W / 2, 0, W, H, { fill: PALETTE.uiPanel, fillAlpha: 0.94, stroke: PALETTE.gold, radius: 5, bevel: true });
    const badge = achievementBadge(scene, 19, 0, def.icon, true, 12);
    const head = pixelText(scene, 38, -8, 'ACHIEVEMENT UNLOCKED', { originY: 0.5, color: PALETTE.gold });
    const title = pixelText(scene, 38, 6, def.title, { originY: 0.5, color: PALETTE.white });
    const shine = scene.add.rectangle(0, 0, 10, H - 4, PALETTE.white, 0.35).setAngle(18);
    const root = scene.add.container(this.left - W - 8, this.y, [g, badge, head, title, shine]).setDepth(this.depth);
    playSfx('secret', 0.6, 1.25);
    scene.tweens.add({ targets: root, x: this.left + 8, duration: 320, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: badge, scale: { from: 1.6, to: 1 }, angle: { from: -30, to: 0 }, duration: 420, delay: 180, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: shine, x: W, alpha: 0, duration: 650, delay: 380, ease: 'Quad.easeIn' });
    scene.time.delayedCall(ACHIEVEMENT_TOAST_MS, () => {
      scene.tweens.add({
        targets: root,
        x: this.left - W - 8,
        duration: 260,
        ease: 'Quad.easeIn',
        onComplete: () => {
          root.destroy();
          this.next();
        },
      });
    });
  }
}
