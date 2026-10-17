import { PALETTE as P } from '../../../config/palette';

/** Chapter 5's colours, shared by the hunters' art, the town's art and the mine's gear (older chapters draw the gear too). */

export const SIXSIX_COLORS = {
  armor0: 0x1c1e28,
  armor1: 0x2c303e,
  armor2: 0x444a5c,
  armor3: 0x6a7288,
  visor: P.sixsix,
  visorGlow: 0xffe0a0,
  blade: 0xd8e0f0,
  flame: P.fire1,
} as const;

export const KRAAB_COLORS = {
  shell0: 0x4a1e14,
  shell1: 0x7a3420,
  shell2: 0xa8583a,
  shell3: 0xd88a5a,
  belly: 0xc8a888,
  eye: 0xffe14a,
  glow: P.kraab,
  glowDark: P.kraabDark,
  metal: 0x3a3a46,
} as const;

export const TETRAX_COLORS = {
  crystal0: 0x0e1a4a,
  crystal1: P.tetraxDark,
  crystal2: P.tetrax,
  crystal3: 0x9ab8ff,
  glint: 0xeef4ff,
  armor: 0x14161e,
  armor2: 0x262a36,
  eye: 0x8affd8,
} as const;

export const WESTERN = {
  dirt0: 0x3a2418,
  dirt1: 0x5a3824,
  dirt2: 0x7a5034,
  dirt3: 0x9a6a44,
  road: 0xb08452,
  rock0: 0x1c1822,
  rock1: 0x2c2634,
  rock2: 0x433a4c,
  rock3: 0x5e5468,
  vein: P.diamondhead,
  plank0: 0x3a2214,
  plank1: 0x6b4226,
  plank2: 0x8f5c34,
  plank3: 0xb07a48,
  nightTop: 0x050818,
  nightMid: 0x101a3e,
  nightLow: 0x2a2a5a,
  horizon: 0x5a4a78,
  mesa0: 0x120e22,
  mesa1: 0x1e1834,
  mesa2: 0x2e2448,
  moonlit: 0x6a6aa8,
} as const;
