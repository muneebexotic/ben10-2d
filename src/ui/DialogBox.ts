import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { STORY } from '../config/story';
import { playSfx } from '../systems/audio/Sfx';
import { inputMode } from '../systems/InputMode';
import { boxed, pixelText } from './text';

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
  /** Touch, in a cinematic: SKIP >> as a button in the letterbox's corner (TOUCH.skipCorner is its tap target). */
  private readonly skipButton: Phaser.GameObjects.BitmapText;
  private readonly skipFrame: Phaser.GameObjects.Rectangle;
  private readonly portrait: Phaser.GameObjects.Image;
  private readonly portraitFrame: Phaser.GameObjects.Graphics;
  private full = '';
  private shown = 0;
  private voicePitch = 1;
  private right = GAME_WIDTH;
  private letterboxed = false;
  private skippable = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.bg = scene.add.graphics();
    this.name = pixelText(scene, -W / 2 + 10, -H / 2 - 4, '', { scale: 2, originY: 0.5, color: PALETTE.enemy });
    this.body = pixelText(scene, -W / 2 + 12, -H / 2 + 12, '', { color: PALETTE.cream, maxWidth: W - 24 });
    this.portraitFrame = scene.add.graphics();
    this.portrait = scene.add.image(-W / 2 + 30, -4, '__DEFAULT').setVisible(false);
    this.root = scene.add.container(GAME_WIDTH / 2, Y, [this.bg, this.portraitFrame, this.portrait, this.name, this.body]).setDepth(950).setVisible(false);
    this.skip = pixelText(scene, 0, 0, '', { originX: 1, originY: 0.5, color: PALETTE.uiDim }).setDepth(950);
    this.skipButton = pixelText(scene, 0, 0, 'SKIP >>', { originX: 1, originY: 0.5, color: PALETTE.white }).setDepth(950).setVisible(false);
    this.skipFrame = scene.add.rectangle(0, 0, this.skipButton.width + 12, 16, PALETTE.ink, 0.6).setStrokeStyle(1, PALETTE.omnitrix, 0.8).setOrigin(1, 0.5).setDepth(949).setVisible(false);
    this.placeSkip();
  }

  /** Keeps the skip hint in the bottom-right corner of the screen (wide screens). */
  setRight(right: number): void {
    this.right = right;
    this.placeSkip();
  }

  /** The skip hint sits in the bottom letterbox bar in a cinematic; during play it tucks under the box, clear of the touch controls. */
  setLetterbox(visible: boolean): void {
    this.letterboxed = visible;
    this.placeSkip();
  }

  /** The player switched between keys and touch: the skip hint follows. */
  refreshSkip(): void {
    this.placeSkip();
  }

  private placeSkip(): void {
    const shown = this.skippable && this.root.visible;
    // On touch the whole-scene skip is a button in the letterbox's corner (only there: TOUCH.skipCorner).
    const button = shown && this.letterboxed && inputMode.current === 'touch';
    this.skipButton.setPosition(this.right - 12, GAME_HEIGHT - 17).setVisible(button);
    this.skipFrame.setPosition(this.right - 6, GAME_HEIGHT - 17).setVisible(button);
    if (button) this.skip.setPosition(this.skipFrame.x - this.skipFrame.width - 10, GAME_HEIGHT - 17);
    else if (this.letterboxed) this.skip.setPosition(this.right - 12, GAME_HEIGHT - 17);
    else this.skip.setPosition(GAME_WIDTH / 2 + W / 2 - 2, Y + H / 2 + 8);
    this.skip.setText(this.skippable ? inputMode.format('{SKIP}') : '').setVisible(shown);
  }

  /** `portrait`: a texture key; the speaker's bust pops out of the box's left edge. */
  show(speaker: string, text: string, color: number, voicePitch = 1, skip = false, portrait?: string): void {
    this.full = text;
    this.shown = 0;
    this.voicePitch = voicePitch;
    const inset = portrait ? 58 : 0;
    this.name.setText(speaker).setTint(color).setX(-W / 2 + 10 + inset);
    this.body.setText('').setX(-W / 2 + 12 + inset).setMaxWidth(W - 24 - inset);
    boxed(this.body, -W / 2 + 10 + inset, -H / 2 + 1, W - 20 - inset, H - 2);
    const pf = this.portraitFrame;
    pf.clear();
    if (portrait) {
      const changed = !this.portrait.visible || this.portrait.texture.key !== portrait;
      this.portrait.setTexture(portrait).setVisible(true);
      pf.fillStyle(PALETTE.ink, 1).fillRect(-W / 2 + 4, -H / 2 - 9, 52, 52);
      pf.lineStyle(2, color, 1).strokeRect(-W / 2 + 4, -H / 2 - 9, 52, 52);
      if (changed) {
        // A little hop when a new speaker cuts in.
        this.portrait.setScale(1, 0.85).setY(0);
        this.scene.tweens.add({ targets: this.portrait, scaleY: 1, y: -4, duration: 160, ease: 'Back.easeOut' });
      }
    } else {
      this.portrait.setVisible(false);
    }
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
    g.fillRect(-W / 2 + 4 + inset, -H / 2 - 12, tagW, 14);
    g.lineStyle(1, color, 0.9);
    g.strokeRect(-W / 2 + 4.5 + inset, -H / 2 - 11.5, tagW - 1, 13);
    if (!this.root.visible) {
      this.root.setVisible(true).setAlpha(0).setY(Y - 10);
      this.scene.tweens.add({ targets: this.root, alpha: 1, y: Y, duration: 220, ease: 'Cubic.easeOut' });
    }
    this.skippable = skip;
    this.placeSkip();
  }

  /** Shows the whole line now (the player pressed to read on). */
  fill(): void {
    if (!this.root.visible || this.shown >= this.full.length) return;
    this.shown = this.full.length;
    this.body.setText(this.full);
  }

  clear(): void {
    this.skippable = false;
    this.full = '';
    this.portrait.setVisible(false);
    this.root.setVisible(false);
    this.skip.setVisible(false);
    this.skipButton.setVisible(false);
    this.skipFrame.setVisible(false);
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
