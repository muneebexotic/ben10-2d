import { describe, expect, it } from 'vitest';
import { Omnitrix, type OmnitrixConfig } from '../src/systems/Omnitrix';
import { OMNITRIX_WARNING_MS, getDifficulty } from '../src/config/difficulty';
import { SWAP } from '../src/config/omnitrix';

const normal = getDifficulty('normal');
const CONFIG: OmnitrixConfig = {
  transformDurationMs: normal.transformDurationMs,
  cooldownMs: normal.cooldownMs,
  warningMs: OMNITRIX_WARNING_MS,
  wrongTransformChance: 0,
  swapEnabled: true,
  swapCostMs: SWAP.costMs,
  swapLockoutMs: SWAP.lockoutMs,
};
const ROSTER = ['heatblast', 'fourarms', 'xlr8'];

function transformed(rng: () => number = () => 0.99, config: OmnitrixConfig = CONFIG): Omnitrix {
  const omni = new Omnitrix(config, ROSTER, rng);
  omni.transform();
  omni.update(SWAP.lockoutMs);
  return omni;
}

describe('dial with several aliens', () => {
  it('cycles through every alien in order and wraps both ways', () => {
    const omni = new Omnitrix(CONFIG, ROSTER);
    const seen = [omni.selectedAlien];
    for (let i = 0; i < 3; i++) {
      omni.cycle(1);
      seen.push(omni.selectedAlien);
    }
    expect(seen).toEqual(['heatblast', 'fourarms', 'xlr8', 'heatblast']);
    omni.cycle(-1);
    expect(omni.selectedAlien).toBe('xlr8');
  });

  it('reports position and count for the HUD pips', () => {
    const omni = new Omnitrix(CONFIG, ROSTER);
    expect(omni.cycle(1)).toEqual([{ type: 'dial', selectedId: 'fourarms', index: 1, count: 3 }]);
  });

  it('transforms into whichever alien is selected', () => {
    const omni = new Omnitrix(CONFIG, ROSTER);
    omni.select('xlr8');
    expect(omni.transform()[0]).toMatchObject({ type: 'transformed', alienId: 'xlr8' });
  });

  it('can line up the next alien while transformed', () => {
    const omni = transformed();
    omni.cycle(1);
    expect(omni.activeAlienId).toBe('heatblast');
    expect(omni.selectedAlien).toBe('fourarms');
  });
});

describe('Omnitrix swap', () => {
  it('swaps to the selected alien mid-transformation and charges alien time', () => {
    const omni = transformed();
    const before = omni.timeRemainingMs;
    omni.select('fourarms');
    const events = omni.swap();
    expect(events).toEqual([{ type: 'swapped', fromId: 'heatblast', alienId: 'fourarms', requestedId: 'fourarms', wrong: false, costMs: SWAP.costMs, fix: false }]);
    expect(omni.state).toBe('active');
    expect(omni.activeAlienId).toBe('fourarms');
    expect(omni.timeRemainingMs).toBe(before - SWAP.costMs);
  });

  it('is only possible while transformed, with a different alien on the dial', () => {
    const omni = new Omnitrix(CONFIG, ROSTER);
    expect(omni.swapDenial()).toBe('notActive');
    omni.transform();
    omni.update(SWAP.lockoutMs);
    expect(omni.swapDenial()).toBe('sameAlien');
    expect(omni.swap()).toEqual([]);
    omni.cycle(1);
    expect(omni.swapDenial()).toBeNull();
  });

  it('waits out a short lockout after transforming or swapping', () => {
    const omni = new Omnitrix(CONFIG, ROSTER);
    omni.transform();
    omni.select('xlr8');
    expect(omni.swapDenial()).toBe('lockout');
    omni.update(SWAP.lockoutMs);
    expect(omni.swap()).toHaveLength(1);
    omni.select('heatblast');
    expect(omni.swapDenial()).toBe('lockout');
  });

  it('refuses when the timer cannot pay for it', () => {
    const omni = transformed();
    omni.update(CONFIG.transformDurationMs - SWAP.lockoutMs - SWAP.costMs);
    omni.select('xlr8');
    expect(omni.swapDenial()).toBe('lowTime');
    expect(omni.swap()).toEqual([]);
    expect(omni.activeAlienId).toBe('heatblast');
  });

  it('keeps the cooldown untouched: timing out after swaps reverts as usual', () => {
    const omni = transformed();
    omni.select('xlr8');
    omni.swap();
    const events = omni.update(omni.timeRemainingMs);
    expect(events.map((e) => e.type)).toEqual(['reverted']);
    expect(events[0]).toMatchObject({ alienId: 'xlr8', reason: 'timeout' });
    expect(omni.state).toBe('cooldown');
  });

  it('a misfire never lands on the alien you are leaving', () => {
    const config = { ...CONFIG, wrongTransformChance: 1 };
    for (const roll of [0, 0.5, 0.99]) {
      const omni = new Omnitrix(config, ROSTER, () => roll);
      omni.select('heatblast');
      // A clean transform first: the swap right after a misfire is the guaranteed fix.
      omni.transform({ allowMisfire: false });
      const from = omni.activeAlienId;
      omni.update(SWAP.lockoutMs);
      omni.select(ROSTER.find((id) => id !== from)!);
      const [event] = omni.swap();
      expect(event.type).toBe('swapped');
      if (event.type === 'swapped') {
        expect(event.alienId).not.toBe(from);
        expect(event.wrong).toBe(true);
      }
    }
  });

  it('is off unless enabled', () => {
    const omni = transformed(undefined, { ...CONFIG, swapEnabled: false });
    omni.cycle(1);
    expect(omni.swapDenial()).toBe('off');
  });

  it('a frozen timer (Training) neither drains nor charges for swaps', () => {
    const omni = transformed();
    omni.setTimerFrozen(true);
    const before = omni.timeRemainingMs;
    expect(omni.update(60_000)).toEqual([]);
    omni.cycle(1);
    omni.swap();
    expect(omni.timeRemainingMs).toBe(before);
    expect(omni.state).toBe('active');
  });
});
