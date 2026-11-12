import type Phaser from 'phaser';
import { getAlien, hasAlien } from '../../../../aliens/registry';
import { hdKey, presentationIsHd } from '../../../../systems/hd/Presentation';
import { TEX } from '../../assetKeys';
import { cutoutImage } from '../cutout/cutout';
import { HUD_ICONS } from '../cutout/hudIcons';
import { makeHdImage } from '../hdTexture';

/** The pixel icon a drawn one stands in for. */
function pixelIcon(id: string): string | null {
  if (id === 'ben') return TEX.iconBen;
  if (id === 'gwen') return TEX.gwenIcon;
  return hasAlien(id) ? getAlien(id).hudIcon : null;
}

/**
 * The HD twins of the HUD's character icons (the Omnitrix dial, its carousel,
 * Gwen's corner): the owner's round drawings (docs/art-refs/hud-icons.webp,
 * scripts/cutout/hud_icons.py), each at its pixel icon's size. Returns the
 * keys they stand in for, for the HD skin; none if the drawings haven't loaded.
 */
export function makeHudIcons(scene: Phaser.Scene, res: number): string[] {
  const img = cutoutImage(HUD_ICONS.id);
  if (!img) return [];
  const keys: string[] = [];
  for (const [name, f] of Object.entries(HUD_ICONS.frames)) {
    const key = pixelIcon(name.slice('body:'.length));
    if (!key || !scene.textures.exists(key)) continue;
    keys.push(key);
    // Made once: kept under its HD key while the pixel look is on, under the icon's own while the HD one is.
    if (scene.textures.exists(hdKey(key)) || presentationIsHd()) continue;
    const { width: w, height: h } = scene.textures.get(key).get();
    makeHdImage(scene, hdKey(key), w, h, res, (p) => p.ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, w, h));
  }
  return keys;
}
