import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { registerPixelFont } from '../ui/PixelFont';
import { frameView } from '../ui/view';
import { createAnimations, generateAssets, queueAssetFiles } from './preload/generate';
import { SCENES } from './SceneKeys';
import { launchParams } from '../systems/LaunchParams';
import { session } from '../systems/Session';
import { saveSystem } from '../systems/SaveSystem';
import { hasLevel } from '../levels/registry';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  preload(): void {
    frameView(this);
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
    // URL playtest switches skip the menus: they play on the last file (if there is one).
    const level = params.level && hasLevel(params.level) ? params.level : undefined;
    if (params.training || params.start || level) session.useSlot(saveSystem.lastSlot);
    if (params.gallery) this.scene.start(SCENES.gallery);
    else if (params.training) this.scene.start(SCENES.level, { levelId: 'training' });
    else if (params.start || level) this.scene.start(SCENES.level, { levelId: level, checkpoint: params.start });
    else this.scene.start(SCENES.menu);
  }
}
