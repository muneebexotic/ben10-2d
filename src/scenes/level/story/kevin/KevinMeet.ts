import { TILE } from '../../../../config/constants';
import { CH4_BEATS } from '../../../../config/kevin';
import { PALETTE } from '../../../../config/palette';
import type { EnemyKind } from '../../../../levels/types';
import type { Cabinet } from '../../../../entities/tech/Cabinet';
import type { Controls } from '../../../../systems/InputMap';
import { chance } from '../../../../systems/Pacing';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { KevinActor } from './KevinActor';
import type { KevinBuddy } from './KevinBuddy';
import { KEVIN_BREAKER_LINES, KEVIN_MEET_LINES, KEVIN_TRICK_LINES } from './lines';

export interface KevinMeetSpec {
  meetX: number;
  kevinX: number;
  breakerX: number;
  spawns: Array<{ kind: EnemyKind; x: number; y: number }>;
  untilX: number;
}

type Phase = 'wait' | 'talk' | 'trick' | 'breaker' | 'done';

/**
 * Meeting Kevin in the GAME ZONE: a lonely kid at a cabinet with every high
 * score in the place. He shows off (drinks a cabinet dry, throws it as a
 * bolt), then dumps the lot into the breaker: free games for everyone, and
 * the TOKEN TOONS band wakes up wrong. From there he tags along as a buddy.
 * On a retry or a continue the talking is skipped, the mascots still come.
 */
export class KevinMeet implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly floorY: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: KevinMeetSpec,
    private readonly actor: KevinActor,
    private readonly buddy: KevinBuddy,
    resumeX: number,
  ) {
    this.floorY = kit.world.groundBelow(spec.kevinX * TILE + 8, 20 * TILE);
    if (resumeX > spec.meetX * TILE) {
      this.phase = 'done';
      return;
    }
    // He's at a cabinet, his back half-turned, waiting for someone interesting.
    actor.place(spec.kevinX * TILE + 8, this.floorY, 'scripted');
    actor.face(-1);
    actor.pose('idle');
  }

  get cinematic(): boolean {
    return this.phase === 'talk' || this.phase === 'trick' || this.phase === 'breaker';
  }

  get storyLock(): boolean {
    return this.cinematic;
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    if (this.phase === 'wait') {
      // He glances over as Ben comes in.
      if (kit.player.x > (this.spec.meetX - 6) * TILE) this.actor.faceBen();
      if (kit.player.x < this.spec.meetX * TILE || kit.player.dead) return;
      if (kit.continuing || kit.startCheckpoint !== null) this.quick();
      else this.begin();
      return;
    }
    this.t += realDtMs;
    if (this.phase === 'trick') this.updateTrick();
    else if (this.phase === 'breaker') this.updateBreaker();
  }

  private begin(): void {
    const kit = this.kit;
    this.phase = 'talk';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.setLetterbox(true);
    kit.camera.lockTo((kit.player.x + this.actor.x) / 2 + 20, this.floorY - 60);
    this.actor.faceBen();
    kit.dialogue.play(KEVIN_MEET_LINES, { skippable: true, onDone: () => this.startTrick() });
  }

  /** He drinks the cabinet next to him dry and throws it as a bolt. */
  private startTrick(): void {
    if (this.phase !== 'talk') return;
    this.phase = 'trick';
    this.t = 0;
    const cab = this.cabinet();
    this.actor.face(-1);
    if (cab) this.actor.drink(cab.anchorX, cab.anchorY - 30, CH4_BEATS.breaker.absorbMs);
  }

  private updateTrick(): void {
    const kit = this.kit;
    const B = CH4_BEATS.breaker;
    if (this.t >= B.absorbMs && !this.steps.has('drained')) {
      this.steps.add('drained');
      this.cabinet()?.drain();
      this.actor.pose('tell');
    }
    if (this.t >= B.absorbMs + 450 && !this.steps.has('thrown')) {
      this.steps.add('thrown');
      // At the dead neon sign over the prize counter: it sputters back on.
      this.actor.throwBolt(this.actor.x + 120, this.floorY - 90, 0, 320, 0);
      kit.fx.flash(this.actor.x + 120, this.floorY - 90, PALETTE.kevin, 30, 300);
      kit.fx.shake(0.004, 150);
    }
    if (this.t >= B.absorbMs + 900 && !this.steps.has('lines')) {
      this.steps.add('lines');
      kit.dialogue.play(KEVIN_TRICK_LINES, { skippable: true, onDone: () => this.startBreaker() });
    }
  }

  private readonly steps = new Set<string>();

  /** He runs to the breaker and dumps everything he's got into it. */
  private startBreaker(): void {
    if (this.phase !== 'trick') return;
    this.phase = 'breaker';
    this.t = 0;
    this.steps.clear();
    this.actor.runTo(this.spec.breakerX * TILE - 6, 160, () => {
      this.actor.face(1);
      this.actor.pose('lunge');
      this.steps.add('there');
      this.t = 0;
    });
  }

  private updateBreaker(): void {
    const kit = this.kit;
    if (!this.steps.has('there')) return;
    const bx = this.spec.breakerX * TILE + 8;
    const by = 27 * TILE + 14;
    if (this.t < CH4_BEATS.breaker.surgeMs) {
      if (chance(0.8)) kit.fx.beam(this.actor.handX, this.actor.handY, bx, by, PALETTE.kevin, 2, 50);
      return;
    }
    if (!this.steps.has('surge')) {
      this.steps.add('surge');
      playSfx('powerSurge', 1);
      kit.fx.flash(bx, by, PALETTE.white, 120, 300);
      kit.fx.burst('volt', bx, by, 24);
      kit.fx.burst('pixel', bx, by, 20);
      kit.fx.shake(0.012, 400);
      this.actor.pose('laugh');
      this.spawnMascots(900);
      kit.dialogue.play(KEVIN_BREAKER_LINES, { skippable: true, onDone: () => this.finish() });
    }
  }

  private spawnMascots(delayMs: number): void {
    const kit = this.kit;
    for (const [i, s] of this.spec.spawns.entries()) {
      const x = s.x * TILE + 8;
      const y = s.y * TILE;
      kit.scene.time.delayedCall(i * 250, () => {
        kit.fx.burst('volt', x, y - 16, 12);
        kit.fx.flash(x, y - 16, PALETTE.neonPink, 30, 200);
        playSfx('servo', 0.8, 0.8 + i * 0.1);
      });
      kit.spawnDrone(s.kind, x, y - 4, { delayMs: delayMs + i * 300 });
    }
  }

  private finish(): void {
    if (this.phase !== 'breaker') return;
    this.phase = 'done';
    const kit = this.kit;
    kit.camera.unlock();
    kit.setLetterbox(false);
    kit.player.controlsEnabled = true;
    kit.speech.show("EVIL ROBOT BAND? IT'S HERO TIME!", 1900);
    this.actor.mode = 'buddy';
    kit.tutorial.tip('kevin-buddy', 'KEVIN FIGHTS ALONGSIDE YOU. HE CAN TAKE CARE OF HIMSELF', 4000, 4);
  }

  /** A retry or a continue: no talking, the band still wakes up. */
  private quick(): void {
    this.phase = 'done';
    this.cabinet()?.drain();
    this.spawnMascots(1200);
    this.buddy.join(false);
  }

  private cabinet(): Cabinet | undefined {
    // The cabinet he's standing at.
    return this.kit.machine('cab-2') as Cabinet | undefined;
  }

  destroy(): void {
    // The actor belongs to the director.
  }
}
