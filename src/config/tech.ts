/**
 * Machines (Chapter 4 on): the things Upgrade merges into, and the subway's
 * trains. Telegraphs are the same on every difficulty; rests follow pace.
 */
export const TECH = {
  /** Security shutters: circuits climb the slats, then it rolls up for good. */
  door: { powerMs: 420, openMs: 300, releaseMs: 720 },
  /** Laser turrets: hostile ones sweep, lock and burst; Upgrade aims and fires them. */
  turret: {
    hp: 12,
    range: 270,
    /** The laser sight: tracks Ben, then locks for the last part. */
    aimMs: 760,
    aimLockMs: 220,
    burstShots: 3,
    burstEveryMs: 120,
    restMs: 1600,
    shotSpeed: 300,
    shotDamage: 1,
    /** Merged: up/down tilts the barrel this fast (rad/s), between these angles (up is negative). */
    tiltSpeed: 2.6,
    minTilt: -1.05,
    maxTilt: 0.45,
    playerShotEveryMs: 170,
    playerShotSpeed: 420,
    playerShotDamage: 3,
    wakeDistance: 300,
  },
  /** Dead lifts: merged, they rise and stay up. */
  lift: { speed: 110 },
  /** Maintenance carts on a rail. */
  cart: {
    accel: 520,
    friction: 260,
    maxSpeed: 230,
    /** Ramming: anything in front takes this (each target once a moment). */
    ramDamage: 5,
    ramKnockback: 380,
    ramStunMs: 900,
    ramEveryMs: 600,
    /** J: the horn and headlight blast. */
    hornDamage: 2,
    hornStunMs: 1400,
    hornRadius: 70,
    hornCooldownMs: 1200,
    /** Fast enough at the barrier to smash through it. */
    barrierSpeed: 120,
    /** At the end of the line Upgrade pops out after this long. */
    endEjectMs: 450,
    /** Left out on the line with nobody aboard, it waits this long and then rolls back to the start, so it can't strand Ben. */
    returnDelayMs: 1500,
    returnSpeed: 80,
    /** With nobody driving, it stops this far short of Ben standing in its way instead of rolling into him. */
    playerClearance: 10,
  },
  /** Arcade cabinets: merged, the screen blasts GAME OVER at whatever's in front. */
  cabinet: { bootMs: 300, releaseMs: 460, blastRadius: 66, blastReach: 40, damage: 5, stunMs: 1500, knockback: 320 },
  /** Subway trains: the warning (lamps, horn, headlights in the tunnel), then the train. */
  trains: { warnMs: 2200, speed: 760, cars: 3, damage: 2, knockback: 340 },
} as const;
