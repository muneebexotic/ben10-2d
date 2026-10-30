import type { HdFrame } from './hdTexture';
import type { Paint } from './paint';

/**
 * Articulated cartoon characters (Act 3). A rig is a skeleton of bones, each
 * carrying a painted part (a torso, a forearm, a face); a pose is an angle
 * (and optional nudge, stretch, variant) per bone; a clip turns time into a
 * pose. Parts are painted once into an HD atlas and the skeleton is posed
 * every frame, so motion is smooth at any frame rate.
 *
 * Conventions: the rig faces right; (0, 0) is between the feet on the floor;
 * game pixels, y down. Bones that point up (torso, neck, head) lean forward
 * for positive angles; bones that hang down (limbs, tails) swing forward for
 * positive angles. A child inherits its parent's rotation (forward kinematics).
 */

export interface PartSpec {
  id: string;
  /** Size of the part's cell (game px) and where its pivot sits inside it. */
  w: number;
  h: number;
  px: number;
  py: number;
  /** Named looks of the part (an expression, a flame flicker). The first is the default. */
  variants?: readonly string[];
  /** Paints the part with the pivot at (0, 0). */
  draw(p: Paint, variant: string): void;
}

export interface BoneSpec {
  id: string;
  parent?: string;
  /** Joint position in the parent's space (game px), or from the feet for the root. */
  x: number;
  y: number;
  part?: string;
  /** Draw order (higher in front). */
  z: number;
  /** 1: points up (positive leans forward). -1: hangs down (positive swings forward). */
  dir: 1 | -1;
  /** Blinks now and then (its part's variants include 'blink'). */
  blink?: boolean;
  /** Cycles through these variants on its own (flames, flicker). */
  cycle?: { variants: readonly string[]; fps: number };
}

/** What one bone does in a static pose: an angle, or the full set. */
export type BoneKey = number | { a?: number; x?: number; y?: number; sx?: number; sy?: number; v?: string; hide?: boolean; z?: number };
export type PoseData = Readonly<Record<string, BoneKey>>;

export interface ClipDef {
  /** Length of one play-through (a loop's cycle), ms. */
  ms: number;
  loop: boolean;
  /** Writes the pose at `t` (0..1) into `p` (reset to the rest pose first). */
  pose(t: number, p: Pose): void;
}

export interface RigDef {
  id: string;
  parts: readonly PartSpec[];
  bones: readonly BoneSpec[];
  clips: Readonly<Record<string, ClipDef>>;
  /** Clip for anything the rig doesn't know. */
  fallback: string;
  /** Other names for clips (a pixel animation called 'punchA' playing this rig's 'punch'). */
  alias?: Readonly<Record<string, string>>;
  /** How far the art reaches around the feet (game px), for culling and snapshots. */
  bounds: { left: number; right: number; top: number; bottom: number };
  /**
   * A face drawn whole (heads cut from model sheets): the clips still ask for
   * eyes and mouth looks, and `pick` turns each pair into one of the head's
   * variants. The eyes and mouth bones are hidden.
   */
  face?: { head: string; eyes: string; mouth: string; pick(eyes: string, mouth: string): string };
  /** Parts drawn as meshes that bend with their bones (`skin.ts`): a whole leg, a whole arm. */
  skins?: readonly SkinSpec[];
}

/** A part drawn as a mesh bent by a chain of bones (see `skin.ts`). */
export interface SkinSpec {
  /** The part (painted straight, as at rest) and the bone its pivot sits on, whose draw order and visibility it follows. */
  part: string;
  bone: string;
  /** The bones it bends with, top to bottom, and how far each joint's bend spreads either side of it (game px). */
  chain: readonly string[];
  blend: readonly number[];
  /** The mesh's grid. */
  cols: number;
  rows: number;
  /** Where a fold overlaps, the lower bone's side draws on top (a near forearm over its upper arm). */
  lowerOnTop?: boolean;
}

/** Bone lookup and order, built once per rig. */
export class RigInfo {
  readonly index = new Map<string, number>();
  /** Bones in parent-before-child order. */
  readonly order: number[] = [];
  readonly parent: Int16Array;
  readonly variantIndex: Array<Map<string, number>>;
  readonly variants: Array<readonly string[]>;
  /** A whole-head face: the head's variant for every eyes and mouth look (`eyes * mouths + mouth`). */
  readonly face: { head: number; eyes: number; mouth: number; mouths: number; table: Int16Array } | null = null;

  constructor(readonly def: RigDef) {
    def.bones.forEach((b, i) => this.index.set(b.id, i));
    this.parent = new Int16Array(def.bones.length).fill(-1);
    def.bones.forEach((b, i) => {
      if (b.parent !== undefined) {
        const p = this.index.get(b.parent);
        if (p === undefined) throw new Error(`${def.id}: bone ${b.id} has unknown parent ${b.parent}`);
        this.parent[i] = p;
      }
    });
    const placed = new Set<number>();
    const visit = (i: number, depth: number) => {
      if (placed.has(i)) return;
      if (depth > 64) throw new Error(`${def.id}: bone cycle at ${def.bones[i].id}`);
      if (this.parent[i] >= 0) visit(this.parent[i], depth + 1);
      placed.add(i);
      this.order.push(i);
    };
    def.bones.forEach((_, i) => visit(i, 0));
    const parts = new Map(def.parts.map((p) => [p.id, p]));
    this.variants = def.bones.map((b) => (b.part ? (parts.get(b.part)?.variants ?? ['']) : ['']));
    this.variantIndex = this.variants.map((list) => new Map(list.map((v, k) => [v, k])));
    if (def.face) {
      const f = def.face;
      const head = this.bone(f.head);
      const eyes = this.bone(f.eyes);
      const mouth = this.bone(f.mouth);
      const ev = this.variants[eyes];
      const mv = this.variants[mouth];
      const table = new Int16Array(ev.length * mv.length);
      ev.forEach((e, i) => mv.forEach((m, k) => (table[i * mv.length + k] = this.variantIndex[head].get(f.pick(e, m)) ?? 0)));
      this.face = { head, eyes, mouth, mouths: mv.length, table };
    }
  }

  bone(id: string): number {
    const i = this.index.get(id);
    if (i === undefined) throw new Error(`${this.def.id}: no bone ${id}`);
    return i;
  }
}

/** A static pose compiled against a rig (array per channel; `set` marks which bones it touches). */
export interface CompiledPose {
  set: Uint8Array;
  a: Float32Array;
  x: Float32Array;
  y: Float32Array;
  sx: Float32Array;
  sy: Float32Array;
  v: Int16Array;
  hide: Int8Array;
  z: Float32Array;
}

export function compilePose(info: RigInfo, data: PoseData): CompiledPose {
  const n = info.def.bones.length;
  const c: CompiledPose = {
    set: new Uint8Array(n),
    a: new Float32Array(n),
    x: new Float32Array(n),
    y: new Float32Array(n),
    sx: new Float32Array(n).fill(1),
    sy: new Float32Array(n).fill(1),
    v: new Int16Array(n).fill(-1),
    hide: new Int8Array(n).fill(-1),
    z: new Float32Array(n).fill(NaN),
  };
  for (const [id, key] of Object.entries(data)) {
    const i = info.bone(id);
    c.set[i] = 1;
    if (typeof key === 'number') {
      c.a[i] = key;
      continue;
    }
    c.a[i] = key.a ?? 0;
    c.x[i] = key.x ?? 0;
    c.y[i] = key.y ?? 0;
    c.sx[i] = key.sx ?? 1;
    c.sy[i] = key.sy ?? 1;
    // A look this part doesn't have (a shared clip asking an alien's face for a grin) leaves the part as it is.
    if (key.v !== undefined) c.v[i] = info.variantIndex[i].get(key.v) ?? -1;
    if (key.hide !== undefined) c.hide[i] = key.hide ? 1 : 0;
    if (key.z !== undefined) c.z[i] = key.z;
  }
  return c;
}

const DEG = Math.PI / 180;

/**
 * A pose being written (no allocation per frame): per-bone angle (degrees),
 * nudge, stretch, variant, visibility and draw order.
 */
export class Pose {
  readonly a: Float32Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly sx: Float32Array;
  readonly sy: Float32Array;
  readonly v: Int16Array;
  readonly hide: Uint8Array;
  readonly z: Float32Array;

  constructor(readonly info: RigInfo) {
    const n = info.def.bones.length;
    this.a = new Float32Array(n);
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.v = new Int16Array(n);
    this.hide = new Uint8Array(n);
    this.z = new Float32Array(n);
    this.reset();
  }

  reset(): this {
    this.a.fill(0);
    this.x.fill(0);
    this.y.fill(0);
    this.sx.fill(1);
    this.sy.fill(1);
    this.v.fill(0);
    this.hide.fill(0);
    const bones = this.info.def.bones;
    for (let i = 0; i < bones.length; i++) this.z[i] = bones[i].z;
    return this;
  }

  copy(o: Pose): this {
    this.a.set(o.a);
    this.x.set(o.x);
    this.y.set(o.y);
    this.sx.set(o.sx);
    this.sy.set(o.sy);
    this.v.set(o.v);
    this.hide.set(o.hide);
    this.z.set(o.z);
    return this;
  }

  /** Blends this pose toward `o` by k (angles, nudges and stretches; variants and order switch halfway). */
  mixTo(o: Pose, k: number): this {
    for (let i = 0; i < this.a.length; i++) {
      this.a[i] += (o.a[i] - this.a[i]) * k;
      this.x[i] += (o.x[i] - this.x[i]) * k;
      this.y[i] += (o.y[i] - this.y[i]) * k;
      this.sx[i] += (o.sx[i] - this.sx[i]) * k;
      this.sy[i] += (o.sy[i] - this.sy[i]) * k;
      if (k >= 0.5) {
        this.v[i] = o.v[i];
        this.hide[i] = o.hide[i];
        this.z[i] = o.z[i];
      }
    }
    return this;
  }

  /** Sets the bones a static pose touches to it, blended toward `b` by k (keyframes). */
  apply(a: CompiledPose, b: CompiledPose = a, k = 0): this {
    for (let i = 0; i < this.a.length; i++) {
      const sa = a.set[i];
      const sb = b.set[i];
      if (!sa && !sb) continue;
      // A pose that doesn't touch a bone counts as its rest values there.
      const aa = sa ? a.a[i] : 0;
      const ax = sa ? a.x[i] : 0;
      const ay = sa ? a.y[i] : 0;
      const asx = sa ? a.sx[i] : 1;
      const asy = sa ? a.sy[i] : 1;
      this.a[i] = aa + ((sb ? b.a[i] : 0) - aa) * k;
      this.x[i] = ax + ((sb ? b.x[i] : 0) - ax) * k;
      this.y[i] = ay + ((sb ? b.y[i] : 0) - ay) * k;
      this.sx[i] = asx + ((sb ? b.sx[i] : 1) - asx) * k;
      this.sy[i] = asy + ((sb ? b.sy[i] : 1) - asy) * k;
      const src = k < 0.5 ? a : b;
      if (src.v[i] >= 0) this.v[i] = src.v[i];
      if (src.hide[i] >= 0) this.hide[i] = src.hide[i];
      if (!Number.isNaN(src.z[i])) this.z[i] = src.z[i];
    }
    return this;
  }

  /** Keyframes: [time 0..1, pose] in order; blends the two around `t` with a smooth ease. */
  keys(frames: ReadonlyArray<readonly [number, CompiledPose]>, t: number, loop = false): this {
    const n = frames.length;
    if (n === 0) return this;
    if (n === 1) return this.apply(frames[0][1]);
    const [tf, pf] = frames[0];
    const [tl, pl] = frames[n - 1];
    // Across a loop's wrap (after the last key, or before the first) it blends from the last key to the first.
    const wrap = Math.max(0.0001, 1 - tl + tf);
    if (t <= tf) return loop ? this.apply(pl, pf, smooth((t + 1 - tl) / wrap)) : this.apply(pf);
    for (let i = 0; i < n - 1; i++) {
      const [t0, p0] = frames[i];
      const [t1, p1] = frames[i + 1];
      if (t >= t0 && t <= t1) return this.apply(p0, p1, smooth((t - t0) / Math.max(0.0001, t1 - t0)));
    }
    return loop ? this.apply(pl, pf, smooth((t - tl) / wrap)) : this.apply(pl);
  }

  /** Adds to a bone's angle. */
  add(bone: string, deg: number): this {
    this.a[this.info.bone(bone)] += deg;
    return this;
  }

  set(bone: string, deg: number): this {
    this.a[this.info.bone(bone)] = deg;
    return this;
  }

  /** Nudges a bone's joint (game px, parent space). */
  move(bone: string, x: number, y: number): this {
    const i = this.info.bone(bone);
    this.x[i] += x;
    this.y[i] += y;
    return this;
  }

  /** Stretches a bone's part (multiplies). */
  size(bone: string, sx: number, sy = sx): this {
    const i = this.info.bone(bone);
    this.sx[i] *= sx;
    this.sy[i] *= sy;
    return this;
  }

  show(bone: string, variant: string): this {
    const i = this.info.bone(bone);
    const vi = this.info.variantIndex[i].get(variant);
    if (vi !== undefined) this.v[i] = vi;
    return this;
  }

  hidden(bone: string, on = true): this {
    this.hide[this.info.bone(bone)] = on ? 1 : 0;
    return this;
  }

  /** Draw order for a bone this frame (an arm swinging in front). */
  front(bone: string, z: number): this {
    this.z[this.info.bone(bone)] = z;
    return this;
  }
}

/** A whole-head face: picks the head for the eyes and mouth the pose asks for, and hides those two. Allocation-free. */
export function applyFace(info: RigInfo, pose: Pose): void {
  const f = info.face;
  if (!f) return;
  pose.v[f.head] = f.table[Math.max(0, pose.v[f.eyes]) * f.mouths + Math.max(0, pose.v[f.mouth])];
  pose.hide[f.eyes] = 1;
  pose.hide[f.mouth] = 1;
}

/** Smoothstep: keyframes ease in and out. */
export function smooth(t: number): number {
  const k = Math.max(0, Math.min(1, t));
  return k * k * (3 - 2 * k);
}

export const TAU = Math.PI * 2;

/** A wave for cycles: sin(TAU * (t + phase)). */
export function wave(t: number, phase = 0): number {
  return Math.sin(TAU * (t + phase));
}

/** Where every bone is this frame (game px from the feet, radians), for the actor and for snapshots. */
export interface BoneWorld {
  x: Float32Array;
  y: Float32Array;
  r: Float32Array;
}

export function makeWorld(info: RigInfo): BoneWorld {
  const n = info.def.bones.length;
  return { x: new Float32Array(n), y: new Float32Array(n), r: new Float32Array(n) };
}

/** Forward kinematics: every bone's joint and rotation from the pose. Pure, allocation-free. */
export function solve(info: RigInfo, pose: Pose, out: BoneWorld): void {
  const bones = info.def.bones;
  for (const i of info.order) {
    const b = bones[i];
    const jx = b.x + pose.x[i];
    const jy = b.y + pose.y[i];
    const p = info.parent[i];
    const rot = b.dir * pose.a[i] * DEG;
    if (p < 0) {
      out.x[i] = jx;
      out.y[i] = jy;
      out.r[i] = rot;
      continue;
    }
    const pr = out.r[p];
    const c = Math.cos(pr);
    const s = Math.sin(pr);
    out.x[i] = out.x[p] + c * jx - s * jy;
    out.y[i] = out.y[p] + s * jx + c * jy;
    out.r[i] = pr + rot;
  }
}

/** Frame name of a part's variant in the rig's atlas. */
export function partFrame(part: string, variant: string, first: string): string {
  return variant === first ? part : `${part}:${variant}`;
}

/** Every part and variant of a rig as frames for its HD atlas (pivot at the drawing's origin). */
export function rigFrames(def: RigDef): HdFrame[] {
  const frames: HdFrame[] = [];
  for (const part of def.parts) {
    const variants = part.variants ?? [''];
    for (const v of variants) {
      frames.push({ name: partFrame(part.id, v, variants[0]), w: part.w, h: part.h, ox: part.px, oy: part.py, draw: (p) => part.draw(p, v) });
    }
  }
  return frames;
}

/** The atlas key a rig's parts live under. */
export function rigTextureKey(id: string): string {
  return `hd-rig-${id}`;
}
