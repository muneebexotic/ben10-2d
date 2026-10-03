import { HUMAN_COMBAT, HUMAN_FEEL, HUMAN_MOTOR } from '../config/player';
import { FX } from '../config/constants';
import { PALETTE } from '../config/palette';
import { BEN_FRAME } from '../scenes/preload/characters';
import { TEX } from '../scenes/preload/assetKeys';
import { HUMAN_CAPS } from '../levels/reachability';
import type { AbilityContext, FormAbilities, FormDefinition } from './types';
import type { Rect } from '../entities/types';
import { chance } from '../systems/Pacing';

const PUNCH = HUMAN_COMBAT.punch;
const ROLL = HUMAN_COMBAT.roll;

class HumanAbilities implements FormAbilities {
  private punchT = -1;
  private punchReadyAt = 0;
  /** Presses during a punch are queued briefly so mashing feels responsive. */
  private punchBufferedUntil = 0;
  private punchLanded = false;
  private rollLeft = 0;
  private rollDir: 1 | -1 = 1;
  private rollReadyAt = 0;
  private readonly area: Rect = { x: 0, y: 0, w: 0, h: 0 };

  update(ctx: AbilityContext, dt: number): void {
    const { controls, player } = ctx;

    if (this.rollLeft > 0) {
      this.rollLeft -= dt;
      const t = this.rollLeft / ROLL.durationMs;
      player.setVelocityX(this.rollDir * ROLL.speed * (t > 0.3 ? 1 : 0.4 + t * 2));
      if (chance(0.5)) ctx.fx.trail('dust', player.x - this.rollDir * 4, player.y - 2);
      // The roll is untouchable: a faint trail says so.
      if (chance(0.6)) player.afterimage(0xffffff, 0.3, 140);
      if (this.rollLeft <= 0) this.rollReadyAt = ctx.now + ROLL.cooldownMs;
    } else if (ctx.inputEnabled && controls.specialPressed && player.grounded && ctx.now >= this.rollReadyAt && this.punchT < 0) {
      this.rollDir = controls.left ? -1 : controls.right ? 1 : player.facing;
      this.rollLeft = ROLL.durationMs;
      player.squash(1.25, 0.8);
      ctx.fx.burst('dust', player.x, player.y - 2, 5);
      ctx.sfx('roll');
      ctx.notify('roll');
    }

    if (ctx.inputEnabled && controls.attackPressed) this.punchBufferedUntil = ctx.now + PUNCH.bufferMs;
    if (this.punchT >= 0) {
      this.punchT += dt;
      const activeStart = PUNCH.startupMs;
      const activeEnd = PUNCH.startupMs + PUNCH.activeMs;
      if (this.punchT >= activeStart && this.punchT < activeEnd) this.resolvePunch(ctx);
      if (this.punchT >= activeEnd + 90) this.punchT = -1;
    } else if (ctx.inputEnabled && ctx.now < this.punchBufferedUntil && ctx.now >= this.punchReadyAt && this.rollLeft <= 0) {
      this.punchBufferedUntil = 0;
      this.punchT = 0;
      this.punchLanded = false;
      this.punchReadyAt = ctx.now + PUNCH.cooldownMs;
      if (player.grounded) player.setVelocityX(player.vx * 0.3 + player.facing * PUNCH.lunge);
      ctx.sfx('swing', 1, 0.9 + Math.random() * 0.2);
      ctx.notify('punch');
    }
  }

  private resolvePunch(ctx: AbilityContext): void {
    const { player } = ctx;
    const a = this.area;
    a.w = PUNCH.reach;
    a.h = PUNCH.height;
    a.x = player.facing > 0 ? player.x + 2 : player.x - 2 - PUNCH.reach;
    a.y = player.centerY - PUNCH.height / 2 - 2;

    const parried = ctx.combat.parry(a, player.facing, PUNCH.parrySpeedMultiplier, PUNCH.parryDamage);
    if (parried > 0) {
      ctx.sfx('parry');
      ctx.fx.hitStop(FX.hitStopHeavyMs);
      ctx.fx.flash(a.x + a.w / 2, a.y + a.h / 2, PALETTE.white, 22, 220);
      ctx.fx.burst('white', a.x + a.w / 2, a.y + a.h / 2, 8);
      ctx.notify('parry');
    }

    if (this.punchLanded) return;
    const hits = ctx.combat.melee(a, {
      damage: PUNCH.damage,
      kind: 'melee',
      x: player.x,
      y: player.centerY,
      knockback: PUNCH.knockback,
    });
    if (hits > 0) {
      this.punchLanded = true;
      ctx.sfx('punchHit');
      ctx.fx.hitStop(FX.hitStopLightMs);
      ctx.fx.shake(FX.shakeLight, 90);
      ctx.fx.burst('spark', a.x + (player.facing > 0 ? a.w : 0), a.y + a.h / 2, 6);
    }
  }

  isInvulnerable(): boolean {
    return this.rollLeft > 0;
  }

  locksMovement(): boolean {
    return this.rollLeft > 0;
  }

  speedMultiplier(): number {
    return this.punchT >= 0 ? 0.4 : 1;
  }

  animOverride(): string | null {
    if (this.rollLeft > 0) return 'roll';
    if (this.punchT >= 0) return 'punch';
    return null;
  }
}

/** Human Ben: weak punch, a dodge roll with invulnerability frames, and punches that knock lasers back. */
export const HUMAN_FORM: FormDefinition = {
  id: 'ben',
  name: 'BEN',
  kind: 'human',
  unlockChapter: 0,
  texture: TEX.ben,
  animPrefix: 'ben',
  frame: { w: BEN_FRAME.w, h: BEN_FRAME.h, feetY: 27 },
  motor: HUMAN_MOTOR,
  feel: HUMAN_FEEL,
  maxFormHealth: 0,
  theme: {
    color: PALETTE.omnitrix,
    light: PALETTE.omnitrixGlow,
    dark: PALETTE.omnitrixDeep,
    burst: 'green',
    shieldLabel: '',
    slam: 'plain',
  },
  hudIcon: TEX.iconBen,
  touchIcons: { attack: TEX.touchPunch, special: TEX.touchRoll },
  quips: {
    transform: [],
    revert: ['AW MAN!', 'NOT NOW!', 'COME ON, COME ON!', 'SERIOUSLY?!', 'UH OH...', 'STUPID WATCH!'],
  },
  tips: {},
  moves: ['{J} PUNCH (KNOCKS LASERS BACK)', '{K} DODGE ROLL (UNTOUCHABLE FOR AN INSTANT)'],
  audio: { music: null },
  // Ben's sprites are part of the shared asset map (he exists before the Omnitrix does).
  art: { assets: [], anims: [] },
  reach: HUMAN_CAPS,
  createAbilities: () => new HumanAbilities(),
};
