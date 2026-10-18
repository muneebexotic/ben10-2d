import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { cardInfo, cardStats, type CardInfo } from '../levels/cards';
import { playSfx } from '../systems/audio/Sfx';
import { inputMode } from '../systems/InputMode';
import type { DrinkLook } from '../entities/props/Pickup';
import { TEX } from '../scenes/preload/assetKeys';
import { CH6_TEX } from '../scenes/preload/karachi/keys';
import { sumoCard } from './extras/cardArt';
import { pixelText } from './text';
import { COVER_W, COVER_X } from './view';

const CARD_W = 120;
const CARD_H = 160;
const CARD_X = 196;
const CARD_Y = 176;
const TEXT_X = 286;
/** Presses this soon after it opens never close it (a held attack button). */
const GRACE_MS = 650;
const STATS: ReadonlyArray<[keyof ReturnType<typeof cardStats>, string]> = [
  ['power', 'POWER'],
  ['weight', 'WEIGHT'],
  ['speed', 'SPEED'],
];

const DRINKS: Record<DrinkLook, { texture: string; name: string; line: string; color: number }> = {
  smoothy: { texture: TEX.smoothy, name: 'MR. SMOOTHY', line: 'A SMOOTHIE PUTS HEARTS BACK, AND TOPS UP YOUR ALIEN TOO.', color: 0xff8fc8 },
  chai: { texture: CH6_TEX.chai, name: 'CHAI', line: "KARACHI'S CHAI DOES WHAT A SMOOTHIE DOES: HEARTS BACK, ALIEN TOPPED UP.", color: 0xffc070 },
  juice: { texture: CH6_TEX.juice, name: 'TAAZA JUICE', line: 'FRESH JUICE, SAME DEAL: HEARTS BACK, ALIEN TOPPED UP.', color: 0xffa02a },
};

/**
 * The game stops for a find. A new Sumo Slammers card flips over in front of
 * the paused level, big: its name, number and story, and the stats on its back
 * (POWER, WEIGHT, SPEED) filling in pip by pip. The first drink of each kind
 * on a file gets a smaller version: what it is and what it does. Any key or
 * tap goes back to the game.
 */
export class CardReveal {
  private root: Phaser.GameObjects.Container | null = null;
  private openedAt = 0;
  private onClose: (() => void) | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    scene.input.keyboard?.on('keydown', () => this.press());
    scene.input.on('pointerdown', () => this.press());
  }

  get open(): boolean {
    return this.root !== null;
  }

  showCard(id: string, album: { found: number; total: number }, chapter: { found: number; total: number }, onClose: () => void): void {
    const info = cardInfo(id);
    if (!info) {
      onClose();
      return;
    }
    this.begin(onClose);
    const scene = this.scene;
    const items = this.root!;
    // The card flies in face down and flips over.
    const back = sumoCard(scene, 0, 0, CARD_W, CARD_H, info, false);
    const holder = scene.add.container(CARD_X, CARD_Y + 220, [back]).setAngle(-14);
    items.add(holder);
    const glow = scene.add.image(CARD_X, CARD_Y, TEX.light).setTint(info.holo ? PALETTE.gold : info.color).setScale(2.6).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    items.addAt(glow, 1);
    scene.tweens.add({ targets: holder, y: CARD_Y, angle: 0, duration: 260, ease: 'Back.easeOut' });
    scene.tweens.add({
      targets: holder,
      scaleX: 0,
      delay: 300,
      duration: 110,
      ease: 'Quad.In',
      onComplete: () => {
        back.destroy();
        holder.add(sumoCard(scene, 0, 0, CARD_W, CARD_H, info, true));
        playSfx('stamp', 0.7, 1.2);
        scene.tweens.add({ targets: holder, scaleX: 1, duration: 150, ease: 'Back.easeOut' });
        scene.tweens.add({ targets: glow, alpha: 0.55, duration: 200 });
        // A slow turn in the light, so the holo catches it.
        scene.tweens.add({ targets: holder, scaleX: 0.86, angle: 2, duration: 1400, delay: 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        this.writeCard(info, album, chapter);
      },
    });
    playSfx('card');
  }

  showDrink(look: DrinkLook, heal: number, onClose: () => void): void {
    this.begin(onClose);
    const scene = this.scene;
    const d = DRINKS[look];
    const items = this.root!;
    const glow = scene.add.image(GAME_WIDTH / 2, 150, TEX.light).setTint(d.color).setScale(2).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    const cup = scene.add.image(GAME_WIDTH / 2, 150, d.texture).setScale(0.5).setAlpha(0);
    scene.tweens.add({ targets: cup, scale: 5, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: cup, y: 144, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 260 });
    items.add([glow, cup]);
    items.add(pixelText(scene, GAME_WIDTH / 2, 70, 'FOUND A DRINK!', { scale: 2, originX: 0.5, originY: 0.5, color: d.color }));
    items.add(pixelText(scene, GAME_WIDTH / 2, 222, d.name, { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.white }));
    items.add(pixelText(scene, GAME_WIDTH / 2, 246, `+${heal} HEARTS`, { originX: 0.5, originY: 0.5, color: PALETTE.gold }));
    items.add(pixelText(scene, GAME_WIDTH / 2, 264, d.line, { originX: 0.5, originY: 0, color: PALETTE.cream, maxWidth: 360, align: 'center' }));
    this.prompt();
    playSfx('heal');
  }

  private begin(onClose: () => void): void {
    this.close(false);
    const scene = this.scene;
    this.onClose = onClose;
    this.openedAt = scene.time.now;
    const dim = scene.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, PALETTE.ink, 0).setOrigin(0, 0);
    scene.tweens.add({ targets: dim, fillAlpha: 0.82, duration: 160 });
    this.root = scene.add.container(0, 0, [dim]).setDepth(470);
  }

  private writeCard(info: CardInfo, album: { found: number; total: number }, chapter: { found: number; total: number }): void {
    const scene = this.scene;
    const root = this.root;
    if (!root) return;
    const add = (o: Phaser.GameObjects.GameObject, delay: number) => {
      root.add(o);
      const t = o as Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.GameObject;
      t.setAlpha(0);
      scene.tweens.add({ targets: o, alpha: 1, duration: 160, delay });
    };
    add(pixelText(scene, TEXT_X, 62, info.holo ? 'NEW HOLO CARD!' : 'NEW CARD!', { scale: 2, color: info.holo ? PALETTE.gold : PALETTE.omnitrix }), 0);
    add(pixelText(scene, TEXT_X, 88, info.name, { color: PALETTE.white, maxWidth: 300 }), 60);
    add(pixelText(scene, TEXT_X, 102, `#${String(info.number).padStart(3, '0')}  ${info.holo ? 'HOLO' : 'COMMON'}`, { color: PALETTE.uiDim }), 120);
    add(pixelText(scene, TEXT_X, 120, info.flavour, { color: PALETTE.cream, maxWidth: 300 }), 180);
    // The stats on the back, pip by pip.
    const stats = cardStats(info);
    STATS.forEach(([key, label], row) => {
      const y = 170 + row * 16;
      add(pixelText(scene, TEXT_X, y, label, { color: PALETTE.uiDim }), 260 + row * 80);
      for (let i = 0; i < 10; i++) {
        const on = i < stats[key];
        const pip = scene.add.rectangle(TEXT_X + 60 + i * 12, y + 4, 9, 7, on ? (stats[key] === 10 ? PALETTE.gold : info.color) : PALETTE.uiPanelLight).setOrigin(0, 0.5);
        if (on) pip.setStrokeStyle(1, PALETTE.white, 0.5);
        add(pip, 300 + row * 80 + i * 35);
        if (on && i === stats[key] - 1) scene.time.delayedCall(300 + row * 80 + i * 35, () => this.root && playSfx('tick', 0.35, 1.2 + row * 0.15));
      }
    });
    add(pixelText(scene, TEXT_X, 232, `ALBUM ${album.found} / ${album.total}`, { color: PALETTE.gold }), 600);
    add(pixelText(scene, TEXT_X + 130, 232, `THIS CHAPTER ${chapter.found} / ${chapter.total}`, { color: PALETTE.uiDim }), 640);
    this.prompt();
  }

  private prompt(): void {
    const root = this.root;
    if (!root) return;
    const label = inputMode.current === 'touch' ? 'TAP: BACK TO IT' : 'ANY KEY: BACK TO IT';
    const t = pixelText(this.scene, GAME_WIDTH / 2, 326, label, { originX: 0.5, originY: 0.5, color: PALETTE.white }).setAlpha(0);
    root.add(t);
    this.scene.tweens.add({ targets: t, alpha: 1, delay: GRACE_MS, duration: 200, onComplete: () => this.scene.tweens.add({ targets: t, alpha: 0.4, yoyo: true, repeat: -1, duration: 700 }) });
  }

  private press(): void {
    if (!this.root || this.scene.time.now - this.openedAt < GRACE_MS) return;
    playSfx('uiConfirm', 0.6);
    this.close(true);
  }

  /** Closes it (`resume`: hands the game back). */
  close(resume: boolean): void {
    const root = this.root;
    if (!root) return;
    this.root = null;
    const done = this.onClose;
    this.onClose = null;
    this.scene.tweens.killTweensOf(root.list);
    root.destroy();
    if (resume) done?.();
  }
}
