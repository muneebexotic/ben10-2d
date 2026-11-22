/**
 * Chapter 8's story timing and staging (the circus). Times ms, speeds px/s,
 * positions tiles (they match `levels/chapter8.ts`).
 */
export const CH8_BEATS = {
  /** Gwen keeps up with Ben at this pace (her drawn run stays planted: config/cartoon/gait.ts). */
  gwenFollow: 120,
  /** Starting at or past this tile the chapter opens on its indoor music (the funhouse on). */
  indoorMusicFrom: 102,
  /** The cold open: the family walks the boardwalk, then the lines play. */
  opening: { walkMs: 2600, holdMs: 400 },
  /** The show: Cacklejack's patter, the scream he drinks, IRONJAW striding off with Max. */
  show: { scareMs: 1400, carrySpeed: 70, ironjawFromX: 100 },
  /** THE TANGLE's arm out of the mirror and back with Gwen. */
  gwenTaken: { reachMs: 600, pullMs: 700 },
  /** The barrel: how long it spins (and the spiked walls close) before the watch answers; how far the walls close. */
  barrel: { spinMs: 4200, closeTiles: 3, throwVx: 140, alienEveryMs: 900 },
  /** The heart: hits to crack Gwen's mirror. */
  heart: { hits: 3 },
  /** Max's cage over the ring drops into the net after the fight. */
  ending: { dropMs: 900 },
} as const;
