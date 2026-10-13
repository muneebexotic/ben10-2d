import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { pixelText } from './text';

const Y = 138;
const LETTER_MS = 55;
const HOLD_MS = 1500;
const FADE_MS = 700;

/**
 * Something whispering at the edge of the screen (Ghostfreak): the words
 * creep in a letter at a time, tremble, and dissolve. One at a time; a new
 * whisper replaces the old.
 */
export class Whisper {
  private readonly text: Phaser.GameObjects.BitmapText;
  private full = '';
  private shown = 0;
  private age = 0;
  private left = 0;
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.text = pixelText(scene, 8, Y, '', { color: PALETTE.ghostfreak, depth: 420 }).setAlpha(0);
  }

  setLeft(left: number): void {
    this.left = left;
    this.text.setX(left + 8);
  }

  show(line: string, color: number): void {
    this.full = line;
    this.shown = 0;
    this.age = 0;
    this.active = true;
    this.text.setText('').setTint(color).setAlpha(0.9);
  }

  update(dtMs: number, now: number): void {
    if (!this.active) return;
    this.age += dtMs;
    const letters = Math.min(this.full.length, Math.floor(this.age / LETTER_MS));
    if (letters !== this.shown) {
      this.shown = letters;
      this.text.setText(this.full.slice(0, letters));
    }
    const typed = this.full.length * LETTER_MS;
    const fade = this.age - typed - HOLD_MS;
    // A faint tremble, a pixel at a time.
    this.text.setPosition(this.left + 8 + (Math.sin(now * 0.05) > 0.85 ? 1 : 0), Y + (Math.sin(now * 0.031) > 0.9 ? 1 : 0));
    if (fade <= 0) return;
    this.text.setAlpha(Math.max(0, 0.9 * (1 - fade / FADE_MS)));
    if (fade >= FADE_MS) {
      this.active = false;
      this.text.setAlpha(0);
    }
  }

  clear(): void {
    this.active = false;
    this.text.setAlpha(0);
  }
}
