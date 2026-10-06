import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { audio } from '../systems/audio/AudioEngine';
import type { RunStats } from '../systems/RunStats';
import { bindMuteKey, toggleMute } from '../systems/Settings';
import { MenuList, type MenuItem } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X, frameView } from '../ui/view';
import { SCENES } from './SceneKeys';
import { inputMode } from '../systems/InputMode';
import { EventBus } from '../systems/EventBus';
import { trainingOptions, TRAINING_ENEMIES } from '../systems/TrainingState';
import { getAlien, hasAlien } from '../aliens/registry';
import type { FormDefinition } from '../aliens/types';
import { playSfx } from '../systems/audio/Sfx';
import type { LevelStartData } from './LevelScene';
import { TRAINING } from '../config/training';
import { session } from '../systems/Session';
import { getDifficulty } from '../config/difficulty';
import { leaveTo, resetLeaving } from '../ui/menu/transition';

export interface PauseData {
  checkpoint: string | null;
  stats: RunStats;
  /** Training shows the sandbox menu and every alien's moves. */
  training?: boolean;
  /** Aliens on the dial (Training move list). */
  aliens?: readonly string[];
  levelId?: string;
}

const TOUCH_CONTROLS = [
  ['MOVE', 'LEFT STICK'],
  ['AIM FIRE UP', 'STICK UP'],
  ['DROP THROUGH', 'STICK DOWN + JUMP'],
  ['JUMP', 'JUMP'],
  ['ATTACK', 'ATTACK'],
  ['SPECIAL', 'SPECIAL (HOLD)'],
  ['TRANSFORM', 'TAP OMNITRIX'],
  ['OMNITRIX DIAL', 'SWIPE OMNITRIX'],
  ['PAUSE', 'II  (TOP)'],
];

const CONTROLS = [
  ['MOVE', 'A/D  ARROWS'],
  ['JUMP', 'SPACE  W  UP'],
  ['DROP THROUGH', 'DOWN + JUMP'],
  ['ATTACK', 'J  (X)'],
  ['SPECIAL', 'K  (C)'],
  ['AIM FIRE UP', 'HOLD UP'],
  ['OMNITRIX DIAL', 'Q / E'],
  ['TRANSFORM', 'T'],
  ['MUTE', 'M'],
];

const onOff = (on: boolean) => (on ? 'ON' : 'OFF');

function misfireLabel(step: number): string {
  const chance = TRAINING.misfireSteps[step] ?? 0;
  if (chance <= 0) return 'OFF';
  if (chance >= 1) return 'CHAOS (100%)';
  return `${Math.round(chance * 100)}%`;
}

export class PauseScene extends Phaser.Scene {
  private menu!: MenuList;
  private info!: PauseData;
  private hint: Phaser.GameObjects.BitmapText | null = null;
  private difficultyLabel: Phaser.GameObjects.BitmapText | null = null;
  private spawnIndex = 0;

  constructor() {
    super(SCENES.pause);
  }

  create(data: PauseData): void {
    this.info = data;
    this.hint = null;
    this.difficultyLabel = null;
    resetLeaving(this);
    this.scene.bringToTop();
    frameView(this);
    this.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, 0x05070f, 0.8).setOrigin(0, 0);
    if (data.training) this.buildTraining();
    else this.buildStory();

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => this.resume());
    kb.on('keydown-P', () => this.resume());
    bindMuteKey(this);
    audio.musicBus?.gain.setTargetAtTime(0.1, audio.now, 0.05);
  }

  private buildStory(): void {
    const touch = inputMode.current === 'touch';
    pixelText(this, GAME_WIDTH / 2, 50, 'PAUSED', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });
    const slot = session.slot;
    const d = getDifficulty(session.difficulty);
    const file = pixelText(this, GAME_WIDTH / 2 - 3, 76, slot === null ? 'NO SAVE FILE  -' : `FILE ${slot + 1}  -`, { originX: 1, originY: 0.5, color: PALETTE.uiDim });
    this.difficultyLabel = pixelText(this, file.x + 6, 76, d.label, { originY: 0.5, color: d.color });

    this.menu = new MenuList(this, touch ? 150 : 170, touch ? 118 : 130, [
      { label: 'RESUME', action: () => this.resume() },
      { label: 'RESTART CHECKPOINT', action: () => this.restart() },
      { label: 'SETTINGS', action: () => this.openSettings() },
      { label: () => (audio.muted ? 'SOUND: OFF' : 'SOUND: ON'), action: () => toggleMute() },
      { label: slot === null ? 'QUIT TO TITLE' : 'SAVE & QUIT', action: () => this.quit() },
    ], touch ? { spacing: 30, scale: 2, rowWidth: 250 } : 20);

    pixelText(this, 405, 108, 'CONTROLS', { originX: 0.5, color: PALETTE.gold });
    (touch ? TOUCH_CONTROLS : CONTROLS).forEach(([action, keys], i) => {
      pixelText(this, 300, 124 + i * 13, action, { color: PALETTE.uiDim });
      pixelText(this, 510, 124 + i * 13, keys, { originX: 1, color: PALETTE.white });
    });
    pixelText(this, GAME_WIDTH / 2, 272, 'TIP: TRANSFORMING KNOCKS NEARBY ENEMIES AWAY. USE IT TO ESCAPE!', { originX: 0.5, color: PALETTE.uiDim });
    if (slot !== null) pixelText(this, GAME_WIDTH / 2, 286, 'SAVE & QUIT KEEPS YOUR RUN AT THE LAST CHECKPOINT. CONTINUE PICKS IT UP.', { originX: 0.5, color: PALETTE.uiDim });
    // Settings can change the difficulty: keep the label honest when it comes back.
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      const now = getDifficulty(session.difficulty);
      this.difficultyLabel?.setText(now.label).setTint(now.color);
    });
  }

  /** Sandbox menu on the left, every alien's moves on the right. */
  private buildTraining(): void {
    const touch = inputMode.current === 'touch';
    pixelText(this, GAME_WIDTH / 2, 30, 'OMNITRIX TRAINING', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });

    const enemy = () => TRAINING_ENEMIES[this.spawnIndex];
    const setOption = (patch: Partial<typeof trainingOptions>) => {
      Object.assign(trainingOptions, patch);
      EventBus.emit('training:options', { ...trainingOptions });
    };
    const items: MenuItem[] = [
      { label: 'RESUME', action: () => this.resume() },
      {
        label: () => `SPAWN ${enemy().label}`,
        hint: enemy().hint,
        action: () => {
          EventBus.emit('training:spawn', { kind: enemy().kind });
          this.showHint(`${enemy().label} INCOMING!  ${enemy().hint}`, PALETTE.omnitrixGlow);
        },
        adjust: (dir) => {
          this.spawnIndex = (this.spawnIndex + dir + TRAINING_ENEMIES.length) % TRAINING_ENEMIES.length;
          this.showHint(enemy().hint);
        },
      },
      {
        label: 'CLEAR ENEMIES',
        action: () => {
          EventBus.emit('training:clear');
          this.showHint('SIMULATION CLEARED.');
        },
      },
      {
        label: () => `ALIEN TIMER: ${onOff(trainingOptions.alienTimer)}`,
        hint: 'OFF: STAY TRANSFORMED AS LONG AS YOU LIKE, NO RECHARGE.',
        action: () => setOption({ alienTimer: !trainingOptions.alienTimer }),
        adjust: () => setOption({ alienTimer: !trainingOptions.alienTimer }),
      },
      {
        label: () => `ENEMIES: ${trainingOptions.enemiesAttack ? 'ATTACK' : 'PASSIVE'}`,
        hint: 'PASSIVE ENEMIES NEVER FIGHT BACK: PRACTICE YOUR COMBOS.',
        action: () => setOption({ enemiesAttack: !trainingOptions.enemiesAttack }),
        adjust: () => setOption({ enemiesAttack: !trainingOptions.enemiesAttack }),
      },
      {
        label: () => `MISFIRES: ${misfireLabel(trainingOptions.misfireStep)}`,
        hint: 'MAKE THE OMNITRIX GLITCH: PRACTICE ROLLING WITH THE WRONG ALIEN.',
        action: () => setOption({ misfireStep: (trainingOptions.misfireStep + 1) % TRAINING.misfireSteps.length }),
        adjust: (dir) => setOption({ misfireStep: (trainingOptions.misfireStep + dir + TRAINING.misfireSteps.length) % TRAINING.misfireSteps.length }),
      },
      {
        label: () => `DAMAGE NUMBERS: ${onOff(trainingOptions.damageNumbers)}`,
        action: () => setOption({ damageNumbers: !trainingOptions.damageNumbers }),
        adjust: () => setOption({ damageNumbers: !trainingOptions.damageNumbers }),
      },
      { label: 'SETTINGS', action: () => this.openSettings() },
      { label: 'QUIT TO TITLE', action: () => this.quit() },
    ];
    this.menu = new MenuList(this, touch ? 150 : 160, touch ? 72 : 80, items, {
      spacing: touch ? 30 : 22,
      scale: touch ? 2 : 1,
      rowWidth: touch ? 270 : 230,
      onSelect: (i, item) => this.showHint(i === 1 ? enemy().hint : (item.hint ?? '')),
    });

    this.drawMoves(318, 70, GAME_HEIGHT - 32);
    this.hint = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 22, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.showHint(items[this.menu.selectedIndex].hint ?? '');
  }

  /**
   * Every alien on the dial with its moves, plus how to swap, above `bottom`. When they don't all fit (six
   * aliens didn't), they come a page at a time: the dial keys or a tap on the list turn the page.
   */
  private drawMoves(x: number, y: number, bottom: number): void {
    const touch = inputMode.current === 'touch';
    pixelText(this, x, y, 'ALIEN MOVES', { color: PALETTE.gold });
    const top = y + 14;
    const footerY = bottom - 20;
    const heightOf = (a: FormDefinition) => 11 + a.moves.length * 10 + 4;
    const pages: FormDefinition[][] = [];
    let used = Infinity;
    for (const id of this.info.aliens ?? []) {
      if (!hasAlien(id)) continue;
      const alien = getAlien(id);
      if (used + heightOf(alien) > footerY - top) {
        pages.push([]);
        used = 0;
      }
      pages[pages.length - 1].push(alien);
      used += heightOf(alien);
    }
    const list = this.add.container(0, 0);
    const pageLabel = pixelText(this, GAME_WIDTH - 10, y, '', { originX: 1, color: PALETTE.uiDim });
    let page = 0;
    const show = (i: number) => {
      page = (i + pages.length) % pages.length;
      list.removeAll(true);
      let row = top;
      for (const alien of pages[page] ?? []) {
        list.add(pixelText(this, x, row, alien.name, { color: alien.theme.color }));
        row += 11;
        for (const move of alien.moves) {
          list.add(pixelText(this, x + 6, row, inputMode.format(move), { color: PALETTE.white }));
          row += 10;
        }
        row += 4;
      }
      if (pages.length > 1) pageLabel.setText(`${page + 1}/${pages.length}  ${touch ? 'TAP FOR MORE' : inputMode.format('{DIAL} MORE')}`);
    };
    show(0);
    if (pages.length > 1) {
      const flip = (dir: number) => {
        show(page + dir);
        playSfx('uiMove', 0.6, 1.1);
      };
      this.input.keyboard?.on('keydown-Q', () => flip(-1));
      this.input.keyboard?.on('keydown-E', () => flip(1));
      this.add.zone(x - 6, top - 4, GAME_WIDTH - x, footerY - top + 4).setOrigin(0, 0).setInteractive().on('pointerup', () => flip(1));
    }
    pixelText(this, x, footerY, inputMode.format('{DIAL} PICK, {T} TRANSFORM.'), { color: PALETTE.omnitrix });
    pixelText(this, x, footerY + 10, inputMode.format('{T} WHILE TRANSFORMED: SWAP (-3S)'), { color: PALETTE.omnitrix });
  }

  private showHint(text: string, color: number = PALETTE.uiDim): void {
    this.hint?.setText(inputMode.format(text)).setTint(color);
  }

  private openSettings(): void {
    this.scene.launch(SCENES.settings, { returnTo: SCENES.pause });
    this.scene.pause();
  }

  private resume(): void {
    audio.musicBus?.gain.setTargetAtTime(0.32, audio.now, 0.05);
    this.scene.resume(SCENES.level);
    this.scene.stop();
  }

  private restart(): void {
    audio.musicBus?.gain.setTargetAtTime(0.32, audio.now, 0.05);
    const start: LevelStartData = { levelId: this.info.levelId, checkpoint: this.info.checkpoint, stats: this.info.stats };
    this.scene.start(SCENES.level, start);
  }

  /** Story: the run is saved at the last checkpoint and it's back to Chapter Select. Training: the title. */
  private quit(): void {
    audio.musicBus?.gain.setTargetAtTime(0.32, audio.now, 0.05);
    if (!this.info.training) EventBus.emit('level:quit');
    this.scene.stop(SCENES.level);
    this.scene.stop(SCENES.ui);
    this.scene.stop(SCENES.touch);
    const toChapters = !this.info.training && session.slot !== null;
    leaveTo(this, toChapters ? SCENES.chapterSelect : SCENES.menu, undefined, 'uiBack');
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
