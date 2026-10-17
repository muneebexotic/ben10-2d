/**
 * THE TOWER WRAP (Chapter 6): the climb around the outside of the clock tower
 * after Hex. Ben runs along ledges that spiral up the tower; the tower turns
 * as he goes, so the side he's on always faces the camera. Distances are in
 * pixels along the tower's surface (arc length) and up its height.
 */
export const TOWER = {
  /** The tower's radius on screen (px). */
  radius: 150,
  /** Revolutions of spiral to the top. */
  revolutions: 3,
  /** Each step of the spiral: its length along the surface and how much higher it is than the last. */
  step: { length: [80, 120] as const, rise: 20 },
  /** A gap to jump every so many steps (with a catch ledge under it, so a miss only costs a step or two). */
  gapEvery: 7,
  gapLength: 46,
  catchDrop: 30,
  /** The top step's length (the parapet stops Ben at its far end). */
  topLength: 160,
  /** A ledge up to this much higher than Ben's feet is a riser in his way (a whole turn up is overhead, not in the way). */
  wallReach: 100,
  /** The ledge sticks out this far from the wall (drawn), and the first ledge is the tower's base. */
  ledgeOut: 6,
  /** Movement on the ledges (alien forms use their own run speed and jump, scaled). */
  gravity: 1150,
  maxFall: 460,
  runSpeed: 150,
  jumpVelocity: 400,
  /** Gravity multiplier on the way up once jump is let go (a short hop). */
  releaseGravity: 2.4,
  /** Where Ben sits on screen (fraction of the height from the top). */
  viewY: 0.62,
  /** Attacks: a swipe in front of Ben. */
  attack: { reach: 30, cooldownMs: 260 },
  rockling: { everyMs: [2600, 3800] as const, speed: 95, aheadSteps: 3, damage: 1 },
  gargoyle: { everyMs: [4200, 6000] as const, speed: 160, damage: 1, firstAfterMs: 6000 },
  wind: { everyMs: [9000, 12000] as const, warnMs: 900, gustMs: 1500, push: 70 },
  hurtGraceMs: 900,
  /** On reaching the top, the tower stops turning and Ben vaults onto the parapet. */
  finishMs: 900,
} as const;
