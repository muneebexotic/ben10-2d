import type Phaser from 'phaser';
import { hdKey, presentationIsHd } from '../../../../systems/hd/Presentation';
import { cutoutImage } from '../cutout/cutout';
import { HUD_PROPS } from '../cutout/hudProps';
import { makeHdSheet } from '../hdTexture';

/** The pixel textures the owner's drawings stand in for, each `body:<key>:<frame>` in the atlas. */
function groups(): Map<string, Array<{ x: number; y: number; w: number; h: number }>> {
  const out = new Map<string, Array<{ x: number; y: number; w: number; h: number }>>();
  for (const [name, f] of Object.entries(HUD_PROPS.frames)) {
    const [, key, frame] = name.split(':');
    const list = out.get(key) ?? [];
    list[Number(frame)] = f;
    out.set(key, list);
  }
  return out;
}

/**
 * The HD twins of the HUD's hearts, the Omnitrix dial ring, the collectible
 * card icon, the checkpoint post (off and lit), the smoothie and the drone and
 * boss icons: the owner's drawings (docs/art-refs/hud-props.webp, fitted to
 * each pixel frame by scripts/cutout/hud_props.py). Returns the keys they
 * stand in for, for the HD skin; none if the drawings haven't loaded.
 */
export function makeHudProps(scene: Phaser.Scene, res: number): string[] {
  const img = cutoutImage(HUD_PROPS.id);
  if (!img) return [];
  const T = HUD_PROPS.texel;
  const keys: string[] = [];
  for (const [key, frames] of groups()) {
    if (!scene.textures.exists(key)) continue;
    keys.push(key);
    // Made once: kept under its HD key while the pixel look is on, under the texture's own while the HD one is.
    if (scene.textures.exists(hdKey(key)) || presentationIsHd()) continue;
    const w = frames[0].w / T;
    const h = frames[0].h / T;
    makeHdSheet(scene, hdKey(key), w, h, frames.length, res, (p, i) => {
      const f = frames[i];
      p.ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, w, h);
    });
  }
  return keys;
}
