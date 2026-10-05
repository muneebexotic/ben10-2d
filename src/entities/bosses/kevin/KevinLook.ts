import Phaser from 'phaser';
import { getAlien, hasAlien } from '../../../aliens/registry';
import type { FormDefinition } from '../../../aliens/types';
import { DEPTH } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { CHIMERA_FRAME, CHIMERA_PARTS, KEVIN_ACTOR_FRAME, type ChimeraPart } from '../../../scenes/preload/kevin';
import { TEX, chimeraPartKey } from '../../../scenes/preload/assetKeys';
import { blinkOn } from '../../../systems/Accessibility';
import { copyAnimKey, ensureCopyArt } from '../../../scenes/preload/copyArt';

export type KevinPose = 'idle' | 'run' | 'jump' | 'fall' | 'tell' | 'attack' | 'hurt' | 'absorb' | 'lunge' | 'laugh' | 'air' | 'overload';

type Mode = { kind: 'human' } | { kind: 'copy'; form: FormDefinition } | { kind: 'chimera'; forms: string[] };

const HUMAN_ANIMS: Record<KevinPose, string> = {
  idle: 'kevin-idle',
  run: 'kevin-run',
  jump: 'kevin-jump',
  fall: 'kevin-fall',
  tell: 'kevin-windup',
  attack: 'kevin-throw',
  hurt: 'kevin-hurt',
  absorb: 'kevin-absorb',
  lunge: 'kevin-lunge',
  laugh: 'kevin-laugh',
  air: 'kevin-jump',
  overload: 'kevin-hurt',
};

/** Frames of the hybrid's sheet (base and every overlay share them). */
const CHIMERA_POSE: Partial<Record<KevinPose, number>> = { tell: 2, attack: 2, lunge: 2, overload: 3, hurt: 3, absorb: 3 };

function partFor(formId: string): ChimeraPart {
  return (CHIMERA_PARTS as readonly string[]).includes(formId) ? (formId as ChimeraPart) : 'generic';
}

/**
 * How Kevin looks: the kid in the two-tone shirt, a twisted purple copy of
 * one of Ben's aliens (that alien's own sprite, tinted and glitching), or
 * KEVIN 11, a hulking hybrid wearing a piece of every alien he copied.
 */
export class KevinLook {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly parts: Phaser.GameObjects.Sprite[] = [];
  private readonly aura: Phaser.GameObjects.Image;
  private mode: Mode = { kind: 'human' };
  private pose: KevinPose = 'idle';
  private t = 0;

  constructor(private readonly scene: Phaser.Scene, x: number, feetY: number, depth: number = DEPTH.boss) {
    this.aura = scene.add.image(x, feetY, TEX.soft).setBlendMode(Phaser.BlendModes.ADD).setTint(PALETTE.kevin).setAlpha(0).setDepth(depth - 1);
    this.sprite = scene.add.sprite(x, feetY, TEX.kevinActor, 0).setDepth(depth);
    this.applyOrigin();
    this.setPose('idle', true);
  }

  get kind(): Mode['kind'] {
    return this.mode.kind;
  }

  /** The alien he's copying (null as himself or the hybrid). */
  get copied(): string | null {
    return this.mode.kind === 'copy' ? this.mode.form.id : null;
  }

  get visible(): boolean {
    return this.sprite.visible;
  }

  setVisible(on: boolean): this {
    this.sprite.setVisible(on);
    this.aura.setVisible(on);
    for (const p of this.parts) p.setVisible(on && this.mode.kind === 'chimera');
    return this;
  }

  human(): void {
    this.mode = { kind: 'human' };
    this.sprite.setTexture(TEX.kevinActor, 0);
    this.hideParts();
    this.applyOrigin();
    this.setPose(this.pose, true);
  }

  copy(formId: string): void {
    if (!hasAlien(formId)) return;
    const form = getAlien(formId);
    this.mode = { kind: 'copy', form };
    this.sprite.setTexture(ensureCopyArt(this.scene, form), 0);
    this.hideParts();
    this.applyOrigin();
    this.setPose(this.pose, true);
  }

  chimera(forms: readonly string[]): void {
    this.mode = { kind: 'chimera', forms: [...forms] };
    this.sprite.setTexture(TEX.chimera, 0);
    this.hideParts();
    const parts = forms.length > 0 ? forms : ['generic'];
    parts.forEach((id, i) => {
      let s = this.parts[i];
      if (!s) {
        s = this.scene.add.sprite(0, 0, chimeraPartKey('generic'), 0).setDepth(this.sprite.depth + 1);
        this.parts.push(s);
      }
      const part = partFor(id);
      s.setTexture(chimeraPartKey(part), 0).setVisible(this.sprite.visible);
      s.setOrigin(0.5, (CHIMERA_FRAME.feetY + 1) / CHIMERA_FRAME.h);
      if (part === 'generic' && hasAlien(id)) s.setTint(getAlien(id).theme.color);
      else s.clearTint();
    });
    this.applyOrigin();
    this.setPose(this.pose, true);
  }

  setPose(pose: KevinPose, force = false): void {
    if (pose === this.pose && !force) return;
    this.pose = pose;
    const s = this.sprite;
    if (this.mode.kind === 'human') {
      s.play(HUMAN_ANIMS[pose], true);
      return;
    }
    if (this.mode.kind === 'chimera') {
      const frame = CHIMERA_POSE[pose];
      if (frame === undefined) s.play('chimera-idle', true);
      else s.stop().setFrame(frame);
      return;
    }
    const form = this.mode.form;
    const name = this.copyAnim(form, pose);
    const key = copyAnimKey(`${form.animPrefix}-${name}`);
    if (this.scene.anims.exists(key)) s.play(key, true);
    else s.play(copyAnimKey(`${form.animPrefix}-idle`), true);
  }

  private copyAnim(form: FormDefinition, pose: KevinPose): string {
    const c = form.copy;
    switch (pose) {
      case 'tell':
        return c?.tell ?? 'idle';
      case 'attack':
      case 'lunge':
        return c?.attack ?? 'idle';
      case 'air':
        return c?.air ?? 'jump';
      case 'hurt':
      case 'overload':
      case 'absorb':
        return 'hurt';
      case 'laugh':
        return 'idle';
      default:
        return pose;
    }
  }

  /** Puts him at `x` with his feet at `feetY`. `flash`: just got hit. */
  place(x: number, feetY: number, facing: 1 | -1, dtMs: number, flash: boolean, glow = 0): void {
    this.t += dtMs;
    const s = this.sprite;
    const jitter = this.mode.kind === 'chimera' && this.pose === 'overload' ? (Math.random() - 0.5) * 3 : 0;
    s.setPosition(Math.round(x + jitter), Math.round(feetY)).setFlipX(facing < 0);
    if (flash) s.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.white);
    else if (this.mode.kind === 'copy' && blinkOn(this.t, 90) && this.t % 1700 < 180) {
      // A copy glitches now and then: a flicker of solid purple.
      s.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.kevinDark);
    } else s.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xffffff);
    for (const p of this.parts) {
      if (!p.visible) continue;
      p.setPosition(s.x, s.y).setFlipX(s.flipX).setFrame(Number(s.frame.name));
    }
    const h = this.height;
    const a = this.mode.kind === 'human' ? glow * 0.5 : 0.35 + glow * 0.4;
    this.aura.setPosition(s.x, s.y - h / 2).setScale((h / 18) * (1 + glow * 0.3)).setAlpha(a * (0.85 + Math.sin(this.t * 0.01) * 0.15));
  }

  /** Sprite height in pixels (for effects over his head). */
  get height(): number {
    if (this.mode.kind === 'human') return KEVIN_ACTOR_FRAME.feetY;
    if (this.mode.kind === 'chimera') return CHIMERA_FRAME.feetY;
    return this.mode.form.frame.feetY;
  }

  private applyOrigin(): void {
    const f = this.mode.kind === 'human' ? KEVIN_ACTOR_FRAME : this.mode.kind === 'chimera' ? CHIMERA_FRAME : this.mode.form.frame;
    this.sprite.setOrigin(0.5, (f.feetY + 1) / f.h);
  }

  private hideParts(): void {
    for (const p of this.parts) p.setVisible(false);
  }

  destroy(): void {
    this.sprite.destroy();
    this.aura.destroy();
    for (const p of this.parts) p.destroy();
  }
}
