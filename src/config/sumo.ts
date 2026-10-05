/**
 * SUMO SLAMMERS, the GAME ZONE cabinet KEV has topped for years. Three short
 * rounds against KEV's sumo, each harder: mash to push, and when he raises his
 * arms (the tell) sidestep his big shove for a swing toward his edge.
 */
export const SUMO = {
  rounds: 3,
  roundMs: 10_000,
  /** Ring position runs from -1 (Ben out) to +1 (KEV out). */
  pushPerTap: 0.034,
  /** KEV's steady push per second, by round. */
  kevPushPerSec: [0.16, 0.24, 0.33] as const,
  /** KEV's shove: arms up for `tellMs` (same every round), then the shove. */
  shove: { tellMs: 650, everyMs: [3200, 2600, 2000] as const, hit: 0.32, dodgeSwing: 0.3, dodgeWindowMs: 650 },
  /** Mashing is capped (no autoclicker wins). */
  maxTapsPerSec: 14,
  /** Short breather between rounds. */
  betweenMs: 1400,
  introMs: 1300,
  outroMs: 1800,
  /** The score KEV holds on every table. */
  kevScore: 999_990,
} as const;
