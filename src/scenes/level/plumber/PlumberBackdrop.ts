import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH, TILE } from '../../../config/constants';
import { PLUMBER_DECOR, PLUMBER_SEA } from '../../../levels/chapter7Decor';
import type { LevelData } from '../../../levels/types';
import { cellAt } from '../../../levels/buildLevel';
import { CELL } from '../../../levels/tiles';
import { PLUMBER_ART, type WallVariant } from '../../preload/cartoon/plumber/baseArt';
import type { LevelWorld } from '../LevelWorld';
import { StaticCuller } from '../StaticCuller';
import type { Backdrop } from '../../../chapters/types';
import { approach } from '../../../systems/Pacing';

/** Back wall panels are this many tiles square. */
const PANEL = 4;
const RAYS = 5;
const FISH = 9;

/** A deterministic 0..1 hash of two integers (panel variants, scatter). */
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Mostly plain plates; now and then pipes, lights, a vent, a screen, a porthole, the badge. */
const WALL_MIX: ReadonlyArray<readonly [WallVariant, number]> = [
  ['plain', 0.42],
  ['pipes', 0.14],
  ['lights', 0.1],
  ['vent', 0.09],
  ['screen', 0.09],
  ['porthole', 0.08],
  ['badge', 0.04],
  ['dark', 0.04],
];

function wallVariant(r: number): WallVariant {
  let acc = 0;
  for (const [v, w] of WALL_MIX) {
    acc += w;
    if (r < acc) return v;
  }
  return 'plain';
}

/**
 * Chapter 7's backdrop (HD): the deep sea behind everything (a gradient, light
 * shafts from far above, marine snow), the base's back walls in its rooms
 * (riveted panels, portholes, screens, pipes, badges), and outside the hull
 * the far side of the sea: the base's own silhouette, rock ridges, kelp,
 * coral, fish schools and, now and then, a whale-sized shadow.
 */
export class PlumberBackdrop implements Backdrop {
  private readonly sea: Phaser.GameObjects.Image;
  private readonly rays: Phaser.GameObjects.Image[] = [];
  private readonly baseFar: Phaser.GameObjects.Image;
  private readonly rocks: Phaser.GameObjects.Image[] = [];
  private readonly kelp: Phaser.GameObjects.Image[] = [];
  private readonly fish: Array<{ img: Phaser.GameObjects.Image; vx: number; baseY: number; phase: number }> = [];
  private readonly whale: Phaser.GameObjects.Image;
  private readonly snow: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly culler = new StaticCuller();
  private readonly seaFrom: number;
  private readonly seaTo: number;
  private time = 0;
  private whaleX = -1;
  private whaleIn = 9000;
  /** How much of the outside shows (0 inside the base, 1 in the open sea). */
  private outside = 0;

  constructor(scene: Phaser.Scene, level: LevelData, world: LevelWorld) {
    this.seaFrom = PLUMBER_SEA.from * TILE;
    this.seaTo = PLUMBER_SEA.to * TILE;
    const W = GAME_MAX_WIDTH * 1.4;
    const Hh = GAME_HEIGHT * 1.6;
    this.sea = scene.add.image(0, 0, PLUMBER_ART.sea).setOrigin(0.5, 0.5).setDisplaySize(W, Hh).setScrollFactor(0).setDepth(DEPTH.sky);
    for (let i = 0; i < RAYS; i++) {
      this.rays.push(scene.add.image(0, 0, PLUMBER_ART.ray).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH.stars).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.16).setScale(1.2 + (i % 3) * 0.4, 2));
    }
    this.whale = scene.add.image(0, 0, PLUMBER_ART.whale).setScrollFactor(0.15).setDepth(DEPTH.moon).setVisible(false).setScale(1.6);
    // The base seen from outside, over the open sea.
    this.baseFar = scene.add.image((this.seaFrom + this.seaTo) / 2, 26 * TILE, PLUMBER_ART.baseFar).setScrollFactor(0.3, 0.6).setDepth(DEPTH.mountains).setScale(1.4);
    for (let i = 0; i < 6; i++) {
      this.rocks.push(scene.add.image(this.seaFrom - 200 + i * 300, 40 * TILE, PLUMBER_ART.rocks).setOrigin(0.5, 1).setScrollFactor(0.5, 0.85).setDepth(DEPTH.pinesFar).setFlipX(i % 2 === 1));
    }
    for (let i = 0; i < 26; i++) {
      const x = this.seaFrom + 40 + i * 52 + hash(i, 7) * 30;
      this.kelp.push(scene.add.image(x, 44 * TILE, PLUMBER_ART.kelp, i % 4).setOrigin(0.5, 1).setScrollFactor(0.82, 0.95).setDepth(DEPTH.pinesMid).setScale(1 + hash(i, 3) * 0.6).setAlpha(0.85));
    }
    for (let i = 0; i < FISH; i++) {
      const img = scene.add.image(0, 0, PLUMBER_ART.fish, i % 2).setScrollFactor(0.7).setDepth(DEPTH.pinesMid + 1).setScale(1.2);
      this.fish.push({ img, vx: 18 + hash(i, 1) * 20, baseY: 18 * TILE + hash(i, 2) * 14 * TILE, phase: hash(i, 4) * 6 });
      img.x = this.seaFrom + hash(i, 5) * (this.seaTo - this.seaFrom);
    }

    // Back walls: panels wherever a room is open behind them (never over the open sea).
    for (let py = 0; py < level.height; py += PANEL) {
      for (let px = 0; px < level.width; px += PANEL) {
        const x0 = px * TILE;
        if (x0 + PANEL * TILE > this.seaFrom && x0 < this.seaTo) continue;
        if (!this.anyOpen(world, px, py)) continue;
        const variant = wallVariant(hash(px, py));
        this.culler.add(scene.add.image(x0, py * TILE, PLUMBER_ART.wall, variant).setOrigin(0, 0).setDepth(DEPTH.decorBack - 4));
      }
    }

    // The base's furniture and the open sea's coral.
    for (const d of PLUMBER_DECOR) {
      const img = scene.add.image(d.x * TILE + (d.dx ?? 0), d.y * TILE, d.key, d.frame).setOrigin(0.5, d.hang ? 0 : 1).setDepth(d.front ? DEPTH.decor : DEPTH.decorBack).setFlipX(d.flip === true);
      if (d.scale) img.setScale(d.scale);
      this.culler.add(img);
    }

    // Marine snow drifting through everything.
    this.snow = scene.add.particles(0, 0, PLUMBER_ART.snow, {
      x: { min: -GAME_MAX_WIDTH * 0.7, max: GAME_MAX_WIDTH * 0.7 },
      y: { min: -GAME_HEIGHT * 0.7, max: GAME_HEIGHT * 0.7 },
      lifespan: { min: 4000, max: 7000 },
      speedX: { min: -6, max: 6 },
      speedY: { min: 4, max: 12 },
      alpha: { onEmit: () => 0, onUpdate: (_p: unknown, _k: string, t: number) => Math.sin(t * Math.PI) * 0.7 },
      scale: { min: 0.6, max: 1.3 },
      frequency: 90,
      quantity: 1,
    });
    this.snow.setScrollFactor(0).setDepth(DEPTH.foreground - 1);
  }

  private anyOpen(world: LevelWorld, px: number, py: number): boolean {
    for (let y = py; y < py + PANEL; y++) for (let x = px; x < px + PANEL; x++) if (cellAt(world.grid, x, y) === CELL.EMPTY || cellAt(world.grid, x, y) === CELL.PLATFORM) return true;
    return false;
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void {
    this.time += dtMs;
    const view = camera.worldView;
    const cx = camera.width / 2;
    const cy = camera.height / 2;
    this.sea.setPosition(cx, cy);
    // The deeper the camera, the darker the sea.
    const depth = Math.max(0, Math.min(1, view.centerY / (50 * TILE)));
    this.sea.setTint(Phaser.Display.Color.GetColor(255 - depth * 60, 255 - depth * 50, 255 - depth * 30));
    const inSea = view.right > this.seaFrom - 80 && view.x < this.seaTo + 80;
    this.outside = approach(this.outside, inSea ? 1 : 0, 0.06);
    for (let i = 0; i < this.rays.length; i++) {
      const r = this.rays[i];
      const sway = Math.sin(this.time * 0.00035 + i * 1.7) * 30;
      r.setPosition(cx + (i - (RAYS - 1) / 2) * 150 + sway - ((view.x * 0.08) % 150), -20).setAlpha((0.08 + 0.1 * this.outside) * (0.75 + 0.25 * Math.sin(this.time * 0.0008 + i)));
    }
    const showOutside = this.outside > 0.02;
    this.baseFar.setVisible(showOutside);
    for (const r of this.rocks) r.setVisible(showOutside);
    for (const k of this.kelp) k.setVisible(showOutside);
    for (const f of this.fish) {
      f.img.setVisible(showOutside);
      if (!showOutside) continue;
      f.img.x += (f.vx * dtMs) / 1000;
      if (f.img.x > this.seaTo + 200) f.img.x = this.seaFrom - 200;
      f.img.y = f.baseY + Math.sin(this.time * 0.0012 + f.phase) * 8;
      f.img.setFrame(Math.floor(this.time / 220 + f.phase) % 2);
    }
    // A whale-sized shadow passes far above now and then (open sea only).
    if (this.whaleX < 0) {
      this.whaleIn -= dtMs;
      if (this.whaleIn <= 0 && showOutside) {
        this.whaleX = -300;
        this.whale.setVisible(true);
      }
    } else {
      this.whaleX += dtMs * 0.03;
      this.whale.setPosition(this.whaleX, 40 + Math.sin(this.whaleX * 0.01) * 6).setAlpha(0.7 * this.outside);
      if (this.whaleX > GAME_MAX_WIDTH + 300) {
        this.whaleX = -1;
        this.whaleIn = 26000;
        this.whale.setVisible(false);
      }
    }
    this.culler.update(view);
  }
}
