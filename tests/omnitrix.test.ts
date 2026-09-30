import { describe, expect, it } from 'vitest';
import { Omnitrix, type OmnitrixConfig, type OmnitrixEvent } from '../src/systems/Omnitrix';
import { DIFFICULTY, OMNITRIX_WARNING_MS, getDifficulty } from '../src/config/difficulty';

const normal = getDifficulty('normal');
const CONFIG: OmnitrixConfig = {
  transformDurationMs: normal.transformDurationMs,
  cooldownMs: normal.cooldownMs,
  warningMs: OMNITRIX_WARNING_MS,
  wrongTransformChance: normal.wrongTransformChance,
};

function types(events: OmnitrixEvent[]): string[] {
  return events.map((e) => e.type);
}

/** Advances in small steps, collecting every event like a game loop would. */
function run(omni: Omnitrix, totalMs: number, stepMs = 16): OmnitrixEvent[] {
  const events: OmnitrixEvent[] = [];
  let left = totalMs;
  while (left > 0) {
    const dt = Math.min(stepMs, left);
    events.push(...omni.update(dt));
    left -= dt;
  }
  return events;
}

describe('difficulty presets', () => {
  it('normal uses the design numbers: 20s timer, 10s cooldown, 10% wrong transforms', () => {
    expect(DIFFICULTY.normal.transformDurationMs).toBe(20_000);
    expect(DIFFICULTY.normal.cooldownMs).toBe(10_000);
    expect(DIFFICULTY.normal.wrongTransformChance).toBe(0.1);
    expect(DIFFICULTY.normal.damageTakenMultiplier).toBe(1);
  });

  it('easy is more forgiving than normal, hard is harsher', () => {
    expect(DIFFICULTY.easy.transformDurationMs).toBeGreaterThan(DIFFICULTY.normal.transformDurationMs);
    expect(DIFFICULTY.hard.transformDurationMs).toBeLessThan(DIFFICULTY.normal.transformDurationMs);
    expect(DIFFICULTY.easy.cooldownMs).toBeLessThan(DIFFICULTY.hard.cooldownMs);
    expect(DIFFICULTY.easy.wrongTransformChance).toBe(0);
  });
});

describe('Omnitrix', () => {
  it('starts ready with nothing unlocked and refuses to transform', () => {
    const omni = new Omnitrix(CONFIG);
    expect(omni.state).toBe('ready');
    expect(omni.canTransform()).toBe(false);
    expect(omni.transform()).toEqual([]);
  });

  it('transforms into the selected alien and becomes active', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    const events = omni.transform();
    expect(events).toEqual([{ type: 'transformed', alienId: 'heatblast', requestedId: 'heatblast', wrong: false }]);
    expect(omni.state).toBe('active');
    expect(omni.activeAlienId).toBe('heatblast');
    expect(omni.timeRemainingMs).toBe(20_000);
    expect(omni.timeRatio).toBe(1);
  });

  it('cannot transform again while active or cooling down', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    expect(omni.transform()).toEqual([]);
    run(omni, 20_000);
    expect(omni.state).toBe('cooldown');
    expect(omni.transform()).toEqual([]);
  });

  it('counts down the timer and exposes the ratio for the HUD ring', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    run(omni, 5_000);
    expect(omni.timeRemainingMs).toBe(15_000);
    expect(omni.timeRatio).toBeCloseTo(0.75);
    expect(omni.isWarning).toBe(false);
  });

  it('beeps once per second during the last 5 seconds', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    const events = run(omni, 19_999);
    const warnings = events.filter((e) => e.type === 'warning');
    expect(warnings.map((w) => (w.type === 'warning' ? w.secondsLeft : -1))).toEqual([5, 4, 3, 2, 1]);
    expect(omni.isWarning).toBe(true);
  });

  it('does not warn before the final 5 seconds', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    const events = run(omni, 14_990);
    expect(events.some((e) => e.type === 'warning')).toBe(false);
  });

  it('forces a revert on timeout and starts the cooldown', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    const events = run(omni, 20_000);
    expect(events.filter((e) => e.type === 'reverted')).toEqual([
      { type: 'reverted', alienId: 'heatblast', reason: 'timeout' },
    ]);
    expect(omni.state).toBe('cooldown');
    expect(omni.activeAlienId).toBeNull();
    expect(omni.cooldownRemainingMs).toBe(10_000);
    expect(omni.cooldownProgress).toBe(0);
  });

  it('carries overflow from a long frame into the cooldown', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    omni.update(19_900);
    const events = omni.update(300);
    expect(types(events)).toEqual(['reverted']);
    expect(omni.cooldownRemainingMs).toBe(9_800);
  });

  it('becomes ready again after the 10s cooldown', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    run(omni, 20_000);
    const early = run(omni, 9_900);
    expect(early.some((e) => e.type === 'ready')).toBe(false);
    expect(omni.cooldownProgress).toBeCloseTo(0.99);
    const events = run(omni, 100);
    expect(types(events)).toEqual(['ready']);
    expect(omni.state).toBe('ready');
    expect(omni.canTransform()).toBe(true);
  });

  it('can be forced to revert early (heavy damage) with a full cooldown', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    omni.transform();
    run(omni, 3_000);
    expect(omni.revert('damage')).toEqual([{ type: 'reverted', alienId: 'heatblast', reason: 'damage' }]);
    expect(omni.state).toBe('cooldown');
    expect(omni.cooldownRemainingMs).toBe(10_000);
  });

  it('ignores revert requests when not transformed', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast']);
    expect(omni.revert('jammed')).toEqual([]);
    expect(omni.state).toBe('ready');
  });

  it('cycles the dial in both directions and wraps around', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast', 'fourarms', 'xlr8']);
    expect(omni.selectedAlien).toBe('heatblast');
    expect(omni.cycle(1)).toEqual([{ type: 'dial', selectedId: 'fourarms', index: 1, count: 3 }]);
    omni.cycle(1);
    omni.cycle(1);
    expect(omni.selectedAlien).toBe('heatblast');
    omni.cycle(-1);
    expect(omni.selectedAlien).toBe('xlr8');
  });

  it('lets the dial turn during cooldown so the next alien can be lined up', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast', 'fourarms']);
    omni.transform();
    run(omni, 20_000);
    omni.cycle(1);
    expect(omni.selectedAlien).toBe('fourarms');
  });

  it('unlocks aliens once', () => {
    const omni = new Omnitrix(CONFIG);
    expect(omni.unlock('heatblast')).toEqual([{ type: 'unlocked', alienId: 'heatblast' }]);
    expect(omni.unlock('heatblast')).toEqual([]);
    expect(omni.unlockedAliens).toEqual(['heatblast']);
    expect(omni.isUnlocked('heatblast')).toBe(true);
  });

  it('never misfires with only one alien unlocked', () => {
    const omni = new Omnitrix({ ...CONFIG, wrongTransformChance: 1 }, ['heatblast'], () => 0);
    const events = omni.transform();
    expect(events[0]).toMatchObject({ alienId: 'heatblast', wrong: false });
  });

  it('rolls a wrong transformation into a different alien when the chance hits', () => {
    const rolls = [0.05, 0.99];
    const omni = new Omnitrix(CONFIG, ['heatblast', 'fourarms', 'xlr8'], () => rolls.shift() ?? 0);
    const events = omni.transform();
    expect(events[0]).toEqual({ type: 'transformed', alienId: 'xlr8', requestedId: 'heatblast', wrong: true });
    expect(omni.activeAlienId).toBe('xlr8');
  });

  it('gives the requested alien when the roll misses', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast', 'fourarms'], () => 0.5);
    expect(omni.transform()[0]).toMatchObject({ alienId: 'heatblast', wrong: false });
  });

  it('misfires at roughly the configured rate', () => {
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const omni = new Omnitrix({ ...CONFIG, cooldownMs: 0 }, ['heatblast', 'fourarms'], rng);
    let wrong = 0;
    const trials = 5000;
    for (let i = 0; i < trials; i++) {
      const [event] = omni.transform();
      if (event.type === 'transformed' && event.wrong) wrong++;
      omni.revert('forced');
    }
    expect(wrong / trials).toBeGreaterThan(0.07);
    expect(wrong / trials).toBeLessThan(0.13);
  });

  it('reset returns to a ready watch but keeps unlocks and dial position', () => {
    const omni = new Omnitrix(CONFIG, ['heatblast', 'fourarms']);
    omni.cycle(1);
    omni.transform();
    omni.reset();
    expect(omni.state).toBe('ready');
    expect(omni.selectedAlien).toBe('fourarms');
    expect(omni.unlockedAliens).toHaveLength(2);
  });

  it('a zero cooldown makes the watch ready immediately', () => {
    const omni = new Omnitrix({ ...CONFIG, cooldownMs: 0 }, ['heatblast']);
    omni.transform();
    expect(types(omni.revert('forced'))).toEqual(['reverted', 'ready']);
  });
});
