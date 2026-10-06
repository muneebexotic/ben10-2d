import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import type { RunStats } from '../systems/RunStats';
import { bindMuteKey } from '../systems/Settings';
import { MenuList, type MenuItem } from '../ui/MenuList';
import { pixelText } from '../ui/text';
import { COVER_W, COVER_X, frameView } from '../ui/view';
import { SCENES } from './SceneKeys';
import { inputMode } from '../systems/InputMode';
import { session } from '../systems/Session';
import { leaveTo, resetLeaving } from '../ui/menu/transition';
import { GAMEOVER } from '../config/ui';
import { easierThan, getDifficulty, type DifficultyId } from '../config/difficulty';
import { difficultyRows } from '../ui/menu/difficultyInfo';
import { playSfx } from '../systems/audio/Sfx';
import { tipsFor } from '../ui/gameOverTips';
import { getLevel, hasLevel } from '../levels/registry';

interface GameOverData {
  levelId?: string;
  checkpoint: string | null;
  stats: RunStats;
  /** The aliens on the dial when Ben went down (tips only name aliens the player has). */
  aliens?: readonly string[];
}


export class GameOverScene extends Phaser.Scene {
  private menu!: MenuList;
  private info!: GameOverData;

  constructor() {
    super(SCENES.gameOver);
  }

  /** A tip about this chapter's enemies and the aliens the player has. */
  private pickTip(data: GameOverData): string {
    const chapter = data.levelId && hasLevel(data.levelId) ? getLevel(data.levelId).chapter : 1;
    const tips = tipsFor(chapter, data.aliens ?? session.file?.unlockedAliens ?? []);
    return tips[Math.floor(Math.random() * tips.length)]?.text ?? '';
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
    // Stuck? After a few deaths one tap lowers the difficulty and retries, without any shame.
    const easier = session.slot !== null && data.stats.deaths >= GAMEOVER.suggestEasierAfterDeaths ? easierThan(session.difficulty) : null;
    const tip = easier
      ? `ONE TAP AND YOU'RE BACK IN ON ${getDifficulty(easier).label}. YOUR FILE KEEPS EVERYTHING (THIS RUN JUST WON'T SET A BEST TIME).`
      : inputMode.format(this.pickTip(data));
    const tipText = pixelText(this, GAME_WIDTH / 2, 292, `TIP: ${tip}`, { originX: 0.5, originY: 0.5, color: PALETTE.gold, maxWidth: 560, align: 'center' });
    if (easier) tipText.setText(tip).setTint(PALETTE.cream);

    const items: MenuItem[] = [{ label: data.checkpoint ? 'RETRY FROM CHECKPOINT' : 'RETRY', action: () => this.retry() }];
    if (easier) {
      const d = getDifficulty(easier);
      items.push({ label: `MAKE IT EASIER: ${d.label}`, action: () => this.retryEasier(easier), color: d.color });
    }
    items.push(
      { label: 'SETTINGS', action: () => this.openSettings() },
      { label: session.slot === null ? 'QUIT TO TITLE' : 'QUIT TO CHAPTERS', action: () => this.quit() },
    );
    this.menu = new MenuList(this, GAME_WIDTH / 2, easier ? 180 : 190, items, 22, 2);
    if (easier) this.showEasierDetails(easier);
    bindMuteKey(this);
  }

  /** Spells out what the easier setting changes, under the menu. */
  private showEasierDetails(id: DifficultyId): void {
    const d = getDifficulty(id);
    const rows = difficultyRows(d).slice(0, 4).map(([label, value]) => `${label} ${value}`).join('   ');
    pixelText(this, GAME_WIDTH / 2, 268, rows, { originX: 0.5, originY: 0.5, color: d.color });
  }

  /** One tap: the file drops a difficulty and Ben is straight back in at the checkpoint. */
  private retryEasier(id: DifficultyId): void {
    session.setDifficulty(id);
    playSfx('uiConfirm');
    this.retry();
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
