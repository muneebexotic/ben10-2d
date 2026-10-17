/**
 * Chapter 6's story timings (Karachi). Every beat is skippable; a retry or a
 * continue never replays what was already seen.
 */
export const CH6_BEATS = {
  coldOpen: {
    /** The port at dusk: the crane lowers the Rustbucket onto the dock. */
    portFadeMs: 600,
    craneMs: 3200,
    portLinesAt: 1400,
    fadeMs: 500,
    bannerAt: 400,
    bannerMs: 1600,
    linesAt: 2400,
    /** Hex's show: the Charms float over from the exhibition, Charmcaster snatches them. */
    charmFlyMs: 1600,
    snatchMs: 700,
    chaosMs: 1400,
  },
  /** The Rustbucket rams the palace gate. */
  gate: { driveMs: 1300, settleMs: 900, doorFlyMs: 900 },
  /** Gwen's lessons: the moment the spell first comes out of her (slow motion), then the card. */
  lesson: { slowScale: 0.25, slowMs: 900, castAt: 500, linesAt: 1100 },
  /** Charmcaster's cage: she appears, the bars slam down, the watch finds new DNA. */
  cage: { appearMs: 500, slamAt: 900, leaveAt: 2600, unlockAt: 3600 },
  /** Max in the tunnel: the ambush, his foam, his answer. */
  max: { runMs: 700, sprayEveryMs: 1500, sprayRange: 90, sprayStunMs: 1800 },
  /** The Spell Engine: Grey Matter crawls into the vent. */
  engine: { crawlMs: 700, jamMs: 1600 },
} as const;
