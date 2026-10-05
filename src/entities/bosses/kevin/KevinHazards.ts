import { PALETTE } from '../../../config/palette';
import type { Fx } from '../../../systems/Fx';
import type { Lighting } from '../../../systems/Lighting';
import { blinkOn } from '../../../systems/Accessibility';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Telegraphs } from '../../enemies/Telegraphs';
import type { Hazard, Rect } from '../../types';

/**
 * A column of floor that warns (a striped band and a flickering outline),
 * then erupts for a moment: copy-Heatblast's fire pillar, a coil's arc,
 * copy-Wildmutt's roar. Every one warns the same way on every difficulty.
 */
export class Eruption implements Hazard {
  damage = 1;
  private warnLeft = 0;
  private liveLeft = 0;
  private x = 0;
  private w = 0;
  private h = 0;
  private color: number = PALETTE.kevin;
  private style: 'fire' | 'arc' | 'roar' = 'fire';

  constructor(
    private readonly floorY: number,
    private readonly fx: Fx,
    private readonly lighting: Lighting,
    private readonly telegraph: Telegraphs,
  ) {}

  get busy(): boolean {
    return this.warnLeft > 0 || this.liveLeft > 0;
  }

  get active(): boolean {
    return this.liveLeft > 0;
  }

  /** Centre `x`, `width` wide and `height` tall from the floor. */
  start(x: number, width: number, height: number, warnMs: number, liveMs: number, damage: number, style: 'fire' | 'arc' | 'roar', color: number): void {
    this.x = x;
    this.w = width;
    this.h = height;
    this.warnLeft = warnMs;
    this.liveLeft = 0;
    this.pendingLive = liveMs;
    this.damage = damage;
    this.style = style;
    this.color = color;
  }

  private pendingLive = 0;

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = this.x - this.w / 2;
    out.y = this.floorY - this.h;
    out.w = this.w;
    out.h = this.h;
    return true;
  }

  update(dtMs: number, now: number): void {
    if (this.warnLeft > 0) {
      this.warnLeft -= dtMs;
      const on = blinkOn(now, 100);
      this.telegraph.zone(this.x - this.w / 2, this.floorY - this.h, this.w, this.h, this.color, on ? 0.75 : 0.4, now * 0.05);
      this.telegraph.rect(this.x - this.w / 2, this.floorY - 2, this.w, 2, this.color, on ? 0.9 : 0.5);
      if (this.warnLeft <= 0) {
        this.liveLeft = this.pendingLive;
        this.erupt();
      }
      return;
    }
    if (this.liveLeft <= 0) return;
    this.liveLeft -= dtMs;
    const kind = this.style === 'fire' ? 'fire' : this.style === 'arc' ? 'volt' : 'dust';
    if (chance(0.8)) this.fx.burst(kind, this.x + (Math.random() - 0.5) * this.w, this.floorY - Math.random() * this.h, 2);
    this.lighting.add(this.x, this.floorY - this.h / 2, Math.max(this.w, this.h) * 0.9, this.color, 1);
    if (this.style === 'arc') {
      // A jagged bolt from the ceiling of the zone to the floor.
      const x0 = this.x + (Math.random() - 0.5) * this.w * 0.6;
      this.fx.beam(x0, this.floorY - this.h, this.x + (Math.random() - 0.5) * this.w * 0.6, this.floorY, this.color, 3, 60);
    }
  }

  private erupt(): void {
    if (this.style === 'fire') {
      this.fx.burst('fire', this.x, this.floorY - 6, 20);
      this.fx.flash(this.x, this.floorY - this.h / 2, this.color, this.w, 260);
      playSfx('fireball', 0.9, 0.6);
    } else if (this.style === 'arc') {
      this.fx.burst('volt', this.x, this.floorY - 6, 16);
      this.fx.flash(this.x, this.floorY - this.h / 2, this.color, this.w * 0.8, 200);
      playSfx('coilZap', 0.9);
    } else {
      this.fx.ring(this.x, this.floorY - this.h / 2, this.color, this.w / 2, 300);
      playSfx('roar', 0.8, 1.2);
    }
    this.fx.shake(0.006, 160);
  }

  clear(): void {
    this.warnLeft = 0;
    this.liveLeft = 0;
  }
}

/** A small pool of eruptions. */
export class KevinHazards {
  readonly eruptions: Eruption[] = [];

  constructor(floorY: number, fx: Fx, lighting: Lighting, telegraph: Telegraphs) {
    for (let i = 0; i < 6; i++) this.eruptions.push(new Eruption(floorY, fx, lighting, telegraph));
  }

  all(): Hazard[] {
    return [...this.eruptions];
  }

  erupt(x: number, width: number, height: number, warnMs: number, liveMs: number, damage: number, style: 'fire' | 'arc' | 'roar', color: number): void {
    const e = this.eruptions.find((h) => !h.busy);
    e?.start(x, width, height, warnMs, liveMs, damage, style, color);
  }

  get busy(): boolean {
    return this.eruptions.some((e) => e.busy);
  }

  update(dtMs: number, now: number): void {
    for (const e of this.eruptions) e.update(dtMs, now);
  }

  clear(): void {
    for (const e of this.eruptions) e.clear();
  }
}
