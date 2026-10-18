import { describe, expect, it } from 'vitest';
import { allAliens, hasAlien } from '../src/aliens/registry';
import { ALIEN_DEMOS, DEMO, demoKeysAt, demoLoopMs } from '../src/config/alienFiles';
import { CARDS, cardStats } from '../src/levels/cards';
import { TRAINING_ARENA } from '../src/levels/training';
import { TRAINING_ENEMIES } from '../src/systems/TrainingState';

describe('ALIEN FILES demos', () => {
  it('every alien has one demo per move, in order', () => {
    for (const a of allAliens()) {
      const demos = ALIEN_DEMOS[a.id];
      expect(demos, a.id).toBeDefined();
      expect(demos.length, a.id).toBe(a.moves.length);
    }
  });

  it('every demo starts inside the Training arena, with enemies Training can spawn and aliens that exist', () => {
    const kinds = TRAINING_ENEMIES.map((e) => e.kind);
    for (const [id, demos] of Object.entries(ALIEN_DEMOS)) {
      demos.forEach((d, i) => {
        const name = `${id} #${i}`;
        expect(d.x, name).toBeGreaterThan(2);
        expect(d.x, name).toBeLessThan(TRAINING_ARENA.width - 2);
        if (d.enemy) expect(kinds, name).toContain(d.enemy.kind);
        if (d.swapFrom) expect(hasAlien(d.swapFrom) && d.swapFrom !== id, name).toBe(true);
        if (d.dial) expect(hasAlien(d.dial) && d.dial !== id, name).toBe(true);
        // A swap needs the T press in the steps.
        if (d.swapFrom || d.dial) expect(d.steps.some((s) => s.keys.includes('transform')), name).toBe(true);
        // Long enough to read, short enough to loop while the player reads the move.
        expect(demoLoopMs(d), name).toBeGreaterThan(1500);
        expect(demoLoopMs(d), name).toBeLessThan(6000);
      });
    }
  });

  it('plays the steps in order, then rests', () => {
    const d = { x: 30, steps: [{ keys: ['attack'] as const, ms: 100 }, { keys: ['jump', 'right'] as const, ms: 200 }] };
    expect(demoKeysAt(d, 0)).toEqual(['attack']);
    expect(demoKeysAt(d, 99)).toEqual(['attack']);
    expect(demoKeysAt(d, 100)).toEqual(['jump', 'right']);
    expect(demoKeysAt(d, 299)).toEqual(['jump', 'right']);
    expect(demoKeysAt(d, 300)).toEqual([]);
    expect(demoLoopMs(d)).toBe(300 + DEMO.restMs);
  });
});

describe('card stats', () => {
  it('are the same every time, and between 3 and 10', () => {
    for (const c of CARDS) {
      const s = cardStats(c);
      expect(cardStats(c)).toEqual(s);
      for (const v of Object.values(s)) {
        expect(v).toBeGreaterThanOrEqual(3);
        expect(v).toBeLessThanOrEqual(10);
      }
    }
  });

  it('a holo card maxes its best stat; a common card never has a 10', () => {
    for (const c of CARDS) {
      const max = Math.max(...Object.values(cardStats(c)));
      expect(max === 10, c.id).toBe(!!c.holo);
    }
  });

  it("aren't all alike", () => {
    const seen = new Set(CARDS.map((c) => JSON.stringify(cardStats(c))));
    expect(seen.size).toBeGreaterThan(CARDS.length * 0.7);
  });
});
