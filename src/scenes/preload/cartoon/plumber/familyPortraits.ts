import type Phaser from 'phaser';
import { hdKey, presentationIsHd } from '../../../../systems/hd/Presentation';
import { TEX } from '../../assetKeys';
import { PORTRAIT } from '../../portraits';
import { cutoutImage } from '../cutout/cutout';
import { FAMILY_PORTRAITS } from '../cutout/familyPortraits';
import { makeHdImage } from '../hdTexture';

/** The pixel portrait each drawn one stands in for, and its panel colour (the pixel portrait's own). */
const STANDS_IN: Readonly<Record<string, { key: string; bg: number }>> = {
  ben: { key: TEX.portraitBen, bg: 0x16301e },
  gwen: { key: TEX.portraitGwen, bg: 0x1e3a4a },
  max: { key: TEX.portraitMax, bg: 0x3a2a4a },
  kevin: { key: TEX.portraitKevinGrin, bg: 0x2a1438 },
};

/**
 * The HD twins of Ben's, Gwen's, Grandpa Max's and Kevin's dialogue portraits:
 * the owner's close-ups from their model sheets (scripts/cutout/portraits.py)
 * on each portrait's own panel colour. Returns the keys they stand in for, for
 * the HD skin; none if the drawings haven't loaded.
 */
export function makeFamilyPortraits(scene: Phaser.Scene, res: number): string[] {
  const img = cutoutImage(FAMILY_PORTRAITS.id);
  if (!img) return [];
  const { w, h } = PORTRAIT;
  const keys: string[] = [];
  for (const [name, f] of Object.entries(FAMILY_PORTRAITS.frames)) {
    const who = STANDS_IN[name.slice('body:'.length)];
    if (!who || !scene.textures.exists(who.key)) continue;
    keys.push(who.key);
    // Made once: kept under its HD key while the pixel look is on, under the portrait's own while the HD one is.
    if (scene.textures.exists(hdKey(who.key)) || presentationIsHd()) continue;
    makeHdImage(scene, hdKey(who.key), w, h, res, (p) => {
      p.fill(p.rrect(0, 0, w, h, 0), who.bg);
      for (let y = 0; y < h; y += 2) p.fill(p.rrect(0, y, w, 1, 0), 0x000000, 0.08);
      p.ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, w, h);
    });
  }
  return keys;
}
