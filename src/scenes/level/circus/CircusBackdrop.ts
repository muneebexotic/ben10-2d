import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH, TILE } from '../../../config/constants';
import { CIRCUS_DECOR } from '../../../levels/chapter8Decor';
import { CIRCUS_OUTDOORS } from '../../../levels/chapter8';
import type { LevelData } from '../../../levels/types';
import { cellAt } from '../../../levels/buildLevel';
import { CELL } from '../../../levels/tiles';
import { CIRCUS_ART, CIRCUS_ORIGIN } from '../../preload/cartoon/circus/circusArt';
import type { LevelWorld } from '../LevelWorld';
import { StaticCuller } from '../StaticCuller';
import type { Backdrop } from '../../../chapters/types';
import { approach } from '../../../systems/Pacing';

const PANEL = 4;

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Which back wall a stretch of the circus has (indoors), by tile x. */
function wallAt(x: number, y: number): { key: string; frame: number } {
  // The big top: red and cream canvas panels; empty stands low down.
  if (x >= 366) return y >= 30 && y < 36 ? { key: CIRCUS_ART.stands, frame: 0 } : { key: CIRCUS_ART.canvas, frame: Math.floor(x / PANEL) % 2 };
  // The mirror maze: wallpaper hung with warped mirrors.
  if (x >= 206) return { key: CIRCUS_ART.wall, frame: hash(x, y) < 0.45 ? 3 : 1 };
  // The funhouse and the rolling course: stripes, diamonds, now and then a poster.
  const r = hash(x, y);
  return { key: CIRCUS_ART.wall, frame: r < 0.12 ? 2 : r < 0.55 ? 0 : 1 };
}

/**
 * Chapter 8's backdrop (HD): a night sky with the moon over the bay, the sea
 * and its lighthouse sweeping a beam through the fog, the town's rooftops
 * along the shore and the big top far down the pier; indoors, painted back
 * walls (funhouse wallpaper, mirrors, the big top's canvas). The furniture
 * (booths, the carousel, wagons...) is placed from `chapter8Decor.ts`.
 */
export class CircusBackdrop implements Backdrop {
  private readonly sky: Phaser.GameObjects.Image;
  private readonly sea: Phaser.GameObjects.Image;
  private readonly beam: Phaser.GameObjects.Image;
  private readonly town: Phaser.GameObjects.Image[] = [];
  private readonly tent: Phaser.GameObjects.Image;
  private readonly fog: Phaser.GameObjects.Image[] = [];
  private readonly bulbs: Phaser.GameObjects.Image[] = [];
  private readonly culler = new StaticCuller();
  private time = 0;
  private bulbFrame = 0;
  /** How much of the outdoors shows (0 deep indoors, 1 under the open sky). */
  private outside = 1;

  constructor(scene: Phaser.Scene, level: LevelData, world: LevelWorld) {
    this.sky = scene.add.image(0, 0, CIRCUS_ART.sky).setDisplaySize(GAME_MAX_WIDTH * 1.3, GAME_HEIGHT * 1.4).setScrollFactor(0).setDepth(DEPTH.sky);
    // The sea's image holds the lighthouse above its top edge: its origin is the horizon.
    this.sea = scene.add.image(0, 0, CIRCUS_ART.sea).setOrigin(0, 56 / 96).setScrollFactor(0).setDepth(DEPTH.mountains - 1);
    this.beam = scene.add.image(0, 0, CIRCUS_ART.beam).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.mountains).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
    // The town and the fog wrap round as the camera moves (fixed to the screen, shifted by hand: no tiling of HD textures).
    for (let i = 0; i < 3; i++) this.town.push(scene.add.image(0, 0, CIRCUS_ART.town).setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH.pinesFar));
    this.tent = scene.add.image(0, 0, CIRCUS_ART.tentFar).setOrigin(0.5, 1).setScrollFactor(0.35, 0.5).setDepth(DEPTH.pinesFar + 1).setScale(1.2);
    for (let i = 0; i < 4; i++) this.fog.push(scene.add.image(0, 0, CIRCUS_ART.fog).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.fog));

    // Back walls wherever an indoor room is open behind them.
    for (let py = 0; py < level.height; py += PANEL) {
      for (let px = 0; px < level.width; px += PANEL) {
        if (CIRCUS_OUTDOORS.some((o) => px + PANEL > o.from && px < o.to)) continue;
        if (!this.anyOpen(world, px, py)) continue;
        const w = wallAt(px, py);
        // Back walls a shade darker than the terrain, so floors and ledges stand out from them.
        this.culler.add(scene.add.image(px * TILE, py * TILE, w.key, w.frame).setOrigin(0, 0).setDepth(DEPTH.decorBack - 4).setTint(0xa898c0));
      }
    }

    for (const d of CIRCUS_DECOR) {
      const o = CIRCUS_ORIGIN[d.key] ?? { x: 0.5, y: d.hang ? 0 : 1 };
      const img = scene.add
        .image(d.x * TILE + (d.dx ?? 0), d.y * TILE, d.key, d.frame)
        .setOrigin(o.x, o.y)
        .setDepth(d.front ? DEPTH.decor : DEPTH.decorBack)
        .setFlipX(d.flip === true);
      if (d.scale) img.setScale(d.scale);
      if (d.key === CIRCUS_ART.bulbs) this.bulbs.push(img);
      this.culler.add(img);
    }
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
    this.sky.setPosition(cx, cy);
    const tileX = view.centerX / TILE;
    const out = CIRCUS_OUTDOORS.some((o) => tileX > o.from - 6 && tileX < o.to + 6);
    this.outside = approach(this.outside, out ? 1 : 0, 0.05);
    const show = this.outside > 0.02;
    // The horizon sits a little above the middle of the screen, rising and falling a touch with the camera;
    // the town's rooftops stand on the shore below it, the sea showing over them.
    const horizon = cy - 14 - (view.centerY - 30 * TILE) * 0.04;
    this.sea.setVisible(show).setPosition(-60, horizon).setAlpha(this.outside).setScale((GAME_MAX_WIDTH * 1.4) / 640, 1);
    // The lighthouse beam sweeps back and forth over the bay.
    const sweep = Math.sin(this.time * 0.0006) * 0.45 - 0.15;
    this.beam.setVisible(show).setPosition(-60 + 195 * ((GAME_MAX_WIDTH * 1.4) / 640), horizon - 42).setRotation(sweep).setAlpha(0.42 * this.outside * (0.7 + 0.3 * Math.abs(Math.cos(this.time * 0.0006))));
    const townShift = (view.x * 0.25) % 600;
    for (let i = 0; i < this.town.length; i++) this.town[i].setVisible(show).setPosition(i * 600 - townShift - 60, horizon + 74).setAlpha(this.outside);
    this.tent.setVisible(show).setPosition(390 * TILE, 33 * TILE);
    const fogShift = (view.x * 0.4 + this.time * 0.006) % 320;
    for (let i = 0; i < this.fog.length; i++) this.fog[i].setVisible(show).setPosition(i * 320 - fogShift - 60, horizon + 64).setAlpha(0.85 * this.outside);
    // The midway's bulbs chase.
    const f = Math.floor(this.time / 380) % 2;
    if (f !== this.bulbFrame) {
      this.bulbFrame = f;
      for (let i = 0; i < this.bulbs.length; i++) this.bulbs[i].setFrame(String((f + i) % 2));
    }
    this.culler.update(view);
  }
}
