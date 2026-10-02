import { LURKER, MUTANT_SHARED } from '../../../config/mutants';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { playSfx } from '../../../systems/audio/Sfx';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, setFace, walkPhysics } from './kit';

/**
 * Should a hidden lurker show? Pure, so the rules are unit tested: Wildmutt's
 * senses reach it, goo is on it, it was just hit, or it's winding up to spit
 * (its throat glows: the tell is always fair).
 */
export function lurkerVisible(distance: number, senseRadius: number, slimed: boolean, revealedUntil: number, now: number, attacking: boolean): boolean {
  return (senseRadius > 0 && distance <= senseRadius) || slimed || now < revealedUntil || attacking;
}

/**
 * Mutant chameleon: invisible, still, patient. Its throat swells green and an
 * eye glints before it spits a glob of mutagen, then it slinks off. Wildmutt
 * senses it from a distance; a slime glob paints it for everyone.
 */
export class LurkerBrain implements DroneBrain {
  readonly kind = 'lurker' as const;
  readonly texture = TEX.lurker;
  readonly maxHp = LURKER.hp;
  readonly body = LURKER.body;
  readonly walker = true;
  readonly organic = { glow: MUTANT_SHARED.glow };
  private visible = false;
  private shown = 0;

  /** Hidden lurkers can't be locked onto. */
  get evasive(): boolean {
    return !this.visible;
  }

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    const dist = Math.hypot(p.x - d.x, p.centerY - d.y);
    this.visible = lurkerVisible(dist, p.senseRadius, d.slime.slowed, d.memo.revealUntil ?? 0, w.now, d.state === 'aim');
    switch (d.state) {
      case 'idle':
        d.vx *= 0.8;
        if (w.aggressive && !p.dead && dist < LURKER.range && w.now >= d.nextActionAt && d.stunLeft <= 0 && w.onScreen(d.x, d.y, 0)) {
          setFace(d, p.x - d.x);
          d.setState('aim');
          d.setCharging(true);
          w.threat(d, w.now + LURKER.aimMs + 260);
          playSfx('croak', 0.35, 1.8);
        }
        break;
      case 'aim':
        d.vx = 0;
        setFace(d, p.x - d.x);
        if (d.stateT >= LURKER.aimMs) this.spit(d, w);
        break;
      case 'slink':
        d.vx = f.wall || f.ledge ? 0 : (d.memo.slink ?? 1) * LURKER.slinkSpeed;
        if (d.stateT >= LURKER.slinkMs) {
          d.vx = 0;
          d.setState('idle');
        }
        break;
    }
    // A wanted-poster shimmer where it sits: hidden, but never completely.
    if (!this.visible && Math.random() < 0.02) w.fx.burst('sense', d.x + (Math.random() - 0.5) * 12, d.y, 1);
  }

  private spit(d: Drone, w: DroneWorld): void {
    const p = w.player;
    const dx = p.x - d.x;
    const dy = p.centerY - d.y;
    // A lob that lands on Ben: aim a bit above, let gravity bring it down.
    const t = Math.max(0.25, Math.abs(dx) / LURKER.spitSpeed);
    const vx = dx / t;
    const vy = dy / t - 0.5 * LURKER.spitGravity * t;
    const mx = d.x + faceOf(d) * 8;
    w.projectiles.spawn('spit', 'enemy', mx, d.y - 2, vx, vy, LURKER.spitDamage, 2200, LURKER.spitRadius, { gravity: LURKER.spitGravity });
    w.fx.burst('goo', mx, d.y - 2, 5);
    playSfx('splat', 0.6, 1.5);
    w.threat(d, w.now);
    d.setCharging(false);
    d.memo.revealUntil = w.now + 500;
    d.memo.slink = Math.random() < 0.5 ? -1 : 1;
    d.nextActionAt = w.now + pace.rest(rand(LURKER.fireIntervalMs));
    d.setState('slink');
  }

  harmful(): boolean {
    return this.visible;
  }

  contactDamage(): number {
    return LURKER.contactDamage;
  }

  onHurt(d: Drone, w: DroneWorld, _hit: Hit): void {
    d.memo.revealUntil = w.now + LURKER.revealMs;
    if (d.state === 'aim') {
      w.cancelThreat(d);
      d.setCharging(false);
      d.setState('slink');
    }
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    // Fade in and out rather than pop.
    const target = this.visible || d.downed ? 1 : LURKER.hiddenAlpha;
    this.shown += (target - this.shown) * 0.2;
    d.sprite.setAlpha(this.shown);
    if (d.state === 'aim') {
      const glint = blinkOn(d.stateT, 90);
      w.lighting.add(d.x + faceOf(d) * 6, d.y - 2, 26, PALETTE.mutagen, glint ? 1 : 0.5);
      if (glint) w.fx.burst('sense', d.x + faceOf(d) * 7, d.y - 5, 1);
    }
    // Wildmutt sees it: an orange outline glow.
    if (this.visible && w.player.senseRadius > 0 && !d.slime.slowed) w.lighting.add(d.x, d.y, 30, 0xffb070, 0.6);
  }
}
