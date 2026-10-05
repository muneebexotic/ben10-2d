import { ROBOT_SHARED, TRACKBOT } from '../../../config/robots';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import { chance, damp } from '../../../systems/Pacing';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';

/**
 * Track-bot: a subway maintenance robot on treads. Revs its grinder in a
 * shower of sparks while a dashed line marks where it'll charge (the tell),
 * then charges along the floor. A miss leaves it skidding with its back open.
 * Kevin's overcharged ones are faster and crackle purple.
 */
export class TrackbotBrain implements DroneBrain {
  readonly kind: 'trackbot' | 'voltbot';
  readonly texture = TEX.trackbot;
  readonly maxHp: number;
  readonly body = TRACKBOT.body;
  readonly walker = true;
  private readonly speed: number;

  constructor(private readonly overcharged: boolean) {
    this.kind = overcharged ? 'voltbot' : 'trackbot';
    this.maxHp = overcharged ? TRACKBOT.overcharged.hp : TRACKBOT.hp;
    this.speed = overcharged ? TRACKBOT.overcharged.chargeSpeed : TRACKBOT.chargeSpeed;
  }

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    switch (d.state) {
      case 'idle':
        patrol(d, f, TRACKBOT.patrolSpeed, 50);
        if (notices(d, w, TRACKBOT.noticeX, 70) && w.now >= d.nextActionAt && d.stunLeft <= 0 && f.grounded) {
          setFace(d, p.x - d.x);
          d.vx = 0;
          d.setState('rev');
          d.setCharging(true);
          w.threat(d, w.now + TRACKBOT.revMs + 150);
          playSfx('grinder', 0.7, this.overcharged ? 1.2 : 1);
        }
        break;
      case 'rev': {
        d.vx = damp(d.vx, 0.6);
        const dir = faceOf(d);
        const floor = d.y + TRACKBOT.body.height / 2 - 3;
        w.telegraph.dashed(d.x + dir * 12, floor, d.x + dir * 150, floor, this.overcharged ? PALETTE.kevin : PALETTE.enemy, blinkOn(d.stateT, 70) ? 0.9 : 0.4, d.stateT * 0.08, 2);
        if (chance(0.7)) w.fx.burst(this.overcharged ? 'volt' : 'spark', d.x + dir * 12, d.y, 2);
        if (d.stateT >= TRACKBOT.revMs) {
          d.setState('charge');
          d.setCharging(false);
        }
        break;
      }
      case 'charge': {
        const dir = faceOf(d);
        d.vx = dir * this.speed;
        if (chance(0.6)) w.fx.burst(this.overcharged ? 'volt' : 'spark', d.x - dir * 10, d.y + 5, 1);
        if (f.wall || f.ledge || d.stateT >= TRACKBOT.chargeMs) {
          w.cancelThreat(d);
          if (f.wall) {
            w.fx.burst('spark', d.x + dir * 12, d.y, 8);
            w.fx.shake(0.004, 120);
            playSfx('armorTink', 0.8, 0.8);
          }
          d.setState('skid');
        }
        break;
      }
      case 'skid':
        d.vx = damp(d.vx, 0.86);
        if (chance(0.5)) w.fx.burst('dust', d.x, d.y + 6, 1);
        if (d.stateT >= pace.punish(TRACKBOT.skidMs)) {
          d.nextActionAt = w.now + pace.rest(rand(TRACKBOT.restMs));
          d.setState('idle');
        }
        break;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(d: Drone): number {
    return d.state === 'charge' ? TRACKBOT.chargeDamage : TRACKBOT.contactDamage;
  }

  damageTakenMultiplier(d: Drone, hit: Hit): number {
    // Skidding with its back to Ben: the open panel takes extra.
    const fromBehind = Math.sign(hit.x - d.x) === -faceOf(d);
    return d.state === 'skid' && fromBehind ? TRACKBOT.skidMultiplier : 1;
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state !== 'rev' && (d.sprite.anims.currentAnim?.key !== 'trackbot-roll' || !d.sprite.anims.isPlaying)) d.sprite.play('trackbot-roll', true);
    if (this.overcharged) {
      w.lighting.add(d.x, d.y, 26, PALETTE.kevin, 0.7);
      if (chance(0.15)) w.fx.burst('volt', d.x + (Math.random() - 0.5) * 16, d.y - 4, 1);
    } else {
      w.lighting.add(d.x + faceOf(d) * 10, d.y - 2, 14, ROBOT_SHARED.glow, 0.7);
    }
  }
}
