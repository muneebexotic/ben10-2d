import { describe, expect, it } from 'vitest';
import { allAliens } from '../src/aliens/registry';
import { GAME_OVER_TIPS, tipsFor } from '../src/ui/gameOverTips';

describe('Game Over tips', () => {
  it('every chapter has tips before any alien is on the dial', () => {
    for (const chapter of [1, 2, 3, 4]) expect(tipsFor(chapter, []).length, `chapter ${chapter}`).toBeGreaterThanOrEqual(3);
  });

  it('a tip that names an alien waits until that alien is on the dial', () => {
    for (const tip of GAME_OVER_TIPS) {
      for (const alien of allAliens()) {
        if (tip.text.includes(alien.name)) expect(tip.needs, tip.text).toBe(alien.id);
      }
    }
  });

  it('tips only reach the chapters they name', () => {
    const striker = GAME_OVER_TIPS.find((t) => t.text.startsWith('STRIKERS'))!;
    expect(tipsFor(3, ['heatblast', 'stinkfly'])).not.toContain(striker);
    expect(tipsFor(1, [])).toContain(striker);
  });
});
