import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_MAX_WIDTH, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { TOUCH } from '../config/touch';
import { PROMPT } from '../config/ui';
import { pixelText } from './text';
import { FONT_SIZE } from './PixelFont';
import { inputMode } from '../systems/InputMode';
import { touchControlsOn } from '../systems/Settings';
import { BakedGraphics } from './BakedGraphics';
import { viewWidth } from './view';

/** A one-line bar's height, the font's line height and the bar's side padding. */
const LINE_BOX = 18;
const LINE_H = 11;
const PADDING = 18;
/** How far the baked box reaches above and below the root: two lines at 2x and the breathing. */
const BG_REACH = 64;

interface Prompt {
  id: string;
  text: string;
  priority: number;
}

/** Contextual control hints at the bottom of the screen; the highest priority wins. */
export class PromptBar {
  private readonly prompts: Prompt[] = [];
  private readonly root: Phaser.GameObjects.Container;
  private readonly bg: BakedGraphics;
  private readonly label: Phaser.GameObjects.BitmapText;
  private shownId = '';

  constructor(private readonly scene: Phaser.Scene) {
    // Wide enough for the longest prompt on the widest view, and tall enough for two lines at 2x.
    this.bg = new BakedGraphics(scene, -GAME_MAX_WIDTH / 2, -BG_REACH, GAME_MAX_WIDTH, BG_REACH * 2);
    this.label = pixelText(scene, 0, 0, '', { originX: 0.5, originY: 0.5, color: PALETTE.white, align: 'center' });
    // The root sits at the middle of a one-line bar; taller bars grow upward from the same bottom edge.
    this.root = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - PROMPT.bottom - LINE_BOX / 2, [this.bg.image, this.label]).setVisible(false).setDepth(300);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.refresh, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, this.refresh, this));
  }

  add(id: string, text: string, priority = 1): void {
    const existing = this.prompts.find((p) => p.id === id);
    if (existing) {
      existing.text = text;
      existing.priority = priority;
    } else this.prompts.push({ id, text, priority });
    this.refresh();
  }

  clear(id: string): void {
    const i = this.prompts.findIndex((p) => p.id === id);
    if (i >= 0) this.prompts.splice(i, 1);
    this.refresh();
  }

  /** Re-renders the current prompt (the player switched between keys and touch). */
  rerender(): void {
    this.refresh();
  }

  clearAll(): void {
    this.prompts.length = 0;
    this.refresh();
  }

  private refresh(): void {
    const top = [...this.prompts].sort((a, b) => b.priority - a.priority)[0];
    if (!top) {
      this.shownId = '';
      this.root.setVisible(false);
      return;
    }
    // The big prompt draws at 2x rather than scaling the bar: the pixel font garbles at fractional sizes.
    const big = top.id === 'transform';
    this.label.setFontSize(FONT_SIZE * (big ? 2 : 1)).setMaxWidth(0).setText(inputMode.format(top.text));
    // Between the thumbs: a prompt that would reach the touch stick or buttons wraps instead.
    const room = this.maxWidth() - PADDING;
    if (this.label.width > room) this.label.setMaxWidth(room);
    const w = Math.ceil(this.label.width) + PADDING;
    const h = Math.ceil(this.label.height) + LINE_BOX - LINE_H;
    const bottom = LINE_BOX / 2;
    this.label.setY(Math.round(bottom - h / 2));
    this.bg.draw((g) => {
      g.fillStyle(PALETTE.ink, 0.85);
      g.fillRoundedRect(-w / 2, bottom - h, w, h, 4);
      g.lineStyle(1, PALETTE.omnitrixDark, 1);
      g.strokeRoundedRect(-w / 2, bottom - h, w, h, 4);
    });
    if (top.id !== this.shownId) {
      this.root.setVisible(true).setScale(0.6).setAlpha(0);
      this.scene.tweens.add({ targets: this.root, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
    }
    if (!big) this.bg.image.setScale(1);
    this.shownId = top.id;
  }

  /** The widest bar that keeps clear of the touch controls beside its row (the whole view without them). */
  private maxWidth(): number {
    const w = viewWidth(this.scene);
    if (!touchControlsOn()) return w - 2 * PROMPT.thumbGap;
    const B = TOUCH.buttons;
    const left = TOUCH.stick.homeX + TOUCH.stick.radius;
    const right = Math.max(B.attack.right + B.attack.r, B.jump.right + B.jump.r);
    return 2 * (w / 2 - Math.max(left, right) - PROMPT.thumbGap);
  }

  update(now: number): void {
    if (!this.root.visible) return;
    const big = this.shownId === 'transform';
    const pulse = (Math.sin(now * (big ? 0.012 : 0.005)) + 1) / 2;
    this.label.setTint(big ? (pulse > 0.5 ? PALETTE.omnitrix : PALETTE.white) : PALETTE.white);
    // The box breathes; the text stays at its whole size.
    if (big) this.bg.image.setScale(1 + pulse * PROMPT.bigPulse);
  }
}
