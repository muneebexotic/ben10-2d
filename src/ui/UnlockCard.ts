import Phaser from 'phaser';
import { allAliens, getAlien, hasAlien } from '../aliens/registry';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { a11y, shakeCamera } from '../systems/Accessibility';
import { TEX } from '../scenes/preload/assetKeys';
import { pixelText } from './text';

const CY = 150;
const R = 44;
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * The new-DNA moment: the Omnitrix's dial blows up to fill the screen, spins
 * through silhouettes while "NEW DNA DETECTED" glitches above it, then lands
 * on the new alien: its name, what it is, and the two things it's for.
 */
export class UnlockCard {
  private readonly root: Phaser.GameObjects.Container;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly heading: Phaser.GameObjects.BitmapText;
  private readonly name: Phaser.GameObjects.BitmapText;
  private readonly tagline: Phaser.GameObjects.BitmapText;
  private readonly traits: Phaser.GameObjects.BitmapText[];
  private stage: 'off' | 'scan' | 'reveal' = 'off';
  private t = 0;
  private alienId = '';
  private flick = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.glow = scene.add.image(0, CY, TEX.light).setScale(4).setBlendMode(Phaser.BlendModes.ADD).setTint(PALETTE.omnitrix).setAlpha(0.4);
    this.ring = scene.add.graphics();
    this.sprite = scene.add.sprite(0, CY + 6, TEX.iconBen).setScale(3);
    this.heading = pixelText(scene, 0, CY - R - 22, '', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    this.name = pixelText(scene, 0, CY + R + 20, '', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.white });
    this.tagline = pixelText(scene, 0, CY + R + 40, '', { originX: 0.5, originY: 0.5, color: PALETTE.cream });
    this.traits = [0, 1].map((i) => pixelText(scene, 0, CY + R + 56 + i * 12, '', { originX: 0.5, originY: 0.5, color: PALETTE.gold }));
    this.root = scene.add.container(GAME_WIDTH / 2, 0, [this.glow, this.ring, this.sprite, this.heading, this.name, this.tagline, ...this.traits]).setDepth(480).setVisible(false);
  }

  show(alienId: string, stage: 'scan' | 'reveal' | 'hide'): void {
    if (!hasAlien(alienId)) return;
    if (stage === 'hide') {
      if (this.stage === 'off') return;
      this.stage = 'off';
      this.scene.tweens.add({ targets: this.root, alpha: 0, scale: 0.8, duration: 260, onComplete: () => this.root.setVisible(false) });
      return;
    }
    this.alienId = alienId;
    this.t = 0;
    if (stage === 'scan') {
      this.stage = 'scan';
      this.root.setVisible(true).setAlpha(0).setScale(2.2);
      this.scene.tweens.add({ targets: this.root, alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' });
      this.name.setText('');
      this.tagline.setText('');
      for (const t of this.traits) t.setText('');
      this.sprite.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.omnitrixDeep).setScale(3);
      return;
    }
    // Reveal: the silhouette fills with colour and everything stamps in.
    this.stage = 'reveal';
    const a = getAlien(alienId);
    this.heading.setText('NEW ALIEN UNLOCKED!').setTint(PALETTE.gold).setScale(1.6);
    this.scene.tweens.add({ targets: this.heading, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.fit(a.texture, a.frame.h);
    this.sprite.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.white);
    this.scene.time.delayedCall(a11y.reduceFlashing ? 260 : 120, () => this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
    this.glow.setTint(a.theme.color).setAlpha(0.7);
    this.scene.tweens.add({ targets: this.glow, alpha: 0.35, duration: 700 });
    this.name.setText(`${a.name}!`).setTint(a.theme.color).setScale(2.4);
    this.scene.tweens.add({ targets: this.name, scale: 1, duration: 240, ease: 'Back.easeOut' });
    this.tagline.setText(a.unlock?.tagline ?? '').setAlpha(0);
    this.scene.tweens.add({ targets: this.tagline, alpha: 1, delay: 200, duration: 200 });
    a.unlock?.traits.forEach((trait, i) => {
      this.traits[i].setText(`> ${trait}`).setAlpha(0).setX(-20);
      this.scene.tweens.add({ targets: this.traits[i], alpha: 1, x: 0, delay: 380 + i * 160, duration: 220, ease: 'Quad.easeOut' });
    });
    shakeCamera(this.scene.cameras.main, 260, 0.012, false);
  }

  /** Shows an alien's first frame as big as fits inside the ring. */
  private fit(texture: string, frameH: number): void {
    this.sprite.setTexture(texture, 0).setOrigin(0.5, 0.5).setY(CY + 2).setScale(Math.min(3, Math.floor(((R - 4) * 2 / frameH) * 2) / 2));
  }

  update(dtMs: number): void {
    if (this.stage === 'off') return;
    this.t += dtMs;
    const g = this.ring;
    g.clear();
    const color = this.stage === 'reveal' && hasAlien(this.alienId) ? getAlien(this.alienId).theme.color : PALETTE.omnitrix;
    // The dial: a thick ring with rotating segments, like the watch face scaled up.
    g.lineStyle(8, PALETTE.ink, 0.92).strokeCircle(0, CY, R);
    const spin = this.stage === 'scan' ? this.t * 0.012 : this.t * 0.0015;
    for (let i = 0; i < 8; i++) {
      const a0 = spin + (i / 8) * Math.PI * 2;
      g.lineStyle(4, i % 2 ? color : PALETTE.white, 0.9).beginPath();
      g.arc(0, CY, R, a0, a0 + 0.42, false);
      g.strokePath();
    }
    g.lineStyle(1, color, 0.6).strokeCircle(0, CY, R + 8);
    g.fillStyle(PALETTE.ink, 0.75).fillCircle(0, CY, R - 5);
    // Hourglass emblem behind the alien.
    g.fillStyle(color, 0.18);
    g.fillTriangle(-R + 12, CY - R + 14, R - 12, CY - R + 14, 0, CY);
    g.fillTriangle(-R + 12, CY + R - 14, R - 12, CY + R - 14, 0, CY);

    if (this.stage !== 'scan') return;
    // Cycle through every silhouette while the heading scrambles.
    this.flick -= dtMs;
    if (this.flick <= 0) {
      this.flick = 70 + Math.min(110, this.t * 0.05);
      const pool = allAliens();
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.fit(pick.texture, pick.frame.h);
      const target = 'NEW DNA DETECTED';
      const settled = Math.floor(this.t / 70);
      this.heading.setText(
        target
          .split('')
          .map((ch, i) => (ch === ' ' || i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(''),
      ).setTint(PALETTE.omnitrix);
    }
  }
}
