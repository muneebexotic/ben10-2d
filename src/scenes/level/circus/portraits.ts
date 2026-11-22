import type Phaser from 'phaser';
import { GHOSTFREAK_TEX } from '../../../aliens/ghostfreak/art';
import { hdKey } from '../../../systems/hd/Presentation';
import { castRig } from '../../preload/cartoon/cast';
import { makeRigPortrait } from '../../preload/cartoon/portrait';
import { HD_PORTRAITS } from '../../preload/cartoon/portraitKeys';

/**
 * Chapter 8's speakers without drawn portraits get busts painted from their
 * rigs: CACKLEJACK, IRONJAW, THE TANGLE, and the whisper in the watch at the
 * end (Ghostfreak's HD twin of his pixel portrait, from the owner's drawings).
 */
/** Returns the shared portrait keys it made HD twins of (for the HD skin). */
export function makeCircusPortraits(scene: Phaser.Scene, res: number): string[] {
  makeRigPortrait(scene, HD_PORTRAITS.cacklejack, castRig('cacklejack'), { clip: 'idle', t: 0.25, cx: 2, cy: -44, scale: 1.25, bg: 0x2a1240, glow: 0x9aff3a }, res);
  makeRigPortrait(scene, HD_PORTRAITS.ironjaw, castRig('ironjaw'), { clip: 'idle', t: 0.25, cx: 1, cy: -38, scale: 1.05, bg: 0x3a1418, glow: 0xd8324a }, res);
  makeRigPortrait(scene, HD_PORTRAITS.tangle, castRig('tangle'), { clip: 'idle', t: 0, cx: 0, cy: -34, scale: 1.4, bg: 0x123a3a, glow: 0x3ac8c0 }, res);
  makeRigPortrait(scene, hdKey(GHOSTFREAK_TEX.portrait), castRig('ghostfreak'), { clip: 'idle', t: 0.25, cx: 2, cy: -30, scale: 1.1, bg: 0x10101a, glow: 0x9a6aff }, res);
  return [GHOSTFREAK_TEX.portrait];
}
