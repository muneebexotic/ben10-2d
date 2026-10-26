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
} as const;

/** The base's water (Chapter 7): how fast levels move, and how it looks. */
export const PLUMBER_WATER = {
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
  lampLight: { radius: 70, color: 0xdff4ff, intensity: 0.55, drop: 18 },
  /** The red emergency lights (the reactor's blackout): a slow pulse (rad/ms). */
  emergencyLight: { radius: 60, color: 0xff3a2a, intensity: 0.6, pulse: 0.004 },
  screenLight: { radius: 40, color: 0x7dffb0, intensity: 0.4 },
} as const;
