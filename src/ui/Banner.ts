import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import type { BannerPayload } from '../systems/events';
import { pixelText } from './text';
import { a11y, shakeCamera } from '../systems/Accessibility';

/** Big centre-screen moments: chapter titles, checkpoints, the alien name slam, the Omnitrix emblem flash. */
export class Banner {
  private current: Phaser.GameObjects.Container | null = null;
  private readonly symbol: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene) {
    this.symbol = scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.hourglass)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false)
      .setDepth(500);
  }

  show(p: BannerPayload): void {
    this.current?.destroy();
    const color = p.color ?? PALETTE.white;
    const style = p.style ?? 'soft';
    const y = style === 'boss' ? 110 : 96;
    const title = pixelText(this.scene, 0, 0, p.title, { scale: style === 'soft' ? 2 : 3, originX: 0.5, originY: 0.5, color });
    const items: Phaser.GameObjects.GameObject[] = [];
    const stripe = this.scene.add.rectangle(0, 0, GAME_WIDTH + 40, style === 'soft' ? 26 : 40, 0x000000, 0.55);
    items.push(stripe, title);
    if (p.subtitle) {
      const sub = pixelText(this.scene, 0, style === 'soft' ? 16 : 22, p.subtitle, { originX: 0.5, originY: 0.5, color: PALETTE.cream });
      items.push(sub);
      stripe.setSize(GAME_WIDTH + 40, style === 'soft' ? 44 : 56).setY(style === 'soft' ? 7 : 9);
    }
    const c = this.scene.add.container(GAME_WIDTH / 2, y, items).setDepth(400);
    this.current = c;
    const duration = p.durationMs ?? 1500;
    if (style === 'soft') {
      c.setAlpha(0);
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 300 });
    } else {
      c.setScale(2.4).setAlpha(0);
      this.scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      shakeCamera(this.scene.cameras.main, 180, 0.006, false);
    }
    this.scene.tweens.add({
      targets: c,
      alpha: 0,
      delay: duration,
      duration: 350,
      onComplete: () => {
        if (this.current === c) this.current = null;
        c.destroy();
      },
    });
  }

  /** "HEATBLAST!" slams in with speed streaks, then peels away. */
  alienName(name: string, color: number, first: boolean): void {
    this.current?.destroy();
    const streaks = this.scene.add.graphics();
    for (let i = 0; i < 12; i++) {
      streaks.fillStyle(i % 2 ? color : PALETTE.white, 0.5);
      const yy = -22 + Math.random() * 44;
      streaks.fillRect(-GAME_WIDTH / 2 + Math.random() * 60, yy, 120 + Math.random() * 300, 1);
    }
    const shadow = pixelText(this.scene, 3, 3, `${name}!`, { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(this.scene, 0, 0, `${name}!`, { scale: 4, originX: 0.5, originY: 0.5, color });
    const c = this.scene.add.container(GAME_WIDTH / 2, first ? 110 : 90, [streaks, shadow, title]).setDepth(450);
    this.current = c;
    c.setScale(3.2).setAngle(-8).setAlpha(0);
    this.scene.tweens.add({ targets: c, scale: 1, angle: -3, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: streaks, x: 80, duration: first ? 1400 : 900 });
    this.scene.tweens.add({
      targets: c,
      x: GAME_WIDTH / 2 + 30,
      alpha: 0,
      scaleY: 0.2,
      delay: first ? 1300 : 800,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (this.current === c) this.current = null;
        c.destroy();
      },
    });
  }

  omnitrixSymbol(color: number, big: boolean): void {
    const s = this.symbol;
    const soft = a11y.reduceFlashing;
    s.setVisible(true).setTint(color).setAlpha(soft ? 0.2 : big ? 0.75 : 0.45).setScale(big ? 1.5 : 1).setAngle(0);
    this.scene.tweens.add({
      targets: s,
      scale: soft ? 3 : big ? 7 : 4.5,
      alpha: 0,
      angle: 25,
      duration: big ? 700 : 420,
      ease: 'Cubic.easeIn',
      onComplete: () => s.setVisible(false),
    });
  }
}
