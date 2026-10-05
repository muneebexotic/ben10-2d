import { describe, expect, it } from 'vitest';
import { COPY_RULES, RELIANCE } from '../src/config/kevin';
import { HUMAN, Reliance, copyMultiplier, levelFor, topCopies } from '../src/entities/bosses/kevin/rules';

/** Plays `ms` of fight time as `form`, in game-loop steps. */
function play(r: Reliance, form: string, ms: number, dps = 0): void {
  for (let t = 0; t < ms; t += 16) {
    r.tick(16, form);
    if (dps > 0) r.hit(form, (dps * 16) / 1000);
  }
}

describe('Kevin 11 reliance', () => {
  it('levels follow the thresholds', () => {
    const [a, b, c] = RELIANCE.levels;
    expect(levelFor(0, RELIANCE.levels)).toBe(0);
    expect(levelFor(a, RELIANCE.levels)).toBe(1);
    expect(levelFor(b - 0.1, RELIANCE.levels)).toBe(1);
    expect(levelFor(b, RELIANCE.levels)).toBe(2);
    expect(levelFor(c, RELIANCE.levels)).toBe(3);
  });

  it('one alien for two full transformations (with the cooldown between) reaches level III', () => {
    const r = new Reliance();
    play(r, 'heatblast', 20_000, 3);
    expect(r.level('heatblast')).toBe(2);
    play(r, HUMAN, 10_000);
    play(r, 'heatblast', 20_000, 3);
    expect(r.level('heatblast')).toBe(3);
    expect(r.peakLevel).toBe(3);
  });

  it('switching every ten seconds keeps every copy weak', () => {
    const r = new Reliance();
    const cycle = ['heatblast', 'fourarms', 'xlr8', 'stinkfly'];
    for (let i = 0; i < 12; i++) play(r, cycle[i % cycle.length], 10_000, 3);
    for (const id of cycle) expect(r.level(id)).toBeLessThanOrEqual(1);
    expect(r.peakLevel).toBeLessThan(3);
  });

  it('human Ben teaches him nothing, and reliance fades while unused', () => {
    const r = new Reliance();
    play(r, HUMAN, 30_000, 5);
    expect(r.ranked()).toEqual([]);
    play(r, 'wildmutt', 10_000, 3);
    const before = r.value('wildmutt');
    play(r, HUMAN, 5_000);
    expect(r.value('wildmutt')).toBeCloseTo(before - RELIANCE.decayPerSecond * 5, 0);
  });

  it('a caught lunge bumps the copy one level, capped at III', () => {
    const r = new Reliance();
    expect(r.copyLevel('xlr8')).toBe(1);
    r.bump('xlr8');
    expect(r.level('xlr8')).toBe(1);
    r.bump('xlr8');
    expect(r.level('xlr8')).toBe(2);
    r.bump('xlr8');
    r.bump('xlr8');
    expect(r.level('xlr8')).toBe(3);
    expect(r.value('xlr8')).toBeLessThanOrEqual(RELIANCE.max);
  });

  it('ranks the most-used aliens first', () => {
    const r = new Reliance();
    play(r, 'stinkfly', 8_000, 2);
    play(r, 'fourarms', 6_000, 4);
    expect(r.ranked()[0]).toBe('fourarms');
    expect(topCopies(r, HUMAN)).toEqual(['fourarms', 'stinkfly']);
    expect(topCopies(new Reliance(), 'upgrade')).toEqual(['upgrade']);
  });
});

describe('Kevin 11 damage rules', () => {
  const base = { attacker: 'heatblast', copied: 'heatblast', copyLevel: 1 as const, sinceCopyMs: 5000, syncSpent: false };

  it('the copied alien barely hurts its own copy: 60/40/20%', () => {
    expect(copyMultiplier(base)).toEqual({ mult: COPY_RULES.sameResist[0], verdict: 'resisted' });
    expect(copyMultiplier({ ...base, copyLevel: 2 }).mult).toBe(0.4);
    expect(copyMultiplier({ ...base, copyLevel: 3 })).toEqual({ mult: 0.2, verdict: 'perfectCopy' });
  });

  it('any other alien does full damage, and its first hit soon after he copies is OUT OF SYNC', () => {
    expect(copyMultiplier({ ...base, attacker: 'fourarms' })).toEqual({ mult: 1, verdict: 'normal' });
    expect(copyMultiplier({ ...base, attacker: 'fourarms', sinceCopyMs: 300 })).toEqual({ mult: COPY_RULES.outOfSyncMultiplier, verdict: 'outOfSync' });
    expect(copyMultiplier({ ...base, attacker: 'fourarms', sinceCopyMs: 300, syncSpent: true }).verdict).toBe('normal');
  });

  it('human punches and plain Kevin take normal damage', () => {
    expect(copyMultiplier({ ...base, attacker: HUMAN }).mult).toBe(1);
    expect(copyMultiplier({ ...base, copied: null }).mult).toBe(1);
  });

  it('KEVIN 11 resists each alien by how well he copied it; the barely-copied hurt most', () => {
    const levels: Record<string, 0 | 1 | 2 | 3> = { heatblast: 3, xlr8: 0 };
    const chimera = { levelOf: (f: string) => levels[f] ?? 0 };
    const hot = copyMultiplier({ ...base, chimera });
    const fast = copyMultiplier({ ...base, attacker: 'xlr8', chimera });
    expect(fast.mult).toBeGreaterThan(1);
    expect(hot.mult).toBeLessThan(fast.mult);
    expect(hot.verdict).toBe('resisted');
    expect(copyMultiplier({ ...base, attacker: 'xlr8', chimera, unstable: true }).mult).toBeCloseTo(fast.mult * COPY_RULES.unstableMultiplier);
  });

  it('switching is rewarded but never required: even a perfect copy can be beaten', () => {
    expect(Math.min(...COPY_RULES.sameResist)).toBeGreaterThan(0);
    expect(Math.min(...COPY_RULES.chimeraMultiplier)).toBeGreaterThan(0);
  });
});
