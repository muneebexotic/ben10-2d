import Phaser from 'phaser';
import { TOUCH } from '../config/touch';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import type { OmnitrixTick } from '../systems/events';
import { getAlien, hasAlien } from '../aliens/registry';
import { pixelText } from './text';
import { arcSteps, BakedGraphics } from './BakedGraphics';

/** A round, semi-transparent thumb button with an icon and a small caption. */
export class TouchButton {
  readonly root: Phaser.GameObjects.Container;
  private readonly ring: BakedGraphics;
  private readonly icon: Phaser.GameObjects.Image;
  private pressed = false;

  constructor(
    scene: Phaser.Scene,
    public x: number,
    public y: number,
    readonly r: number,
    icon: string,
    caption: string,
    private readonly color: number,
  ) {
    this.ring = BakedGraphics.round(scene, r);
    this.icon = scene.add.image(0, 0, icon).setScale(r >= 28 ? 2 : 1.5).setTint(color);
    const label = pixelText(scene, 0, r + 6, caption, { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.root = scene.add.container(x, y, [this.ring.image, this.icon, label]);
    this.draw();
  }

  /** Repositions the button (the view was resized). */
  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.root.setPosition(x, y);
  }

  setIcon(key: string): void {
    this.icon.setTexture(key);
  }

  setPressed(on: boolean): void {
    if (on === this.pressed) return;
    this.pressed = on;
    this.draw();
    this.root.setScale(on ? 0.92 : 1);
  }

  contains(px: number, py: number): number {
    const d = Math.hypot(px - this.x, py - this.y);
    return d <= this.r * TOUCH.hitPadding ? d / this.r : Infinity;
  }

  private draw(): void {
    this.ring.draw((g) => {
      g.fillStyle(PALETTE.ink, this.pressed ? 0.75 : 0.5);
      g.fillCircle(0, 0, this.r);
      g.lineStyle(2, this.pressed ? PALETTE.white : this.color, 1);
      g.strokeCircle(0, 0, this.r);
      if (this.pressed) {
        g.fillStyle(this.color, 0.35);
        g.fillCircle(0, 0, this.r - 2);
      }
    });
  }

  applyAlpha(): void {
    this.root.setAlpha(this.pressed ? TOUCH.pressedAlpha : TOUCH.idleAlpha);
  }
}

/** Floating thumb stick: rests at home, jumps to wherever the thumb lands on the left side. */
export class TouchStick {
  readonly root: Phaser.GameObjects.Container;
  private readonly base: Phaser.GameObjects.Image;
  private readonly knob: Phaser.GameObjects.Image;
  cx: number = TOUCH.stick.homeX;
  cy: number = TOUCH.stick.homeY;

  constructor(scene: Phaser.Scene) {
    const s = TOUCH.stick;
    this.base = BakedGraphics.round(scene, s.radius).draw((g) => {
      g.fillStyle(PALETTE.ink, 0.45).fillCircle(0, 0, s.radius);
      g.lineStyle(2, PALETTE.omnitrixDark, 1).strokeCircle(0, 0, s.radius);
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        g.fillStyle(PALETTE.omnitrixDark, 1).fillCircle(dx * (s.radius - 7), dy * (s.radius - 7), 2);
      }
    }).image;
    this.knob = BakedGraphics.round(scene, s.knobRadius).draw((g) => {
      g.fillStyle(PALETTE.omnitrix, 0.55).fillCircle(0, 0, s.knobRadius);
      g.lineStyle(2, PALETTE.omnitrixGlow, 0.9).strokeCircle(0, 0, s.knobRadius);
    }).image;
    this.root = scene.add.container(0, 0, [this.base, this.knob]);
    this.release();
  }

  grab(x: number, y: number, viewW: number, viewH: number): void {
    const r = TOUCH.stick.radius;
    this.cx = Phaser.Math.Clamp(x, r + 4, viewW - r - 4);
    this.cy = Phaser.Math.Clamp(y, r + 4, viewH - r - 4);
    this.base.setPosition(this.cx, this.cy);
    this.knob.setPosition(this.cx, this.cy);
  }

  /** Moves the knob toward the thumb; returns the offset clamped to the stick radius. */
  drag(x: number, y: number): { dx: number; dy: number } {
    const r = TOUCH.stick.radius;
    let dx = x - this.cx;
    let dy = y - this.cy;
    const len = Math.hypot(dx, dy);
    if (len > r) {
      dx = (dx / len) * r;
      dy = (dy / len) * r;
    }
    this.knob.setPosition(this.cx + dx, this.cy + dy);
    return { dx, dy };
  }

  release(): void {
    this.cx = TOUCH.stick.homeX;
    this.cy = TOUCH.stick.homeY;
    this.base.setPosition(this.cx, this.cy);
    this.knob.setPosition(this.cx, this.cy);
  }

  applyAlpha(active: boolean): void {
    this.root.setAlpha(active ? TOUCH.pressedAlpha : TOUCH.idleAlpha);
  }
}

/**
 * The transform button, styled like the Omnitrix: tap to transform, swipe
 * sideways to turn the dial. Its ring mirrors the watch (ready, timer, recharge).
 */
export class TouchDial {
  readonly root: Phaser.GameObjects.Container;
  private readonly ring: BakedGraphics;
  private ringKey = '';
  private readonly icon: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly chevrons: Phaser.GameObjects.BitmapText[];
  private readonly swapLabel: Phaser.GameObjects.BitmapText;
  private tick: OmnitrixTick | null = null;
  private pressed = false;
  private iconKey = '';

  constructor(
    scene: Phaser.Scene,
    public x: number,
    public y: number,
    readonly r: number,
  ) {
    this.glow = scene.add.image(0, 0, TEX.soft).setScale(5).setBlendMode(Phaser.BlendModes.ADD).setTint(PALETTE.omnitrix).setAlpha(0.25);
    const frame = scene.add.image(0, 0, TEX.dialFrame).setScale((r * 2) / 44);
    this.ring = BakedGraphics.round(scene, r - 4);
    this.icon = scene.add.image(0, 0, TEX.iconBen).setScale(1.5).setTint(PALETTE.omnitrix);
    this.chevrons = [
      pixelText(scene, -r - 7, 0, '<', { originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }),
      pixelText(scene, r + 7, 0, '>', { originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }),
    ];
    this.swapLabel = pixelText(scene, 0, r + 7, 'SWAP!', { originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }).setVisible(false);
    this.root = scene.add.container(x, y, [this.glow, frame, this.ring.image, this.icon, ...this.chevrons, this.swapLabel]);
  }

  contains(px: number, py: number): number {
    const d = Math.hypot(px - this.x, py - this.y);
    return d <= this.r * TOUCH.hitPadding ? d / this.r : Infinity;
  }

  setTick(t: OmnitrixTick): void {
    this.tick = t;
  }

  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.root.setPosition(x, y);
  }

  setPressed(on: boolean): void {
    this.pressed = on;
    this.root.setScale(on ? 0.9 : 1);
  }

  applyAlpha(): void {
    // The watch reads a touch stronger than the other buttons: it is the star of the show.
    this.root.setAlpha(this.pressed ? TOUCH.pressedAlpha : TOUCH.idleAlpha + 0.15);
  }

  /** Little nudge when the dial turns. */
  nudge(dir: 1 | -1): void {
    this.icon.setX(dir * 6);
    this.root.scene.tweens.add({ targets: this.icon, x: 0, duration: 160, ease: 'Back.easeOut' });
  }

  update(now: number): void {
    const t = this.tick;
    const R = this.r - 4;
    let color: number = PALETTE.omnitrix;
    let fraction = 1;
    if (t?.jammed) color = PALETTE.jammer;
    else if (t?.state === 'active') {
      fraction = t.timeRatio;
      color = t.warning ? PALETTE.enemy : PALETTE.omnitrix;
    } else if (t?.state === 'cooldown') {
      fraction = t.cooldownProgress;
      color = PALETTE.enemy;
    }
    // The arc only moves in whole pixels of its circumference: redraw when what it shows changes.
    const steps = arcSteps(R);
    const shown = Math.round(fraction * steps);
    const ringKey = `${color}|${shown}`;
    if (ringKey !== this.ringKey) {
      this.ringKey = ringKey;
      this.ring.draw((g) => {
        g.lineStyle(4, PALETTE.ink, 0.9).beginPath();
        g.arc(0, 0, R, 0, Math.PI * 2);
        g.strokePath();
        g.lineStyle(3, color, 1).beginPath();
        g.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (shown / steps), false);
        g.strokePath();
      });
    }
    const ready = !t || (t.state === 'ready' && !t.jammed);
    // The button shows the alien a tap would bring in: the dial's pick (also mid-transformation, for a swap).
    const shownId = t ? (t.state === 'active' && !t.canSwap ? t.activeId : t.selectedId) : null;
    const known = shownId !== null && hasAlien(shownId);
    const key = known ? getAlien(shownId).hudIcon : TEX.iconBen;
    if (key !== this.iconKey) {
      this.icon.setTexture(key);
      this.iconKey = key;
    }
    const alienColor = known ? getAlien(shownId).theme.color : PALETTE.omnitrix;
    this.icon.setTint(t?.state === 'active' ? alienColor : ready ? PALETTE.omnitrix : t?.jammed ? PALETTE.jammer : PALETTE.enemyDark);
    this.glow.setTint(t?.canSwap ? alienColor : color).setAlpha(ready || t?.canSwap ? 0.3 + Math.sin(now * 0.006) * 0.12 : 0.12);
    this.swapLabel.setVisible(t?.canSwap === true).setTint(t?.fixOwed ? PALETTE.gold : alienColor);
    this.swapLabel.setText(t?.fixOwed ? 'FIX!' : 'SWAP!');
    for (const c of this.chevrons) c.setAlpha(0.35 + (this.pressed ? 0.4 : 0));
  }
}
