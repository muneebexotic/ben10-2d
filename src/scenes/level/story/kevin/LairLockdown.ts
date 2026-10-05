import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { CH4_BEATS } from '../../../../config/kevin';
import { PALETTE } from '../../../../config/palette';
import { barrierBody } from '../../../../entities/barrier';
import type { Turret } from '../../../../entities/tech/Turret';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { TEX } from '../../../preload/assetKeys';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import type { KevinActor } from './KevinActor';
import type { KevinBuddy } from './KevinBuddy';
import { LAIR_LINES } from './lines';

export interface LairSpec {
  triggerX: number;
  fromX: number;
  toX: number;
  floor: number;
  kevinX: number;
  alien: string;
}

type Phase = 'wait' | 'pinned' | 'beat' | 'fight' | 'done';

/**
 * The LASER LAIR: Kevin's surge overloads the laser tag arena. The entrance
 * seals behind Ben, the tag turrets wake up firing real lasers, and with Ben
 * pinned behind cover the watch finds new DNA: Upgrade. Kevin watches through
 * the glass and goes quiet. Ben leaves through the dead security shutter only
 * Upgrade can open, and Kevin catches up on the other side.
 */
export class LairLockdown implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private wall: Phaser.Physics.Arcade.Image | null = null;
  private readonly wallSprites: Phaser.GameObjects.Sprite[] = [];
  private readonly turrets: Turret[] = [];
  private watched = false;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: LairSpec,
    private readonly beat: UnlockBeat | null,
    private readonly actor: KevinActor,
    private readonly buddy: KevinBuddy,
    resumeX: number,
  ) {
    for (const e of kit.level.entities) {
      if (e.type !== 'turret' || e.x < spec.fromX || e.x > spec.toX) continue;
      const t = kit.machine(e.id) as Turret | undefined;
      if (t) this.turrets.push(t);
    }
    if (resumeX > spec.toX * TILE) {
      this.phase = 'done';
      return;
    }
    // Powered down until the lockdown.
    for (const t of this.turrets) t.sleep();
  }

  get cinematic(): boolean {
    return false;
  }

  get storyLock(): boolean {
    return this.phase === 'pinned' || this.phase === 'beat';
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    for (const s of this.wallSprites) if (s.visible) kit.lighting.add(s.x, s.y, 30, PALETTE.enemy, 0.5);
    if (this.phase === 'wait') {
      if (p.x < this.spec.triggerX * TILE || p.dead) return;
      this.lockdown();
      return;
    }
    this.t += realDtMs;
    if (this.phase === 'pinned' && this.t >= CH4_BEATS.lair.pinnedMs) this.startBeat();
    if (this.phase === 'fight') {
      // The first time he sees Upgrade inside a machine, Kevin goes very quiet.
      if (!this.watched && p.form.id === this.spec.alien && !p.visual.sprite.visible && !kit.dialogue.playing) {
        this.watched = true;
        kit.dialogue.play([LAIR_LINES.watching]);
      }
      if (p.x > (this.spec.toX + 1) * TILE) this.leave();
    }
  }

  private lockdown(): void {
    const kit = this.kit;
    this.phase = 'pinned';
    this.t = 0;
    this.seal();
    for (const t of this.turrets) t.wakeNow();
    playSfx('alarm', 0.8);
    kit.fx.popText(kit.player.x, kit.player.y - 50, 'LOCKDOWN!', PALETTE.enemy, 1.3);
    kit.fx.shake(0.008, 300);
    // Kevin's stuck outside the glass.
    const ax = this.spec.kevinX * TILE + 8;
    if (this.actor.mode === 'hidden' || Math.abs(this.actor.x - ax) > 200) this.actor.appear(ax, this.spec.floor * TILE, 'watch');
    else this.actor.runTo(ax, 160, () => this.actor.face(1));
    this.actor.mode = 'watch';
    kit.dialogue.play([LAIR_LINES.sealed]);
    kit.tutorial.tip('lair-cover', 'GET BEHIND COVER!', 2500, 7);
  }

  /** A wall of red laser light where the entrance was. */
  private seal(): void {
    const kit = this.kit;
    const x = this.spec.fromX * TILE + 4;
    const floorY = this.spec.floor * TILE;
    const top = floorY - 18 * TILE;
    const wall = barrierBody(kit.scene, x + 4, 1, top, floorY);
    kit.scene.physics.add.collider(kit.player.zone, wall);
    this.wall = wall;
    for (let y = top; y < floorY; y += TILE) {
      const s = kit.scene.add.sprite(x, y + 8, TEX.arenaWall, 0).setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD).play('arena-hum');
      s.setScale(1, 0);
      kit.scene.tweens.add({ targets: s, scaleY: 1, duration: 250, delay: (floorY - y) * 1.5 });
      this.wallSprites.push(s);
    }
    playSfx('gateDown', 0.8, 1.2);
  }

  private startBeat(): void {
    const kit = this.kit;
    if (this.beat && !this.beat.done) {
      this.phase = 'beat';
      this.beat.start(() => {
        this.phase = 'fight';
        kit.tutorial.tip('upgrade-lair', '{K}: POUR INTO A TURRET AND TURN IT ON THE OTHERS!', 6000, 9);
      });
      return;
    }
    // A replay: Upgrade's already on the dial.
    this.phase = 'fight';
    kit.tutorial.tip('upgrade-lair', 'UPGRADE: {K} TO POUR INTO A TURRET!', 5000, 8);
  }

  /** Out through the shutter: Kevin catches up, buzzing with questions. */
  private leave(): void {
    this.phase = 'done';
    this.buddy.join(true);
    this.kit.scene.time.delayedCall(600, () => this.kit.dialogue.play([LAIR_LINES.out]));
  }

  destroy(): void {
    this.wall?.destroy();
    for (const s of this.wallSprites) s.destroy();
  }
}
