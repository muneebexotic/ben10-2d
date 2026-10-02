import Phaser from 'phaser';
import { CHASE } from '../../../../config/chapter2';
import { DEPTH } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import { TEX } from '../../../preload/assetKeys';
import { blinkOn } from '../../../../systems/Accessibility';
import { activeDifficultyId } from '../../../../systems/Difficulty';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { StoryKit } from '../StoryKit';
import type { ChaseRig } from './ChaseRig';

const R = CHASE.ride;

function between(range: readonly [number, number]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}

/** Who says what while the RV gets up to speed (ms into the ride). */
const RIDE_LINES = [
  { at: 300, who: 'max', text: 'EVERYBODY HOLD ON! BEN, KEEP THOSE THINGS OFF MY ROOF!', ms: 2600 },
  { at: 8200, who: 'gwen', text: "YOU'RE ON THE ROOF OF A MOVING RV. MOM WOULD FREAK.", ms: 2400 },
  { at: 15500, who: 'ben', text: 'BEST. SUMMER. EVER!', ms: 1600 },
] as const;

/**
 * The ride before the convoy: drone waves swoop at the roof, tires come
 * bouncing over it, and the odd pothole tosses everyone into the air.
 * Ends once enough time has passed and the sky is clear (or it runs long).
 */
export class RideStage {
  private t = 0;
  private wave = 0;
  private line = 0;
  private nextTire: number = R.tires.firstMs;
  private nextPothole: number = R.potholes.firstMs;
  private hole: Phaser.GameObjects.Image | null = null;
  private holeHit = false;
  private warnedPothole = false;

  constructor(
    private readonly kit: StoryKit,
    private readonly rig: ChaseRig,
  ) {}

  get done(): boolean {
    if (this.t >= R.maxMs) return true;
    return this.t >= R.minMs && this.wave >= R.waves.length && this.rig.aliveDrones === 0;
  }

  update(dtMs: number): void {
    this.t += dtMs;
    this.updateLines();
    this.updateWaves();
    this.updateTires();
    this.updatePothole(dtMs);
  }

  private updateLines(): void {
    const next = RIDE_LINES[this.line];
    if (!next || this.t < next.at) return;
    this.line++;
    if (next.who === 'ben') this.kit.speech.show(next.text, next.ms);
    else this.kit.dialogue.say(next.who, next.text, next.ms);
  }

  private updateWaves(): void {
    const w = R.waves[this.wave];
    if (!w || this.t < w.at) return;
    const extra = activeDifficultyId() === 'hard' ? R.hardExtra[this.wave] : undefined;
    this.wave++;
    const spawns = extra ? [...w.spawns, extra] : w.spawns;
    spawns.forEach((s, i) => this.rig.spawnDrone(s.kind, w.from, s.dx, s.dy, i));
    playSfx('buzz', 1, 0.8);
  }

  private updateTires(): void {
    if (this.t < this.nextTire || this.t > R.maxMs - 2000) return;
    this.nextTire = this.t + between(R.tires.everyMs);
    const rv = this.rig.rv;
    const view = this.kit.scene.cameras.main.worldView;
    // Aimed near Ben, never dead on the rails.
    const landX = Phaser.Math.Clamp(this.kit.player.x + (Math.random() - 0.5) * 70, rv.roofLeft + 18, rv.roofRight - 18);
    this.rig.spawnJunk('tire', { x: view.right + 24, y: rv.roofY - 70 - Math.random() * 50 }, landX);
  }

  private updatePothole(dtMs: number): void {
    const rv = this.rig.rv;
    const frontWheel = rv.x + 62;
    const P = R.potholes;
    if (!this.hole && this.t >= this.nextPothole) {
      this.nextPothole = this.t + between(P.everyMs);
      const x = frontWheel + (this.rig.roadSpeed * P.warnMs) / 1000;
      this.hole = this.kit.scene.add.image(x, rv.roadY - 3, TEX.pothole).setDepth(DEPTH.terrain + 3);
      this.holeHit = false;
      if (!this.warnedPothole) {
        this.warnedPothole = true;
        this.kit.dialogue.say('max', 'POTHOLE! HOLD ON TO YOUR SNEAKERS!', 1500);
      }
    }
    const hole = this.hole;
    if (!hole) return;
    hole.x -= (this.rig.roadSpeed * dtMs) / 1000;
    const view = this.kit.scene.cameras.main.worldView;
    if (!this.holeHit) {
      // Warning chevrons at the screen edge, at road level, until it's in view.
      if (hole.x > view.right - 20 && blinkOn(this.kit.now(), 140)) {
        const ax = view.right - 10;
        const ay = rv.roadY - 8;
        this.kit.telegraph.line(ax, ay - 5, ax - 6, ay, PALETTE.fire1, 1, 2);
        this.kit.telegraph.line(ax - 6, ay, ax, ay + 5, PALETTE.fire1, 1, 2);
      }
      if (hole.x <= frontWheel) {
        this.holeHit = true;
        this.rig.pothole(P.kick);
      }
    }
    if (hole.x < view.x - 40) {
      hole.destroy();
      this.hole = null;
    }
  }

  destroy(): void {
    this.hole?.destroy();
    this.hole = null;
  }
}
