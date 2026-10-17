import { TILE } from '../../../../config/constants';
import { TOWER } from '../../../../config/tower';
import type { MagicPlan } from '../../../../levels/types';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import { SCENES } from '../../../SceneKeys';
import { stepClimber, wallAt, type ClimbInput, type Climber } from '../../../tower/climber';
import { CIRCUMFERENCE, landing, standingOn, topHeight, towerLedges, type Ledge } from '../../../tower/rules';
import type { ClimbFoe, TowerView } from '../../../tower/view';
import type { SetPiece, StoryKit } from '../StoryKit';

type Phase = 'wait' | 'climb' | 'finish' | 'done';

const PROMPT_ID = 'tower-door';
const FOES = 6;

const newFoe = (): ClimbFoe => ({ alive: false, s: 0, h: 0, out: 0, vs: 0, vh: 0 });

/**
 * THE TOWER WRAP. Out of the clock room's door and up the outside of the
 * tower after Hex: ledges spiral up around it, and the tower turns as Ben
 * runs, so his side always faces the camera while the far side curves away
 * and the skyline wheels past behind. Rocklings bowl down the spiral,
 * gargoyles swoop in from behind the tower, the wind Charm throws gusts.
 * A missed jump drops Ben to the turn of the spiral below. TowerScene draws
 * it; this runs it, then hands Ben to the tower top (the boss).
 */
export class TowerClimb implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly view: TowerView;
  private readonly ledges: Ledge[];
  private readonly me: Climber = { s: 0, h: 0, vs: 0, vh: 0, grounded: true };
  private readonly input: ClimbInput = { move: 0, jumpPressed: false, jumpHeld: false, push: 0 };
  private attackMs = 0;
  private graceMs = 0;
  private rocklingIn: number = TOWER.rockling.everyMs[0];
  private gargoyleIn: number = TOWER.gargoyle.firstAfterMs;
  private windIn: number = TOWER.wind.everyMs[0];
  private windMs = 0;
  private asking = false;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: MagicPlan['tower'],
    /** The Spell Engine is jammed (the door out only opens then). */
    private readonly engineDone: () => boolean,
    resumeX: number,
  ) {
    this.ledges = towerLedges();
    this.view = {
      ledges: this.ledges,
      top: topHeight(this.ledges),
      camS: 0,
      camH: 0,
      s: 0,
      h: 0,
      facing: 1,
      pose: 'idle',
      texture: '',
      animPrefix: '',
      originY: 1,
      flash: 0,
      rocklings: Array.from({ length: FOES }, newFoe),
      gargoyles: Array.from({ length: 3 }, newFoe),
      windWarn: 0,
      windDir: 0,
      time: 0,
      done: 0,
    };
    if (resumeX > (spec.x + 2) * TILE) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'finish';
  }

  get storyLock(): boolean {
    return this.phase === 'climb' || this.phase === 'finish';
  }

  update(dtMs: number, realDtMs: number, controls: Controls): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    switch (this.phase) {
      case 'wait': {
        const atDoor = !p.dead && p.grounded && p.x >= this.spec.x * TILE;
        const ready = this.engineDone();
        if (atDoor !== this.asking) {
          this.asking = atDoor;
          if (atDoor && !ready) EventBus.emit('hud:prompt', { id: PROMPT_ID, text: 'THE DOOR WON\'T BUDGE WHILE THE ENGINE IS RUNNING.', priority: 2 });
          else EventBus.emit('hud:promptClear', { id: PROMPT_ID });
        }
        if (atDoor && ready && p.inputEnabled) this.start();
        return;
      }
      case 'climb':
        this.climb(dtMs, controls);
        return;
      case 'finish':
        this.t += realDtMs;
        this.view.done = Math.min(1, this.t / TOWER.finishMs);
        if (this.t >= TOWER.finishMs) this.arrive();
        return;
      default:
        return;
    }
  }

  private start(): void {
    const kit = this.kit;
    this.phase = 'climb';
    this.t = 0;
    EventBus.emit('hud:promptClear', { id: PROMPT_ID });
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.player.visual.setHidden(true);
    kit.omni.omnitrix.setTimerFrozen(true);
    kit.gwen?.leave();
    kit.setWorldHidden(true);
    EventBus.emit('hud:promptMute', { muted: true });
    this.view.s = 20;
    this.view.h = 0;
    this.view.camS = 20;
    this.view.camH = 0;
    this.me.vs = 0;
    this.me.vh = 0;
    this.me.grounded = true;
    this.syncForm();
    kit.scene.scene.launch(SCENES.tower, { view: this.view });
    kit.playMusic('hex');
    EventBus.emit('hud:banner', { title: 'THE TOWER WRAP', subtitle: 'AFTER HEX!', color: 0xb88aff, durationMs: 1500, style: 'soft' });
  }

  private syncForm(): void {
    const form = this.kit.player.form;
    this.view.texture = form.texture;
    this.view.animPrefix = form.animPrefix;
    this.view.originY = (form.frame.feetY + 1) / form.frame.h;
  }

  private climb(dtMs: number, c: Controls): void {
    const v = this.view;
    const dt = dtMs / 1000;
    v.time += dtMs;
    this.syncForm();
    const motor = this.kit.player.form.motor;
    // Aliens keep a little of their own speed and spring (never so much the ledges stop mattering).
    const run = TOWER.runSpeed * Math.min(1.35, Math.max(0.85, motor.runSpeed / 150));
    const jump = TOWER.jumpVelocity * Math.min(1.15, Math.max(0.9, motor.jumpVelocity / 400));
    const move = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (move !== 0) v.facing = move > 0 ? 1 : -1;
    let push = 0;
    if (this.windMs > 0) {
      this.windMs -= dtMs;
      push = v.windDir * TOWER.wind.push;
      if (this.windMs <= 0) v.windDir = 0;
    }
    const me = this.me;
    me.s = v.s;
    me.h = v.h;
    this.input.move = move;
    this.input.jumpPressed = c.jumpPressed;
    this.input.jumpHeld = c.jumpHeld;
    this.input.push = push;
    const step = stepClimber(me, this.input, run, jump, dt, this.ledges);
    v.s = me.s;
    v.h = me.h;
    if (step.jumped) playSfx('jump', 0.7);
    if (step.landed) playSfx('land', 0.5);
    this.attackMs = Math.max(0, this.attackMs - dtMs);
    if (c.attackPressed && this.attackMs <= 0) {
      this.attackMs = TOWER.attack.cooldownMs;
      this.swipe();
    }
    this.graceMs = Math.max(0, this.graceMs - dtMs);
    v.flash = Math.max(0, v.flash - dtMs / 400);
    v.pose = this.attackMs > TOWER.attack.cooldownMs - 160 ? 'attack' : v.flash > 0.6 ? 'hurt' : !me.grounded ? (me.vh > 0 ? 'jump' : 'fall') : move !== 0 ? 'run' : 'idle';
    // The tower turns with Ben; the view rises and falls with him a little behind.
    v.camS = v.s;
    v.camH += (v.h + 40 - v.camH) * (1 - Math.exp(-4 * dt));
    this.updateFoes(dtMs, dt);
    this.updateWind(dtMs);
    if (me.grounded && v.h >= v.top - 0.5) this.reachTop();
  }

  /** A swipe in front of Ben: rocklings and gargoyles there are smashed. */
  private swipe(): void {
    const v = this.view;
    playSfx('swing', 0.8);
    for (const f of [...v.rocklings, ...v.gargoyles]) {
      if (!f.alive) continue;
      const ds = this.wrapDist(f.s - v.s);
      if (Math.sign(ds) !== v.facing && Math.abs(ds) > 6) continue;
      if (Math.abs(ds) > TOWER.attack.reach || Math.abs(f.h - v.h - 10) > 26) continue;
      f.alive = false;
      playSfx(MAGIC_SFX.clunk, 0.9);
      this.kit.fx.hitStop(40);
    }
  }

  private wrapDist(ds: number): number {
    const C = CIRCUMFERENCE;
    return ((((ds + C / 2) % C) + C) % C) - C / 2;
  }

  private updateFoes(dtMs: number, dt: number): void {
    const v = this.view;
    const R = TOWER.rockling;
    this.rocklingIn -= dtMs;
    if (this.rocklingIn <= 0) {
      this.rocklingIn = R.everyMs[0] + Math.random() * (R.everyMs[1] - R.everyMs[0]);
      this.spawnRockling();
    }
    for (const f of v.rocklings) {
      if (!f.alive) continue;
      // Down the spiral: along it, dropping off each step onto the one below
      // (and crumbling against the riser at the far side of a gap).
      f.s -= R.speed * dt;
      if (wallAt(this.ledges, f.s, f.h)) {
        f.alive = false;
        continue;
      }
      const on = standingOn(this.ledges, f.s, f.h);
      if (!on) {
        f.vh = Math.max(-TOWER.maxFall, f.vh - TOWER.gravity * dt);
        const from = f.h;
        f.h += f.vh * dt;
        const hit = landing(this.ledges, f.s, from, f.h);
        if (hit.ledge && f.vh <= 0) {
          f.s += hit.shift;
          f.h = hit.ledge.h;
          f.vh = 0;
        }
      }
      if (f.h < v.h - 200 || this.wrapDist(f.s - v.s) < -TOWER.radius * 2) f.alive = false;
      this.touch(f, R.damage, 10);
    }
    const G = TOWER.gargoyle;
    this.gargoyleIn -= dtMs;
    if (this.gargoyleIn <= 0) {
      this.gargoyleIn = G.everyMs[0] + Math.random() * (G.everyMs[1] - G.everyMs[0]);
      this.spawnGargoyle();
    }
    for (const f of v.gargoyles) {
      if (!f.alive) continue;
      // Swoop at where Ben is, coming round the tower and in off the wall.
      const ds = this.wrapDist(v.s - f.s);
      const dh = v.h + 12 - f.h;
      const len = Math.max(1, Math.hypot(ds, dh));
      f.s += (ds / len) * G.speed * dt;
      f.h += (dh / len) * G.speed * dt;
      f.out = Math.max(0, f.out - 40 * dt);
      if (len < 8) f.alive = false;
      this.touch(f, G.damage, 14);
    }
  }

  private spawnRockling(): void {
    const v = this.view;
    const f = this.view.rocklings.find((r) => !r.alive);
    if (!f) return;
    // A few steps further up the spiral than Ben.
    const ahead = this.ledges.filter((l) => l.h > v.h + TOWER.step.rise * (TOWER.rockling.aheadSteps - 1) && l.h <= v.h + TOWER.step.rise * (TOWER.rockling.aheadSteps + 1));
    const l = ahead[0];
    if (!l) return;
    f.alive = true;
    f.s = l.s1 - 6;
    f.h = l.h;
    f.vh = 0;
    f.out = 0;
    playSfx(MAGIC_SFX.rumble, 0.5);
  }

  private spawnGargoyle(): void {
    const v = this.view;
    const f = this.view.gargoyles.find((g) => !g.alive);
    if (!f) return;
    // From behind the tower, round whichever side Ben is heading toward.
    f.alive = true;
    f.s = v.s + v.facing * TOWER.radius * 1.9;
    f.h = v.h + 70;
    f.out = 30;
    playSfx(MAGIC_SFX.screech, 0.7);
  }

  private touch(f: ClimbFoe, damage: number, size: number): void {
    const v = this.view;
    if (!f.alive || this.graceMs > 0) return;
    if (Math.abs(this.wrapDist(f.s - v.s)) > size || Math.abs(f.h - (v.h + 10)) > size + 10) return;
    f.alive = false;
    this.hurt(damage);
  }

  private hurt(damage: number): void {
    const kit = this.kit;
    const p = kit.player;
    this.graceMs = TOWER.hurtGraceMs;
    this.view.flash = 1;
    // Knocked back along the ledge (never through a riser).
    const back = this.view.s - this.view.facing * 14;
    if (!wallAt(this.ledges, back, this.view.h)) this.view.s = back;
    kit.fx.hitStop(60);
    p.controlsEnabled = true;
    const outcome = p.takeDamage(damage, p.x - 10, 'contact');
    p.controlsEnabled = false;
    kit.onPlayerHurt(outcome);
  }

  private updateWind(dtMs: number): void {
    const v = this.view;
    const W = TOWER.wind;
    if (v.windWarn > 0) {
      v.windWarn += dtMs / W.warnMs;
      if (v.windWarn >= 1) {
        v.windWarn = 0;
        this.windMs = W.gustMs;
        playSfx(MAGIC_SFX.flap, 0.8, 0.5);
      }
      return;
    }
    if (this.windMs > 0) return;
    this.windIn -= dtMs;
    if (this.windIn > 0) return;
    this.windIn = W.everyMs[0] + Math.random() * (W.everyMs[1] - W.everyMs[0]);
    v.windDir = Math.random() < 0.5 ? -1 : 1;
    v.windWarn = 0.001;
  }

  private reachTop(): void {
    this.phase = 'finish';
    this.t = 0;
    playSfx('sumoWin', 0.6, 1.1);
  }

  /** Onto the tower top: the level comes back, and the fight's checkpoint lights. */
  private arrive(): void {
    const kit = this.kit;
    this.phase = 'done';
    kit.scene.scene.stop(SCENES.tower);
    kit.setWorldHidden(false);
    EventBus.emit('hud:promptMute', { muted: false });
    const x = this.spec.endX * TILE + TILE / 2;
    const y = this.spec.endY * TILE;
    kit.player.teleport(x, y);
    kit.player.visual.setHidden(false);
    kit.player.controlsEnabled = true;
    kit.omni.omnitrix.setTimerFrozen(false);
    kit.camera.snap(x, y);
    kit.reachCheckpoint(this.spec.checkpoint);
    kit.gwen?.join(true);
  }

  destroy(): void {
    EventBus.emit('hud:promptClear', { id: PROMPT_ID });
    const s = this.kit.scene.scene;
    if (s.isActive(SCENES.tower) || s.isPaused(SCENES.tower)) s.stop(SCENES.tower);
    if (this.phase === 'climb' || this.phase === 'finish') {
      this.kit.setWorldHidden(false);
      EventBus.emit('hud:promptMute', { muted: false });
    }
  }
}
