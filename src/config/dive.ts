/**
 * THE DEEP DIVE: the runaway ore cart down the Diamond Deep (Chapter 5), seen
 * in 3D from behind the cart. Distances are metres along the track; the
 * tunnel is 3.2 m wide with three tracks.
 */
export const DIVE = {
  /** Track speed (m/s): it starts slow out of the station and keeps getting faster. */
  speed: { start: 11, cruise: 19, top: 24, cruiseAt: 260, topAt: 620 },
  /** Lateral position of each track's centre (m). */
  lanes: [-1.05, 0, 1.05] as const,
  /** How fast the cart hops across to another track (m/s). */
  laneSpeed: 6.5,
  /** A hop: airborne this long (ms). A rocket jump: longer. */
  jumpMs: 720,
  rocketJumpMs: 1250,
  /** Ducking under a beam (ms). */
  duckMs: 820,
  /** An obstacle hits if the cart reaches it within this window of its distance (m). */
  hitDepth: 0.9,
  /** Damage by what hit the cart. */
  damage: { rock: 1, crate: 2, beam: 1, crabbot: 1, kraab: 2, missile: 2, gap: 2, cannon: 2 } as const,
  /** After a hit, nothing else hurts for this long (ms). */
  hitGraceMs: 1100,
  /** Attacks (J): how far ahead each kind reaches (m), and how often. */
  attack: { shotRange: 55, smashRange: 8, strikeRange: 11, cooldownMs: 360, shotSpeed: 42 },
  /** Specials (K): how long each lasts (ms), and the shared cooldown. */
  special: { rocket: 1250, brace: 1600, boost: 2200, senses: 4500, fly: 1500, merge: 2600, phase: 1600, shield: 2200, cooldownMs: 4200 },
  /** XLR8's boost: the world slows to this. */
  boostScale: 0.55,
  /** A crate going off this close to the cart (m) catches it too. */
  crateBlastRange: 4,
  /** Tells: how far ahead (m) warnings show up for things that happen at a spot (Kraab, the drone's missile, the cannon). */
  warnAhead: { kraab: 26, missile: 30, cannon: 34 },
  /** The camera: behind the cart and above it (m), and the swing in and out (ms). */
  camera: { behind: 1.9, height: -0.32, lag: 7, swingMs: 1300, outroMs: 1600 },
  /** The cart's headlamp. */
  lamp: 1.1,
} as const;
