/**
 * Chapter 5's hunters' gear and the mine's hazards. Tells are the same length
 * on every difficulty; rests and punish windows follow pace (see Difficulty).
 */

/** Shared look: the hunters' machines glow their owner's colour under the lightmap. */
export const BOUNTY_SHARED = {
  /** Every enemy here is a hunter's tool: robots (Upgrade can take the drones and crab-bots over) or living crystal. */
  sentryGlow: 0x8ab8ff,
} as const;

/**
 * Sixsix's tracker drone: hovers high and paints Ben with a targeting laser.
 * Keep line of sight for the whole paint and a missile salvo lands on him a
 * beat later; break it (cover, a roof, the drone shot down) and the lock is lost.
 */
export const TRACKER = {
  hp: 4,
  body: { width: 20, height: 12 },
  moveSpeed: 90,
  /** Where it likes to hover relative to Ben (px). */
  hoverOffsetX: 70,
  hoverAbove: 92,
  aggroRange: 300,
  /** The paint: a thin line that thickens, then LOCKED. */
  paintMs: 1500,
  /** Line of sight may break this long before the lock is lost (one frame behind a post doesn't count). */
  sightGraceMs: 220,
  /** After a lock: markers on the ground, then the salvo lands. */
  salvo: { missiles: 3, spreadPx: 30, warnMs: 950, gapMs: 120 },
  restMs: [2600, 3600] as const,
  hurtStunMs: 260,
} as const;

/** One of Sixsix's missiles (from the trackers, and Sixsix himself in the boss). */
export const MISSILE = {
  damage: 2,
  /** Falls from above the screen toward its marker. */
  speed: 330,
  /** It comes in at an angle from Sixsix's side of the sky (radians from straight down). */
  angle: 0.42,
  radius: 5,
  blastRadius: 26,
  lifetimeMs: 4000,
  /** Reflected back up, it hits like this. */
  reflectDamage: 4,
} as const;

/**
 * Kraab's crab-bot: scuttles at Ben with a shelled front. Hits from the front
 * glance off unless they're heavy (a smash flips it on its back: open and
 * slow). At range it burrows: a crack line races toward Ben (the tell), then
 * it erupts claws-up under him.
 */
export const CRABBOT = {
  hp: 8,
  body: { width: 24, height: 14 },
  walkSpeed: 62,
  patrolSpeed: 30,
  noticeX: 240,
  /** Close enough to pinch instead of burrowing. */
  pinchRange: 34,
  pinchWindupMs: 420,
  pinchMs: 200,
  pinchDamage: 2,
  /** Beyond this it burrows instead of walking up. */
  burrowRange: 90,
  burrowMs: 380,
  /** Underground it races toward where Ben stands (px/s), then the crack line holds still for `crackHoldMs`. */
  tunnelSpeed: 150,
  tunnelMaxMs: 1600,
  crackHoldMs: 520,
  eruptDamage: 2,
  eruptMs: 380,
  /** Front hits that aren't heavy only scratch the shell. */
  shellMultiplier: 0.25,
  /** Flipped: lies on its back, legs kicking, and takes extra. */
  flippedMs: 2200,
  flippedMultiplier: 1.6,
  restMs: [700, 1100] as const,
  contactDamage: 1,
} as const;

/**
 * Tetrax's crystal sentry: a cluster of spikes that glints (the tell), then
 * fires a fan of shards. Diamondhead drinks shards in and gets alien time back.
 */
export const SENTRY = {
  hp: 7,
  body: { width: 16, height: 26 },
  aggroRange: 260,
  glintMs: 760,
  shards: 3,
  fanDeg: 12,
  shardSpeed: 230,
  shardDamage: 1,
  shardRadius: 4,
  shardLifeMs: 1800,
  spentMs: 700,
  restMs: [1500, 2300] as const,
  contactDamage: 1,
  /** Smash hits crack crystal. */
  smashMultiplier: 1.5,
} as const;

/** Dynamite crates: fire (or a blast) lights the fuse; the bang clears the cracked rock around it. */
export const DYNAMITE = {
  fuseMs: 900,
  radius: 44,
  damage: 3,
  /** Hurts Ben too if he's standing next to it. */
  playerDamage: 2,
  knockback: 260,
} as const;

/** Falling rocks: dust trickles and a marker shows on the floor, then the rock comes down. */
export const ROCKFALL = {
  warnMs: 900,
  fallSpeed: 420,
  damage: 2,
  radius: 9,
  /** A rockfall zone drops one rock per this while Ben is near it. */
  everyMs: [1600, 2600] as const,
  /** How near (px) Ben has to be for a zone to drop rocks. */
  wakeRange: 180,
} as const;

/** The mine's security lasers and the crystal receivers that open its gates. */
export const SECURITY_LASER = {
  damage: 1,
  /** How far a beam can travel before it fades (px), across every bounce. */
  maxLength: 900,
  maxBounces: 4,
  /** A receiver must be lit this long to open its gate. */
  chargeMs: 450,
  /** The beam blinks off this long every cycle on the Kevin-era emitters that pulse (0: always on). */
  thickness: 3,
} as const;

/** Phase walls: solid for everyone but Ghostfreak while he's phased. Leftover overlap when phasing ends pushes him out. */
export const PHASE_WALL = {
  ejectSpeed: 240,
} as const;

/** Sixsix's energy net (the jail). */
export const ENERGY_NET = {
  /** The net flies at Ben, wraps him, and drags him into the cell. */
  flySpeed: 260,
  dragMs: 900,
  generatorHp: 6,
} as const;
