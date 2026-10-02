import Phaser from 'phaser';
import { BOSS } from '../../config/boss';
import { DEPTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import type { Telegraphs } from '../enemies/Telegraphs';
import type { Hazard, Rect } from '../types';
import { blinkOn } from '../../systems/Accessibility';

/** Ground shockwave from a slam. Jump over it. */
class Shockwave implements Hazard {
  readonly damage = BOSS.slam.shockwaveDamage;
  active = false;
  x = 0;
  dir: 1 | -1 = 1;
  life = 0;
  readonly sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, private readonly floorY: number) {
    this.sprite = scene.add.sprite(0, floorY, TEX.shockwave).setOrigin(0.5, 1).setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = this.x - 8;
    out.y = this.floorY - 11;
    out.w = 16;
    out.h = 11;
    return true;
  }

  onHitPlayer(): void {
    this.active = false;
    this.sprite.setVisible(false);
  }
}

/** Horizontal beam at knee height. Jump it, roll through it, or stand on a platform. */
class Beam implements Hazard {
  readonly damage = BOSS.beam.damage;
  active = false;
  x0 = 0;
  x1 = 0;
  y = 0;
  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = Math.min(this.x0, this.x1);
    out.y = this.y - BOSS.beam.height / 2;
    out.w = Math.abs(this.x1 - this.x0);
    out.h = BOSS.beam.height;
    return true;
  }
}

interface Bomb {
  x: number;
  y: number;
  targetY: number;
  warnLeft: number;
  falling: boolean;
  sprite: Phaser.GameObjects.Sprite;
  done: boolean;
}

/** Short-lived explosion hazard where a bomb lands. */
class Blast implements Hazard {
  readonly damage = BOSS.rain.damage;
  active = false;
  x = 0;
  y = 0;
  life = 0;
  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    const r = BOSS.rain.radius;
    out.x = this.x - r;
    out.y = this.y - r;
    out.w = r * 2;
    out.h = r;
    return true;
  }
}

export class BossHazards {
  readonly shockwaves: Shockwave[] = [];
  readonly beam = new Beam();
  readonly blasts: Blast[] = [];
  private readonly bombs: Bomb[] = [];
  private readonly beamSprite: Phaser.GameObjects.Image;
  private beamLeft = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly floorY: number,
    private readonly fx: Fx,
    private readonly lighting: Lighting,
    private readonly telegraph: Telegraphs,
  ) {
    for (let i = 0; i < 6; i++) this.shockwaves.push(new Shockwave(scene, floorY));
    for (let i = 0; i < 4; i++) this.blasts.push(new Blast());
    this.beamSprite = scene.add.image(0, 0, TEX.beam).setOrigin(0, 0.5).setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
  }

  all(): Hazard[] {
    return [...this.shockwaves, this.beam, ...this.blasts];
  }

  spawnShockwave(x: number, dir: 1 | -1): void {
    const s = this.shockwaves.find((w) => !w.active);
    if (!s) return;
    s.active = true;
    s.x = x;
    s.dir = dir;
    s.life = BOSS.slam.shockwaveLifeMs;
    s.sprite.setVisible(true).setFlipX(dir < 0).play('shockwave-roll');
  }

  fireBeam(x0: number, x1: number, y: number): void {
    const b = this.beam;
    b.active = true;
    b.x0 = x0;
    b.x1 = x1;
    b.y = y;
    this.beamLeft = BOSS.beam.fireMs;
    const left = Math.min(x0, x1);
    this.beamSprite.setPosition(left, y).setDisplaySize(Math.abs(x1 - x0), BOSS.beam.height + 8).setVisible(true).setAlpha(1);
  }

  dropBomb(x: number, warnMs: number): void {
    let bomb = this.bombs.find((b) => b.done);
    if (!bomb) {
      const sprite = this.scene.add.sprite(0, 0, TEX.bomb).setDepth(DEPTH.projectiles).setVisible(false);
      bomb = { x: 0, y: 0, targetY: 0, warnLeft: 0, falling: false, sprite, done: true };
      this.bombs.push(bomb);
    }
    bomb.x = x;
    bomb.targetY = this.floorY;
    bomb.warnLeft = warnMs;
    bomb.falling = false;
    bomb.done = false;
    bomb.y = this.scene.cameras.main.worldView.y - 20;
    bomb.sprite.setVisible(false);
  }

  update(dtMs: number, now: number): void {
    const dt = dtMs / 1000;
    for (const s of this.shockwaves) {
      if (!s.active) continue;
      s.x += s.dir * BOSS.slam.shockwaveSpeed * dt;
      s.life -= dtMs;
      s.sprite.setPosition(s.x, this.floorY);
      if (Math.random() < 0.5) this.fx.trail('red', s.x, this.floorY - 4);
      this.lighting.add(s.x, this.floorY - 6, 40, PALETTE.enemy, 0.9);
      if (s.life <= 0) {
        s.active = false;
        s.sprite.setVisible(false);
      }
    }

    if (this.beam.active) {
      this.beamLeft -= dtMs;
      const b = this.beam;
      const flick = 0.85 + Math.random() * 0.15;
      this.beamSprite.setAlpha(flick).setDisplaySize(Math.abs(b.x1 - b.x0), (BOSS.beam.height + 8) * (0.9 + Math.random() * 0.2));
      for (let i = 0; i < 3; i++) this.fx.trail('red', Math.min(b.x0, b.x1) + Math.random() * Math.abs(b.x1 - b.x0), b.y);
      for (let x = Math.min(b.x0, b.x1); x < Math.max(b.x0, b.x1); x += 90) this.lighting.add(x, b.y, 80, PALETTE.enemy, 1);
      if (this.beamLeft <= 0) {
        b.active = false;
        this.beamSprite.setVisible(false);
      }
    }

    const fallTime = (this.floorY - (this.scene.cameras.main.worldView.y - 20)) / BOSS.rain.fallSpeed;
    for (const bomb of this.bombs) {
      if (bomb.done) continue;
      bomb.warnLeft -= dtMs;
      const t = 1 - Math.max(0, bomb.warnLeft) / BOSS.rain.warnMs;
      const pulse = blinkOn(now, t > 0.7 ? 60 : 120);
      this.telegraph.target(bomb.x, this.floorY - 2, BOSS.rain.radius * (0.4 + t * 0.6), PALETTE.enemy, pulse ? 0.9 : 0.4);
      this.telegraph.rect(bomb.x - BOSS.rain.radius, this.floorY - 2, BOSS.rain.radius * 2, 2, PALETTE.enemy, 0.3 + t * 0.6);
      if (!bomb.falling && bomb.warnLeft <= fallTime * 1000) {
        bomb.falling = true;
        bomb.sprite.setVisible(true).setPosition(bomb.x, bomb.y).play('bomb-blink');
        playSfx('whistle', 0.7, 0.9 + Math.random() * 0.2);
      }
      if (bomb.falling) {
        bomb.y += BOSS.rain.fallSpeed * dt;
        bomb.sprite.setPosition(bomb.x, bomb.y);
        if (bomb.y >= bomb.targetY - 4) this.explodeBomb(bomb);
      }
    }

    for (const b of this.blasts) {
      if (!b.active) continue;
      b.life -= dtMs;
      if (b.life <= 0) b.active = false;
    }
  }

  private explodeBomb(bomb: Bomb): void {
    bomb.done = true;
    bomb.sprite.setVisible(false).stop();
    this.fx.explosion(bomb.x, this.floorY - 6, 'small');
    playSfx('explode', 0.7);
    const blast = this.blasts.find((b) => !b.active);
    if (blast) {
      blast.active = true;
      blast.x = bomb.x;
      blast.y = this.floorY;
      blast.life = 160;
    }
  }

  clear(): void {
    for (const s of this.shockwaves) {
      s.active = false;
      s.sprite.setVisible(false);
    }
    this.beam.active = false;
    this.beamSprite.setVisible(false);
    for (const b of this.bombs) {
      b.done = true;
      b.sprite.setVisible(false);
    }
    for (const b of this.blasts) b.active = false;
  }
}
