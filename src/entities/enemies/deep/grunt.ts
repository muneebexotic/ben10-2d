import { GRUNT } from '../../../config/plumber';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { DEEP_TEX } from '../../../scenes/preload/cartoon/plumber/deepSheets';
import { pace } from '../../../systems/Difficulty';
import { chance, damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { show } from '../magic/kit';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';
import { surfaceAt } from './kit';
import { DEEP_SFX } from './sfx';

/**
 * Deepmaw's crew: a fish in a battered diving suit with a fishbowl helmet full
 * of water. It winds a harpoon back over its shoulder (the tell: a red arc to
 * Ben) and throws it in a low arc. Crack the bowl (two hits; a smash or fire
 * at once) and it's a fish out of water: it flops about helplessly, then
 * passes out, unless it lands back in a tank.
 */
export class GruntBrain implements DroneBrain {
  readonly kind = 'grunt' as const;
  readonly texture = DEEP_TEX.grunt;
  readonly maxHp = GRUNT.hp;
  readonly body = GRUNT.body;
  readonly walker = true;
  readonly organic = { glow: 0x6ad8ff };
  readonly hackable = false;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const G = GRUNT;
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    if (d.memo.bowl === undefined) d.memo.bowl = G.bowlHits;
    const wet = surfaceAt(d.x, d.y) !== null;
    switch (d.state) {
      case 'idle':
        if (!notices(d, w, G.noticeX, 70) || !f.grounded) {
          patrol(d, f, G.patrolSpeed * (wet ? 0.6 : 1), 50);
          break;
        }
        setFace(d, p.x - d.x);
        d.vx = damp(d.vx, 0.8);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.vx = 0;
          d.setState('windup');
          w.threat(d, w.now + G.windupMs);
          playSfx(DEEP_SFX.harpoonCock, 0.7);
        }
        break;
      case 'windup': {
        d.vx = 0;
        setFace(d, p.x - d.x);
        const k = d.stateT / G.windupMs;
        const v = this.throwVelocity(d, w);
        // The arc it's about to throw along.
        let x = d.x + faceOf(d) * 6;
        let y = d.y - 8;
        const dt = 0.06;
        for (let i = 0; i < 6; i++) {
          const nx = x + v.vx * dt;
          const ny = y + (v.vy + G.harpoonGravity * dt * (i + 0.5)) * dt;
          if (i % 2 === 0) w.telegraph.line(x, y, nx, ny, TELL.deepmaw, 0.25 + k * 0.6, 1);
          x = nx;
          y = ny;
        }
        if (d.stateT >= G.windupMs) {
          w.projectiles.spawn('needle', 'enemy', d.x + faceOf(d) * 6, d.y - 8, v.vx, v.vy, G.harpoonDamage, 1600, 4, { gravity: G.harpoonGravity });
          playSfx(DEEP_SFX.harpoon, 0.8);
          d.setState('throw');
        }
        break;
      }
      case 'throw':
        if (d.stateT >= 320) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(G.restMs));
        }
        break;
      case 'flop':
        // A fish on the deck: flipping and flapping, going nowhere.
        d.vx = damp(d.vx, 0.9);
        if (f.grounded && chance(0.04)) {
          d.vy = -90;
          d.vx = (Math.random() - 0.5) * 50;
          w.fx.burst('splash', d.x, d.y + G.body.height / 2, 3);
        }
        if (wet) {
          // Back in the water: it breathes again (no bowl needed now).
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(G.restMs));
          break;
        }
        if (d.stateT >= G.flopMs) {
          w.fx.popText(d.x, d.y - 16, 'GLUB...', 0x9ad8ff);
          d.kill();
        }
        break;
    }
  }

  /** Thrown to land on Ben: flat out, with the arc's drop made up. */
  private throwVelocity(d: Drone, w: DroneWorld): { vx: number; vy: number } {
    const G = GRUNT;
    const dx = w.player.x - d.x;
    const dy = w.player.centerY - (d.y - 8);
    const vx = Math.sign(dx || faceOf(d)) * G.harpoonSpeed;
    const t = Math.max(0.15, Math.min(1.2, Math.abs(dx) / G.harpoonSpeed));
    const vy = Math.max(-200, Math.min(120, dy / t - 0.5 * G.harpoonGravity * t));
    return { vx, vy };
  }

  harmful(d: Drone): boolean {
    return d.state !== 'flop';
  }

  contactDamage(): number {
    return GRUNT.contactDamage;
  }

  damageTakenMultiplier(d: Drone): number {
    return d.state === 'flop' ? GRUNT.flopDamageTaken : 1;
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    if (d.state === 'windup') {
      w.cancelThreat(d);
      d.setState('idle');
      d.nextActionAt = w.now + 400;
    }
    if (d.memo.bowl === undefined) d.memo.bowl = GRUNT.bowlHits;
    if (d.memo.bowl <= 0) return;
    d.memo.bowl = hit.kind === 'smash' || hit.kind === 'fire' || hit.heavy ? 0 : d.memo.bowl - 1;
    if (d.memo.bowl > 0) {
      w.fx.popText(d.x, d.y - 18, 'CRACK!', 0xbaf0ff);
      return;
    }
    // The bowl shatters: water everywhere.
    w.fx.burst('splash', d.x, d.y - 10, 14);
    w.fx.burst('crystal', d.x, d.y - 10, 8);
    playSfx(DEEP_SFX.glass, 1);
    if (surfaceAt(d.x, d.y) === null) {
      w.cancelThreat(d);
      d.setState('flop');
      w.fx.popText(d.x, d.y - 18, 'FISH OUT OF WATER!', PALETTE.ripjaws, 0.8);
    }
  }

  onRecover(d: Drone): void {
    if (d.state !== 'flop') d.setState('idle');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    // The rig shows the bowl while it's whole (its frames carry the bowl's state).
    const bare = (d.memo.bowl ?? 1) <= 0;
    if (d.state === 'flop') show(d, 'grunt-flop');
    else if (d.state === 'windup') show(d, bare ? 'grunt-windupBare' : 'grunt-windup');
    else if (d.state === 'throw') show(d, bare ? 'grunt-throwBare' : 'grunt-throw');
    else if (Math.abs(d.vx) > 4) show(d, bare ? 'grunt-walkBare' : 'grunt-walk');
    else show(d, bare ? 'grunt-idleBare' : 'grunt-idle');
  }
}
