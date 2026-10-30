import { makeWorld, Pose, smooth, solve, type BoneWorld, type PartSpec, type RigInfo, type SkinSpec } from './rig';

/**
 * Skins: a part drawn as a mesh that bends with a chain of bones (a whole
 * leg bends at the hip and knee, an arm at the elbow), so cloth and limbs
 * fold smoothly instead of turning as separate pieces.
 *
 * The part is drawn straight (the rig's rest pose, every bone hanging
 * down). Near each joint, a vertex turns about that joint by a blend of the
 * two bones' angles (angle blending: distances from the joint are kept, so a
 * bent knee doesn't pinch the way blended positions do). The cut-out tool
 * straightens the art with the same blend (`scripts/cutout/cut.py` unbend),
 * so a pose that matches the sheet shows the sheet exactly.
 */
export interface SkinGeom {
  readonly spec: SkinSpec;
  readonly cols: number;
  readonly rows: number;
  /** Rest positions (game px, rig space) and the cell's texture coordinates (0..1), per vertex, row by row. */
  readonly restX: Float32Array;
  readonly restY: Float32Array;
  readonly u: Float32Array;
  readonly v: Float32Array;
  /** Per row: the joint it bends about (index into `joints`) and the weight toward the bone below that joint. */
  readonly rowJoint: Uint8Array;
  readonly rowW: Float32Array;
  /** Per joint: the bone above, the bone below (whose joint it is) and its rest position. */
  readonly above: Int16Array;
  readonly below: Int16Array;
  readonly jointX: Float32Array;
  readonly jointY: Float32Array;
  /** The bone it hangs from (draw order, visibility). */
  readonly bone: number;
  /** Quads as strips (top-left, bottom-left, top-right, bottom-right), in draw order. */
  readonly quads: Uint16Array;
}

/** The rest pose: every bone at its rest angle. */
export function restWorld(info: RigInfo): BoneWorld {
  const world = makeWorld(info);
  solve(info, new Pose(info), world);
  return world;
}

/** Builds a skin's mesh once per rig. */
export function buildSkin(info: RigInfo, spec: SkinSpec, part: PartSpec, rest: BoneWorld = restWorld(info)): SkinGeom {
  const bone = info.bone(spec.bone);
  const chain = spec.chain.map((id) => info.bone(id));
  const n = chain.length - 1;
  const above = new Int16Array(n);
  const below = new Int16Array(n);
  const jointX = new Float32Array(n);
  const jointY = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    above[k] = chain[k];
    below[k] = chain[k + 1];
    jointX[k] = rest.x[chain[k + 1]];
    jointY[k] = rest.y[chain[k + 1]];
  }
  const { cols, rows } = spec;
  const left = rest.x[bone] - part.px;
  const top = rest.y[bone] - part.py;
  const count = (cols + 1) * (rows + 1);
  const restX = new Float32Array(count);
  const restY = new Float32Array(count);
  const u = new Float32Array(count);
  const v = new Float32Array(count);
  const rowJoint = new Uint8Array(rows + 1);
  const rowW = new Float32Array(rows + 1);
  for (let j = 0; j <= rows; j++) {
    const y = top + (j / rows) * part.h;
    let k = 0;
    for (let q = 1; q < n; q++) if (Math.abs(y - jointY[q]) < Math.abs(y - jointY[k])) k = q;
    const b = spec.blend[k];
    rowJoint[j] = k;
    rowW[j] = smooth((y - (jointY[k] - b)) / (2 * b));
    for (let i = 0; i <= cols; i++) {
      const at = j * (cols + 1) + i;
      restX[at] = left + (i / cols) * part.w;
      restY[at] = y;
      u[at] = i / cols;
      v[at] = j / rows;
    }
  }
  const quads = new Uint16Array(cols * rows * 4);
  let o = 0;
  for (let jj = 0; jj < rows; jj++) {
    // Rows drawn later are on top where a fold overlaps: the upper bone's rows by default.
    const j = spec.lowerOnTop ? jj : rows - 1 - jj;
    for (let i = 0; i < cols; i++) {
      const tl = j * (cols + 1) + i;
      quads[o++] = tl;
      quads[o++] = tl + cols + 1;
      quads[o++] = tl + 1;
      quads[o++] = tl + cols + 2;
    }
  }
  return { spec, cols, rows, restX, restY, u, v, rowJoint, rowW, above, below, jointX, jointY, bone, quads };
}

/**
 * Bends the skin to the posed skeleton: writes each vertex's position into
 * `out` at `offset + vertex * stride` (x, then y). Allocation-free.
 */
export function bendSkin(g: SkinGeom, world: BoneWorld, out: Float32Array | number[], stride = 2, offset = 0): void {
  const per = g.cols + 1;
  for (let j = 0; j <= g.rows; j++) {
    const k = g.rowJoint[j];
    const ra = world.r[g.above[k]];
    const a = ra + g.rowW[j] * (world.r[g.below[k]] - ra);
    const c = Math.cos(a);
    const s = Math.sin(a);
    const jx = world.x[g.below[k]];
    const jy = world.y[g.below[k]];
    const rx = g.jointX[k];
    const ry = g.jointY[k];
    for (let i = 0; i <= g.cols; i++) {
      const at = j * per + i;
      const dx = g.restX[at] - rx;
      const dy = g.restY[at] - ry;
      const w = offset + at * stride;
      out[w] = jx + c * dx - s * dy;
      out[w + 1] = jy + s * dx + c * dy;
    }
  }
}

/**
 * Draws a bent skin on a 2D canvas (portraits, snapshots), one textured
 * triangle at a time: `src` holds the part's cell at `texels` per game px;
 * `pos` holds the bent positions (game px, as `bendSkin` writes them).
 */
export function drawSkinCanvas(ctx: CanvasRenderingContext2D, src: CanvasImageSource, g: SkinGeom, pos: ArrayLike<number>, cellW: number, cellH: number): void {
  const q = g.quads;
  for (let o = 0; o < q.length; o += 4) {
    tri(ctx, src, g, pos, q[o], q[o + 1], q[o + 2], cellW, cellH);
    tri(ctx, src, g, pos, q[o + 1], q[o + 3], q[o + 2], cellW, cellH);
  }
}

function tri(ctx: CanvasRenderingContext2D, src: CanvasImageSource, g: SkinGeom, pos: ArrayLike<number>, a: number, b: number, c: number, cw: number, ch: number): void {
  const x0 = pos[a * 2], y0 = pos[a * 2 + 1];
  const x1 = pos[b * 2], y1 = pos[b * 2 + 1];
  const x2 = pos[c * 2], y2 = pos[c * 2 + 1];
  const u0 = g.u[a] * cw, v0 = g.v[a] * ch;
  const u1 = g.u[b] * cw, v1 = g.v[b] * ch;
  const u2 = g.u[c] * cw, v2 = g.v[c] * ch;
  const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
  if (Math.abs(det) < 1e-9) return;
  // The affine map from the texture's triangle to the posed one.
  const m11 = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / det;
  const m12 = ((x2 - x0) * (u1 - u0) - (x1 - x0) * (u2 - u0)) / det;
  const m21 = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / det;
  const m22 = ((y2 - y0) * (u1 - u0) - (y1 - y0) * (u2 - u0)) / det;
  const dx = x0 - m11 * u0 - m12 * v0;
  const dy = y0 - m21 * u0 - m22 * v0;
  // Clip a hair outside the triangle so neighbours meet without a seam.
  const cx = (x0 + x1 + x2) / 3;
  const cy = (y0 + y1 + y2) / 3;
  const grow = (x: number, y: number): [number, number] => {
    const l = Math.hypot(x - cx, y - cy) || 1;
    return [x + ((x - cx) / l) * 0.06, y + ((y - cy) / l) * 0.06];
  };
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...grow(x0, y0));
  ctx.lineTo(...grow(x1, y1));
  ctx.lineTo(...grow(x2, y2));
  ctx.closePath();
  ctx.clip();
  ctx.transform(m11, m21, m12, m22, dx, dy);
  ctx.drawImage(src, 0, 0);
  ctx.restore();
}
