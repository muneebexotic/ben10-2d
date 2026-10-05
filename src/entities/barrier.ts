import type Phaser from 'phaser';
import { PHYSICS } from '../config/constants';
import { TEX } from '../scenes/preload/assetKeys';

/**
 * The invisible body of a laser wall or gate. The light is drawn a few pixels
 * wide, but the body is PHYSICS.barrierWidth thick, grown away from the side
 * the player is kept on, so even a dash on a slow frame can't step clean
 * through it (an 8 px body let XLR8 dash out of a sealed room at 30 fps).
 *
 * `edge` is the world x of the face the player touches; `side` is which side
 * of it the player stays on (1: to its right, -1: to its left).
 */
export function barrierBody(scene: Phaser.Scene, edge: number, side: 1 | -1, top: number, bottom: number): Phaser.Physics.Arcade.Image {
  const w = PHYSICS.barrierWidth;
  const body = scene.physics.add.staticImage(edge - (side * w) / 2, (top + bottom) / 2, TEX.whitePx).setVisible(false);
  body.setDisplaySize(w, bottom - top).refreshBody();
  return body;
}
