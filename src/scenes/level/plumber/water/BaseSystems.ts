import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { PLUMBER_SYSTEMS } from '../../../../config/chapter7';
import { PLUMBER_DECOR } from '../../../../levels/chapter7Decor';
import type { EntitySpawn } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { PLUMBER_ART } from '../../../preload/cartoon/plumber/baseArt';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import { Doors } from './Doors';
import { Machines } from './Machines';
import { Tanks } from './Tanks';
import { lightsThud } from './sfx';

/** A stretch of the base whose lamps go on and off together (tiles). */
export interface LampSection {
  id: string;
  from: number;
  to: number;
}

type LampState = 'off' | 'on' | 'emergency';

/** The base's lamp circuits (tiles), as the story wakes or kills them. */
export const LAMP_SECTIONS: readonly LampSection[] = [
  { id: 'bay', from: 0, to: 24 },
  { id: 'ring', from: 24, to: 58 },
  { id: 'hub', from: 58, to: 67 },
  { id: 'flooded', from: 67, to: 150 },
  { id: 'reactor', from: 150, to: 183 },
  { id: 'pumphall', from: 263, to: 342 },
  { id: 'containment', from: 342, to: 410 },
  { id: 'moonpool', from: 410, to: 472 },
];

interface Lamp {
  x: number;
  y: number;
  section: number;
}

/**
 * The Plumber base's working parts as one set piece: its water (the tanks every
 * form swims in), the doors and machines that move it or depend on it, the
 * lamps by circuit, and the intake grate outside. Story beats reach these
 * through it. A resumed run starts with everything already done behind it.
 */
export class BaseSystems implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  readonly tanks: Tanks;
  readonly doors: Doors;
  readonly machines: Machines;
  private readonly lamps: Lamp[] = [];
  private readonly lampState: LampState[] = LAMP_SECTIONS.map(() => 'on');
  private readonly grates: Phaser.GameObjects.Image[] = [];
  private nextBite = 0;
  private t = 0;

  constructor(
    private readonly kit: StoryKit,
    resumeX: number,
  ) {
    this.tanks = new Tanks(kit.scene, kit.level, kit.fx, (tx, ty) => !kit.world.isSolid(tx * TILE + 1, ty * TILE + 1));
    kit.setWater(this.tanks);
    this.doors = new Doors(kit, this.tanks);
    this.machines = new Machines(kit, this.tanks);
    for (const d of PLUMBER_DECOR) {
      if (d.key !== PLUMBER_ART.props || d.frame !== 'lamp') continue;
      const section = LAMP_SECTIONS.findIndex((s) => d.x >= s.from && d.x < s.to);
      if (section >= 0) this.lamps.push({ x: d.x * TILE + TILE / 2, y: d.y * TILE + 10, section });
    }
    for (const e of kit.level.entities) {
      if (e.type !== 'current' || !e.intake) continue;
      // The intake's grate, at its mouth.
      const x = (e.x + e.w / 2) * TILE;
      const y = e.vy > 0 ? (e.y + e.h) * TILE : e.y * TILE;
      this.grates.push(kit.scene.add.image(x, y, PLUMBER_ART.machines, 'grate').setOrigin(0.5, e.vy > 0 ? 1 : 0).setDepth(DEPTH.terrain + 1));
    }
    this.restore(resumeX);
  }

  /** A lamp circuit goes on, off, or to its red emergency lights. */
  setLamps(id: string, state: LampState, thud = true): void {
    const i = LAMP_SECTIONS.findIndex((s) => s.id === id);
    if (i < 0 || this.lampState[i] === state) return;
    this.lampState[i] = state;
    if (thud && state === 'on') playSfx(lightsThud, 1);
  }

  lampsOf(id: string): LampState {
    const i = LAMP_SECTIONS.findIndex((s) => s.id === id);
    return i < 0 ? 'off' : this.lampState[i];
  }

  /** Everything a run resumed past `resumeX` (px) would already have done: the doors, the valve, the pumps, the flood. */
  private restore(resumeX: number): void {
    const past = (tileX: number) => resumeX > tileX * TILE;
    const plan = this.kit.level.story?.plumber;
    if (!plan) return;
    if (past(plan.dock.capsuleX + 2)) this.doors.set(plan.dock.hatch, true, true);
    for (const e of this.kit.level.entities) {
      // A section stays dark until its console is woken.
      if (e.type === 'baseConsole') {
        if (past(e.x)) this.machines.wakeConsole(e.id);
        else this.setLamps(e.wakes, 'off', false);
      }
      if (e.type === 'valve' && past(e.x + 2)) {
        this.machines.restoreValve(e.id, true);
        this.shareNow(e);
      }
    }
    if (past(plan.ring.hubX)) this.doors.set(plan.ring.hubHatch, true, true);
    // The pump hall, pump by pump (each one a checkpoint further on).
    const pumps = plan.pumps
      .map((id) => this.kit.level.entities.find((e) => e.type === 'pump' && e.id === id))
      .filter((e): e is Extract<EntitySpawn, { type: 'pump' }> => e !== undefined);
    for (const p of pumps) {
      if (!past(p.x + 1)) break;
      this.machines.restorePump(p.id, p.sets.length);
      for (const set of p.sets) for (const s of set) this.tanks.snapLevel(s.tank, s.level);
    }
    this.tanks.rebuildOpen();
    this.doors.settle();
  }

  private shareNow(v: Extract<EntitySpawn, { type: 'valve' }>): void {
    this.tanks.share(v.a, v.b);
    for (const id of [v.a, v.b]) {
      const t = this.tanks.get(id);
      if (t) this.tanks.snapLevel(id, t.target / TILE);
    }
  }

  update(dtMs: number, _realDtMs: number, _controls: Controls): void {
    this.t += dtMs;
    const view = this.kit.scene.cameras.main.worldView;
    this.tanks.update(dtMs, view);
    this.doors.update(dtMs);
    this.machines.update(dtMs);
    this.updateLamps(view);
    this.updateIntake();
  }

  private updateLamps(view: Phaser.Geom.Rectangle): void {
    const L = PLUMBER_SYSTEMS.lampLight;
    const E = PLUMBER_SYSTEMS.emergencyLight;
    const pulse = 0.6 + 0.4 * Math.sin(this.t * E.pulse);
    for (const l of this.lamps) {
      if (l.x < view.x - L.radius || l.x > view.right + L.radius) continue;
      const s = this.lampState[l.section];
      if (s === 'on') this.kit.lighting.add(l.x, l.y + L.drop, L.radius, L.color, L.intensity);
      else if (s === 'emergency') this.kit.lighting.add(l.x, l.y + L.drop, E.radius, E.color, E.intensity * pulse);
    }
  }

  /** The intake's grate bites anyone pulled onto it. */
  private updateIntake(): void {
    const p = this.kit.player;
    if (p.dead || this.kit.now() < this.nextBite) return;
    if (!this.tanks.atIntake(p.x, p.centerY)) return;
    this.nextBite = this.kit.now() + PLUMBER_SYSTEMS.intakeEveryMs;
    const outcome = p.takeDamage(PLUMBER_SYSTEMS.intakeDamage, p.x, 'contact');
    this.kit.onPlayerHurt(outcome);
    this.kit.fx.burst('bubble', p.x, p.centerY, 8);
  }

  destroy(): void {
    this.kit.setWater(null);
    this.doors.destroy();
    this.machines.destroy();
    this.tanks.destroy();
    for (const g of this.grates) g.destroy();
  }
}
