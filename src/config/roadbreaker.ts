/**
 * ROADBREAKER, Chapter 2's boss: Vilgax's war rig, rebuilt from the crashed
 * hauler. Truck mode until it's down to `robotAt`, then it stands up as a
 * robot. Telegraph lengths are the same on every difficulty; rests and
 * punish windows scale with the difficulty's pace.
 *
 * The intended answers: XLR8 slashes its tires (they hate melee), a stalled
 * truck is Four Arms' to lift and throw, Four Arms smashes the striped chest
 * plates, and Heatblast overheats the robot through its open vents.
 */
export const ROADBREAKER = {
  name: 'ROADBREAKER',
  subtitle: "VILGAX'S WAR RIG",
  maxHp: 170,
  /** Stands up as a robot at this fraction of its health. */
  robotAt: 0.55,
  contactDamage: 1,
  introMs: 2600,
  /** Rest between attacks: truck, robot. */
  idleMs: [950, 750] as const,
  maxAdds: [2, 2] as const,
  defeatTitle: 'ROADBREAKER WRECKED!',
  truck: {
    /** Armour: anything but smash does this fraction to the cab while it's rolling. */
    armour: 0.2,
    driveSpeed: 150,
    ram: {
      /** Drives to the far side first (at most this long). */
      repositionMs: 1300,
      /** Engine revs, headlights blaze, chevrons along the floor. */
      revMs: 1100,
      speed: 540,
      damage: 2,
      /** Hits the arena wall and sits dazed this long (a short punish). */
      crashStunMs: 1100,
      /** The ram's hitbox top, above the floor: standing on a scaffold is safe. */
      height: 44,
    },
    tire: {
      hp: 12,
      /** XLR8 and Ben's punches (melee) tear tires; fire barely scorches them. */
      meleeMultiplier: 2,
      fireMultiplier: 0.25,
    },
    /** Both tires gone: it spins out and sits there (Four Arms can lift it). */
    stallMs: 3600,
    stalledMultiplier: 1.5,
    /** Damage when Four Arms throws it and it comes down on its roof. */
    flipDamage: 30,
    lob: { count: [3, 4] as const, intervalMs: 300, warnMs: 900, settleMs: 600 },
    dispatch: { telegraphMs: 700, count: 2 },
  },
  transformMs: 2600,
  robot: {
    plates: 3,
    plateHp: 10,
    /** Core damage by plates already broken (0, 1, 2, 3). */
    coreArmour: [0.3, 0.5, 0.75, 1] as const,
    walkSpeed: 52,
    slam: { approachMs: 1200, raiseMs: 900, stuckMs: 1400, width: 92, damage: 2 },
    /** After a slam the radiator opens: fire does extra and builds heat. */
    vent: { openMs: 3400, fireMultiplier: 2.5, overheatAt: 14, seizeMs: 3200, seizedMultiplier: 1.5 },
    /** Rips a wheel off its shoulder and bowls it along the floor. Punch it back! */
    saw: { windMs: 850, speed: 250, bounces: 1, lifeMs: 3600, radius: 11, damage: 1, returnDamage: 10, regrowMs: 1600 },
    beam: { moveMs: 700, telegraphMs: 1000, fireMs: 420 },
  },
  deathMs: 2400,
} as const;
