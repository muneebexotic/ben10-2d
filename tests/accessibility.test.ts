import { describe, expect, it } from 'vitest';
import { ACCESSIBILITY } from '../src/config/accessibility';
import { a11y, blinkOn, resolveA11y, safeBlinkHalfPeriod, setA11y } from '../src/systems/Accessibility';

describe('accessibility settings', () => {
  it('follows prefers-reduced-motion until the player chooses', () => {
    expect(resolveA11y({ reduceFlashing: null, shake: null }, false)).toEqual({ reduceFlashing: false, shake: 1 });
    expect(resolveA11y({ reduceFlashing: null, shake: null }, true)).toEqual({ reduceFlashing: true, shake: ACCESSIBILITY.reducedMotionShake });
  });

  it("the player's explicit choice beats the device preference", () => {
    expect(resolveA11y({ reduceFlashing: false, shake: 0.7 }, true)).toEqual({ reduceFlashing: false, shake: 0.7 });
    expect(resolveA11y({ reduceFlashing: true, shake: 0 }, false)).toEqual({ reduceFlashing: true, shake: 0 });
  });

  it('reduce flashing slows every blink to at most 2.5 flashes per second', () => {
    expect(safeBlinkHalfPeriod(50, false)).toBe(50);
    expect(safeBlinkHalfPeriod(50, true)).toBe(ACCESSIBILITY.minBlinkHalfPeriodMs);
    expect(safeBlinkHalfPeriod(500, true)).toBe(500);
    expect(1000 / (2 * ACCESSIBILITY.minBlinkHalfPeriodMs)).toBeLessThanOrEqual(3);
  });

  it('blinkOn uses the live setting', () => {
    setA11y({ reduceFlashing: false, shake: 1 });
    expect(blinkOn(0, 50)).toBe(true);
    expect(blinkOn(60, 50)).toBe(false);
    setA11y({ reduceFlashing: true, shake: 1 });
    expect(blinkOn(60, 50)).toBe(true);
    expect(blinkOn(ACCESSIBILITY.minBlinkHalfPeriodMs + 1, 50)).toBe(false);
    setA11y({ reduceFlashing: false, shake: 2 });
    expect(a11y.shake).toBe(1);
  });
});
