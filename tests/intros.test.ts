import { describe, expect, it } from 'vitest';
import { ROAD_INTRO } from '../src/config/chapter2';
import { MUSEUM_INTRO } from '../src/config/chapter3';
import { CH4_BEATS } from '../src/config/kevin';
import { CH5_BEATS } from '../src/config/hunters';

describe('chapter openings (BUGS.md C11)', () => {
  it('start their first line only after the CHAPTER card has gone', () => {
    const intros = [
      { name: 'ch2', bannerAt: ROAD_INTRO.bannerAt, bannerMs: ROAD_INTRO.bannerMs, linesAt: ROAD_INTRO.linesAt },
      { name: 'ch3', bannerAt: MUSEUM_INTRO.bannerAt, bannerMs: MUSEUM_INTRO.bannerMs, linesAt: MUSEUM_INTRO.linesAt },
      { name: 'ch4', ...CH4_BEATS.intro },
      { name: 'ch5', bannerAt: CH5_BEATS.coldOpen.bannerAt, bannerMs: CH5_BEATS.coldOpen.bannerMs, linesAt: CH5_BEATS.coldOpen.arrivalLinesAt },
    ];
    for (const i of intros) expect(i.linesAt, i.name).toBeGreaterThanOrEqual(i.bannerAt + i.bannerMs);
  });
});
