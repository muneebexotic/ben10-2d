import { TILE } from '../../../../config/constants';
import { CH4_BEATS } from '../../../../config/kevin';
import { PALETTE } from '../../../../config/palette';
import { Rustbucket } from '../../../../entities/vehicles/Rustbucket';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { chance } from '../../../../systems/Pacing';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import { CITY_ARRIVAL_LINES } from './lines';

type Phase = 'talk' | 'done';

/**
 * Chapter 4's opening, straight out of the Act 1 cliffhanger: the Rustbucket
 * broken down on a run-down Main Street at dusk, hood up and smoking, Max
 * under it; the family talks it over and Ben spots the GAME ZONE. Skippable;
 * never replays on a retry or a continue.
 */
export class CityIntro implements SetPiece {
  private phase: Phase = 'talk';
  private t = 0;
  private bannered = false;
  private talked = false;
  private readonly rv: Rustbucket;
  private readonly floorY: number;

  constructor(
    private readonly kit: StoryKit,
    spec: { x: number; y: number; arcadeX: number },
  ) {
    this.floorY = spec.y * TILE;
    this.rv = new Rustbucket(kit.scene, spec.x * TILE, this.floorY);
    if (kit.continuing || kit.startCheckpoint !== null) {
      this.phase = 'done';
      return;
    }
    kit.player.controlsEnabled = false;
    kit.setHud(false);
    kit.setLetterbox(true);
    kit.camera.lockTo(kit.player.x + 110, this.floorY - 70);
    kit.camera.snap(kit.player.x + 110, this.floorY);
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

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    this.rv.update(realDtMs, this.kit.fx, this.kit.lighting, 0);
    // Smoke from under the hood: ROADBREAKER fried the alternator.
    if (chance(0.15)) this.kit.fx.burst('smoke', this.rv.x + 40, this.floorY - 30, 1);
    if (this.phase === 'done') return;
    this.t += realDtMs;
    const B = CH4_BEATS.intro;
    if (!this.bannered && this.t >= B.bannerAt) {
      this.bannered = true;
      EventBus.emit('hud:banner', { title: 'CHAPTER 4', subtitle: this.kit.level.name, color: PALETTE.kevin, durationMs: 2200, style: 'soft' });
      this.kit.playMusic('arcade');
      playSfx('clang', 0.5, 0.8);
    }
    if (!this.talked && this.t >= B.linesAt) {
      this.talked = true;
      this.kit.dialogue.play(CITY_ARRIVAL_LINES, { skippable: true, onDone: () => this.finish() });
    }
    if (this.t > 500 && this.t < B.linesAt && (controls.anyPressed || controls.pause)) this.finish();
  }

  private finish(): void {
    if (this.phase === 'done') return;
    this.phase = 'done';
    const kit = this.kit;
    kit.dialogue.stop(false);
    kit.camera.unlock();
    kit.player.controlsEnabled = true;
    kit.setLetterbox(false);
    kit.setHud(true);
    kit.speech.show('GAME ZONE, HERE I COME!', 1600);
  }

  destroy(): void {
    this.rv.destroy();
  }
}
