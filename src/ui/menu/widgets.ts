import Phaser from 'phaser';
import { GAME_WIDTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { playSfx } from '../../systems/audio/Sfx';
import { inputMode } from '../../systems/InputMode';
import { pixelText } from '../text';

export interface PanelStyle {
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  strokeAlpha?: number;
  radius?: number;
  /** A brighter inner edge along the top, like the watch bezel. */
  bevel?: boolean;
}

/** The framed panel every menu card and dialog uses. Centred on (cx, cy). */
export function drawPanel(g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number, style: PanelStyle = {}): void {
  const r = style.radius ?? 6;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  g.fillStyle(style.fill ?? PALETTE.ink, style.fillAlpha ?? 0.82).fillRoundedRect(x, y, w, h, r);
  g.lineStyle(1, style.stroke ?? PALETTE.omnitrixDark, style.strokeAlpha ?? 0.9).strokeRoundedRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
  if (style.bevel) {
    g.lineStyle(1, PALETTE.white, 0.08).beginPath();
    g.moveTo(x + r, y + 2.5);
    g.lineTo(x + w - r, y + 2.5);
    g.strokePath();
  }
}

/** Screen title and subtitle, the same on every menu. */
export function menuHeader(scene: Phaser.Scene, title: string, subtitle?: string, color: number = PALETTE.omnitrix): Phaser.GameObjects.BitmapText[] {
  const out = [pixelText(scene, GAME_WIDTH / 2, 24, title, { scale: 3, originX: 0.5, originY: 0.5, color })];
  if (subtitle) out.push(pixelText(scene, GAME_WIDTH / 2, 44, subtitle, { originX: 0.5, originY: 0.5, color: PALETTE.uiDim }));
  return out;
}

/**
 * A framed, tappable button. Menus move focus between buttons with the keys;
 * a tap focuses and presses in one go.
 */
export class MenuButton {
  readonly root: Phaser.GameObjects.Container;
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.BitmapText;
  private readonly zone: Phaser.GameObjects.Zone;
  private focused = false;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly w: number,
    text: string,
    private color: number,
    private readonly onPress: () => void,
    private readonly h = 22,
  ) {
    this.frame = scene.add.graphics();
    this.label = pixelText(scene, 0, 0, text, { originX: 0.5, originY: 0.5, color });
    // A thumb-sized target, larger than the frame.
    this.zone = scene.add.zone(0, 0, w + 8, Math.max(h + 10, 30)).setInteractive({ useHandCursor: true });
    this.zone.on('pointerdown', () => {
      if (!this.enabled) return;
      this.onFocus?.();
      this.press();
    });
    this.zone.on('pointerover', () => this.enabled && this.onFocus?.());
    this.root = scene.add.container(x, y, [this.frame, this.label, this.zone]);
    this.redraw();
  }

  /** Called when the pointer moves onto the button (so the menu moves its focus here). */
  onFocus: (() => void) | null = null;

  get isEnabled(): boolean {
    return this.enabled;
  }

  get visible(): boolean {
    return this.root.visible;
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setColor(color: number): this {
    this.color = color;
    this.redraw();
    return this;
  }

  setFocused(on: boolean): this {
    this.focused = on;
    this.redraw();
    return this;
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.zone.input!.enabled = on;
    this.redraw();
    return this;
  }

  setVisible(on: boolean): this {
    this.root.setVisible(on);
    this.zone.input!.enabled = on && this.enabled;
    return this;
  }

  press(): void {
    if (!this.enabled || !this.root.visible) {
      playSfx('denied');
      return;
    }
    this.root.setScale(0.94);
    this.root.scene.tweens.add({ targets: this.root, scale: 1, duration: 140, ease: 'Back.easeOut' });
    this.onPress();
  }

  pulse(time: number): void {
    if (this.focused && this.enabled) this.label.setAlpha(0.75 + Math.sin(time * 0.008) * 0.25);
    else this.label.setAlpha(1);
  }

  private redraw(): void {
    const g = this.frame;
    g.clear();
    const color = this.enabled ? this.color : PALETTE.uiDim;
    drawPanel(g, 0, 0, this.w, this.h, {
      fill: this.focused && this.enabled ? PALETTE.inkSoft : PALETTE.ink,
      fillAlpha: 0.85,
      stroke: color,
      strokeAlpha: this.focused ? 1 : 0.45,
      radius: 5,
    });
    if (this.focused && this.enabled) {
      g.fillStyle(color, 0.9).fillRect(-this.w / 2 + 8, this.h / 2 - 3, this.w - 16, 1);
    }
    this.label.setTint(this.enabled ? (this.focused ? PALETTE.white : color) : PALETTE.uiDim);
  }
}

/** "< BACK" in the top-left corner of every menu (Esc on a keyboard). */
export function backButton(scene: Phaser.Scene, onBack: () => void): Phaser.GameObjects.BitmapText {
  const label = () => (inputMode.current === 'touch' ? '< BACK' : '< BACK [ESC]');
  const t = pixelText(scene, 14, 14, label(), { originX: 0, originY: 0.5, color: PALETTE.uiDim, scale: 1 });
  const zone = scene.add.zone(4, 2, 110, 30).setOrigin(0, 0).setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => t.setTint(PALETTE.white));
  zone.on('pointerout', () => t.setTint(PALETTE.uiDim));
  zone.on('pointerdown', () => onBack());
  scene.input.keyboard?.on('keydown-ESC', () => onBack());
  scene.input.keyboard?.on('keydown-BACKSPACE', () => onBack());
  return t;
}

/** A small text button in the top-right corner (Settings on hub screens). */
export function cornerButton(scene: Phaser.Scene, label: string, onPress: () => void): Phaser.GameObjects.BitmapText {
  const t = pixelText(scene, GAME_WIDTH - 14, 14, label, { originX: 1, originY: 0.5, color: PALETTE.uiDim });
  const zone = scene.add.zone(GAME_WIDTH - 4, 2, Math.max(90, t.width + 20), 30).setOrigin(1, 0).setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => t.setTint(PALETTE.white));
  zone.on('pointerout', () => t.setTint(PALETTE.uiDim));
  zone.on('pointerdown', () => onPress());
  return t;
}

/** Formats play time as h:mm:ss (or m:ss under an hour). */
export function formatPlayTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
