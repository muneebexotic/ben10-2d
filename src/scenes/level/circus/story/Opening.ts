import { TILE } from '../../../../config/constants';
import { CH8_BEATS } from '../../../../config/chapter8';
import type { CircusPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import type { StoryIntro } from '../../../../chapters/types';
import type { FamilyActor } from '../../family/FamilyActor';
import type { StoryKit } from '../../story/StoryKit';
import { CH8_OPENING } from './lines';

type Phase = 'walk' | 'talk' | 'done';

/**
 * The cold open (a fresh start only): Ben, Gwen and Max walk onto Driftwood
 * Bay's boardwalk past the grey, drained townsfolk; the three talk; then Gwen
 * walks with Ben and Max heads off to look at the stage. Any skip ends it.
 */
export class Opening implements StoryIntro {
  private phase: Phase = 'walk';
  private t = 0;

  constructor(
    private readonly kit: StoryKit,
    private readonly plan: CircusPlan,
    private readonly max: FamilyActor,
  ) {
    const b = plan.boardwalk;
    const p = kit.player;
    p.teleport(b.startX * TILE, b.floor * TILE);
    p.controlsEnabled = false;
    p.scriptedMove = 1;
    kit.setHud(false);
    kit.setLetterbox(true);
    const g = kit.gwen;
    if (g) {
      g.join(false, (b.startX - 1.6) * TILE);
      g.actor.runTo((b.stopX - 1.6) * TILE, CH8_BEATS.gwenFollow * 0.75);
    }
    max.place((b.startX - 3.2) * TILE, b.floor * TILE);
    max.runTo((b.stopX - 3.2) * TILE, CH8_BEATS.gwenFollow * 0.75, () => max.face(1), 'walk');
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  get cinematic(): boolean {
    return this.phase !== 'done';
  }

  get storyLock(): boolean {
    return this.phase !== 'done';
  }

  update(dtMs: number, _realDtMs: number, controls: Controls): void {
    if (this.phase === 'done') return;
    this.t += dtMs;
    const p = this.kit.player;
    if (this.phase === 'walk') {
      if (controls.skip) {
        this.finish();
        return;
      }
      if (p.x >= this.plan.boardwalk.stopX * TILE || this.t > CH8_BEATS.opening.walkMs) {
        p.scriptedMove = 0;
        p.setVelocityX(0);
        this.phase = 'talk';
        this.kit.dialogue.play(CH8_OPENING, { skippable: true, onDone: () => this.finish() });
      }
    }
  }

  private finish(): void {
    if (this.phase === 'done') return;
    this.phase = 'done';
    const kit = this.kit;
    const p = kit.player;
    p.scriptedMove = null;
    p.controlsEnabled = true;
    kit.setHud(true);
    kit.setLetterbox(false);
    // Max goes to see what's on the stage; Gwen sticks with Ben.
    this.max.runTo(this.plan.show.maxX * TILE, 60, () => this.max.face(1), 'walk');
  }

  destroy(): void {}
}
