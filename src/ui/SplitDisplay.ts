import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { formatTime } from '../systems/RunStats';
import { formatDelta, type SplitResult } from '../systems/Splits';
import { pixelText } from './text';

const SHOW_MS = 4200;
const AHEAD = PALETTE.gold;
const BEHIND = 0xff6a6a;

/** Under the run timer: the split name, its time and the delta to your best (gold ahead, red behind). */
export class SplitDisplay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly name: Phaser.GameObjects.BitmapText;
  private readonly time: Phaser.GameObjects.BitmapText;
  private readonly delta: Phaser.GameObjects.BitmapText;
  private hideAt = 0;
  private right = GAME_WIDTH;

  constructor(private readonly scene: Phaser.Scene, y: number) {
    this.bg = scene.add.graphics();
    this.name = pixelText(scene, 0, 0, '', { originX: 1, color: PALETTE.uiDim });
    this.time = pixelText(scene, 0, 11, '', { originX: 1, color: PALETTE.white });
    this.delta = pixelText(scene, 0, 22, '', { originX: 1, scale: 1, color: AHEAD });
    this.root = scene.add.container(GAME_WIDTH - 8, y, [this.bg, this.name, this.time, this.delta]).setVisible(false).setDepth(200);
  }

  show(s: SplitResult, now: number): void {
    this.name.setText(s.label);
    this.time.setText(formatTime(s.timeMs));
    let color: number = PALETTE.omnitrix;
    if (s.deltaMs === null) this.delta.setText('FIRST RUN!');
    else {
      this.delta.setText(s.ahead ? `${formatDelta(s.deltaMs)} BEST!` : formatDelta(s.deltaMs));
      color = s.ahead ? AHEAD : BEHIND;
    }
    this.delta.setTint(color);
    const w = Math.max(this.name.width, this.time.width, this.delta.width) + 10;
    this.bg.clear();
    this.bg.fillStyle(PALETTE.ink, 0.7);
    this.bg.fillRoundedRect(-w + 4, -4, w, 37, 3);
    this.bg.fillStyle(color, 1);
    this.bg.fillRect(4, -4, 2, 37);
    this.root.setVisible(true).setAlpha(1).setX(this.right + 40);
    this.scene.tweens.add({ targets: this.root, x: this.right - 10, duration: 260, ease: 'Back.easeOut' });
    if (s.ahead) {
      this.delta.setScale(2);
      this.scene.tweens.add({ targets: this.delta, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }
    this.hideAt = now + SHOW_MS;
  }

  /** Moves the panel to the screen's right edge (wide screens). */
  setRight(right: number): void {
    this.right = right;
    if (!this.root.visible) this.root.setX(right - 10);
  }

  setVisible(v: boolean): void {
    if (!v) this.root.setVisible(false);
  }

  update(now: number): void {
    if (!this.root.visible || now < this.hideAt) return;
    this.hideAt = Infinity;
    this.scene.tweens.add({ targets: this.root, alpha: 0, x: this.right + 20, duration: 300, onComplete: () => this.root.setVisible(false) });
  }
}
