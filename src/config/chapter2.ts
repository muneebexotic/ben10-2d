/** Road Trip tuning: the Rustbucket, the road, the chase and its convoy. All set-piece numbers live here. */
export const RUSTBUCKET_CFG = {
  /** The flat part of the roof Ben stands on, relative to the RV's centre (px). */
  roofFrom: -80,
  roofTo: 58,
  /** Roof height above the road (px). */
  roofHeight: 56,
  /**
   * The roof's collision body reaches this far down (px). Thicker than any
   * one-frame fall (Four Arms' meteor at a 34 ms frame is about 22 px), so a
   * slow phone can't drop Ben straight through it.
   */
  roofThickness: 24,
  bobAmplitude: 1,
  headlightRadius: 140,
} as const;

export const ROAD = {
  /** Cruising speed of the treadmill (px/s): road, props and backdrop scroll at this. */
  cruiseSpeed: 520,
  /** Roadside props: one every this many pixels of travel, on average. */
  propEvery: 170,
  speedLineEveryMs: 70,
} as const;

/** The opening drive (real milliseconds). */
export const ROAD_INTRO = {
  bannerAt: 200,
  linesAt: 900,
  /** The cut to the rest stop, and the RV pulling in. */
  fadeMs: 260,
  pullInMs: 1000,
  hopOutAt: 1350,
  controlAt: 1650,
} as const;

/**
 * The Rustbucket chase. Telegraph lengths (rev, aim, junk warning, potholes)
 * are the same on every difficulty; rests between attacks scale with the
 * difficulty's pace, and Hard brings more of everything.
 */
export const CHASE = {
  /** Ben passes this tile: the RV comes round the bend to pick him up. */
  arriveTriggerX: 209,
  arriveMs: 1700,
  /** Walking this close (px) to the parked RV's centre climbs aboard. */
  boardReach: 84,
  fadeMs: 280,
  /** The road speeds up from a standstill to cruising speed. */
  rampMs: 1800,
  /** Camera centre: this far above the road, this far behind the RV (room to see what's coming). */
  cameraAbove: 104,
  cameraBehind: 36,
  /** Rails at the roof's ends (px tall): you jump over them on purpose, never fall off by accident. */
  railHeight: 18,
  /** Feet this far below the roof means Ben fell off. */
  fallBelowRoof: 18,
  /** Sky during the chase: dusk to full night. */
  skyFrom: 0.62,
  skyTo: 0.95,
  /** The ride before the convoy: drone waves (ms after the RV gets going), bouncing tires, potholes. */
  ride: {
    minMs: 19000,
    maxMs: 32000,
    waves: [
      { at: 1400, from: 'right', spawns: [{ kind: 'scout', dx: 120, dy: -110 }, { kind: 'scout', dx: 60, dy: -150 }] },
      { at: 6500, from: 'above', spawns: [{ kind: 'striker', dx: -40, dy: -150 }, { kind: 'striker', dx: 50, dy: -140 }] },
      { at: 12000, from: 'left', spawns: [{ kind: 'hornet', dx: -150, dy: -90 }, { kind: 'hornet', dx: -110, dy: -140 }, { kind: 'hornet', dx: -60, dy: -110 }] },
      { at: 18000, from: 'right', spawns: [{ kind: 'gunner', dx: 150, dy: -150 }, { kind: 'striker', dx: 30, dy: -160 }, { kind: 'scout', dx: -90, dy: -120 }] },
    ],
    /** Extra drones on Hard (one per wave, same entry side). */
    hardExtra: [{ kind: 'scout', dx: 0, dy: -170 }, { kind: 'striker', dx: -70, dy: -150 }, { kind: 'hornet', dx: -20, dy: -160 }, { kind: 'hornet', dx: 90, dy: -110 }],
    tires: { firstMs: 3500, everyMs: [3600, 5200] as const },
    potholes: { firstMs: 9000, everyMs: [8000, 11000] as const, warnMs: 1100, kick: -230 },
  },
  hauler: {
    /** Gap between the RV's nose and the trailer's back. */
    gap: 70,
    enterMs: 2600,
    barrels: 4,
    firstBarrelMs: 2400,
    barrelEveryMs: [2200, 2900] as const,
    /** Hornets out of the trailer hatch, per difficulty. */
    hornets: { easy: 1, normal: 2, hard: 3 } as const,
    /** Thrown junk that hits the trailer before it gives up early. */
    bullseyesToWin: 2,
    /** After the last barrel, the rig loses it anyway. */
    finaleAfterMs: 4200,
    crashMs: 2200,
  },
} as const;

/** Vilgax's convoy rigs. */
export const CONVOY = {
  /** Trucks in the convoy, and how many come at once. */
  trucks: { easy: 2, normal: 3, hard: 4 } as const,
  together: { easy: 1, normal: 2, hard: 2 } as const,
  /** First truck enters this long after the convoy phase starts; the next ones this long after a slot frees. */
  firstMs: 2200,
  nextMs: 1800,
  hp: 16,
  /** Armour: anything but smash damage does this fraction (fireballs chip, Four Arms crushes). */
  chipMultiplier: 0.3,
  /** A truck thrown into another one hits this hard (it's a truck). */
  thrownDamage: 20,
  approachSpeed: 190,
  /** Gap between the truck's nose and the RV's back while it tails it. */
  tailGap: 120,
  tailMs: [1400, 2200] as const,
  /** The ram telegraph: engine revs, horn, chevrons on the back of the roof. */
  revMs: 1000,
  ramSpeed: 560,
  /** The back of the roof the ram's jolt hurts (px from the rear edge). */
  ramZone: 54,
  ramDamage: 1,
  /** Anyone standing in the zone is flung forward. */
  joltKick: { x: 230, y: -170 },
  /** Hooked on: it drags the RV this long, then yanks (another jolt) and lets go. */
  clampMs: 4200,
  /** A truck that lets go drops back this long before it tails again. */
  dropBackMs: 900,
  fireEveryMs: [2600, 3400] as const,
  aimMs: 950,
  shellFlightMs: 900,
  shellDamage: 1,
  shellGravity: 520,
  shellBlastRadius: 16,
  /** The wreck rolling off after it was thrown or wrecked. */
  wreckMs: 1300,
} as const;

/** Tires and barrels bouncing onto the roof. */
export const JUNK = {
  /** Warning at the screen edge before it arrives (same on every difficulty). */
  warnMs: 900,
  flightMs: 700,
  /** Speed it rolls toward the back of the roof (the road pulls it). */
  rollSpeed: 120,
  /** Tires bounce this high every time they hit the roof. */
  bounce: 190,
  gravity: 700,
  damage: 1,
  radius: 7,
} as const;
