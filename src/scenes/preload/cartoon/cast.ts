import type Phaser from 'phaser';
import type { CartoonManifest } from '../../../config/cartoon/types';
import { BEN_CARTOON } from '../../../config/cartoon/ben';
import { GWEN_CARTOON } from '../../../config/cartoon/gwen';
import { MAX_CARTOON } from '../../../config/cartoon/max';
import { KEVIN_CARTOON } from '../../../config/cartoon/kevin';
import { HEATBLAST_CARTOON } from '../../../config/cartoon/heatblast';
import { FOURARMS_CARTOON } from '../../../config/cartoon/fourarms';
import { XLR8_CARTOON } from '../../../config/cartoon/xlr8';
import { WILDMUTT_CARTOON } from '../../../config/cartoon/wildmutt';
import { STINKFLY_CARTOON } from '../../../config/cartoon/stinkfly';
import { UPGRADE_CARTOON } from '../../../config/cartoon/upgrade';
import { DIAMONDHEAD_CARTOON } from '../../../config/cartoon/diamondhead';
import { GHOSTFREAK_CARTOON } from '../../../config/cartoon/ghostfreak';
import { GREYMATTER_CARTOON } from '../../../config/cartoon/greymatter';
import { RIPJAWS_CARTOON } from '../../../config/cartoon/ripjaws';
import { WARDEN_CARTOON } from '../../../config/cartoon/warden';
import { GRUNT_CARTOON } from '../../../config/cartoon/grunt';
import { EEL_CARTOON } from '../../../config/cartoon/eel';
import { JELLY_CARTOON } from '../../../config/cartoon/jelly';
import { GNASHER_CARTOON } from '../../../config/cartoon/gnasher';
import { DEEPMAW_CARTOON } from '../../../config/cartoon/deepmaw';
import type { AnimDef } from '../assetTypes';
import { makeHdTexture } from './hdTexture';
import { rigFrames, rigTextureKey, type RigDef } from './rig';
import { benRig } from './characters/ben';
import { gwenRig } from './characters/gwen';
import { maxRig } from './characters/max';
import { kevinRig } from './characters/kevin';
import { heatblastRig } from './characters/heatblast';
import { fourarmsRig } from './characters/fourarms';
import { xlr8Rig } from './characters/xlr8';
import { wildmuttRig } from './characters/wildmutt';
import { stinkflyRig } from './characters/stinkfly';
import { upgradeRig } from './characters/upgrade';
import { diamondheadRig } from './characters/diamondhead';
import { ghostfreakRig } from './characters/ghostfreak';
import { greymatterRig } from './characters/greymatter';
import { ripjawsRig } from './characters/ripjaws';
import { wardenRig } from './characters/deep/warden';
import { gruntRig } from './characters/deep/grunt';
import { eelRig } from './characters/deep/eel';
import { jellyRig } from './characters/deep/jelly';
import { gnasherRig } from './characters/deep/gnasher';
import { deepmawRig } from './characters/deepmaw';
import { mirrorSpec, type MirrorSpec } from '../../../systems/hd/HdMirror';

/** A character the HD chapters can draw: its manifest and its rig. */
export interface CastRig {
  manifest: CartoonManifest;
  rig: () => RigDef;
}

/** Every rigged character, by manifest id. */
export const CARTOON_CAST: readonly CastRig[] = [
  { manifest: BEN_CARTOON, rig: benRig },
  { manifest: GWEN_CARTOON, rig: gwenRig },
  { manifest: MAX_CARTOON, rig: maxRig },
  { manifest: KEVIN_CARTOON, rig: kevinRig },
  { manifest: HEATBLAST_CARTOON, rig: heatblastRig },
  { manifest: FOURARMS_CARTOON, rig: fourarmsRig },
  { manifest: XLR8_CARTOON, rig: xlr8Rig },
  { manifest: WILDMUTT_CARTOON, rig: wildmuttRig },
  { manifest: STINKFLY_CARTOON, rig: stinkflyRig },
  { manifest: UPGRADE_CARTOON, rig: upgradeRig },
  { manifest: DIAMONDHEAD_CARTOON, rig: diamondheadRig },
  { manifest: GHOSTFREAK_CARTOON, rig: ghostfreakRig },
  { manifest: GREYMATTER_CARTOON, rig: greymatterRig },
  { manifest: RIPJAWS_CARTOON, rig: ripjawsRig },
  // Chapter 7's enemies.
  { manifest: WARDEN_CARTOON, rig: wardenRig },
  { manifest: GRUNT_CARTOON, rig: gruntRig },
  { manifest: EEL_CARTOON, rig: eelRig },
  { manifest: JELLY_CARTOON, rig: jellyRig },
  { manifest: GNASHER_CARTOON, rig: gnasherRig },
  // Chapter 7's boss (drawn by its own actor, not over a game sheet).
  { manifest: DEEPMAW_CARTOON, rig: deepmawRig },
];

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
