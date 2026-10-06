import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { DIFFICULTY, DIFFICULTY_IDS, DEFAULT_DIFFICULTY, type DifficultyId } from '../config/difficulty';
import { difficultyRows } from '../ui/menu/difficultyInfo';
import { PALETTE } from '../config/palette';
import { MENU } from '../config/ui';
import { playSfx } from '../systems/audio/Sfx';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { ghostStore } from '../systems/Ghost';
import { saveSystem } from '../systems/SaveSystem';
import { session } from '../systems/Session';
import { bindMuteKey } from '../systems/Settings';
import { MenuBackdrop } from '../ui/menu/MenuBackdrop';
import { enterMenu, isLeaving, leaveTo } from '../ui/menu/transition';
import { backButton, drawPanel, menuHeader, MenuButton } from '../ui/menu/widgets';
import { boxed, pixelText } from '../ui/text';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';

export interface DifficultySceneData {
  /** The empty file this new game goes into. */
  slot: number;
}

const CARD_W = 184;
const CARD_H = 178;
const CARD_Y = 146;
const GAP = 196;

/** New game: pick how hard the summer gets. Every number shown comes from config/difficulty.ts. */
export class DifficultyScene extends Phaser.Scene {
  private backdrop!: MenuBackdrop;
  private slot = 0;
  private focus = 1;
  private cards: Array<{ root: Phaser.GameObjects.Container; frame: Phaser.GameObjects.Graphics; id: DifficultyId }> = [];
  private blurb!: Phaser.GameObjects.BitmapText;
  private start!: MenuButton;
  private hint!: Phaser.GameObjects.BitmapText;
  private hardGlow: Phaser.GameObjects.Image | null = null;

  constructor() {
    super(SCENES.difficulty);
  }

  create(data: DifficultySceneData): void {
    enterMenu(this);
    this.slot = data.slot ?? 0;
    this.cards = [];
    this.backdrop = new MenuBackdrop(this, { dim: 0.5, moon: false });
    menuHeader(this, 'CHOOSE YOUR DIFFICULTY', `NEW GAME ON FILE ${this.slot + 1}`);
    backButton(this, () => this.back());

    DIFFICULTY_IDS.forEach((id, i) => this.cards.push(this.buildCard(id, i)));
    this.focus = DIFFICULTY_IDS.indexOf(DEFAULT_DIFFICULTY);

    this.blurb = pixelText(this, GAME_WIDTH / 2, 248, '', { originX: 0.5, originY: 0.5, color: PALETTE.cream });
    pixelText(this, GAME_WIDTH / 2, 262, 'YOU CAN CHANGE IT ANY TIME IN SETTINGS. BEST TIMES ARE KEPT PER DIFFICULTY.', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.start = new MenuButton(this, GAME_WIDTH / 2, 292, 170, 'START', PALETTE.omnitrix, () => this.confirm(), 24);
    this.start.setFocused(true);
    this.hint = pixelText(this, GAME_WIDTH / 2, 336, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.setFocus(this.focus - 1));
    kb.on('keydown-A', () => this.setFocus(this.focus - 1));
    kb.on('keydown-RIGHT', () => this.setFocus(this.focus + 1));
    kb.on('keydown-D', () => this.setFocus(this.focus + 1));
    for (const key of ['ENTER', 'SPACE', 'J']) kb.on(`keydown-${key}`, () => this.confirm());
    bindMuteKey(this);
    EventBus.on('input:mode', () => this.refresh(true), this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.offContext(this));
    this.refresh(true);
  }

  private buildCard(id: DifficultyId, i: number): { root: Phaser.GameObjects.Container; frame: Phaser.GameObjects.Graphics; id: DifficultyId } {
    const d = DIFFICULTY[id];
    const frame = this.add.graphics();
    const top = -CARD_H / 2;
    const items: Phaser.GameObjects.GameObject[] = [frame];

    // Each difficulty has a face: a relaxed Ben, the Omnitrix, and the Hunter-Killer's red eye.
    if (id === 'hard') {
      this.hardGlow = this.add.image(0, top + 34, TEX.light).setScale(1.3).setTint(d.color).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      items.push(this.hardGlow, this.add.image(0, top + 34, TEX.bossIcon).setScale(3));
    } else if (id === 'normal') {
      items.push(this.add.image(0, top + 34, TEX.light).setScale(1.1).setTint(d.color).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD));
      items.push(this.add.image(0, top + 34, TEX.hourglass).setScale(0.55).setTint(d.color));
    } else {
      items.push(this.add.image(0, top + 34, TEX.light).setScale(1.1).setTint(d.color).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD));
      items.push(this.add.image(0, top + 34, TEX.iconBen).setScale(2.5));
    }
    items.push(pixelText(this, 0, top + 66, d.label, { scale: 3, originX: 0.5, originY: 0.5, color: d.color }));
    items.push(pixelText(this, 0, top + 86, d.tagline, { originX: 0.5, originY: 0.5, color: PALETTE.cream }));
    difficultyRows(d).forEach(([label, value], r) => {
      const y = top + 104 + r * 12;
      items.push(pixelText(this, -CARD_W / 2 + 14, y, label, { originY: 0.5, color: PALETTE.uiDim }));
      items.push(pixelText(this, CARD_W / 2 - 14, y, value, { originX: 1, originY: 0.5, color: PALETTE.white }));
    });

    const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (isLeaving(this)) return;
      if (this.focus === i) this.confirm();
      else this.setFocus(i);
    });
    items.push(zone);
    for (const it of items) if (it instanceof Phaser.GameObjects.BitmapText) boxed(it, -CARD_W / 2 + 3, -CARD_H / 2 + 2, CARD_W - 6, CARD_H - 4);
    const root = this.add.container(GAME_WIDTH / 2 + (i - 1) * GAP, CARD_Y, items);
    return { root, frame, id };
  }

  private setFocus(i: number): void {
    const next = Phaser.Math.Clamp(i, 0, this.cards.length - 1);
    if (next === this.focus) return;
    this.focus = next;
    playSfx('uiMove', 1, 0.9 + next * 0.1);
    this.refresh();
  }

  private refresh(instant = false): void {
    this.cards.forEach((card, i) => {
      const d = DIFFICULTY[card.id];
      const focused = i === this.focus;
      const g = card.frame;
      g.clear();
      drawPanel(g, 0, 0, CARD_W, CARD_H, { fill: focused ? PALETTE.uiPanel : PALETTE.ink, fillAlpha: 0.92, stroke: focused ? d.color : PALETTE.uiPanelLight, radius: 7, bevel: true });
      if (focused) g.lineStyle(1, d.color, 0.35).strokeRoundedRect(-CARD_W / 2 - 3.5, -CARD_H / 2 - 3.5, CARD_W + 7, CARD_H + 7, 9);
      const props = { y: CARD_Y - (focused ? MENU.focusLift : 0), alpha: focused ? 1 : 0.65 };
      this.tweens.killTweensOf(card.root);
      if (instant) card.root.setY(props.y).setAlpha(props.alpha);
      else this.tweens.add({ targets: card.root, ...props, duration: MENU.focusMs, ease: 'Back.easeOut' });
    });
    const d = DIFFICULTY[this.cards[this.focus].id];
    this.blurb.setText(d.blurb).setTint(d.color);
    this.start.setText(`START ON ${d.label}`).setColor(d.color);
    this.hint.setText(inputMode.current === 'touch' ? 'TAP A DIFFICULTY, THEN TAP IT AGAIN OR START' : '[LEFT]/[RIGHT] CHOOSE   [ENTER] START   [ESC] BACK');
  }

  /** Creates the file on the chosen difficulty and heads to Chapter Select. */
  private confirm(): void {
    if (isLeaving(this)) return;
    const id = this.cards[this.focus].id;
    saveSystem.createSlot(this.slot, id);
    ghostStore.clearSlot(this.slot);
    session.useSlot(this.slot);
    playSfx('uiConfirm');
    leaveTo(this, SCENES.chapterSelect, { newFile: true }, null);
  }

  private back(): void {
    if (isLeaving(this)) return;
    playSfx('uiBack');
    leaveTo(this, SCENES.fileSelect, undefined, null);
  }

  override update(time: number): void {
    this.backdrop.update();
    this.start.pulse(time);
    // Hard's red eye breathes, like the boss watching.
    this.hardGlow?.setAlpha(0.25 + Math.sin(time * 0.004) * 0.15);
  }
}
