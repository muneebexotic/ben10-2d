import type Phaser from 'phaser';

type Cullable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible & Phaser.GameObjects.Components.GetBounds;

interface Item {
  obj: Cullable;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** How far outside the view scenery stays drawn (covers screen shake and anything hanging past its bounds). */
const MARGIN = 48;

/**
 * Hides static scenery that is off screen. Phaser draws every visible object
 * every frame, on screen or not, and most of a chapter's set dressing is off
 * screen at any moment (Chapter 1: about 130 of 170 decor images). Only for
 * objects that never move and that nothing else shows or hides: their
 * visibility belongs to the culler.
 */
export class StaticCuller {
  private readonly items: Item[] = [];

  add<T extends Cullable>(obj: T): T {
    const b = obj.getBounds();
    this.items.push({ obj, left: b.x, right: b.right, top: b.y, bottom: b.bottom });
    return obj;
  }

  update(view: Phaser.Geom.Rectangle): void {
    const left = view.x - MARGIN;
    const right = view.right + MARGIN;
    const top = view.y - MARGIN;
    const bottom = view.bottom + MARGIN;
    for (const it of this.items) {
      const on = it.right > left && it.left < right && it.bottom > top && it.top < bottom;
      if (it.obj.visible !== on) it.obj.setVisible(on);
    }
  }
}
