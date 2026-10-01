import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import { formatTime } from '../systems/RunStats';
import { pixelText } from './text';

/** Top-right: run timer, drones destroyed and Sumo Slammers cards found. */
export class StatsCorner {
  private readonly time: Phaser.GameObjects.BitmapText;
  private readonly kills: Phaser.GameObjects.BitmapText;
  private readonly cards: Phaser.GameObjects.Image[] = [];
  private readonly droneIcon: Phaser.GameObjects.Image;
  private visible = false;

  constructor(private readonly scene: Phaser.Scene, totalCards: number) {
    this.time = pixelText(scene, GAME_WIDTH - 8, 7, '0:00.00', { originX: 1, color: PALETTE.white });
    this.kills = pixelText(scene, GAME_WIDTH - 8, 20, '0', { originX: 1, color: PALETTE.enemyGlow });
    this.droneIcon = scene.add.image(GAME_WIDTH - 30, 24, TEX.droneIcon);
    this.setTotalCards(totalCards);
    this.setVisible(false);
  }

  /** One slot per card that exists this run (secret vault cards appear once their alien is unlocked). */
  private setTotalCards(total: number): void {
    if (total === this.cards.length) return;
    for (const c of this.cards) c.destroy();
    this.cards.length = 0;
    for (let i = 0; i < total; i++) {
      this.cards.push(this.scene.add.image(GAME_WIDTH - 12 - (total - 1 - i) * 10, 40, TEX.cardIcon, 0).setVisible(this.visible));
    }
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.time.setVisible(v);
    this.kills.setVisible(v);
    this.droneIcon.setVisible(v);
    for (const c of this.cards) c.setVisible(v);
  }

  set(timeMs: number, kills: number, cards: number, totalCards: number): void {
    this.setTotalCards(totalCards);
    this.time.setText(formatTime(timeMs));
    this.kills.setText(String(kills));
    this.droneIcon.setX(GAME_WIDTH - 14 - this.kills.width);
    for (let i = 0; i < this.cards.length; i++) this.cards[i].setFrame(i < cards ? 1 : 0);
  }

  /** Gold timer while ahead of your best at the last split. */
  setPace(ahead: boolean | null): void {
    this.time.setTint(ahead ? PALETTE.gold : PALETTE.white);
  }

  cardPop(index: number): void {
    const c = this.cards[index];
    if (!c) return;
    c.setScale(3);
    this.scene.tweens.add({ targets: c, scale: 1, duration: 500, ease: 'Bounce.easeOut' });
  }
}
