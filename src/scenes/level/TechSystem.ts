import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { MachineHandle } from '../../aliens/types';
import type { Player } from '../../entities/Player';
import { overlaps, type Rect } from '../../entities/types';
import { Cabinet, SumoCabinet } from '../../entities/tech/Cabinet';
import { Lift } from '../../entities/tech/Lift';
import type { Machine, TechDeps } from '../../entities/tech/Machine';
import { RailCart } from '../../entities/tech/RailCart';
import { TechDoor } from '../../entities/tech/TechDoor';
import { Trains } from '../../entities/tech/Trains';
import { Turret } from '../../entities/tech/Turret';
import type { LevelData } from '../../levels/types';
import { chance } from '../../systems/Pacing';
import { pixelText } from '../../ui/text';
import type { Combat } from './Combat';

export interface TechSystemDeps extends TechDeps {
  level: LevelData;
  combat: Combat;
  playerBody: Player;
  /** Where play resumes (px), 0 from the start: hostile turrets behind it stay quiet. */
  resumeX: number;
  /** A hostile turret was wrecked (kill credit). */
  onKill(): void;
  /** The SUMO SLAMMERS cabinet wants its mini-game run. */
  playSumo(done: (won: boolean) => void): void;
  /** The SUMO SLAMMERS high score fell: pay out `reward`. */
  onSumoWon(reward: string, x: number, y: number): void;
}

/**
 * Every machine in a level (Chapter 4 on): security shutters, turrets, lifts,
 * rail carts, arcade cabinets, the SUMO SLAMMERS cabinet and the subway
 * trains. Upgrade's puddle asks `merge` for whatever it touches; the rest is
 * the machines' own business. A pulsing outline and a {K} badge show what
 * Upgrade can merge with when he's close.
 */
export class TechSystem {
  readonly machines: Machine[] = [];
  readonly turrets: Turret[] = [];
  readonly trains: Trains[] = [];
  private readonly box: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private readonly outline: Phaser.GameObjects.Graphics;
  private readonly badge: Phaser.GameObjects.BitmapText;
  private readonly railSpans: Array<{ x: number; w: number; y: number }> = [];

  constructor(private readonly d: TechSystemDeps) {
    const { scene, level, combat, playerBody } = d;
    const collide = (body: Phaser.Physics.Arcade.Image | null) => {
      if (body) scene.physics.add.collider(playerBody.zone, body);
    };
    for (const e of level.entities) {
      switch (e.type) {
        case 'techDoor': {
          const door = new TechDoor(d, e.id, e.x, e.y, e.w, e.h);
          collide(door.body);
          this.machines.push(door);
          break;
        }
        case 'turret': {
          const t = new Turret(d, e.id, e.x, e.y, e.hostile && !(d.resumeX > 0 && e.x * TILE < d.resumeX - TILE), e.ceiling ?? false, e.facing ?? -1);
          t.onWrecked = () => d.onKill();
          combat.addTarget(t);
          this.turrets.push(t);
          this.machines.push(t);
          break;
        }
        case 'lift': {
          const lift = new Lift(d, e.id, e.x, e.y, e.w, e.toY);
          collide(lift.body);
          this.machines.push(lift);
          break;
        }
        case 'cart': {
          const cart = new RailCart(d, e.id, e.x, e.y, e.toX, e.barrier);
          collide(cart.body);
          collide(cart.barrierCollider);
          this.machines.push(cart);
          break;
        }
        case 'cabinet':
          this.machines.push(new Cabinet(d, e.id, e.x, e.y, e.frame ?? 0, e.flip ?? false));
          break;
        case 'sumo': {
          const sumo = new SumoCabinet(d, e.id, e.x, e.y);
          sumo.onPlay = (done) => d.playSumo(done);
          sumo.onWon = () => d.onSumoWon(e.reward, sumo.prizeX, e.y * TILE - 56);
          this.machines.push(sumo);
          break;
        }
        case 'trains': {
          const tr = new Trains(d, e.fromX, e.toX, e.y, e.everyMs, e.firstMs);
          combat.addHazard(tr);
          this.trains.push(tr);
          break;
        }
        default:
          break;
      }
    }
    for (const w of level.water) if (w.kind === 'rail') this.railSpans.push({ x: w.x * TILE, w: w.w * TILE, y: w.surface * TILE });
    this.outline = scene.add.graphics().setDepth(DEPTH.worldUi - 2);
    this.badge = pixelText(scene, 0, 0, '', { originX: 0.5, originY: 1, color: PALETTE.upgrade, depth: DEPTH.worldUi }).setVisible(false);
  }

  /** The machine Upgrade's puddle reached, now merged; or null. */
  merge(area: Rect, facing: 1 | -1): MachineHandle | null {
    for (const m of this.machines) {
      if (!m.mergeBox(this.box) || !overlaps(area, this.box)) continue;
      m.enter(facing);
      return m;
    }
    return null;
  }

  /** A machine that isn't in the level data joins (a boss's coils). The system updates and destroys it from now on. */
  add(m: Machine): void {
    this.machines.push(m);
  }

  /** Every machine with this id (set pieces reach in for their own). */
  get(id: string): Machine | undefined {
    return this.machines.find((m) => m.id === id);
  }

  update(dtMs: number, canMerge: boolean, keyLabel: string): void {
    for (const m of this.machines) m.update(dtMs);
    for (const t of this.trains) t.update(dtMs);
    this.sparkRails();
    this.showMergeable(canMerge, keyLabel);
  }

  /** The live third rail crackles. */
  private sparkRails(): void {
    const view = this.d.scene.cameras.main.worldView;
    for (const r of this.railSpans) {
      if (r.x > view.right || r.x + r.w < view.x) continue;
      if (chance(0.25)) {
        const x = Math.max(r.x, view.x) + Math.random() * Math.min(r.w, view.width);
        this.d.fx.burst('blue', x, r.y + 10, 2);
        this.d.lighting.flash(x, r.y + 10, 30, PALETTE.railGlow, 120);
      }
    }
  }

  /** As Upgrade, the nearest machine in reach pulses green with a {K} badge over it. */
  private showMergeable(canMerge: boolean, keyLabel: string): void {
    const g = this.outline;
    g.clear();
    this.badge.setVisible(false);
    const p = this.d.player;
    if (!canMerge || p.dead) return;
    let best: Rect | null = null;
    let bestD = 70;
    for (const m of this.machines) {
      if (!m.mergeBox(this.box)) continue;
      const cx = this.box.x + this.box.w / 2;
      const dist = Math.abs(cx - p.x) + Math.max(0, Math.abs(this.box.y + this.box.h - p.y) - 24);
      if (dist < bestD) {
        bestD = dist;
        best = { ...this.box };
      }
    }
    if (!best) return;
    const pulse = 0.5 + Math.sin(this.d.now() * 0.012) * 0.3;
    g.lineStyle(1, PALETTE.upgrade, pulse).strokeRect(best.x + 1, best.y + 1, best.w - 2, best.h - 2);
    this.badge.setText(keyLabel).setPosition(best.x + best.w / 2, best.y - 2).setVisible(true).setAlpha(0.6 + pulse * 0.4);
  }

  destroy(): void {
    for (const m of this.machines) m.destroy();
    for (const t of this.trains) t.destroy();
    this.outline.destroy();
    this.badge.destroy();
  }
}
