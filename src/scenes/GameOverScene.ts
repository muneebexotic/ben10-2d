import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import type { RunStats } from '../systems/RunStats';
import { bindMuteKey } from '../systems/Settings';
import { MenuList } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { SCENES } from './SceneKeys';
import { inputMode } from '../systems/InputMode';

interface GameOverData {
  levelId?: string;
  checkpoint: string | null;
  stats: RunStats;
}

const TIPS = [
  'STRIKERS GET STUCK AFTER A DIVE. PUNCH THEM WHILE THEY ARE DOWN!',
  'PUNCH {J} A LASER RIGHT BEFORE IT HITS TO KNOCK IT BACK.',
  'FIRE BURST {K} WIPES OUT EVERY LASER AROUND YOU.',
  'THE DODGE ROLL {K} MAKES HUMAN BEN INVINCIBLE FOR A MOMENT.',
  'HOLD {UP} WHILE SHOOTING TO AIM FIREBALLS AT HIGH DRONES.',
  'TRANSFORM {T} RIGHT AS A DRONE FIRES: PERFECT TRANSFORM, BIGGER BLAST, MORE ALIEN TIME.',
  'THE BOSS IS STUNNED AFTER A SLAM. THAT IS YOUR WINDOW!',
  'TRANSFORMING SENDS OUT A SHOCKWAVE. PANIC BUTTON!',
  'HEATBLAST GLIDES IF YOU HOLD JUMP AFTER A ROCKET JUMP.',
  'THE SHIELD BAR PROTECTS BEN WHILE HE IS AN ALIEN.',
  'MR. SMOOTHY HEALS. NEVER SKIP A SMOOTHY.',
];

export class GameOverScene extends Phaser.Scene {
  private menu!: MenuList;
  private info!: GameOverData;

  constructor() {
    super(SCENES.gameOver);
  }

  create(data: GameOverData): void {
    this.info = data;
    this.scene.bringToTop();
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x14040a, 0).setOrigin(0, 0);
    this.tweens.add({ targets: bg, fillAlpha: 0.78, duration: 400 });
    const title = pixelText(this, GAME_WIDTH / 2, 110, "BEN'S DOWN!", { scale: 5, originX: 0.5, originY: 0.5, color: PALETTE.enemy });
    title.setScale(3).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    pixelText(this, GAME_WIDTH / 2, 150, `DEATHS THIS RUN: ${data.stats.deaths}`, { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    const tip = inputMode.format(TIPS[Math.floor(Math.random() * TIPS.length)]);
    pixelText(this, GAME_WIDTH / 2, 280, `TIP: ${tip}`, { originX: 0.5, originY: 0.5, color: PALETTE.gold, maxWidth: 560, align: 'center' });

    this.menu = new MenuList(this, GAME_WIDTH / 2, 196, [
      { label: data.checkpoint ? 'RETRY FROM CHECKPOINT' : 'RETRY', action: () => this.retry() },
      { label: 'QUIT TO TITLE', action: () => this.quit() },
    ], 22, 2);
    bindMuteKey(this);
  }

  private retry(): void {
    this.scene.start(SCENES.level, { levelId: this.info.levelId, checkpoint: this.info.checkpoint, stats: this.info.stats });
  }

  private quit(): void {
    this.scene.stop(SCENES.level);
    this.scene.stop(SCENES.ui);
    this.scene.stop(SCENES.touch);
    this.scene.start(SCENES.menu);
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
