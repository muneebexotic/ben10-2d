import type Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { presentationIsHd } from '../systems/hd/Presentation';

/** The states that warn keep their colour on a drawn icon: jammed, stolen DNA, the timer's last seconds, a spent dial. */
const WARNINGS: ReadonlySet<number> = new Set([PALETTE.jammer, PALETTE.jammerDark, PALETTE.enemy, PALETTE.enemyDark, PALETTE.kevinDark]);
/** A dimmed drawn icon is greyed, not recoloured. */
const DIM_DRAWN = 0x8a8a8a;

/**
 * A character icon's tint (the Omnitrix dial, its carousel and swap badge, the
 * touch Omnitrix button). The pixel chapters' icons are white shapes the HUD
 * tints by state (the Omnitrix green, the alien's colour, dim); Chapter 7's are
 * the owner's full-colour drawings (docs/art-refs/hud-icons.webp), shown as
 * drawn: only the warning states tint them, and a dimmed one is greyed.
 */
export function tintIcon(img: Phaser.GameObjects.Image, color: number): Phaser.GameObjects.Image {
  if (!presentationIsHd()) return img.setTint(color);
  if (color === PALETTE.uiDim) return img.setTint(DIM_DRAWN);
  return WARNINGS.has(color) ? img.setTint(color) : img.clearTint();
}
