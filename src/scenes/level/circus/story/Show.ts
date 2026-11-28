import { TILE } from '../../../../config/constants';
import { CH8_BEATS } from '../../../../config/chapter8';
import { CIRCUS_SFX } from '../../../../entities/enemies/circus/sfx';
import type { CircusPlan } from '../../../../levels/types';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { FamilyActor } from '../../family/FamilyActor';
import { plumberKevin } from '../../plumber/story/actors';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import { CH8_SHOW } from './lines';
import { StarActor } from './stars';

type Phase = 'wait' | 'show' | 'carry' | 'done';

/**
 * Cacklejack's show on the midway (GAME_DESIGN.md, Chapter 8, beat 2): Ben
 * walks up to the stage, Cacklejack springs out of a puff of smoke, drinks
 * a scream out of the crowd, and IRONJAW strides in and carries Max off into
 * the funhouse. Skipped (Max already gone) when play starts past it.
 *
 * A face in the crowd: Kevin (the owner's drawings of him), in full colour among the grey townsfolk at the
 * back of the midway, hands in his pockets, smirking. He laughs when Cacklejack drinks the scream, and once
 * the show is over he's gone the moment Ben looks away. Nobody remarks on it.
 */
export class Show implements SetPiece {
  private phase: Phase = 'wait';
  private readonly cackle: StarActor;
  private readonly iron: StarActor;
  private readonly kevin: FamilyActor | null = null;

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
      return;
    }
    if (!max.visible) {
      // A checkpoint start: Max is already waiting by the stage.
      max.place(plan.show.maxX * TILE, plan.show.floor * TILE);
      max.face(1);
    }
    const kevin = plumberKevin(kit);
    kevin.place(plan.show.kevinX * TILE, plan.show.floor * TILE);
    kevin.face(1);
    kevin.pose('smirk');
    this.kevin = kevin;
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
    // Max walks over from the boardwalk, strikes his line's drawing and rides off: his sprite follows here.
    if (this.max.visible) this.max.update(dtMs);
    this.updateKevin(dtMs);
    if (this.phase === 'wait') {
      if (kit.player.x >= s.triggerX * TILE && !kit.player.dead) this.start();
      return;
    }
    // Held still through the show, Ben can't be hit by a goon he ran past (no blink: nothing hit him).
    if (this.phase === 'show') kit.player.setInvulnerable(CH8_BEATS.show.heldGraceMs, false);
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
    this.maxToStage();
    kit.dialogue.play(CH8_SHOW, {
      onDone: () => this.carry(),
    });
    // Beats on the lines: the scream he drinks, IRONJAW walking in.
    kit.scene.time.delayedCall(CH8_SHOW[0].ms + CH8_SHOW[1].ms, () => this.scare());
    kit.scene.time.delayedCall(CH8_SHOW[0].ms + CH8_SHOW[1].ms + CH8_SHOW[2].ms + CH8_SHOW[3].ms, () => this.ironjawIn());
  }

  /**
   * Max strolls over from the boardwalk after the opening: a player who got here first sees him hurry in
   * (from the edge of the picture when he's further back) and take his place before his line.
   */
  private maxToStage(): void {
    const s = this.plan.show;
    const m = this.max;
    const at = s.maxX * TILE;
    if (!m.visible || Math.abs(m.x - at) < 2) return;
    const view = this.kit.scene.cameras.main.worldView;
    if (m.x < view.x - TILE) m.place(view.x - TILE, s.floor * TILE);
    m.runTo(at, CH8_BEATS.show.maxHurry, () => m.face(1), 'run');
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
        this.kevin?.hold('laugh', CH8_BEATS.show.kevinLaughMs);
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

  /** Kevin smirks (back to it after his laugh); after the show he slips away once he's out of the picture. */
  private updateKevin(dtMs: number): void {
    const k = this.kevin;
    if (!k?.visible) return;
    if (this.phase === 'carry' || this.phase === 'done') {
      const view = this.kit.scene.cameras.main.worldView;
      if (k.x < view.x - 2 * TILE || k.x > view.right + 2 * TILE) {
        k.hide();
        return;
      }
    }
    k.pose('smirk');
    k.update(dtMs);
  }

  destroy(): void {
    this.cackle.destroy();
    this.iron.destroy();
    this.kevin?.destroy();
  }
}
