import { describe, expect, it } from 'vitest';
import { SUMO } from '../src/config/sumo';
import { SumoMatch, type SumoEvent } from '../src/systems/SumoMatch';

/** Plays `ms` in 16 ms frames, tapping at `tapsPerSec` and sidestepping every tell after `dodgeAfterMs` (null: never). */
function play(m: SumoMatch, ms: number, tapsPerSec: number, dodgeAfterMs: number | null): SumoEvent[] {
  const out: SumoEvent[] = [];
  let tapAcc = 0;
  let tellAt = -1;
  for (let t = 0; t < ms && !m.done; t += 16) {
    out.push(...m.update(16));
    if (m.telling && tellAt < 0) tellAt = t;
    if (!m.telling) tellAt = -1;
    if (dodgeAfterMs !== null && tellAt >= 0 && t - tellAt >= dodgeAfterMs) out.push(...m.dodge());
    tapAcc += (tapsPerSec * 16) / 1000;
    while (tapAcc >= 1) {
      tapAcc--;
      out.push(...m.push());
    }
  }
  return out;
}

describe('SUMO SLAMMERS', () => {
  it('doing nothing loses round one', () => {
    const m = new SumoMatch();
    const ev = play(m, 20_000, 0, null);
    expect(m.phase).toBe('lost');
    expect(ev.some((e) => e.type === 'matchLost')).toBe(true);
  });

  it('steady mashing and well-timed sidesteps win all three rounds', () => {
    const m = new SumoMatch();
    const ev = play(m, 60_000, 10, 250);
    expect(m.phase).toBe('won');
    expect(ev.filter((e) => e.type === 'roundWon')).toHaveLength(SUMO.rounds);
    expect(ev.some((e) => e.type === 'shove' && e.dodged)).toBe(true);
  });

  it('mashing alone without sidestepping falls short by the last round', () => {
    const m = new SumoMatch();
    play(m, 60_000, 9, null);
    expect(m.phase).toBe('lost');
    expect(m.round).toBeGreaterThan(0);
  });

  it('a sidestep only counts while his arms are up, and only once per shove', () => {
    const m = new SumoMatch();
    play(m, SUMO.introMs + 100, 0, null);
    expect(m.dodge()).toEqual([]);
    let guard = 0;
    while (!m.telling && guard++ < 1000) m.update(16);
    expect(m.dodge()).toEqual([{ type: 'dodge' }]);
    expect(m.dodge()).toEqual([]);
  });

  it('tapping is rate-capped', () => {
    const m = new SumoMatch();
    play(m, SUMO.introMs + 50, 0, null);
    const before = m.pos;
    let pushes = 0;
    for (let i = 0; i < 100; i++) pushes += m.push().filter((e) => e.type === 'push').length;
    expect(pushes).toBe(SUMO.maxTapsPerSec);
    expect(m.pos).toBeCloseTo(before + SUMO.maxTapsPerSec * SUMO.pushPerTap);
  });
});
