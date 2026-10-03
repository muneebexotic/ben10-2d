import { describe, expect, it } from 'vitest';
import { COMBAT } from '../src/config/combat';
import { FROG } from '../src/config/frog';
import { SlimeStatus } from '../src/entities/enemies/slime';
import { bruteGuarded } from '../src/entities/enemies/mutants/brute';
import { lurkerVisible } from '../src/entities/enemies/mutants/lurker';
import { shattersGlass, GLASS_BREAK_DAMAGE } from '../src/entities/museum/GlassFloor';
import { frogMultiplier, gumFeet, popsThroat, yanksTongue } from '../src/entities/bosses/frog/rules';
import type { Hit } from '../src/entities/types';

const S = COMBAT.slime;
const glob = (slowMs = 2400): Hit => ({ damage: 1, kind: 'slime', x: 0, y: 0, knockback: 0, slowMs });

describe("Stinkfly's slime", () => {
  it('a glob slows a target, and the slow wears off', () => {
    const s = new SlimeStatus();
    expect(s.apply(glob(), 0)).toBe('slowed');
    expect(s.factor).toBe(S.slowFactor);
    s.update(2500);
    expect(s.slowed).toBe(false);
    expect(s.factor).toBe(1);
  });

  it('three quick globs stick it in place; slow ones never do', () => {
    const s = new SlimeStatus();
    s.apply(glob(), 0);
    s.apply(glob(), 300);
    expect(s.apply(glob(), 600)).toBe('stuck');
    expect(s.factor).toBe(S.stuckFactor);
    const slow = new SlimeStatus();
    slow.apply(glob(), 0);
    slow.apply(glob(), S.stackWindowMs + 100);
    expect(slow.apply(glob(), 2 * S.stackWindowMs + 200)).toBe('slowed');
  });

  it("stink-cloud whiffs slow but don't build toward sticking", () => {
    const s = new SlimeStatus();
    for (let i = 0; i < 6; i++) expect(s.apply(glob(500), i * 100)).toBe('slowed');
    expect(s.stacks).toBe(0);
  });

  it('fragile wings give way sooner (bats)', () => {
    const s = new SlimeStatus();
    s.apply(glob(), 0);
    expect(s.apply(glob(), 100, 2)).toBe('stuck');
  });

  it('hits without goo do nothing', () => {
    expect(new SlimeStatus().apply({ damage: 3, kind: 'fire', x: 0, y: 0, knockback: 0 }, 0)).toBeNull();
  });
});

describe('mutants', () => {
  it("a brute's tusks block hits from the front, but not smashes, hits from behind, or from above", () => {
    const top = 100;
    expect(bruteGuarded(1, 50, top, { x: 70, y: 120, kind: 'fire' })).toBe(true);
    expect(bruteGuarded(1, 50, top, { x: 70, y: 120, kind: 'smash' })).toBe(false);
    expect(bruteGuarded(1, 50, top, { x: 30, y: 120, kind: 'melee' })).toBe(false);
    expect(bruteGuarded(-1, 50, top, { x: 30, y: 120, kind: 'melee' })).toBe(true);
    expect(bruteGuarded(1, 50, top, { x: 70, y: 90, kind: 'melee' })).toBe(false);
  });

  it('a lurker shows itself only to senses, slime, a recent hit, or its own tell', () => {
    expect(lurkerVisible(200, 0, false, 0, 1000, false)).toBe(false);
    expect(lurkerVisible(150, 172, false, 0, 1000, false)).toBe(true);
    expect(lurkerVisible(200, 172, false, 0, 1000, false)).toBe(false);
    expect(lurkerVisible(200, 0, true, 0, 1000, false)).toBe(true);
    expect(lurkerVisible(200, 0, false, 1500, 1000, false)).toBe(true);
    expect(lurkerVisible(200, 0, false, 0, 1000, true)).toBe(true);
  });
});

describe('skylight glass', () => {
  it('only a heavy smash breaks it: a high meteor or a throw, not a plain slam or fire', () => {
    expect(shattersGlass({ kind: 'smash', damage: 7 })).toBe(true);
    expect(shattersGlass({ kind: 'smash', damage: GLASS_BREAK_DAMAGE })).toBe(true);
    expect(shattersGlass({ kind: 'smash', damage: 4 })).toBe(false);
    expect(shattersGlass({ kind: 'fire', damage: 20 })).toBe(false);
  });
});

describe('KING CROAK', () => {
  const calm = { inflated: false, recovering: false, gummed: false, headTopY: 100 };
  const side = { kind: 'melee' as const, y: 150 };

  it('its hide soaks most of a plain hit', () => {
    expect(frogMultiplier(side, calm)).toBe(FROG.hideMultiplier);
  });

  it('switching pays: a swollen throat, a gummed frog and a landing frog all take more', () => {
    expect(frogMultiplier(side, { ...calm, inflated: true })).toBe(FROG.spit.throatMultiplier);
    expect(frogMultiplier(side, { ...calm, gummed: true })).toBe(FROG.gum.stuckMultiplier);
    expect(frogMultiplier(side, { ...calm, recovering: true })).toBe(FROG.leap.recoverMultiplier);
  });

  it('a hit from above lands on Animo too', () => {
    expect(frogMultiplier({ kind: 'melee', y: 105 }, calm)).toBe(FROG.fromAbove.multiplier);
  });

  it('fire pops the throat only while it is swollen; only a smash yanks the tongue', () => {
    expect(popsThroat({ kind: 'fire' }, true)).toBe(true);
    expect(popsThroat({ kind: 'fire' }, false)).toBe(false);
    expect(popsThroat({ kind: 'melee' }, true)).toBe(false);
    expect(yanksTongue({ kind: 'smash' })).toBe(true);
    expect(yanksTongue({ kind: 'melee' })).toBe(false);
  });

  it('enough slime on its feet in a short window glues it down', () => {
    let globs: number[] = [];
    let stuck = false;
    for (let i = 0; i < FROG.gum.globs; i++) ({ globs, stuck } = gumFeet(globs, i * 300));
    expect(stuck).toBe(true);
    // Spread out too much, they never add up.
    globs = [];
    for (let i = 0; i < FROG.gum.globs; i++) ({ globs, stuck } = gumFeet(globs, i * (FROG.gum.windowMs + 10)));
    expect(stuck).toBe(false);
  });
});
