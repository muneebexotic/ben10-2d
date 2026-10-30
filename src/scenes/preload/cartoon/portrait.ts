import type Phaser from 'phaser';
import { INK, LINE, Paint } from './paint';
import { makeHdImage } from './hdTexture';
import { applyFace, makeWorld, Pose, RigInfo, solve, type PartSpec, type RigDef } from './rig';
import { bendSkin, buildSkin, drawSkinCanvas } from './skin';
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
  const ctx = p.ctx;
  const { w, h } = PORTRAIT;
  const paintPart = (part: PartSpec, variant: string): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(part.w * texels);
    canvas.height = Math.ceil(part.h * texels);
    const sub = canvas.getContext('2d');
    if (!sub) return null;
    // The part at the portrait's scale, pivot where the part wants it.
    part.draw(new Paint(sub, texels, part.px, part.py), variant);
    return canvas;
  };
  // Bones with parts and skins, back to front.
  const items: Array<{ z: number; draw: () => void }> = [];
  rig.bones.forEach((bone, i) => {
    const part = bone.part ? parts.get(bone.part) : undefined;
    if (!part || pose.hide[i] === 1) return;
    items.push({
      z: pose.z[i],
      draw: () => {
        const canvas = paintPart(part, info.variants[i][pose.v[i]] ?? '');
        if (!canvas) return;
        ctx.save();
        // Game px of the portrait: centre on (cx, cy), then the bone, then texels 1:1.
        ctx.translate(w / 2, h / 2);
        if (o.flip) ctx.scale(-1, 1);
        ctx.translate((world.x[i] - o.cx) * o.scale, (world.y[i] - o.cy) * o.scale);
        ctx.rotate(world.r[i]);
        ctx.scale(pose.sx[i] / p.res, pose.sy[i] / p.res);
        ctx.drawImage(canvas, -part.px * texels, -part.py * texels);
        ctx.restore();
      },
    });
  });
  for (const spec of rig.skins ?? []) {
    const part = parts.get(spec.part);
    if (!part) continue;
    const geom = buildSkin(info, spec, part);
    if (pose.hide[geom.bone] === 1) continue;
    items.push({
      z: pose.z[geom.bone],
      draw: () => {
        const canvas = paintPart(part, part.variants?.[0] ?? '');
        if (!canvas) return;
        const pos = new Float32Array(geom.u.length * 2);
        bendSkin(geom, world, pos);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        if (o.flip) ctx.scale(-1, 1);
        ctx.scale(o.scale, o.scale);
        ctx.translate(-o.cx, -o.cy);
        drawSkinCanvas(ctx, canvas, geom, pos, part.w * texels, part.h * texels);
        ctx.restore();
      },
    });
  }
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.draw();
}
