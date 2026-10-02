/** Cohesive night-forest palette. Accents: Omnitrix green, Heatblast fire, Vilgax red. */
export const PALETTE = {
  ink: 0x0b0d17,
  inkSoft: 0x1a1d2e,
  white: 0xf4f4f0,
  cream: 0xfff6dc,

  sky0: 0x060919,
  sky1: 0x0e1437,
  sky2: 0x24205a,
  sky3: 0x4a2a6e,
  horizonGlow: 0x7a3a6a,
  moon: 0xe9f1ff,
  star: 0xcfe0ff,

  mountain: 0x1a1f47,
  pineFar: 0x15204a,
  pineMid: 0x0f1834,
  pineNear: 0x0a1026,
  fog: 0x6b78b8,

  grass0: 0x2f6b4a,
  grass1: 0x4d9a5c,
  grass2: 0x86c96b,
  dirt0: 0x2b1c24,
  dirt1: 0x3f2a2f,
  dirt2: 0x5a3c38,
  rock0: 0x262a3f,
  rock1: 0x3b4160,
  rock2: 0x5d6690,
  wood0: 0x3a2218,
  wood1: 0x6b4128,
  wood2: 0x9a6536,

  water0: 0x14365c,
  water1: 0x2b6f9e,
  water2: 0x7fd3ff,

  omnitrix: 0x5dff5a,
  omnitrixDark: 0x1f9c2c,
  omnitrixDeep: 0x0d3d18,
  omnitrixGlow: 0xb8ffb0,

  fire0: 0xfff3b0,
  fire1: 0xffd23f,
  fire2: 0xff8a1e,
  fire3: 0xe8461e,
  fire4: 0x8f1f12,
  magma0: 0x3a120c,
  magma1: 0x5c1e12,

  enemy: 0xff3048,
  enemyDark: 0x9c1028,
  enemyGlow: 0xff7a8c,
  metal0: 0x1e2133,
  metal1: 0x33384f,
  metal2: 0x575e80,
  metal3: 0x9099c0,

  jammer: 0x6fb8ff,
  jammerDark: 0x2a4f9e,
  gold: 0xffd84a,
  goldDark: 0xb07a18,
  heart: 0xff4466,
  heartDark: 0x9c1c3a,

  skin0: 0xf2c29b,
  skin1: 0xd49a74,
  hair0: 0x5a3219,
  hair1: 0x86502a,
  shirt: 0xf4f4f0,
  shirtShade: 0xc8ccd8,
  stripe: 0x1b1b22,
  pants0: 0x3e5530,
  pants1: 0x56713f,
  shoe: 0x262833,

  // Road Trip: desert highway at golden hour.
  sand0: 0x7a4a30,
  sand1: 0xa8673f,
  sand2: 0xd08f55,
  sand3: 0xf0c27a,
  mesa0: 0x4a2230,
  mesa1: 0x7a3436,
  mesa2: 0xa8533e,
  mesa3: 0xd27d52,
  sunsetTop: 0x2a1d5c,
  sunsetMid: 0x9c3f6e,
  sunsetLow: 0xf2774a,
  sunsetGlow: 0xffd27a,
  sun: 0xffe59a,
  asphalt0: 0x1d1c26,
  asphalt1: 0x2c2b38,
  asphalt2: 0x45444f,
  lineYellow: 0xf2c94c,
  rust0: 0x6a2e1e,
  rust1: 0xa04a2a,
  neonPink: 0xff5fa8,
  neonBlue: 0x5fd8ff,
  max: 0xd8473f,
  gwen: 0xff8a3d,

  // Dr. Animo: a natural history museum at night, and his mutagen.
  marble0: 0x24222f,
  marble1: 0x413f55,
  marble2: 0x7c7a98,
  marble3: 0xbfbdd6,
  hall0: 0x16141f,
  hall1: 0x262236,
  hall2: 0x3a3450,
  hall3: 0x564d72,
  brass: 0xd6aa52,
  brassDark: 0x7d5a26,
  velvet: 0x8a2236,
  velvetDark: 0x4a1020,
  moonbeam: 0x9fb8ff,
  mutagen: 0x46ffb4,
  mutagenDark: 0x168a64,
  mutagenGlow: 0xc2ffe6,
  slime: 0xd4e83a,
  slimeDark: 0x7f8c1c,
  animo: 0xb27ae8,
  kevin: 0xc89cff,

  uiPanel: 0x121626,
  uiPanelLight: 0x232a45,
  uiText: 0xf4f4f0,
  uiDim: 0x8a93b8,
} as const;

export function toCss(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
