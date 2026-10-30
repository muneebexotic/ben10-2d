import type { HumanDims } from '../humanoid';
import type { PartSpec } from '../rig';

/**
 * Characters drawn from their model sheets (cut-out animation): each body
 * part is cut from the generated art by `scripts/cutout/cut.py`, packed into
 * one image under public/assets/cast, and pinned onto the humanoid skeleton.
 * The parts are painted into the rig's HD atlas like drawn parts, so the rest
 * of the rig system doesn't know the difference.
 */

export interface CutoutFrame {
  /** The part in the image (texels) and its pivot inside that rectangle. */
  x: number;
  y: number;
  w: number;
  h: number;
  px: number;
  py: number;
}

export interface CutoutMeta {
  id: string;
  /** The packed image, under the site's base URL. */
  image: string;
  /** Texels per game pixel in the image, and sheet pixels per game pixel (the joints are in sheet pixels). */
  texel: number;
  scale: number;
  headScale: number;
  width: number;
  height: number;
  joints: Readonly<Record<string, readonly [number, number]>>;
  frames: Readonly<Record<string, CutoutFrame>>;
  /** The limbs cut straight, and how far each of their bends spreads either side of its joint (game px). */
  bends: Readonly<Record<string, readonly number[]>>;
}

const images = new Map<string, HTMLImageElement>();

/**
 * Loads the cut-out images (once each; the chapter waits for them before its
 * level starts). One that fails to load leaves its character drawn by code.
 */
export function loadCutouts(metas: readonly CutoutMeta[]): Promise<void> {
  return Promise.all(
    metas.map(
      (m) =>
        new Promise<void>((resolve) => {
          if (images.has(m.id)) return resolve();
          const img = new Image();
          img.onload = () => {
            images.set(m.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `${import.meta.env.BASE_URL}${m.image}`;
        }),
    ),
  ).then(() => undefined);
}

/** The loaded image for a character, if there is one. */
export function cutoutImage(id: string): HTMLImageElement | undefined {
  return images.get(id);
}

type Pt = readonly [number, number];

/** The skeleton's proportions from the joints marked on the sheet. */
export function cutoutDims(m: CutoutMeta): HumanDims {
  const j = (name: string): Pt => {
    const p = m.joints[name];
    if (!p) throw new Error(`${m.id}: no joint ${name}`);
    return p;
  };
  const S = m.scale;
  const dist = (a: string, b: string) => Math.hypot(j(a)[0] - j(b)[0], j(a)[1] - j(b)[1]) / S;
  const thigh = (dist('hipF', 'kneeF') + dist('hipB', 'kneeB')) / 2;
  const shin = (dist('kneeF', 'ankleF') + dist('kneeB', 'ankleB')) / 2;
  const ankle = (j('floor')[1] - j('shoe')[1]) / S;
  const hip = j('hip');
  // The torso turns about a point just above the hip (humanBones puts it 0.4 px up).
  const torso: Pt = [hip[0], hip[1] - 0.4 * S];
  const inTorso = (name: string) => ({ x: (j(name)[0] - torso[0]) / S, y: (j(name)[1] - torso[1]) / S });
  const neck = j('neck');
  const inHead = (name: string) => ({ x: (j(name)[0] - neck[0]) / S, y: (j(name)[1] - neck[1]) / S });
  const torsoLen = (torso[1] - neck[1]) / S;
  return {
    hip: thigh + shin + ankle,
    thigh,
    shin,
    ankle,
    torso: torsoLen,
    shoulderF: inTorso('shoulderF'),
    shoulderB: inTorso('shoulderB'),
    upperArm: (dist('shoulderF', 'elbowF') + dist('shoulderB', 'elbowB')) / 2,
    forearm: (dist('elbowF', 'wristF') + dist('elbowB', 'wristB')) / 2,
    hipF: (j('hipF')[0] - hip[0]) / S,
    hipB: (j('hipB')[0] - hip[0]) / S,
    neck: inTorso('neck'),
    eyes: inHead('eyes'),
    mouth: inHead('mouth'),
  };
}

/**
 * A rig part painted from the image. Each variant shows the frame
 * `<id>:<variant>` (the head's expressions), or the part's own frame when the
 * sheet has nothing for that variant (an open hand that is still a fist).
 * Variants of different sizes share one cell, big enough for all of them.
 */
export function cutoutPart(m: CutoutMeta, img: CanvasImageSource, id: string, variants?: readonly string[], frameId = id): PartSpec {
  const frameOf = (v: string): CutoutFrame => {
    const f = m.frames[`${frameId}:${v}`] ?? m.frames[frameId];
    if (!f) throw new Error(`${m.id}: no frame ${frameId}`);
    return f;
  };
  const all = (variants ?? ['']).map(frameOf);
  const T = m.texel;
  const left = Math.max(...all.map((f) => f.px)) / T;
  const top = Math.max(...all.map((f) => f.py)) / T;
  const right = Math.max(...all.map((f) => f.w - f.px)) / T;
  const bottom = Math.max(...all.map((f) => f.h - f.py)) / T;
  return {
    id,
    w: left + right,
    h: top + bottom,
    px: left,
    py: top,
    variants,
    draw: (p, v) => {
      const f = frameOf(v);
      p.ctx.imageSmoothingQuality = 'high';
      p.ctx.drawImage(img, f.x, f.y, f.w, f.h, -f.px / T, -f.py / T, f.w / T, f.h / T);
    },
  };
}

/** A part with nothing in it (the eyes and mouth of a head drawn whole). */
export function emptyPart(id: string, variants: readonly string[]): PartSpec {
  return { id, w: 0.5, h: 0.5, px: 0.25, py: 0.25, variants, draw: () => undefined };
}
