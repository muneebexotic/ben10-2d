import Phaser from 'phaser';
import { TOUCH } from '../config/touch';
import { PALETTE } from '../config/palette';
import { pixelText } from './text';

export interface RadialItem {
  icon: string;
  color: number;
  name: string;
}

/**
 * Which slot a finger at (dx, dy) from the picker's centre points at, or
 * null inside the dead zone. Slots sit on an arc from `fromDeg` to `toDeg`
 * (screen angles: 0 right, 90 down, 180 left). Pure, so it is unit tested.
 */
export function radialSlot(dx: number, dy: number, count: number, fromDeg: number, toDeg: number, deadZone: number): number | null {
  if (count <= 0 || Math.hypot(dx, dy) < deadZone) return null;
  let a = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (a < 0) a += 360;
  if (count === 1) return 0;
  const step = (toDeg - fromDeg) / (count - 1);
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < count; i++) {
    const slot = fromDeg + step * i;
    let diff = Math.abs(a - slot);
    if (diff > 180) diff = 360 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

/**
 * Long-press the touch Omnitrix: the dial fans out into a ring of alien
 * faces around the button. Slide onto one and let go to pick it.
 */
export class RadialPicker {
  private readonly root: Phaser.GameObjects.Container;
  private readonly backdrop: Phaser.GameObjects.Graphics;
  private slots: Array<{ ring: Phaser.GameObjects.Arc; icon: Phaser.GameObjects.Image; x: number; y: number }> = [];
  private readonly label: Phaser.GameObjects.BitmapText;
  private items: RadialItem[] = [];
  private hover: number | null = null;
  private cx = 0;
  private cy = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.backdrop = scene.add.graphics();
    this.label = pixelText(scene, 0, 0, '', { originX: 0.5, originY: 0.5, color: PALETTE.white });
    this.root = scene.add.container(0, 0, [this.backdrop, this.label]).setDepth(50).setVisible(false);
  }

  get open(): boolean {
    return this.root.visible;
  }

  show(cx: number, cy: number, items: RadialItem[], selected: number): void {
    const R = TOUCH.radial;
    this.cx = cx;
    this.cy = cy;
    this.items = items;
    for (const s of this.slots) {
      s.ring.destroy();
      s.icon.destroy();
    }
    this.slots = [];
    this.backdrop.clear();
    this.backdrop.fillStyle(PALETTE.ink, 0.55).fillCircle(cx, cy, R.radius + 26);
    this.backdrop.lineStyle(1, PALETTE.omnitrix, 0.5).strokeCircle(cx, cy, R.radius + 26);
    const n = items.length;
    const step = n > 1 ? (R.toDeg - R.fromDeg) / (n - 1) : 0;
    items.forEach((item, i) => {
      const a = ((R.fromDeg + step * i) * Math.PI) / 180;
      const x = cx + Math.cos(a) * R.radius;
      const y = cy + Math.sin(a) * R.radius;
      const ring = this.scene.add.circle(x, y, R.slotR, PALETTE.ink, 0.85).setStrokeStyle(2, item.color, 0.8);
      const icon = this.scene.add.image(x, y, item.icon).setTint(item.color).setScale(1.5);
      this.root.add([ring, icon]);
      this.slots.push({ ring, icon, x, y });
    });
    this.root.setVisible(true).setAlpha(0).setScale(1);
    this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 120 });
    this.setHover(selected, false);
  }

  /** The finger moved: highlight the slot it points at. */
  point(px: number, py: number): void {
    const R = TOUCH.radial;
    const slot = radialSlot(px - this.cx, py - this.cy, this.items.length, R.fromDeg, R.toDeg, R.deadZone);
    this.setHover(slot, true);
  }

  private setHover(slot: number | null, fromFinger: boolean): void {
    if (slot === this.hover && fromFinger) return;
    this.hover = fromFinger ? slot : null;
    this.slots.forEach((s, i) => {
      const on = i === slot;
      s.ring.setScale(on ? 1.25 : 1).setFillStyle(on ? this.items[i].color : PALETTE.ink, on ? 0.35 : 0.85);
      s.icon.setScale(on ? 2 : 1.5);
    });
    const item = slot !== null ? this.items[slot] : null;
    this.label.setText(item ? item.name : '').setTint(item?.color ?? PALETTE.white);
    this.label.setPosition(this.cx - TOUCH.radial.radius * 0.6, this.cy - TOUCH.radial.radius - 26);
  }

  /** Closes the picker. Returns the slot the finger was on, or null (let go in the middle: cancel). */
  close(): number | null {
    const picked = this.hover;
    this.hover = null;
    this.root.setVisible(false);
    return picked;
  }
}
