import Phaser from 'phaser';
import { DEPTH, FX } from '../config/constants';
import { PALETTE as P } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import type { Lighting } from './Lighting';
import type { TimeController } from './TimeController';
import { shakeCamera } from './Accessibility';

export type BurstKind =
  | 'spark'
  | 'fire'
  | 'smoke'
  | 'green'
  | 'debris'
  | 'red'
  | 'blue'
  | 'dust'
  | 'splash'
  | 'ember'
  | 'leaf'
  | 'gold'
  | 'white'
  | 'magma';

type EmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

const PRESETS: Record<BurstKind, { texture: string; config: EmitterConfig; depth?: number }> = {
  spark: {
    texture: TEX.spark,
    config: { lifespan: { min: 180, max: 380 }, speed: { min: 80, max: 240 }, scale: { start: 1, end: 0 }, gravityY: 400, color: [P.white, P.fire1, P.fire2], blendMode: 'ADD' },
  },
  fire: {
    texture: TEX.soft,
    config: { lifespan: { min: 250, max: 520 }, speed: { min: 20, max: 110 }, scale: { start: 0.9, end: 0 }, gravityY: -120, color: [P.fire0, P.fire1, P.fire2, P.fire3, P.fire4], colorEase: 'quad.out', blendMode: 'ADD' },
  },
  magma: {
    texture: TEX.px,
    config: { lifespan: { min: 300, max: 700 }, speed: { min: 60, max: 200 }, scale: { start: 1.5, end: 0.5 }, gravityY: 500, color: [P.fire0, P.fire2, P.fire3], blendMode: 'ADD' },
  },
  smoke: {
    texture: TEX.smoke,
    config: { lifespan: { min: 600, max: 1100 }, speed: { min: 10, max: 50 }, scale: { start: 0.6, end: 2 }, alpha: { start: 0.45, end: 0 }, gravityY: -30, tint: 0x3a3848 },
    depth: DEPTH.fx - 1,
  },
  green: {
    texture: TEX.soft,
    config: { lifespan: { min: 300, max: 700 }, speed: { min: 40, max: 220 }, scale: { start: 0.7, end: 0 }, color: [P.white, P.omnitrixGlow, P.omnitrix, P.omnitrixDark], blendMode: 'ADD' },
  },
  debris: {
    texture: TEX.debrisBits,
    config: { frame: [0, 1, 2, 3], lifespan: { min: 500, max: 900 }, speed: { min: 60, max: 220 }, angle: { min: 200, max: 340 }, gravityY: 600, rotate: { min: -360, max: 360 }, scale: { start: 1, end: 0.6 } },
  },
  red: {
    texture: TEX.spark,
    config: { lifespan: { min: 180, max: 400 }, speed: { min: 60, max: 200 }, scale: { start: 1, end: 0 }, gravityY: 200, color: [P.white, P.enemyGlow, P.enemy], blendMode: 'ADD' },
  },
  blue: {
    texture: TEX.spark,
    config: { lifespan: { min: 250, max: 600 }, speed: { min: 40, max: 200 }, scale: { start: 1.2, end: 0 }, color: [P.white, P.jammer, P.jammerDark], blendMode: 'ADD' },
  },
  dust: {
    texture: TEX.smoke,
    config: { lifespan: { min: 250, max: 450 }, speed: { min: 15, max: 60 }, angle: { min: 180, max: 360 }, scale: { start: 0.35, end: 0.9 }, alpha: { start: 0.5, end: 0 }, tint: 0x8a7a8a, gravityY: -10 },
  },
  splash: {
    texture: TEX.px,
    config: { lifespan: { min: 300, max: 600 }, speed: { min: 60, max: 180 }, angle: { min: 230, max: 310 }, gravityY: 700, scale: { start: 1.5, end: 0.5 }, color: [P.white, P.water2, P.water1] },
  },
  ember: {
    texture: TEX.ember,
    config: { lifespan: { min: 600, max: 1400 }, speed: { min: 10, max: 40 }, angle: { min: 240, max: 300 }, scale: { start: 1, end: 0 }, gravityY: -25, color: [P.fire0, P.fire1, P.fire2, P.fire3], blendMode: 'ADD' },
  },
  leaf: {
    texture: TEX.leaf,
    config: { lifespan: { min: 800, max: 1400 }, speed: { min: 30, max: 90 }, gravityY: 80, rotate: { min: -180, max: 180 }, color: [P.grass1, P.grass0, P.grass2] },
  },
  gold: {
    texture: TEX.spark,
    config: { lifespan: { min: 300, max: 800 }, speed: { min: 30, max: 160 }, scale: { start: 1.3, end: 0 }, color: [P.white, P.gold, P.goldDark], blendMode: 'ADD' },
  },
  white: {
    texture: TEX.soft,
    config: { lifespan: { min: 200, max: 400 }, speed: { min: 60, max: 180 }, scale: { start: 0.5, end: 0 }, blendMode: 'ADD' },
  },
};

type Pooled = Phaser.GameObjects.Image;

/** Particles, sprite flashes, rings, screen shake and hit-stop in one place. */
export class Fx {
  private readonly emitters = new Map<BurstKind, Phaser.GameObjects.Particles.ParticleEmitter>();
  private readonly pool: Pooled[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly lighting: Lighting,
    private readonly time: TimeController,
  ) {
    for (const kind of Object.keys(PRESETS) as BurstKind[]) {
      const preset = PRESETS[kind];
      const emitter = scene.add.particles(0, 0, preset.texture, { ...preset.config, emitting: false });
      emitter.setDepth(preset.depth ?? DEPTH.fx);
      this.emitters.set(kind, emitter);
    }
  }

  burst(kind: BurstKind, x: number, y: number, count: number): void {
    this.emitters.get(kind)?.explode(count, x, y);
  }

  /** A few particles every call; use for trails. */
  trail(kind: BurstKind, x: number, y: number, count = 1): void {
    this.emitters.get(kind)?.emitParticleAt(x, y, count);
  }

  setTimeScale(scale: number): void {
    for (const e of this.emitters.values()) e.timeScale = scale;
  }

  shake(intensity: number, durationMs = 180): void {
    shakeCamera(this.scene.cameras.main, durationMs, intensity);
  }

  hitStop(ms: number): void {
    this.time.hitStop(ms);
  }

  light(x: number, y: number, radius: number, color: number, durationMs: number, intensity = 1): void {
    this.lighting.flash(x, y, radius, color, durationMs, intensity);
  }

  /** Expanding ring (shockwaves, transform pulse, pickups). */
  ring(x: number, y: number, color: number, toRadius: number, durationMs: number, alpha = 0.9): void {
    const img = this.take(TEX.ring, x, y, color, DEPTH.fx);
    img.setScale(0.1).setAlpha(alpha);
    this.scene.tweens.add({
      targets: img,
      scale: (toRadius * 2) / 64,
      alpha: 0,
      duration: durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => this.release(img),
    });
  }

  /** Soft additive bloom that pops and fades. */
  flash(x: number, y: number, color: number, radius: number, durationMs: number, alpha = 1): void {
    const img = this.take(TEX.light, x, y, color, DEPTH.fxTop);
    img.setScale((radius * 2) / 64 * 0.4).setAlpha(alpha);
    this.scene.tweens.add({
      targets: img,
      scale: (radius * 2) / 64,
      alpha: 0,
      duration: durationMs,
      ease: 'Quad.easeOut',
      onComplete: () => this.release(img),
    });
  }

  rays(x: number, y: number, color: number, radius: number, durationMs: number): void {
    const img = this.take(TEX.rays, x, y, color, DEPTH.fx);
    img.setScale(0.2).setAlpha(1).setAngle(Math.random() * 360);
    this.scene.tweens.add({
      targets: img,
      scale: (radius * 2) / 128,
      angle: img.angle + 40,
      alpha: 0,
      duration: durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => this.release(img),
    });
  }

  /** Composite explosion: the workhorse for drone deaths and big hits. */
  explosion(x: number, y: number, size: 'small' | 'medium' | 'big'): void {
    const k = size === 'small' ? 1 : size === 'medium' ? 1.7 : 3;
    this.burst('fire', x, y, Math.round(14 * k));
    this.burst('spark', x, y, Math.round(10 * k));
    this.burst('smoke', x, y, Math.round(5 * k));
    this.burst('debris', x, y, Math.round(5 * k));
    this.flash(x, y, P.fire1, 18 * k, 260);
    this.ring(x, y, P.fire2, 22 * k, 300, 0.7);
    this.light(x, y, 70 * k, P.fire2, 360 + 120 * k, 1);
    this.shake(size === 'small' ? FX.shakeLight : size === 'medium' ? FX.shakeMedium : FX.shakeHeavy, 150 + 80 * k);
  }

  private take(texture: string, x: number, y: number, tint: number, depth: number): Pooled {
    let img = this.pool.pop();
    if (!img) img = this.scene.add.image(0, 0, texture);
    img.setTexture(texture).setPosition(x, y).setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth).setVisible(true).setActive(true);
    return img;
  }

  private release(img: Pooled): void {
    img.setVisible(false).setActive(false);
    this.pool.push(img);
  }
}
