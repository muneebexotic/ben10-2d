import type Phaser from 'phaser';
import type { CartoonManifest } from '../../../config/cartoon/types';
import { BEN_CARTOON } from '../../../config/cartoon/ben';
import type { AnimDef } from '../assetTypes';
import { makeHdTexture } from './hdTexture';
import { rigFrames, rigTextureKey, type RigDef } from './rig';
import { benRig } from './characters/ben';
import { mirrorSpec, type MirrorSpec } from '../../../systems/hd/HdMirror';

/** A character the HD chapters can draw: its manifest and its rig. */
export interface CastRig {
  manifest: CartoonManifest;
  rig: () => RigDef;
}

/** Every rigged character, by manifest id. */
export const CARTOON_CAST: readonly CastRig[] = [{ manifest: BEN_CARTOON, rig: benRig }];

const built = new Map<string, RigDef>();

/** A character's rig (built once). */
export function castRig(id: string): RigDef {
  let rig = built.get(id);
  if (!rig) {
    const entry = CARTOON_CAST.find((c) => c.manifest.id === id);
    if (!entry) throw new Error(`No cartoon rig for ${id}`);
    rig = entry.rig();
    built.set(id, rig);
  }
  return rig;
}

/** Paints every rig's parts atlas at `res` (once per key). Returns the time it took (ms). */
export function makeCastArt(scene: Phaser.Scene, res: number): number {
  let ms = 0;
  for (const c of CARTOON_CAST) ms += makeHdTexture(scene, rigTextureKey(c.manifest.id), rigFrames(castRig(c.manifest.id)), res);
  return ms;
}

/** The mirror specs for every game sheet a rig draws (from the game's own animations for that sheet). */
export function castMirrorSpecs(anims: readonly AnimDef[]): Array<{ texture: string; spec: MirrorSpec }> {
  const out: Array<{ texture: string; spec: MirrorSpec }> = [];
  for (const c of CARTOON_CAST) {
    const rig = castRig(c.manifest.id);
    for (const sheet of c.manifest.sheets) out.push({ texture: sheet.texture, spec: mirrorSpec(rig, rigTextureKey(c.manifest.id), sheet.texture, sheet.frame, anims) });
  }
  return out;
}
