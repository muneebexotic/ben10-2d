import { describe, expect, it } from 'vitest';
import { Omnitrix, type OmnitrixConfig, type OmnitrixEvent } from '../src/systems/Omnitrix';
import { DIFFICULTY, OMNITRIX_WARNING_MS, type DifficultyId } from '../src/config/difficulty';
import { MISFIRE, SWAP } from '../src/config/omnitrix';
import { seededRng } from '../src/systems/Rng';
import { allAliens } from '../src/aliens/registry';
import { GENERIC_MISFIRE_LINES, MisfireQuips, misfireLines } from '../src/aliens/misfire';

const ROSTER = ['heatblast', 'fourarms', 'xlr8'];

function configFor(id: DifficultyId, overrides: Partial<OmnitrixConfig> = {}): OmnitrixConfig {
  const d = DIFFICULTY[id];
  return {
    transformDurationMs: d.transformDurationMs,
    cooldownMs: 0,
    warningMs: OMNITRIX_WARNING_MS,
    wrongTransformChance: d.wrongTransformChance,
    swapEnabled: true,
    swapCostMs: SWAP.costMs,
    swapLockoutMs: SWAP.lockoutMs,
    swapMisfireScale: MISFIRE.swapChanceScale,
    misfireFixCostScale: MISFIRE.fixCostScale,
    improviseBonusMs: MISFIRE.improviseBonusMs,
    ...overrides,
  };
}

function first(events: OmnitrixEvent[]): OmnitrixEvent {
  expect(events.length).toBeGreaterThan(0);
  return events[0];
}

/** Transforms `trials` times with a seeded RNG and returns the misfire rate. */
function transformRate(id: DifficultyId, seed: number, trials = 20_000): number {
  const omni = new Omnitrix(configFor(id), ROSTER, seededRng(seed));
  let wrong = 0;
  for (let i = 0; i < trials; i++) {
    const e = first(omni.transform());
    if (e.type === 'transformed' && e.wrong) wrong++;
    omni.revert('forced');
  }
  return wrong / trials;
}

/** Swaps `trials` times (never the owed fix swap) and returns the misfire rate. */
function swapRate(id: DifficultyId, seed: number, trials = 20_000): number {
  const omni = new Omnitrix(configFor(id, { swapCostMs: 0 }), ROSTER, seededRng(seed));
  let wrong = 0;
  let counted = 0;
  omni.transform({ allowMisfire: false });
  for (let i = 0; i < trials; i++) {
    omni.update(SWAP.lockoutMs);
    // Keep the timer topped up so the transformation never ends.
    omni.extend(SWAP.lockoutMs);
    if (omni.fixSwapOwed) {
      // Spend the owed fix (it can't misfire) so every counted roll is a normal swap.
      omni.select(ROSTER.find((a) => a !== omni.activeAlienId)!);
      omni.swap();
      continue;
    }
    omni.select(ROSTER.find((a) => a !== omni.activeAlienId)!);
    const e = first(omni.swap());
    counted++;
    if (e.type === 'swapped' && e.wrong) wrong++;
  }
  return wrong / counted;
}

describe('misfire rates (seeded)', () => {
  it('transforms misfire at the difficulty chance: Easy 0%, Normal 10%, Hard 25%', () => {
    expect(DIFFICULTY.easy.wrongTransformChance).toBe(0);
    expect(DIFFICULTY.normal.wrongTransformChance).toBe(0.1);
    expect(DIFFICULTY.hard.wrongTransformChance).toBe(0.25);
    expect(transformRate('easy', 1)).toBe(0);
    expect(transformRate('normal', 2)).toBeCloseTo(0.1, 1);
    expect(transformRate('hard', 3)).toBeCloseTo(0.25, 1);
  });

  it('swaps misfire at half the chance', () => {
    expect(MISFIRE.swapChanceScale).toBe(0.5);
    expect(swapRate('easy', 4)).toBe(0);
    const normal = swapRate('normal', 5);
    const hard = swapRate('hard', 6);
    expect(normal).toBeGreaterThan(0.04);
    expect(normal).toBeLessThan(0.06);
    expect(hard).toBeGreaterThan(0.11);
    expect(hard).toBeLessThan(0.14);
  });

  it('the same seed gives the same sequence of aliens', () => {
    const sequence = (seed: number) => {
      const omni = new Omnitrix(configFor('hard'), ROSTER, seededRng(seed));
      const got: string[] = [];
      for (let i = 0; i < 200; i++) {
        got.push(omni.transform().map((e) => (e.type === 'transformed' ? e.alienId : '')).join());
        omni.revert('forced');
      }
      return got;
    };
    expect(sequence(77)).toEqual(sequence(77));
    expect(sequence(77)).not.toEqual(sequence(78));
  });

  it('reports the chance it will roll', () => {
    const omni = new Omnitrix(configFor('hard'), ROSTER, seededRng(1));
    expect(omni.misfireChance('transform')).toBe(0.25);
    expect(omni.misfireChance('swap')).toBe(0.125);
  });
});

describe('misfire rules', () => {
  it('never misfires into the alien you already are', () => {
    const rng = seededRng(9);
    for (let i = 0; i < 2000; i++) {
      const omni = new Omnitrix(configFor('hard', { wrongTransformChance: 1, swapMisfireScale: 1, swapCostMs: 0 }), ROSTER, rng);
      omni.transform({ allowMisfire: false });
      omni.update(SWAP.lockoutMs);
      const from = omni.activeAlienId!;
      omni.select(ROSTER.find((a) => a !== from)!);
      const e = first(omni.swap());
      expect(e.type).toBe('swapped');
      if (e.type === 'swapped') {
        expect(e.alienId).not.toBe(from);
        expect(e.alienId).not.toBe(e.requestedId);
        expect(e.wrong).toBe(true);
      }
    }
  });

  it('a misfire always gives one of the other unlocked aliens', () => {
    const rng = seededRng(10);
    const seen = new Set<string>();
    const omni = new Omnitrix(configFor('hard', { wrongTransformChance: 1 }), ROSTER, rng);
    for (let i = 0; i < 500; i++) {
      const e = first(omni.transform());
      if (e.type === 'transformed') {
        expect(e.wrong).toBe(true);
        expect(e.alienId).not.toBe('heatblast');
        expect(ROSTER).toContain(e.alienId);
        seen.add(e.alienId);
      }
      omni.revert('forced');
    }
    expect([...seen].sort()).toEqual(['fourarms', 'xlr8']);
  });

  it('never misfires when it is blocked (boss intros, story moments)', () => {
    const omni = new Omnitrix(configFor('hard', { wrongTransformChance: 1, swapMisfireScale: 1, swapCostMs: 0 }), ROSTER, seededRng(11));
    for (let i = 0; i < 200; i++) {
      const e = first(omni.transform({ allowMisfire: false }));
      expect(e).toMatchObject({ alienId: 'heatblast', wrong: false });
      omni.update(SWAP.lockoutMs);
      omni.select('xlr8');
      expect(first(omni.swap({ allowMisfire: false }))).toMatchObject({ alienId: 'xlr8', wrong: false });
      omni.select('heatblast');
      omni.revert('forced');
    }
  });

  it('needs a third alien to misfire a swap, and a second one to misfire a transform', () => {
    const solo = new Omnitrix(configFor('hard', { wrongTransformChance: 1 }), ['heatblast'], seededRng(12));
    expect(first(solo.transform())).toMatchObject({ alienId: 'heatblast', wrong: false });

    const duo = new Omnitrix(configFor('hard', { wrongTransformChance: 1, swapMisfireScale: 1 }), ['heatblast', 'xlr8'], seededRng(13));
    duo.transform({ allowMisfire: false });
    duo.update(SWAP.lockoutMs);
    duo.select('xlr8');
    expect(first(duo.swap())).toMatchObject({ alienId: 'xlr8', wrong: false });
  });

  it('remembers what was wanted while the misfired alien is out', () => {
    const omni = new Omnitrix(configFor('hard', { wrongTransformChance: 1 }), ROSTER, seededRng(14));
    const e = first(omni.transform());
    expect(e.type === 'transformed' && e.wrong).toBe(true);
    expect(omni.misfireState).toMatchObject({ wantedId: 'heatblast', improvised: false });
    expect(omni.misfireState?.gotId).toBe(omni.activeAlienId);
    expect(omni.fixSwapOwed).toBe(true);
    omni.revert('timeout');
    expect(omni.misfireState).toBeNull();
    expect(omni.fixSwapOwed).toBe(false);
  });
});

describe('after a misfire', () => {
  function misfired(seed = 20): Omnitrix {
    const omni = new Omnitrix(configFor('hard', { wrongTransformChance: 1, swapMisfireScale: 1 }), ROSTER, seededRng(seed));
    omni.transform();
    omni.update(SWAP.lockoutMs);
    return omni;
  }

  it('the next swap is the fix: half price and it cannot misfire', () => {
    for (let seed = 0; seed < 50; seed++) {
      const omni = misfired(seed);
      const before = omni.timeRemainingMs;
      expect(omni.swapCostMs).toBe(SWAP.costMs * MISFIRE.fixCostScale);
      expect(omni.misfireChance('swap')).toBe(0);
      omni.select('heatblast');
      const e = first(omni.swap());
      expect(e).toMatchObject({ type: 'swapped', alienId: 'heatblast', wrong: false, fix: true, costMs: SWAP.costMs * MISFIRE.fixCostScale });
      expect(omni.timeRemainingMs).toBe(before - SWAP.costMs * MISFIRE.fixCostScale);
      expect(omni.misfireState).toBeNull();
      expect(omni.fixSwapOwed).toBe(false);
      expect(omni.swapCostMs).toBe(SWAP.costMs);
    }
  });

  it('allows the fix swap with less time left than a full swap costs', () => {
    const omni = misfired();
    omni.update(omni.timeRemainingMs - SWAP.costMs + 100);
    omni.select('heatblast');
    expect(omni.swapDenial()).toBeNull();
  });

  it('rolling with it pays once: the first KO refunds alien time', () => {
    const omni = misfired();
    const before = omni.timeRemainingMs;
    expect(omni.improvise()).toBe(MISFIRE.improviseBonusMs);
    expect(omni.timeRemainingMs).toBe(before + MISFIRE.improviseBonusMs);
    expect(omni.improvise()).toBe(0);
    expect(omni.misfireState?.improvised).toBe(true);
  });

  it('pays nothing without a misfire, or once the misfired alien is gone', () => {
    const clean = new Omnitrix(configFor('hard', { wrongTransformChance: 0 }), ROSTER, seededRng(1));
    clean.transform();
    expect(clean.improvise()).toBe(0);

    const omni = misfired();
    omni.select('heatblast');
    omni.swap();
    expect(omni.improvise()).toBe(0);
  });
});

describe('misfire lines', () => {
  const ids = allAliens().map((a) => a.id);

  it('every pair of aliens has its own reaction line', () => {
    const all: string[] = [];
    for (const wanted of ids) {
      for (const got of ids) {
        if (wanted === got) continue;
        const lines = misfireLines(wanted, got);
        expect(lines, `${wanted} > ${got}`).not.toBe(GENERIC_MISFIRE_LINES);
        expect(lines.length).toBeGreaterThan(0);
        all.push(...lines);
      }
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it('lines fit in a speech bubble on a phone', () => {
    for (const wanted of ids) for (const got of ids) for (const line of misfireLines(wanted, got)) expect(line.length, line).toBeLessThanOrEqual(42);
  });

  it('falls back to the alien line, then to a generic one', () => {
    expect(misfireLines('someone-new', 'heatblast')).toEqual(['HEATBLAST?! WELL, THIS IS AWKWARD.']);
    expect(misfireLines('heatblast', 'someone-new')).toBe(GENERIC_MISFIRE_LINES);
  });

  it('never repeats the same joke twice in a row for a pair', () => {
    const quips = new MisfireQuips(seededRng(3));
    let last = '';
    for (let i = 0; i < 40; i++) {
      const line = quips.line('heatblast', 'fourarms');
      expect(line).not.toBe(last);
      last = line;
    }
  });
});
