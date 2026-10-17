import Phaser from 'phaser';
import { TOWER } from '../../config/tower';
import { TEX } from '../preload/assetKeys';
import { CH6_TEX } from '../preload/karachi/keys';
import { SCENES } from '../SceneKeys';
import { CIRCUMFERENCE, project, wrapAngle, type Projected } from './rules';
import type { TowerView } from './view';

const STRIPS = 48;
const LEDGE_POOL = 200;
const LEDGE_STEP = 9;
const MERLONS = 64;
const STREAKS = 14;
const STRIP_ARC = CIRCUMFERENCE / STRIPS;

export interface TowerSceneData {
  view: TowerView;
}

/**
 * THE TOWER WRAP's renderer. The clock tower is drawn as a cylinder of
 * vertical strips of its stone, each squeezed by how far it faces away and
 * shaded the same way, so as Ben runs the whole tower turns under him. The
 * ledges, the merlons on top and the clock faces sit on that cylinder; the
 * skyline wheels past behind it; gargoyles come round from behind. It only
 * draws: TowerClimb in the level runs the climb and writes `view`.
 */
export class TowerScene extends Phaser.Scene {
  private view!: TowerView;
  private sky!: Phaser.GameObjects.Image;
  private stars!: Phaser.GameObjects.TileSprite;
  private far!: Phaser.GameObjects.TileSprite;
  private port!: Phaser.GameObjects.TileSprite;
  private near!: Phaser.GameObjects.TileSprite;
  private beam!: Phaser.GameObjects.Image;
  private readonly strips: Phaser.GameObjects.TileSprite[] = [];
  private readonly ledges: Phaser.GameObjects.Image[] = [];
  private readonly merlons: Phaser.GameObjects.Image[] = [];
  private readonly faces: Phaser.GameObjects.Image[] = [];
  private readonly rocks: Phaser.GameObjects.Sprite[] = [];
  private readonly gargs: Phaser.GameObjects.Sprite[] = [];
  private readonly streaks: Phaser.GameObjects.Rectangle[] = [];
  private player!: Phaser.GameObjects.Sprite;
  private fade!: Phaser.GameObjects.Rectangle;
  private readonly p: Projected = { dx: 0, depth: 0 };
  private anim = '';

  constructor() {
    super(SCENES.tower);
  }

  create(data: TowerSceneData): void {
    this.view = data.view;
    const { width: w, height: h } = this.scale;
    this.sky = this.add.image(0, 0, CH6_TEX.sky).setOrigin(0, 0).setDisplaySize(w, h).setDepth(0);
    this.stars = this.add.tileSprite(0, 0, w, 200, TEX.stars).setOrigin(0, 0).setDepth(1).setAlpha(0.8);
    this.add.image(w * 0.82, 60, CH6_TEX.moon).setDepth(1).setScale(1.25);
    this.far = this.add.tileSprite(0, h - 190, w, 150, CH6_TEX.skylineFar).setOrigin(0, 0).setDepth(2);
    this.port = this.add.tileSprite(0, h - 150, w, 120, CH6_TEX.port).setOrigin(0, 0).setDepth(3).setAlpha(0.85);
    this.near = this.add.tileSprite(0, h - 170, w, 170, CH6_TEX.skylineNear).setOrigin(0, 0).setDepth(4).setAlpha(0.9);
    this.beam = this.add.image(0, h, CH6_TEX.beam).setOrigin(0, 0.5).setDepth(5).setBlendMode(Phaser.BlendModes.ADD).setScale(4, 3).setAlpha(0.5);
    for (let i = 0; i < STRIPS; i++) {
      this.strips.push(this.add.tileSprite(0, 0, STRIP_ARC, h, CH6_TEX.towerWall).setOrigin(0, 0).setDepth(10));
    }
    for (let i = 0; i < LEDGE_POOL; i++) this.ledges.push(this.add.image(0, 0, CH6_TEX.towerLedge).setOrigin(0.5, 0).setDepth(20).setVisible(false));
    for (let i = 0; i < MERLONS; i++) this.merlons.push(this.add.image(0, 0, CH6_TEX.towerMerlon).setOrigin(0.5, 1).setDepth(20).setVisible(false));
    for (let i = 0; i < 4; i++) this.faces.push(this.add.image(0, 0, CH6_TEX.clockFace).setDepth(15).setVisible(false));
    for (let i = 0; i < this.view.rocklings.length; i++) this.rocks.push(this.add.sprite(0, 0, CH6_TEX.rockling).setOrigin(0.5, 1).setDepth(30).setVisible(false).play('rockling-roll'));
    for (let i = 0; i < this.view.gargoyles.length; i++) this.gargs.push(this.add.sprite(0, 0, CH6_TEX.gargoyle).setDepth(30).setVisible(false).play('gargoyle-fly'));
    this.player = this.add.sprite(w / 2, h * TOWER.viewY, this.view.texture || TEX.ben).setDepth(31);
    for (let i = 0; i < STREAKS; i++) this.streaks.push(this.add.rectangle(0, 0, 40, 1, 0xd8f4ff, 0.6).setDepth(40).setVisible(false));
    this.fade = this.add.rectangle(0, 0, w, h, 0x000000, 1).setOrigin(0, 0).setDepth(50);
    this.tweens.add({ targets: this.fade, alpha: 0, duration: 400 });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this));
    this.draw();
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.sky.setDisplaySize(size.width, size.height);
    for (const t of [this.stars, this.far, this.port, this.near]) t.setSize(size.width, t.height);
    this.fade.setSize(size.width, size.height);
  }

  override update(): void {
    this.draw();
  }

  private draw(): void {
    const v = this.view;
    const { width: w, height: h } = this.scale;
    const cx = w / 2;
    const cy = h * TOWER.viewY;
    const R = TOWER.radius;
    // The skyline wheels past as the tower turns, and sinks as Ben climbs.
    const turn = v.camS / R;
    this.stars.tilePositionX = turn * 60;
    this.far.tilePositionX = turn * 120;
    this.far.y = h - 190 + v.camH * 0.12;
    this.port.tilePositionX = turn * 180;
    this.port.y = h - 150 + v.camH * 0.2;
    this.near.tilePositionX = turn * 260;
    this.near.y = h - 170 + v.camH * 0.32;
    const sweep = Math.sin(v.time * 0.0004);
    this.beam.setPosition(-20, h - 40 + v.camH * 0.1).setRotation(-0.6 + sweep * 0.4);

    this.drawTower(cx, cy, h);
    this.drawLedges(cx, cy, h);
    this.drawTop(cx, cy);
    this.drawFoes(cx, cy);
    this.drawPlayer(cx, cy);
    this.drawWind(w, h);
    this.fade.setAlpha(Math.max(this.fade.alpha, v.done));
  }

  /** The cylinder: each strip squeezed and shaded by how far it faces away. */
  private drawTower(cx: number, cy: number, h: number): void {
    const v = this.view;
    const R = TOWER.radius;
    const step = (Math.PI * 2) / STRIPS;
    const topY = cy - (v.top + 26 - v.camH);
    const y0 = Math.max(0, Math.round(topY));
    for (let i = 0; i < STRIPS; i++) {
      const strip = this.strips[i];
      let a0 = wrapAngle((i * STRIP_ARC - v.camS) / R);
      let a1 = a0 + step;
      if (a1 <= -Math.PI / 2 || a0 >= Math.PI / 2 || y0 >= h) {
        strip.setVisible(false);
        continue;
      }
      a0 = Math.max(a0, -Math.PI / 2);
      a1 = Math.min(a1, Math.PI / 2);
      const x0 = cx + R * Math.sin(a0);
      const x1 = cx + R * Math.sin(a1);
      const mid = Math.cos((a0 + a1) / 2);
      const k = 0.3 + 0.7 * mid;
      const c = Math.round(255 * k);
      // A pixel of overlap, so no seam of sky shows between strips.
      strip.setVisible(true).setPosition(Math.floor(x0), y0).setScale(Math.max(0.02, (Math.ceil(x1) - Math.floor(x0) + 1) / STRIP_ARC), 1);
      if (strip.height !== h - y0) strip.setSize(STRIP_ARC, h - y0);
      strip.tilePositionX = i * STRIP_ARC;
      strip.tilePositionY = y0 - cy - v.camH;
      strip.setTint((c << 16) | (Math.round(c * 0.92) << 8) | Math.round(c * 0.88));
    }
  }

  /** Ledge stones along the spiral, on the side facing us. */
  private drawLedges(cx: number, cy: number, h: number): void {
    const v = this.view;
    let used = 0;
    for (const l of v.ledges) {
      const y = cy - (l.h - v.camH);
      if (y < -20 || y > h + 20) continue;
      for (let s = Math.max(l.s0, v.camS - CIRCUMFERENCE); s <= l.s1 && used < LEDGE_POOL; s += LEDGE_STEP) {
        project(s, v.camS, TOWER.ledgeOut, this.p);
        if (this.p.depth < 0.02) continue;
        const img = this.ledges[used++];
        const k = 0.35 + 0.65 * this.p.depth;
        const c = Math.round(255 * k);
        img.setVisible(true).setPosition(cx + this.p.dx, y).setScale(Math.max(0.15, this.p.depth) * (LEDGE_STEP / 11), 1).setTint((c << 16) | (c << 8) | Math.round(c * 0.95));
      }
    }
    for (let i = used; i < LEDGE_POOL; i++) {
      if (!this.ledges[i].visible) break;
      this.ledges[i].setVisible(false);
    }
  }

  /** The merlons round the top and the four clock faces under them. */
  private drawTop(cx: number, cy: number): void {
    const v = this.view;
    const y = cy - (v.top + 26 - v.camH);
    for (let i = 0; i < MERLONS; i++) {
      const m = this.merlons[i];
      if (i % 2 === 1) {
        m.setVisible(false);
        continue;
      }
      project((i / MERLONS) * CIRCUMFERENCE, v.camS, 0, this.p);
      if (this.p.depth < 0.02) {
        m.setVisible(false);
        continue;
      }
      const c = Math.round(255 * (0.35 + 0.65 * this.p.depth));
      m.setVisible(true).setPosition(cx + this.p.dx, y).setScale(Math.max(0.2, this.p.depth) * 1.2, 1).setTint((c << 16) | (c << 8) | c);
    }
    this.faces.forEach((f, i) => {
      project((i / 4) * CIRCUMFERENCE, v.camS, 2, this.p);
      if (this.p.depth < 0.05) {
        f.setVisible(false);
        return;
      }
      f.setVisible(true).setPosition(cx + this.p.dx, y + 52).setScale(0.55 * this.p.depth, 0.55).setAlpha(0.6 + 0.4 * this.p.depth);
    });
  }

  private drawFoes(cx: number, cy: number): void {
    const v = this.view;
    const R = TOWER.radius;
    v.rocklings.forEach((f, i) => {
      const s = this.rocks[i];
      if (!f.alive) {
        s.setVisible(false);
        return;
      }
      project(f.s, v.camS, TOWER.ledgeOut, this.p);
      s.setVisible(this.p.depth > 0.05).setPosition(cx + this.p.dx, cy - (f.h - v.camH)).setScale(Math.max(0.3, this.p.depth), 1);
    });
    v.gargoyles.forEach((f, i) => {
      const s = this.gargs[i];
      if (!f.alive) {
        s.setVisible(false);
        return;
      }
      project(f.s, v.camS, 14 + f.out, this.p);
      // Behind the tower and inside its outline: hidden by it.
      const hidden = this.p.depth < 0 && Math.abs(this.p.dx) < R;
      s.setVisible(!hidden).setDepth(this.p.depth < 0 ? 9 : 30).setPosition(cx + this.p.dx, cy - (f.h - v.camH)).setFlipX(this.p.dx > 0);
    });
  }

  private drawPlayer(cx: number, cy: number): void {
    const v = this.view;
    const s = this.player;
    if (v.texture && s.texture.key !== v.texture) s.setTexture(v.texture);
    s.setOrigin(0.5, v.originY).setPosition(cx, cy - (v.h - v.camH) + 1).setFlipX(v.facing < 0);
    const want = `${v.animPrefix}-${v.pose === 'attack' ? 'run' : v.pose}`;
    const key = this.anims.exists(want) ? want : `${v.animPrefix}-idle`;
    if (key !== this.anim) {
      this.anim = key;
      if (this.anims.exists(key)) s.play(key, true);
    }
    if (v.flash > 0.5) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    if (v.pose === 'attack') s.setScale(1.15, 0.92);
    else s.setScale(1);
  }

  /** The wind Charm's gusts: streaks across the screen (faint while it builds). */
  private drawWind(w: number, h: number): void {
    const v = this.view;
    const on = v.windDir !== 0 || v.windWarn > 0;
    this.streaks.forEach((r, i) => {
      if (!on) {
        r.setVisible(false);
        return;
      }
      const dir = v.windDir || 1;
      const speed = v.windDir !== 0 ? 0.9 : 0.3;
      const x = (((i * 97 + v.time * speed * dir) % (w + 80)) + w + 80) % (w + 80) - 40;
      r.setVisible(true).setPosition(x, (i * 53) % h).setAlpha(v.windDir !== 0 ? 0.5 : 0.18);
    });
  }
}
