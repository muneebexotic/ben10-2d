import { CRABBOT } from '../../../config/bounty';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { CH5_TEX } from '../../../scenes/preload/bounty/keys';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import { burrow, crabClick, erupt, pinch, shellFlip } from '../../../systems/audio/bountySfx';
import { chance, damp } from '../../../systems/Pacing';
import type { Hit } from '../../types';
import { crabShelled } from '../../hunters/huntRules';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';

const UNDERGROUND = new Set(['burrow', 'tunnel', 'crack']);

/**
 * Kraab's crab-bot. Up close it raises its claws (the tell) and pinches. At
 * range it burrows: a crack races along the floor toward Ben, stops under
 * him and pulses (the tell), then it erupts claws-first. Its front shell
 * shrugs off light hits; a heavy hit (a smash, a slam, a thrown enemy) flips
 * it onto its back, legs kicking, wide open.
 */
export class CrabbotBrain implements DroneBrain {
  readonly kind = 'crabbot' as const;
  readonly texture = CH5_TEX.crabbot;
  readonly maxHp = CRABBOT.hp;
  readonly body = CRABBOT.body;
  readonly walker = true;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    const floor = d.y + CRABBOT.body.height / 2;
    switch (d.state) {
      case 'idle': {
        const dx = p.x - d.x;
        if (!notices(d, w, CRABBOT.noticeX, 60) || !f.grounded) {
          patrol(d, f, CRABBOT.patrolSpeed, 48);
          break;
        }
        setFace(d, dx);
        if (w.now < d.nextActionAt || d.stunLeft > 0) {
          d.vx = damp(d.vx, 0.8);
          break;
        }
        if (Math.abs(dx) < CRABBOT.pinchRange) {
          d.vx = 0;
          d.setState('windup');
          w.threat(d, w.now + CRABBOT.pinchWindupMs);
        } else if (Math.abs(dx) > CRABBOT.burrowRange) {
          d.vx = 0;
          d.setState('burrow');
          playSfx(burrow, 0.6);
          w.fx.burst('dust', d.x, floor, 10);
        } else {
          d.vx = Math.sign(dx) * CRABBOT.walkSpeed;
          if (f.wall || f.ledge) d.vx = 0;
          if (chance(0.03)) playSfx(crabClick, 0.4);
        }
        break;
      }
      case 'windup':
        d.vx = 0;
        // Claws up and snapping (the frame is the tell; the zone shows the reach).
        w.telegraph.zone(d.x + faceOf(d) * 10 - 14, floor - 18, 28, 18, TELL.kraab, 0.4 + d.stateT / CRABBOT.pinchWindupMs * 0.5, d.stateT * 0.05, faceOf(d));
        if (d.stateT >= CRABBOT.pinchWindupMs) {
          d.setState('pinch');
          d.kx += faceOf(d) * 160;
          playSfx(pinch, 0.9);
        }
        break;
      case 'pinch':
        d.vx = 0;
        if (d.stateT >= CRABBOT.pinchMs) this.rest(d, w);
        break;
      case 'burrow':
        d.vx = 0;
        if (chance(0.5)) w.fx.burst('dust', d.x + (Math.random() - 0.5) * 16, floor, 1);
        if (d.stateT >= CRABBOT.burrowMs) {
          d.memo.fromX = d.x;
          d.setState('tunnel');
        }
        break;
      case 'tunnel': {
        // A crack races along the floor toward where Ben stands.
        const dx = p.x - d.x;
        setFace(d, dx);
        d.vx = Math.sign(dx) * CRABBOT.tunnelSpeed;
        const arrived = Math.abs(dx) < 6;
        if (f.wall || f.ledge || arrived || d.stateT >= CRABBOT.tunnelMaxMs) {
          d.vx = 0;
          d.setState('crack');
          w.threat(d, w.now + CRABBOT.crackHoldMs);
          playSfx(burrow, 0.8, 1.3);
        }
        w.telegraph.dashed(d.memo.fromX ?? d.x, floor - 1, d.x, floor - 1, TELL.kraab, 0.6, d.stateT * 0.1, 2);
        if (chance(0.6)) w.fx.burst('dust', d.x, floor, 1);
        break;
      }
      case 'crack': {
        d.vx = 0;
        const t = d.stateT / CRABBOT.crackHoldMs;
        w.telegraph.zone(d.x - 14, floor - 26, 28, 26, TELL.kraab, 0.45 + t * 0.5 + (blinkOn(d.stateT, 80) ? 0.1 : 0), d.stateT * 0.08, 0);
        if (chance(0.5)) w.fx.burst('debris', d.x + (Math.random() - 0.5) * 18, floor, 1);
        if (d.stateT >= CRABBOT.crackHoldMs) {
          d.setState('erupt');
          d.ky = -260;
          w.fx.burst('debris', d.x, floor, 14);
          w.fx.burst('dust', d.x, floor, 12);
          w.fx.shake(0.005, 140);
          playSfx(erupt, 0.9);
        }
        break;
      }
      case 'erupt':
        d.vx = 0;
        if (d.stateT >= CRABBOT.eruptMs && f.grounded) this.rest(d, w);
        break;
      case 'flipped':
        d.vx = damp(d.vx, 0.8);
        if (chance(0.06)) w.fx.burst('spark', d.x, d.y - 4, 1);
        if (d.stateT >= pace.punish(CRABBOT.flippedMs)) {
          d.ky = -160;
          playSfx(shellFlip, 0.6, 1.2);
          this.rest(d, w);
        }
        break;
    }
  }

  private rest(d: Drone, w: DroneWorld): void {
    d.setState('idle');
    d.nextActionAt = w.now + pace.rest(rand(CRABBOT.restMs));
  }

  harmful(d: Drone): boolean {
    return d.state !== 'flipped' && !UNDERGROUND.has(d.state);
  }

  contactDamage(d: Drone): number {
    if (d.state === 'pinch') return CRABBOT.pinchDamage;
    if (d.state === 'erupt') return CRABBOT.eruptDamage;
    return CRABBOT.contactDamage;
  }

  damageTakenMultiplier(d: Drone, hit: Hit): number {
    if (d.state === 'flipped') return CRABBOT.flippedMultiplier;
    if (UNDERGROUND.has(d.state)) return hit.heavy || hit.kind === 'smash' ? 1 : 0.5;
    return crabShelled(faceOf(d), d.x, false, hit) ? CRABBOT.shellMultiplier : 1;
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    if (d.state === 'flipped') return;
    if (hit.heavy || hit.kind === 'smash') {
      // Over it goes: on its back, legs kicking, wide open.
      w.cancelThreat(d);
      d.setState('flipped');
      d.ky = -140;
      w.fx.popText(d.x, d.y - 14, 'FLIPPED!', PALETTE.kraab);
      playSfx(shellFlip, 0.9);
      return;
    }
    if (crabShelled(faceOf(d), d.x, false, hit)) {
      w.fx.burst('spark', d.x + faceOf(d) * 10, d.y - 2, 4);
      playSfx('armorTink', 0.6, 1.2);
    }
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone, w: DroneWorld): void {
    const s = d.sprite;
    s.setFlipX(faceOf(d) < 0);
    const frame = d.state === 'flipped' ? 4 : UNDERGROUND.has(d.state) ? 3 : d.state === 'windup' || d.state === 'pinch' || d.state === 'erupt' ? 2 : -1;
    if (frame >= 0) {
      if (s.anims.isPlaying) s.stop();
      if (String(s.frame.name) !== String(frame)) s.setFrame(frame);
    } else {
      const key = Math.abs(d.vx) > 5 ? 'crabbot-walk' : 'crabbot-idle';
      if (s.anims.currentAnim?.key !== key || !s.anims.isPlaying) s.play(key, true);
    }
    w.lighting.add(d.x + faceOf(d) * 6, d.y - 8, 12, PALETTE.kraab, UNDERGROUND.has(d.state) ? 0.25 : 0.6);
  }
}
