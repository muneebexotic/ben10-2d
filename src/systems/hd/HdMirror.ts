import Phaser from 'phaser';
import type { AnimDef } from '../../scenes/preload/assetTypes';
import { RigInfo, type RigDef } from '../../scenes/preload/cartoon/rig';
import { RigActor } from './RigActor';

/**
 * How a character's game texture (its frame sheet, which still drives the
 * game: animation names, timing, frames for ghosts) is drawn in an HD chapter:
 * by an articulated rig instead.
 */
export interface MirrorSpec {
  rig: RigDef;
  info: RigInfo;
  /** The rig's parts atlas. */
  atlas: string;
  /** The game sheet's frame size and the row its feet stand on (the rig's feet go there). */
  frame: { w: number; h: number; feetY: number };
  /** A game frame shown on its own (a held pose, a ghost's sample) and the rig clip and time it stands for. */
  frames: ReadonlyMap<number, readonly [string, number]>;
}

/** Builds a mirror spec: the frame-to-clip map comes from the game sheet's own animations. */
export function mirrorSpec(rig: RigDef, atlas: string, texture: string, frame: MirrorSpec['frame'], anims: readonly AnimDef[]): MirrorSpec {
  const frames = new Map<number, readonly [string, number]>();
  for (const a of anims) {
    if (a.texture !== texture) continue;
    const clip = suffix(a.key);
    a.frames.forEach((f, i) => {
      if (!frames.has(f)) frames.set(f, [clip, a.frames.length > 1 ? i / (a.frames.length - 1) : 1]);
    });
  }
  return { rig, info: new RigInfo(rig), atlas, frame, frames };
}

/** 'fourarms-punchA' -> 'punchA'. */
export function suffix(animKey: string): string {
  const i = animKey.lastIndexOf('-');
  return i >= 0 ? animKey.slice(i + 1) : animKey;
}

interface Entry {
  key: string;
  actor: RigActor;
  restarted: boolean;
}

type Mirrored = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

/**
 * Draws every sprite or image whose texture has a rig as that rig instead
 * (the original stays in the scene for the game to drive, hidden from the
 * cameras). The rig follows its animation and its frame, position, flip,
 * squash, rotation, tint, blend, alpha, depth and visibility. A sprite marked
 * `noHd` (the pixel family before the transition) is left alone.
 */
export class HdMirror {
  private readonly specs = new Map<string, MirrorSpec>();
  private readonly entries = new Map<Mirrored, Entry>();
  private readonly tracked = new Set<Mirrored>();
  /** Clips a set piece asked for, over whatever the sprite plays (story poses). */
  private readonly overrides = new Map<Mirrored, string>();
  private readonly onAdded = (go: Phaser.GameObjects.GameObject) => this.consider(go);
  private readonly onRender = () => this.sync();

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAdded);
    scene.events.on(Phaser.Scenes.Events.PRE_RENDER, this.onRender);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  register(texture: string, spec: MirrorSpec): void {
    this.specs.set(texture, spec);
    for (const go of this.scene.children.list) this.consider(go);
  }

  has(texture: string): boolean {
    return this.specs.has(texture);
  }

  /** Plays a rig clip on an object regardless of its own animation (a story pose: talk, point, surprise); null hands it back. */
  override(obj: Mirrored, clip: string | null): void {
    if (clip === null) this.overrides.delete(obj);
    else this.overrides.set(obj, clip);
  }

  /** The rig drawing an object right now (to hang effects on its bones), if any. */
  actorFor(obj: Mirrored): RigActor | null {
    return this.entries.get(obj)?.actor ?? null;
  }

  private consider(go: Phaser.GameObjects.GameObject): void {
    if (!(go instanceof Phaser.GameObjects.Sprite) && !(go instanceof Phaser.GameObjects.Image)) return;
    if (this.tracked.has(go)) return;
    // Sprites can change texture later (Ben transforming); images only count with a rigged texture.
    if (!(go instanceof Phaser.GameObjects.Sprite) && !this.specs.has(go.texture.key)) return;
    if (go.getData('rigBone') !== undefined) return;
    this.tracked.add(go);
    go.once(Phaser.GameObjects.Events.DESTROY, () => this.forget(go));
    if (go instanceof Phaser.GameObjects.Sprite) {
      const restart = () => {
        const e = this.entries.get(go);
        if (e) e.restarted = true;
      };
      go.on(Phaser.Animations.Events.ANIMATION_START, restart);
      go.on(Phaser.Animations.Events.ANIMATION_RESTART, restart);
    }
  }

  private forget(go: Mirrored): void {
    this.tracked.delete(go);
    this.overrides.delete(go);
    const e = this.entries.get(go);
    if (e) e.actor.destroy();
    this.entries.delete(go);
  }

  private sync(): void {
    const scene = this.scene;
    const paused = scene.sys.isPaused();
    const dt = paused ? 0 : scene.game.loop.delta * scene.anims.globalTimeScale;
    for (const go of this.tracked) this.syncOne(go, dt);
  }

  private syncOne(go: Mirrored, dt: number): void {
    const key = go.texture.key;
    const spec = go.getData('noHd') ? undefined : this.specs.get(key);
    let entry = this.entries.get(go);
    if (!spec) {
      if (entry) {
        entry.actor.container.setVisible(false);
        this.setIgnored(go, false);
      }
      return;
    }
    if (!entry || entry.key !== key) {
      entry?.actor.destroy();
      entry = { key, actor: new RigActor(this.scene, spec.rig, spec.atlas, spec.info), restarted: true };
      this.entries.set(go, entry);
      this.setIgnored(go, true);
    }
    const actor = entry.actor;
    const c = actor.container;
    const shown = go.visible && go.alpha > 0 && (go.parentContainer?.visible ?? true);
    if (c.visible !== shown) c.setVisible(shown);
    if (!shown) return;

    // Which clip, and on whose clock.
    let clip = spec.rig.fallback;
    let ext: number | null = null;
    const anims = go instanceof Phaser.GameObjects.Sprite ? go.anims : null;
    const cur = anims?.currentAnim ?? null;
    // A set piece's pose first, then a clip the game asked for over this animation (a swim, Act 3 only).
    const forced = this.overrides.get(go) ?? ((go.getData('hdClip') as string | null | undefined) || undefined);
    if (forced !== undefined) {
      clip = forced;
    } else if (anims && cur && anims.currentFrame && anims.currentFrame.frame === go.frame) {
      clip = suffix(cur.key);
      const def = spec.rig.clips[actor.resolve(clip)];
      const n = cur.frames.length;
      if (!def.loop && n > 1) {
        const idx = anims.currentFrame.index - 1;
        if (!anims.isPlaying && idx >= n - 1) ext = 1;
        else ext = Math.min(1, (idx + (anims.isPlaying ? Math.min(1, Math.max(0, anims.accumulator / Math.max(1, anims.nextTick))) : 0)) / n);
      }
    } else {
      const held = spec.frames.get(Number(go.frame.name));
      if (held) {
        clip = held[0];
        const def = spec.rig.clips[actor.resolve(clip)];
        if (!def.loop) ext = held[1];
      }
    }
    actor.play(clip, entry.restarted);
    entry.restarted = false;
    actor.update(dt * (anims?.timeScale ?? 1), ext);

    // Feet where the game sprite's feet are.
    const f = spec.frame;
    const flip = go.flipX ? -1 : 1;
    const lx = (f.w / 2 - go.originX * f.w) * go.scaleX * flip;
    const ly = (f.feetY - go.originY * f.h) * go.scaleY;
    const cos = Math.cos(go.rotation);
    const sin = Math.sin(go.rotation);
    c.x = go.x + cos * lx - sin * ly;
    c.y = go.y + sin * lx + cos * ly;
    c.scaleX = go.scaleX * flip;
    c.scaleY = go.scaleY;
    c.rotation = go.rotation;
    if (c.depth !== go.depth) c.setDepth(go.depth);
    c.alpha = go.alpha;
    if (c.scrollFactorX !== go.scrollFactorX || c.scrollFactorY !== go.scrollFactorY) c.setScrollFactor(go.scrollFactorX, go.scrollFactorY);
    actor.setTint(go.isTinted ? go.tintTopLeft : -1, go.tintMode);
    actor.setBlend(go.blendMode as number);
  }

  private setIgnored(go: Mirrored, on: boolean): void {
    for (const cam of this.scene.cameras.cameras) {
      if (on) go.cameraFilter |= cam.id;
      else go.cameraFilter &= ~cam.id;
    }
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAdded);
    this.scene.events.off(Phaser.Scenes.Events.PRE_RENDER, this.onRender);
    for (const e of this.entries.values()) e.actor.destroy();
    this.entries.clear();
    this.tracked.clear();
    this.overrides.clear();
  }
}
