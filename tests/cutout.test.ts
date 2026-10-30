import { describe, expect, it } from 'vitest';
import { BEN_CUT } from '../src/scenes/preload/cartoon/cutout/ben';
import { cutoutDims, cutoutPart } from '../src/scenes/preload/cartoon/cutout/cutout';
import { benFace } from '../src/scenes/preload/cartoon/characters/ben';
import { EYES, MOUTHS } from '../src/scenes/preload/cartoon/humanoid';
import { applyFace, Pose, RigInfo, type RigDef } from '../src/scenes/preload/cartoon/rig';

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

  it('every frame lies inside the image, and every rig part has a frame', () => {
    for (const f of Object.values(BEN_CUT.frames)) {
      expect(f.x + f.w).toBeLessThanOrEqual(BEN_CUT.width);
      expect(f.y + f.h).toBeLessThanOrEqual(BEN_CUT.height);
    }
    for (const id of ['torso', 'pelvis', 'thighF', 'thighB', 'shinF', 'shinB', 'footF', 'footB', 'armUF', 'armUB', 'armLF', 'armLB', 'handF', 'handB', 'head:neutral', 'head:neutral-blink', 'head:open']) {
      expect(BEN_CUT.frames[id], id).toBeDefined();
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
