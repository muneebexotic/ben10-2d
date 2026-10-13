/**
 * Chapter 5's three bounty hunters (in their set pieces and as THE HUNTERS)
 * and the chapter's story timings. Tells are the same length on every
 * difficulty; rests and punish windows follow pace (see Difficulty).
 */

/** Sixsix: jetpack, wrist blades, shoulder cannons. Fast on the ground, untouchable in the sky. */
export const SIXSIX = {
  body: { width: 20, height: 40 },
  /** A Main Street duel: he lands, fights for this long (or until he's taken `duelHp`), then blasts off. */
  duelMs: 13000,
  duelHp: 22,
  walkSpeed: 70,
  /** The blade combo: a windup (the tell: a zone ahead), then a dash-slash; the next slash of the combo winds up quicker. */
  slash: { windupMs: 460, chainWindupMs: 300, dashSpeed: 340, dashMs: 170, damage: 2, combo: [2, 3] as const, reach: 34 },
  /** The wrist cannon: an aim line, then three bolts. */
  cannon: { windupMs: 650, bolts: 3, gapMs: 110, speed: 300, damage: 1 },
  /** A jetpack hop back after a combo. */
  hop: { vx: 170, vy: -260, ms: 420 },
  restMs: [600, 1000] as const,
  contactDamage: 1,
  /** Boss phase 2, up the lift shaft. */
  boss: {
    hp: 70,
    /** Hovers this far above Ben (px), over the far side of the shaft from him (this far in from its wall), drifting a little. */
    hoverAbove: 120,
    hoverInset: 16,
    hoverDriftPx: 8,
    moveSpeed: 120,
    /** Salvos onto Ben's ledge, then a cannon burst, in turn. */
    salvoEveryMs: [2600, 3400] as const,
    salvo: { missiles: 3, spreadPx: 26, warnMs: 950 },
    /** Reflected missiles wreck the jetpack. */
    reflectedMultiplier: 2.2,
    /** The jetpack sputters (a punish window: he drops toward Ben). */
    sputterEvery: 18,
    sputterMs: 2200,
  },
  /** Strafing runs while Kraab fights (boss phase 1): a salvo now and then. */
  strafeEveryMs: [8500, 11000] as const,
} as const;

/** Kraab: a crab-armoured braggart with a claw cannon. His front shell shrugs off everything but a smash. */
export const KRAAB = {
  body: { width: 40, height: 40 },
  walkSpeed: 34,
  /** Hits on his front shell that aren't smashes (his back and the cannon's charge are open). */
  shellMultiplier: 0.3,
  /** Burrowing ambushes: sink, a crack races at Ben, holds under him (the tell), then he erupts. */
  burrow: { sinkMs: 520, tunnelSpeed: 170, tunnelMaxMs: 2200, holdMs: 650, eruptDamage: 2, eruptMs: 420, dizzyMs: 1300, eruptRadius: 30 },
  /** The claw cannon: a long glowing charge (the tell, and his back is to nothing: the claw is open), then a big blast. */
  cannon: { chargeMs: 1300, speed: 260, damage: 3, radius: 9, blastRadius: 34, reflectDamage: 14 },
  /** A claw snap up close. */
  pinch: { windupMs: 520, damage: 2, reach: 40 },
  restMs: [700, 1100] as const,
  contactDamage: 1,
  /** Boss phase 1. */
  boss: {
    hp: 90,
    /** The cracked crystal pillar: hits it takes (smash, a thrown enemy, a reflected blast) before it comes down on him. */
    pillarHits: 3,
    /** The pillar coming down takes this off Kraab. */
    pillarDamage: 26,
  },
  /** The rail tunnels' ambushes: how long he stays up after erupting, and the claw cannon from the last one. */
  hunt: { stayMs: 2600 },
} as const;

/** Tetrax Shard: a Petrosapien, all crystal, cool and honourable. Every strike starts with a glint. */
export const TETRAX = {
  body: { width: 22, height: 48 },
  walkSpeed: 60,
  hp: 110,
  /** He yields (the ending) at this fraction of his health instead of falling. */
  yieldAt: 0.08,
  /** The glint before every strike (the same length on every difficulty). */
  glintMs: 600,
  strike: { lungeSpeed: 300, lungeMs: 220, damage: 2, reach: 40 },
  volley: { shards: 5, fanDeg: 11, speed: 250, damage: 1 },
  /** Crystal spikes erupt in a line toward Ben, marker by marker. */
  spikes: { count: 5, spacingPx: 30, warnMs: 650, gapMs: 120, damage: 2 },
  /** Guard: blocks front hits, then counters. */
  guard: { ms: 900, counterDamage: 2 },
  restMs: [700, 1200] as const,
  contactDamage: 1,
  /** Damage rules (pure, see entities/hunters/tetraxRules.ts). */
  rules: {
    /** Crystal shards (Diamondhead's or his own, reflected) barely scratch him. */
    shardMultiplier: 0.25,
    /** A smash cracks crystal. */
    smashMultiplier: 1.5,
    /** Fire heats him; while hot, the next hit that isn't fire shatters for this much. */
    heatedMultiplier: 2.2,
    heatMs: 3200,
    /** Fire hits needed to heat him through. */
    heatHits: 3,
  },
} as const;

/** THE HUNTERS, the fight as a whole. */
export const HUNTERS_BOSS = {
  name: 'THE HUNTERS',
  /** Smoothies dropped at each stage change, on the side away from the next hunter. */
  stageSmoothie: true,
  /** The shaft's maintenance ledges for the climb (tiles from the shaft's left, rows from its bottom). */
  ledges: [
    { x: 0, up: 5, w: 3 },
    { x: 5, up: 9, w: 3 },
    { x: 0, up: 13, w: 3 },
    { x: 5, up: 17, w: 3 },
    { x: 0, up: 21, w: 3 },
    { x: 5, up: 25, w: 3 },
  ],
} as const;

/** Story timings for Chapter 5's set pieces (ms). */
export const CH5_BEATS = {
  coldOpen: { bridgeMs: 600, fadeMs: 500, linesAt: 1200, bannerAt: 300, bannerMs: 1600, arrivalLinesAt: 2300 },
  /** Sixsix's first strike after the arrival: once Ben walks past the gate. */
  firstStrike: { triggerTilesPast: 14, warnMs: 1100 },
  netTrap: { flyMs: 380, dragMs: 900, sealMs: 500 },
  kraab: { sinkMs: 500, popMs: 300 },
  crystal: { chargeMs: 2600, reflectWindowMs: 6000, tetraxAt: 1400 },
  lift: { riseMs: 4200, cornerMs: 1600, volleyAt: 900, surviveMs: 15000, dropMs: 900 },
} as const;
