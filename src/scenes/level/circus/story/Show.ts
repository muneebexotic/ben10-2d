import { TILE } from '../../../../config/constants';
import { CH8_BEATS } from '../../../../config/chapter8';
import { CIRCUS_SFX } from '../../../../entities/enemies/circus/sfx';
import type { CircusPlan } from '../../../../levels/types';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import { CH8_SHOW } from './lines';
import { StarActor } from './stars';

type Phase = 'wait' | 'show' | 'carry' | 'done';

/**
 * Cacklejack's show on the midway (GAME_DESIGN.md, Chapter 8, beat 2): Ben
 * walks up to the stage, Cacklejack springs out of a puff of smoke, drinks
 * a scream out of the crowd, and IRONJAW strides in and carries Max off into
 * the funhouse. Skipped (Max already gone) when play starts past it.
 */
export class Show implements SetPiece {
  private phase: Phase = 'wait';
  private readonly cackle: StarActor;
  private readonly iron: StarActor;

  constructor(
    private readonly kit: StoryKit,
    private readonly plan: CircusPlan,
    private readonly max: FamilyActor,
    /** Where play resumes (tiles; 0 on a fresh start). */
    resumeX: number,
  ) {
    this.cackle = new StarActor(kit.scene, 'cacklejack');
    this.iron = new StarActor(kit.scene, 'ironjaw');
    if (resumeX >= plan.show.triggerX) {
      this.phase = 'done';
      max.hide();
    } else if (!max.visible) {
      // A checkpoint start: Max is already waiting by the stage.
      max.place(plan.show.maxX * TILE, plan.show.floor * TILE);
      max.face(1);
    }
  }

  get cinematic(): boolean {
    return this.phase === 'show' || this.phase === 'carry';
  }

  get storyLock(): boolean {
    return this.cinematic;
  }

  update(dtMs: number): void {
    const kit = this.kit;
    const s = this.plan.show;
    this.cackle.update(dtMs);
    this.iron.update(dtMs);
    if (this.phase === 'wait') {
      if (kit.player.x >= s.triggerX * TILE && !kit.player.dead) this.start();
      return;
    }
    if (this.phase === 'carry') {
      // Max rides over IRONJAW's head out of the funhouse door.
      this.max.place(this.iron.x + this.iron.facing * 2, this.iron.y - 44);
    }
  }

  private start(): void {
    const kit = this.kit;
    const s = this.plan.show;
    this.phase = 'show';
    const p = kit.player;
    p.controlsEnabled = false;
    p.setVelocityX(0);
    kit.setLetterbox(true);
    // Out of a puff of smoke on his stage, with a fanfare of a laugh.
    const x = s.stageX * TILE;
    const y = s.stageFloor * TILE;
    this.cackle.show(x, y, -1, 'laugh');
    kit.fx.burst('smoke', x, y - 20, 18);
    kit.fx.burst('gold', x, y - 40, 14);
    kit.fx.flash(x, y - 30, 0x9aff3a, 60, 260);
    playSfx(CIRCUS_SFX.cackle, 1);
    kit.scene.time.delayedCall(700, () => this.cackle.play('idle'));
    kit.dialogue.play(CH8_SHOW, {
      onDone: () => this.carry(),
    });
    // Beats on the lines: the scream he drinks, IRONJAW walking in.
    kit.scene.time.delayedCall(CH8_SHOW[0].ms + CH8_SHOW[1].ms, () => this.scare());
    kit.scene.time.delayedCall(CH8_SHOW[0].ms + CH8_SHOW[1].ms + CH8_SHOW[2].ms + CH8_SHOW[3].ms, () => this.ironjawIn());
  }

  /** A grey wisp of a scream pulled out of the crowd and into his grin. */
  private scare(): void {
    if (this.phase !== 'show') return;
    const kit = this.kit;
    const tx = this.cackle.x;
    const ty = this.cackle.y - 52;
    const sx = (this.plan.show.maxX - 1) * TILE;
    const sy = this.plan.show.floor * TILE - 30;
    const wisp = kit.scene.add.circle(sx, sy, 5, 0xd8d0f0, 0.85).setDepth(this.cackle.actor.container.depth + 1);
    kit.scene.tweens.add({
      targets: wisp,
      x: tx,
      y: ty,
      scale: 0.4,
      duration: CH8_BEATS.show.scareMs,
      ease: 'Sine.easeIn',
      onUpdate: () => kit.fx.trail('ghost', wisp.x, wisp.y, 1),
      onComplete: () => {
        wisp.destroy();
        this.cackle.play('laugh', true);
        playSfx(CIRCUS_SFX.cackle, 0.8, 0.9);
        kit.scene.time.delayedCall(800, () => this.cackle.play('idle'));
      },
    });
  }

  private ironjawIn(): void {
    if (this.phase !== 'show') return;
    const s = this.plan.show;
    this.iron.show(CH8_BEATS.show.ironjawFromX * TILE, s.floor * TILE, -1, 'walk');
    this.iron.walkTo((s.maxX + 1.5) * TILE, CH8_BEATS.show.carrySpeed, () => {
      this.iron.play('carry');
      this.max.pose('surprise');
      this.kit.fx.shake(0.006, 140);
    });
  }

  /** Off with Max over his head, through the funhouse's door; Cacklejack bows out in smoke. */
  private carry(): void {
    const kit = this.kit;
    const s = this.plan.show;
    this.phase = 'carry';
    if (!this.iron.visible) this.iron.show((s.maxX + 1.5) * TILE, s.floor * TILE, 1, 'carry');
    this.iron.play('carry', true);
    this.iron.walkTo(s.exitX * TILE, CH8_BEATS.show.carrySpeed, () => this.gone(), 'carry');
    this.cackle.play('bow', true);
    kit.scene.time.delayedCall(900, () => {
      kit.fx.burst('smoke', this.cackle.x, this.cackle.y - 20, 16);
      this.cackle.hide();
    });
    const p = kit.player;
    p.controlsEnabled = true;
    kit.setLetterbox(false);
    kit.speech.show('GRANDPA!', 1600);
  }

  private gone(): void {
    this.phase = 'done';
    this.iron.hide();
    this.max.hide();
    this.kit.fx.burst('smoke', this.plan.show.exitX * TILE, this.plan.show.floor * TILE - 20, 10);
  }

  destroy(): void {
    this.cackle.destroy();
    this.iron.destroy();
  }
}
