/**
 * Chapter 6's colours: Karachi at night. Pink sandstone and blue tilework for
 * the palace, warm bulbs and truck-art paint at the fair, the sea and the
 * harbour lights, Hex's violet and Charmcaster's magenta.
 */
export const KARACHI = {
  // The night sky over the sea, with the city's glow at the horizon.
  sky0: 0x0c0a24,
  sky1: 0x1e1846,
  sky2: 0x4a2a5e,
  sky3: 0x8a4a62,
  glow: 0xe8946a,
  // The sea and its reflections.
  sea0: 0x070c1e,
  sea1: 0x0e1a36,
  sea2: 0x1c3058,
  seaGlint: 0xffd890,
  // The skyline: far, near, lit windows.
  far0: 0x1a1838,
  far1: 0x24224a,
  near0: 0x121228,
  near1: 0x1c1c38,
  window: 0xffd27a,
  windowCool: 0x9ad8ff,
  domeLit: 0xf4f0e6,
  domeShade: 0xb8b8c8,
  // The promenade and the beach.
  pave0: 0x6a6070,
  pave1: 0x8a8090,
  pave2: 0xa89ca8,
  pave3: 0xc8bcc0,
  sand0: 0x8a6a4a,
  sand1: 0xa8845a,
  sand2: 0xc8a26e,
  // Pink sandstone (Mohatta-style) and its carved trim.
  stone0: 0x7a3a46,
  stone1: 0xa24e58,
  stone2: 0xc86a6e,
  stone3: 0xe89488,
  stone4: 0xf8bca8,
  // Blue tilework and marble.
  tile0: 0x1a3a7a,
  tile1: 0x2a6ac8,
  tile2: 0x6ab8f0,
  marble: 0xe8e2d8,
  marbleShade: 0xb8b0a8,
  // Old cellar and tunnel stone.
  cellar0: 0x2a2030,
  cellar1: 0x3e3044,
  cellar2: 0x56465a,
  // Wood: carved jharokha balconies, bookshelves, stalls.
  wood0: 0x3a1e14,
  wood1: 0x5a321e,
  wood2: 0x7e4a2a,
  wood3: 0xa86a3a,
  // Brass and gold (the clockwork, lamps, trim).
  brass0: 0x6a4a1a,
  brass1: 0xa87a2a,
  brass2: 0xe0b04a,
  brass3: 0xfff0a0,
  // Truck art: loud and happy.
  truckRed: 0xe8323e,
  truckYellow: 0xffd23a,
  truckGreen: 0x2ab86a,
  truckBlue: 0x2a8ae8,
  truckPink: 0xff5ab4,
  chrome: 0xd8e0e8,
  // Rickshaws: green body, yellow roof.
  rickGreen: 0x2a9a4a,
  rickYellow: 0xf0c83a,
  // Fair bulbs and fabric.
  bulb: 0xfff2b0,
  bulbWarm: 0xffb060,
  canvasA: 0x6a2a8a,
  canvasB: 0xe8c84a,
  // Hex (violet robes) and Charmcaster (magenta and grey), and the Charms of Bezel.
  hex0: 0x2a1a4a,
  hex1: 0x4a2a7a,
  hex2: 0x7a4ac8,
  hexSkin: 0x6a8a9a,
  hexGlow: 0xb88aff,
  charm0: 0x5a1a4a,
  charm1: 0x9a2a7a,
  charm2: 0xe84ab4,
  charmGlow: 0xff8ad8,
  // Rocklings and golems: Charmcaster's stone with glowing seams.
  rock0: 0x3a3440,
  rock1: 0x5a5260,
  rock2: 0x7e7484,
  rock3: 0xa89cac,
  rune: 0xff6ac8,
  // Gargoyles: weathered grey stone.
  garg0: 0x3e4048,
  garg1: 0x5e6068,
  garg2: 0x8a8c94,
  // Enchanted armor: steel with a violet glow behind the visor.
  steel0: 0x3a4250,
  steel1: 0x6a7484,
  steel2: 0xa8b4c4,
  steel3: 0xe0e8f0,
} as const;

/** The four Charms of Bezel, by element (Hex's staff holds them in phase 2). */
export const CHARM_COLORS = {
  fire: 0xff7a2a,
  lightning: 0xffe85a,
  stone: 0xb89a6a,
  wind: 0x8ae8d8,
} as const;
export type CharmElement = keyof typeof CHARM_COLORS;
