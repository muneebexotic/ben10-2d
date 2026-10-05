/**
 * Kevin Levin: the buddy, the turn and the KEVIN 11 boss. Tells are the same
 * length on every difficulty; rests and punish windows follow pace.
 */

/** How much Kevin has learned about each alien Ben fights him with. */
export const RELIANCE = {
  /** Points per point of damage that alien dealt Kevin. */
  perDamage: 1,
  /** Points per second spent as that alien during the fight. */
  perSecond: 1.5,
  /** Points lost per second while Ben is anything else (human included). */
  decayPerSecond: 4,
  /** Copy level I, II, III thresholds. */
  levels: [25, 60, 110] as const,
  max: 140,
} as const;

/** What his copies shrug off (and what catches him out). */
export const COPY_RULES = {
  /** Damage the copied alien does to its own copy at level I, II, III. */
  sameResist: [0.6, 0.4, 0.2] as const,
  /** A different alien's first hit this soon after he copies: OUT OF SYNC. */
  outOfSyncMs: 2600,
  outOfSyncMultiplier: 1.75,
  outOfSyncStaggerMs: 900,
  /** KEVIN 11 resists each alien by how well he copied it (level 0 = never copied: hurts most). */
  chimeraMultiplier: [1.3, 0.9, 0.65, 0.4] as const,
  /** UNSTABLE! hits while he's overloading. */
  unstableMultiplier: 1.5,
} as const;

export const KEVIN = {
  name: 'KEVIN 11',
  subtitle: 'HE COPIES WHAT YOU USE',
  defeatTitle: 'POWERED DOWN!',
  maxHp: 170,
  phase2At: 0.6,
  phase3At: 0.25,
  body: { width: 16, height: 34 },
  copyBody: { width: 26, height: 40 },
  chimeraBody: { width: 34, height: 52 },
  contactDamage: 1,
  runSpeed: 120,
  /** He keeps this far from Ben while human (he's a ranged fighter). */
  preferDistance: 120,
  wallGap: 40,
  idleMs: [1000, 800, 650] as const,
  /** Human Kevin's thrown bolts. */
  volley: { windupMs: 560, shots: [3, 4, 5] as const, intervalMs: 150, speed: 230, damage: 1, spreadDeg: 9 },
  /** The absorb lunge: crouch and glow (the tell), then he dives at Ben. */
  lunge: { tellMs: 640, speed: 420, durationMs: 420, damage: 1, recoverMs: 750, drainAlienMs: 4000, catchWidth: 30 },
  /** The scan: a beam locks onto Ben for this long (the tell), then he becomes a copy. */
  scan: { lockMs: 850, every: 2 },
  /** A copy lasts this many attacks, then wears off. */
  copyAttacks: [3, 3, 2] as const,
} as const;

/** His copies' moves at copy level I, II, III. */
export const COPY_MOVES = {
  fire: { tellMs: 620, shots: [1, 3, 3] as const, spreadDeg: 14, speed: 220, damage: 1, pillar: { warnMs: 700, liveMs: 380, width: 26, height: 70, damage: 2 } },
  slam: { crouchMs: 600, airMs: 560, height: 110, leaps: [1, 2, 3] as const, landDamage: 2, recoverMs: 600 },
  dash: { tellMs: 700, speed: 520, dashes: [1, 2, 3] as const, damage: 2, pauseMs: 300, lastBoost: 1.25 },
  pounce: { tellMs: 620, airMs: 480, height: 70, pounces: [1, 2, 2] as const, damage: 2, roarRadius: 70, recoverMs: 550 },
  flyer: { riseMs: 500, hoverY: 92, globs: [3, 5, 5] as const, volleys: [1, 1, 2] as const, tellMs: 520, spreadPx: 30, gravity: 520, flightMs: 700, damage: 1 },
  beam: { tellMs: 720, beams: [1, 2, 3] as const, gapMs: 420, lowY: 10, highY: 30 },
  bolt: { tellMs: 560, shots: [3, 4, 5] as const, speed: 240, damage: 1, spreadDeg: 10 },
} as const;

/** Phase 2's tesla coils. */
export const COILS = {
  hp: 1,
  /** Kevin drains a coil (a beam connects), then arcs sweep the floor. */
  drainMs: 700,
  arcWarnMs: 900,
  arcLiveMs: 320,
  arcWidth: 96,
  arcDamage: 2,
  arcsPerDrain: [2, 3] as const,
  arcGapMs: 380,
  everyAttacks: 2,
  /** Upgrade merges in and discharges it into Kevin. */
  overload: { chargeMs: 700, damage: 14, stunMs: 1800, cooldownMs: 5000 },
} as const;

/** KEVIN 11: the hybrid. */
export const CHIMERA = {
  /** Every this many attacks he overloads (UNSTABLE!): stunned and open. */
  overloadEvery: 3,
  overloadMs: 1900,
  idleMs: 600,
} as const;

/** The turn: Kevin's one-alien copy fight in the substation. */
export const TURN = {
  maxHp: 46,
  level: 2,
  /** After the grab: the absorb beam runs this long before Ben reverts. */
  absorbMs: 1300,
  transformMs: 900,
  restoreMs: 1400,
  fleeMs: 1600,
} as const;

/** Kevin as Ben's buddy in the arcade and the subway. */
export const BUDDY = {
  /** He follows Ben's trail this far behind. */
  trailMs: 520,
  /** He stops this close. */
  stopPx: 34,
  /** He catches up (a hop) when he falls this far behind. */
  catchUpPx: 260,
  bolt: { everyMs: [2200, 3400] as const, range: 170, damage: 1.5, speed: 300, knockback: 120 },
  /** How often he chats while following. */
  chatterMs: [9000, 14000] as const,
} as const;

/** Chapter 4's scripted beats (real milliseconds). */
export const CH4_BEATS = {
  intro: { bannerAt: 400, linesAt: 1400 },
  breaker: { absorbMs: 900, surgeMs: 1100 },
  lair: { pinnedMs: 2300 },
  drain: { gulpEveryMs: 700, banks: 5 },
} as const;
