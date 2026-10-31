import { DEPTH, TILE } from '../../../../config/constants';
import { CH7_BEATS } from '../../../../config/chapter7';
import { PALETTE } from '../../../../config/palette';
import type { EntitySpawn, PlumberPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { TEX } from '../../../preload/assetKeys';
import { MAX_FRAME, MAX_FRAMES } from '../../../preload/family';
import { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import { consoleBoot } from '../water/sfx';
import type { BaseSystems } from '../water/BaseSystems';
import { HUB_UP, LOCKDOWN, LOCKER_LINES, REVEAL_LINES, RING_LINES, SCAN_TEXT, SPLIT_LINES } from './lines';

type Phase = 'bay' | 'reveal' | 'ring' | 'hub' | 'split' | 'done';

/**
 * The docking ring (GAME_DESIGN.md, Chapter 7, beats 4 and 5): Max comes
 * clean in the bay and opens its hatch with his badge; the ring's lights thud
 * on at its console; his old locker; the sentries don't know his code; Gwen
 * walks with Ben the whole way. At the control hub Max and Gwen stay to bring
 * the base back (Max at the side of the console's dais): the hub wakes, its
 * hatch opens, and Ben goes on alone over the dais.
 *
 * Max and Gwen walk at their drawings' own pace (CH7_BEATS.ring), so their
 * feet stay planted. A run resumed past a beat starts with it done.
 */
export class DockingRing implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private phase: Phase = 'bay';
  private readonly max: FamilyActor;
  private readonly floorY: number;
  private talked = false;
  private ringLit = false;
  private lockerDone = false;
  private lockdownDone = false;
  /** Game-time beats waiting to fire (the lockdown's call and answer, the scan). */
  private readonly timers: Array<{ at: number; fn: () => void }> = [];
  /** Gwen joins Ben on the first update (the level hands the kit her after the story is built). */
  private gwenAt: number | null = null;

  constructor(
    private readonly kit: StoryKit,
    private readonly base: BaseSystems,
    private readonly plan: PlumberPlan,
    resumeX: number,
  ) {
    const look = { texture: TEX.max, prefix: 'max', frameWidth: MAX_FRAME.w, frameHeight: MAX_FRAME.h, feetY: MAX_FRAME.feetY, frames: MAX_FRAMES, handHeight: 18 };
    this.max = new FamilyActor(kit.scene, look, DEPTH.player - 2);
    this.floorY = plan.ring.floor * TILE;
    const R = CH7_BEATS.ring;
    const ring = plan.ring;
    base.machines.onRun((id) => {
      if (id === 'c-ring') this.ringWoke();
    });
    if (resumeX >= ring.hubX * TILE) {
      // Max and Gwen are already at the hub, out of sight.
      this.phase = 'done';
      return;
    }
    if (resumeX > ring.revealX * TILE) {
      // A checkpoint in the ring: Max at his locker, Gwen at Ben's side.
      this.talked = true;
      this.ringLit = base.lampsOf('ring') === 'on';
      this.lockerDone = resumeX > ring.lockerX * TILE;
      this.lockdownDone = resumeX > ring.lockdownX * TILE;
      this.max.place(this.lockerDoneX(), this.floorY);
      this.max.face(1);
      this.phase = 'ring';
      this.gwenAt = kit.player.x - 24;
      return;
    }
    const p = kit.player;
    this.max.place(p.x + R.maxStart, this.floorY);
    this.max.face(1);
    this.gwenAt = p.x + R.gwenStart;
  }

  private get hatchX(): number {
    const hatch = this.kit.level.entities.find((e): e is Extract<EntitySpawn, { type: 'hatch' }> => e.type === 'hatch' && e.id === this.plan.dock.hatch);
    return (hatch?.x ?? 24) * TILE;
  }

  /** Where Max waits once the locker's done: at it (the card's shelf is above). */
  private lockerDoneX(): number {
    return this.plan.ring.lockerX * TILE - CH7_BEATS.ring.lockerGap;
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    const kit = this.kit;
    const now = kit.now();
    for (let i = this.timers.length - 1; i >= 0; i--) {
      if (now < this.timers[i].at) continue;
      const t = this.timers[i];
      this.timers.splice(i, 1);
      t.fn();
    }
    if (this.phase === 'done') return;
    this.placeGwen();
    this.max.update(realDtMs);
    const p = kit.player;
    const ring = this.plan.ring;
    const R = CH7_BEATS.ring;
    switch (this.phase) {
      case 'bay':
        if (p.x >= ring.revealX * TILE) this.reveal();
        break;
      case 'reveal':
        if (this.talked && !this.max.moving && !kit.dialogue.playing) this.scan();
        break;
      case 'ring': {
        const talking = kit.dialogue.playing;
        // His locker once he's there (he hurries), unless Ben has gone on through the sentries.
        if (!this.lockerDone && p.x > (ring.lockdownX + 6) * TILE) this.lockerDone = true;
        if (!this.lockerDone && p.x >= (ring.lockerX - 2) * TILE && !this.max.moving && !talking) this.locker();
        else if (!this.lockdownDone && p.x >= ring.lockdownX * TILE && (!talking || p.x > (ring.lockdownX + 8) * TILE)) this.lockdown();
        if (p.x >= (ring.hubX - 4) * TILE) this.toHub();
        break;
      }
      case 'hub':
        if (!this.max.moving && !kit.dialogue.playing) this.split();
        break;
      case 'split':
        if (p.x > (ring.hubX + R.leaveTiles) * TILE) {
          this.max.hide();
          this.gwenActor()?.hide();
          this.phase = 'done';
        }
        break;
    }
  }

  private gwenActor(): FamilyActor | null {
    return this.kit.gwen?.actor ?? null;
  }

  private placeGwen(): void {
    const g = this.kit.gwen;
    if (!g || this.gwenAt === null) return;
    g.join(false, this.gwenAt);
    this.gwenAt = null;
  }

  /** The bay: Max comes clean, walking to the hatch while he talks. */
  private reveal(): void {
    const kit = this.kit;
    this.phase = 'reveal';
    kit.dialogue.play(REVEAL_LINES, { onDone: () => (this.talked = true) });
    this.max.runTo(this.hatchX - CH7_BEATS.ring.hatchGap, CH7_BEATS.ring.maxWalk, () => this.max.face(1), 'walk');
  }

  /** His badge to the hatch: a green scan reads it and the bay opens. */
  private scan(): void {
    const kit = this.kit;
    this.phase = 'ring';
    const x = this.hatchX;
    const y = this.floorY - 22;
    this.max.face(1);
    kit.fx.flash(x - 4, y, PALETTE.plumber, 30, 400, 0.8);
    kit.fx.popText(x - 10, this.floorY - 52, SCAN_TEXT, PALETTE.plumber, 0.8);
    playSfx(consoleBoot, 0.9);
    this.after(CH7_BEATS.ring.scanMs, () => {
      this.base.doors.set(this.plan.dock.hatch, true);
      // He can't wait to see his old locker.
      this.max.runTo(this.lockerDoneX(), CH7_BEATS.ring.maxHurry, () => this.max.face(1), 'walk');
    });
  }

  /** Ben woke the ring's console: the lights thud on (BaseSystems), and Max is pleased. */
  private ringWoke(): void {
    if (this.ringLit || this.phase === 'done') return;
    this.ringLit = true;
    if (!this.kit.dialogue.playing) this.kit.dialogue.play(RING_LINES);
  }

  private locker(): void {
    this.lockerDone = true;
    this.max.face(1);
    this.kit.dialogue.play(LOCKER_LINES);
  }

  /** The sentries wake to a code twenty years out of date. */
  private lockdown(): void {
    const kit = this.kit;
    this.lockdownDone = true;
    const over = () => {
      const p = kit.player;
      const s = kit.nearestEnemy(p.x + 80, p.y - 40, 260);
      return s ?? { x: p.x + 90, y: p.y - 60 };
    };
    const shout = (text: string) => {
      const s = over();
      kit.fx.popText(s.x, s.y - 18, text, PALETTE.enemy, 0.9);
    };
    shout(LOCKDOWN.intruder);
    this.after(900, () => kit.dialogue.play(LOCKDOWN.code, { onDone: () => {
      shout(LOCKDOWN.expired);
      this.after(1100, () => kit.dialogue.play(LOCKDOWN.after));
    } }));
  }

  /** Ben's at the hub: Max hurries up if he's fallen behind, and Gwen goes to him. */
  private toHub(): void {
    const kit = this.kit;
    const R = CH7_BEATS.ring;
    const hub = this.plan.ring.hubX * TILE;
    this.phase = 'hub';
    const view = kit.scene.cameras.main.worldView;
    if (!this.max.visible || this.max.x < view.x - 10) this.max.place(view.x - 24, this.floorY);
    this.max.runTo(hub + R.hubMax, R.maxHurry, () => this.max.face(1), 'walk');
    const g = kit.gwen;
    if (g) {
      const x = g.actor.visible ? g.actor.x : kit.player.x - 30;
      g.leave();
      g.actor.place(x, this.floorY, 'scripted');
      g.actor.runTo(hub + R.hubGwen, R.gwenRun, () => g.actor.face(1));
    }
  }

  /** At the hub: the split; Max works the console, the hub wakes and its hatch opens. */
  private split(): void {
    const kit = this.kit;
    this.phase = 'split';
    this.max.face(1);
    kit.dialogue.play(SPLIT_LINES, {
      onDone: () => {
        this.max.sprite.setData('hdClip', 'console');
        this.base.wakeConsole('c-hub', 'hub');
        playSfx(consoleBoot, 1);
        kit.fx.burst('circuit', this.max.x + 12, this.floorY - 20, 10);
        this.base.doors.set(this.plan.ring.hubHatch, true);
        kit.dialogue.play(HUB_UP);
      },
    });
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push({ at: this.kit.now() + ms, fn });
  }

  destroy(): void {
    this.timers.length = 0;
    this.max.destroy();
  }
}
