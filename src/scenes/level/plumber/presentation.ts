import type Phaser from 'phaser';
import { CH7_HD } from '../../../config/chapter7';
import { wantedHdScale } from '../../../systems/HdRender';
import { HdMirror } from '../../../systems/hd/HdMirror';
import { cameraZoom } from '../../../systems/CameraZoom';
import { registerHdSkin, usePresentation } from '../../../systems/hd/Presentation';
import { ALL_ANIMS } from '../../preload/catalog';
import { castMirrorSpecs, makeCastArt } from '../../preload/cartoon/cast';
import { makeHdFont } from '../../preload/cartoon/font';

let artRes = 0;

/** Texels per game pixel for Chapter 7's art on this screen: the render scale times the camera's zoom, in whole steps. */
export function plumberArtRes(game: Phaser.Game): number {
  if (artRes > 0) return artRes;
  artRes = Math.max(2, Math.min(CH7_HD.maxArtRes, Math.round(wantedHdScale(game, CH7_HD.maxRenderScale) * CH7_HD.zoom)));
  return artRes;
}

/**
 * Chapter 7 opens its level in the HD look: its art (made once), the shared
 * textures swapped for their HD twins, the render scale up, and every
 * character drawn by its rig. Called first thing in the level's create.
 */
export function enterPlumberBase(scene: Phaser.Scene): HdMirror {
  const res = plumberArtRes(scene.game);
  makeCastArt(scene, res);
  registerHdSkin({ textures: [], font: makeHdFont(scene, res) });
  usePresentation(scene, true);
  scene.cameras.main.setRoundPixels(false);
  cameraZoom.base = CH7_HD.zoom;
  scene.cameras.main.setZoom(CH7_HD.zoom);
  const mirror = new HdMirror(scene);
  for (const { texture, spec } of castMirrorSpecs(ALL_ANIMS)) mirror.register(texture, spec);
  return mirror;
}
