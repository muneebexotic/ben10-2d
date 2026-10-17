import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { GWEN, SPELL_ORDER, type SpellId } from '../config/gwen';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import { SPELL_INFO } from '../scenes/level/family/gwenLines';
import { inputMode } from '../systems/InputMode';
import { touchControlsOn } from '../systems/Settings';
import { BakedGraphics } from './BakedGraphics';
import { pixelText } from './text';

const ICON: Record<SpellId, string> = { shield: TEX.spellShield, stun: TEX.spellStun, reveal: TEX.spellReveal };
/** Keyboard hint under each slot (touch players use the GWEN button's own picker). */
const KEYS: Record<SpellId, string> = { shield: 'G', stun: 'UP+G', reveal: 'DN+G' };
const ROW_Y = GAME_HEIGHT - 28;
const SPACING = 30;
const CARD_MS = 4200;
/** Under the dialogue box, so a story line and the card read together. */
const CARD_Y = 128;

interface Slot {
  id: SpellId;
  root: Phaser.GameObjects.Container;
  shade: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  ready: boolean;
}

/**
 * Gwen's spells on the HUD (keyboard): her icon and a slot per learned spell
 * along the bottom-left corner, each darkening from the top while it
 * recharges and popping when it's ready. With touch controls the GWEN button
 * shows the same thing, so the row hides. Also the card that announces a
 * newly learned spell and how to cast it.
 */
export class GwenHud {
  private readonly root: Phaser.GameObjects.Container;
  private readonly slots: Slot[] = [];
  private readonly face: Phaser.GameObjects.Image;
  private present = false;
  private known: readonly SpellId[] = [];
  private shown = true;
  private card: Phaser.GameObjects.Container | null = null;
  private cardMs = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(250).setVisible(false);
    this.face = scene.add.image(12, ROW_Y, TEX.gwenIcon);
    this.root.add(this.face);
    for (const id of SPELL_ORDER) this.slots.push(this.makeSlot(id));
  }

  private makeSlot(id: SpellId): Slot {
    const s = this.scene;
    const ring = new BakedGraphics(s, -10, -10, 20, 20).draw((g) => {
      g.fillStyle(PALETTE.ink, 0.75);
      g.fillRect(-10, -10, 20, 20);
      g.lineStyle(1, GWEN.spells[id].color, 1);
      g.strokeRect(-9.5, -9.5, 19, 19);
    });
    const icon = s.add.image(0, 0, ICON[id]).setTint(GWEN.spells[id].color);
    // Recharge shade: a dark block anchored at the bottom whose height is the time left.
    const shade = s.add.rectangle(-8, 8, 16, 16, PALETTE.ink, 0.72).setOrigin(0, 1);
    const key = pixelText(s, 0, 12, KEYS[id], { color: PALETTE.cream, originX: 0.5 });
    const root = s.add.container(0, ROW_Y, [ring.image, icon, shade, key]).setVisible(false);
    this.root.add(root);
    return { id, root, shade, icon, ready: true };
  }

  setLeft(left: number): void {
    this.root.setX(left);
  }

  setVisible(visible: boolean): void {
    this.shown = visible;
    this.refresh();
  }

  setState(present: boolean, known: readonly SpellId[], charge: readonly number[]): void {
    if (known.length !== this.known.length) {
      this.known = known.slice();
      this.layout();
    }
    this.present = present;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot.root.visible) continue;
      const c = charge[i] ?? 1;
      slot.shade.setScale(1, 1 - c);
      const ready = c >= 1;
      if (ready && !slot.ready) this.pop(slot.root, 1.25);
      slot.ready = ready;
      slot.icon.setAlpha(ready ? 1 : 0.6);
    }
    this.refresh();
  }

  cast(spell: SpellId): void {
    const slot = this.slots.find((s) => s.id === spell);
    if (slot?.root.visible) this.pop(slot.root, 1.4);
    this.pop(this.face, 1.3);
  }

  /** The card for a newly learned spell: its icon, its name, how to cast it and what it does. */
  learned(spell: SpellId): void {
    this.card?.destroy();
    const s = this.scene;
    const info = SPELL_INFO[spell];
    const touch = touchControlsOn();
    const how = touch ? `HOLD {G}, SLIDE TO ${info.name}` : info.how;
    const W = 236;
    const H = 52;
    const bg = new BakedGraphics(s, -W / 2, -H / 2, W, H).draw((g) => {
      g.fillStyle(PALETTE.ink, 0.92);
      g.fillRect(-W / 2, -H / 2, W, H);
      g.lineStyle(1, GWEN.spells[spell].color, 1);
      g.strokeRect(-W / 2 + 0.5, -H / 2 + 0.5, W - 1, H - 1);
    });
    const icon = s.add.image(-W / 2 + 22, 0, ICON[spell]).setScale(2).setTint(GWEN.spells[spell].color);
    const title = pixelText(s, -W / 2 + 42, -H / 2 + 7, `GWEN LEARNED ${info.name}!`, { color: GWEN.spells[spell].color });
    const howText = pixelText(s, -W / 2 + 42, -H / 2 + 20, inputMode.format(how), { color: PALETTE.white });
    const does = pixelText(s, -W / 2 + 42, -H / 2 + 33, info.does, { color: PALETTE.cream, maxWidth: W - 50 });
    this.card = s.add.container(this.cardX(), CARD_Y - 6, [bg.image, icon, title, howText, does]).setDepth(260).setAlpha(0);
    s.tweens.add({ targets: this.card, alpha: 1, y: CARD_Y, duration: 200, ease: 'Back.Out' });
    this.cardMs = CARD_MS;
  }

  /** The HUD is laid out on the 640 frame, so its middle is the screen's on any width. */
  private cardX(): number {
    return GAME_WIDTH / 2;
  }

  update(delta: number): void {
    if (!this.card) return;
    this.cardMs -= delta;
    if (this.cardMs > 0) return;
    const card = this.card;
    this.card = null;
    this.scene.tweens.add({ targets: card, alpha: 0, y: card.y - 8, duration: 260, onComplete: () => card.destroy() });
  }

  private layout(): void {
    let i = 0;
    for (const slot of this.slots) {
      const on = this.known.includes(slot.id);
      slot.root.setVisible(on);
      if (on) slot.root.setX(36 + i++ * SPACING);
    }
  }

  /** Shows or hides the row for the current controls (touch players see the GWEN button instead). */
  refresh(): void {
    // Touch players see the same on the GWEN button.
    const on = this.shown && this.known.length > 0 && !touchControlsOn();
    this.root.setVisible(on);
    this.root.setAlpha(this.present ? 1 : 0.4);
  }

  private pop(target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject, scale: number): void {
    this.scene.tweens.killTweensOf(target);
    (target as unknown as Phaser.GameObjects.Image).setScale(scale);
    this.scene.tweens.add({ targets: target, scale: 1, duration: 220, ease: 'Quad.Out' });
  }
}
