import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../config/constants';
import { ROAD, ROAD_INTRO } from '../../../config/chapter2';
import { PALETTE } from '../../../config/palette';
import { Rustbucket } from '../../../entities/vehicles/Rustbucket';
import { EventBus } from '../../../systems/EventBus';
import type { Controls } from '../../../systems/InputMap';
import { playSfx } from '../../../systems/audio/Sfx';
import { TEX } from '../../preload/assetKeys';
import type { Line } from './Dialogue';
import { RoadScroller } from './RoadScroller';
import type { SetPiece, StoryKit } from './StoryKit';

type Phase = 'drive' | 'pullIn' | 'done';

/** The Rustbucket conversation on the road (who says what). */
export const ROAD_TRIP_LINES: readonly Line[] = [
  { who: 'max', text: "NEXT STOP: THE WORLD'S LARGEST BALL OF YARN! ONLY 300 MILES TO GO!", ms: 2700 },
  { who: 'gwen', text: 'A WHOLE SUMMER IN AN RV WITH MY DWEEB COUSIN. LIVING THE DREAM.', ms: 2600 },
  { who: 'ben', text: 'THIS WATCH HAS MORE ALIENS IN IT. I KNOW IT DOES!', ms: 2300 },
  { who: 'gwen', text: "OR MAYBE IT'S JUST SMARTER THAN YOU.", ms: 1900 },
  { who: 'max', text: 'CAREFUL WITH THAT THING, BEN. SOME THINGS ARE MORE POWERFUL THAN THEY LOOK.', ms: 3000 },
  { who: 'gwen', text: "UH, GRANDPA? FLYING TOASTERS. SIX O'CLOCK.", ms: 2100 },
  { who: 'max', text: "HOLD ON TO SOMETHING! I'M PULLING OFF THE ROAD!", ms: 1900 },
];

/**
 * Chapter 2's opening: the Rustbucket rolling down the highway at golden hour
 * while Max, Gwen and Ben talk (portraits in the box), drones closing in
 * behind. Then a cut: the RV skids into a rest stop and Ben jumps out.
 * Skippable; never replays on a retry or a continue.
 */
export class RoadIntro implements SetPiece {
  private phase: Phase = 'drive';
  private t = 0;
  private readonly steps = new Set<string>();
  private road: RoadScroller | null = null;
  private driveRv: Rustbucket | null = null;
  readonly parked: Rustbucket;
  private readonly fakes: Phaser.GameObjects.GameObject[] = [];
  private readonly parkX: number;
  private readonly roadY: number;

  constructor(
    private readonly kit: StoryKit,
    spec: { parkX: number; parkY: number },
    private readonly onControl: () => void,
  ) {
    this.parkX = spec.parkX * TILE + TILE / 2;
    this.roadY = spec.parkY * TILE;
    this.parked = new Rustbucket(kit.scene, this.parkX, this.roadY);
    if (kit.continuing || kit.startCheckpoint !== null) {
      this.phase = 'done';
      // A retry from the very start still gets the rest stop's welcoming committee.
      if (kit.startCheckpoint === null) kit.scene.time.delayedCall(700, () => this.onControl());
      return;
    }
    this.startDrive();
  }

  get cinematic(): boolean {
    return this.phase !== 'done';
  }

  get storyLock(): boolean {
    return this.phase !== 'done';
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  /** The drive happens on the chase stretch of highway (it's free until the chase). */
  private startDrive(): void {
    const kit = this.kit;
    const chase = kit.level.story?.chase;
    const cx = (chase?.arenaX ?? 278) * TILE;
    const roadY = (chase?.roadY ?? 26) * TILE;
    kit.player.controlsEnabled = false;
    kit.player.visual.setVisible(false);
    kit.setHud(false);
    kit.setLetterbox(true);
    if (kit.backdrop) kit.backdrop.override = 0;
    this.road = new RoadScroller(kit.scene, kit.fx, kit.backdrop, cx, roadY);
    this.road.speed = ROAD.cruiseSpeed;
    this.driveRv = new Rustbucket(kit.scene, cx + 30, roadY);
    this.driveRv.setDriving(true);
    kit.camera.lockTo(cx, roadY - 96);
    kit.camera.snap(cx, roadY - 96 + 62);
    kit.playMusic('highway');
  }

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    if (this.phase === 'done') {
      this.parked.update(realDtMs, this.kit.fx, this.kit.lighting, this.kit.backdrop?.timeOfDay ?? 0);
      return;
    }
    this.t += realDtMs;
    const view = this.kit.scene.cameras.main.worldView;
    if (this.phase === 'drive') {
      this.road?.update(realDtMs, view);
      this.driveRv?.update(realDtMs, this.kit.fx, this.kit.lighting, 0);
      this.updateDrive(controls);
    } else if (this.phase === 'pullIn') {
      this.updatePullIn(controls);
    }
    this.parked.update(realDtMs, this.kit.fx, this.kit.lighting, this.kit.backdrop?.timeOfDay ?? 0);
  }

  private once(id: string, at: number): boolean {
    if (this.t < at || this.steps.has(id)) return false;
    this.steps.add(id);
    return true;
  }

  private updateDrive(controls: Controls): void {
    if (this.once('banner', ROAD_INTRO.bannerAt)) {
      EventBus.emit('hud:banner', { title: 'CHAPTER 2', subtitle: this.kit.level.name, color: PALETTE.omnitrix, durationMs: 2200, style: 'soft' });
    }
    if (this.once('lines', ROAD_INTRO.linesAt)) {
      this.kit.dialogue.play(ROAD_TRIP_LINES, { skippable: true, onDone: () => this.cut() });
    }
    // Two drones swoop in behind the RV for the last lines.
    if (this.once('drones', ROAD_INTRO.linesAt + ROAD_TRIP_LINES.slice(0, 5).reduce((a, l) => a + l.ms, 0))) this.fakeDrones();
    // A skip before the conversation even starts.
    if (this.t > 500 && this.t < ROAD_INTRO.linesAt && (controls.anyPressed || controls.pause)) this.cut();
  }

  private fakeDrones(): void {
    const { scene, fx } = this.kit;
    const view = scene.cameras.main.worldView;
    const rv = this.driveRv;
    if (!rv) return;
    playSfx('alarm', 0.5);
    for (let i = 0; i < 2; i++) {
      const d = scene.add.sprite(view.x - 20, view.y + 70 + i * 34, TEX.scout, 0).setDepth(DEPTH.enemies).play('scout-idle');
      this.fakes.push(d);
      scene.tweens.add({ targets: d, x: view.x + 90 + i * 50, duration: 800 + i * 200, ease: 'Cubic.easeOut' });
      scene.time.delayedCall(1100 + i * 500, () => {
        if (!d.active) return;
        playSfx('laser', 0.5);
        fx.burst('red', rv.x - 60 + i * 40, rv.roofY - 4, 8);
        fx.flash(d.x, d.y, PALETTE.enemy, 14, 140);
      });
    }
  }

  /** Cut to the rest stop: the RV skids in and Ben hops out. */
  private cut(): void {
    if (this.phase !== 'drive') return;
    this.kit.dialogue.stop(false);
    const cam = this.kit.scene.cameras.main;
    cam.fadeOut(ROAD_INTRO.fadeMs, 4, 6, 15);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.clearDrive();
      this.phase = 'pullIn';
      this.t = 0;
      this.steps.clear();
      const kit = this.kit;
      if (kit.backdrop) kit.backdrop.override = null;
      kit.camera.unlock();
      kit.camera.snap(kit.player.x + 40, kit.player.y);
      this.parked.moveTo(this.parkX - 260, this.roadY);
      this.parked.setDriving(true);
      cam.fadeIn(ROAD_INTRO.fadeMs, 4, 6, 15);
      kit.scene.tweens.add({
        targets: this.parked,
        x: this.parkX,
        duration: ROAD_INTRO.pullInMs,
        ease: 'Cubic.easeOut',
        onUpdate: () => this.parked.moveTo(this.parked.x),
        onComplete: () => {
          this.parked.setDriving(false);
          this.parked.setBraking(true);
          kit.fx.burst('dust', this.parkX + 60, this.roadY - 2, 18);
          kit.fx.shake(0.006, 200);
        },
      });
      playSfx('dive', 0.7, 0.5);
    });
  }

  private updatePullIn(controls: Controls): void {
    const kit = this.kit;
    if (controls.anyPressed && this.t > 300 && this.t < ROAD_INTRO.hopOutAt) {
      this.kit.scene.tweens.killTweensOf(this.parked);
      this.parked.moveTo(this.parkX);
      this.parked.setDriving(false);
      this.t = ROAD_INTRO.hopOutAt;
    }
    if (this.once('brake', ROAD_INTRO.pullInMs - 200)) this.parked.setBraking(true);
    if (this.once('hop', ROAD_INTRO.hopOutAt)) {
      const p = kit.player;
      p.teleport(this.parkX + 40, this.roadY);
      p.visual.setVisible(true);
      p.setVelocity(120, -260);
      p.squash(0.8, 1.2);
      kit.fx.burst('dust', p.x, this.roadY, 6);
      kit.speech.show("FLYING TOASTERS? THAT'S MY CUE!", 1900);
      this.parked.setBraking(false);
    }
    if (this.once('control', ROAD_INTRO.controlAt)) {
      this.phase = 'done';
      kit.player.controlsEnabled = true;
      kit.setLetterbox(false);
      kit.setHud(true);
      this.onControl();
    }
  }

  private clearDrive(): void {
    this.road?.destroy();
    this.road = null;
    this.driveRv?.destroy();
    this.driveRv = null;
    for (const f of this.fakes) f.destroy();
    this.fakes.length = 0;
  }

  destroy(): void {
    this.clearDrive();
    this.parked.destroy();
  }
}
