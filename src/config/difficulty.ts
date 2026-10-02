export type DifficultyId = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_IDS: readonly DifficultyId[] = ['easy', 'normal', 'hard'];

export interface DifficultyPreset {
  label: string;
  /** Flavour name on the difficulty cards. */
  tagline: string;
  /** One line on what playing it feels like. */
  blurb: string;
  /** HUD and menu colour. */
  color: number;
  transformDurationMs: number;
  cooldownMs: number;
  wrongTransformChance: number;
  damageTakenMultiplier: number;
  checkpoints: 'frequent' | 'normal' | 'sparse';
  /**
   * Enemy pacing. Telegraphs are the same on every difficulty (always
   * readable); what changes is how long enemies rest between attacks, how
   * soon they start after waking, and how long they stay open to a punish.
   */
  enemyRest: number;
  enemyWake: number;
  punishWindow: number;
  /** Rest between the boss's attacks. */
  bossRest: number;
  /** The boss gets angry (phase 2) at this fraction of its health. */
  bossPhase2At: number;
  /** Health a Mr. Smoothy restores. */
  smoothyHeal: number;
  /** One-word summary of the enemy pacing for menus. */
  enemyLabel: string;
  checkpointLabel: string;
}

export const DIFFICULTY: Record<DifficultyId, DifficultyPreset> = {
  easy: {
    label: 'EASY',
    tagline: 'SUMMER VACATION',
    blurb: 'LONG ALIEN TIME, NO MISFIRES, EXTRA CHECKPOINTS. JUST HAVE FUN.',
    color: 0x7fd3ff,
    transformDurationMs: 30_000,
    cooldownMs: 6_000,
    wrongTransformChance: 0,
    damageTakenMultiplier: 0.5,
    checkpoints: 'frequent',
    enemyRest: 1.35,
    enemyWake: 1.4,
    punishWindow: 1.3,
    bossRest: 1.35,
    bossPhase2At: 0.5,
    smoothyHeal: 3,
    enemyLabel: 'RELAXED',
    checkpointLabel: 'EXTRA',
  },
  normal: {
    label: 'NORMAL',
    tagline: "IT'S HERO TIME",
    blurb: 'THE WAY IT WAS MEANT TO BE PLAYED. THE WATCH MISFIRES NOW AND THEN.',
    color: 0x5dff5a,
    transformDurationMs: 20_000,
    cooldownMs: 10_000,
    wrongTransformChance: 0.1,
    damageTakenMultiplier: 1,
    checkpoints: 'normal',
    enemyRest: 1,
    enemyWake: 1,
    punishWindow: 1,
    bossRest: 1,
    bossPhase2At: 0.5,
    smoothyHeal: 2,
    enemyLabel: 'STANDARD',
    checkpointLabel: 'STANDARD',
  },
  hard: {
    label: 'HARD',
    tagline: 'VILGAX IS WATCHING',
    blurb: 'SHORT ALIEN TIME, MISFIRE CHAOS, FEW CHECKPOINTS, RELENTLESS DRONES.',
    color: 0xff3048,
    transformDurationMs: 12_000,
    cooldownMs: 15_000,
    wrongTransformChance: 0.25,
    damageTakenMultiplier: 1.5,
    checkpoints: 'sparse',
    enemyRest: 0.68,
    enemyWake: 0.5,
    punishWindow: 0.75,
    bossRest: 0.7,
    bossPhase2At: 0.6,
    smoothyHeal: 2,
    enemyLabel: 'RELENTLESS',
    checkpointLabel: 'SPARSE',
  },
};

/** New files start here, and so does anything played without a file (URL playtest switches). */
export const DEFAULT_DIFFICULTY: DifficultyId = 'normal';

/** The watch beeps and flashes red for this long before timing out. */
export const OMNITRIX_WARNING_MS = 5_000;

/** One step down (Hard to Normal, Normal to Easy), or null on Easy. */
export function easierThan(id: DifficultyId): DifficultyId | null {
  const i = DIFFICULTY_IDS.indexOf(id);
  return i > 0 ? DIFFICULTY_IDS[i - 1] : null;
}

export function getDifficulty(id: DifficultyId): DifficultyPreset {
  return DIFFICULTY[id];
}

export function isDifficultyId(value: unknown): value is DifficultyId {
  return value === 'easy' || value === 'normal' || value === 'hard';
}
