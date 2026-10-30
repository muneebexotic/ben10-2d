import type Phaser from 'phaser';
import { INK, LINE, Paint } from './paint';
import { makeHdImage } from './hdTexture';
import { applyFace, makeWorld, Pose, RigInfo, solve, type RigDef } from './rig';
import { PORTRAIT } from '../portraits';

export interface RigPortrait {
  /** The pose: a clip and the time in it. */
  clip: string;
  t?: number;
  /** The point of the rig (its own space) at the middle of the portrait, and how big the rig is drawn. */
  cx: number;
  cy: number;
  scale: number;
  /** The panel behind the face. */
  bg: number;
  glow?: number;
  /** Faces left (portraits of the far speaker). */
  flip?: boolean;
}

/**
 * A dialogue portrait painted from a character's rig in a pose (Act 3): the
 * rig drawn big inside the portrait frame, so speakers who have no pixel
 * portrait (Deepmaw, Magister Korr) look like their rigs.
 */
export function makeRigPortrait(scene: Phaser.Scene, key: string, rig: RigDef, o: RigPortrait, res: number): void {
  const { w, h } = PORTRAIT;
  makeHdImage(scene, key, w, h, res, (p) => {
    const panel = p.rrect(0.5, 0.5, w - 1, h - 1, 4);
    p.fill(panel, o.bg);
    if (o.glow !== undefined) p.within(panel, () => p.glow(w / 2, h * 0.4, w * 0.6, o.glow!, 0.35));
    p.within(panel, () => drawPosed(p, rig, o));
    p.stroke(panel, INK, LINE * 0.8);
  });
}

/** Paints the posed rig into the current frame: each part into its own canvas, then placed at its bone. */
function drawPosed(p: Paint, rig: RigDef, o: RigPortrait): void {
  const info = new RigInfo(rig);
  const pose = new Pose(info);
  (rig.clips[o.clip] ?? rig.clips[rig.fallback]).pose(o.t ?? 0, pose);
  applyFace(info, pose);
  const world = makeWorld(info);
  solve(info, pose, world);
  const parts = new Map(rig.parts.map((part) => [part.id, part]));
  const texels = p.res * o.scale;
  const order = rig.bones.map((_, i) => i).filter((i) => rig.bones[i].part !== undefined && pose.hide[i] !== 1).sort((a, b) => pose.z[a] - pose.z[b]);
  const ctx = p.ctx;
  const { w, h } = PORTRAIT;
  for (const i of order) {
    const part = parts.get(rig.bones[i].part!);
    if (!part) continue;
    const variant = info.variants[i][pose.v[i]] ?? '';
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(part.w * texels);
    canvas.height = Math.ceil(part.h * texels);
    const sub = canvas.getContext('2d');
    if (!sub) continue;
    // The part at the portrait's scale, pivot where the part wants it.
    part.draw(new Paint(sub, texels, part.px, part.py), variant);
    ctx.save();
    // Game px of the portrait: centre on (cx, cy), then the bone, then texels 1:1.
    ctx.translate(w / 2, h / 2);
    if (o.flip) ctx.scale(-1, 1);
    ctx.translate((world.x[i] - o.cx) * o.scale, (world.y[i] - o.cy) * o.scale);
    ctx.rotate(world.r[i]);
    ctx.scale(pose.sx[i] / p.res, pose.sy[i] / p.res);
    ctx.drawImage(canvas, -part.px * texels, -part.py * texels);
    ctx.restore();
  }
}
