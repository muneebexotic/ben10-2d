/** Shared combat contracts between the player, enemies, props and the Level's combat system. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 'smash' is a heavy blow (Four Arms, Milestone 2): the only thing that breaks cracked walls. */
export type HitKind = 'melee' | 'fire' | 'burst' | 'rocket' | 'reflect' | 'transform' | 'smash';

export interface Hit {
  damage: number;
  kind: HitKind;
  /** Where the hit came from, for knockback direction and effects. */
  x: number;
  y: number;
  knockback: number;
  heavy?: boolean;
}

export type HitResult = 'none' | 'hit' | 'killed' | 'blocked';

/** Anything the player can damage: drones, the boss, barricades, the jammer. */
export interface Damageable {
  readonly alive: boolean;
  /** Writes the current hurtbox into `out`; returns false when it cannot be hit right now. */
  hurtbox(out: Rect): boolean;
  takeHit(hit: Hit): HitResult;
  /** Lets fire-only or melee-only targets ignore other hit kinds. */
  accepts?(kind: HitKind): boolean;
  /** Enemies count toward stats and combos; props do not. */
  readonly countsAsEnemy: boolean;
}

/** Anything that hurts the player on contact. */
export interface Hazard {
  readonly active: boolean;
  hitbox(out: Rect): boolean;
  readonly damage: number;
  /** Called after the player was actually damaged by this hazard. */
  onHitPlayer?(): void;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleRect(cx: number, cy: number, r: number, b: Rect): boolean {
  const nx = Math.max(b.x, Math.min(cx, b.x + b.w));
  const ny = Math.max(b.y, Math.min(cy, b.y + b.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

export function rectCenterX(r: Rect): number {
  return r.x + r.w / 2;
}

export function rectCenterY(r: Rect): number {
  return r.y + r.h / 2;
}
