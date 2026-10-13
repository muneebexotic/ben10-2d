import type { Hazard, Rect } from '../types';

class Blast implements Hazard {
  active = false;
  damage = 0;
  x = 0;
  y = 0;
  radius = 0;
  life = 0;

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    // A square a little inside the circle: the edge of a blast never hits from a pixel away.
    const r = this.radius * 0.8;
    out.x = this.x - r;
    out.y = this.y - r;
    out.w = r * 2;
    out.h = r * 2;
    return true;
  }

  onHitPlayer(): void {
    this.active = false;
  }
}

/**
 * Short-lived explosions that hurt Ben (a missile landing, dynamite, a rock
 * smashing down). A small fixed pool, registered with Combat once as hazards.
 */
export class Blasts {
  readonly items: Blast[] = [];

  constructor(size = 10) {
    for (let i = 0; i < size; i++) this.items.push(new Blast());
  }

  add(x: number, y: number, radius: number, damage: number, lifeMs = 90): void {
    const b = this.items.find((i) => !i.active) ?? this.items[0];
    b.active = true;
    b.x = x;
    b.y = y;
    b.radius = radius;
    b.damage = damage;
    b.life = lifeMs;
  }

  update(dtMs: number): void {
    for (const b of this.items) {
      if (!b.active) continue;
      b.life -= dtMs;
      if (b.life <= 0) b.active = false;
    }
  }

  clear(): void {
    for (const b of this.items) b.active = false;
  }
}
