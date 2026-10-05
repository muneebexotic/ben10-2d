import { TILE } from '../../../../config/constants';
import { CH4_BEATS } from '../../../../config/kevin';
import { PALETTE } from '../../../../config/palette';
import type { Controls } from '../../../../systems/InputMap';
import { music } from '../../../../systems/audio/Music';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { KevinActor } from './KevinActor';
import { DRAIN_AFTER, DRAIN_LINES } from './lines';

export interface DrainSpec {
  triggerX: number;
  fromX: number;
  toX: number;
}

type Phase = 'wait' | 'drink' | 'done';

/**
 * Rosewood station on Line 11: Kevin kneels at the platform edge and drinks
 * the third rail. The trains stop, the station's lights die bank by bank,
 * and he gets greedier with every gulp ("...SAYS WHO?"). Then he runs ahead
 * into the dark, and Ben follows by the light of his watch.
 */
export class Drain implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private banks = 0;
  private enteredStation = false;
  private readonly floorY: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: DrainSpec,
    private readonly actor: KevinActor,
    resumeX: number,
  ) {
    this.floorY = kit.world.groundBelow(spec.triggerX * TILE + 40, 25 * TILE);
    if (resumeX > spec.fromX * TILE) this.enteredStation = true;
    if (resumeX > spec.triggerX * TILE) {
      this.phase = 'done';
      this.blackout(true);
    }
  }

  get cinematic(): boolean {
    return this.phase === 'drink';
  }

  get storyLock(): boolean {
    return this.phase === 'drink';
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    const kit = this.kit;
    const p = kit.player;
    if (!this.enteredStation && p.x >= this.spec.fromX * TILE) {
      // Down the stairs: the music goes underground.
      this.enteredStation = true;
      kit.playMusic('subway');
    }
    if (this.phase === 'done') return;
    if (this.phase === 'wait') {
      if (p.x < this.spec.triggerX * TILE || p.dead || !p.grounded) return;
      this.begin();
      return;
    }
    this.t += realDtMs;
    // The lights die bank by bank while he drinks, nearest first.
    const D = CH4_BEATS.drain;
    const due = Math.min(D.banks, Math.floor(this.t / D.gulpEveryMs));
    while (this.banks < due) {
      this.banks++;
      const span = (this.spec.toX - this.spec.fromX) * TILE;
      const reach = (span * this.banks) / D.banks;
      const cx = this.actor.x;
      kit.powerOff(cx - reach, cx + reach);
      playSfx('lightClunk', 1, 1 - this.banks * 0.06);
      kit.fx.shake(0.003, 120);
      if (this.banks === D.banks) this.blackout(false);
    }
  }

  private begin(): void {
    const kit = this.kit;
    this.phase = 'drink';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.player.setInvulnerable(15000);
    kit.setLetterbox(true);
    music.setIntensity(0);
    // Kevin's at the platform edge, a hand on the live rail.
    const kx = kit.player.x + 56;
    const ky = this.floorY;
    if (this.actor.mode === 'hidden') this.actor.appear(kx, ky, 'scripted');
    else this.actor.mode = 'scripted';
    this.actor.runTo(kx, 170, () => {
      this.actor.face(-1);
      this.actor.drink(kx - 6, 38 * TILE - 4, 6000);
      kit.fx.burst('blue', kx - 6, 38 * TILE - 4, 14);
    });
    kit.camera.lockTo(kx - 20, ky - 50);
    kit.setTrains(false);
    playSfx('powerSurge', 0.8, 0.7);
    kit.dialogue.play(DRAIN_LINES, { skippable: true, onDone: () => this.finish() });
  }

  /** Every light in the station's gone (and the trains with them). */
  private blackout(instant: boolean): void {
    const kit = this.kit;
    const from = this.spec.fromX * TILE;
    const to = this.spec.toX * TILE;
    kit.setDarkness({ fromX: from, toX: to });
    kit.powerOff(from, to);
    kit.setTrains(false);
    if (!instant) playSfx('powerDown', 1, 0.7);
  }

  private finish(): void {
    if (this.phase !== 'drink') return;
    this.phase = 'done';
    const kit = this.kit;
    this.blackout(this.banks >= CH4_BEATS.drain.banks);
    this.actor.glow = 1;
    kit.camera.unlock();
    kit.setLetterbox(false);
    kit.player.controlsEnabled = true;
    kit.player.setInvulnerable(600);
    music.setIntensity(1);
    kit.dialogue.play([DRAIN_AFTER]);
    kit.fx.popText(this.actor.x, this.actor.feetY - 46, 'HAHA!', PALETTE.kevin);
    // He runs on ahead into the dark, to the end of the platform, and drops out of sight.
    let end = this.actor.x;
    while (end < this.actor.x + 22 * TILE && Math.abs(kit.world.groundBelow(end + TILE, this.floorY - 8) - this.floorY) < 2) end += TILE;
    this.actor.runTo(end, 210, () => {
      kit.fx.burst('volt', this.actor.x, this.actor.feetY - 16, 10);
      this.actor.hide();
    });
  }

  destroy(): void {
    // The darkness belongs to the level.
  }
}
