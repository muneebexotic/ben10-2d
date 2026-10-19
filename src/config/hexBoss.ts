/**
 * HEX AND CHARMCASTER (Chapter 6's boss, on top of the clock tower). One
 * health bar, three phases: Charmcaster alone, then Hex and the Charms of
 * Bezel, then both (Hex splits into illusions while Charmcaster wards him).
 * Switching aliens and Gwen's spells are rewarded, never required.
 */
export const HEX_BOSS = {
  name: 'HEX AND CHARMCASTER',
  subtitle: 'THE MAGICIANS OF THE CLOCK TOWER',
  maxHp: 120,
  /** Phase changes at these fractions of the bar. */
  phase2At: 0.66,
  phase3At: 0.33,
  contactDamage: 1,
  transitionMs: 1800,
  /** Rest between attacks, per phase. */
  idleMs: [1300, 1100, 1000] as const,
  charmcaster: {
    body: { width: 16, height: 30 },
    /** Spell bags: thrown in arcs at where Ben stands; a ring marks each landing. */
    bags: { count: 3, windupMs: 650, gapMs: 180, flightMs: 800, damage: 1, radius: 5, spreadPx: 40 },
    /** Summoning rocklings out of runes in the floor (Gwen's STUN, or any stunning hit, breaks it). */
    summon: { chantMs: 1100, adds: 2, maxAdds: 4 },
    /** A blink to the other side, then a fan of bolts. */
    blink: { fadeMs: 300, windupMs: 500, bolts: 3, fanDeg: 18, speed: 210, damage: 1 },
    /** Knocked out of a summon (or her ward broken): reeling, takes extra. */
    stunnedMs: 1700,
    stunnedMultiplier: 1.5,
  },
  hex: {
    body: { width: 16, height: 40 },
    /** He floats this high over the floor (low enough for a punch) and blinks between three spots. */
    hover: 6,
    /** Each Charm's attack (the staff glows its colour first: the tell). */
    fire: { windupMs: 800, pillars: 5, gapMs: 140, speed: 200, damage: 2 },
    lightning: { windupMs: 700, aimLockMs: 200, bolts: 3, gapMs: 260, speed: 520, damage: 2 },
    stone: { windupMs: 850, speed: 210, damage: 2, radius: 7, lifeMs: 1300 },
    wind: { windupMs: 700, gustMs: 1400, push: 210, debris: 4, debrisDamage: 1 },
    /** After a spell he's spent for a moment: hits land harder. Otherwise the staff takes the edge off them. */
    spentMs: 1100,
    spentMultiplier: 1.4,
    guardMultiplier: 0.6,
  },
  both: {
    /** Hex splits into copies; any hit pops a copy, and they come back after a while. */
    copies: 2,
    copyReturnMs: 5000,
    copyBoltEveryMs: [2200, 3000] as const,
    copyBoltSpeed: 150,
    /** Charmcaster's ward keeps Hex (and his copies) from harm until she's hit or stunned. */
    wardDownMs: 4500,
    /** Hex's big spell: a ring of power across the whole tower top. Gwen's SHIELD (or any dodge) gets through it. */
    cataclysm: { chargeMs: 1900, damage: 2, everyAttacks: 3 },
    /** Rocklings up the stairs (Max holds them off). */
    stairAddsEveryMs: 7000,
  },
  dyingMs: 2200,
} as const;
