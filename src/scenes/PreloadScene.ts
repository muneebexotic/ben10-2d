import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { registerPixelFont } from '../ui/PixelFont';
import { frameView } from '../ui/view';
import { createAnimations, generateAssets, queueAssetFiles } from './preload/generate';
import { SCENES } from './SceneKeys';
import { prepareLevel } from '../chapters/start';
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
    if (params.training || params.start || level || params.autobench) session.useSlot(saveSystem.lastSlot);
    if (params.autobench) {
      // The on-device benchmark is its own chunk: only ?autobench=1 downloads it.
      void import('./AutobenchScene').then((m) => {
        this.scene.add(SCENES.autobench, m.AutobenchScene, false);
        this.scene.start(SCENES.autobench);
      });
    }
    else if (params.gallery) this.scene.start(SCENES.gallery);
    else if (params.training) this.scene.start(SCENES.level, { levelId: 'training' });
    else if (params.start || level) {
      // The chapter's chunk first (a playtest link straight into a chapter).
      const levelId = level ?? 'ch1';
      void prepareLevel(this.game, levelId).then(() => this.scene.start(SCENES.level, { levelId, checkpoint: params.start }));
    }
    else this.scene.start(SCENES.menu);
  }
}
