import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { PLUMBER_SYSTEMS } from '../../../../config/chapter7';
import { playSfx } from '../../../../systems/audio/Sfx';
import { EventBus } from '../../../../systems/EventBus';
import { PLUMBER_ART } from '../../../preload/cartoon/plumber/baseArt';
import type { StoryKit } from '../../story/StoryKit';
import type { Tanks } from './Tanks';
import { doorClunk, doorHiss } from './sfx';

interface Door {
  id: string;
  x: number;
  y: number;
  h: number;
  img: Phaser.GameObjects.Image;
  lamp: Phaser.GameObjects.Image | null;
  /** 0 shut, 1 fully open (it slides up into the ceiling). */
  k: number;
  open: boolean;
  /** Its cells are solid right now. */
  solid: boolean;
  pressure: { left: string; right: string } | null;
}

/**
 * The base's doors (Chapter 7): hatches the story opens and shuts, and
 * pressure doors that open on their own only while the water either side is
 * level (a lamp over each shows red or green). A shut door is solid; it slides
 * up into the ceiling to open.
 */
export class Doors {
  private readonly doors: Door[] = [];
  private readonly byId = new Map<string, Door>();

  constructor(
    private readonly kit: StoryKit,
    private readonly tanks: Tanks,
  ) {
    const scene = kit.scene;
    for (const e of kit.level.entities) {
      if (e.type !== 'hatch' && e.type !== 'pressureDoor') continue;
      const pressure = e.type === 'pressureDoor' ? { left: e.left, right: e.right } : null;
      const frame = pressure ? (e.h >= 15 ? 'pdoor15' : 'pdoor10') : 'hatch10';
      // Under the terrain: opening, it slides up behind the hull over it.
      const img = scene.add.image(e.x * TILE + TILE / 2, e.y * TILE, PLUMBER_ART.machines, frame).setOrigin(0.5, 0).setDepth(DEPTH.terrain - 1);
      const lamp = pressure ? scene.add.image(e.x * TILE + TILE / 2, e.y * TILE - 6, PLUMBER_ART.machines, 'lampRed').setDepth(DEPTH.decor) : null;
      const startOpen = e.type === 'hatch' && e.open === true;
      const door: Door = { id: e.id, x: e.x, y: e.y, h: e.h, img, lamp, k: startOpen ? 1 : 0, open: startOpen, solid: false, pressure };
      this.doors.push(door);
      this.byId.set(door.id, door);
      if (!startOpen) this.setSolid(door, true);
      else img.setY(e.y * TILE - e.h * TILE);
    }
    this.tanks.rebuildOpen();
  }

  isOpen(id: string): boolean {
    return this.byId.get(id)?.open ?? false;
  }

  /** The story opens or shuts a hatch (`snap`: at once, no animation). */
  set(id: string, open: boolean, snap = false): void {
    const d = this.byId.get(id);
    if (!d || d.open === open) return;
    d.open = open;
    if (!open) this.setSolid(d, true);
    if (snap) {
      d.k = open ? 1 : 0;
      if (open) this.setSolid(d, false);
      this.place(d);
    } else {
      playSfx(doorHiss, 0.8);
    }
  }

  private setSolid(d: Door, solid: boolean): void {
    if (d.solid === solid) return;
    d.solid = solid;
    const rect = { x: d.x, y: d.y, w: 1, h: d.h };
    if (solid) this.kit.world.fillCells(rect, false);
    else this.kit.world.clearCells(rect);
    this.kit.world.hideHdCells(rect);
    this.tanks.rebuildOpen();
  }

  private place(d: Door): void {
    d.img.setY(d.y * TILE - d.k * d.h * TILE);
  }

  /** Pressure doors match their water at once (a resumed run): no animation, no banner. */
  settle(): void {
    for (const d of this.doors) {
      if (!d.pressure) continue;
      const level = this.tanks.isLevel(d.pressure.left, d.pressure.right);
      d.lamp?.setFrame(level ? 'lampGreen' : 'lampRed');
      d.open = level;
      d.k = level ? 1 : 0;
      this.setSolid(d, !level);
      this.place(d);
    }
  }

  update(dtMs: number): void {
    for (const d of this.doors) {
      if (d.pressure) {
        const level = this.tanks.isLevel(d.pressure.left, d.pressure.right);
        d.lamp?.setFrame(level ? 'lampGreen' : 'lampRed');
        if (level !== d.open) {
          d.open = level;
          if (!level) this.setSolid(d, true);
          else {
            playSfx(doorHiss, 1);
            EventBus.emit('hud:banner', { title: 'PRESSURE LEVEL', subtitle: 'DOOR OPEN', color: 0x5dff9a, durationMs: 1200, style: 'soft' });
          }
        }
      }
      const target = d.open ? 1 : 0;
      if (d.k === target) continue;
      const step = dtMs / PLUMBER_SYSTEMS.doorMs;
      d.k = d.open ? Math.min(1, d.k + step) : Math.max(0, d.k - step);
      this.place(d);
      if (d.k === 1 && d.open) {
        this.setSolid(d, false);
        playSfx(doorClunk, 0.7);
      } else if (d.k === 0 && !d.open) {
        playSfx(doorClunk, 1);
        this.kit.fx.shake(0.003, 120);
      }
    }
  }

  destroy(): void {
    for (const d of this.doors) {
      d.img.destroy();
      d.lamp?.destroy();
    }
  }
}
