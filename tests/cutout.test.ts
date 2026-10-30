import { describe, expect, it } from 'vitest';
import { BEN_CUT } from '../src/scenes/preload/cartoon/cutout/ben';
import { GWEN_CUT } from '../src/scenes/preload/cartoon/cutout/gwen';
import { MAX_CUT } from '../src/scenes/preload/cartoon/cutout/max';
import { KEVIN_CUT } from '../src/scenes/preload/cartoon/cutout/kevin';
import { cutoutDims, cutoutPart } from '../src/scenes/preload/cartoon/cutout/cutout';
import { SHEET_HEADS, sheetFace as benFace } from '../src/scenes/preload/cartoon/cutout/cutRig';
import { EYES, MOUTHS } from '../src/scenes/preload/cartoon/humanoid';
import { applyFace, makeWorld, Pose, RigInfo, solve, type RigDef } from '../src/scenes/preload/cartoon/rig';
import { bendSkin, buildSkin, restWorld } from '../src/scenes/preload/cartoon/skin';

describe('characters cut from their model sheets', () => {
  it("Ben's skeleton stands on the floor and is about as tall as before", () => {
    const d = cutoutDims(BEN_CUT);
    expect(d.hip).toBeCloseTo(d.thigh + d.shin + d.ankle, 6);
    const neckHeight = d.hip + 0.4 - d.neck.y;
    expect(neckHeight).toBeGreaterThan(22);
    expect(neckHeight).toBeLessThan(28);
    // The near shoulder is behind the far one (he faces right).
    expect(d.shoulderF.x).toBeLessThan(d.shoulderB.x);
  });

  const CAST = [BEN_CUT, GWEN_CUT, MAX_CUT, KEVIN_CUT];

  it('every frame lies inside its image, and every rig part and sheet head has a frame', () => {
    for (const m of CAST) {
      for (const f of Object.values(m.frames)) {
        expect(f.x + f.w, m.id).toBeLessThanOrEqual(m.width);
        expect(f.y + f.h, m.id).toBeLessThanOrEqual(m.height);
      }
      for (const id of ['torso', 'pelvis', 'seat', 'legF', 'legB', 'footF', 'footB', 'armF', 'armB', 'handF', 'handB', ...SHEET_HEADS.map((h) => `head:${h}`)]) {
        expect(m.frames[id], `${m.id} ${id}`).toBeDefined();
      }
      for (const id of ['legF', 'legB', 'armF', 'armB']) expect(m.bends[id]?.length, `${m.id} ${id}`).toBeGreaterThan(0);
    }
  });

  it('everyone stands on the floor at a believable height (Max tallest, then Kevin, Ben and Gwen)', () => {
    const neck = (m: (typeof CAST)[number]) => {
      const d = cutoutDims(m);
      expect(d.hip).toBeCloseTo(d.thigh + d.shin + d.ankle, 6);
      return d.hip + 0.4 - d.neck.y;
    };
    const [ben, gwen, max, kevin] = CAST.map(neck);
    expect(max).toBeGreaterThan(kevin);
    expect(kevin).toBeGreaterThan(gwen);
    expect(ben).toBeGreaterThan(gwen - 1);
    for (const h of [ben, gwen, max, kevin]) {
      expect(h).toBeGreaterThan(20);
      expect(h).toBeLessThan(32);
    }
  });

  it('a part with variants of different sizes gets one cell that holds them all', () => {
    const heads = ['neutral', 'grin', 'pain'];
    const part = cutoutPart(BEN_CUT, {} as CanvasImageSource, 'head', heads);
    for (const v of heads) {
      const f = BEN_CUT.frames[`head:${v}`];
      expect(part.px * BEN_CUT.texel).toBeGreaterThanOrEqual(f.px - 1e-6);
      expect((part.w - part.px) * BEN_CUT.texel).toBeGreaterThanOrEqual(f.w - f.px - 1e-6);
    }
  });

  it("every eyes and mouth look the clips ask for picks one of the sheet's heads", () => {
    const heads = new Set(Object.keys(BEN_CUT.frames).filter((k) => k.startsWith('head:')).map((k) => k.slice(5)));
    for (const e of EYES) for (const m of MOUTHS) expect(heads.has(benFace(e, m)), `${e} + ${m}`).toBe(true);
    expect(benFace('blink', 'smile')).toBe('neutral-blink');
    expect(benFace('open', 'open')).toBe('open');
    expect(benFace('hurt', 'shout')).toBe('pain');
  });

  it('a whole-head face sets the head from the pose and hides the eyes and mouth', () => {
    const part = (id: string, variants?: readonly string[]) => ({ id, w: 1, h: 1, px: 0, py: 0, variants, draw: () => undefined });
    const rig: RigDef = {
      id: 't',
      parts: [part('head', ['a', 'b']), part('eyes', ['open', 'shut']), part('mouth', ['smile', 'open'])],
      bones: [
        { id: 'head', x: 0, y: 0, part: 'head', z: 0, dir: 1 },
        { id: 'eyes', parent: 'head', x: 0, y: 0, part: 'eyes', z: 1, dir: 1 },
        { id: 'mouth', parent: 'head', x: 0, y: 0, part: 'mouth', z: 2, dir: 1 },
      ],
      clips: {},
      fallback: 'idle',
      bounds: { left: 0, right: 0, top: 0, bottom: 0 },
      face: { head: 'head', eyes: 'eyes', mouth: 'mouth', pick: (e, m) => (e === 'shut' || m === 'open' ? 'b' : 'a') },
    };
    const info = new RigInfo(rig);
    const pose = new Pose(info);
    applyFace(info, pose);
    expect(pose.v[0]).toBe(0);
    expect(pose.hide[1]).toBe(1);
    expect(pose.hide[2]).toBe(1);
    pose.show('mouth', 'open');
    applyFace(info, pose);
    expect(pose.v[0]).toBe(1);
  });
});

describe('skins: limbs that bend with their bones', () => {
  const leg = (): RigDef => ({
    id: 'leg',
    parts: [{ id: 'leg', w: 4, h: 12, px: 2, py: 2, draw: () => undefined }],
    bones: [
      { id: 'hip', x: 0, y: -12, z: 0, dir: 1 },
      { id: 'thigh', parent: 'hip', x: 0, y: 0, z: 1, dir: -1 },
      { id: 'shin', parent: 'thigh', x: 0, y: 5, z: 1, dir: -1 },
    ],
    clips: {},
    fallback: 'idle',
    bounds: { left: 0, right: 0, top: 0, bottom: 0 },
    skins: [{ part: 'leg', bone: 'thigh', chain: ['hip', 'thigh', 'shin'], blend: [1, 1.5], cols: 2, rows: 24 }],
  });

  it('at rest the mesh lies exactly where the straight part is drawn', () => {
    const rig = leg();
    const info = new RigInfo(rig);
    const g = buildSkin(info, rig.skins![0], rig.parts[0]);
    const pos = new Float32Array(g.u.length * 2);
    bendSkin(g, restWorld(info), pos);
    for (let k = 0; k < g.u.length; k++) {
      expect(pos[k * 2]).toBeCloseTo(g.restX[k], 5);
      expect(pos[k * 2 + 1]).toBeCloseTo(g.restY[k], 5);
    }
  });

  it('a bent knee turns the shin rigidly about the knee, keeps the hip end still, and blends in between', () => {
    const rig = leg();
    const info = new RigInfo(rig);
    const g = buildSkin(info, rig.skins![0], rig.parts[0]);
    const pose = new Pose(info);
    pose.set('shin', -90);
    const world = makeWorld(info);
    solve(info, pose, world);
    const pos = new Float32Array(g.u.length * 2);
    bendSkin(g, world, pos);
    const knee = { x: world.x[2], y: world.y[2] };
    const last = g.u.length - 1;
    // The foot end: as far from the knee as at rest (angle blending keeps lengths), turned a quarter turn.
    const rest = Math.hypot(g.restX[last] - knee.x, g.restY[last] - knee.y);
    expect(Math.hypot(pos[last * 2] - knee.x, pos[last * 2 + 1] - knee.y)).toBeCloseTo(rest, 4);
    // The top row (above the hip's blend) doesn't move.
    expect(pos[0]).toBeCloseTo(g.restX[0], 5);
    expect(pos[1]).toBeCloseTo(g.restY[0], 5);
    // Every row's weight runs from the upper bone to the lower one without a jump.
    for (let j = 1; j < g.rowW.length; j++) if (g.rowJoint[j] === g.rowJoint[j - 1]) expect(g.rowW[j]).toBeGreaterThanOrEqual(g.rowW[j - 1]);
  });

});
