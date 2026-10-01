import { describe, expect, it } from 'vitest';
import { compareSplit, formatDelta } from '../src/systems/Splits';

describe('speedrun splits', () => {
  it('the first time past a split is a new best with nothing to compare', () => {
    const s = compareSplit('cp-cliff', 'CLIFF', 61_000, null);
    expect(s).toMatchObject({ deltaMs: null, ahead: false, newBest: true });
  });

  it('goes gold when ahead of the best and red when behind', () => {
    expect(compareSplit('a', 'A', 58_000, 61_000)).toMatchObject({ deltaMs: -3000, ahead: true, newBest: true });
    expect(compareSplit('a', 'A', 64_500, 61_000)).toMatchObject({ deltaMs: 3500, ahead: false, newBest: false });
  });

  it('a tie is not ahead and not a new best', () => {
    expect(compareSplit('a', 'A', 61_000, 61_000)).toMatchObject({ deltaMs: 0, ahead: false, newBest: false });
  });

  it('formats deltas like a split timer', () => {
    expect(formatDelta(-3210)).toBe('-3.21');
    expect(formatDelta(12_050)).toBe('+12.05');
    expect(formatDelta(64_500)).toBe('+1:04.50');
    expect(formatDelta(0)).toBe('+0.00');
    expect(formatDelta(-5)).toBe('-0.00');
  });
});
