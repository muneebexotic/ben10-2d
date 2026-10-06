import Phaser from 'phaser';
import { ACCESSIBILITY } from '../config/accessibility';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { a11y, flashCamera, prefersReducedMotion, shakeCamera } from '../systems/Accessibility';
import { audio } from '../systems/audio/AudioEngine';
import type { TouchMode } from '../systems/SaveSystem';
import { bindMuteKey, getSettings, toggleMute, updateSettings } from '../systems/Settings';
import { MenuList, type MenuItem } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X, frameView } from '../ui/view';
import { SCENES } from './SceneKeys';
import { DIFFICULTY_IDS, getDifficulty } from '../config/difficulty';
import { session } from '../systems/Session';
import { difficultyRows } from '../ui/menu/difficultyInfo';
import { playSfx } from '../systems/audio/Sfx';
import { inputMode } from '../systems/InputMode';

export interface SettingsData {
  /** Scene to resume when the player backs out (title or pause). */
  returnTo: string;
  /** The save file whose difficulty the DIFFICULTY row changes (default: the one being played). */
  slot?: number | null;
}

const TOUCH_MODES: TouchMode[] = ['auto', 'on', 'off'];
const SEGMENTS = 10;

/** Options overlay reachable from the title and pause menus. Every change is saved immediately. */
export class SettingsScene extends Phaser.Scene {
  private menu!: MenuList;
  private returnTo: string = SCENES.menu;
  private hint!: Phaser.GameObjects.BitmapText;
  private bar!: Phaser.GameObjects.Graphics;
  private shakeRow = -1;
  private details: Phaser.GameObjects.BitmapText | null = null;
  private slot: number | null = null;

  constructor() {
    super(SCENES.settings);
  }

  create(data: SettingsData): void {
    this.returnTo = data.returnTo ?? SCENES.menu;
    this.slot = data.slot ?? session.slot;
    this.scene.bringToTop();
    frameView(this);
    this.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, 0x05070f, 0.95).setOrigin(0, 0);
    pixelText(this, GAME_WIDTH / 2, 40, 'SETTINGS', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });

    const items: MenuItem[] = [];
    // Difficulty belongs to the save file, so it only shows once a file is being played.
    const slot = this.slot;
    const withDifficulty = slot !== null;
    if (slot !== null) {
      // Outside a file (the title), name the file it changes.
      const prefix = slot === session.slot ? 'DIFFICULTY' : `FILE ${slot + 1} DIFFICULTY`;
      items.push({
        label: () => `${prefix}: ${getDifficulty(session.difficultyOf(slot)).label}`,
        action: () => this.cycleDifficulty(1),
        adjust: (dir) => this.cycleDifficulty(dir),
        hint: 'APPLIES RIGHT AWAY. CHECKPOINTS CHANGE ON THE NEXT RESTART. A RUN THAT CHANGES IT ISN\'T TIMED.',
      });
    }
    items.push(
      {
        label: () => `REDUCE FLASHING: ${a11y.reduceFlashing ? 'ON' : 'OFF'}`,
        action: () => this.setFlashing(!a11y.reduceFlashing),
        adjust: () => this.setFlashing(!a11y.reduceFlashing),
        hint: 'SOFTENS SCREEN FLASHES AND SLOWS EVERY BLINKING LIGHT.',
      },
      {
        label: () => `SCREEN SHAKE ${Math.round(a11y.shake * 100)}%`,
        action: () => this.setShake(a11y.shake >= 0.999 ? 0 : a11y.shake + ACCESSIBILITY.shakeStep),
        adjust: (dir) => this.setShake(a11y.shake + dir * ACCESSIBILITY.shakeStep),
        hint: 'CAMERA SHAKE AND SCREEN WARPS ON HITS, SLAMS AND EXPLOSIONS.',
      },
      {
        label: () => (audio.muted ? 'SOUND: OFF' : 'SOUND: ON'),
        action: () => toggleMute(),
        adjust: () => toggleMute(),
        hint: inputMode.current === 'touch' ? 'MUTE EVERYTHING.' : 'MUTE EVERYTHING. [M] ALSO WORKS ANYWHERE.',
      },
      {
        label: () => `TOUCH CONTROLS: ${getSettings().touchControls.toUpperCase()}`,
        action: () => this.cycleTouch(1),
        adjust: (dir) => this.cycleTouch(dir),
        hint: 'AUTO SHOWS THEM ON TOUCH SCREENS AND HIDES THEM WHEN YOU TYPE.',
      },
      {
        label: () => `GHOST: ${getSettings().ghost ? 'ON' : 'OFF'}`,
        action: () => this.toggleGhost(),
        adjust: () => this.toggleGhost(),
        hint: 'RACE A SEE-THROUGH REPLAY OF YOUR BEST RUN ON EVERY TIMED RUN.',
      },
    );
    if (this.scale.fullscreen.available) {
      items.push({
        label: () => (this.scale.isFullscreen ? 'FULLSCREEN: ON' : 'FULLSCREEN: OFF'),
        action: () => this.toggleFullscreen(),
        hint: 'HIDES THE BROWSER BARS. GREAT ON PHONES.',
      });
    }
    items.push({ label: 'BACK', action: () => this.back(), hint: '' });
    this.shakeRow = withDifficulty ? 2 : 1;

    this.hint = pixelText(this, GAME_WIDTH / 2, 300, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim, maxWidth: 560, align: 'center' });
    this.details = withDifficulty ? pixelText(this, GAME_WIDTH / 2, 280, '', { originX: 0.5, originY: 0.5, color: PALETTE.cream }) : null;
    this.bar = this.add.graphics();
    const spacing = items.length > 6 ? 25 : 28;
    this.menu = new MenuList(this, GAME_WIDTH / 2, items.length > 6 ? 82 : 92, items, {
      spacing,
      scale: 2,
      rowWidth: 440,
      onSelect: (i, item) => {
        this.hint.setText(item.hint ?? '');
        this.details?.setVisible(withDifficulty && i === 0);
      },
    });
    this.refreshDifficulty();

    if (prefersReducedMotion() && getSettings().reduceFlashing === null) {
      pixelText(this, GAME_WIDTH / 2, 318, 'YOUR DEVICE ASKS FOR REDUCED MOTION, SO THESE START TURNED DOWN.', {
        originX: 0.5,
        originY: 0.5,
        color: PALETTE.gold,
      });
    }
    const back = pixelText(this, GAME_WIDTH / 2, 342, inputMode.current === 'touch' ? 'BACK' : '[ESC] BACK', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    back.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.back());

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => this.back());
    kb.on('keydown-P', () => this.back());
    bindMuteKey(this);
    this.events.on(Phaser.Scenes.Events.UPDATE, () => this.drawBar());
  }

  private toggleGhost(): void {
    updateSettings({ ghost: !getSettings().ghost });
    playSfx('uiConfirm', 0.6);
  }

  /** Changes the file's difficulty and spells out what that means. */
  private cycleDifficulty(dir: 1 | -1): void {
    if (this.slot === null) return;
    const i = DIFFICULTY_IDS.indexOf(session.difficultyOf(this.slot));
    const next = DIFFICULTY_IDS[(i + dir + DIFFICULTY_IDS.length) % DIFFICULTY_IDS.length];
    session.setDifficultyOf(this.slot, next);
    playSfx('uiConfirm', 0.6);
    this.refreshDifficulty();
  }

  private refreshDifficulty(): void {
    if (!this.details || this.slot === null) return;
    const d = getDifficulty(session.difficultyOf(this.slot));
    this.details.setText(difficultyRows(d).map(([label, value]) => `${label} ${value}`).join('   ')).setTint(d.color);
  }

  private setFlashing(on: boolean): void {
    updateSettings({ reduceFlashing: on });
    // Preview: the same flash the game uses, at the new strength.
    flashCamera(this.cameras.main, 240, 120, 255, 110);
  }

  private setShake(value: number): void {
    const v = Math.round(Math.min(1, Math.max(0, value)) * 10) / 10;
    updateSettings({ shake: v });
    shakeCamera(this.cameras.main, 260, 0.012);
  }

  private cycleTouch(dir: 1 | -1): void {
    const i = TOUCH_MODES.indexOf(getSettings().touchControls);
    updateSettings({ touchControls: TOUCH_MODES[(i + dir + TOUCH_MODES.length) % TOUCH_MODES.length] });
  }

  private toggleFullscreen(): void {
    // Browsers only allow fullscreen from a key press or the *end* of a tap.
    const pointer = this.input.activePointer;
    const go = () => {
      try {
        this.scale.toggleFullscreen();
      } catch {
        // Not allowed here; the setting simply stays off.
      }
      this.time.delayedCall(250, () => this.menu.refresh());
    };
    if (pointer.isDown) this.input.once('pointerup', go);
    else go();
  }

  private back(): void {
    if (!this.scene.isActive()) return;
    this.scene.resume(this.returnTo);
    this.scene.stop();
  }

  private drawBar(): void {
    const g = this.bar;
    g.clear();
    if (this.shakeRow < 0) return;
    const text = this.menu.rowText(this.shakeRow);
    const x0 = Math.round(text.x + text.width / 2 + 8);
    const y0 = Math.round(text.y - 4);
    const filled = Math.round(a11y.shake * SEGMENTS);
    for (let i = 0; i < SEGMENTS; i++) {
      g.fillStyle(PALETTE.ink, 1);
      g.fillRect(x0 + i * 6 - 1, y0 - 1, 6, 10);
      g.fillStyle(i < filled ? PALETTE.omnitrix : PALETTE.uiPanelLight, 1);
      g.fillRect(x0 + i * 6, y0, 4, 8);
    }
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
