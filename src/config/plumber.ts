/**
 * Chapter 7's enemies: the Plumber base's security sentries (wardens) in
 * lockdown, Deepmaw's escaped crew (fishbowl grunts), and what lives in the
 * water (zapper eels, jelly mines, gnasher swarms). Tells are the same length
 * on every difficulty; rests follow the difficulty (`pace`).
 */

/** A Plumber security sentry: a floating lens that sweeps its scan light, locks red on Ben, then fires a stun beam. Air or water. */
export const WARDEN = {
  hp: 3,
  body: { width: 16, height: 14 },
  hover: 40,
  speed: 60,
  /** The scan light: how far it reaches (px) and its half-angle (rad); it sweeps this fast (rad/s). */
  scanRange: 150,
  scanHalfAngle: 0.32,
  sweepSpeed: 1.1,
  /** Ben in the light: it locks (the light turns red) for this long, then fires. */
  lockMs: 650,
  beamSpeed: 230,
  beamDamage: 1,
  beamLifeMs: 1100,
  restMs: [1100, 1700] as const,
  contactDamage: 1,
} as const;

/** Deepmaw's crew: a fish in a diving suit with a water-filled fishbowl helmet. */
export const GRUNT = {
  hp: 4,
  body: { width: 14, height: 24 },
  patrolSpeed: 22,
  noticeX: 200,
  /** The harpoon: wound back over its shoulder (the tell), then thrown in a low arc. */
  windupMs: 620,
  harpoonSpeed: 210,
  harpoonGravity: 160,
  harpoonDamage: 1,
  restMs: [1100, 1600] as const,
  /** The bowl takes this many ordinary hits (a smash or fire breaks it at once). */
  bowlHits: 2,
  /** Bowl broken: it flops helplessly this long (taking extra damage), then passes out. */
  flopMs: 3600,
  flopDamageTaken: 2,
  contactDamage: 1,
} as const;

/** A zapper eel: coils in the water; it glows and crackles (the tell), then a shock ring goes through the water around it. */
export const EEL = {
  hp: 4,
  body: { width: 22, height: 10 },
  swimSpeed: 34,
  /** It wanders this far from home (px). */
  roam: 46,
  noticeRange: 130,
  chargeMs: 820,
  shockRadius: 46,
  shockDamage: 1,
  shockMs: 260,
  restMs: [1300, 2000] as const,
  /** Left high and dry (its tank drained): it flops, harmless, taking extra damage. */
  dryDamageTaken: 2,
  contactDamage: 1,
} as const;

/** A jelly mine: drifts and pulses; touch it and it stings, hit it and it pops (popping the ones near it). */
export const JELLY = {
  hp: 1,
  body: { width: 14, height: 14 },
  drift: 10,
  /** It drifts toward Ben once he's this close (px), at this speed. */
  seekRange: 70,
  seekSpeed: 14,
  /** Pops the jellies this close (px), one after another. */
  chainRadius: 52,
  chainDelayMs: 140,
  contactDamage: 1,
} as const;

/** A gnasher swarm: a school of little fish that circles, bunches up and turns (the tell), then darts at Ben in a line. */
export const GNASHER = {
  hp: 3,
  body: { width: 22, height: 16 },
  circleRadius: 18,
  circleSpeed: 2.2,
  noticeRange: 150,
  bunchMs: 560,
  dartSpeed: 260,
  dartMs: 620,
  restMs: [900, 1400] as const,
  contactDamage: 1,
} as const;

/** Shared by the chapter's water enemies. */
export const DEEP_SHARED = {
  /** Out of water, a water enemy sinks this fast (px/s) until it lands. */
  dryFall: 220,
  /** It turns back this far (px) under the surface. */
  surfaceMargin: 10,
} as const;
