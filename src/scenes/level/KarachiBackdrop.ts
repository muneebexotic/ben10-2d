import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH as W, TILE } from '../../config/constants';
import type { InteriorWall, LevelData } from '../../levels/types';
import { chance } from '../../systems/Pacing';
import { TEX } from '../preload/assetKeys';
import { CH6_TEX } from '../preload/karachi/keys';
import { StaticCuller } from './StaticCuller';

const WALLS: Partial<Record<InteriorWall, string>> = {
  palace: CH6_TEX.palaceWall,
  library: CH6_TEX.libraryWall,
  cellar: CH6_TEX.cellarWall,
  oldTunnel: CH6_TEX.tunnelWall,
  clockwork: CH6_TEX.clockworkWall,
};

const KITES = 5;

/**
 * Chapter 6's backdrop: Karachi at night. A big moon over the Arabian Sea;
 * across the water the city glows, with Mazar-e-Quaid's white dome and a
 * mosque's minarets far off on the skyline (silhouettes only), the port's
 * cranes with their red lights, and Manora's lighthouse sweeping its beam
 * over the harbour. The sea shows on the seafront; inland, nearer blocks
 * of flats take its place. Kites drift high up and crows cross now and then.
 * Indoors, a back wall per room.
 */
export class KarachiBackdrop {
  private readonly stars: Phaser.GameObjects.TileSprite;
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly port: Phaser.GameObjects.TileSprite;
  private readonly near: Phaser.GameObjects.TileSprite;
  private readonly sea: Phaser.GameObjects.TileSprite;
  private readonly lighthouse: Phaser.GameObjects.Image;
  private readonly beam: Phaser.GameObjects.Image;
  private readonly kites: Phaser.GameObjects.Image[] = [];
  private readonly crow: Phaser.GameObjects.Sprite;
  private readonly culler = new StaticCuller();
  private crowX = -1;
  private crowIn = 4000;
  private time = 0;
  private seaMix = 1;

  constructor(
    scene: Phaser.Scene,
    level: LevelData,
    /** The sea is behind this x (the seafront); inland, the near skyline. */
    private readonly seafront: (x: number) => boolean,
    /** Open sky over this x (kites and crows only outdoors). */
    private readonly outdoors: (x: number) => boolean,
  ) {
    scene.add.image(0, 0, CH6_TEX.sky).setOrigin(0, 0).setDisplaySize(W, GAME_HEIGHT).setScrollFactor(0).setDepth(DEPTH.sky);
    this.stars = scene.add.tileSprite(0, 0, W, 180, TEX.stars).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.stars).setAlpha(0.7);
    scene.add.image(W * 0.78, 70, TEX.light).setScrollFactor(0).setDepth(DEPTH.moon).setScale(2.6).setAlpha(0.2).setTint(0xffe8c8).setBlendMode(Phaser.BlendModes.ADD);
    scene.add.image(W * 0.78, 70, CH6_TEX.moon).setScrollFactor(0).setDepth(DEPTH.moon).setScale(1.25);
    this.far = scene.add.tileSprite(0, GAME_HEIGHT - 200, W, 150, CH6_TEX.skylineFar).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.mountains);
    this.port = scene.add.tileSprite(0, GAME_HEIGHT - 170, W, 120, CH6_TEX.port).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.mountains + 1).setAlpha(0.9);
    // Manora's lighthouse across the harbour, its beam turning slowly.
    this.lighthouse = scene.add.image(W * 0.12, GAME_HEIGHT - 120, CH6_TEX.lighthouse).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH.mountains + 2);
    this.beam = scene.add.image(0, 0, CH6_TEX.beam).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.mountains + 2).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2, 1.6);
    this.near = scene.add.tileSprite(0, GAME_HEIGHT - 180, W, 170, CH6_TEX.skylineNear).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.pinesFar);
    this.sea = scene.add.tileSprite(0, GAME_HEIGHT - 120, W, 80, CH6_TEX.sea).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.pinesFar + 1);
    for (let i = 0; i < KITES; i++) {
      this.kites.push(scene.add.image(0, 0, CH6_TEX.skyKite, i % 3).setScrollFactor(0).setDepth(DEPTH.moon + 1).setAlpha(0.85));
    }
    this.crow = scene.add.sprite(0, 0, CH6_TEX.crow).setScrollFactor(0).setDepth(DEPTH.pinesFar + 2).setVisible(false).play('crow-flap');

    const heightPx = level.height * TILE;
    for (const room of level.interiors ?? []) {
      const tex = WALLS[room.wall];
      if (!tex) continue;
      const top = (room.top ?? 0) * TILE;
      const wall = this.culler.add(scene.add.tileSprite(room.x * TILE, top, room.w * TILE, heightPx - top, tex).setOrigin(0, 0).setDepth(DEPTH.pinesMid));
      wall.tilePositionY = (192 - (((room.floor ?? 30) * TILE - top) % 192)) % 192;
    }
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void {
    this.time += dtMs;
    this.culler.update(camera.worldView);
    const sx = camera.scrollX;
    const sy = camera.scrollY;
    this.stars.tilePositionX = sx * 0.02;
    this.far.tilePositionX = sx * 0.04;
    this.far.y = GAME_HEIGHT - 200 - sy * 0.03;
    this.port.tilePositionX = sx * 0.06 + 120;
    this.port.y = GAME_HEIGHT - 170 - sy * 0.04;
    this.near.tilePositionX = sx * 0.12;
    this.near.y = GAME_HEIGHT - 180 - sy * 0.08;
    this.sea.tilePositionX = sx * 0.1 + this.time * 0.004;
    this.sea.y = GAME_HEIGHT - 120 - sy * 0.06;

    // The sea fades in along the seafront; inland the near blocks take over.
    const want = this.seafront(camera.worldView.centerX) ? 1 : 0;
    this.seaMix += (want - this.seaMix) * Math.min(1, dtMs / 600);
    this.sea.setAlpha(this.seaMix);
    this.near.setAlpha(1 - this.seaMix * 0.85);

    // The lighthouse slides with the far layer; its beam sweeps back and forth over the harbour.
    const lx = ((W * 0.12 - sx * 0.05) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.2;
    this.lighthouse.setPosition(lx, GAME_HEIGHT - 118 - sy * 0.035);
    const sweep = Math.sin(this.time * 0.00035);
    this.beam.setPosition(lx, this.lighthouse.y - 72).setRotation(-0.25 + sweep * 0.55);
    this.beam.setAlpha(0.55 + Math.abs(Math.cos(this.time * 0.00035)) * 0.25);

    const outside = this.outdoors(camera.worldView.centerX);
    this.updateKites(outside, sx);
    this.updateCrow(outside, dtMs);
  }

  /** A few kites high over the city, bobbing on their strings. */
  private updateKites(outside: boolean, sx: number): void {
    for (let i = 0; i < this.kites.length; i++) {
      const k = this.kites[i];
      k.setVisible(outside);
      if (!outside) continue;
      const span = W + 80;
      const x = (((i * 167 + 60 - sx * (0.03 + i * 0.006)) % span) + span) % span - 40;
      const y = 40 + (i % 3) * 26 + Math.sin(this.time * 0.0012 + i * 1.7) * 6;
      k.setPosition(x, y).setRotation(Math.sin(this.time * 0.002 + i) * 0.25);
    }
  }

  /** Every so often a crow flaps across the sky. */
  private updateCrow(outside: boolean, dtMs: number): void {
    if (this.crowX < 0) {
      this.crowIn -= dtMs;
      if (this.crowIn > 0 || !outside || !chance(0.05)) return;
      this.crowIn = 7000 + Math.random() * 9000;
      this.crowX = -10;
      this.crow.setVisible(true).setY(60 + Math.random() * 80);
    }
    this.crowX += dtMs * 0.07;
    this.crow.setX(this.crowX).setY(this.crow.y + Math.sin(this.time * 0.01) * 0.2);
    if (this.crowX > W + 20 || !outside) {
      this.crowX = -1;
      this.crow.setVisible(false);
    }
  }
}
