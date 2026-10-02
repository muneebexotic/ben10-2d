import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { pixelText } from './text';

/** A form that landed hits in the current combo, as the HUD draws it. */
export interface ComboForm {
  icon: string;
  color: number;
}

const ICON_GAP = 14;
const TAG_LABELS = ['', '', 'TAG TEAM!', 'TRIPLE THREAT!', 'FULL OMNITRIX!'];

/**
 * Right-edge hit counter that pops on every hit and cracks apart when the
 * combo drops. Under it, one icon per form that joined the combo: switching
 * aliens mid-combo lines them up.
 */
export class ComboDisplay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly count: Phaser.GameObjects.BitmapText;
  private readonly label: Phaser.GameObjects.BitmapText;
  private readonly icons: Phaser.GameObjects.Image[] = [];
  private shown = 0;
  private hideAt = 0;
  private pop = 1;
  private right = GAME_WIDTH;

  constructor(private readonly scene: Phaser.Scene) {
    this.count = pixelText(scene, 0, 0, '0', { scale: 3, originX: 1, originY: 0.5, color: PALETTE.gold });
    this.label = pixelText(scene, 0, 14, 'HIT COMBO', { originX: 1, originY: 0.5, color: PALETTE.cream });
    this.root = scene.add.container(GAME_WIDTH - 10, 116, [this.count, this.label]).setVisible(false);
  }

  set(count: number, now: number, forms: readonly ComboForm[]): void {
    this.count.setText(String(count));
    const color = count >= 25 ? PALETTE.enemyGlow : count >= 12 ? PALETTE.fire1 : PALETTE.gold;
    this.count.setTint(color);
    const tag = forms.length >= 2 ? TAG_LABELS[Math.min(forms.length, TAG_LABELS.length - 1)] : '';
    this.label.setText(count >= 25 ? 'UNSTOPPABLE!' : tag || (count >= 12 ? 'HERO TIME!' : 'HIT COMBO'));
    this.label.setTint(tag && count < 25 ? forms[forms.length - 1].color : PALETTE.cream);
    this.showIcons(forms);
    // A new combo can start while the last one is still fading out.
    this.scene.tweens.killTweensOf(this.root);
    this.root.setVisible(true).setAlpha(1).setX(this.right - 10);
    this.pop = 1.6;
    this.hideAt = now + 2400;
  }

  /** Moves the counter to the screen's right edge (wide screens). */
  setRight(right: number): void {
    this.right = right;
    this.scene.tweens.killTweensOf(this.root);
    this.root.setX(right - 10).setAlpha(this.root.visible ? 1 : this.root.alpha);
  }

  /** A new form just joined: its icon slams in. */
  tag(): void {
    const icon = this.icons[this.shown - 1];
    if (!icon) return;
    icon.setScale(2.6);
    this.scene.tweens.add({ targets: icon, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.pop = 2.1;
  }

  hide(): void {
    this.root.setVisible(false).setAlpha(1).setX(this.right - 10);
    this.showIcons([]);
  }

  drop(count: number): void {
    if (!this.root.visible) return;
    this.label.setText(`x${count} DONE`).setTint(PALETTE.cream);
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      x: this.root.x + 20,
      duration: 500,
      onComplete: () => this.hide(),
    });
  }

  update(dtMs: number, now: number): void {
    if (!this.root.visible) return;
    this.pop += (1 - this.pop) * Math.min(1, dtMs / 80);
    this.count.setScale(this.pop * 1);
    if (now > this.hideAt && this.root.alpha === 1) this.root.setAlpha(0.5);
  }

  /** Icons only appear once two forms are in the combo; one form is just a combo. */
  private showIcons(forms: readonly ComboForm[]): void {
    const n = forms.length >= 2 ? forms.length : 0;
    while (this.icons.length < n) {
      const img = this.scene.add.image(0, 0, forms[this.icons.length].icon);
      this.icons.push(img);
      this.root.add(img);
    }
    for (let i = 0; i < this.icons.length; i++) {
      const img = this.icons[i];
      if (i >= n) {
        img.setVisible(false);
        continue;
      }
      // Right-aligned, newest form on the right.
      img.setTexture(forms[i].icon).setTint(forms[i].color).setPosition(-6 - (n - 1 - i) * ICON_GAP, 28).setVisible(true);
    }
    this.shown = n;
  }
}
