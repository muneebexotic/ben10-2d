import Phaser from 'phaser';
import { DEPTH, FX, TILE } from '../../../../config/constants';
import { CH6_BEATS } from '../../../../config/chapter6';
import type { MagicPlan } from '../../../../levels/types';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import { CH6_TEX } from '../../../preload/karachi/keys';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { MagicActor } from './actors';
import { CAGE_AGAIN_LINES, CAGE_LINES, CAGE_OUT_LINES } from './lines';

type Phase = 'wait' | 'slam' | 'talk' | 'unlock' | 'free' | 'done';

const PROMPT_ID = 'cage-out';

/**
 * Charmcaster's cage, deep in the cellars. Ben walks onto her rune circle and
 * the warded bars slam down behind him; the far bars stop a tile short of
 * the floor, too low for anything the watch has. Charmcaster leaves him to
 * it... and the watch finds new DNA: Grey Matter, small enough to walk out
 * under the bars. (With Grey Matter already on the dial, Ben just picks him.)
 */
export class CharmCage implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly floorY: number;
  private readonly charm: MagicActor;
  private readonly bars: Phaser.GameObjects.TileSprite[] = [];
  private freshUnlock = false;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: MagicPlan['cage'],
    private readonly beat: UnlockBeat | null,
    resumeX: number,
  ) {
    this.floorY = spec.floor * TILE;
    this.charm = new MagicActor(kit, 'charmcaster');
    // The far bars are part of the level (they stop a tile short of the floor): drawn as wards, not stone.
    this.drawBars(spec.toX, spec.floor - 6, 5);
    if (resumeX > spec.toX * TILE) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'slam' || this.phase === 'talk';
  }

  get storyLock(): boolean {
    return this.phase === 'slam' || this.phase === 'talk' || this.phase === 'unlock';
  }

  private drawBars(tx: number, topRow: number, rows: number): void {
    for (let y = topRow; y < topRow + rows; y++) this.kit.world.layer.getTileAt(tx, y)?.setAlpha(0);
    const bars = this.kit.scene.add.tileSprite(tx * TILE, topRow * TILE, TILE, rows * TILE, CH6_TEX.wardBars).setOrigin(0, 0).setDepth(DEPTH.props + 1);
    this.bars.push(bars);
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.charm.update(realDtMs);
    for (const b of this.bars) {
      b.tilePositionY -= realDtMs * 0.02;
      this.kit.lighting.add(b.x + TILE / 2, b.y + b.height / 2, 40, 0xff5ac8, 0.45);
    }
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    this.t += realDtMs;
    const B = CH6_BEATS.cage;
    switch (this.phase) {
      case 'wait':
        if (!p.dead && p.grounded && p.x >= this.spec.triggerX * TILE && p.x < this.spec.toX * TILE) this.trap();
        return;
      case 'slam':
        if (this.t >= B.slamAt) this.slam();
        return;
      case 'talk':
        return;
      case 'free':
        if (p.x > (this.spec.toX + 1) * TILE) this.out();
        return;
      default:
        return;
    }
  }

  private trap(): void {
    const kit = this.kit;
    this.phase = 'slam';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.setLetterbox(true);
    kit.camera.lockTo((this.spec.fromX + this.spec.toX) * TILE * 0.5 - 30, this.floorY - 60);
    this.charm.appear(this.spec.charmX * TILE, this.floorY, 1);
    this.charm.pose(3);
    // Gwen is left outside.
    const gwen = kit.gwen;
    if (gwen?.present) {
      gwen.leave();
      gwen.actor.place((this.spec.fromX - 2) * TILE, this.floorY);
      gwen.actor.face(1);
      gwen.actor.pose('idle');
    }
  }

  private slam(): void {
    const kit = this.kit;
    this.phase = 'talk';
    this.t = 0;
    const rect = { x: this.spec.fromX, y: this.spec.floor - 6, w: 1, h: 6 };
    kit.seal(rect);
    this.drawBars(rect.x, rect.y, rect.h);
    kit.fx.burst('mana', rect.x * TILE + 8, this.floorY - 48, 20);
    kit.fx.shake(FX.shakeLight, 200);
    playSfx(MAGIC_SFX.clang, 1, 0.6);
    const has = this.beat === null || this.beat.done;
    kit.dialogue.play(has ? CAGE_AGAIN_LINES : CAGE_LINES, { skippable: true, onDone: () => this.unlock(has) });
  }

  private unlock(already: boolean): void {
    const kit = this.kit;
    this.charm.vanish();
    this.phase = 'unlock';
    kit.setLetterbox(false);
    kit.camera.unlock();
    EventBus.emit('hud:prompt', { id: PROMPT_ID, text: 'ONLY SOMETHING TINY FITS UNDER THE BARS: {T} GREY MATTER!', priority: 3 });
    if (already || !this.beat) {
      kit.player.controlsEnabled = true;
      this.phase = 'free';
      return;
    }
    this.freshUnlock = true;
    this.beat.start(() => {
      kit.player.controlsEnabled = true;
      this.phase = 'free';
    });
  }

  /** Out under the bars: Gwen catches up. */
  private out(): void {
    const kit = this.kit;
    this.phase = 'done';
    EventBus.emit('hud:promptClear', { id: PROMPT_ID });
    kit.gwen?.actor.hide();
    kit.gwen?.join(true);
    if (this.freshUnlock) kit.dialogue.play(CAGE_OUT_LINES);
  }

  destroy(): void {
    this.charm.destroy();
    for (const b of this.bars) b.destroy();
    EventBus.emit('hud:promptClear', { id: PROMPT_ID });
  }
}
