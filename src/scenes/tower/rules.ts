import { TOWER } from '../../config/tower';

/** One flat step of the spiral: from `s0` to `s1` along the surface, at height `h` (px, up). */
export interface Ledge {
  s0: number;
  s1: number;
  h: number;
}

/** The tower's circumference along its surface. */
export const CIRCUMFERENCE = Math.PI * 2 * TOWER.radius;

/**
 * The spiral of ledges from the base to the top: steps that rise a little
 * each time, with a gap to jump now and then (and a catch ledge under it).
 * Deterministic: the same tower every time.
 */
export function towerLedges(seed = 7): Ledge[] {
  let rnd = seed;
  const next = () => {
    rnd = (rnd * 16807) % 2147483647;
    return rnd / 2147483647;
  };
  const S = TOWER.step;
  const total = CIRCUMFERENCE * TOWER.revolutions;
  const out: Ledge[] = [{ s0: -CIRCUMFERENCE, s1: 60, h: 0 }];
  let s = 60;
  let h = 0;
  let n = 0;
  while (s < total) {
    n++;
    if (n % TOWER.gapEvery === 0) {
      // A gap to jump, and a catch ledge below it the whole way across.
      out.push({ s0: s, s1: s + TOWER.gapLength, h: h - TOWER.catchDrop });
      s += TOWER.gapLength;
    }
    h += S.rise;
    const len = S.length[0] + next() * (S.length[1] - S.length[0]);
    out.push({ s0: s, s1: s + len, h });
    s += len;
  }
  // The top: a long last step under the parapet (the spiral ends there).
  out.push({ s0: s, s1: s + TOWER.topLength, h: h + S.rise });
  return out;
}

/** Where the spiral ends (the far end of the top step): nothing to run on past it. */
export function spiralEnd(ledges: readonly Ledge[]): number {
  return ledges[ledges.length - 1].s1;
}

/** The top: the last ledge's height. */
export function topHeight(ledges: readonly Ledge[]): number {
  return ledges.reduce((m, l) => Math.max(m, l.h), 0);
}

/** A landing: the ledge, and how far along the spiral Ben's position moves to stand on that turn of it (a whole number of turns). */
export interface Landing {
  ledge: Ledge | null;
  shift: number;
}

const found: Landing = { ledge: null, shift: 0 };

/**
 * The ledge Ben lands on falling from height `fromH` to `toH` at arc position
 * `s` (the highest one he crosses). The spiral wraps: a ledge one turn below
 * sits at the same spot on the tower, `CIRCUMFERENCE` earlier along it, so a
 * fall lands on whichever turn is under him. Reuses one result object.
 */
export function landing(ledges: readonly Ledge[], s: number, fromH: number, toH: number): Landing {
  found.ledge = null;
  found.shift = 0;
  for (const l of ledges) {
    if (l.h > fromH + 0.5 || l.h < toH) continue;
    const m = ((((s - l.s0) % CIRCUMFERENCE) + CIRCUMFERENCE) % CIRCUMFERENCE);
    if (m > l.s1 - l.s0) continue;
    if (found.ledge && l.h <= found.ledge.h) continue;
    found.ledge = l;
    found.shift = l.s0 + m - s;
  }
  return found;
}

/** The ledge Ben is standing on at (s, h), if any. */
export function standingOn(ledges: readonly Ledge[], s: number, h: number): Ledge | null {
  for (const l of ledges) if (s >= l.s0 && s <= l.s1 && Math.abs(l.h - h) < 1) return l;
  return null;
}

/** Wraps an angle difference into [-PI, PI). */
export function wrapAngle(a: number): number {
  const t = (a + Math.PI) % (Math.PI * 2);
  return (t < 0 ? t + Math.PI * 2 : t) - Math.PI;
}

/** A projected point: x offset from the tower's middle, and depth (1 facing the camera, 0 at the edge, negative behind). */
export interface Projected {
  dx: number;
  depth: number;
}

/** Where a point at arc position `s` (`out` px off the wall) shows with the camera at `camS`. Writes into `o` (no allocations per frame). */
export function project(s: number, camS: number, out: number, o: Projected): Projected {
  const a = wrapAngle((s - camS) / TOWER.radius);
  o.dx = (TOWER.radius + out) * Math.sin(a);
  o.depth = Math.cos(a);
  return o;
}
