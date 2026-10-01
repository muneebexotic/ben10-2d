import type { DifficultyPreset } from '../../config/difficulty';

/** Readable summaries of what each difficulty changes, straight from config/difficulty.ts. */
export function difficultyRows(d: DifficultyPreset): Array<[string, string]> {
  const pct = Math.round(d.wrongTransformChance * 100);
  return [
    ['ALIEN TIME', `${Math.round(d.transformDurationMs / 1000)}S`],
    ['RECHARGE', `${Math.round(d.cooldownMs / 1000)}S`],
    ['MISFIRES', pct === 0 ? 'NEVER' : `${pct}%`],
    ['DAMAGE TAKEN', `X${d.damageTakenMultiplier}`],
    ['CHECKPOINTS', d.checkpointLabel],
    ['ENEMIES', d.enemyLabel],
  ];
}
