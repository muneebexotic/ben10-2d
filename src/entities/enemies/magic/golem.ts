import { FX } from '../../../config/constants';
import { GOLEM } from '../../../config/magic';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { CH6_TEX } from '../../../scenes/preload/karachi/keys';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from '../mutants/kit';
import { show } from './kit';
import { MAGIC_SFX } from './sfx';

/**
 * Charmcaster's stone golem: big, slow, and hard. Light hits barely chip it.
 * Up close it raises both fists over its head (a long, loud tell) and slams
 * the floor: shockwaves race both ways (jump them). Then it kneels, its chest
 * rune wide open. Grey Matter's ANALYZE marks the rune for triple damage
 * from any alien, so: analyse, swap to something heavy, punish the kneel.
 */
export class GolemBrain implements DroneBrain {
  readonly kind = 'golem' as const;
  readonly texture = CH6_TEX.golem;
  readonly maxHp = GOLEM.hp;
  readonly body = GOLEM.body;
  readonly walker = true;
  readonly stopsThrows = true;
  readonly hackable = false;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const G = GOLEM;
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    const floor = d.y + G.body.height / 2;
    switch (d.state) {
      case 'idle': {
        if (!notices(d, w, G.noticeX, 90) || !f.grounded) {
          patrol(d, f, G.walkSpeed * 0.6, 50);
          break;
        }
        const dx = p.x - d.x;
        setFace(d, dx);
        if (Math.abs(dx) < G.slamRange && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          d.vx = 0;
          d.setState('windup');
          w.threat(d, w.now + G.windupMs);
          playSfx(MAGIC_SFX.grind, 0.8);
        } else {
          d.vx = f.wall || f.ledge || Math.abs(dx) < 30 ? 0 : Math.sign(dx) * G.walkSpeed;
        }
        break;
      }
      case 'windup': {
        d.vx = 0;
        const t = d.stateT / G.windupMs;
        // Where the shockwaves will run: both ways along the floor.
        const reach = 40 + t * 120;
        w.telegraph.zone(d.x - reach, floor - 12, reach * 2, 12, TELL.charmcaster, 0.3 + t * 0.6 + (blinkOn(d.stateT, 90) ? 0.1 : 0), d.stateT * 0.06, 0);
        if (d.stateT >= G.windupMs) this.slam(d, w, floor);
        break;
      }
      case 'slam':
        d.vx = 0;
        if (d.stateT >= 260) d.setState('stunned');
        break;
      case 'stunned':
        d.vx = damp(d.vx, 0.8);
        if (d.stateT >= pace.punish(G.stunnedMs)) {
          d.setState('idle');
          d.nextActionAt = w.now + pace.rest(rand(G.restMs));
        }
        break;
    }
  }

  private slam(d: Drone, w: DroneWorld, floor: number): void {
    const G = GOLEM;
    d.setState('slam');
    for (const dir of [-1, 1] as const) {
      w.projectiles.spawn('wave', 'enemy', d.x + dir * 22, floor - G.wave.radius, dir * G.wave.speed, 0, G.wave.damage, G.wave.lifeMs, G.wave.radius, { hugGround: true, hitKind: 'smash' });
    }
    w.fx.crack(d.x - 16, floor, 1);
    w.fx.crack(d.x + 16, floor, 1);
    w.fx.burst('debris', d.x, floor, 16);
    w.fx.burst('dust', d.x, floor, 14);
    w.fx.shake(FX.shakeMedium, 220);
    w.fx.hitStop(50);
    playSfx(MAGIC_SFX.slam, 1);
  }

  harmful(d: Drone): boolean {
    return d.state !== 'stunned';
  }

  contactDamage(d: Drone): number {
    return d.state === 'slam' ? GOLEM.slamDamage : GOLEM.contactDamage;
  }

  damageTakenMultiplier(d: Drone, hit: Hit): number {
    if (d.state === 'stunned') return GOLEM.openMultiplier;
    return hit.heavy || hit.kind === 'smash' ? 1 : GOLEM.stoneMultiplier;
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    if (d.state === 'stunned' || hit.heavy || hit.kind === 'smash') return;
    w.fx.burst('debris', d.x + Math.sign(hit.x - d.x) * 10, d.y - 6, 3);
    playSfx(MAGIC_SFX.clunk, 0.5, 0.8);
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'windup') show(d, 3);
    else if (d.state === 'slam') show(d, 4);
    else if (d.state === 'stunned') show(d, 5);
    else if (Math.abs(d.vx) > 3) show(d, 'golem-walk');
    else show(d, 0);
    // The rune in its chest pulses; wide open while it kneels.
    const open = d.state === 'stunned';
    w.lighting.add(d.x, d.y - 4 + (open ? 6 : 0), open ? 40 : 22, PALETTE.charmcaster, open ? 0.9 : 0.45);
  }
}
