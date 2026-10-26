import { WARDEN } from '../../../config/plumber';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { DEEP_TEX } from '../../../scenes/preload/cartoon/plumber/deepSheets';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import { lineOfSight, rand, steer } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { show } from '../magic/kit';
import { faceOf, setFace } from '../mutants/kit';
import { DEEP_SFX } from './sfx';

/** The scan light's colour: the base's own green (the red lock is the tell). */
const SCAN_LIGHT = 0x9affd0;

/**
 * A Plumber security sentry, thirty years asleep and woken in lockdown. It
 * hovers its beat sweeping a green scan light; when the light finds Ben it
 * turns red and locks on (the tell: a red line to him), then fires a stun
 * beam. It flies the same in air and water. Upgrade can take it over.
 */
export class WardenBrain implements DroneBrain {
  readonly kind = 'warden' as const;
  readonly texture = DEEP_TEX.warden;
  readonly maxHp = WARDEN.hp;
  readonly body = WARDEN.body;

  update(d: Drone, w: DroneWorld): void {
    const W = WARDEN;
    const p = w.player;
    const t = w.now * 0.001;
    switch (d.state) {
      case 'idle': {
        // Its beat: drifting around home, the light sweeping ahead of it and down.
        steer(d, d.homeX + Math.sin(t * 0.7 + d.seed) * W.hover, d.homeY + Math.sin(t * 1.3 + d.seed) * 6, W.speed, 1.2);
        if (Math.abs(d.vx) > 8) setFace(d, d.vx);
        const base = faceOf(d) > 0 ? 0.45 : Math.PI - 0.45;
        d.aim = base + Math.sin(t * W.sweepSpeed * 2 + d.seed) * 0.5 * faceOf(d);
        this.drawScan(d, w);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0 && this.inLight(d, w)) {
          d.setState('lock');
          d.lockX = p.x;
          d.lockY = p.centerY;
          w.threat(d, w.now + W.lockMs);
          playSfx(DEEP_SFX.lock, 0.8);
          w.fx.popText(d.x, d.y - 14, '!', PALETTE.enemy);
        }
        break;
      }
      case 'lock': {
        d.vx *= 0.85;
        d.vy *= 0.85;
        // It tracks him most of the way, then holds still for a fair dodge.
        if (d.stateT < W.lockMs * 0.7) {
          d.lockX = p.x;
          d.lockY = p.centerY;
        }
        d.aim = Math.atan2(d.lockY - d.y, d.lockX - d.x);
        setFace(d, d.lockX - d.x);
        const k = d.stateT / W.lockMs;
        w.telegraph.line(d.x, d.y, d.lockX, d.lockY, TELL.plumber, 0.3 + k * 0.6, 1);
        w.lighting.add(d.x + Math.cos(d.aim) * 8, d.y + Math.sin(d.aim) * 8, 26, PALETTE.enemy, 0.5 + k * 0.4);
        if (d.stateT >= W.lockMs) {
          this.fire(d, w);
          d.setState('fire');
        }
        break;
      }
      case 'fire':
        d.vx *= 0.9;
        d.vy *= 0.9;
        if (d.stateT >= 260) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(W.restMs));
        }
        break;
    }
  }

  /** Ben stands in the scan light (and nothing's in the way). */
  private inLight(d: Drone, w: DroneWorld): boolean {
    const p = w.player;
    if (!w.aggressive || p.dead || p.cloaked) return false;
    const dx = p.x - d.x;
    const dy = p.centerY - d.y;
    if (Math.hypot(dx, dy) > WARDEN.scanRange) return false;
    let diff = Math.atan2(dy, dx) - d.aim;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    return Math.abs(diff) < WARDEN.scanHalfAngle && lineOfSight(w, d.x, d.y, p.x, p.centerY);
  }

  /** The scan light: a pale green cone (two faint edges and pools of light where it falls). Not a tell: the lock is. */
  private drawScan(d: Drone, w: DroneWorld): void {
    if (!w.onScreen(d.x, d.y, 60)) return;
    const W = WARDEN;
    const color = SCAN_LIGHT;
    for (const s of [-1, 1]) {
      const a = d.aim + s * W.scanHalfAngle;
      w.telegraph.line(d.x, d.y, d.x + Math.cos(a) * W.scanRange * 0.8, d.y + Math.sin(a) * W.scanRange * 0.8, color, 0.18, 1);
    }
    for (const k of [0.35, 0.65]) w.lighting.add(d.x + Math.cos(d.aim) * W.scanRange * k, d.y + Math.sin(d.aim) * W.scanRange * k, 18 + k * 26, color, 0.35);
  }

  private fire(d: Drone, w: DroneWorld): void {
    const W = WARDEN;
    const ox = d.x + Math.cos(d.aim) * 9;
    const oy = d.y + Math.sin(d.aim) * 9;
    w.projectiles.spawn('laser', 'enemy', ox, oy, Math.cos(d.aim) * W.beamSpeed, Math.sin(d.aim) * W.beamSpeed, W.beamDamage, W.beamLifeMs, 4);
    w.fx.burst('red', ox, oy, 5);
    w.lighting.flash(ox, oy, 46, PALETTE.enemy, 140);
    d.kx -= Math.cos(d.aim) * 60;
    playSfx(DEEP_SFX.beam, 0.8);
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return WARDEN.contactDamage;
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'lock') show(d, 'warden-lock');
    else if (d.state === 'fire') show(d, 'warden-fire');
    else show(d, 'warden-idle');
    // Its lens glows (green on its beat, red when it has him).
    if (d.alive && !d.downed) w.lighting.add(d.x + faceOf(d) * 4, d.y, 16, d.state === 'idle' ? PALETTE.plumber : PALETTE.enemy, 0.6);
  }
}
