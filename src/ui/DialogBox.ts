import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { STORY } from '../config/story';
import { playSfx } from '../systems/audio/Sfx';
import { inputMode } from '../systems/InputMode';
import { pixelText } from './text';

const W = 520;
const H = 46;
/** Sits under the top letterbox bar so the ground (and Ben's reply bubble) stays visible. */
const Y = 34 + 14 + H / 2;

/** Cinematic dialogue: a name tag, typewriter text with voice blips, and a skip hint in the letterbox. */
export class DialogBox {
  private readonly root: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly name: Phaser.GameObjects.BitmapText;
  private readonly body: Phaser.GameObjects.BitmapText;
  private readonly skip: Phaser.GameObjects.BitmapText;
  private full = '';
  private shown = 0;
  private voicePitch = 1;

  constructor(private readonly scene: Phaser.Scene) {
    this.bg = scene.add.graphics();
    this.name = pixelText(scene, -W / 2 + 10, -H / 2 - 4, '', { scale: 2, originY: 0.5, color: PALETTE.enemy });
    this.body = pixelText(scene, -W / 2 + 12, -H / 2 + 12, '', { color: PALETTE.cream, maxWidth: W - 24 });
    this.root = scene.add.container(GAME_WIDTH / 2, Y, [this.bg, this.name, this.body]).setDepth(950).setVisible(false);
    this.skip = pixelText(scene, GAME_WIDTH - 12, GAME_HEIGHT - 17, '', { originX: 1, originY: 0.5, color: PALETTE.uiDim }).setDepth(950);
  }

  show(speaker: string, text: string, color: number, voicePitch = 1, skip = false): void {
    this.full = text;
    this.shown = 0;
    this.voicePitch = voicePitch;
    this.name.setText(speaker).setTint(color);
    this.body.setText('');
    const g = this.bg;
    g.clear();
    g.fillStyle(PALETTE.ink, 0.88);
    g.fillRect(-W / 2, -H / 2, W, H);
    g.lineStyle(1, color, 0.9);
    g.strokeRect(-W / 2 + 0.5, -H / 2 + 0.5, W - 1, H - 1);
    g.fillStyle(color, 1);
    g.fillRect(-W / 2, -H / 2, 4, H);
    const tagW = this.name.width + 16;
    g.fillStyle(PALETTE.ink, 1);
    g.fillRect(-W / 2 + 4, -H / 2 - 12, tagW, 14);
    g.lineStyle(1, color, 0.9);
    g.strokeRect(-W / 2 + 4.5, -H / 2 - 11.5, tagW - 1, 13);
    if (!this.root.visible) {
      this.root.setVisible(true).setAlpha(0).setY(Y - 10);
      this.scene.tweens.add({ targets: this.root, alpha: 1, y: Y, duration: 220, ease: 'Cubic.easeOut' });
    }
    this.skip.setText(skip ? inputMode.format('{SKIP}') : '').setVisible(skip);
  }

  clear(): void {
    this.full = '';
    this.root.setVisible(false);
    this.skip.setVisible(false);
  }

  update(dtMs: number, now: number): void {
    if (!this.root.visible) return;
    if (this.shown < this.full.length) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(this.full.length, this.shown + (dtMs / 1000) * STORY.dialog.charsPerSecond);
      const after = Math.floor(this.shown);
      this.body.setText(this.full.slice(0, after));
      for (let i = before; i < after; i++) {
        if (i % STORY.dialog.blipEvery === 0 && this.full[i] !== ' ') playSfx('voice', 1, this.voicePitch * (0.92 + Math.random() * 0.16));
      }
    }
    this.skip.setAlpha(0.55 + Math.sin(now * 0.005) * 0.25);
  }
}
