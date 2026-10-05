/**
 * Chapter 4's machines that fight back, plus Kevin's sparks. Every one is a
 * machine Upgrade can take over (the sparks are raw power: nothing to take).
 * Tells are the same length on every difficulty; rests and windows follow pace.
 */
export const ROBOT_SHARED = {
  /** Robots glow their own colour under the lightmap. */
  glow: 0xffb050,
} as const;

/**
 * TOKEN TOON mascot: a lumbering animatronic from the arcade's band. Walks at
 * Ben, raises its cymbals with flashing eyes (the tell), then smashes them
 * into the floor: a short shockwave runs out each way.
 */
export const MASCOT = {
  hp: 9,
  body: { width: 18, height: 32 },
  walkSpeed: 52,
  patrolSpeed: 26,
  noticeX: 200,
  smashRange: 64,
  windupMs: 680,
  smashMs: 260,
  recoverMs: 620,
  restMs: [700, 1100] as const,
  wave: { speed: 170, lifeMs: 620, damage: 1, radius: 6 },
  smashDamage: 2,
  contactDamage: 1,
  /** How far from where it woke it will follow Ben (px): the band guards its stretch of the arcade instead of trailing him into the subway. */
  leash: 128,
} as const;

/**
 * Track-bot: a maintenance robot on treads with a grinder. Revs in a shower of
 * sparks (a dashed line marks its charge), then charges along the floor; a
 * miss leaves it skidding, its back open. Kevin's overcharged ones are faster
 * and crackle purple.
 */
export const TRACKBOT = {
  hp: 7,
  body: { width: 22, height: 14 },
  patrolSpeed: 40,
  noticeX: 230,
  revMs: 620,
  chargeSpeed: 250,
  chargeMs: 950,
  skidMs: 520,
  restMs: [800, 1200] as const,
  chargeDamage: 2,
  contactDamage: 1,
  /** Hits on its back while it skids. */
  skidMultiplier: 1.5,
  overcharged: { chargeSpeed: 300, revMs: 620, hp: 9 },
} as const;

/**
 * One of Kevin's sparks: stolen power he flings at Ben. It drifts closer,
 * crackles and flashes a ring (the tell), then discharges. Fragile, and gone
 * after it zaps.
 */
export const SPARK = {
  hp: 2,
  body: { width: 12, height: 12 },
  driftSpeed: 70,
  triggerRange: 64,
  chargeMs: 560,
  zapRadius: 42,
  zapDamage: 1,
  contactDamage: 1,
  lifeMs: 9000,
} as const;
