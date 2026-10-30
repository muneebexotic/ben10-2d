import Phaser from 'phaser';
import { applyFace, makeWorld, partFrame, Pose, RigInfo, solve, type BoneWorld, type RigDef } from '../../scenes/preload/cartoon/rig';

/** How long a change of clip blends from the old pose (ms). */
const BLEND_MS = 90;
const BLINK_EVERY_MS: readonly [number, number] = [1800, 4200];
const BLINK_MS = 120;

/**
 * One articulated cartoon character on screen: a container of part images
 * posed by its rig every frame. Clips loop on their own clock, or follow a
 * time given from outside (a one-shot synced to gameplay); changing clip
 * blends from the last pose, and eyes blink on their own.
 */
export class RigActor {
  readonly container: Phaser.GameObjects.Container;
  readonly info: RigInfo;
  private readonly images: Phaser.GameObjects.Image[] = [];
  /** Frame name per bone per variant (built once: no strings made per frame). */
  private readonly frames: string[][];
  private readonly shownVariant: Int16Array;
  private readonly pose: Pose;
  private readonly from: Pose;
  private readonly world: BoneWorld;
  private clip = '';
  private clipMs = 0;
  private blendLeft = 0;
  private zKey = -1;
  private blinkIn = 0;
  private blinkLeft = 0;
  private cycleMs = 0;
  private tint = -1;
  private tintMode = -1;
  private blend = -1;
  private readonly blinkBones: number[] = [];
  private readonly cycleBones: Array<{ i: number; variants: number[]; fps: number }> = [];
  /** Clip time last frame (one-shots), for anything that wants to know. */
  t = 0;

  constructor(
    scene: Phaser.Scene,
    readonly rig: RigDef,
    readonly atlas: string,
    info?: RigInfo,
  ) {
    this.info = info ?? new RigInfo(rig);
    this.pose = new Pose(this.info);
    this.from = new Pose(this.info);
    this.world = makeWorld(this.info);
    this.shownVariant = new Int16Array(rig.bones.length).fill(-1);
    const parts = new Map(rig.parts.map((p) => [p.id, p]));
    this.frames = rig.bones.map((b, i) => {
      const part = b.part ? parts.get(b.part) : undefined;
      const variants = this.info.variants[i];
      return part ? variants.map((v) => partFrame(part.id, v, variants[0])) : [];
    });
    const children: Phaser.GameObjects.Image[] = [];
    rig.bones.forEach((b, i) => {
      const part = b.part ? parts.get(b.part) : undefined;
      const img = scene.add.image(0, 0, atlas, this.frames[i][0] ?? '__BASE');
      if (part) img.setOrigin(part.px / part.w, part.py / part.h);
      else img.setVisible(false);
      img.setData('rigBone', i);
      this.images.push(img);
      children.push(img);
      if (b.blink && this.info.variantIndex[i].has('blink')) this.blinkBones.push(i);
      if (b.cycle) this.cycleBones.push({ i, variants: b.cycle.variants.map((v) => this.info.variantIndex[i].get(v) ?? 0), fps: b.cycle.fps });
    });
    this.container = scene.add.container(0, 0, children);
    this.blinkIn = rand(BLINK_EVERY_MS);
    this.play(rig.fallback);
  }

  get clipName(): string {
    return this.clip;
  }

  /** The clip a name means for this rig (an alias, or the fallback). */
  resolve(name: string): string {
    if (this.rig.clips[name]) return name;
    const alias = this.rig.alias?.[name];
    if (alias && this.rig.clips[alias]) return alias;
    return this.rig.fallback;
  }

  /** Starts a clip (by name or alias); the same clip keeps running unless `restart`. */
  play(name: string, restart = false): void {
    const clip = this.resolve(name);
    if (clip === this.clip && !restart) return;
    const first = this.clip === '';
    this.clip = clip;
    this.clipMs = 0;
    if (!first) {
      this.from.copy(this.pose);
      this.blendLeft = BLEND_MS;
    }
  }

  /**
   * Advances by `dtMs` and poses the rig. `externalT` (0..1) drives a clip
   * from outside instead of its own clock (a one-shot that must line up with gameplay).
   */
  update(dtMs: number, externalT: number | null = null): void {
    const def = this.rig.clips[this.clip];
    this.clipMs += dtMs;
    let t: number;
    if (externalT !== null) t = externalT;
    else if (def.loop) t = (this.clipMs % def.ms) / def.ms;
    else t = Math.min(1, this.clipMs / def.ms);
    this.t = t;
    const pose = this.pose;
    if (this.blendLeft > 0) {
      // Pose the new clip into a scratch copy, then blend from where the old one was.
      pose.reset();
      def.pose(t, pose);
      this.blendLeft = Math.max(0, this.blendLeft - dtMs);
      const k = 1 - this.blendLeft / BLEND_MS;
      const target = this.from;
      // `from` holds the old pose: blend it toward the new one and keep the result.
      target.mixTo(pose, k * k * (3 - 2 * k));
      pose.copy(target);
      if (this.blendLeft <= 0) this.from.copy(pose);
    } else {
      pose.reset();
      def.pose(t, pose);
    }
    this.autoFace(dtMs);
    applyFace(this.info, pose);
    this.applyPose();
  }

  private autoFace(dtMs: number): void {
    if (this.blinkBones.length > 0) {
      if (this.blinkLeft > 0) this.blinkLeft -= dtMs;
      else if ((this.blinkIn -= dtMs) <= 0) {
        this.blinkLeft = BLINK_MS;
        this.blinkIn = rand(BLINK_EVERY_MS);
      }
      if (this.blinkLeft > 0) {
        for (const i of this.blinkBones) {
          // Only open eyes blink (an angry squint or a wink stays as posed).
          if (this.pose.v[i] === 0) this.pose.v[i] = this.info.variantIndex[i].get('blink') ?? 0;
        }
      }
    }
    if (this.cycleBones.length > 0) {
      this.cycleMs += dtMs;
      for (const c of this.cycleBones) {
        if (this.pose.v[c.i] !== 0 || c.variants.length === 0) continue;
        this.pose.v[c.i] = c.variants[Math.floor((this.cycleMs / 1000) * c.fps) % c.variants.length];
      }
    }
  }

  private applyPose(): void {
    const { pose, world, info } = this;
    solve(info, pose, world);
    let zKey = 0;
    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i];
      const frames = this.frames[i];
      if (frames.length === 0) continue;
      const hide = pose.hide[i] === 1;
      if (img.visible === hide) img.setVisible(!hide);
      if (hide) continue;
      const v = Math.min(frames.length - 1, Math.max(0, pose.v[i]));
      if (this.shownVariant[i] !== v) {
        this.shownVariant[i] = v;
        img.setFrame(frames[v]);
      }
      img.x = world.x[i];
      img.y = world.y[i];
      img.rotation = world.r[i];
      img.scaleX = pose.sx[i];
      img.scaleY = pose.sy[i];
      zKey = (zKey * 31 + Math.round(pose.z[i] * 8)) | 0;
    }
    if (zKey !== this.zKey) {
      this.zKey = zKey;
      this.sortByZ();
    }
  }

  private sortByZ(): void {
    const z = this.pose.z;
    this.container.list.sort((a, b) => z[(a as Phaser.GameObjects.Image).getData('rigBone') as number] - z[(b as Phaser.GameObjects.Image).getData('rigBone') as number]);
  }

  /** Tints every part (FILL for flashes, ADD for glows, MULTIPLY for normal), or clears with color -1. */
  setTint(color: number, mode: Phaser.TintModes): void {
    if (color === this.tint && mode === this.tintMode) return;
    this.tint = color;
    this.tintMode = mode;
    for (const img of this.images) {
      if (color < 0) img.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      else img.setTint(color).setTintMode(mode);
    }
  }

  setBlend(mode: number): void {
    if (mode === this.blend) return;
    this.blend = mode;
    for (const img of this.images) img.setBlendMode(mode);
  }

  /** Where a bone is right now (game px, in the actor's own space before flip and scale): attach effects to hands, heads. */
  bonePoint(bone: string): { x: number; y: number; r: number } {
    const i = this.info.bone(bone);
    return { x: this.world.x[i], y: this.world.y[i], r: this.world.r[i] };
  }

  /** `bonePoint` without allocating (every frame): writes into `out`. */
  boneInto(bone: number, out: { x: number; y: number }): void {
    out.x = this.world.x[bone];
    out.y = this.world.y[bone];
  }

  destroy(): void {
    this.container.destroy(true);
  }
}

function rand(range: readonly [number, number]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}
