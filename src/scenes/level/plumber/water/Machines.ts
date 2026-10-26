import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { PLUMBER_SYSTEMS, PLUMBER_WATER } from '../../../../config/chapter7';
import type { EntitySpawn } from '../../../../levels/types';
import { playSfx } from '../../../../systems/audio/Sfx';
import { EventBus } from '../../../../systems/EventBus';
import type { Damageable, Hit, HitResult, Rect } from '../../../../entities/types';
import { PLUMBER_ART } from '../../../preload/cartoon/plumber/baseArt';
import type { StoryKit } from '../../story/StoryKit';
import type { Tanks } from './Tanks';
import { consoleBoot, pumpStart, valveTurn } from './sfx';

type PumpSpawn = Extract<EntitySpawn, { type: 'pump' }>;
type ValveSpawn = Extract<EntitySpawn, { type: 'valve' }>;
type ConsoleSpawn = Extract<EntitySpawn, { type: 'baseConsole' }>;

/** What the story hears when a machine runs. */
export type MachineListener = (id: string, kind: 'pump' | 'valve' | 'console', wakes?: string) => void;

/** One of the base's machines you hit to run: a pump console, the valve wheel, a section's console. */
abstract class BaseMachine implements Damageable {
  readonly countsAsEnemy = false;
  readonly alive = true;
  lastDamage = 0;
  protected readyAt = 0;
  protected readonly box: Rect;

  constructor(
    protected readonly kit: StoryKit,
    readonly id: string,
    protected readonly x: number,
    protected readonly feetY: number,
    w: number,
    h: number,
  ) {
    this.box = { x: x - w / 2, y: feetY - h, w, h };
  }

  hurtbox(out: Rect): boolean {
    if (!this.live) return false;
    out.x = this.box.x;
    out.y = this.box.y;
    out.w = this.box.w;
    out.h = this.box.h;
    return true;
  }

  /** Upgrade can merge into any of them (it runs at once). */
  get hackable(): boolean {
    return this.live;
  }

  /** Still has something to do when hit. */
  protected abstract get live(): boolean;

  takeHit(hit: Hit): HitResult {
    if (!this.live) return 'none';
    const now = this.kit.now();
    if (now < this.readyAt) return 'blocked';
    this.readyAt = now + PLUMBER_SYSTEMS.machineCooldownMs;
    this.lastDamage = hit.damage;
    this.kit.fx.burst('spark', hit.x, hit.y, 6);
    this.run(hit);
    return 'hit';
  }

  protected abstract run(hit: Hit): void;

  abstract update(dtMs: number): void;

  abstract destroy(): void;
}

/** A pump console: any hit (or Upgrade, faster) sends its tanks to their next set of levels. */
class Pump extends BaseMachine {
  private readonly img: Phaser.GameObjects.Image;
  private next = 0;
  private running = false;

  constructor(
    kit: StoryKit,
    private readonly spec: PumpSpawn,
    private readonly tanks: Tanks,
    private readonly listener: MachineListener,
  ) {
    super(kit, spec.id, spec.x * TILE + TILE / 2, spec.y * TILE, 22, 26);
    this.img = kit.scene.add.image(this.x, this.feetY, PLUMBER_ART.machines, 'pump').setOrigin(0.5, 1).setDepth(DEPTH.props);
  }

  protected get live(): boolean {
    return this.next < this.spec.sets.length && !this.running;
  }

  get done(): boolean {
    return this.next >= this.spec.sets.length;
  }

  protected run(hit: Hit): void {
    this.apply(hit.hack ? PLUMBER_WATER.fillSpeed * PLUMBER_SYSTEMS.hackSpeedup : PLUMBER_WATER.fillSpeed);
    playSfx(pumpStart, 1);
    this.kit.fx.shake(0.003, 300);
    EventBus.emit('hud:banner', { title: this.spec.label, subtitle: 'PUMPING', color: 0x6ad8ff, durationMs: 1300, style: 'soft' });
    this.listener(this.id, 'pump');
  }

  private apply(speed: number): void {
    for (const s of this.spec.sets[this.next]) this.tanks.setLevel(s.tank, s.level, speed);
    this.next++;
    this.running = true;
    this.img.setFrame('pumpRun');
  }

  /** A resumed run: this pump already ran `times` (its tanks are set by the caller). */
  restore(times: number): void {
    this.next = Math.min(this.spec.sets.length, times);
    this.running = false;
    this.img.setFrame(this.done ? 'pumpDone' : 'pump');
  }

  update(_dtMs: number): void {
    const view = this.kit.scene.cameras.main.worldView;
    const near = this.x > view.x - 40 && this.x < view.right + 40;
    if (this.running) {
      let settled = true;
      for (const s of this.spec.sets[this.next - 1]) if (!this.tanks.settled(s.tank)) settled = false;
      if (near) this.kit.fx.stream('bubble', this.x + (Math.random() - 0.5) * 16, this.feetY - 6);
      if (settled) {
        this.running = false;
        this.img.setFrame(this.done ? 'pumpDone' : 'pump');
      }
    }
    if (near) {
      const L = PLUMBER_SYSTEMS.screenLight;
      this.kit.lighting.add(this.x, this.feetY - 17, L.radius, this.running ? 0x6ad8ff : this.done ? L.color : 0xff6a5a, L.intensity);
    }
  }

  destroy(): void {
    this.img.destroy();
  }
}

/**
 * The valve wheel: it takes three good turns (any hits; a smash or Upgrade
 * turns it all the way), then the two tanks share their water until level.
 */
class Valve extends BaseMachine {
  private readonly stand: Phaser.GameObjects.Image;
  private readonly wheel: Phaser.GameObjects.Image;
  private turns = 0;
  private spin = 0;
  private opened = false;

  constructor(
    kit: StoryKit,
    private readonly spec: ValveSpawn,
    private readonly tanks: Tanks,
    private readonly listener: MachineListener,
  ) {
    super(kit, spec.id, spec.x * TILE + TILE / 2, spec.y * TILE, 22, 28);
    this.stand = kit.scene.add.image(this.x, this.feetY, PLUMBER_ART.machines, 'valveStand').setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.wheel = kit.scene.add.image(this.x, this.feetY - 22, PLUMBER_ART.machines, 'valve').setDepth(DEPTH.props + 1);
  }

  protected get live(): boolean {
    return !this.opened;
  }

  get open(): boolean {
    return this.opened;
  }

  protected run(hit: Hit): void {
    const full = hit.hack === true || hit.kind === 'smash' || hit.kind === 'tech';
    this.turns = full ? PLUMBER_SYSTEMS.valveTurns : this.turns + 1;
    this.spin += Math.PI * (full ? 2 : 0.7);
    playSfx(valveTurn, 1);
    if (this.turns < PLUMBER_SYSTEMS.valveTurns) {
      this.kit.fx.popText(this.x, this.feetY - 36, `${this.turns}/${PLUMBER_SYSTEMS.valveTurns}`, 0xff8a6a);
      return;
    }
    this.opened = true;
    this.tanks.share(this.spec.a, this.spec.b);
    EventBus.emit('hud:banner', { title: 'VALVE OPEN', subtitle: 'LEVELLING', color: 0xff8a6a, durationMs: 1300, style: 'soft' });
    this.listener(this.id, 'valve');
  }

  restore(open: boolean): void {
    this.opened = open;
    this.turns = open ? PLUMBER_SYSTEMS.valveTurns : 0;
  }

  update(dtMs: number): void {
    // The wheel spins off its momentum (and keeps turning slowly while the water moves).
    const target = this.wheel.rotation + this.spin;
    const step = Math.min(this.spin, (dtMs / 1000) * 9);
    this.spin -= step;
    this.wheel.rotation = target - this.spin;
    if (this.opened && !(this.tanks.settled(this.spec.a) && this.tanks.settled(this.spec.b))) this.wheel.rotation += (dtMs / 1000) * 1.2;
  }

  destroy(): void {
    this.stand.destroy();
    this.wheel.destroy();
  }
}

/** A section's console: dark until it's hit, then the section wakes (the story decides what that means). */
class Console extends BaseMachine {
  private readonly img: Phaser.GameObjects.Image;
  private woken = false;

  constructor(
    kit: StoryKit,
    private readonly spec: ConsoleSpawn,
    private readonly listener: MachineListener,
  ) {
    super(kit, spec.id, spec.x * TILE + TILE / 2, spec.y * TILE, 24, 26);
    this.img = kit.scene.add.image(this.x, this.feetY, PLUMBER_ART.machines, 'consoleDead').setOrigin(0.5, 1).setDepth(DEPTH.props);
  }

  protected get live(): boolean {
    return !this.woken;
  }

  get awake(): boolean {
    return this.woken;
  }

  protected run(): void {
    this.wake();
    playSfx(consoleBoot, 1);
    this.kit.fx.burst('circuit', this.x, this.feetY - 18, 10);
    this.listener(this.id, 'console', this.spec.wakes);
  }

  wake(): void {
    this.woken = true;
    this.img.setFrame('consoleLive');
  }

  update(): void {
    const view = this.kit.scene.cameras.main.worldView;
    if (this.x < view.x - 40 || this.x > view.right + 40) return;
    const L = PLUMBER_SYSTEMS.screenLight;
    if (this.woken) this.kit.lighting.add(this.x, this.feetY - 20, L.radius, L.color, L.intensity);
    else this.kit.lighting.add(this.x, this.feetY - 4, L.radius * 0.6, 0xffc04a, L.intensity * (0.5 + 0.5 * Math.sin(this.kit.now() * 0.006)));
  }

  destroy(): void {
    this.img.destroy();
  }
}

/** Every pump, valve and console in the level, as things to hit. */
export class Machines {
  private readonly pumps = new Map<string, Pump>();
  private readonly valves = new Map<string, Valve>();
  private readonly consoles = new Map<string, Console>();
  private readonly all: BaseMachine[] = [];
  private readonly listeners: MachineListener[] = [];

  constructor(kit: StoryKit, tanks: Tanks) {
    const tell: MachineListener = (id, kind, wakes) => {
      for (const l of this.listeners) l(id, kind, wakes);
    };
    for (const e of kit.level.entities) {
      let m: BaseMachine | null = null;
      if (e.type === 'pump') this.pumps.set(e.id, (m = new Pump(kit, e, tanks, tell)));
      else if (e.type === 'valve') this.valves.set(e.id, (m = new Valve(kit, e, tanks, tell)));
      else if (e.type === 'baseConsole') this.consoles.set(e.id, (m = new Console(kit, e, tell)));
      if (!m) continue;
      this.all.push(m);
      kit.addTarget(m);
    }
  }

  onRun(listener: MachineListener): void {
    this.listeners.push(listener);
  }

  /** Every console woken and every pump run (ALL SYSTEMS GO). */
  get allRun(): boolean {
    for (const p of this.pumps.values()) if (!p.done) return false;
    for (const c of this.consoles.values()) if (!c.awake) return false;
    for (const v of this.valves.values()) if (!v.open) return false;
    return true;
  }

  /** A resumed run: what was already done before this checkpoint. */
  restorePump(id: string, times: number): void {
    this.pumps.get(id)?.restore(times);
  }

  restoreValve(id: string, open: boolean): void {
    this.valves.get(id)?.restore(open);
  }

  wakeConsole(id: string): void {
    this.consoles.get(id)?.wake();
  }

  update(dtMs: number): void {
    for (const m of this.all) m.update(dtMs);
  }

  destroy(): void {
    for (const m of this.all) m.destroy();
    this.listeners.length = 0;
  }
}
