import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { playSfx } from '../systems/audio/Sfx';
import { pixelText } from './text';

export interface MenuItem {
  label: string | (() => string);
  action: () => void;
}

/** Keyboard + mouse vertical menu with an Omnitrix-green selector. */
export class MenuList {
  private readonly texts: Phaser.GameObjects.BitmapText[] = [];
  private readonly cursor: Phaser.GameObjects.BitmapText;
  private index = 0;
  enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly items: MenuItem[],
    spacing = 18,
    scale = 1,
  ) {
    items.forEach((item, i) => {
      const t = pixelText(scene, x, y + i * spacing, this.label(item), { originX: 0.5, originY: 0.5, scale, color: PALETTE.uiDim });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.select(i));
      t.on('pointerdown', () => this.activate());
      this.texts.push(t);
    });
    this.cursor = pixelText(scene, 0, 0, '>', { originX: 1, originY: 0.5, scale, color: PALETTE.omnitrix });
    const kb = scene.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-ENTER', () => this.activate());
    kb.on('keydown-SPACE', () => this.activate());
    kb.on('keydown-J', () => this.activate());
    this.refresh();
  }

  private label(item: MenuItem): string {
    return typeof item.label === 'function' ? item.label() : item.label;
  }

  private move(dir: number): void {
    if (!this.enabled) return;
    this.select((this.index + dir + this.items.length) % this.items.length);
  }

  private select(i: number): void {
    if (!this.enabled || i === this.index) return;
    this.index = i;
    playSfx('uiMove');
    this.refresh();
  }

  private activate(): void {
    if (!this.enabled) return;
    playSfx('uiSelect');
    this.items[this.index].action();
    this.refresh();
  }

  refresh(): void {
    this.texts.forEach((t, i) => {
      t.setText(this.label(this.items[i]));
      t.setTint(i === this.index ? PALETTE.white : PALETTE.uiDim);
    });
    const sel = this.texts[this.index];
    this.cursor.setPosition(sel.x - sel.width / 2 - 6, sel.y);
  }

  update(now: number): void {
    this.cursor.setAlpha(0.6 + Math.sin(now * 0.01) * 0.4);
  }
}
