import { BRUTE, MUTANT_SHARED } from '../../../config/mutants';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { playSfx } from '../../../systems/audio/Sfx';
import { pace } from '../../../systems/Difficulty';
import type { Hit } from '../../types';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, notices, patrol, setFace, walkPhysics } from './kit';
import { chance, damp } from '../../../systems/Pacing';

/**
 * Does a hit get past the brute's tusks? Its front shrugs off everything but a
 * smash; its back and the top of its head are open. Pure, so it's unit tested.
 */
export function bruteGuarded(face: 1 | -1, bruteX: number, bruteTopY: number, hit: Pick<Hit, 'x' | 'y' | 'kind'>): boolean {
  if (hit.kind === 'smash') return false;
  if (hit.y < bruteTopY) return false;
  const fromFront = Math.sign(hit.x - bruteX) === face || hit.x === bruteX;
  return fromFront;
}

/**
 * Mutant mammoth calf: a tusked wall of fur. Pounds its chest (the tell),
 * then charges. Charging into a wall knocks it out cold on its back, where
 * Four Arms can pick it up. Hits on its front glance off; smash through, get
 * behind it, or pounce on its head.
 */
export class BruteBrain implements DroneBrain {
  readonly kind = 'brute' as const;
  readonly texture = TEX.brute;
  readonly maxHp = BRUTE.hp;
  readonly body = BRUTE.body;
  readonly walker = true;
  readonly organic = { glow: MUTANT_SHARED.glow };
  readonly stopsThrows = true;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    switch (d.state) {
      case 'idle':
        patrol(d, f, BRUTE.walkSpeed, 60);
        if (notices(d, w, BRUTE.aggroRange, 90) && w.now >= d.nextActionAt && d.stunLeft <= 0) {
          setFace(d, p.x - d.x);
          d.vx = 0;
          d.setState('pound');
          d.setCharging(true);
          w.threat(d, w.now + BRUTE.poundMs + 200);
          playSfx('chestPound', 0.8);
          playSfx('growl', 0.6, 1.1);
        }
        break;
      case 'pound':
        d.vx = 0;
        if (Math.floor(d.stateT / 190) !== Math.floor((d.stateT - dtMs) / 190)) {
          w.fx.burst('dust', d.x, d.y + BRUTE.body.height / 2, 4);
          w.fx.shake(0.002, 90);
        }
        if (d.stateT >= BRUTE.poundMs) {
          d.setCharging(false);
          d.setState('charge');
          d.sprite.setFrame(3);
          playSfx('growl', 0.9, 0.8);
        }
        break;
      case 'charge':
        d.vx = faceOf(d) * BRUTE.chargeSpeed;
        if (chance(0.6)) w.fx.burst('dust', d.x - faceOf(d) * 14, d.y + BRUTE.body.height / 2, 2);
        if (Math.floor(d.stateT / 260) !== Math.floor((d.stateT - dtMs) / 260)) w.fx.shake(0.003, 80);
        if (f.wall) {
          // Head first into a wall: out cold.
          w.cancelThreat(d);
          d.vx = 0;
          d.kx = -faceOf(d) * 80;
          w.fx.burst('debris', d.x + faceOf(d) * 16, d.y, 12);
          w.fx.popText(d.x, d.y - 24, 'BONK!', PALETTE.gold);
          w.fx.shake(0.008, 220);
          playSfx('armorBreak', 0.7, 0.7);
          d.setState('idle');
          d.knockDown(pace.punish(BRUTE.wallStunMs));
        } else if (d.stateT >= BRUTE.chargeMs || f.ledge || (Math.sign(p.x - d.x) !== faceOf(d) && Math.abs(p.x - d.x) > 70)) {
          w.cancelThreat(d);
          d.setState('skid');
        }
        break;
      case 'skid':
        d.vx = damp(d.vx, 0.88);
        if (chance(0.5)) w.fx.burst('dust', d.x + faceOf(d) * 12, d.y + BRUTE.body.height / 2, 2);
        if (d.stateT >= BRUTE.skidMs) {
          d.nextActionAt = w.now + pace.rest(rand(BRUTE.restMs));
          d.setState('idle');
          setFace(d, p.x - d.x);
        }
        break;
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(d: Drone): number {
    return d.state === 'charge' ? BRUTE.chargeDamage : BRUTE.contactDamage;
  }

  damageTakenMultiplier(d: Drone, hit: Hit): number {
    if (d.downed) return 1;
    if (hit.kind === 'smash') return BRUTE.smashMultiplier;
    return bruteGuarded(faceOf(d), d.x, d.y - BRUTE.body.height / 2 + 4, hit) ? BRUTE.frontMultiplier : 1;
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    if (d.downed) return;
    if (bruteGuarded(faceOf(d), d.x, d.y - BRUTE.body.height / 2 + 4, hit)) {
      w.fx.burst('spark', d.x + faceOf(d) * 14, d.y, 4);
      w.fx.popText(d.x + faceOf(d) * 8, d.y - 22, 'TUSKS!', PALETTE.uiDim);
      playSfx('armorTink', 0.6, 0.8);
      // Big and slow, but not a punching bag: turns to face whoever's hitting it.
    } else if (hit.kind !== 'slime') {
      setFace(d, hit.x - d.x);
    }
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'idle' && !d.sprite.anims.isPlaying) d.sprite.play('brute-idle');
  }
}
