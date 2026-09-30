import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { audio } from '../systems/audio/AudioEngine';
import type { RunStats } from '../systems/RunStats';
import { bindMuteKey, toggleMute } from '../systems/Settings';
import { MenuList } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { SCENES } from './SceneKeys';

interface PauseData {
  checkpoint: string | null;
  stats: RunStats;
}

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

export class PauseScene extends Phaser.Scene {
  private menu!: MenuList;
  private info!: PauseData;

  constructor() {
    super(SCENES.pause);
  }

  create(data: PauseData): void {
    this.info = data;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05070f, 0.72).setOrigin(0, 0);
    pixelText(this, GAME_WIDTH / 2, 54, 'PAUSED', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.omnitrix });

    this.menu = new MenuList(this, 170, 130, [
      { label: 'RESUME', action: () => this.resume() },
      { label: 'RESTART CHECKPOINT', action: () => this.restart() },
      { label: () => (audio.muted ? 'SOUND: OFF' : 'SOUND: ON'), action: () => toggleMute() },
      { label: 'QUIT TO TITLE', action: () => this.quit() },
    ], 20);

    pixelText(this, 400, 108, 'CONTROLS', { originX: 0.5, color: PALETTE.gold });
    CONTROLS.forEach(([action, keys], i) => {
      pixelText(this, 330, 124 + i * 13, action, { color: PALETTE.uiDim });
      pixelText(this, 470, 124 + i * 13, keys, { originX: 1, color: PALETTE.white });
    });
    pixelText(this, GAME_WIDTH / 2, 300, 'TIP: TRANSFORMING KNOCKS NEARBY DRONES AWAY. USE IT TO ESCAPE!', { originX: 0.5, color: PALETTE.uiDim });

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => this.resume());
    kb.on('keydown-P', () => this.resume());
    bindMuteKey(this);
    audio.musicBus?.gain.setTargetAtTime(0.1, audio.now, 0.05);
  }

  private resume(): void {
    audio.musicBus?.gain.setTargetAtTime(0.32, audio.now, 0.05);
    this.scene.resume(SCENES.level);
    this.scene.stop();
  }

  private restart(): void {
    audio.musicBus?.gain.setTargetAtTime(0.32, audio.now, 0.05);
    this.scene.start(SCENES.level, { checkpoint: this.info.checkpoint, stats: this.info.stats });
  }

  private quit(): void {
    audio.musicBus?.gain.setTargetAtTime(0.32, audio.now, 0.05);
    this.scene.stop(SCENES.level);
    this.scene.stop(SCENES.ui);
    this.scene.start(SCENES.menu);
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
