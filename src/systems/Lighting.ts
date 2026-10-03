import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_MAX_WIDTH, LIGHTING } from '../config/constants';
import { lerpColor } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';

interface Light {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
}

interface TimedLight extends Light {
  life: number;
  maxLife: number;
}

const LIGHT_TEX_SIZE = 64;

/**
 * Night lighting: a low-res lightmap filled with the ambient colour, lights
 * stamped additively, then multiplied over the world. Anything drawn above
 * DEPTH.lightmap is "emissive" and ignores the darkness.
 */
export class Lighting {
  private readonly rt: Phaser.GameObjects.RenderTexture;
  /** This frame's lights; the objects are reused frame to frame (no garbage in the hot path). */
  private readonly frameLights: Light[] = [];
  private frameCount = 0;
  private readonly timed: TimedLight[] = [];
  private readonly stampConfig = { scale: 1, tint: 0xffffff, alpha: 1, blendMode: Phaser.BlendModes.ADD as Phaser.BlendModes };
  private originX = 0;
  private originY = 0;
  private ambient: number = LIGHTING.ambientCamp;
  private ambientFrom: number = LIGHTING.ambientCamp;
  private ambientTo: number = LIGHTING.ambientCamp;
  private ambientT = 1;
  private ambientMs: number = LIGHTING.ambientBlendMs;
  private readonly w: number;
  private readonly h: number;
  enabled = true;

  constructor(scene: Phaser.Scene) {
    const s = LIGHTING.scale;
    // Sized for the widest view (wide phones), centred on the camera every frame.
    this.w = Math.ceil((GAME_MAX_WIDTH + LIGHTING.margin * 2) / s);
    this.h = Math.ceil((GAME_HEIGHT + LIGHTING.margin * 2) / s);
    this.rt = scene.add.renderTexture(0, 0, this.w, this.h);
    this.rt.setOrigin(0, 0).setScale(s).setDepth(DEPTH.lightmap).setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  setAmbient(color: number, blendMs: number = LIGHTING.ambientBlendMs): void {
    if (color === this.ambientTo) return;
    this.ambientFrom = this.ambient;
    this.ambientTo = color;
    this.ambientT = blendMs <= 0 ? 1 : 0;
    this.ambientMs = Math.max(1, blendMs);
    if (blendMs <= 0) this.ambient = color;
  }

  /** Immediate-mode light for this frame only. */
  add(x: number, y: number, radius: number, color = 0xffffff, intensity = 1): void {
    if (!this.enabled || radius <= 0 || intensity <= 0) return;
    let l = this.frameLights[this.frameCount];
    if (!l) {
      l = { x: 0, y: 0, radius: 0, color: 0, intensity: 0 };
      this.frameLights.push(l);
    }
    l.x = x;
    l.y = y;
    l.radius = radius;
    l.color = color;
    l.intensity = intensity;
    this.frameCount++;
  }

  /** A light that fades out on its own (explosions, muzzle flashes). */
  flash(x: number, y: number, radius: number, color: number, durationMs: number, intensity = 1): void {
    this.timed.push({ x, y, radius, color, intensity, life: durationMs, maxLife: durationMs });
  }

  update(dtMs: number): void {
    if (this.ambientT < 1) {
      this.ambientT = Math.min(1, this.ambientT + dtMs / this.ambientMs);
      this.ambient = lerpColor(this.ambientFrom, this.ambientTo, this.ambientT);
    }
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const t = this.timed[i];
      t.life -= dtMs;
      if (t.life <= 0) this.timed.splice(i, 1);
    }
  }

  render(camera: Phaser.Cameras.Scene2D.Camera): void {
    const rt = this.rt;
    if (!this.enabled) {
      rt.setVisible(false);
      this.frameCount = 0;
      return;
    }
    rt.setVisible(true);
    const s = LIGHTING.scale;
    const view = camera.worldView;
    const ox = Math.floor(view.centerX - (this.w * s) / 2);
    const oy = Math.floor(view.centerY - (this.h * s) / 2);
    rt.setPosition(ox, oy);
    this.originX = ox;
    this.originY = oy;

    rt.clear();
    rt.fill(this.ambient, 1);
    for (let i = 0; i < this.frameCount; i++) this.stamp(this.frameLights[i], this.frameLights[i].intensity);
    for (const t of this.timed) this.stamp(t, t.intensity * (t.life / t.maxLife));
    rt.render();
    this.frameCount = 0;
  }

  private stamp(l: Light, intensity: number): void {
    const s = LIGHTING.scale;
    const lx = (l.x - this.originX) / s;
    const ly = (l.y - this.originY) / s;
    const r = l.radius / s;
    if (lx + r < 0 || ly + r < 0 || lx - r > this.w || ly - r > this.h) return;
    // Phaser copies these values into its command buffer, so one config object serves every light.
    const c = this.stampConfig;
    c.scale = (r * 2) / LIGHT_TEX_SIZE;
    c.tint = l.color;
    c.alpha = Math.min(1, intensity);
    this.rt.stamp(TEX.light, undefined, lx, ly, c);
  }

  destroy(): void {
    this.rt.destroy();
  }
}
