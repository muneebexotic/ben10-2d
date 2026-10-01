import { SCORING, type Rank } from '../config/scoring';

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
  /** False for practice runs started mid-level (?start=): they never set best times or splits. */
  fullRun: boolean;
  /** The Vilgax hologram already played this run (retries skip it). */
  sawVilgax: boolean;
}

export interface RankResult {
  rank: Rank;
  score: number;
}

export function createRunStats(totalCards: number, fullRun = true): RunStats {
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
    fullRun,
    sawVilgax: false,
  };
}

export function cloneRunStats(stats: RunStats): RunStats {
  return { ...stats, cardsFound: [...stats.cardsFound] };
}

export function computeScore(stats: RunStats): number {
  const seconds = stats.timeMs / 1000;
  const parSeconds = SCORING.parTimeMs / 1000;
  const timeDelta = seconds - parSeconds;
  const timePoints =
    timeDelta > 0 ? -timeDelta * SCORING.pointsPerSecondOverPar : -timeDelta * SCORING.pointsPerSecondUnderPar;

  const comboPoints = Math.min(SCORING.comboBonusCap, stats.bestCombo * SCORING.comboBonusPerHit);
  const perfectPoints = Math.min(SCORING.perfectBonusCap, stats.perfectTransforms * SCORING.perfectBonus);

  return Math.round(
    SCORING.base +
      timePoints -
      stats.damageTaken * SCORING.damagePenalty -
      stats.deaths * SCORING.deathPenalty +
      stats.cardsFound.length * SCORING.cardBonus +
      comboPoints +
      perfectPoints +
      stats.enemiesDefeated * SCORING.enemyBonus,
  );
}

export function computeRank(stats: RunStats): RankResult {
  const score = computeScore(stats);
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
