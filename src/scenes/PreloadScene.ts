import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { registerPixelFont } from '../ui/PixelFont';
import { createAnimations, generateAssets, queueAssetFiles } from './preload/generate';
import { SCENES } from './SceneKeys';
import { launchParams } from '../systems/LaunchParams';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  preload(): void {
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2, 0, 4, PALETTE.omnitrix).setOrigin(0, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 164, 8).setStrokeStyle(1, PALETTE.omnitrixDark);
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => (bar.width = 160 * p));
    queueAssetFiles(this);
  }

  create(): void {
    registerPixelFont(this);
    generateAssets(this);
    createAnimations(this);
    const params = launchParams();
    if (params.gallery) this.scene.start(SCENES.gallery);
    else if (params.start) this.scene.start(SCENES.level, { checkpoint: params.start });
    else this.scene.start(SCENES.menu);
  }
}
