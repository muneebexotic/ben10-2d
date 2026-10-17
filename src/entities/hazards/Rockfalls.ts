import Phaser from 'phaser';
import { ROCKFALL } from '../../config/bounty';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { CH5_TEX } from '../../scenes/preload/bounty/keys';
import type { Fx } from '../../systems/Fx';
import { blinkOn } from '../../systems/Accessibility';
import { playSfx } from '../../systems/audio/Sfx';
import { rockSmash, trickle } from '../../systems/audio/bountySfx';
import { chance } from '../../systems/Pacing';
import { pace } from '../../systems/Difficulty';
import type { Telegraphs } from '../enemies/Telegraphs';
import type { Hazard, Rect } from '../types';

export interface RockfallZone {
  id: string;
  /** Tiles: the stretch rocks can fall on, and the ceiling row they fall from. */
  x: number;
  w: number;
  ceiling: number;
}

interface Rock extends Hazard {
  sprite: Phaser.GameObjects.Image;
  active: boolean;
  /** Warning (dust and marker) before it drops. */
  warnLeft: number;
  falling: boolean;
  x: number;
  y: number;
  floorY: number;
  vy: number;
}

export interface RockfallWorld {
  fx: Fx;
  telegraph: Telegraphs;
  groundBelow(x: number, y: number): number;
  playerX(): number;
  /** Enemies under a rock get flattened too. */
  blastEnemies(x: number, y: number, radius: number, damage: number): void;
}

/**
 * Falling rocks in the mine: dust trickles from the ceiling and a marker shows
 * on the floor (the tell, the same on every difficulty), then the rock drops.
 * A zone only drops rocks while Ben is near it; a set piece can drop one anywhere.
 */
export class Rockfalls {
  private readonly rocks: Rock[] = [];
  private readonly timers = new Map<string, number>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly zones: readonly RockfallZone[],
    private readonly w: RockfallWorld,
    private readonly addHazard: (h: Hazard) => void,
  ) {
    for (const z of zones) this.timers.set(z.id, ROCKFALL.everyMs[0]);
  }

  /** The rocks are made the first time one falls (most levels never drop any). */
  private pool(): Rock[] {
    if (this.rocks.length > 0) return this.rocks;
    for (let i = 0; i < 6; i++) {
      const sprite = this.scene.add.image(0, 0, CH5_TEX.fallingRock, i % 3).setDepth(DEPTH.props + 1).setVisible(false);
      const rock: Rock = {
        sprite, active: false, warnLeft: 0, falling: false, x: 0, y: 0, floorY: 0, vy: 0,
        damage: ROCKFALL.damage,
        hitbox: (out: Rect) => {
          if (!rock.active || !rock.falling) return false;
          out.x = rock.x - ROCKFALL.radius;
          out.y = rock.y - ROCKFALL.radius;
          out.w = ROCKFALL.radius * 2;
          out.h = ROCKFALL.radius * 2;
          return true;
        },
        onHitPlayer: () => this.smash(rock),
      };
      this.rocks.push(rock);
      this.addHazard(rock);
    }
    return this.rocks;
  }

  /** A rock falls at x from `ceilingY` (px) after the usual warning. */
  drop(x: number, ceilingY: number, warnMs: number = ROCKFALL.warnMs): void {
    const rock = this.pool().find((r) => !r.active);
    if (!rock) return;
    rock.active = true;
    rock.falling = false;
    rock.warnLeft = warnMs;
    rock.x = x;
    rock.y = ceilingY + 6;
    rock.vy = 0;
    rock.floorY = this.w.groundBelow(x, ceilingY + 8);
    rock.sprite.setPosition(x, rock.y).setVisible(false).setFrame(Math.floor(Math.random() * 3));
    playSfx(trickle, 0.5);
  }

  update(dtMs: number, now: number): void {
    const px = this.w.playerX();
    for (const z of this.zones) {
      const left = z.x * TILE;
      const right = (z.x + z.w) * TILE;
      if (px < left - ROCKFALL.wakeRange || px > right + ROCKFALL.wakeRange) continue;
      const t = (this.timers.get(z.id) ?? 0) - dtMs;
      if (t > 0) {
        this.timers.set(z.id, t);
        continue;
      }
      const [lo, hi] = ROCKFALL.everyMs;
      this.timers.set(z.id, pace.rest(lo + Math.random() * (hi - lo)));
      // Aim near Ben (it's a mine, not a sniper): somewhere within a few tiles of him, inside the zone.
      const x = Phaser.Math.Clamp(px + (Math.random() - 0.5) * 80, left + 8, right - 8);
      this.drop(x, z.ceiling * TILE);
    }

    for (const r of this.rocks) {
      if (!r.active) continue;
      if (!r.falling) {
        r.warnLeft -= dtMs;
        const k = 1 - Math.max(0, r.warnLeft) / ROCKFALL.warnMs;
        if (chance(0.5)) this.w.fx.trail('dust', r.x + (Math.random() - 0.5) * 10, r.y);
        this.w.telegraph.target(r.x, r.floorY - 2, 10 - k * 3, PALETTE.enemy, 0.35 + k * 0.5 + (blinkOn(now, 100) ? 0.1 : 0));
        if (r.warnLeft <= 0) {
          r.falling = true;
          r.sprite.setVisible(true);
        }
        continue;
      }
      r.vy = Math.min(ROCKFALL.fallSpeed, r.vy + 1400 * (dtMs / 1000));
      r.y += r.vy * (dtMs / 1000);
      r.sprite.setPosition(r.x, r.y).setAngle(r.sprite.angle + dtMs * 0.2);
      if (r.y + ROCKFALL.radius >= r.floorY) this.smash(r);
    }
  }

  private smash(r: Rock): void {
    if (!r.active) return;
    r.active = false;
    r.falling = false;
    r.sprite.setVisible(false);
    const y = Math.min(r.y, r.floorY - 4);
    this.w.fx.burst('debris', r.x, y, 10);
    this.w.fx.burst('dust', r.x, r.floorY, 8);
    this.w.fx.shake(0.003, 100);
    this.w.blastEnemies(r.x, y, ROCKFALL.radius + 4, ROCKFALL.damage * 2);
    playSfx(rockSmash, 0.7, 0.9 + Math.random() * 0.2);
  }

  clear(): void {
    for (const r of this.rocks) {
      r.active = false;
      r.sprite.setVisible(false);
    }
  }
}
