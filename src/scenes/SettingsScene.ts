import Phaser from 'phaser';
import { ACCESSIBILITY } from '../config/accessibility';
import { AUDIO } from '../config/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { a11y, flashCamera, prefersReducedMotion, shakeCamera } from '../systems/Accessibility';
import { audio } from '../systems/audio/AudioEngine';
import type { TouchMode } from '../systems/SaveSystem';
import { getSettings, toggleMute, updateSettings } from '../systems/Settings';
import { MenuList, type MenuItem } from '../ui/MenuList';
import { BakedGraphics } from '../ui/BakedGraphics';
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

const percent = (v: number) => `${Math.round(v * 100)}%`;
/** Enter (or a tap) on a slider steps it up, wrapping from full back to off. */
const cycleUp = (v: number) => (v >= 0.999 ? 0 : v + AUDIO.volumeStep);

/** Options overlay reachable from the title and pause menus. Every change is saved immediately. */
export class SettingsScene extends Phaser.Scene {
  private menu!: MenuList;
  private returnTo: string = SCENES.menu;
  private hint!: Phaser.GameObjects.BitmapText;
  /** Rows drawn with a level bar beside them (screen shake, music, effects), the level each shows, and what its bar last drew. */
  private sliders: Array<{ row: number; level: () => number; bar: BakedGraphics; drawn: number }> = [];
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
        label: () => (audio.muted ? 'MUSIC: MUTED' : `MUSIC ${percent(getSettings().music)}`),
        action: () => this.setVolume('music', cycleUp(getSettings().music)),
        adjust: (dir) => this.setVolume('music', getSettings().music + dir * AUDIO.volumeStep),
        hint: this.soundHint(),
      },
      {
        label: () => (audio.muted ? 'EFFECTS: MUTED' : `EFFECTS ${percent(getSettings().sfx)}`),
        action: () => this.setVolume('sfx', cycleUp(getSettings().sfx)),
        adjust: (dir) => this.setVolume('sfx', getSettings().sfx + dir * AUDIO.volumeStep),
        hint: this.soundHint(),
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
      {
        label: () => `GWEN IN CHAPTERS 1-5: ${getSettings().gwenInReplays ? 'ON' : 'OFF'}`,
        action: () => this.toggleGwen(),
        adjust: () => this.toggleGwen(),
        hint: 'ONCE GWEN LEARNS SPELLS IN CHAPTER 6, SHE AND HER SPELLS JOIN YOUR REPLAYS. FROM THE NEXT START.',
      },
      {
        label: () => `NEW FINDS: ${getSettings().finds ? 'SHOW' : 'QUICK'}`,
        action: () => this.toggleFinds(),
        adjust: () => this.toggleFinds(),
        hint: 'SHOW: A NEW CARD OR YOUR FIRST DRINK STOPS THE GAME TO SHOW ITSELF. QUICK: A BANNER, NO STOP (SPEEDRUNS).',
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
    const first = withDifficulty ? 2 : 1;
    const levels = [() => a11y.shake, () => (audio.muted ? 0 : getSettings().music), () => (audio.muted ? 0 : getSettings().sfx)];
    this.sliders = levels.map((level, i) => ({ row: first + i, level, bar: new BakedGraphics(this, -1, -1, SEGMENTS * 6, 10), drawn: -1 }));

    this.hint = pixelText(this, GAME_WIDTH / 2, 300, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim, maxWidth: 560, align: 'center' });
    this.details = withDifficulty ? pixelText(this, GAME_WIDTH / 2, 280, '', { originX: 0.5, originY: 0.5, color: PALETTE.cream }) : null;
    const spacing = items.length > 10 ? 20 : items.length > 9 ? 21 : items.length > 8 ? 23 : items.length > 6 ? 25 : 28;
    const top = items.length > 10 ? 64 : items.length > 9 ? 70 : items.length > 8 ? 76 : items.length > 6 ? 82 : 92;
    this.menu = new MenuList(this, GAME_WIDTH / 2, top, items, {
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
    kb.on('keydown-ESC', (e: KeyboardEvent) => !e.repeat && this.back());
    kb.on('keydown-P', (e: KeyboardEvent) => !e.repeat && this.back());
    // M mutes here too; the MUSIC and EFFECTS rows say so.
    kb.on('keydown-M', (e: KeyboardEvent) => {
      if (e.repeat) return;
      toggleMute();
      this.menu.refresh();
    });
  }

  private soundHint(): string {
    return inputMode.current === 'touch' ? 'CHANGING EITHER ONE TURNS SOUND BACK ON IF IT WAS MUTED.' : 'CHANGING EITHER ONE TURNS SOUND BACK ON IF IT WAS MUTED. [M] MUTES ANYWHERE.';
  }

  /** A volume change is heard at once, and turns the sound back on if it was muted (or nobody hears the change). */
  private setVolume(which: 'music' | 'sfx', value: number): void {
    const v = Math.round(Math.min(1, Math.max(0, value)) * 10) / 10;
    updateSettings(which === 'music' ? { music: v } : { sfx: v });
    if (audio.muted) toggleMute();
    if (which === 'sfx') playSfx('uiConfirm', 0.8);
  }

  private toggleFinds(): void {
    updateSettings({ finds: !getSettings().finds });
    playSfx('uiConfirm', 0.6);
  }

  private toggleGwen(): void {
    updateSettings({ gwenInReplays: !getSettings().gwenInReplays });
    playSfx('uiConfirm', 0.6);
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

  /** The level bars beside the slider rows: each follows its row's text and redraws only when its level changes. */
  private drawBars(): void {
    for (const s of this.sliders) {
      const text = this.menu.rowText(s.row);
      s.bar.image.setPosition(Math.round(text.x + text.width / 2 + 8), Math.round(text.y - 4));
      const filled = Math.round(s.level() * SEGMENTS);
      if (filled === s.drawn) continue;
      s.drawn = filled;
      s.bar.draw((g) => {
        for (let i = 0; i < SEGMENTS; i++) {
          g.fillStyle(PALETTE.ink, 1);
          g.fillRect(i * 6 - 1, -1, 6, 10);
          g.fillStyle(i < filled ? PALETTE.omnitrix : PALETTE.uiPanelLight, 1);
          g.fillRect(i * 6, 0, 4, 8);
        }
      });
    }
  }

  override update(time: number): void {
    this.menu.update(time);
    this.drawBars();
  }
}
