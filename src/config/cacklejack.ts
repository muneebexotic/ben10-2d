/**
 * CACKLEJACK, Chapter 8's boss, in the big top (an original villain). One bar,
 * three stages, each a hidden checkpoint. Times ms, speeds px/s, damage in
 * hearts. Tells are the same length on every difficulty; rests and punish
 * windows follow it (`pace.rest`, `pace.punish`).
 */
export const CACKLEJACK = {
  name: 'CACKLEJACK',
  subtitle: 'RINGMASTER OF FRIGHTS',
  maxHp: 120,
  /** The bar's thirds: THE HIGH WIRE from two thirds, THE BIG HEAD from one third. */
  stageAt: [2 / 3, 1 / 3] as const,
  contactDamage: 1,
  body: { width: 18, height: 52 },
  /** Outside a bow he dodges about: hits do this much; bowing (his punish window), this much. */
  guardMultiplier: 0.55,
  bowMultiplier: 2,
  bowMs: 1500,
  restMs: [700, 1200] as const,
  /** Stage 1: FEAR GAS. */
  pogo: { tellMs: 650, hopMs: 620, height: 70, landRadius: 34, damage: 1.5 },
  pies: { tellMs: 700, count: 3, spread: 0.28, speed: 210, gravity: 420, damage: 1 },
  gasPie: { tellMs: 700, speed: 200, gravity: 420, damage: 0.5 },
  /** Jack-in-the-boxes he drops into the ring (at most this many at once). */
  jackboxes: { tellMs: 600, max: 2 },
  /** Stage 2: THE HIGH WIRE. He swings across overhead, dropping pies; his acts fight below and beside. */
  highWire: { swingMs: 3600, row: 23, dropEveryMs: [1500, 2300] as const, dropTellMs: 600, dropDamage: 1, multiplier: 0.85, fallMs: 2600 },
  ironjaw: { hp: 32, walk: 40, throwTellMs: 700, stompTellMs: 800, throwSpeed: 220, throwGravity: 520, damage: 1.5, dazedMs: 5200, restMs: [1200, 1800] as const, body: { width: 26, height: 44 } },
  tangle: { hp: 18, reachTellMs: 850, grabDamage: 1, grabLift: -360, reachRange: 150, dazedMs: 5200, restMs: [1400, 2200] as const, body: { width: 14, height: 30 } },
  /** Stage 3: THE BIG HEAD. It grows to fill the ring; its grin opens on a beat; the valve in its throat is the target. */
  bigHead: {
    /** Its scale grows from this to 1 over `growMs`. */
    startScale: 0.45,
    growMs: 9000,
    radius: 72,
    shutMs: [2200, 2900] as const,
    quiverMs: 900,
    openMs: 1700,
    /** The valve: hits on it do this much (through the open grin); the balloon itself shrugs hits off. */
    valveMultiplier: 1.6,
    balloonMultiplier: 0.25,
    /** A ball rolling into the open grin bounces round inside: this many hits of this much, over this long. */
    pinball: { hits: 4, damage: 4, ms: 1300 },
    gasEveryMs: 2600,
    contactDamage: 1,
  },
  dyingMs: 2600,
  /** Max's cage over the ring (tiles: its middle, and the row its bottom hangs at), in view of the fight's camera. */
  cage: { cageX: 403, cageY: 23 },
} as const;
