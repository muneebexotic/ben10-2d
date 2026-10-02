import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import type { RunStats } from '../systems/RunStats';
import { bindMuteKey } from '../systems/Settings';
import { MenuList } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X, frameView } from '../ui/view';
import { SCENES } from './SceneKeys';
import { inputMode } from '../systems/InputMode';
import { session } from '../systems/Session';
import { leaveTo, resetLeaving } from '../ui/menu/transition';
import { GAMEOVER } from '../config/ui';

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
    resetLeaving(this);
    this.scene.bringToTop();
    frameView(this);
    const bg = this.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, 0x14040a, 0).setOrigin(0, 0);
    this.tweens.add({ targets: bg, fillAlpha: 0.78, duration: 400 });
    const title = pixelText(this, GAME_WIDTH / 2, 110, "BEN'S DOWN!", { scale: 5, originX: 0.5, originY: 0.5, color: PALETTE.enemy });
    title.setScale(3).setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut' });
    pixelText(this, GAME_WIDTH / 2, 150, `DEATHS THIS RUN: ${data.stats.deaths}`, { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    // Stuck? After a few deaths the screen says the difficulty is one setting away, without any shame.
    const struggling = data.stats.deaths >= GAMEOVER.suggestEasierAfterDeaths && session.slot !== null && session.difficulty !== 'easy';
    const tip = struggling
      ? 'STUCK? SETTINGS CAN LOWER THE DIFFICULTY ANY TIME. YOUR FILE KEEPS EVERYTHING.'
      : inputMode.format(TIPS[Math.floor(Math.random() * TIPS.length)]);
    pixelText(this, GAME_WIDTH / 2, 286, `TIP: ${tip}`, { originX: 0.5, originY: 0.5, color: PALETTE.gold, maxWidth: 560, align: 'center' });

    this.menu = new MenuList(this, GAME_WIDTH / 2, 190, [
      { label: data.checkpoint ? 'RETRY FROM CHECKPOINT' : 'RETRY', action: () => this.retry() },
      { label: 'SETTINGS', action: () => this.openSettings() },
      { label: session.slot === null ? 'QUIT TO TITLE' : 'QUIT TO CHAPTERS', action: () => this.quit() },
    ], 22, 2);
    bindMuteKey(this);
  }

  private retry(): void {
    this.scene.start(SCENES.level, { levelId: this.info.levelId, checkpoint: this.info.checkpoint, stats: this.info.stats });
  }

  private openSettings(): void {
    this.scene.launch(SCENES.settings, { returnTo: SCENES.gameOver });
    this.scene.pause();
  }

  /** The run was saved at the last checkpoint when Ben went down; Continue picks it up. */
  private quit(): void {
    this.scene.stop(SCENES.level);
    this.scene.stop(SCENES.ui);
    this.scene.stop(SCENES.touch);
    leaveTo(this, session.slot === null ? SCENES.menu : SCENES.chapterSelect, undefined, 'uiBack');
  }

  override update(time: number): void {
    this.menu.update(time);
  }
}
