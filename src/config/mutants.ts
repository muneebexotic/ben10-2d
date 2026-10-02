/**
 * Dr. Animo's mutant animals. Each one is built to reward a different alien:
 * rats come in packs (Wildmutt's rakes and pounce), roaches wear shells that
 * shrug off claws and fists but roast (Heatblast), lurkers are invisible until
 * sensed or slimed (Wildmutt, Stinkfly), brutes guard their front and
 * charge (Four Arms smashes through; lift one once it stuns itself on a wall),
 * and bats swoop from the dark (one slime glob gums their wings).
 */
export const MUTANT_SHARED = {
  gravity: 1300,
  maxFall: 560,
  /** Ground mutants only notice Ben inside this box around them. */
  noticeX: 190,
  noticeY: 70,
  /** Organic glow under the lightmap. */
  glow: 0x46ffb4,
} as const;

export const RAT = {
  hp: 2,
  body: { width: 14, height: 10 },
  patrolSpeed: 46,
  runSpeed: 150,
  /** Squeaks and crouches for this long before leaping: the tell. */
  crouchMs: 340,
  leapRange: 70,
  leapVx: 230,
  leapVy: 250,
  recoverMs: [520, 760] as const,
  contactDamage: 1,
} as const;

export const ROACH = {
  hp: 4,
  body: { width: 18, height: 9 },
  /** Shell: claws, fists and goo barely scratch it; fire cooks it; flipped over it's soft. */
  shellMultiplier: 0.35,
  fireMultiplier: 2,
  flippedMultiplier: 2,
  scuttleSpeed: 250,
  scuttleMs: 420,
  pauseMs: [520, 900] as const,
  hissMs: 260,
  /** On a ceiling: drops when Ben passes within this many px horizontally. */
  dropRange: 34,
  dropTellMs: 420,
  contactDamage: 1,
} as const;

export const LURKER = {
  hp: 5,
  body: { width: 20, height: 12 },
  /** Hidden: barely a shimmer. Sensed, slimed, hit or spitting: fully there. */
  hiddenAlpha: 0.07,
  revealMs: 1600,
  range: 170,
  aimMs: 620,
  spitSpeed: 260,
  spitGravity: 380,
  spitDamage: 1,
  spitRadius: 5,
  fireIntervalMs: [1900, 2700] as const,
  /** After spitting it slinks a few tiles along the floor. */
  slinkSpeed: 70,
  slinkMs: 700,
  contactDamage: 1,
} as const;

export const BRUTE = {
  hp: 14,
  body: { width: 30, height: 30 },
  /** Hits on its tusked front: only smash gets through properly. Its back and top are open. */
  frontMultiplier: 0.2,
  smashMultiplier: 1.4,
  walkSpeed: 38,
  aggroRange: 230,
  poundMs: 760,
  chargeSpeed: 270,
  chargeMs: 1700,
  skidMs: 520,
  /** Charging into a wall knocks it silly (on its back, liftable). */
  wallStunMs: 2400,
  restMs: [900, 1400] as const,
  contactDamage: 2,
  chargeDamage: 2,
} as const;

export const BAT = {
  hp: 2,
  body: { width: 16, height: 10 },
  wakeRange: 150,
  hoverSpeed: 90,
  hoverOffsetY: -64,
  screechMs: 420,
  swoopSpeed: 300,
  swoopMs: 620,
  recoverMs: [900, 1400] as const,
  contactDamage: 1,
  /** One good glob gums their wings. */
  slimeGroundsAt: 2,
} as const;

/** Mutagen puddles left by spit: they sting for a while, then soak in. */
export const PUDDLE = {
  lifeMs: 3200,
  width: 28,
  damage: 1,
} as const;
