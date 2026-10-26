import type { AnimDef, AssetDef } from '../../assetTypes';
import { WARDEN_CARTOON } from '../../../../config/cartoon/warden';
import { GRUNT_CARTOON } from '../../../../config/cartoon/grunt';
import { EEL_CARTOON } from '../../../../config/cartoon/eel';
import { JELLY_CARTOON } from '../../../../config/cartoon/jelly';
import { GNASHER_CARTOON } from '../../../../config/cartoon/gnasher';

/**
 * Chapter 7's enemies only ever appear in HD: each one's game sheet is a
 * blank frame strip that carries its animations (names, frames, timing) for
 * the game to drive, and its cartoon rig draws it (HdMirror).
 */
export const DEEP_TEX = {
  warden: 'deep-warden',
  grunt: 'deep-grunt',
  eel: 'deep-eel',
  jelly: 'deep-jelly',
  gnasher: 'deep-gnasher',
} as const;

const blank = (key: string, frame: { w: number; h: number }, frames: number): AssetDef => ({ key, frameWidth: frame.w, frameHeight: frame.h, frames, draw: () => undefined });

const anim = (texture: string, kind: string, name: string, frames: readonly number[], frameRate: number, repeat = -1): AnimDef => ({ key: `${kind}-${name}`, texture, frames, frameRate, repeat });

export const DEEP_ASSETS: readonly AssetDef[] = [
  blank(DEEP_TEX.warden, WARDEN_CARTOON.sheets[0].frame, 8),
  blank(DEEP_TEX.grunt, GRUNT_CARTOON.sheets[0].frame, 16),
  blank(DEEP_TEX.eel, EEL_CARTOON.sheets[0].frame, 10),
  blank(DEEP_TEX.jelly, JELLY_CARTOON.sheets[0].frame, 4),
  blank(DEEP_TEX.gnasher, GNASHER_CARTOON.sheets[0].frame, 10),
];

const W = DEEP_TEX.warden;
const G = DEEP_TEX.grunt;
const E = DEEP_TEX.eel;
const J = DEEP_TEX.jelly;
const F = DEEP_TEX.gnasher;

export const DEEP_ANIMS: readonly AnimDef[] = [
  anim(W, 'warden', 'idle', [0, 1, 2, 3], 4),
  anim(W, 'warden', 'lock', [4, 5], 8),
  anim(W, 'warden', 'fire', [6, 7], 8, 0),
  anim(G, 'grunt', 'idle', [0, 1, 2, 3], 4),
  anim(G, 'grunt', 'walk', [4, 5, 6, 7], 6),
  anim(G, 'grunt', 'windup', [8, 9, 10], 5, 0),
  anim(G, 'grunt', 'throw', [11, 12], 6, 0),
  anim(G, 'grunt', 'flop', [13, 14], 4),
  anim(G, 'grunt', 'idleBare', [0, 1, 2, 3], 4),
  anim(G, 'grunt', 'walkBare', [4, 5, 6, 7], 6),
  anim(G, 'grunt', 'windupBare', [8, 9, 10], 5, 0),
  anim(G, 'grunt', 'throwBare', [11, 12], 6, 0),
  anim(E, 'eel', 'idle', [0, 1, 2, 3], 4),
  anim(E, 'eel', 'swim', [0, 1, 2, 3], 4),
  anim(E, 'eel', 'charge', [4, 5], 8),
  anim(E, 'eel', 'zap', [6, 7], 7, 0),
  anim(E, 'eel', 'flop', [8, 9], 4),
  anim(J, 'jelly', 'idle', [0, 1, 2, 3], 4),
  anim(J, 'jelly', 'pulse', [0, 1, 2, 3], 4),
  anim(F, 'gnasher', 'idle', [0, 1, 2, 3], 4),
  anim(F, 'gnasher', 'swim', [0, 1, 2, 3], 4),
  anim(F, 'gnasher', 'bunch', [4, 5], 8),
  anim(F, 'gnasher', 'dart', [6, 7], 8),
  anim(F, 'gnasher', 'flop', [8, 9], 4),
];
