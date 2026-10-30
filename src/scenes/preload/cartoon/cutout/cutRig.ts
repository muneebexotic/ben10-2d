import { EYES, humanRig, MOUTHS, type MoveStyle } from '../humanoid';
import type { BoneSpec, ClipDef, PartSpec, RigDef, RigInfo, SkinSpec } from '../rig';
import { cutoutDims, cutoutPart, emptyPart, type CutoutMeta } from './cutout';
import { showHumanClips } from '../showClips';

/**
 * A humanoid cut from its model sheet (`scripts/cutout`): the sheet's parts on
 * the humanoid skeleton, its limbs as bending meshes, a seat behind the legs,
 * the head behind the shirt (its neck tucks into the collar) and whole heads
 * from the close-ups standing in for eyes and mouth. Every model sheet follows
 * the prompt pack's layout, so they share the heads and how a face picks one.
 */

/** The heads every sheet gives: its six close-ups, the neutral one blinking, talking, and both. */
export const SHEET_HEADS = ['neutral', 'neutral-blink', 'open', 'open-blink', 'grin', 'shout', 'wide', 'pain', 'talk'] as const;

/** Which of the sheet's heads shows for the eyes and mouth a clip asks for. */
export function sheetFace(eyes: string, mouth: string): string {
  if (eyes === 'hurt' || eyes === 'shut' || mouth === 'grit') return 'pain';
  if (mouth === 'shout') return 'shout';
  if (eyes === 'wide' || mouth === 'o') return 'wide';
  if (eyes === 'happy' || mouth === 'grin') return 'grin';
  if (eyes === 'side') return 'talk';
  const open = mouth === 'open';
  if (eyes === 'blink') return open ? 'open-blink' : 'neutral-blink';
  return open ? 'open' : 'neutral';
}

/** Room (game px) around a hand that holds something painted (a blaster). */
const HELD_MARGIN = 6;
/** The head draws behind the shirt (the collar hides where its neck ends). */
const HEAD_Z = 45;
/** The seat of the pants: behind both legs, so a leg swinging away never opens a gap at the crotch. */
const SEAT: BoneSpec = { id: 'seat', parent: 'hip', x: 0, y: 0, part: 'seat', z: 11, dir: 1 };
/** The shirt's colour behind the waistband: when the body leans, no gap opens between the hem and the belt. */
const WAIST: BoneSpec = { id: 'waist', parent: 'hip', x: 0, y: 0, part: 'waist', z: 39, dir: 1 };

export interface CutRigOptions {
  id: string;
  meta: CutoutMeta;
  img: HTMLImageElement;
  style: MoveStyle;
  bounds: RigDef['bounds'];
  clips?: (info: RigInfo, base: Record<string, ClipDef>) => Record<string, ClipDef>;
  /** Each hand's looks (the sheet has fists only: other looks show the fist unless `hands` paints them). */
  handVariants?: readonly string[];
  /** Parts drawn in code on top of the cut ones (a held blaster, a spell's glow), and bones for them. */
  extraParts?: readonly PartSpec[];
  extraBones?: readonly BoneSpec[];
  /** Hand looks painted over the cut fist (a blaster in the grip). */
  hands?: (p: Parameters<PartSpec['draw']>[0], variant: string, far: boolean) => void;
}

export function cutHumanRig(o: CutRigOptions): RigDef {
  const m = o.meta;
  const part = (id: string, variants?: readonly string[]) => cutoutPart(m, o.img, id, variants);
  const hand = (id: string, far: boolean): PartSpec => {
    const base = part(id, o.handVariants ?? ['fist', 'open', 'point']);
    if (!o.hands) return base;
    const paint = o.hands;
    // Room around the fist for what it holds.
    const m = HELD_MARGIN;
    return { ...base, w: base.w + m * 2, h: base.h + m * 2, px: base.px + m, py: base.py + m, draw: (p, v) => (base.draw(p, v), paint(p, v, far)) };
  };
  const parts: PartSpec[] = [
    // The limbs aren't on bones: their skins draw them.
    ...['torso', 'pelvis', 'seat', 'legF', 'legB', 'footF', 'footB', 'armF', 'armB'].map((id) => part(id)),
    hand('handF', false),
    hand('handB', true),
    part('head', SHEET_HEADS),
    emptyPart('eyes', EYES),
    emptyPart('mouth', MOUTHS),
    ...(o.extraParts ?? []),
  ];
  // The shared show-look clips keep raised arms off the face; the character's own go on top.
  const clips = (info: RigInfo, base: Record<string, ClipDef>) => ({ ...showHumanClips(info, base), ...(o.clips?.(info, base) ?? {}) });
  const under = m.frames.waist ? [WAIST] : [];
  if (m.frames.waist) parts.push(part('waist'));
  const rig = humanRig({ id: o.id, dims: cutoutDims(m), parts, style: o.style, bounds: o.bounds, extraBones: [SEAT, ...under, ...(o.extraBones ?? [])], clips });
  const b = m.bends;
  const skins: SkinSpec[] = [
    { part: 'legF', bone: 'thighF', chain: ['hip', 'thighF', 'shinF'], blend: b.legF, cols: 3, rows: 28 },
    { part: 'legB', bone: 'thighB', chain: ['hip', 'thighB', 'shinB'], blend: b.legB, cols: 3, rows: 28 },
    // The near forearm folds over its upper arm; the far upper arm over its forearm.
    { part: 'armF', bone: 'armUF', chain: ['armUF', 'armLF'], blend: b.armF, cols: 2, rows: 22, lowerOnTop: true },
    { part: 'armB', bone: 'armUB', chain: ['armUB', 'armLB'], blend: b.armB, cols: 2, rows: 22 },
  ];
  return {
    ...rig,
    bones: rig.bones.map((bone) => (bone.id === 'head' ? { ...bone, z: HEAD_Z } : bone)),
    face: { head: 'head', eyes: 'eyes', mouth: 'mouth', pick: sheetFace },
    skins,
  };
}
