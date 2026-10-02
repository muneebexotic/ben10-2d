import { SCORING, type Rank } from '../config/scoring';
import { isDifficultyId, type DifficultyId } from '../config/difficulty';

export interface RunStats {
  timeMs: number;
  damageTaken: number;
  enemiesDefeated: number;
  deaths: number;
  cardsFound: string[];
  totalCards: number;
  bestCombo: number;
  transformations: number;
  parries: number;
  perfectTransforms: number;
  /** Wrong transformations, and how many of those got a KO anyway ("improvised"). */
  misfires: number;
  improvised: number;
  /** Mid-transformation swaps, and the most forms (Ben included) that joined one combo. */
  swaps: number;
  bestTagTeam: number;
  /** Thrown enemies that bowled over two or more others. */
  strikes: number;
  /** XLR8 dashes that cut four or more enemies at once. */
  multiCuts: number;
  /** False for practice runs started mid-level (?start=): they never set best times or splits. */
  fullRun: boolean;
  /** The Vilgax hologram already played this run (retries skip it). */
  sawVilgax: boolean;
  /** The difficulty the run started on. Bests are kept per difficulty. */
  difficulty: DifficultyId;
  /** The difficulty changed mid-run: it still counts as a clear, but isn't timed. */
  mixedDifficulty: boolean;
}

export interface RankResult {
  rank: Rank;
  score: number;
}

export function createRunStats(totalCards: number, fullRun = true, difficulty: DifficultyId = 'normal'): RunStats {
  return {
    timeMs: 0,
    damageTaken: 0,
    enemiesDefeated: 0,
    deaths: 0,
    cardsFound: [],
    totalCards,
    bestCombo: 0,
    transformations: 0,
    parries: 0,
    perfectTransforms: 0,
    misfires: 0,
    improvised: 0,
    swaps: 0,
    bestTagTeam: 0,
    strikes: 0,
    multiCuts: 0,
    fullRun,
    sawVilgax: false,
    difficulty,
    mixedDifficulty: false,
  };
}

/** Rebuilds run stats read back from a save (a resume point). Null if they are unusable. */
export function sanitizeRunStats(raw: unknown): RunStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  if (typeof r.timeMs !== 'number' || !Number.isFinite(r.timeMs)) return null;
  return {
    timeMs: n(r.timeMs),
    damageTaken: n(r.damageTaken),
    enemiesDefeated: n(r.enemiesDefeated),
    deaths: n(r.deaths),
    cardsFound: Array.isArray(r.cardsFound) ? r.cardsFound.filter((c): c is string => typeof c === 'string') : [],
    totalCards: n(r.totalCards),
    bestCombo: n(r.bestCombo),
    transformations: n(r.transformations),
    parries: n(r.parries),
    perfectTransforms: n(r.perfectTransforms),
    misfires: n(r.misfires),
    improvised: n(r.improvised),
    swaps: n(r.swaps),
    bestTagTeam: n(r.bestTagTeam),
    strikes: n(r.strikes),
    multiCuts: n(r.multiCuts),
    fullRun: r.fullRun === true,
    sawVilgax: r.sawVilgax === true,
    difficulty: isDifficultyId(r.difficulty) ? r.difficulty : 'normal',
    mixedDifficulty: r.mixedDifficulty === true,
  };
}

export function cloneRunStats(stats: RunStats): RunStats {
  return { ...stats, cardsFound: [...stats.cardsFound] };
}

/** `parTimeMs`: the chapter's par (longer chapters get a longer one). */
export function computeScore(stats: RunStats, parTimeMs: number = SCORING.parTimeMs): number {
  const seconds = stats.timeMs / 1000;
  const parSeconds = parTimeMs / 1000;
  const timeDelta = seconds - parSeconds;
  const timePoints =
    timeDelta > 0 ? -timeDelta * SCORING.pointsPerSecondOverPar : -timeDelta * SCORING.pointsPerSecondUnderPar;

  const comboPoints = Math.min(SCORING.comboBonusCap, stats.bestCombo * SCORING.comboBonusPerHit);
  const perfectPoints = Math.min(SCORING.perfectBonusCap, stats.perfectTransforms * SCORING.perfectBonus);
  const swapPoints = Math.min(SCORING.swapBonusCap, stats.swaps * SCORING.swapBonus) + tagTeamPoints(stats.bestTagTeam);

  return Math.round(
    SCORING.base +
      timePoints -
      stats.damageTaken * SCORING.damagePenalty -
      stats.deaths * SCORING.deathPenalty +
      stats.cardsFound.length * SCORING.cardBonus +
      comboPoints +
      perfectPoints +
      swapPoints +
      stats.enemiesDefeated * SCORING.enemyBonus,
  );
}

/** Bonus for the biggest tag team: each form past the first in one combo. */
export function tagTeamPoints(forms: number): number {
  return Math.max(0, forms - 1) * SCORING.tagTeamBonusPerForm;
}

export function computeRank(stats: RunStats, parTimeMs?: number): RankResult {
  const score = computeScore(stats, parTimeMs);
  const match = SCORING.thresholds.find((t) => score >= t.min);
  return { rank: match ? match.rank : 'D', score };
}

/** m:ss.cc */
export function formatTime(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const centis = Math.floor((safe % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}
