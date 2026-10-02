import Phaser from 'phaser';
import { CHASE } from '../../../config/chapter2';
import { DEPTH, TILE } from '../../../config/constants';
import { Rustbucket } from '../../../entities/vehicles/Rustbucket';
import { horn } from '../../../entities/vehicles/audio';
import type { StoryPlan } from '../../../levels/types';
import { playSfx } from '../../../systems/audio/Sfx';
import { ChaseRig } from './chase/ChaseRig';
import { ConvoyStage } from './chase/ConvoyStage';
import { HaulerStage } from './chase/HaulerStage';
import { RideStage } from './chase/RideStage';
import type { Line } from './Dialogue';
import type { SetPiece, StoryKit } from './StoryKit';
import type { UnlockBeat } from './UnlockBeat';

type ChaseSpec = NonNullable<StoryPlan['chase']>;
type Phase = 'waiting' | 'arriving' | 'parked' | 'boarding' | 'ride' | 'convoy' | 'hauler' | 'finale' | 'done';

const ARRIVE_LINES: readonly Line[] = [
  { who: 'max', text: 'BEN! NEED A LIFT?', ms: 1600 },
  { who: 'gwen', text: "GRANDPA FORDED THE RIVER. DON'T ASK.", ms: 2000 },
];

const AFTER_LINES: readonly Line[] = [
  { who: 'gwen', text: "THE CAB'S EMPTY. WHATEVER WAS DRIVING THAT THING WALKED AWAY.", ms: 2600 },
  { who: 'ben', text: "TRUCKS DON'T WALK, GWEN.", ms: 1600 },
  { who: 'max', text: 'THIS ONE MIGHT. STAY SHARP, BOTH OF YOU.', ms: 2200 },
];

/**
 * The Rustbucket chase. Max picks Ben up on the far bank; Ben rides on the
 * roof while the road rushes past (ride: drones, tires, potholes), Vilgax's
 * convoy catches up (Four Arms' discovery: rip a truck off and throw it),
 * then the runaway rig dumps barrels until it crashes at the truck stop.
 * A restart at the hidden convoy checkpoint drops Ben straight back on the roof.
 */
export class RoadChase implements SetPiece {
  private phase: Phase = 'waiting';
  private readonly rv: Rustbucket;
  private rig: ChaseRig | null = null;
  private ride: RideStage | null = null;
  private convoy: ConvoyStage | null = null;
  private hauler: HaulerStage | null = null;
  private smoke = 0;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: ChaseSpec,
    resumeX: number,
    private readonly beat: UnlockBeat | null,
  ) {
    this.rv = new Rustbucket(kit.scene, spec.boardX * TILE, spec.boardY * TILE);
    this.rv.sprite.setVisible(false);
    if (kit.startCheckpoint === spec.checkpoint) this.startChase('convoy', false);
    else if (resumeX >= spec.endX * TILE) this.parkAtTruckStop();
  }

  get cinematic(): boolean {
    return this.phase === 'boarding' || this.phase === 'finale';
  }

  get storyLock(): boolean {
    return this.cinematic;
  }

  update(dtMs: number, realDtMs: number): void {
    const { kit } = this;
    switch (this.phase) {
      case 'waiting':
        if (!kit.player.dead && kit.player.x >= CHASE.arriveTriggerX * TILE) this.arrive();
        return;
      case 'arriving':
      case 'boarding':
        this.rv.update(realDtMs, kit.fx, kit.lighting, kit.backdrop?.timeOfDay ?? 0);
        return;
      case 'parked':
        this.rv.update(realDtMs, kit.fx, kit.lighting, kit.backdrop?.timeOfDay ?? 0);
        this.checkBoarding();
        return;
      case 'ride':
      case 'convoy':
      case 'hauler':
        this.updateChase(dtMs);
        return;
      case 'finale':
        this.rig?.update(dtMs);
        this.hauler?.update(dtMs);
        return;
      case 'done':
        this.rv.update(realDtMs, kit.fx, kit.lighting, 1);
        this.wreckSmoke(realDtMs);
        return;
    }
  }

  // ------------------------------------------------------------ Pick-up on the far bank

  private arrive(): void {
    const { kit, rv } = this;
    this.phase = 'arriving';
    const view = kit.scene.cameras.main.worldView;
    const targetX = this.spec.boardX * TILE;
    rv.moveTo(view.x - 100, this.spec.boardY * TILE);
    rv.sprite.setVisible(true);
    rv.setDriving(true);
    playSfx(horn, 0.9, 1.1);
    kit.dialogue.play(ARRIVE_LINES);
    kit.scene.tweens.add({
      targets: rv,
      x: targetX,
      duration: CHASE.arriveMs,
      ease: 'Cubic.easeOut',
      onUpdate: () => rv.moveTo(rv.x),
      onComplete: () => {
        rv.setDriving(false);
        rv.setBraking(true);
        kit.fx.burst('dust', rv.frontX - 10, rv.roadY - 2, 14);
        kit.scene.time.delayedCall(400, () => rv.setBraking(false));
        rv.enableRoof(kit.player.zone);
        this.phase = 'parked';
      },
    });
  }

  private checkBoarding(): void {
    const p = this.kit.player;
    if (p.dead || !p.controlsEnabled) return;
    if (Math.abs(p.x - this.rv.x) > CHASE.boardReach || p.y > this.rv.roadY + 4) return;
    this.board();
  }

  private board(): void {
    const { kit, rv } = this;
    const p = kit.player;
    this.phase = 'boarding';
    p.controlsEnabled = false;
    p.scriptedMove = null;
    p.setVelocity((rv.x - 10 - p.x) * 2.2, -340);
    p.squash(0.8, 1.2);
    kit.setLetterbox(true);
    kit.speech.show("I'LL RIDE UP TOP!", 1200);
    const cam = kit.scene.cameras.main;
    kit.scene.time.delayedCall(420, () => {
      cam.fadeOut(CHASE.fadeMs, 4, 6, 15);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        rv.disableRoof();
        this.startChase('ride', true);
        cam.fadeIn(CHASE.fadeMs, 4, 6, 15);
        kit.setLetterbox(false);
        p.controlsEnabled = true;
      });
    });
  }

  // ------------------------------------------------------------ On the road

  private startChase(stage: 'ride' | 'convoy', ramp: boolean): void {
    const { kit } = this;
    this.rig = new ChaseRig(kit, this.rv, this.spec.arenaX * TILE + TILE / 2, this.spec.roadY * TILE, ramp);
    this.rig.placePlayer();
    kit.playMusic('chase');
    if (stage === 'ride') {
      this.ride = new RideStage(kit, this.rig);
      this.phase = 'ride';
    } else {
      this.convoy = new ConvoyStage(kit, this.rig, this.beat);
      this.phase = 'convoy';
    }
  }

  private updateChase(dtMs: number): void {
    const rig = this.rig;
    if (!rig) return;
    rig.update(dtMs);
    if (this.phase === 'ride' && this.ride) {
      this.ride.update(dtMs);
      if (this.ride.done) {
        this.ride.destroy();
        this.ride = null;
        this.kit.reachCheckpoint(this.spec.checkpoint);
        this.convoy = new ConvoyStage(this.kit, rig, this.beat);
        this.phase = 'convoy';
      }
    } else if (this.phase === 'convoy' && this.convoy) {
      this.convoy.update(dtMs);
      if (this.convoy.done) {
        this.convoy.destroy();
        this.convoy = null;
        this.hauler = new HaulerStage(this.kit, rig);
        this.phase = 'hauler';
      }
    } else if (this.phase === 'hauler' && this.hauler) {
      this.hauler.update(dtMs);
      if (this.hauler.done) this.finale();
    }
  }

  /** The rig is off the road: cut to the truck stop where it crashed. */
  private finale(): void {
    const { kit } = this;
    const p = kit.player;
    this.phase = 'finale';
    p.controlsEnabled = false;
    kit.setLetterbox(true);
    const cam = kit.scene.cameras.main;
    kit.scene.time.delayedCall(500, () => {
      cam.fadeOut(CHASE.fadeMs * 2, 4, 6, 15);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.teardown();
        this.parkAtTruckStop();
        const x = this.spec.endX * TILE + TILE / 2;
        const y = this.spec.endY * TILE;
        p.teleport(x, y);
        p.setVelocity(0, 0);
        kit.camera.snap(x, y);
        kit.playMusic('highway');
        cam.fadeIn(CHASE.fadeMs * 2, 4, 6, 15);
        kit.setLetterbox(false);
        p.controlsEnabled = true;
        kit.speech.show('BEST. ROAD TRIP. EVER!', 1600);
        kit.scene.time.delayedCall(1700, () => kit.dialogue.play(AFTER_LINES));
      });
    });
  }

  private parkAtTruckStop(): void {
    const rv = this.rv;
    this.phase = 'done';
    // Parked just clear of the mesa wall; Ben steps out at the truck stop's checkpoint.
    rv.moveTo((this.spec.endX - 2) * TILE, this.spec.endY * TILE);
    rv.sprite.setVisible(true).setDepth(DEPTH.decorBack + 2);
    rv.setDriving(false);
    rv.setBraking(false);
  }

  /** The crashed rig at the truck stop keeps smouldering (the cab end of the wreck). */
  private wreckSmoke(realDtMs: number): void {
    const wreck = this.kit.level.entities.find((e) => e.type === 'decor' && e.kind === 'haulerWreck');
    if (!wreck || wreck.type !== 'decor') return;
    const x = wreck.x * TILE + TILE / 2 + 52;
    const y = wreck.y * TILE - 30;
    const view = this.kit.scene.cameras.main.worldView;
    if (x < view.x - 100 || x > view.right + 100) return;
    this.smoke -= realDtMs;
    this.kit.lighting.add(x, y, 54 + Math.random() * 8, 0xff8a1e, 0.8);
    if (this.smoke > 0) return;
    this.smoke = 80;
    this.kit.fx.burst('smoke', x - 10 + Math.random() * 20, y - 10, 2);
    if (Math.random() < 0.5) this.kit.fx.trail('fire', x - 8 + Math.random() * 16, y + 4);
  }

  private teardown(): void {
    this.ride?.destroy();
    this.ride = null;
    this.convoy?.destroy();
    this.convoy = null;
    this.hauler?.destroy();
    this.hauler = null;
    this.rig?.destroy();
    this.rig = null;
  }

  destroy(): void {
    this.teardown();
    this.rv.destroy();
  }
}
