import type { ClipDef, Pose, RigDef } from '../rig';
import { cutoutPart, type CutoutMeta } from './cutout';

/**
 * A character drawn frame by frame (docs/DECISIONS.md): every pose is one of
 * the generated drawings (`scripts/cutout/frames.py`), played as it is, like
 * the show (about 12-16 drawings a second). It's a rig with one bone whose
 * part has a look per drawing, so the HD mirror, story poses, portraits and
 * the hit flicker work as for any rig.
 */

export interface FrameClip {
  /** The drawings in order (each shows for the same time). */
  frames: readonly string[];
  /** Drawings per second (a loop's length follows), or the clip's length for a one-shot. */
  fps?: number;
  ms?: number;
  loop: boolean;
  /** Movement over the drawings (a bob, a nudge, a spin), in game px and degrees. */
  motion?: (t: number, p: Pose, height: number) => void;
}

export interface FrameRigOptions {
  id: string;
  meta: CutoutMeta;
  img: HTMLImageElement;
  clips: Readonly<Record<string, FrameClip>>;
  fallback: string;
  alias?: Readonly<Record<string, string>>;
}

/** Every drawing's name in the image (`body:<name>`), the first being the default. */
export function frameNames(meta: CutoutMeta): string[] {
  return Object.keys(meta.frames)
    .filter((k) => k.startsWith('body:'))
    .map((k) => k.slice(5));
}

export function frameRig(o: FrameRigOptions): RigDef {
  const names = frameNames(o.meta);
  const missing = Object.values(o.clips).flatMap((c) => c.frames.filter((f) => !names.includes(f)));
  if (missing.length > 0) throw new Error(`${o.id}: no drawing for ${[...new Set(missing)].join(', ')}`);
  const body = cutoutPart(o.meta, o.img, 'body', names);
  const height = body.py;
  const clips: Record<string, ClipDef> = {};
  for (const [name, c] of Object.entries(o.clips)) {
    const n = c.frames.length;
    const ms = c.ms ?? (n / (c.fps ?? 12)) * 1000;
    clips[name] = {
      ms,
      loop: c.loop,
      pose: (t, p) => {
        p.show('body', c.frames[Math.min(n - 1, Math.floor(t * n))]);
        c.motion?.(t, p, height);
      },
    };
  }
  const T = o.meta.texel;
  const all = Object.values(o.meta.frames);
  return {
    id: o.id,
    parts: [body],
    bones: [{ id: 'body', x: 0, y: 0, part: 'body', z: 50, dir: 1 }],
    clips,
    fallback: o.fallback,
    alias: o.alias,
    bounds: {
      left: -Math.max(...all.map((f) => f.px)) / T,
      right: Math.max(...all.map((f) => f.w - f.px)) / T,
      top: -Math.max(...all.map((f) => f.py)) / T,
      bottom: Math.max(...all.map((f) => f.h - f.py)) / T,
    },
  };
}

/** Turns the drawing about its middle (its pivot is at the feet): a roll, a tumble. */
export function spinAboutMiddle(p: Pose, deg: number, height: number): void {
  const a = (deg * Math.PI) / 180;
  const h = height / 2;
  // The feet go where the turned middle lands back on (0, -h).
  p.set('body', deg).move('body', -Math.sin(a) * h, Math.cos(a) * h - h);
}
