/**
 * Chapter 7, The Plumbers: tuning for the HD look, the base's water, its
 * systems and its story beats. Enemies are in `config/plumber.ts`, the boss
 * in `config/deepmaw.ts`, swimming in `config/swim.ts`.
 */

export const CH7_HD = {
  /** Highest render scale (fill rate on phones). */
  maxRenderScale: 3,
  /** Highest texture resolution for the chapter's art (texels per game pixel). */
  maxArtRes: 4,
  /** The world camera's zoom in the base (characters read bigger in HD); the boss arena frames wider. */
  zoom: 1.25,
  arenaZoom: 1,
  /**
   * A rig can't be see-through as a whole (each part would show the parts behind it), so the
   * hit flicker's faint frames show a pale silhouette instead.
   */
  blinkTint: 0xc8e2ff,
} as const;

/** The base's water (Chapter 7): how fast levels move, and how it looks. */
export const PLUMBER_WATER = {
  /** A whirlpool (Deepmaw's maelstrom): full pull within this distance of its middle (px), and how much it swirls round (sideways share of the pull). */
  vortexReach: 300,
  vortexSwirl: 0.35,
  /** A pump filling or draining a tank (px/s). */
  fillSpeed: 34,
  /** A valve letting two tanks share their water (px/s). */
  valveSpeed: 44,
  /** Two surfaces this close count as level (a pressure door opens). */
  levelTolerance: 10,
  /** A bubble vent's stream: breath refills this close to its column (px). */
  ventHalfWidth: 9,
  base: { top: 0x3aa8d8, deep: 0x0a2a5a, crest: 0xbaf0ff, backAlpha: 0.32, frontAlpha: 0.24 },
  sea: { top: 0x2a98c0, deep: 0x062a4a, crest: 0xbaf0ff, backAlpha: 0.0, frontAlpha: 0.16 },
} as const;

/** The base's machines (Chapter 7). */
export const PLUMBER_SYSTEMS = {
  /** A door sliding open or shut (ms). */
  doorMs: 650,
  /** A pump or a console ignores hits for this long after one. */
  machineCooldownMs: 900,
  /** Upgrade merged into a pump: it pumps this much faster. */
  hackSpeedup: 2.5,
  /** Hits the valve wheel takes to open (a smash or Upgrade: one). */
  valveTurns: 3,
  /** An intake's grate bites this hard, at most this often. */
  intakeDamage: 1,
  intakeEveryMs: 900,
  /** Lamps light this far (px) and this bright, centred this far under the fitting. */
  /** A woken section's lamps thud on in a wave out from Ben (px/s), each flaring this bright for a moment, with a thud this loud. */
  lampLight: { radius: 70, color: 0xdff4ff, intensity: 0.55, drop: 18, wakeSpeed: 240, wakeFlare: 1.8, wakeFlareMs: 260, wakeThud: 0.4 },
  /** The red emergency lights (the reactor's blackout): a slow pulse (rad/ms). */
  emergencyLight: { radius: 60, color: 0xff3a2a, intensity: 0.6, pulse: 0.004 },
  screenLight: { radius: 40, color: 0x7dffb0, intensity: 0.4 },
} as const;

/** Chapter 7's story beats: the docking ring and the split at the hub. */
export const CH7_BEATS = {
  ring: {
    /** Max's walk and hurry (his walk at twice its gait: his sheet has no run), Gwen's run (px/s): near their drawings' own gaits (config/cartoon/gait.ts), so their feet stay planted. */
    maxWalk: 36,
    maxHurry: 72,
    gwenRun: 62,
    /** Gwen at Ben's side (px/s): as fast as her run cycle can play (twice its gait); she pops back in when left far behind. */
    gwenFollow: 124,
    /** Where Max and Gwen stand at the capsule, and where they stop at the hatch, the locker and the hub (px). */
    maxStart: 34,
    gwenStart: -26,
    hatchGap: 18,
    lockerGap: 10,
    hubMax: -10,
    hubGwen: -34,
    /** The badge scan opening the bay's hatch (ms). */
    scanMs: 900,
    /** Ben this far past the hub's hatch (tiles): Max and Gwen are out of sight, back at their consoles. */
    leaveTiles: 24,
  },
} as const;

/** Kevin glimpsed on his way to the reactor, then the reactor itself (GAME_DESIGN.md, Chapter 7, beats 6 to 8). */
export const CH7_REACTOR = {
  glimpse: {
    /** His dash past the porthole (px/s: his run at one and a half times its gait), from and to this far either side of it (px). */
    speed: 110,
    fromPx: -64,
    toPx: 80,
    /** A shadow on the far side of the glass. */
    tint: 0x18141f,
  },
  /** Kevin drinking the reactor in: his purple light. */
  drainLight: { radius: 130, color: 0xb070ff, intensity: 0.85 },
  /** His bolt into the ceiling's bulkhead, then he's gone through it (ms after the lines). */
  blastMs: 450,
  exitMs: 1200,
  /** The sea pouring in (px/s), and the bubbles where it breaks through (every ms). */
  floodSpeed: 24,
  bubblesEveryMs: 220,
  /** The Omnitrix answers when Ben's air falls this low, or this long after the room is full (a form that needs no air, an air pocket). */
  unlockAir: 0.15,
  unlockAfterFullMs: 7000,
  /** Ripjaws bursts through the glass this fast (px/s) once he's out of the transformation. */
  burstSpeed: 360,
} as const;

/** The pump hall's intercom and Max in the containment block. */
export const CH7_LATE = {
  /** Ben back inside past this tile: Max and Gwen on the intercom. */
  pumpHallX: 266,
  /** DEEP BREATH: the flooded ring from here to the reactor (tiles), as Ben, never out of air. */
  deepBreath: { fromX: 68, toX: 150 },
  max: {
    /** He walks (his walk at twice its gait) to stay this far behind Ben, once Ben is this far ahead (px). */
    speed: 72,
    gap: 36,
    far: 84,
    /** His blaster: a bolt at the nearest enemy in range, now and then. */
    blastEveryMs: [1700, 2600] as const,
    range: 180,
    damage: 1,
    shotSpeed: 330,
    shotLifeMs: 900,
    /** The blaster's muzzle in his firing drawing (px over his feet, px ahead of him): the bolt starts there. */
    handHeight: 35,
    muzzleAhead: 25,
  },
  /** Ben this close to Cell 7 (tiles): the reveal. */
  cellNear: 2,
  /** At most this long waiting there for Max to walk up before he speaks anyway (ms). */
  cellWaitMs: 4500,
  /** The reveal waits until no enemy is this close to Ben (px), and is skipped once he's this far past the cell (tiles). */
  cellClearPx: 220,
  cellSkip: 6,
} as const;

/** Chapter 7's opening (GAME_DESIGN.md, beats 1 to 3): the jetty, the descent where the world turns HD, ACT 3: SECRETS, docking. Times in ms from the start. */
export const CH7_OPENING = {
  fadeInMs: 700,
  /** The family walks the last stretch of the jetty. */
  walkFrom: 1000,
  walkMs: 1800,
  walkPx: 64,
  /** Max's badge against the bollard: the scan line, then the car rises out of the sea. */
  scanAt: 3000,
  scanMs: 900,
  riseAt: 3900,
  riseMs: 1500,
  boardAt: 5900,
  boardMs: 800,
  /** The ride down, and the beacon's pings that turn the world (then the family) HD. */
  descendAt: 6900,
  descendMs: 9600,
  pings: [10000, 11500, 13000] as const,
  pingMs: 1100,
  resolveAt: 11500,
  kevinAt: 13000,
  kevinMs: 1300,
  /** The base below wakes lamp by lamp. */
  lampsAt: 15200,
  lampEveryMs: 260,
  titleAt: 16900,
  titleMs: 2600,
  dockAt: 19700,
  dockMs: 900,
  /** Skipping fades out this fast. */
  skipMs: 350,
  /** How the HD layer comes in at each ping (alpha after it). */
  hdSteps: [0.34, 0.67, 1] as const,
} as const;

/** Chapter 7's music: the base's theme inside the hull, the open sea's outside it (the owner's recordings, config/music.ts). */
export const CH7_MUSIC = {
  /** Tiles past the hull's edge before the music turns, either way, so swimming along the edge doesn't flip it. */
  seaMargin: 2,
} as const;
