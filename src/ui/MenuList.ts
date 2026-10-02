import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { playSfx } from '../systems/audio/Sfx';
import { pixelText } from './text';

export interface MenuItem {
  label: string | (() => string);
  action: () => void;
  /** Left/right (or the on-screen arrows) change the value instead of activating. */
  adjust?: (dir: 1 | -1) => void;
  /** One-line explanation shown by menus that have a hint line. */
  hint?: string;
  /** Accent colour for a row that should stand out (shown dimmer when not selected). */
  color?: number;
}

export interface MenuOptions {
  spacing?: number;
  scale?: number;
  /** Width of each row's tap target and where adjust arrows sit. */
  rowWidth?: number;
  onSelect?: (index: number, item: MenuItem) => void;
}

/** Keyboard, mouse and touch vertical menu with an Omnitrix-green selector. */
export class MenuList {
  private readonly texts: Phaser.GameObjects.BitmapText[] = [];
  private readonly arrows: Array<[Phaser.GameObjects.BitmapText, Phaser.GameObjects.BitmapText] | null> = [];
  private readonly cursor: Phaser.GameObjects.BitmapText;
  private readonly onSelect?: (index: number, item: MenuItem) => void;
  private index = 0;
  enabled = true;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly items: MenuItem[],
    spacingOrOptions: number | MenuOptions = 18,
    scaleArg = 1,
  ) {
    const opts: MenuOptions = typeof spacingOrOptions === 'number' ? { spacing: spacingOrOptions, scale: scaleArg } : spacingOrOptions;
    const spacing = opts.spacing ?? 18;
    const scale = opts.scale ?? 1;
    const rowWidth = opts.rowWidth ?? 220 * scale;
    this.onSelect = opts.onSelect;

    items.forEach((item, i) => {
      const rowY = y + i * spacing;
      const t = pixelText(scene, x, rowY, this.label(item), { originX: 0.5, originY: 0.5, scale, color: PALETTE.uiDim });
      this.texts.push(t);
      // Generous invisible tap targets: pixel text alone is far too small for a thumb.
      const zone = scene.add.zone(x, rowY, rowWidth, Math.max(spacing, 16)).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.select(i));
      zone.on('pointerdown', () => {
        this.select(i);
        this.activate();
      });
      if (item.adjust) {
        const ax = rowWidth / 2 - 6 * scale;
        const left = pixelText(scene, x - ax, rowY, '<', { originX: 0.5, originY: 0.5, scale, color: PALETTE.omnitrix });
        const right = pixelText(scene, x + ax, rowY, '>', { originX: 0.5, originY: 0.5, scale, color: PALETTE.omnitrix });
        for (const [arrow, dir] of [[left, -1], [right, 1]] as const) {
          const hit = scene.add.zone(arrow.x, rowY, 30 * scale, Math.max(spacing, 22)).setInteractive({ useHandCursor: true });
          hit.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
            e.stopPropagation();
            this.select(i);
            this.adjust(dir);
          });
        }
        this.arrows.push([left, right]);
      } else {
        this.arrows.push(null);
      }
    });
    this.cursor = pixelText(scene, 0, 0, '>', { originX: 1, originY: 0.5, scale, color: PALETTE.omnitrix });
    const kb = scene.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-LEFT', () => this.adjust(-1));
    kb.on('keydown-A', () => this.adjust(-1));
    kb.on('keydown-RIGHT', () => this.adjust(1));
    kb.on('keydown-D', () => this.adjust(1));
    kb.on('keydown-ENTER', () => this.activate());
    kb.on('keydown-SPACE', () => this.activate());
    kb.on('keydown-J', () => this.activate());
    this.refresh();
    this.onSelect?.(this.index, this.items[this.index]);
  }

  get selectedIndex(): number {
    return this.index;
  }

  rowText(i: number): Phaser.GameObjects.BitmapText {
    return this.texts[i];
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
    this.onSelect?.(i, this.items[i]);
  }

  private adjust(dir: 1 | -1): void {
    const item = this.items[this.index];
    if (!this.enabled || !item.adjust) return;
    playSfx('uiMove', 1, dir > 0 ? 1.15 : 0.85);
    item.adjust(dir);
    this.refresh();
  }

  private activate(): void {
    if (!this.enabled) return;
    playSfx('uiSelect');
    this.items[this.index].action();
    if (this.scene.sys.isActive()) this.refresh();
  }

  refresh(): void {
    this.texts.forEach((t, i) => {
      t.setText(this.label(this.items[i]));
      const accent = this.items[i].color;
      t.setTint(i === this.index ? (accent ?? PALETTE.white) : (accent !== undefined ? accent : PALETTE.uiDim)).setAlpha(accent !== undefined && i !== this.index ? 0.7 : 1);
      const arrows = this.arrows[i];
      if (arrows) for (const a of arrows) a.setAlpha(i === this.index ? 1 : 0.35);
    });
    const sel = this.texts[this.index];
    this.cursor.setPosition(sel.x - sel.width / 2 - 6, sel.y);
  }

  update(now: number): void {
    this.cursor.setAlpha(0.6 + Math.sin(now * 0.01) * 0.4);
  }
}
