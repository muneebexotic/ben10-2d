import type Phaser from 'phaser';
import { CH7_HD } from '../../../config/chapter7';
import { HdMirror } from '../../../systems/hd/HdMirror';
import { cameraZoom } from '../../../systems/CameraZoom';
import { hdKey, registerHdSkin, usePresentation } from '../../../systems/hd/Presentation';
import { ALL_ANIMS } from '../../preload/catalog';
import { TEX } from '../../preload/assetKeys';
import { castMirrorSpecs, makeCastArt } from '../../preload/cartoon/cast';
import { makeHdFont } from '../../preload/cartoon/font';
import { makeHdImage, makeHdSheet } from '../../preload/cartoon/hdTexture';
import { INK, LINE, type Paint } from '../../preload/cartoon/paint';
import { CIRCUS_ANIMS } from '../../preload/cartoon/circus/circusSheets';
import { makeHudIcons } from '../../preload/cartoon/plumber/hudIcons';
import { makeHudProps } from '../../preload/cartoon/plumber/hudProps';
import { makeFamilyPortraits } from '../../preload/cartoon/plumber/familyPortraits';
import { plumberArtRes } from '../plumber/presentation';
import { makeCircusPortraits } from './portraits';

/** Texels per game pixel for Chapter 8's art: the same HD resolution as Chapter 7's (one rule for every Act 3 chapter). */
export function circusArtRes(game: Phaser.Game): number {
  return plumberArtRes(game);
}

/** The break-away wall (the cracked wall's HD twin in this chapter): striped boards with a cartoon crack. 16x48. */
function breakaway(p: Paint): void {
  const w = 16;
  const h = 48;
  const board = p.rrect(0.5, 0.5, w - 1, h - 1, 1);
  p.shape(board, { fill: 0xf4e8d0, ink: LINE });
  p.within(board, () => {
    for (let y = -8; y < h; y += 10) p.fill(p.poly([0, y, w, y + 6, w, y + 11, 0, y + 5]), 0xd8324a);
  });
  p.line([3, 10, 8, 16, 5, 22, 11, 30, 8, 38], LINE * 1.1, INK);
}

/** The prize shutter's tile (the security shutter's HD twin): corrugated tin. 16x16. */
function shutter(p: Paint): void {
  p.fill(p.rrect(0, 0, 16, 16, 0), { linear: [0, 0, 16, 0], stops: [[0, 0x9a9ab0], [1, 0x6a6a80]] });
  for (const y of [2, 6, 10, 14]) p.line([0, y, 16, y], 0.7, 0x3a3a4a);
}

function shutterBar(p: Paint): void {
  p.fill(p.rrect(0, 0, 16, 5, 0), 0xf2c24a);
  p.line([0, 0.4, 16, 0.4], 0.6, INK);
  p.line([0, 4.6, 16, 4.6], 0.6, INK);
}

/** A brass padlock (frames: locked, sprung). 10x16. */
function keypad(p: Paint, frame: number): void {
  p.stroke(p.ellipse(5, frame ? 3 : 5, 3, 3.4), INK, 1.8);
  p.stroke(p.ellipse(5, frame ? 3 : 5, 3, 3.4), 0xc8c0d0, 1);
  p.shape(p.rrect(1, 6, 8, 8, 1.4), { fill: { linear: [0, 6, 0, 14], stops: [[0, 0xffe08a], [1, 0xb8841a]] }, ink: LINE * 0.8 });
  p.fill(p.circle(5, 10, 1), frame ? 0x5dff5a : INK);
}

/** The shared textures Chapter 8 redraws (beyond Chapter 7's HUD twins), made under their HD keys. */
function makeCircusTwins(scene: Phaser.Scene, res: number): string[] {
  makeHdImage(scene, hdKey(TEX.crackedWall), 16, 48, res, breakaway);
  makeHdImage(scene, hdKey(TEX.shutter), 16, 16, res, shutter);
  makeHdImage(scene, hdKey(TEX.shutterBar), 16, 5, res, shutterBar);
  makeHdSheet(scene, hdKey(TEX.keypad), 10, 16, 2, res, keypad);
  return [TEX.crackedWall, TEX.shutter, TEX.shutterBar, TEX.keypad];
}

/**
 * Chapter 8 opens its level in the HD look, as Chapter 7 does: the cast's
 * rigs, the HUD's HD twins (the owner's icons and props, the family's
 * portraits) plus this chapter's own (the break-away wall, the prize
 * shutter), the render scale up and every character drawn by its rig.
 */
export function enterCircus(scene: Phaser.Scene): HdMirror {
  const res = circusArtRes(scene.game);
  makeCastArt(scene, res);
  const twins = [...makeHudIcons(scene, res), ...makeHudProps(scene, res), ...makeFamilyPortraits(scene, res), ...makeCircusTwins(scene, res), ...makeCircusPortraits(scene, res)];
  registerHdSkin({ textures: twins, font: makeHdFont(scene, res) });
  usePresentation(scene, true);
  scene.cameras.main.setRoundPixels(false);
  cameraZoom.base = CH7_HD.zoom;
  scene.cameras.main.setZoom(CH7_HD.zoom);
  const mirror = new HdMirror(scene);
  for (const { texture, spec } of castMirrorSpecs([...ALL_ANIMS, ...CIRCUS_ANIMS])) mirror.register(texture, spec);
  return mirror;
}
