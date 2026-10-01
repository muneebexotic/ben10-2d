import { describe, expect, it } from 'vitest';
import { aliensUnlockedBy, allAliens, getAlien, hasAlien, HUMAN_FORM } from '../src/aliens/registry';
import { BARRICADE_SIZES, barricadeKey } from '../src/scenes/preload/assetKeys';
import { ALL_ANIMS as ANIMS, ALL_ASSETS as ASSETS } from '../src/scenes/preload/catalog';
import { CHAPTER_1 } from '../src/levels/chapter1';

describe('alien registry', () => {
  it('registers Heatblast as the chapter 1 unlock', () => {
    expect(hasAlien('heatblast')).toBe(true);
    expect(getAlien('heatblast').unlockChapter).toBe(1);
    expect(aliensUnlockedBy(1)).toEqual(['heatblast']);
    expect(aliensUnlockedBy(0)).toEqual([]);
  });

  it('every alien is complete data: texture, motor, shield and abilities', () => {
    for (const alien of allAliens()) {
      expect(alien.kind).toBe('alien');
      expect(alien.maxFormHealth).toBeGreaterThan(0);
      expect(alien.motor.runSpeed).toBeGreaterThan(0);
      expect(ASSETS.some((a) => a.key === alien.texture)).toBe(true);
      const abilities = alien.createAbilities();
      expect(typeof abilities.update).toBe('function');
      expect(alien.createAbilities()).not.toBe(abilities);
    }
  });

  it('human Ben is a form but not an alien on the dial', () => {
    expect(HUMAN_FORM.kind).toBe('human');
    expect(hasAlien(HUMAN_FORM.id)).toBe(false);
    expect(() => getAlien('fourarms')).toThrow();
  });
});

describe('asset key map', () => {
  it('has unique keys', () => {
    const keys = ASSETS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every animation points at an existing texture and valid frames', () => {
    for (const anim of ANIMS) {
      const asset = ASSETS.find((a) => a.key === anim.texture);
      expect(asset, anim.key).toBeDefined();
      for (const f of anim.frames) {
        expect(f, anim.key).toBeGreaterThanOrEqual(0);
        expect(f, anim.key).toBeLessThan(asset!.frames);
      }
    }
  });

  it('every form has the animations the player state machine plays', () => {
    const needed = ['idle', 'run', 'jump', 'fall', 'hurt'];
    for (const form of [HUMAN_FORM, ...allAliens()]) {
      for (const suffix of needed) {
        expect(ANIMS.some((a) => a.key === `${form.animPrefix}-${suffix}`), `${form.animPrefix}-${suffix}`).toBe(true);
      }
    }
  });

  it('every barricade in the level has a texture of its size', () => {
    for (const e of CHAPTER_1.entities) {
      if (e.type !== 'barricade') continue;
      expect(BARRICADE_SIZES.some(([w, h]) => w === e.w && h === e.h), e.id).toBe(true);
      expect(ASSETS.some((a) => a.key === barricadeKey(e.w, e.h))).toBe(true);
    }
  });
});
