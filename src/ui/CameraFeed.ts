import type Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';

/** Under the dialogue box (its bottom edge is at 94), centred. */
const TOP = 102;
const TURN_ON_MS = 180;

/**
 * A picture from a camera in the scene, shown under the dialogue box while its
 * line plays (Chapter 7's surface camera): it switches on like a monitor, a
 * bright line opening into the picture.
 */
export class CameraFeed {
  private readonly root: Phaser.GameObjects.Container;
  private readonly image: Phaser.GameObjects.Image;
  private readonly frame: Phaser.GameObjects.Rectangle;

  constructor(private readonly scene: Phaser.Scene) {
    this.image = scene.add.image(0, 0, '__DEFAULT');
    this.frame = scene.add.rectangle(0, 0, 10, 10).setStrokeStyle(2, PALETTE.ink, 1);
    this.root = scene.add.container(GAME_WIDTH / 2, TOP, [this.frame, this.image]).setDepth(940).setVisible(false);
  }

  show(key: string): void {
    if (!this.scene.textures.exists(key)) return;
    const was = this.root.visible && this.image.texture.key === key;
    this.image.setTexture(key);
    const { width, height } = this.image;
    this.root.setY(TOP + height / 2);
    this.frame.setSize(width + 4, height + 4).setDisplayOrigin((width + 4) / 2, (height + 4) / 2);
    this.root.setVisible(true);
    if (was) return;
    this.scene.tweens.killTweensOf(this.root);
    this.root.setScale(1, 0.04).setAlpha(1);
    this.scene.tweens.add({ targets: this.root, scaleY: 1, duration: TURN_ON_MS, ease: 'Cubic.easeOut' });
  }

  hide(): void {
    if (!this.root.visible) return;
    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.add({ targets: this.root, scaleY: 0.04, duration: TURN_ON_MS * 0.7, ease: 'Cubic.easeIn', onComplete: () => this.root.setVisible(false) });
  }
}
