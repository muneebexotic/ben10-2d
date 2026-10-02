import { describe, expect, it } from 'vitest';
import { computeRank, computeScore, createRunStats, formatTime, cloneRunStats, sanitizeRunStats, tagTeamPoints } from '../src/systems/RunStats';
import { ComboCounter } from '../src/systems/Combo';
import { SCORING } from '../src/config/scoring';

describe('RunStats', () => {
  it('formats times as m:ss.cc', () => {
    expect(formatTime(0)).toBe('0:00.00');
    expect(formatTime(61_234)).toBe('1:01.23');
    expect(formatTime(599_999)).toBe('9:59.99');
    expect(formatTime(-5)).toBe('0:00.00');
  });

  it('a flawless fast run with all cards is S rank', () => {
    const stats = createRunStats(3);
    stats.timeMs = 180_000;
    stats.cardsFound = ['a', 'b', 'c'];
    stats.enemiesDefeated = 30;
    stats.bestCombo = 20;
    expect(computeRank(stats).rank).toBe('S');
  });

  it('a slow run with many deaths drops to a low rank', () => {
    const stats = createRunStats(3);
    stats.timeMs = 720_000;
    stats.deaths = 4;
    stats.damageTaken = 12;
    expect(['C', 'D']).toContain(computeRank(stats).rank);
  });

  it('score gets worse with damage, deaths and time and better with cards', () => {
    const base = createRunStats(3);
    base.timeMs = SCORING.parTimeMs;
    const score = computeScore(base);
    expect(computeScore({ ...base, damageTaken: 2 })).toBeLessThan(score);
    expect(computeScore({ ...base, deaths: 1 })).toBeLessThan(score);
    expect(computeScore({ ...base, timeMs: base.timeMs + 60_000 })).toBeLessThan(score);
    expect(computeScore({ ...base, timeMs: base.timeMs - 60_000 })).toBeGreaterThan(score);
    expect(computeScore({ ...base, cardsFound: ['x'] })).toBeGreaterThan(score);
  });

  it('caps the combo bonus', () => {
    const base = createRunStats(3);
    base.timeMs = SCORING.parTimeMs;
    expect(computeScore({ ...base, bestCombo: 1000 })).toBe(computeScore(base) + SCORING.comboBonusCap);
  });

  it('clones without sharing the card list', () => {
    const stats = createRunStats(3);
    const copy = cloneRunStats(stats);
    copy.cardsFound.push('x');
    expect(stats.cardsFound).toEqual([]);
  });
});

describe('ComboCounter', () => {
  it('counts hits and tracks the best combo', () => {
    const combo = new ComboCounter(1000);
    combo.hit();
    combo.hit();
    expect(combo.hit()).toBe(3);
    expect(combo.best).toBe(3);
    combo.break();
    combo.hit();
    expect(combo.count).toBe(1);
    expect(combo.best).toBe(3);
  });

  it('drops after the window expires and reports the dropped count', () => {
    const combo = new ComboCounter(1000);
    combo.hit();
    combo.hit();
    expect(combo.update(900)).toBe(0);
    expect(combo.timeLeftRatio).toBeCloseTo(0.1);
    expect(combo.update(200)).toBe(2);
    expect(combo.count).toBe(0);
  });

  it('each hit refreshes the window', () => {
    const combo = new ComboCounter(1000);
    combo.hit();
    combo.update(900);
    combo.hit();
    expect(combo.update(900)).toBe(0);
    expect(combo.count).toBe(2);
  });

  it('remembers which forms joined, in order, and flags each newcomer once', () => {
    const combo = new ComboCounter(1000);
    combo.hit('ben');
    expect(combo.newContributor).toBe(true);
    combo.hit('ben');
    expect(combo.newContributor).toBe(false);
    combo.hit('xlr8');
    expect(combo.newContributor).toBe(true);
    combo.hit('fourarms');
    combo.hit('xlr8');
    expect(combo.newContributor).toBe(false);
    expect(combo.contributors).toEqual(['ben', 'xlr8', 'fourarms']);
  });

  it('a dropped or broken combo forgets its forms', () => {
    const combo = new ComboCounter(1000);
    combo.hit('heatblast');
    combo.hit('xlr8');
    combo.update(1200);
    expect(combo.contributors).toEqual([]);
    combo.hit('xlr8');
    expect(combo.newContributor).toBe(true);
    expect(combo.contributors).toEqual(['xlr8']);
    combo.break();
    expect(combo.contributors).toEqual([]);
    expect(combo.newContributor).toBe(false);
  });

  it('hits without a form still count but never join', () => {
    const combo = new ComboCounter(1000);
    combo.hit();
    expect(combo.newContributor).toBe(false);
    expect(combo.contributors).toEqual([]);
    expect(combo.count).toBe(1);
  });
});

describe('switching mastery', () => {
  it('swaps add a little score, capped', () => {
    const base = createRunStats(3);
    base.timeMs = SCORING.parTimeMs;
    const score = computeScore(base);
    expect(computeScore({ ...base, swaps: 3 })).toBe(score + 3 * SCORING.swapBonus);
    expect(computeScore({ ...base, swaps: 1000 })).toBe(score + SCORING.swapBonusCap);
  });

  it('the best tag team pays per form past the first', () => {
    expect(tagTeamPoints(0)).toBe(0);
    expect(tagTeamPoints(1)).toBe(0);
    expect(tagTeamPoints(3)).toBe(2 * SCORING.tagTeamBonusPerForm);
  });

  it('a longer chapter can set its own par', () => {
    const stats = createRunStats(3);
    stats.timeMs = 400_000;
    expect(computeScore(stats, 420_000)).toBeGreaterThan(computeScore(stats));
  });

  it('old resume points without the new counters still load', () => {
    const raw = { ...createRunStats(3) } as Record<string, unknown>;
    delete raw.swaps;
    delete raw.strikes;
    const back = sanitizeRunStats(raw)!;
    expect(back.swaps).toBe(0);
    expect(back.strikes).toBe(0);
    expect(back.multiCuts).toBe(0);
  });
});
