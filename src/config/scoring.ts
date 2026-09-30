export type Rank = 'S' | 'A' | 'B' | 'C' | 'D';

export const SCORING = {
  base: 1000,
  parTimeMs: 300_000,
  pointsPerSecondOverPar: 2,
  pointsPerSecondUnderPar: 1,
  damagePenalty: 45,
  deathPenalty: 160,
  cardBonus: 70,
  comboBonusPerHit: 4,
  comboBonusCap: 140,
  enemyBonus: 3,
  thresholds: [
    { rank: 'S', min: 1150 },
    { rank: 'A', min: 950 },
    { rank: 'B', min: 750 },
    { rank: 'C', min: 500 },
  ] as ReadonlyArray<{ rank: Rank; min: number }>,
} as const;

export const RANK_ORDER: Rank[] = ['D', 'C', 'B', 'A', 'S'];
