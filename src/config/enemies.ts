export const DRONE_SHARED = {
  /** Drones sleep until the camera gets this close, and never fire from off-screen. */
  wakeDistance: 420,
  /** Grace period after a drone notices Ben before it may attack. */
  wakeDelayMs: [1100, 1700] as const,
  /** Drones never chase farther than this from where they spawned. */
  leash: 260,
  onScreenMargin: 10,
  contactDamage: 1,
  hitFlashMs: 80,
  hurtKnockback: 150,
  knockbackDecay: 6,
  /** Knocked-down drones fall like this, take extra damage and reboot after a short delay. */
  downedGravity: 900,
  downedMaxFall: 420,
  downedDamageMultiplier: 1.25,
  recoverDelayMs: 700,
} as const;

export const SCOUT = {
  hp: 2,
  moveSpeed: 72,
  hoverOffsetX: 112,
  hoverOffsetY: -70,
  aggroRange: 320,
  fireIntervalMs: [1700, 2500] as const,
  telegraphMs: 650,
  aimLockMs: 190,
  laserSpeed: 210,
  laserDamage: 1,
  recoil: 60,
  bobAmplitude: 4,
  bobSpeed: 3.2,
  hurtStunMs: 260,
  body: { width: 16, height: 12 },
} as const;

export const STRIKER = {
  hp: 3,
  patrolSpeed: 84,
  altitude: 118,
  triggerRange: 150,
  lockMs: 620,
  lockFreezeMs: 210,
  diveSpeed: 390,
  stuckMs: 900,
  riseSpeed: 120,
  cooldownMs: 1300,
  hurtStunMs: 200,
  body: { width: 16, height: 14 },
} as const;

export const GUNNER = {
  hp: 5,
  moveSpeed: 48,
  keepDistance: 150,
  hoverOffsetY: -72,
  aggroRange: 330,
  fireIntervalMs: [2300, 3000] as const,
  telegraphMs: 820,
  aimLockMs: 220,
  spreadDeg: 17,
  shots: 3,
  laserSpeed: 185,
  laserDamage: 1,
  recoil: 40,
  hurtStunMs: 160,
  body: { width: 22, height: 16 },
} as const;

/**
 * Armored Drone: a slow hovering tank. Everything except smash hits glances
 * off its plating; smash damage breaks the armour open, knocks it down and
 * leaves the core exposed to everything for a few seconds (swap and burst it).
 */
export const ARMORED = {
  hp: 16,
  body: { width: 26, height: 22 },
  moveSpeed: 40,
  /** Hovers low enough for punches to connect. */
  hoverOffsetY: -24,
  keepDistance: 96,
  aggroRange: 320,
  chipMultiplier: 0.15,
  armorHp: 6,
  exposedMs: 3600,
  exposedMultiplier: 1.4,
  /** Breaking the armour knocks it out of the air for this long. */
  breakStunMs: 1800,
  fireIntervalMs: [2400, 3200] as const,
  telegraphMs: 950,
  aimLockMs: 260,
  shellFlightMs: 950,
  shellGravity: 260,
  shellDamage: 2,
  shellRadius: 5,
  ramRange: 130,
  ramTelegraphMs: 720,
  ramSpeed: 300,
  ramMs: 620,
  ramDamage: 2,
  recoverMs: 650,
  /** "ARMOR!" pops at most this often when chip hits glance off. */
  tinkTextEveryMs: 1400,
} as const;

/**
 * Hornet: a tiny, twitchy interceptor. It sidesteps fireballs, orbits Ben and
 * darts through him; XLR8's instant strikes and dash catch it best.
 */
export const HORNET = {
  hp: 3,
  body: { width: 14, height: 10 },
  moveSpeed: 190,
  orbitRadius: 74,
  orbitSpeed: 2.6,
  /** Orbits around head height, dipping into strike range. */
  hoverOffsetY: -30,
  aggroRange: 300,
  attackIntervalMs: [1250, 1900] as const,
  telegraphMs: 430,
  aimLockMs: 130,
  dashSpeed: 520,
  dashMs: 520,
  recoverMs: 480,
  dashDamage: 1,
  needles: { count: 3, spreadDeg: 11, speed: 270, damage: 1, radius: 2 },
  evade: { radius: 52, cooldownMs: 650, impulse: 260, textEveryMs: 1600 },
  hurtStunMs: 120,
} as const;

export const LASER = {
  lifetimeMs: 2600,
  radius: 3,
} as const;
