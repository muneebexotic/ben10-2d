/**
 * Chapter 6's enemies (Karachi): Hex and Charmcaster's magic. Each one asks
 * for something different: rocklings bowl along the floor (jump them or
 * meet them), golems are slow stone with a long slam and a rune that opens
 * after it (Grey Matter's ANALYZE, then something heavy), the palace's
 * enchanted armor blocks from the front (get behind it, or smash), gargoyles
 * are stone until they wake (no use hitting them perched), Hex's illusions
 * pop at a touch but shoot (find the real ones), and the fair's bewitched
 * kites dive at Ben (fire, or a hit, cuts their string).
 */
export const ROCKLING = {
  hp: 3,
  body: { width: 12, height: 10 },
  patrolSpeed: 24,
  noticeX: 220,
  /** Seams flare before it curls up and rolls: the tell. */
  windupMs: 480,
  rollSpeed: 220,
  rollMaxMs: 1500,
  rollDamage: 1,
  /** After a roll (or bouncing off a wall) it's dizzy and open. */
  dazedMs: 900,
  restMs: [700, 1200] as const,
  contactDamage: 1,
} as const;

export const GOLEM = {
  hp: 22,
  body: { width: 28, height: 44 },
  walkSpeed: 26,
  noticeX: 260,
  /** Close enough to slam. */
  slamRange: 80,
  /** Fists up over its head: a long, obvious tell. */
  windupMs: 1000,
  slamDamage: 2,
  /** The slam sends a shockwave along the floor both ways. */
  wave: { speed: 190, damage: 2, lifeMs: 1100, radius: 7 },
  /** After the slam it kneels, its chest rune exposed. */
  stunnedMs: 1700,
  /** Hits on its stone body (not a smash) barely scratch it; the open rune takes extra. */
  stoneMultiplier: 0.45,
  openMultiplier: 1.6,
  restMs: [900, 1400] as const,
  contactDamage: 1,
} as const;

export const ARMOR = {
  hp: 9,
  body: { width: 16, height: 32 },
  walkSpeed: 40,
  patrolSpeed: 22,
  noticeX: 220,
  strikeRange: 40,
  windupMs: 520,
  strikeMs: 220,
  strikeDamage: 2,
  /** A blow on the shield (from the front, not a smash) only clangs. */
  shieldMultiplier: 0.15,
  /** A smash or a hit from behind knocks the shield aside: staggered and open. */
  staggeredMs: 1400,
  staggeredMultiplier: 1.5,
  restMs: [800, 1300] as const,
  contactDamage: 1,
} as const;

export const ILLUSION = {
  hp: 1,
  body: { width: 16, height: 40 },
  /** A copy of Hex that drifts and throws a slow spell bolt now and then. */
  driftSpeed: 30,
  noticeX: 260,
  castMs: 700,
  boltSpeed: 140,
  boltDamage: 1,
  restMs: [2200, 3200] as const,
  contactDamage: 1,
} as const;

export const GARGOYLE = {
  hp: 6,
  body: { width: 22, height: 18 },
  /** Wakes when Ben comes this close (and shakes off its stone for `wakeMs`). */
  wakeRange: 150,
  wakeMs: 600,
  flySpeed: 95,
  hoverAbove: 70,
  /** Locks onto Ben, then swoops at the spot. */
  lockMs: 650,
  diveSpeed: 330,
  diveMaxMs: 900,
  /** Embedded after a missed dive: open. */
  stuckMs: 1100,
  diveDamage: 2,
  restMs: [1300, 2000] as const,
  contactDamage: 1,
} as const;

export const KITE = {
  hp: 2,
  body: { width: 16, height: 18 },
  /** Bobs high on the sea breeze, then dives along a line at Ben. */
  hoverAbove: 90,
  flySpeed: 70,
  lockMs: 600,
  diveSpeed: 280,
  diveMaxMs: 1100,
  diveDamage: 1,
  restMs: [1600, 2400] as const,
  contactDamage: 1,
} as const;
