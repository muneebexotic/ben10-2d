import type { AnimDef, AssetDef } from '../../assetTypes';
import { benAnims, TEX } from '../../assetKeys';
import { GRINNER_CARTOON, HOUND_CARTOON, JACKBOX_CARTOON, STILTS_CARTOON } from '../../../../config/cartoon/circus';

/**
 * Chapter 8's enemies only ever appear in HD: each one's game sheet is a blank
 * frame strip that carries its animations (names, frames, timing) for the game
 * to drive, and its cartoon rig draws it (HdMirror). The maze's reflections
 * use Ben's own sheet (tinted).
 */
export const CIRCUS_TEX = {
  grinner: GRINNER_CARTOON.sheets[0].texture,
  jackbox: JACKBOX_CARTOON.sheets[0].texture,
  hound: HOUND_CARTOON.sheets[0].texture,
  stilts: STILTS_CARTOON.sheets[0].texture,
} as const;

const blank = (key: string, frame: { w: number; h: number }, frames: number): AssetDef => ({ key, frameWidth: frame.w, frameHeight: frame.h, frames, draw: () => undefined });

const anim = (texture: string, kind: string, name: string, frames: readonly number[], frameRate: number, repeat = -1): AnimDef => ({ key: `${kind}-${name}`, texture, frames, frameRate, repeat });

export const CIRCUS_ASSETS: readonly AssetDef[] = [
  blank(CIRCUS_TEX.grinner, GRINNER_CARTOON.sheets[0].frame, 12),
  blank(CIRCUS_TEX.jackbox, JACKBOX_CARTOON.sheets[0].frame, 8),
  blank(CIRCUS_TEX.hound, HOUND_CARTOON.sheets[0].frame, 6),
  blank(CIRCUS_TEX.stilts, STILTS_CARTOON.sheets[0].frame, 10),
];

const Gr = CIRCUS_TEX.grinner;
const Jb = CIRCUS_TEX.jackbox;
const Hd = CIRCUS_TEX.hound;
const St = CIRCUS_TEX.stilts;

export const CIRCUS_ANIMS: readonly AnimDef[] = [
  anim(Gr, 'grinner', 'idle', [0, 1, 2, 3], 4),
  anim(Gr, 'grinner', 'walk', [4, 5, 6, 7], 6),
  anim(Gr, 'grinner', 'windup', [8, 9], 3, 0),
  anim(Gr, 'grinner', 'throw', [10, 11], 6, 0),
  anim(Jb, 'jackbox', 'idle', [0, 1], 2),
  anim(Jb, 'jackbox', 'wind', [2, 3], 8),
  anim(Jb, 'jackbox', 'pop', [4, 5], 5, 0),
  anim(Jb, 'jackbox', 'jammed', [6, 7], 3),
  anim(Hd, 'hound', 'idle', [0, 1], 2),
  anim(Hd, 'hound', 'float', [0, 1], 2),
  anim(Hd, 'hound', 'stretch', [2, 3], 4),
  anim(Hd, 'hound', 'swoop', [4, 5], 4),
  anim(St, 'stilts', 'idle', [0, 1, 2, 3], 4),
  anim(St, 'stilts', 'walk', [0, 1, 2, 3], 4),
  anim(St, 'stilts', 'windup', [4, 5], 3, 0),
  anim(St, 'stilts', 'kick', [6, 7], 6, 0),
  anim(St, 'stilts', 'topple', [8], 1, 0),
  anim(St, 'stilts', 'down', [9], 1),
  // The maze's reflections play Ben's own sheet (and his rig draws them, tinted).
  ...benAnims('reflection', TEX.ben),
];
