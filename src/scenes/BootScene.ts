import Phaser from 'phaser';
import { SCENES } from './SceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    this.scene.start(SCENES.preload);
  }
}
