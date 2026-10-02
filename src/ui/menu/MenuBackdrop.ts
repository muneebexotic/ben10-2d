import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/constants';
import { COVER_W, COVER_X, frameView } from '../view';
import { PALETTE } from '../../config/palette';
import { MENU } from '../../config/ui';
import { TEX } from '../../scenes/preload/assetKeys';

export interface BackdropOptions {
  /** Darkens everything behind the menu so text reads (0 on the title screen). */
  dim?: number;
  /** The Omnitrix emblem watermark. */
  emblem?: boolean;
  /** The moon (card screens hide it: it peeks out behind cards). */
  moon?: boolean;
}

/**
 * The night over camp that every menu sits on: sky, stars, moon, mountains
 * and slowly drifting pines. Shared so moving between menus feels like one place.
 */
export class MenuBackdrop {
  readonly emblem: Phaser.GameObjects.Image | null;
  private readonly pines: Phaser.GameObjects.TileSprite;
  private readonly pinesFar: Phaser.GameObjects.TileSprite;
  private readonly stars: Phaser.GameObjects.TileSprite;

  constructor(private readonly scene: Phaser.Scene, opts: BackdropOptions = {}) {
    // Every menu sits on this backdrop: it centres the 640 frame on wide screens and covers the whole view.
    frameView(scene);
    scene.add.image(COVER_X, 0, TEX.sky).setOrigin(0, 0).setDisplaySize(COVER_W, GAME_HEIGHT);
    this.stars = scene.add.tileSprite(COVER_X, 0, COVER_W, 200, TEX.stars).setOrigin(0, 0);
    if (opts.moon !== false) {
      scene.add.image(520, 60, TEX.light).setScale(1.8).setAlpha(0.18).setTint(PALETTE.moon).setBlendMode(Phaser.BlendModes.ADD);
      scene.add.image(520, 60, TEX.moon);
    }
    scene.add.tileSprite(COVER_X, 150, COVER_W, 140, TEX.mountains).setOrigin(0, 0);
    this.pinesFar = scene.add.tileSprite(COVER_X, 190, COVER_W, 150, TEX.pinesFar).setOrigin(0, 0);
    this.pines = scene.add.tileSprite(COVER_X, 220, COVER_W, 200, TEX.pinesMid).setOrigin(0, 0);
    scene.add.rectangle(COVER_X, 318, COVER_W, 60, PALETTE.pineNear).setOrigin(0, 0);

    this.emblem = opts.emblem === false
      ? null
      : scene.add.image(GAME_WIDTH / 2, 92, TEX.hourglass).setTint(PALETTE.omnitrix).setAlpha(0.22).setScale(2.4).setBlendMode(Phaser.BlendModes.ADD);
    if (opts.dim) scene.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, PALETTE.ink, opts.dim).setOrigin(0, 0);
    this.update();
  }

  update(): void {
    // Driven by the game clock, not the scene's, so cutting between menus never makes the trees jump.
    const t = this.scene.game.loop.time;
    this.pines.tilePositionX = t * MENU.pineDrift;
    this.pinesFar.tilePositionX = t * MENU.pineDrift * 0.4;
    this.stars.tilePositionX = t * MENU.pineDrift * 0.05;
    this.emblem?.setAngle(Math.sin(t * 0.0006) * 8);
  }
}
