import type Phaser from 'phaser';
import { hdKey, presentationIsHd } from '../../../../systems/hd/Presentation';
import { TEX } from '../../assetKeys';
import { PORTRAIT } from '../../portraits';
import { cutoutImage } from '../cutout/cutout';
import { FAMILY_PORTRAITS } from '../cutout/familyPortraits';
import { makeHdImage } from '../hdTexture';

/** The pixel portrait each character's drawn faces stand in for, its panel colour (the pixel portrait's own), and the face a line without a mood shows. */
const STANDS_IN: Readonly<Record<string, { key: string; bg: number; face: string }>> = {
  ben: { key: TEX.portraitBen, bg: 0x16301e, face: 'talk' },
  gwen: { key: TEX.portraitGwen, bg: 0x1e3a4a, face: 'talk' },
  max: { key: TEX.portraitMax, bg: 0x3a2a4a, face: 'talk' },
  // His box portrait always grinned.
  kevin: { key: TEX.portraitKevinGrin, bg: 0x2a1438, face: 'happy' },
};

/** A portrait's face for a mood (the dialogue box shows it when it exists): `portrait-ben@angry`. */
export function moodPortrait(key: string, mood: string): string {
  return `${key}@${mood}`;
}

/**
 * Ben's, Gwen's, Grandpa Max's and Kevin's dialogue portraits in Chapter 7: the
 * owner's six close-ups from each model sheet (scripts/cutout/portraits.py) on
 * the pixel portrait's own panel colour. Each face is its own texture
 * (`moodPortrait`), and the face a line without a mood shows is the HD twin of
 * the pixel portrait. Returns the keys of those twins, for the HD skin; none if
 * the drawings haven't loaded.
 */
export function makeFamilyPortraits(scene: Phaser.Scene, res: number): string[] {
  const img = cutoutImage(FAMILY_PORTRAITS.id);
  if (!img) return [];
  const { w, h } = PORTRAIT;
  const keys: string[] = [];
  const paint = (key: string, f: { x: number; y: number; w: number; h: number }, bg: number) =>
    makeHdImage(scene, key, w, h, res, (p) => {
      p.fill(p.rrect(0, 0, w, h, 0), bg);
      for (let y = 0; y < h; y += 2) p.fill(p.rrect(0, y, w, 1, 0), 0x000000, 0.08);
      p.ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, w, h);
    });
  for (const [name, f] of Object.entries(FAMILY_PORTRAITS.frames)) {
    const [, id, mood] = name.split(':');
    const who = STANDS_IN[id];
    if (!who || !scene.textures.exists(who.key)) continue;
    paint(moodPortrait(who.key, mood), f, who.bg);
    if (mood !== who.face) continue;
    keys.push(who.key);
    // Made once: kept under its HD key while the pixel look is on, under the portrait's own while the HD one is.
    if (scene.textures.exists(hdKey(who.key)) || presentationIsHd()) continue;
    paint(hdKey(who.key), f, who.bg);
  }
  return keys;
}
