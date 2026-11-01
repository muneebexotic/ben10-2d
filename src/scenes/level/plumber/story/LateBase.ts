import { TILE } from '../../../../config/constants';
import { CH7_LATE } from '../../../../config/chapter7';
import type { PlumberPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import type { BaseSystems } from '../water/BaseSystems';
import { plumberMax } from './actors';
import { ALL_SYSTEMS_LINES, CELL7_LINES, MAX_CATCHES_UP, PUMP_HALL_LINES, PUMP_LINES } from './lines';

type MaxPhase = 'wait' | 'with' | 'cell' | 'talk' | 'leave' | 'done';

/**
 * The second half of the base (GAME_DESIGN.md, Chapter 7, beats 10 and 11):
 * Max and Gwen on the intercom as Ben brings the pump hall back pump by pump,
 * ALL SYSTEMS GO when everything runs, DEEP BREATH for the flooded ring, and
 * Max catching up in the containment block with his blaster until Cell 7
 * turns out to be empty; then he heads for the moon pool's booth.
 */
export class LateBase implements SetPiece {
  private hallTalked: boolean;
  private allGo = false;
  private breath: 'wait' | 'on' | 'failed' | 'done';
  private maxPhase: MaxPhase = 'wait';
  private max: FamilyActor | null = null;
  private blastIn = 0;
  /** How long Ben has waited at Cell 7 for Max to walk up. */
  private cellWait = 0;

  constructor(
    private readonly kit: StoryKit,
    base: BaseSystems,
    private readonly plan: PlumberPlan,
    resumeX: number,
  ) {
    const B = CH7_LATE.deepBreath;
    this.hallTalked = resumeX > CH7_LATE.pumpHallX * TILE;
    this.breath = resumeX > B.fromX * TILE + TILE ? 'done' : 'wait';
    if (resumeX > (plan.containment.cellX + CH7_LATE.cellNear) * TILE) this.maxPhase = 'done';
    base.machines.onRun((id, kind) => {
      if (kind === 'pump' && PUMP_LINES[id] && !kit.dialogue.playing) kit.dialogue.play(PUMP_LINES[id]);
      if (!this.allGo && base.machines.allRun) {
        this.allGo = true;
        kit.achievement('all-systems-go');
        kit.scene.time.delayedCall(2600, () => {
          if (!kit.dialogue.playing) kit.dialogue.play(ALL_SYSTEMS_LINES);
        });
      }
    });
  }

  /** Cell 7 holds Ben for the reveal (the pause button skips it). */
  get cinematic(): boolean {
    return this.maxPhase === 'cell' || this.maxPhase === 'talk';
  }

  get storyLock(): boolean {
    return this.cinematic;
  }

  update(dtMs: number, realDtMs: number, _controls: Controls): void {
    const kit = this.kit;
    const p = kit.player;
    if (!this.hallTalked && p.x >= CH7_LATE.pumpHallX * TILE && !p.dead) {
      this.hallTalked = true;
      kit.dialogue.play(PUMP_HALL_LINES);
    }
    this.deepBreath();
    this.containment(dtMs, realDtMs);
  }

  /** DEEP BREATH: through the flooded ring as Ben, never once out of air. */
  private deepBreath(): void {
    if (this.breath === 'done' || this.breath === 'failed') return;
    const B = CH7_LATE.deepBreath;
    const p = this.kit.player;
    if (this.breath === 'wait') {
      if (p.x >= B.fromX * TILE) this.breath = 'on';
      return;
    }
    if (p.form.id !== 'ben' || p.breath.empty || p.dead) {
      this.breath = 'failed';
      return;
    }
    if (p.x >= B.toX * TILE) {
      this.breath = 'done';
      this.kit.achievement('deep-breath');
    }
  }

  /** Max in the containment block: catches up, fights at Ben's back, then Cell 7. */
  private containment(dtMs: number, realDtMs: number): void {
    if (this.maxPhase === 'done') return;
    const kit = this.kit;
    const c = { ...this.plan.containment, skipX: this.plan.containment.cellX + CH7_LATE.cellSkip };
    const M = CH7_LATE.max;
    const p = kit.player;
    if (this.maxPhase === 'wait') {
      if (p.x < c.maxX * TILE || p.dead) return;
      this.maxPhase = 'with';
      this.max = plumberMax(kit);
      const view = kit.scene.cameras.main.worldView;
      this.max.place(view.x - 24, c.floor * TILE);
      this.max.runTo(p.x - M.gap, M.speed, () => this.max?.face(1), 'walk');
      this.blastIn = M.blastEveryMs[0];
      kit.dialogue.play(MAX_CATCHES_UP);
      return;
    }
    const max = this.max!;
    max.update(realDtMs);
    if (this.maxPhase === 'with') {
      this.follow(max);
      this.blast(max, dtMs);
      // Ben at the moon pool already: the reveal waits for the fight.
      if (p.x >= c.skipX * TILE) {
        this.leave();
        return;
      }
      // The empty cell, once nothing's left to fight near it.
      if (p.x >= (c.cellX - CH7_LATE.cellNear) * TILE && !p.dead && p.grounded && !kit.nearestEnemy(p.x, p.centerY, CH7_LATE.cellClearPx)) {
        // Ben stops at the empty cell; Max walks up.
        this.maxPhase = 'cell';
        this.cellWait = 0;
        p.controlsEnabled = false;
        p.setVelocityX(0);
        max.runTo(c.cellX * TILE - 28, M.speed, () => max.face(1), 'walk');
      }
      return;
    }
    if (this.maxPhase === 'cell') {
      this.cellWait += dtMs;
      const near = Math.abs(max.x - (c.cellX * TILE - 28)) < 24;
      if (!kit.dialogue.playing && (near || this.cellWait > CH7_LATE.cellWaitMs)) {
        this.maxPhase = 'talk';
        kit.dialogue.play(CELL7_LINES, { skippable: true, onDone: () => this.leave() });
      }
      return;
    }
    if (this.maxPhase === 'leave' && (!max.moving || max.x < kit.scene.cameras.main.worldView.x - 12)) {
      max.hide();
      this.maxPhase = 'done';
    }
  }

  /** He keeps a step behind Ben along the floor. */
  private follow(max: FamilyActor): void {
    const M = CH7_LATE.max;
    const p = this.kit.player;
    if (max.moving) return;
    const want = p.x - p.facing * M.gap;
    if (Math.abs(want - max.x) > M.far) max.runTo(want, M.speed, () => max.faceTo(p.x), 'walk');
    else max.faceTo(p.x);
  }

  /** A blaster bolt at whatever's nearest, now and then. */
  private blast(max: FamilyActor, dtMs: number): void {
    const kit = this.kit;
    const M = CH7_LATE.max;
    this.blastIn -= dtMs;
    if (this.blastIn > 0 || max.moving || kit.player.dead) return;
    const handY = max.feetY - M.handHeight;
    const target = kit.nearestEnemy(max.x, handY, M.range);
    if (!target) {
      this.blastIn = 300;
      return;
    }
    max.faceTo(target.x);
    max.hold('spray', 400);
    const ang = Math.atan2(target.y - handY, target.x - max.x);
    kit.projectiles.spawn('laser', 'player', max.x + max.facing * 10, handY, Math.cos(ang) * M.shotSpeed, Math.sin(ang) * M.shotSpeed, M.damage, M.shotLifeMs, 3);
    playSfx('laser', 0.5, 0.8);
    this.blastIn = M.blastEveryMs[0] + Math.random() * (M.blastEveryMs[1] - M.blastEveryMs[0]);
  }

  /** Off to the booth over the moon pool, by the service stairs back the way he came (out of sight). */
  private leave(): void {
    const max = this.max;
    this.kit.player.controlsEnabled = true;
    if (!max) return;
    this.maxPhase = 'leave';
    max.runTo(this.kit.scene.cameras.main.worldView.x - 40, CH7_LATE.max.speed, undefined, 'walk');
  }

  destroy(): void {
    this.max?.destroy();
  }
}
