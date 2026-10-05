import { MASCOT, ROBOT_SHARED } from '../../../config/robots';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import { chance, damp } from '../../../systems/Pacing';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';

/**
 * TOKEN TOON mascot: one of the arcade's animatronic band, woken wrong by
 * Kevin's power surge. It lurches at Ben, raises its cymbals with its eyes
 * flashing red (the tell, with a target where they'll land), then smashes
 * them into the floor: a short shockwave runs out each way. The smash leaves
 * it bent over and open for a moment.
 */
export class MascotBrain implements DroneBrain {
  readonly kind = 'mascot' as const;
  readonly texture = TEX.mascot;
  readonly maxHp = MASCOT.hp;
  readonly body = MASCOT.body;
  readonly walker = true;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    switch (d.state) {
      case 'idle':
        patrol(d, f, MASCOT.patrolSpeed, 40);
        if (notices(d, w, MASCOT.noticeX, 80)) d.setState('walk');
        break;
      case 'walk': {
        const dx = p.x - d.x;
        setFace(d, dx);
        // At the end of its leash it stands its ground, facing Ben.
        const leashed = d.homeX >= 0 && Math.abs(d.x - d.homeX) >= MASCOT.leash && Math.sign(dx) === Math.sign(d.x - d.homeX);
        if (f.grounded) d.vx = leashed ? 0 : Math.sign(dx) * MASCOT.walkSpeed * (f.ledge ? 0 : 1);
        if (Math.floor(d.stateT / 420) !== Math.floor((d.stateT - dtMs) / 420)) playSfx('servo', 0.35, 0.8 + Math.random() * 0.3);
        if (!notices(d, w, MASCOT.noticeX * 1.3, 100)) d.setState('idle');
        else if (Math.abs(dx) < MASCOT.smashRange && f.grounded && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.setState('windup');
          d.vx = 0;
          d.setCharging(true);
          w.threat(d, w.now + MASCOT.windupMs);
          playSfx('servo', 0.8, 1.4);
        }
        break;
      }
      case 'windup': {
        d.vx = damp(d.vx, 0.6);
        const tx = d.x + faceOf(d) * 18;
        const floor = d.y + MASCOT.body.height / 2;
        w.telegraph.target(tx, floor - 2, 14 + (d.stateT / MASCOT.windupMs) * 8, PALETTE.enemy, blinkOn(d.stateT, 90) ? 0.9 : 0.5);
        if (d.stateT >= MASCOT.windupMs) this.smash(d, w);
        break;
      }
      case 'smash':
        d.vx = 0;
        if (d.stateT >= MASCOT.smashMs) {
          d.setState('recover');
          d.setCharging(false);
        }
        break;
      case 'recover':
        d.vx = 0;
        if (chance(0.1)) w.fx.burst('spark', d.x + (Math.random() - 0.5) * 10, d.y - 12, 2);
        if (d.stateT >= pace.punish(MASCOT.recoverMs)) {
          d.nextActionAt = w.now + pace.rest(rand(MASCOT.restMs));
          d.setState('walk');
        }
        break;
    }
  }

  private smash(d: Drone, w: DroneWorld): void {
    d.setState('smash');
    d.sprite.setFrame(3);
    const floor = d.y + MASCOT.body.height / 2;
    const x = d.x + faceOf(d) * 16;
    const W = MASCOT.wave;
    for (const dir of [-1, 1] as const) {
      w.projectiles.spawn('wave', 'enemy', x + dir * 6, floor - W.radius, dir * W.speed, 0, W.damage, W.lifeMs, W.radius, { hugGround: true, pierce: true, tint: PALETTE.gold });
    }
    w.fx.burst('dust', x, floor, 10);
    w.fx.crack(x, floor, 0.5);
    w.fx.shake(0.006, 160);
    w.cancelThreat(d);
    playSfx('clang', 0.9, 0.9 + Math.random() * 0.2);
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(d: Drone): number {
    return d.state === 'smash' ? MASCOT.smashDamage : MASCOT.contactDamage;
  }

  /** Bent over after a smash: its exposed back takes extra. */
  damageTakenMultiplier(d: Drone): number {
    return d.state === 'recover' ? 1.5 : 1;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    if (d.state === 'windup' && d.downedLeft > 0) w.cancelThreat(d);
  }

  onRecover(d: Drone): void {
    d.setState('walk');
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'walk' || d.state === 'idle') {
      if (d.sprite.anims.currentAnim?.key !== 'mascot-walk' || !d.sprite.anims.isPlaying) d.sprite.play('mascot-walk', true);
    }
    // Eyes: a dim glow normally, flashing red in the windup.
    const eyeY = d.y - MASCOT.body.height / 2 + 6;
    const angry = d.state === 'windup' && blinkOn(d.stateT, 100);
    w.lighting.add(d.x + faceOf(d) * 4, eyeY, angry ? 26 : 14, angry ? PALETTE.enemy : ROBOT_SHARED.glow, 0.8);
  }
}
