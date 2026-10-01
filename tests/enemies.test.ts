import { describe, expect, it } from 'vitest';
import { armoredMultiplier } from '../src/entities/enemies/armored';
import { shouldEvade } from '../src/entities/enemies/hornet';
import { ARMORED } from '../src/config/enemies';
import type { HitKind } from '../src/entities/types';

describe('Armored Drone', () => {
  it('only smash hits deal real damage while the armour holds', () => {
    expect(armoredMultiplier('smash', false)).toBe(1);
    for (const kind of ['melee', 'fire', 'burst', 'rocket', 'reflect', 'transform'] as HitKind[]) {
      expect(armoredMultiplier(kind, false), kind).toBe(ARMORED.chipMultiplier);
      expect(armoredMultiplier(kind, false), kind).toBeLessThan(0.25);
    }
  });

  it('with the armour broken every hit lands harder than normal: the moment to swap in', () => {
    for (const kind of ['smash', 'melee', 'fire', 'burst'] as HitKind[]) {
      expect(armoredMultiplier(kind, true), kind).toBeGreaterThan(1);
    }
  });

  it('takes a few smash hits to break, far more without them', () => {
    const smashHitsToBreak = Math.ceil(ARMORED.armorHp / 3);
    expect(smashHitsToBreak).toBeLessThanOrEqual(2);
    const fireballsToKill = Math.ceil(ARMORED.hp / (2 * ARMORED.chipMultiplier));
    expect(fireballsToKill).toBeGreaterThan(40);
  });
});

describe('Hornet evasion', () => {
  it('dodges a shot that is close and incoming', () => {
    expect(shouldEvade(100, 100, 70, 100, 300, 0, 50)).toBe(true);
  });

  it('ignores shots moving away or out of range', () => {
    expect(shouldEvade(100, 100, 70, 100, -300, 0, 50)).toBe(false);
    expect(shouldEvade(100, 100, 20, 100, 300, 0, 50)).toBe(false);
  });
});
