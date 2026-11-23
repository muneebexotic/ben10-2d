import { GRINNER, HOUND, JACKBOX, REFLECTION, STILTS } from '../../../config/circus';
import { TELL } from '../../../config/tells';
import Phaser from 'phaser';
import { TEX } from '../../../scenes/preload/assetKeys';
import { CIRCUS_ART } from '../../../scenes/preload/cartoon/circus/keys';
import { CIRCUS_TEX } from '../../../scenes/preload/cartoon/circus/circusSheets';
import { pace } from '../../../systems/Difficulty';
import { damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { show } from '../magic/kit';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';
import { circusEnv } from './kit';
import { CIRCUS_SFX } from './sfx';

/** A lob that lands on Ben: flat-ish, with the arc's drop made up. */
function lob(d: Drone, w: DroneWorld, speed: number, gravity: number, fromY: number): { vx: number; vy: number } {
  const dx = w.player.x - d.x;
  const dy = w.player.centerY - fromY;
  const vx = Math.sign(dx || faceOf(d)) * speed;
  const t = Math.max(0.2, Math.min(1.4, Math.abs(dx) / speed));
  const vy = Math.max(-260, Math.min(120, dy / t - 0.5 * gravity * t));
  return { vx, vy };
}

/** The arc a lob will fly, drawn as the tell. */
function drawArc(d: Drone, w: DroneWorld, v: { vx: number; vy: number }, y0: number, gravity: number, k: number): void {
  let x = d.x + faceOf(d) * 6;
  let y = y0;
  const dt = 0.07;
  for (let i = 0; i < 7; i++) {
    const nx = x + v.vx * dt;
    const ny = y + (v.vy + gravity * dt * (i + 0.5)) * dt;
    if (i % 2 === 0) w.telegraph.line(x, y, nx, ny, TELL.cacklejack, 0.25 + k * 0.6, 1);
    x = nx;
    y = ny;
  }
}

// ---------------------------------------------------------------- Grinner

/** A clown goon: holds a cream pie up and back (the tell: a red arc to Ben), then lobs it. */
export class GrinnerBrain implements DroneBrain {
  readonly kind = 'grinner' as const;
  readonly texture = CIRCUS_TEX.grinner;
  readonly maxHp = GRINNER.hp;
  readonly body = GRINNER.body;
  readonly walker = true;
  readonly organic = { glow: 0x9aff3a };
  readonly hackable = false;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const G = GRINNER;
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    switch (d.state) {
      case 'idle':
        if (!notices(d, w, G.noticeX, G.noticeY) || !f.grounded) {
          patrol(d, f, G.patrolSpeed, 50);
          break;
        }
        setFace(d, p.x - d.x);
        d.vx = damp(d.vx, 0.8);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.vx = 0;
          d.setState('windup');
          w.threat(d, w.now + G.windupMs);
          playSfx(CIRCUS_SFX.honk, 0.6, 1 + Math.random() * 0.2);
        }
        break;
      case 'windup': {
        d.vx = 0;
        setFace(d, p.x - d.x);
        const fromY = d.y - 12;
        const v = lob(d, w, G.pieSpeed, G.pieGravity, fromY);
        drawArc(d, w, v, fromY, G.pieGravity, d.stateT / G.windupMs);
        if (d.stateT >= G.windupMs) {
          w.projectiles.spawn('pie', 'enemy', d.x + faceOf(d) * 6, fromY, v.vx, v.vy, G.pieDamage, 1800, 5, { gravity: G.pieGravity });
          playSfx(CIRCUS_SFX.whoosh, 0.7);
          d.setState('throw');
        }
        break;
      }
      case 'throw':
        if (d.stateT >= 340) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(G.restMs));
        }
        break;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return GRINNER.contactDamage;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    if (d.state === 'windup') {
      w.cancelThreat(d);
      d.setState('idle');
      d.nextActionAt = w.now + 500;
    }
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'windup') show(d, 'grinner-windup');
    else if (d.state === 'throw') show(d, 'grinner-throw');
    else if (Math.abs(d.vx) > 4) show(d, 'grinner-walk');
    else show(d, 'grinner-idle');
  }
}

// ---------------------------------------------------------------- Jack-in-the-box

/**
 * A trap on the floor. Ben near: the crank turns and the tune speeds up (the
 * tell, the box shaking), then a boxing glove springs out along the floor
 * toward him. Hit it while it winds and it jams.
 */
export class JackboxBrain implements DroneBrain {
  readonly kind = 'jackbox' as const;
  readonly texture = CIRCUS_TEX.jackbox;
  readonly maxHp = JACKBOX.hp;
  readonly body = JACKBOX.body;
  readonly walker = true;
  readonly hackable = true;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const J = JACKBOX;
    walkPhysics(d, w, dtMs);
    d.vx = 0;
    const p = w.player;
    switch (d.state) {
      case 'idle':
        if (w.aggressive && !p.dead && !p.cloaked && Math.abs(p.x - d.x) < J.triggerX && Math.abs(p.y - (d.y + J.body.height / 2)) < J.triggerY && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          setFace(d, p.x - d.x);
          d.setState('wind');
          w.threat(d, w.now + J.windMs);
        }
        break;
      case 'wind': {
        // The tune speeds up as it winds; the lane it will punch along shows.
        const k = d.stateT / J.windMs;
        const step = J.tuneStepMs - k * J.tuneFasterMs;
        if (Math.floor(d.stateT / step) !== Math.floor((d.stateT - dtMs) / step)) playSfx(CIRCUS_SFX.tune, 0.35, 1 + k * 0.6);
        const dir = faceOf(d);
        const y = d.y + J.body.height / 2 - 6;
        w.telegraph.line(d.x + dir * 8, y, d.x + dir * J.reach, y, TELL.cacklejack, 0.3 + k * 0.6, 2);
        if (d.stateT >= J.windMs) {
          d.setState('pop');
          d.memo.hitDone = 0;
          playSfx(CIRCUS_SFX.boing, 0.9);
        }
        break;
      }
      case 'pop': {
        // The glove: out fast, holds, back.
        const t = d.stateT / J.punchMs;
        const reach = J.reach * Math.min(1, t * 4) * (t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1);
        d.memo.reach = reach;
        const dir = faceOf(d);
        const gx = d.x + dir * reach;
        const gy = d.y + J.body.height / 2 - 7;
        if (reach > 12 && !d.memo.hitDone && Math.abs(p.x - gx) < 10 && Math.abs(p.centerY - gy) < 14) {
          d.memo.hitDone = 1;
          w.punch?.(gx, gy, J.damage, dir * J.knockback);
        }
        if (d.stateT >= J.punchMs) {
          d.memo.hitDone = 0;
          d.memo.reach = 0;
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(J.restMs));
        }
        break;
      }
      case 'jammed':
        if (d.stateT >= J.jamMs) {
          d.setState('idle');
          d.nextActionAt = w.now + J.jamRecoverMs;
        }
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'jammed';
  }

  contactDamage(): number {
    return JACKBOX.contactDamage;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    if (d.state === 'wind') {
      // Jammed mid-tune: the crank snaps.
      w.cancelThreat(d);
      d.setState('jammed');
      w.fx.popText(d.x, d.y - 16, 'JAMMED!', 0x9aff3a);
      w.fx.burst('smoke', d.x, d.y - 8, 6);
      playSfx(CIRCUS_SFX.clunk, 0.8);
    }
  }

  onRecover(d: Drone): void {
    // Knocked about mid-punch: the glove snaps back in, ready to land next time.
    d.memo.hitDone = 0;
    d.memo.reach = 0;
    if (d.state !== 'jammed') d.setState('idle');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'wind') show(d, 'jackbox-wind');
    else if (d.state === 'pop') show(d, 'jackbox-pop');
    else if (d.state === 'jammed') show(d, 'jackbox-jammed');
    else show(d, 'jackbox-idle');
    this.drawGlove(d);
  }

  private glove: Phaser.GameObjects.Image | null = null;

  /** The boxing glove on its spring, out as far as the punch has reached. */
  private drawGlove(d: Drone): void {
    const reach = d.state === 'pop' ? (d.memo.reach ?? 0) : 0;
    if (reach <= 2) {
      this.glove?.setVisible(false);
      return;
    }
    if (!this.glove) this.glove = d.sprite.scene.add.image(0, 0, CIRCUS_ART.glove).setOrigin(1 / 40, 0.5).setDepth(d.sprite.depth + 1);
    const dir = faceOf(d);
    this.glove.setVisible(true).setPosition(d.x + dir * 4, d.y + JACKBOX.body.height / 2 - 7).setScale((dir * reach) / 36, 1);
  }

  deathFx(d: Drone, w: DroneWorld): void {
    this.glove?.destroy();
    this.glove = null;
    w.fx.burst('debris', d.x, d.y, 12);
    w.fx.burst('spark', d.x, d.y - 4, 6);
    w.fx.popText(d.x, d.y - 16, 'BOING!', 0x8ab0ff);
    playSfx(CIRCUS_SFX.boing, 0.8, 0.7);
  }
}

// ---------------------------------------------------------------- Balloon hound

/** A balloon dog: drifts, stretches (the tell: the squeak, a red line), swoops along that line. Pops in one hit into fear gas. */
export class HoundBrain implements DroneBrain {
  readonly kind = 'hound' as const;
  readonly texture = CIRCUS_TEX.hound;
  readonly maxHp = HOUND.hp;
  readonly body = HOUND.body;
  readonly organic = { glow: 0xd85ad8 };
  readonly hackable = false;

  update(d: Drone, w: DroneWorld): void {
    const Hh = HOUND;
    const p = w.player;
    const t = w.now * 0.001 + d.seed;
    switch (d.state) {
      case 'idle': {
        d.vx = (d.homeX + Math.sin(t * 0.7) * 24 - d.x) * 0.9;
        d.vy = (d.homeY + Math.sin(t * 1.6) * 6 - d.y) * 1.2;
        setFace(d, p.x - d.x);
        const near = w.aggressive && !p.dead && !p.cloaked && Math.hypot(p.x - d.x, p.centerY - d.y) < Hh.seekRange && w.onScreen(d.x, d.y, -10);
        if (near && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.aim = Math.atan2(p.centerY - d.y, p.x - d.x);
          d.setState('stretch');
          w.threat(d, w.now + Hh.stretchMs);
          playSfx(CIRCUS_SFX.squeak, 0.7, 1 + Math.random() * 0.3);
        }
        break;
      }
      case 'stretch': {
        d.vx = damp(d.vx, 0.8);
        d.vy = damp(d.vy, 0.8);
        if (d.stateT < Hh.stretchMs * 0.7) d.aim = Math.atan2(p.centerY - d.y, p.x - d.x);
        setFace(d, Math.cos(d.aim));
        const k = d.stateT / Hh.stretchMs;
        const len = Hh.swoopSpeed * (Hh.swoopMs / 1000);
        w.telegraph.line(d.x, d.y, d.x + Math.cos(d.aim) * len, d.y + Math.sin(d.aim) * len, TELL.cacklejack, 0.25 + k * 0.6, k > 0.7 ? 2 : 1);
        if (d.stateT >= Hh.stretchMs) d.setState('swoop');
        break;
      }
      case 'swoop':
        d.vx = Math.cos(d.aim) * Hh.swoopSpeed;
        d.vy = Math.sin(d.aim) * Hh.swoopSpeed;
        if (w.isSolid(d.x + Math.sign(d.vx) * 10, d.y) || w.isSolid(d.x, d.y + Math.sign(d.vy) * 8)) d.stateT = Hh.swoopMs;
        if (d.stateT >= Hh.swoopMs) {
          d.homeX = d.x;
          d.homeY = Math.min(d.y, w.groundBelow(d.x, d.y) - 40);
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(Hh.restMs));
        }
        break;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return HOUND.contactDamage;
  }

  deathFx(d: Drone, w: DroneWorld): void {
    // POP: a burst of rubber and a puff of fear gas.
    w.fx.burst('mana', d.x, d.y, 8);
    w.fx.popText(d.x, d.y - 10, 'POP!', 0xff8ad8);
    playSfx(CIRCUS_SFX.pop, 0.9, 0.9 + Math.random() * 0.3);
    circusEnv.gas?.(d.x, d.y);
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'stretch') show(d, 'hound-stretch');
    else if (d.state === 'swoop') show(d, 'hound-swoop');
    else show(d, 'hound-float');
  }
}

// ---------------------------------------------------------------- Stilt walker

/**
 * A tall clown on stilts: draws one stilt back (the tell: a red sweep line
 * along the floor) and kicks it across. Low hits take out his stilts; two
 * (or one roll or smash) and he topples, open to everything for a while.
 */
export class StiltsBrain implements DroneBrain {
  readonly kind = 'stilts' as const;
  readonly texture = CIRCUS_TEX.stilts;
  readonly maxHp = STILTS.hp;
  readonly body = STILTS.body;
  readonly walker = true;
  readonly organic = { glow: 0xff8a2a };
  readonly hackable = false;
  readonly stopsThrows = true;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const S = STILTS;
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    if (d.memo.stilts === undefined) d.memo.stilts = S.stiltHits;
    switch (d.state) {
      case 'idle':
        if (!notices(d, w, S.noticeX, S.noticeY) || !f.grounded) {
          patrol(d, f, S.walkSpeed, 60);
          break;
        }
        setFace(d, p.x - d.x);
        // Stalks toward Ben until he's in kicking range.
        d.vx = Math.abs(p.x - d.x) > S.kickReach - 6 ? faceOf(d) * S.walkSpeed : damp(d.vx, 0.7);
        if (Math.abs(p.x - d.x) < S.kickReach + 8 && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.vx = 0;
          d.setState('windup');
          w.threat(d, w.now + S.windupMs);
        }
        break;
      case 'windup': {
        d.vx = 0;
        const k = d.stateT / S.windupMs;
        const feet = d.y + S.body.height / 2;
        const dir = faceOf(d);
        w.telegraph.line(d.x, feet - 6, d.x + dir * S.kickReach, feet - 6, TELL.cacklejack, 0.3 + k * 0.6, 2);
        if (d.stateT >= S.windupMs) {
          d.setState('kick');
          d.memo.kicked = 0;
          playSfx(CIRCUS_SFX.whoosh, 0.9, 0.7);
        }
        break;
      }
      case 'kick': {
        const feet = d.y + S.body.height / 2;
        const dir = faceOf(d);
        if (!d.memo.kicked && d.stateT > S.kickMs * 0.3) {
          d.memo.kicked = 1;
          const inX = (p.x - d.x) * dir > -4 && (p.x - d.x) * dir < S.kickReach;
          if (inX && p.y > feet - S.kickHeight && p.y <= feet + 4) w.punch?.(d.x + dir * S.kickReach * 0.6, feet - 8, S.kickDamage, dir * S.kickKnockback);
        }
        if (d.stateT >= S.kickMs) {
          d.memo.kicked = 0;
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(S.restMs));
        }
        break;
      }
      case 'topple':
        d.vx = 0;
        if (d.stateT >= S.toppleMs) d.setState('down');
        break;
      case 'down':
        d.vx = 0;
        if (d.stateT >= S.downMs) {
          d.memo.stilts = S.stiltHits;
          d.setState('idle');
          d.nextActionAt = w.now + S.upRecoverMs;
        }
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'topple' && d.state !== 'down';
  }

  contactDamage(): number {
    return STILTS.contactDamage;
  }

  damageTakenMultiplier(d: Drone): number {
    return d.state === 'down' || d.state === 'topple' ? STILTS.downDamageTaken : 1;
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    if (d.state === 'topple' || d.state === 'down') return;
    const feet = d.y + STILTS.body.height / 2;
    const low = hit.y > feet - STILTS.lowZone || hit.roll === true;
    if (!low && !hit.heavy) return;
    d.memo.stilts = (d.memo.stilts ?? STILTS.stiltHits) - (hit.roll || hit.kind === 'smash' ? STILTS.stiltHits : 1);
    if (d.memo.stilts > 0) {
      w.fx.popText(d.x, feet - 30, 'WOBBLE!', 0xff8a2a);
      return;
    }
    w.cancelThreat(d);
    d.setState('topple');
    w.fx.popText(d.x, feet - 40, 'TIMBER!', 0xff8a2a);
    playSfx(CIRCUS_SFX.timber, 0.9);
  }

  onRecover(d: Drone): void {
    // Knocked out of a kick: the next one can land.
    d.memo.kicked = 0;
    if (d.state !== 'topple' && d.state !== 'down') d.setState('idle');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'windup') show(d, 'stilts-windup');
    else if (d.state === 'kick') show(d, 'stilts-kick');
    else if (d.state === 'topple') show(d, 'stilts-topple');
    else if (d.state === 'down') show(d, 'stilts-down');
    else show(d, 'stilts-walk');
  }
}

// ---------------------------------------------------------------- Reflection

/**
 * A dark copy of Ben out of a mirror. It waits in the glass until Ben comes
 * near, steps out, keeps its distance, and when Ben strikes it strikes back a
 * beat later (the tell: it copies his wind-up). Strike when it isn't copying.
 */
export class ReflectionBrain implements DroneBrain {
  readonly kind = 'reflection' as const;
  readonly texture = TEX.ben;
  readonly maxHp = REFLECTION.hp;
  readonly body = REFLECTION.body;
  readonly walker = true;
  readonly hackable = false;
  readonly organic = { glow: 0xb88aff };

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const R = REFLECTION;
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    const last = circusEnv.lastAttack;
    switch (d.state) {
      case 'idle':
        // Still in the glass: it shows only when Ben is near enough to see himself.
        d.vx = 0;
        if (w.aggressive && !p.dead && Math.abs(p.x - d.x) < R.wakeX && Math.abs(p.centerY - d.y) < 60) {
          d.setState('step');
          w.fx.burst('crystal', d.x, d.y, 8);
          playSfx(CIRCUS_SFX.glass, 0.6, 1.3);
        }
        break;
      case 'step':
      case 'stalk': {
        setFace(d, p.x - d.x);
        const gap = Math.abs(p.x - d.x);
        d.vx = f.grounded ? (gap > R.reach + 10 ? faceOf(d) * R.walkSpeed : gap < R.reach - 6 ? -faceOf(d) * R.walkSpeed * 0.6 : damp(d.vx, 0.7)) : d.vx;
        if (d.state === 'step' && d.stateT > 300) d.setState('stalk');
        // Ben struck since its last answer: it copies him a beat later.
        if (last.at > (d.memo.answered ?? -Infinity) && w.now >= (d.memo.readyAt ?? 0) && d.stunLeft <= 0 && gap < 90) {
          d.memo.answered = last.at;
          d.setState('copy');
          w.threat(d, last.at + R.echoMs);
        }
        break;
      }
      case 'copy': {
        d.vx = 0;
        const dueAt = (d.memo.answered ?? 0) + R.echoMs;
        if (w.now >= dueAt) {
          const dir = faceOf(d);
          if ((p.x - d.x) * dir > -4 && Math.abs(p.x - d.x) < R.reach + 6 && Math.abs(p.centerY - d.y) < 18) w.punch?.(d.x + dir * 10, d.y, R.damage, dir * R.knockback);
          w.fx.burst('crystal', d.x + dir * 12, d.y - 2, 3);
          d.memo.readyAt = w.now + R.cooldownMs;
          d.setState('strike');
        }
        break;
      }
      case 'strike':
        d.vx = 0;
        if (d.stateT >= 220) d.setState('stalk');
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'idle';
  }

  contactDamage(): number {
    return REFLECTION.contactDamage;
  }

  /** Still in its mirror it can't be hit (it's glass). */
  damageTakenMultiplier(d: Drone): number {
    return d.state === 'idle' ? 0 : 1;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    if (d.state === 'copy') {
      // Struck while it copies: the echo breaks.
      w.cancelThreat(d);
      d.setState('stalk');
    }
  }

  onRecover(d: Drone): void {
    if (d.state !== 'idle') d.setState('stalk');
  }

  deathFx(d: Drone, w: DroneWorld): void {
    w.fx.burst('crystal', d.x, d.y, 14);
    w.fx.popText(d.x, d.y - 16, 'SHATTER!', 0xd8c8ff);
    playSfx(CIRCUS_SFX.glass, 1);
  }

  render(d: Drone): void {
    const s = d.sprite;
    s.setFlipX(faceOf(d) < 0);
    s.setVisible(d.state !== 'idle');
    if (!s.isTinted) s.setTint(REFLECTION.tint);
    if (d.state === 'copy' || d.state === 'strike') show(d, 'reflection-punch');
    else if (Math.abs(d.vx) > 6) show(d, 'reflection-run');
    else show(d, 'reflection-idle');
  }
}
