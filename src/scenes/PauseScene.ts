import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { audio } from '../systems/audio/AudioEngine';
import type { RunStats } from '../systems/RunStats';
import { bindMuteKey, toggleMute } from '../systems/Settings';
import { MenuList, type MenuItem } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { SCENES } from './SceneKeys';
import { inputMode } from '../systems/InputMode';
import { EventBus } from '../systems/EventBus';
import { trainingOptions, TRAINING_ENEMIES } from '../systems/TrainingState';
import { getAlien, hasAlien } from '../aliens/registry';
import type { LevelStartData } from './LevelScene';

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

export class PauseScene extends Phaser.Scene {
  private menu!: MenuList;
  private info!: PauseData;
  private hint: Phaser.GameObjects.BitmapText | null = null;
  private spawnIndex = 0;

  constructor() {
    super(SCENES.pause);
  }

  create(data: PauseData): void {
    this.info = data;
    this.hint = null;
    this.scene.bringToTop();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05070f, 0.8).setOrigin(0, 0);
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
    pixelText(this, GAME_WIDTH / 2, 54, 'PAUSED', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });

    this.menu = new MenuList(this, touch ? 150 : 170, touch ? 118 : 130, [
      { label: 'RESUME', action: () => this.resume() },
      { label: 'RESTART CHECKPOINT', action: () => this.restart() },
      { label: 'SETTINGS', action: () => this.openSettings() },
      { label: () => (audio.muted ? 'SOUND: OFF' : 'SOUND: ON'), action: () => toggleMute() },
      { label: 'QUIT TO TITLE', action: () => this.quit() },
    ], touch ? { spacing: 30, scale: 2, rowWidth: 250 } : 20);

    pixelText(this, 405, 108, 'CONTROLS', { originX: 0.5, color: PALETTE.gold });
    (touch ? TOUCH_CONTROLS : CONTROLS).forEach(([action, keys], i) => {
      pixelText(this, 300, 124 + i * 13, action, { color: PALETTE.uiDim });
      pixelText(this, 510, 124 + i * 13, keys, { originX: 1, color: PALETTE.white });
    });
    pixelText(this, GAME_WIDTH / 2, 272, 'TIP: TRANSFORMING KNOCKS NEARBY DRONES AWAY. USE IT TO ESCAPE!', { originX: 0.5, color: PALETTE.uiDim });
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
        hint: 'PASSIVE ENEMIES NEVER FIGHT BACK: PRACTISE YOUR COMBOS.',
        action: () => setOption({ enemiesAttack: !trainingOptions.enemiesAttack }),
        adjust: () => setOption({ enemiesAttack: !trainingOptions.enemiesAttack }),
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

    this.drawMoves(touch ? 330 : 318, touch ? 70 : 70);
    this.hint = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 22, '', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.showHint(items[this.menu.selectedIndex].hint ?? '');
  }

  /** Every alien on the dial with its moves, plus how to swap. */
  private drawMoves(x: number, y: number): void {
    pixelText(this, x, y, 'ALIEN MOVES', { color: PALETTE.gold });
    let row = y + 14;
    for (const id of this.info.aliens ?? []) {
      if (!hasAlien(id)) continue;
      const alien = getAlien(id);
      pixelText(this, x, row, alien.name, { color: alien.theme.color });
      row += 11;
      for (const move of alien.moves) {
        pixelText(this, x + 6, row, inputMode.format(move), { color: PALETTE.white });
        row += 10;
      }
      row += 4;
    }
    pixelText(this, x, row, inputMode.format('{DIAL} PICK, {T} TRANSFORM.'), { color: PALETTE.omnitrix });
    pixelText(this, x, row + 10, inputMode.format('{T} WHILE TRANSFORMED: SWAP (-3S)'), { color: PALETTE.omnitrix });
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

  private quit(): void {
    audio.musicBus?.gain.setTargetAtTime(0.32, audio.now, 0.05);
    this.scene.stop(SCENES.level);
    this.scene.stop(SCENES.ui);
    this.scene.stop(SCENES.touch);
    this.scene.start(SCENES.menu);
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
