export const DRONE_SHARED = {
  /** Drones sleep until the camera gets this close, and never fire from off-screen. */
  wakeDistance: 420,
  /** Grace period after a drone notices Ben before it may attack. */
  wakeDelayMs: [1100, 1700] as const,
  onScreenMargin: 10,
  contactDamage: 1,
  hitFlashMs: 80,
  hurtKnockback: 150,
  knockbackDecay: 6,
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

export const LASER = {
  lifetimeMs: 2600,
  radius: 3,
} as const;
