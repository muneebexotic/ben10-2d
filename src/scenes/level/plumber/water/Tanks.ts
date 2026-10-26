import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { PLUMBER_WATER } from '../../../../config/chapter7';
import type { LevelData } from '../../../../levels/types';
import type { Fx } from '../../../../systems/Fx';
import { chance } from '../../../../systems/Pacing';
import type { SwimWater } from '../../../../systems/swim/SwimMotor';
import type { WaterProvider } from '../../Swimming';

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** One body of water (px): its walls, floor, and a surface that moves toward a target. */
export interface Tank {
  readonly id: string;
  readonly x0: number;
  readonly x1: number;
  readonly top: number;
  readonly bottom: number;
  level: number;
  target: number;
  /** px/s the surface moves at toward its target. */
  speed: number;
  readonly sea: boolean;
  /** Drawn this frame (on screen). */
  visible: boolean;
  /** The open (non-solid) parts of the tank, so water never draws over walls. */
  readonly open: Rect[];
}

interface Current extends Rect {
  id: string;
  vx: number;
  vy: number;
  intake: boolean;
  on: boolean;
  /** On and off in turns (a burst pipe that spurts): its cycle, and where in it it is. */
  pulse: { onMs: number; offMs: number } | null;
  pulseT: number;
}

/** Mixes two colours (t 0..1), allocation-free. */
function mixColor(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k;
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * k;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}

/**
 * Act 3's water (Chapter 7): the base's tanks (every form swims in them),
 * the currents in them, air pockets and bubble vents. Pumps, valves and the
 * story move the levels; this draws the water (a see-through body behind and
 * in front of whatever's in it, only over open space, and a living surface)
 * and answers the Player's questions.
 */
export class Tanks implements WaterProvider {
  readonly tanks: Tank[] = [];
  private readonly byId = new Map<string, Tank>();
  private readonly currents: Current[] = [];
  private readonly pockets: Rect[] = [];
  private readonly vents: Array<{ x: number; y: number; top: number }> = [];
  private readonly water: SwimWater = { surface: 0, currentX: 0, currentY: 0 };
  private readonly front: Phaser.GameObjects.Graphics;
  private readonly back: Phaser.GameObjects.Graphics;
  private t = 0;
  /** A level is moving (for the pump's rumble). */
  moving = false;

  constructor(
    scene: Phaser.Scene,
    level: LevelData,
    private readonly fx: Fx,
    /** Tile (x, y) is open (water can be there). */
    private readonly isOpen: (tx: number, ty: number) => boolean,
  ) {
    for (const e of level.entities) {
      if (e.type === 'tank') {
        const tank: Tank = { id: e.id, x0: e.x * TILE, x1: (e.x + e.w) * TILE, top: e.top * TILE, bottom: e.bottom * TILE, level: e.level * TILE, target: e.level * TILE, speed: PLUMBER_WATER.fillSpeed, sea: e.sea === true, visible: false, open: [] };
        this.tanks.push(tank);
        this.byId.set(tank.id, tank);
      } else if (e.type === 'current') {
        this.currents.push({ id: e.id, x0: e.x * TILE, x1: (e.x + e.w) * TILE, y0: e.y * TILE, y1: (e.y + e.h) * TILE, vx: e.vx, vy: e.vy, intake: e.intake === true, on: true, pulse: e.pulse ?? null, pulseT: 0 });
      } else if (e.type === 'airPocket') {
        this.pockets.push({ x0: e.x * TILE, x1: (e.x + e.w) * TILE, y0: e.y * TILE, y1: (e.y + e.h) * TILE });
      } else if (e.type === 'bubbleVent') {
        this.vents.push({ x: e.x * TILE + TILE / 2, y: e.y * TILE, top: 0 });
      }
    }
    this.rebuildOpen();
    // A vent's stream rises to the surface of the water it's in.
    for (const v of this.vents) v.top = this.tankAt(v.x, v.y - 2)?.level ?? v.y - 160;
    this.back = scene.add.graphics().setDepth(DEPTH.water);
    this.front = scene.add.graphics().setDepth(DEPTH.foreground);
  }

  /** Works out each tank's open rectangles again (a door opened or shut, a wall broke). */
  rebuildOpen(): void {
    for (const t of this.tanks) {
      t.open.length = 0;
      const tx0 = t.x0 / TILE;
      const tx1 = t.x1 / TILE;
      // Runs of open cells per row, merged downward while a run stays the same.
      let prev: Rect[] = [];
      for (let ty = t.top / TILE; ty < t.bottom / TILE; ty++) {
        const row: Rect[] = [];
        let x = tx0;
        while (x < tx1) {
          if (!this.isOpen(x, ty)) {
            x++;
            continue;
          }
          let end = x;
          while (end < tx1 && this.isOpen(end, ty)) end++;
          const same = prev.find((r) => r.x0 === x * TILE && r.x1 === end * TILE && r.y1 === ty * TILE);
          if (same) {
            same.y1 = (ty + 1) * TILE;
            row.push(same);
          } else {
            const r = { x0: x * TILE, x1: end * TILE, y0: ty * TILE, y1: (ty + 1) * TILE };
            t.open.push(r);
            row.push(r);
          }
          x = end;
        }
        prev = row;
      }
    }
  }

  get(id: string): Tank | undefined {
    return this.byId.get(id);
  }

  /** Sends a tank's surface to row `row` (tiles) at `speed` px/s. */
  setLevel(id: string, row: number, speed: number = PLUMBER_WATER.fillSpeed): void {
    const tank = this.byId.get(id);
    if (!tank) return;
    tank.target = Math.max(tank.top, Math.min(tank.bottom, row * TILE));
    tank.speed = speed;
  }

  /** Snaps a tank's surface to row `row` now (a resumed run, a story cut). */
  snapLevel(id: string, row: number): void {
    const tank = this.byId.get(id);
    if (!tank) return;
    tank.level = tank.target = Math.max(tank.top, Math.min(tank.bottom, row * TILE));
  }

  /** Two tanks share their water through a valve: both head for the level where their volumes balance. */
  share(a: string, b: string): void {
    const ta = this.byId.get(a);
    const tb = this.byId.get(b);
    if (!ta || !tb) return;
    const wa = ta.x1 - ta.x0;
    const wb = tb.x1 - tb.x0;
    // Volume (per unit depth) each holds above its floor, spread over both floors.
    const vol = (ta.bottom - ta.level) * wa + (tb.bottom - tb.level) * wb;
    const floor = Math.max(ta.bottom, tb.bottom);
    const level = floor - vol / (wa + wb);
    ta.target = Math.max(ta.top, Math.min(ta.bottom, level));
    tb.target = Math.max(tb.top, Math.min(tb.bottom, level));
    ta.speed = tb.speed = PLUMBER_WATER.valveSpeed;
  }

  /** The tank's surface has reached where it was sent. */
  settled(id: string): boolean {
    const t = this.byId.get(id);
    return !t || t.level === t.target;
  }

  /** Both tanks' surfaces within a tile of each other (a pressure door may open). */
  isLevel(a: string, b: string): boolean {
    const ta = this.byId.get(a);
    const tb = this.byId.get(b);
    if (!ta || !tb) return false;
    return Math.abs(ta.level - tb.level) <= PLUMBER_WATER.levelTolerance;
  }

  /** The surface difference between two tanks (px, positive when `a` is higher). */
  difference(a: string, b: string): number {
    const ta = this.byId.get(a);
    const tb = this.byId.get(b);
    if (!ta || !tb) return 0;
    return tb.level - ta.level;
  }

  setCurrent(id: string, on: boolean): void {
    for (const c of this.currents) if (c.id === id) c.on = on;
  }

  tankAt(x: number, y: number): Tank | null {
    for (const t of this.tanks) if (x >= t.x0 && x < t.x1 && y >= t.top && y < t.bottom) return t;
    return null;
  }

  // ------------------------------------------------------------ WaterProvider

  waterAt(x: number, y: number): SwimWater | null {
    for (const t of this.tanks) {
      if (x < t.x0 || x >= t.x1 || y < t.level - TILE || y >= t.bottom) continue;
      if (t.bottom - t.level < 6) return null;
      this.water.surface = t.level;
      this.water.currentX = 0;
      this.water.currentY = 0;
      for (const c of this.currents) {
        if (!this.flowing(c) || x < c.x0 || x >= c.x1 || y < c.y0 || y >= c.y1 || y < t.level) continue;
        this.water.currentX += c.vx;
        this.water.currentY += c.vy;
      }
      return this.water;
    }
    return null;
  }

  airAt(x: number, y: number): boolean {
    for (const p of this.pockets) if (x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1) return true;
    for (const v of this.vents) if (Math.abs(x - v.x) < PLUMBER_WATER.ventHalfWidth && y <= v.y && y >= v.top) return true;
    return false;
  }

  /** An intake's grate: true when (x, y) is at the mouth of one that's running (it bites). */
  atIntake(x: number, y: number): boolean {
    for (const c of this.currents) {
      if (!this.flowing(c) || !c.intake) continue;
      const mouthX = c.vx > 0 ? c.x1 - TILE : c.vx < 0 ? c.x0 : (c.x0 + c.x1) / 2;
      const mouthY = c.vy > 0 ? c.y1 - TILE : c.vy < 0 ? c.y0 : (c.y0 + c.y1) / 2;
      if (Math.abs(x - mouthX) < TILE && Math.abs(y - mouthY) < TILE * 1.5) return true;
    }
    return false;
  }

  /** A current running right now (switched on, and in the on part of its pulse). */
  private flowing(c: Current): boolean {
    if (!c.on) return false;
    if (!c.pulse) return true;
    return c.pulseT % (c.pulse.onMs + c.pulse.offMs) < c.pulse.onMs;
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number, view: Phaser.Geom.Rectangle): void {
    this.t += dtMs;
    const dt = dtMs / 1000;
    this.moving = false;
    for (const t of this.tanks) {
      if (t.level !== t.target) {
        const step = t.speed * dt;
        t.level = Math.abs(t.target - t.level) <= step ? t.target : t.level + Math.sign(t.target - t.level) * step;
        this.moving = true;
        // Churn at a moving surface.
        if (t.visible && chance(0.25)) this.fx.burst('bubble', t.x0 + Math.random() * (t.x1 - t.x0), t.level + 4, 1);
      }
    }
    // Bubble vents and running currents show themselves.
    for (const v of this.vents) {
      if (v.x < view.x - 40 || v.x > view.right + 40) continue;
      if (chance(0.35)) this.fx.burst('bubble', v.x + (Math.random() - 0.5) * 6, v.y - 2, 1);
    }
    for (const c of this.currents) {
      c.pulseT += dtMs;
      if (!this.flowing(c) || c.x1 < view.x || c.x0 > view.right) continue;
      if (chance(0.45)) {
        const x = c.x0 + Math.random() * (c.x1 - c.x0);
        const y = c.y0 + Math.random() * (c.y1 - c.y0);
        if (this.waterAt(x, y)) this.fx.burst('bubble', x, y, 1);
      }
    }
    this.draw(view);
  }

  /** The water, only over open space: a deep body behind, a lighter veil in front, and the surface. */
  private draw(view: Phaser.Geom.Rectangle): void {
    const back = this.back;
    const front = this.front;
    back.clear();
    front.clear();
    const W = PLUMBER_WATER;
    const vx0 = view.x - 8;
    const vx1 = view.right + 8;
    const vy0 = view.y - 8;
    const vy1 = view.bottom + 8;
    for (const t of this.tanks) {
      t.visible = t.x1 > vx0 && t.x0 < vx1 && t.bottom > vy0 && t.level < vy1 && t.bottom - t.level > 2;
      if (!t.visible) continue;
      const c = t.sea ? W.sea : W.base;
      const depth = Math.max(1, t.bottom - t.level);
      for (const r of t.open) {
        const x0 = Math.max(r.x0, vx0);
        const x1 = Math.min(r.x1, vx1);
        const y0 = Math.max(r.y0, t.level, vy0);
        const y1 = Math.min(r.y1, vy1);
        if (x1 <= x0 || y1 <= y0) continue;
        // Darker with depth under the surface.
        const top = mixColor(c.top, c.deep, (y0 - t.level) / depth);
        const bottom = mixColor(c.top, c.deep, (y1 - t.level) / depth);
        if (c.backAlpha > 0) {
          back.fillGradientStyle(top, top, bottom, bottom, c.backAlpha, c.backAlpha, c.backAlpha * 1.3, c.backAlpha * 1.3);
          back.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
        front.fillGradientStyle(top, top, bottom, bottom, c.frontAlpha, c.frontAlpha, c.frontAlpha * 1.4, c.frontAlpha * 1.4);
        front.fillRect(x0, y0, x1 - x0, y1 - y0);
        // The surface, across each open span it runs through.
        if (!t.sea && t.level >= r.y0 && t.level < r.y1 && t.level > vy0) this.surface(front, x0, x1, t.level, c.crest);
      }
    }
  }

  /** A wavy band, a bright crest, flecks of foam. */
  private surface(g: Phaser.GameObjects.Graphics, x0: number, x1: number, level: number, crest: number): void {
    const step = 6;
    const phase = this.t * 0.0024;
    const yAt = (x: number) => level + Math.sin(x * 0.07 + phase) * 1.2 + Math.sin(x * 0.023 - phase * 0.7) * 0.8;
    g.fillStyle(crest, 0.35);
    g.beginPath();
    g.moveTo(x0, level + 3);
    for (let x = x0; x < x1 + step; x += step) g.lineTo(Math.min(x, x1), yAt(Math.min(x, x1)));
    g.lineTo(x1, level + 3);
    g.closePath();
    g.fillPath();
    g.lineStyle(1.2, crest, 0.9);
    g.beginPath();
    g.moveTo(x0, yAt(x0));
    for (let x = x0 + step; x < x1 + step; x += step) g.lineTo(Math.min(x, x1), yAt(Math.min(x, x1)));
    g.strokePath();
    g.lineStyle(1, 0xffffff, 0.55);
    for (let x = x0 + ((this.t * 0.01) % 22); x < x1 - 6; x += 22) g.lineBetween(x, yAt(x) + 1.6, x + 5, yAt(x + 5) + 1.6);
  }

  destroy(): void {
    this.back.destroy();
    this.front.destroy();
  }
}
