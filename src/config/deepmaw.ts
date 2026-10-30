/**
 * DEEPMAW (Chapter 7's boss, in the moon pool). One health bar, three stages,
 * each a hidden checkpoint (a retry starts at the stage Ben fell in):
 *
 * 1. LIGHTS OUT: the pool flooded and dark; only his lure lights it.
 * 2. HIGH AND DRY: Max drains the pool; he flops on its floor.
 * 3. THE MAELSTROM: he rips the outer hatch open; the sea pours in as a whirlpool.
 *
 * Tells are the same length on every difficulty; rests and stun windows follow it (`pace`).
 */
export const DEEPMAW = {
  name: 'DEEPMAW',
  subtitle: 'THE PIRATE OF CELL 7',
  maxHp: 120,
  /** The stages start at these fractions of the bar. */
  stage2At: 0.66,
  stage3At: 0.33,
  /** Drawn this much bigger than his rig. */
  scale: 1.5,
  /** His body for Combat (px, at his scale), around the body's middle. */
  body: { width: 76, height: 62 },
  /** The lure's bulb: hit it to stun him. */
  lureRadius: 9,
  contactDamage: 1,
  /** Body hits: halved while he's guarded, full on dry land or right after a lunge, doubled while he's stunned. */
  guardMultiplier: 0.5,
  openMultiplier: 1,
  stunnedMultiplier: 2,
  /** Lure hit: dazed, jaw hanging open. */
  stunnedMs: 2400,
  /** After a lunge he drifts open for this long. */
  recoverMs: 700,
  transitionMs: 2200,
  dyingMs: 2600,
  /** Rest between attacks, per stage. */
  idleMs: [1500, 1300, 1150] as const,

  lightsOut: {
    /** The moon pool's water (tile row) and his roaming speed (px/s). */
    level: 32,
    driftSpeed: 55,
    /** He keeps about this far from Ben while he circles. */
    keepAway: 150,
    /** The bait: the lure dangled out toward Ben for this long (hittable all along). */
    baitMs: 1700,
    baitSpeed: 38,
    /** The flare: the bulb blazes and freezes, a red line marks the lunge. Aim tracks Ben for the first part. */
    flareMs: 650,
    aimTrackMs: 220,
    lungeSpeed: 380,
    lungeMaxMs: 750,
    lungeDamage: 2,
    /** The lure flash: he rears back (a growing ring), then a burst of light that hurts close by. */
    flashWindupMs: 750,
    flashRadius: 100,
    flashDamage: 1,
    lureLight: { radius: 120, intensity: 1 },
  },

  highAndDry: {
    /** Max drains the pool to its floor (tile row) at this speed (px/s). */
    level: 46,
    drainSpeed: 70,
    /** The tail slam: he rears up, then two shockwaves race along the pool floor. */
    slamWindupMs: 620,
    waveSpeed: 230,
    waveHeight: 14,
    waveDamage: 1,
    /** The rolling chomp: curled up, then a roll across the pool floor, off the far wall and back. */
    rollWindupMs: 520,
    rollSpeed: 250,
    rollDamage: 2,
    /** The belly flop: up out of the pool at Ben (decks too), a zone marks the landing. */
    leapCrouchMs: 380,
    leapFlightMs: 900,
    leapHeight: 150,
    leapZone: 96,
    leapDamage: 2,
    /** Landed on a deck: he flops there (wide open) before he slides back in. */
    deckFlopMs: 1100,
    /** Every this many attacks he dives for the drain: FLOOD WARNING, the water surges up for one lunge. */
    floodEvery: 3,
    floodLevel: 38,
    floodSpeed: 90,
    floodHoldMs: 3200,
  },

  maelstrom: {
    /** The water swings around this row (tiles) by this much, once per period (ms). */
    level: 34,
    swing: 2,
    swingMs: 7000,
    floodSpeed: 120,
    /** The pull toward his mouth (px/s), and how much harder it pulls while he swallows. */
    pull: 55,
    swallowPull: 2.5,
    swallowWindupMs: 800,
    swallowMs: 1900,
    /** Reaching his mouth while he swallows: a bite. */
    biteReach: 28,
    biteDamage: 2,
    /** Then he spits what he caught back out: shots at Ben. */
    spitShots: 3,
    spitGapMs: 160,
    spitSpeed: 230,
    spitDamage: 1,
    /** Debris circling him. */
    debris: 3,
    debrisRadius: 118,
    debrisSpin: 0.9,
    debrisDamage: 1,
  },

  /** Max's booth over the pool: its bottom edge (tile row). The water never rises past it. */
  boothRow: 32,
  /** Gwen shields Ben from the booth once per stage when he's this low. */
  shield: { atHp: 2, ms: 2600 },
} as const;
