import { describe, expect, it } from 'vitest';
import { DIFFICULTY, DIFFICULTY_IDS, easierThan, isDifficultyId } from '../src/config/difficulty';
import { activeDifficultyId, pace, setActiveDifficulty } from '../src/systems/Difficulty';
import { misfireAllowed } from '../src/systems/MisfireRules';
import { checkpointsFor } from '../src/levels/checkpoints';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { storyLevels } from '../src/levels/registry';
import { createRunStats, sanitizeRunStats } from '../src/systems/RunStats';

describe('difficulty presets', () => {
  it('match the design table', () => {
    expect(DIFFICULTY.easy).toMatchObject({ transformDurationMs: 30_000, cooldownMs: 6_000, wrongTransformChance: 0, damageTakenMultiplier: 0.5, checkpoints: 'frequent' });
    expect(DIFFICULTY.normal).toMatchObject({ transformDurationMs: 20_000, cooldownMs: 10_000, wrongTransformChance: 0.1, damageTakenMultiplier: 1, checkpoints: 'normal' });
    expect(DIFFICULTY.hard).toMatchObject({ transformDurationMs: 12_000, cooldownMs: 15_000, wrongTransformChance: 0.25, damageTakenMultiplier: 1.5, checkpoints: 'sparse' });
  });

  it('Hard is more than bigger numbers: enemies rest less, wake sooner, punish windows shrink, the boss rages earlier', () => {
    const { easy, normal, hard } = DIFFICULTY;
    for (const key of ['enemyRest', 'enemyWake', 'punishWindow', 'bossRest'] as const) {
      expect(hard[key], key).toBeLessThan(normal[key]);
      expect(easy[key], key).toBeGreaterThan(normal[key]);
    }
    expect(hard.bossPhase2At).toBeGreaterThan(normal.bossPhase2At);
    expect(easy.smoothyHeal).toBeGreaterThanOrEqual(normal.smoothyHeal);
  });

  it('pacing follows the active difficulty', () => {
    const was = activeDifficultyId();
    try {
      setActiveDifficulty('normal');
      expect(pace.rest(1000)).toBe(1000);
      setActiveDifficulty('hard');
      expect(pace.rest(1000)).toBe(1000 * DIFFICULTY.hard.enemyRest);
      expect(pace.punish(1000)).toBe(1000 * DIFFICULTY.hard.punishWindow);
      expect(setActiveDifficulty('hard')).toBe(false);
      expect(setActiveDifficulty('easy')).toBe(true);
      expect(pace.wake(1000)).toBe(1000 * DIFFICULTY.easy.enemyWake);
    } finally {
      setActiveDifficulty(was);
    }
  });

  it('checkpoints get sparser with difficulty (Chapter 1: 4 / 3 / 2)', () => {
    const was = activeDifficultyId();
    const count: Record<string, number> = {};
    try {
      for (const id of DIFFICULTY_IDS) {
        setActiveDifficulty(id);
        count[id] = checkpointsFor(CHAPTER_1).length;
      }
    } finally {
      setActiveDifficulty(was);
    }
    expect(count).toEqual({ easy: 4, normal: 3, hard: 2 });
  });

  it('Hard still checkpoints every major set piece: each boss arena and each chase stage', () => {
    for (const level of storyLevels()) {
      const sparse = checkpointsFor(level, 'sparse');
      for (const boss of level.entities.filter((e) => e.type === 'boss')) {
        if (boss.type !== 'boss') continue;
        // A checkpoint right before the arena (nothing in between to replay).
        const before = sparse.filter((c) => c.x <= boss.triggerX && boss.triggerX - c.x <= 12);
        expect(before.length, `${level.id}: checkpoint before the boss on Hard`).toBeGreaterThan(0);
      }
      const chase = level.story?.chase;
      if (chase) {
        expect(sparse.map((c) => c.id), `${level.id}: the convoy checkpoint on Hard`).toContain(chase.checkpoint);
        expect(sparse.some((c) => c.x <= chase.boardX && chase.boardX - c.x <= 24), `${level.id}: a checkpoint before the ride`).toBe(true);
      }
    }
  });

  it('recognises difficulty ids', () => {
    expect(DIFFICULTY_IDS.every(isDifficultyId)).toBe(true);
    expect(isDifficultyId('nightmare')).toBe(false);
    expect(isDifficultyId(3)).toBe(false);
  });
});

describe('when the watch may misfire', () => {
  const base = { training: false, transformations: 3, introPlaying: false, bossIntro: false };

  it('in normal play', () => {
    expect(misfireAllowed(base)).toBe(true);
  });

  it('never on the first transformation, in the intro, or during a boss entrance', () => {
    expect(misfireAllowed({ ...base, transformations: 0 })).toBe(false);
    expect(misfireAllowed({ ...base, introPlaying: true })).toBe(false);
    expect(misfireAllowed({ ...base, bossIntro: true })).toBe(false);
  });

  it('Training leaves it to its own switch', () => {
    expect(misfireAllowed({ ...base, training: true, transformations: 0, bossIntro: true })).toBe(true);
  });
});

describe('run stats from a save', () => {
  it('round-trips and repairs', () => {
    const stats = { ...createRunStats(4, true, 'hard'), timeMs: 1234, misfires: 2, improvised: 1, cardsFound: ['a'] };
    expect(sanitizeRunStats(JSON.parse(JSON.stringify(stats)))).toEqual(stats);
    expect(sanitizeRunStats({ timeMs: 5, deaths: -3, difficulty: 'nope', cardsFound: ['x', 2] })).toMatchObject({ timeMs: 5, deaths: 0, difficulty: 'normal', cardsFound: ['x'], misfires: 0 });
    expect(sanitizeRunStats({ deaths: 1 })).toBeNull();
    expect(sanitizeRunStats(null)).toBeNull();
  });
});

describe('make it easier', () => {
  it('steps down one difficulty at a time and stops at Easy', () => {
    expect(easierThan('hard')).toBe('normal');
    expect(easierThan('normal')).toBe('easy');
    expect(easierThan('easy')).toBeNull();
  });
});
