import { describe, expect, it } from 'vitest';
import { aliensUnlockedBy, allAliens, getAlien, getForm, hasAlien, HUMAN_FORM } from '../src/aliens/registry';
import type { FormDefinition } from '../src/aliens/types';
import { BARRICADE_SIZES, barricadeKey } from '../src/scenes/preload/assetKeys';
import { ALL_ANIMS, ALL_ASSETS, buildAssetCatalog } from '../src/scenes/preload/catalog';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { HEATBLAST_FORM } from '../src/aliens/heatblast';
import { Omnitrix } from '../src/systems/Omnitrix';
import { formatControls } from '../src/systems/controlLabels';

const REQUIRED_ANIMS = ['idle', 'run', 'jump', 'fall', 'hurt'];

describe('alien registry', () => {
  it('has Heatblast for Chapter 1 and Four Arms and XLR8 for Chapter 2, in dial order', () => {
    expect(allAliens().map((a) => a.id)).toEqual(['heatblast', 'fourarms', 'xlr8']);
    expect(getAlien('heatblast').unlockChapter).toBe(1);
    expect(getAlien('fourarms').unlockChapter).toBe(2);
    expect(getAlien('xlr8').unlockChapter).toBe(2);
  });

  it('unlocks by chapter', () => {
    expect(aliensUnlockedBy(0)).toEqual([]);
    expect(aliensUnlockedBy(1)).toEqual(['heatblast']);
    expect(aliensUnlockedBy(2)).toEqual(['heatblast', 'fourarms', 'xlr8']);
  });

  it('human Ben is a form but not an alien on the dial', () => {
    expect(HUMAN_FORM.kind).toBe('human');
    expect(hasAlien(HUMAN_FORM.id)).toBe(false);
    expect(getForm(HUMAN_FORM.id)).toBe(HUMAN_FORM);
    expect(getForm('xlr8')).toBe(getAlien('xlr8'));
    expect(() => getAlien('ghostfreak')).toThrow();
  });

  it('every alien is complete data: motor, feel, shield, theme, tips, moves, abilities', () => {
    for (const alien of allAliens()) {
      expect(alien.kind, alien.id).toBe('alien');
      expect(alien.maxFormHealth, alien.id).toBeGreaterThan(0);
      expect(alien.motor.runSpeed, alien.id).toBeGreaterThan(0);
      expect(alien.feel.stepMs, alien.id).toBeGreaterThan(0);
      expect(alien.theme.shieldLabel.length, alien.id).toBeGreaterThan(0);
      expect(alien.quips.transform.length, alien.id).toBeGreaterThan(0);
      expect(alien.moves.length, alien.id).toBeGreaterThan(0);
      expect(alien.tips.intro, alien.id).toBeDefined();
      expect(alien.audio.music, alien.id).not.toBeNull();
      const abilities = alien.createAbilities();
      expect(typeof abilities.update).toBe('function');
      expect(alien.createAbilities()).not.toBe(abilities);
    }
  });

  it('every alien has an entrance move for swaps and its own slam style and colour', () => {
    const colors = new Set<number>();
    const slams = new Set<string>();
    for (const alien of allAliens()) {
      expect(typeof alien.createAbilities().onSwapIn, alien.id).toBe('function');
      colors.add(alien.theme.color);
      slams.add(alien.theme.slam);
    }
    expect(colors.size).toBe(allAliens().length);
    expect(slams.size).toBe(allAliens().length);
  });

  it('every alien brings its own textures: sheet, dial icon and touch icons', () => {
    for (const alien of allAliens()) {
      const keys = alien.art.assets.map((a) => a.key);
      for (const key of [alien.texture, alien.hudIcon, alien.touchIcons.attack, alien.touchIcons.special]) {
        expect(keys, `${alien.id}: ${key}`).toContain(key);
      }
      const sheet = alien.art.assets.find((a) => a.key === alien.texture)!;
      expect(sheet.frameWidth).toBe(alien.frame.w);
      expect(sheet.frameHeight).toBe(alien.frame.h);
      expect(alien.frame.feetY).toBeLessThan(alien.frame.h);
    }
  });

  it('only Four Arms smashes, only XLR8 runs on water, only Heatblast burns', () => {
    const can = (cap: 'canSmash' | 'canRunWater' | 'canBurn') => allAliens().filter((a) => a.reach[cap]).map((a) => a.id);
    expect(can('canSmash')).toEqual(['fourarms']);
    expect(can('canRunWater')).toEqual(['xlr8']);
    expect(can('canBurn')).toEqual(['heatblast']);
  });

  it('tips and move lists only use control tokens the HUD knows', () => {
    for (const form of [HUMAN_FORM, ...allAliens()]) {
      const texts = [...form.moves, form.tips.intro?.text ?? '', form.tips.advanced?.text ?? ''];
      for (const text of texts) {
        expect(formatControls(text, 'keyboard'), text).not.toMatch(/\{[A-Z]+\}/);
        expect(formatControls(text, 'touch'), text).not.toMatch(/\{[A-Z]+\}/);
      }
    }
  });
});

describe('adding an alien only needs its own module', () => {
  // A complete alien defined right here, the way a new file in src/aliens/ would.
  const SPARK: FormDefinition = {
    ...HEATBLAST_FORM,
    id: 'spark',
    name: 'SPARK',
    unlockChapter: 3,
    texture: 'spark-sheet',
    animPrefix: 'spark',
    hudIcon: 'ui-icon-spark',
    touchIcons: { attack: 'ui-icon-spark', special: 'ui-icon-spark' },
    art: {
      assets: [
        { key: 'spark-sheet', frameWidth: 32, frameHeight: 36, frames: 2, draw: () => undefined },
        { key: 'ui-icon-spark', frameWidth: 16, frameHeight: 16, frames: 1, draw: () => undefined },
      ],
      anims: REQUIRED_ANIMS.map((name) => ({ key: `spark-${name}`, texture: 'spark-sheet', frames: [0], frameRate: 1, repeat: 0 })),
    },
  };

  it('the asset catalog picks up its textures and animations', () => {
    const catalog = buildAssetCatalog([...allAliens(), SPARK]);
    expect(catalog.assets.some((a) => a.key === 'spark-sheet')).toBe(true);
    expect(catalog.anims.some((a) => a.key === 'spark-idle')).toBe(true);
    expect(catalog.assets.length).toBe(ALL_ASSETS.length + 2);
  });

  it('the Omnitrix dials and transforms into it like any other', () => {
    const omni = new Omnitrix({ transformDurationMs: 1000, cooldownMs: 1000, warningMs: 500, wrongTransformChance: 0 }, ['heatblast', SPARK.id]);
    omni.cycle(1);
    expect(omni.transform()[0]).toMatchObject({ type: 'transformed', alienId: 'spark' });
  });
});

describe('asset key map', () => {
  it('has unique keys', () => {
    const keys = ALL_ASSETS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every animation points at an existing texture and valid frames', () => {
    for (const anim of ALL_ANIMS) {
      const asset = ALL_ASSETS.find((a) => a.key === anim.texture);
      expect(asset, anim.key).toBeDefined();
      for (const f of anim.frames) {
        expect(f, anim.key).toBeGreaterThanOrEqual(0);
        expect(f, anim.key).toBeLessThan(asset!.frames);
      }
    }
  });

  it('every form has the animations the player state machine plays', () => {
    for (const form of [HUMAN_FORM, ...allAliens()]) {
      for (const suffix of REQUIRED_ANIMS) {
        expect(ALL_ANIMS.some((a) => a.key === `${form.animPrefix}-${suffix}`), `${form.animPrefix}-${suffix}`).toBe(true);
      }
    }
  });

  it('every animation an ability asks for exists', () => {
    const overrides: Record<string, string[]> = {
      heatblast: ['shoot', 'charge', 'rocket'],
      xlr8: ['strikeA', 'strikeB', 'kick', 'dash'],
      fourarms: ['punchA', 'punchB', 'haymakerUp', 'haymaker', 'clap', 'slamUp', 'slam', 'meteor', 'carry', 'carryRun', 'throw'],
    };
    for (const [prefix, names] of Object.entries(overrides)) {
      for (const name of names) expect(ALL_ANIMS.some((a) => a.key === `${prefix}-${name}`), `${prefix}-${name}`).toBe(true);
    }
  });

  it('every barricade in the level has a texture of its size', () => {
    for (const e of CHAPTER_1.entities) {
      if (e.type !== 'barricade') continue;
      expect(BARRICADE_SIZES.some(([w, h]) => w === e.w && h === e.h), e.id).toBe(true);
      expect(ALL_ASSETS.some((a) => a.key === barricadeKey(e.w, e.h))).toBe(true);
    }
  });
});
