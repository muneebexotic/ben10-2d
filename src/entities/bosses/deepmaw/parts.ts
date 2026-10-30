import type { Damageable, Hazard, Hit, HitResult, Rect } from '../../types';

/**
 * Deepmaw's pieces for Combat: his body (hit it, and it hurts to touch), the
 * lure's bulb (hit it to stun him; it never hurts), and the short-lived
 * hazards his attacks leave (the bite, the flash, a belly flop's landing, the
 * debris circling him in the maelstrom). Each is a box the boss moves every frame.
 */
export class DeepPart implements Damageable, Hazard {
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  lastDamage = 0;
  /** Hittable right now. */
  on = false;
  /** Hurts on contact right now. */
  harmful = false;
  damage: number;
  x = 0;
  y = 0;
  constructor(
    public w: number,
    public h: number,
    damage: number,
    private readonly onHit: ((hit: Hit) => HitResult) | null,
  ) {
    this.damage = damage;
  }

  get alive(): boolean {
    return this.on;
  }

  get active(): boolean {
    return this.harmful;
  }

  private box(out: Rect, grow: number): void {
    out.x = this.x - this.w / 2 - grow;
    out.y = this.y - this.h / 2 - grow;
    out.w = this.w + grow * 2;
    out.h = this.h + grow * 2;
  }

  hurtbox(out: Rect): boolean {
    if (!this.on || !this.onHit) return false;
    this.box(out, 2);
    return true;
  }

  hitbox(out: Rect): boolean {
    if (!this.harmful) return false;
    this.box(out, -3);
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.on || !this.onHit) return 'none';
    return this.onHit(hit);
  }
}

/** A hazard that's live for a moment (the flash, a landing, the bite): `live` counts down. */
export class Burst implements Hazard {
  live = 0;
  x = 0;
  y = 0;
  constructor(
    public w: number,
    public h: number,
    readonly damage: number,
  ) {}
  get active(): boolean {
    return this.live > 0;
  }
  hitbox(out: Rect): boolean {
    if (this.live <= 0) return false;
    out.x = this.x - this.w / 2;
    out.y = this.y - this.h / 2;
    out.w = this.w;
    out.h = this.h;
    return true;
  }
}
