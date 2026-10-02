import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { getDifficulty } from '../config/difficulty';
import { PALETTE } from '../config/palette';
import { getAlien } from '../aliens/registry';
import { playSfx } from '../systems/audio/Sfx';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { summarize, type FileSummary } from '../systems/Progress';
import { saveSystem, SLOT_COUNT } from '../systems/SaveSystem';
import { session } from '../systems/Session';
import { bindMuteKey } from '../systems/Settings';
import { MenuBackdrop } from '../ui/menu/MenuBackdrop';
import { enterMenu, isLeaving, leaveTo } from '../ui/menu/transition';
import { backButton, drawPanel, formatPlayTime, menuHeader, MenuButton } from '../ui/menu/widgets';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X } from '../ui/view';
import { MENU } from '../config/ui';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';

const CARD_W = 184;
const CARD_H = 196;
const CARD_Y = 156;
const GAP = 196;

interface Card {
  root: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Graphics;
  summary: FileSummary | null;
}

/** Three save files. Pick one to play, start a new one, or erase one (with a confirm). */
export class FileSelectScene extends Phaser.Scene {
  private backdrop!: MenuBackdrop;
  private cards: Card[] = [];
  private focus = 0;
  private primary!: MenuButton;
  private erase!: MenuButton;
  private hint!: Phaser.GameObjects.BitmapText;
  private confirm: Phaser.GameObjects.Container | null = null;
  private confirmButtons: MenuButton[] = [];
  private confirmFocus = 1;

  constructor() {
    super(SCENES.fileSelect);
  }

  create(): void {
    enterMenu(this);
    this.cards = [];
    this.confirm = null;
    this.backdrop = new MenuBackdrop(this, { dim: 0.45, moon: false });
    menuHeader(this, 'SAVE FILES', 'EACH FILE KEEPS ITS OWN DIFFICULTY, ALIENS, CARDS AND BEST TIMES');
    backButton(this, () => this.back());

    for (let i = 0; i < SLOT_COUNT; i++) this.cards.push(this.buildCard(i));
    const last = saveSystem.lastSlot;
    const firstEmpty = this.cards.findIndex((c) => !c.summary);
    this.focus = last ?? (firstEmpty >= 0 ? firstEmpty : 0);

    this.primary = new MenuButton(this, GAME_WIDTH / 2 - 64, 284, 116, 'PLAY', PALETTE.omnitrix, () => this.activate());
    this.erase = new MenuButton(this, GAME_WIDTH / 2 + 64, 284, 116, 'ERASE', PALETTE.enemy, () => this.askErase());
    this.primary.setFocused(true);
    this.hint = pixelText(this, GAME_WIDTH / 2, 336, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });

    const kb = this.input.keyboard!;
    const move = (dir: 1 | -1) => (this.confirm ? this.moveConfirm(dir) : this.setFocus(this.focus + dir));
    kb.on('keydown-LEFT', () => move(-1));
    kb.on('keydown-A', () => move(-1));
    kb.on('keydown-RIGHT', () => move(1));
    kb.on('keydown-D', () => move(1));
    const ok = () => (this.confirm ? this.confirmButtons[this.confirmFocus]?.press() : this.activate());
    kb.on('keydown-ENTER', ok);
    kb.on('keydown-SPACE', ok);
    kb.on('keydown-J', ok);
    kb.on('keydown-X', () => !this.confirm && this.askErase());
    kb.on('keydown-DELETE', () => !this.confirm && this.askErase());
    bindMuteKey(this);
    EventBus.on('input:mode', () => this.refresh(), this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.offContext(this));
    this.refresh(true);
  }

  private buildCard(slot: number): Card {
    const cx = GAME_WIDTH / 2 + (slot - 1) * GAP;
    const summary = summarize(slot);
    const frame = this.add.graphics();
    const items: Phaser.GameObjects.GameObject[] = [frame];
    const top = -CARD_H / 2;
    items.push(pixelText(this, 0, top + 15, `FILE ${slot + 1}`, { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.white }));

    if (summary) {
      const d = getDifficulty(summary.file.difficulty);
      const badge = pixelText(this, 0, top + 33, d.label, { originX: 0.5, originY: 0.5, color: d.color });
      const bg = this.add.graphics();
      drawPanel(bg, 0, top + 33, badge.width + 14, 13, { fill: PALETTE.ink, fillAlpha: 0.9, stroke: d.color, strokeAlpha: 0.9, radius: 3 });
      items.push(bg, badge);

      // Portrait: Ben and the aliens on this file's dial.
      const port = this.add.graphics();
      drawPanel(port, 0, top + 68, CARD_W - 24, 46, { fill: 0x060919, fillAlpha: 1, stroke: PALETTE.uiPanelLight, strokeAlpha: 1, radius: 4 });
      items.push(port);
      items.push(this.add.image(-58, top + 70, TEX.light).setScale(0.8).setTint(PALETTE.omnitrix).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD));
      items.push(this.add.sprite(-58, top + 89, TEX.ben, 0).setOrigin(0.5, 1).setScale(1.5));
      if (summary.aliens.length > 0) {
        summary.aliens.forEach((id, i) => {
          const a = getAlien(id);
          items.push(this.add.image(-22 + i * 22, top + 68, a.hudIcon).setScale(1.5).setTint(a.theme.color));
        });
      } else {
        items.push(pixelText(this, 18, top + 68, 'NO ALIENS YET', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim }));
      }

      const rows: Array<[string, string]> = [
        ['CHAPTERS', `${summary.chaptersDone}/${summary.chaptersTotal}`],
        ['CARDS', `${summary.cards}/${summary.cardsTotal}`],
        ['ALIENS', `${summary.aliens.length}/${summary.aliensTotal}`],
        ['PLAYED', formatPlayTime(summary.file.playTimeMs)],
      ];
      rows.forEach(([label, value], i) => {
        const y = top + 106 + i * 13;
        items.push(pixelText(this, -CARD_W / 2 + 16, y, label, { originY: 0.5, color: PALETTE.uiDim }));
        items.push(pixelText(this, CARD_W / 2 - 16, y, value, { originX: 1, originY: 0.5, color: PALETTE.white }));
      });
      const where = summary.resumeLabel ? `SAVED AT ${summary.resumeLabel}` : 'ON CHAPTER SELECT';
      items.push(pixelText(this, 0, top + 170, where, { originX: 0.5, originY: 0.5, color: summary.resumeLabel ? PALETTE.gold : PALETTE.uiDim, maxWidth: CARD_W - 20, align: 'center' }));
    } else {
      items.push(this.add.image(0, top + 92, TEX.hourglass).setTint(PALETTE.omnitrixDark).setAlpha(0.35).setScale(1.3));
      items.push(pixelText(this, 0, top + 88, '+', { scale: 5, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }));
      items.push(pixelText(this, 0, top + 134, 'NEW GAME', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix }));
      items.push(pixelText(this, 0, top + 154, 'EMPTY FILE', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim }));
    }

    const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.confirm || isLeaving(this)) return;
      // First tap picks the file, a second tap plays it.
      if (this.focus === slot) this.activate();
      else this.setFocus(slot);
    });
    items.push(zone);
    const root = this.add.container(cx, CARD_Y, items);
    return { root, frame, summary };
  }

  private setFocus(i: number): void {
    const next = Phaser.Math.Clamp(i, 0, SLOT_COUNT - 1);
    if (next === this.focus) return;
    this.focus = next;
    playSfx('uiMove');
    this.refresh();
  }

  private refresh(instant = false): void {
    this.cards.forEach((card, i) => {
      const focused = i === this.focus;
      const g = card.frame;
      g.clear();
      const color = card.summary ? getDifficulty(card.summary.file.difficulty).color : PALETTE.omnitrix;
      drawPanel(g, 0, 0, CARD_W, CARD_H, { fill: focused ? PALETTE.uiPanel : PALETTE.ink, fillAlpha: 0.9, stroke: focused ? color : PALETTE.uiPanelLight, strokeAlpha: 1, radius: 7, bevel: true });
      if (focused) g.lineStyle(1, color, 0.35).strokeRoundedRect(-CARD_W / 2 - 3.5, -CARD_H / 2 - 3.5, CARD_W + 7, CARD_H + 7, 9);
      const props = { scale: focused ? 1.04 : 0.96, alpha: focused ? 1 : 0.7 };
      this.tweens.killTweensOf(card.root);
      if (instant) card.root.setScale(props.scale).setAlpha(props.alpha);
      else this.tweens.add({ targets: card.root, ...props, duration: MENU.focusMs, ease: 'Quad.easeOut' });
    });
    const has = this.cards[this.focus]?.summary !== null;
    this.primary.setText(has ? 'PLAY' : 'NEW GAME').setColor(PALETTE.omnitrix);
    this.erase.setVisible(has);
    this.primary.root.setX(has ? GAME_WIDTH / 2 - 64 : GAME_WIDTH / 2);
    const touch = inputMode.current === 'touch';
    this.hint.setText(
      touch
        ? 'TAP A FILE TO PICK IT, TAP IT AGAIN TO PLAY'
        : has
          ? '[LEFT]/[RIGHT] PICK   [ENTER] PLAY   [X] ERASE'
          : '[LEFT]/[RIGHT] PICK   [ENTER] NEW GAME',
    );
  }

  private activate(): void {
    if (this.confirm || isLeaving(this)) return;
    const card = this.cards[this.focus];
    if (card.summary) {
      session.useSlot(this.focus);
      playSfx('uiConfirm');
      leaveTo(this, SCENES.chapterSelect, {}, null);
    } else {
      playSfx('uiSelect');
      leaveTo(this, SCENES.difficulty, { slot: this.focus, mode: 'new' }, null);
    }
  }

  private back(): void {
    if (this.confirm) {
      this.closeConfirm();
      return;
    }
    if (isLeaving(this)) return;
    playSfx('uiBack');
    leaveTo(this, SCENES.menu, undefined, null);
  }

  // ---------------------------------------------------------------- Erase

  private askErase(): void {
    if (this.confirm || !this.cards[this.focus].summary || isLeaving(this)) return;
    playSfx('denied');
    const slot = this.focus;
    const shade = this.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, PALETTE.ink, 0.7).setOrigin(0, 0).setInteractive();
    const panel = this.add.graphics();
    drawPanel(panel, GAME_WIDTH / 2, GAME_HEIGHT / 2, 320, 118, { fill: PALETTE.uiPanel, fillAlpha: 0.97, stroke: PALETTE.enemy, radius: 8, bevel: true });
    const title = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, `ERASE FILE ${slot + 1}?`, { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.enemy });
    const body = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, "ITS ALIENS, CARDS AND BEST TIMES WILL BE GONE.\nTHIS CAN'T BE UNDONE.", {
      originX: 0.5,
      originY: 0.5,
      color: PALETTE.cream,
      align: 'center',
    });
    this.confirmButtons = [
      new MenuButton(this, GAME_WIDTH / 2 - 62, GAME_HEIGHT / 2 + 30, 108, 'ERASE', PALETTE.enemy, () => this.doErase(slot)),
      new MenuButton(this, GAME_WIDTH / 2 + 62, GAME_HEIGHT / 2 + 30, 108, 'KEEP IT', PALETTE.omnitrix, () => this.closeConfirm()),
    ];
    this.confirmButtons.forEach((b, i) => (b.onFocus = () => this.setConfirmFocus(i)));
    this.confirm = this.add.container(0, 0, [shade, panel, title, body, ...this.confirmButtons.map((b) => b.root)]).setDepth(100);
    this.confirm.setAlpha(0);
    this.tweens.add({ targets: this.confirm, alpha: 1, duration: 140 });
    this.setConfirmFocus(1);
  }

  private moveConfirm(dir: 1 | -1): void {
    this.setConfirmFocus(Phaser.Math.Clamp(this.confirmFocus + dir, 0, 1));
  }

  private setConfirmFocus(i: number): void {
    if (i !== this.confirmFocus) playSfx('uiMove');
    this.confirmFocus = i;
    this.confirmButtons.forEach((b, k) => b.setFocused(k === i));
  }

  private closeConfirm(): void {
    if (!this.confirm) return;
    playSfx('uiBack');
    this.confirm.destroy();
    this.confirm = null;
    this.confirmButtons = [];
    this.confirmFocus = 1;
  }

  private doErase(slot: number): void {
    saveSystem.deleteSlot(slot);
    playSfx('erase');
    this.confirm?.destroy();
    this.confirm = null;
    this.confirmButtons = [];
    // Rebuild the card as an empty file, with a little crumble.
    const old = this.cards[slot];
    this.tweens.add({ targets: old.root, alpha: 0, scaleY: 0.2, duration: 220, ease: 'Quad.easeIn', onComplete: () => old.root.destroy() });
    const fresh = this.buildCard(slot);
    fresh.root.setAlpha(0);
    this.cards[slot] = fresh;
    this.time.delayedCall(200, () => this.refresh());
  }

  override update(time: number): void {
    this.backdrop.update();
    this.primary.pulse(time);
    for (const b of this.confirmButtons) b.pulse(time);
  }
}
