import { TILE } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { KevinActor } from './KevinActor';
import { HUNT_TAUNTS } from './lines';

interface Beat {
  /** Ben passes this x (px)... */
  at: number;
  /** ...and Kevin shows up here. */
  x: number;
  sparks: number;
  last: boolean;
}

/**
 * The power depot after the turn: Kevin stays a step ahead. He crackles into
 * view up the line, taunts, flings a couple of sparks and vanishes again, and
 * the last time he's waiting at the door to the substation hall.
 */
export class Hunt implements SetPiece {
  private readonly beats: Beat[] = [];
  private index = 0;
  private busy = false;

  constructor(
    private readonly kit: StoryKit,
    spec: { fromX: number; toX: number; floor: number },
    private readonly actor: KevinActor,
    resumeX: number,
  ) {
    const span = spec.toX - spec.fromX;
    const marks = [0.04, 0.44, 0.88];
    marks.forEach((m, i) => {
      const at = (spec.fromX + span * m) * TILE;
      this.beats.push({ at, x: at + 12 * TILE, sparks: i === 2 ? 0 : 2, last: i === 2 });
    });
    while (this.index < this.beats.length && resumeX > this.beats[this.index].at) this.index++;
  }

  get cinematic(): boolean {
    return false;
  }

  get storyLock(): boolean {
    return false;
  }

  update(_dtMs: number, _realDtMs: number, _controls: Controls): void {
    // A beat Ben already ran past (Kevin would pop up behind him) is skipped.
    while (this.index < this.beats.length && this.kit.player.x > this.beats[this.index].x - 3 * TILE) this.index++;
    const b = this.beats[this.index];
    if (!b || this.busy || this.kit.player.x < b.at || this.kit.player.dead) return;
    this.index++;
    this.show(b, this.index - 1);
  }

  private show(b: Beat, i: number): void {
    const kit = this.kit;
    const y = kit.world.groundBelow(b.x, kit.player.y - 40);
    this.busy = true;
    this.actor.appear(b.x, y, 'scripted');
    this.actor.faceBen();
    this.actor.glow = 1;
    this.actor.pose('laugh');
    playSfx('kevinBolt', 0.7, 0.7);
    kit.dialogue.say('kevin', HUNT_TAUNTS[i % HUNT_TAUNTS.length], 2200);
    for (let s = 0; s < b.sparks; s++) {
      kit.scene.time.delayedCall(500 + s * 350, () => {
        if (this.actor.mode === 'hidden') return;
        this.actor.pose('attack');
        kit.fx.flash(this.actor.handX, this.actor.handY, PALETTE.kevin, 16, 160);
        kit.spawnDrone('spark', this.actor.handX + this.actor.facing * 12, this.actor.handY - 6 - s * 10, { roam: true, delayMs: 300 });
      });
    }
    kit.scene.time.delayedCall(b.last ? 1600 : 1500 + b.sparks * 350, () => {
      if (b.last) {
        // Into the hall: the boss fight starts when Ben follows.
        this.actor.runTo(b.x + 10 * TILE, 200, () => this.vanish());
        return;
      }
      this.vanish();
    });
  }

  private vanish(): void {
    if (this.actor.mode !== 'hidden') this.kit.fx.burst('volt', this.actor.x, this.actor.feetY - 16, 12);
    this.actor.hide();
    this.busy = false;
  }

  destroy(): void {
    // The actor belongs to the director.
  }
}
