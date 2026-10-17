import { GARGOYLE } from '../../../config/magic';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { CH6_TEX } from '../../../scenes/preload/karachi/keys';
import { pace } from '../../../systems/Difficulty';
import { chance, damp } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Hit } from '../../types';
import { rand, steer } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { faceOf, setFace } from '../mutants/kit';
import { show } from './kit';
import { MAGIC_SFX } from './sfx';

/**
 * A palace gargoyle. Perched, it is just stone: hits bounce off. When Ben
 * comes close it cracks awake (eyes lit, a screech), takes wing, locks onto
 * him (a reticle) and swoops. A missed swoop buries its claws in the floor:
 * open, and liftable by the strong aliens.
 */
export class GargoyleBrain implements DroneBrain {
  readonly kind = 'gargoyle' as const;
  readonly texture = CH6_TEX.gargoyle;
  readonly maxHp = GARGOYLE.hp;
  readonly body = GARGOYLE.body;
  readonly hackable = false;

  update(d: Drone, w: DroneWorld): void {
    const G = GARGOYLE;
    const p = w.player;
    if (d.state === 'idle' && d.memo.awake !== 1) d.setState('perch');
    switch (d.state) {
      case 'perch':
        d.vx = 0;
        d.vy = 0;
        d.x = d.homeX;
        d.y = d.homeY;
        if (w.aggressive && !p.dead && Math.abs(p.x - d.x) < G.wakeRange && Math.abs(p.centerY - d.y) < 120) {
          d.memo.awake = 1;
          d.setState('wake');
          playSfx(MAGIC_SFX.screech, 0.8);
          w.fx.burst('debris', d.x, d.y, 8);
        }
        break;
      case 'wake':
        d.vx = 0;
        d.vy = 0;
        if (d.stateT >= G.wakeMs) {
          d.setState('fly');
          d.nextActionAt = w.now + pace.wake(500);
        }
        break;
      case 'fly':
      case 'idle': {
        setFace(d, p.x - d.x);
        const ground = w.groundBelow(p.x, p.y - 4);
        steer(d, p.x + Math.sin(w.now * 0.0018 + d.seed) * 60, Math.min(ground, p.y) - G.hoverAbove + Math.sin(w.now * 0.004 + d.seed) * 6, G.flySpeed, 1.5);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0 && !p.dead && w.onScreen(d.x, d.y, 10) && d.y < p.y - 30) {
          d.setState('lock');
          w.threat(d, w.now + G.lockMs);
        }
        break;
      }
      case 'lock': {
        d.vx = damp(d.vx, 0.85);
        d.vy = -10;
        if (d.stateT < G.lockMs - 160) {
          d.lockX = p.x;
          d.lockY = p.y - 8;
        }
        const t = d.stateT / G.lockMs;
        w.telegraph.reticle(d.lockX, d.lockY, TELL.charmcaster, 1.5 - t * 0.5, d.stateT * 0.3);
        if (d.stateT >= G.lockMs) {
          d.aim = Math.atan2(d.lockY - d.y, d.lockX - d.x);
          d.setState('dive');
          playSfx(MAGIC_SFX.screech, 0.6, 1.3);
        }
        break;
      }
      case 'dive':
        d.vx = Math.cos(d.aim) * G.diveSpeed;
        d.vy = Math.sin(d.aim) * G.diveSpeed;
        setFace(d, d.vx);
        if (d.y >= d.lockY) d.aim = Math.PI / 2;
        if (w.isSolid(d.x, d.y + 10) || d.stateT >= G.diveMaxMs) {
          d.vx = 0;
          d.vy = 0;
          const landed = w.isSolid(d.x, d.y + 10);
          d.setState(landed ? 'stuck' : 'fly');
          if (landed) {
            w.fx.burst('debris', d.x, d.y + 8, 10);
            playSfx(MAGIC_SFX.clunk, 1, 0.8);
          }
          d.nextActionAt = w.now + pace.rest(rand(G.restMs));
        }
        break;
      case 'stuck':
        d.vx = 0;
        d.vy = 0;
        if (chance(0.05)) w.fx.burst('debris', d.x, d.y + 8, 1);
        if (d.stateT >= pace.punish(G.stuckMs)) d.setState('fly');
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'perch' && d.state !== 'stuck' && d.state !== 'wake';
  }

  contactDamage(d: Drone): number {
    return d.state === 'dive' ? GARGOYLE.diveDamage : GARGOYLE.contactDamage;
  }

  /** Still stone on its perch: hits do nothing. Stuck after a dive: open. */
  damageTakenMultiplier(d: Drone): number {
    if (d.state === 'perch') return 0;
    return d.state === 'stuck' ? 1.6 : 1;
  }

  onHurt(d: Drone, w: DroneWorld, _hit: Hit): void {
    if (d.state === 'perch') {
      w.fx.popText(d.x, d.y - 14, 'STONE!', PALETTE.uiDim);
      playSfx(MAGIC_SFX.clunk, 0.6, 1.2);
    }
  }

  pinned(d: Drone): boolean {
    return d.state === 'stuck';
  }

  onRecover(d: Drone): void {
    d.memo.awake = 1;
    d.setState('fly');
  }

  deathFx(d: Drone, w: DroneWorld): void {
    w.fx.burst('debris', d.x, d.y, 18);
    w.fx.burst('dust', d.x, d.y, 10);
    playSfx(MAGIC_SFX.clunk, 1, 0.6);
  }

  render(d: Drone, w: DroneWorld): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'perch') show(d, 0);
    else if (d.state === 'wake') show(d, 1);
    else if (d.state === 'dive' || d.state === 'stuck') show(d, 4);
    else show(d, 'gargoyle-fly');
    if (d.state !== 'perch') w.lighting.add(d.x, d.y - 4, 16, PALETTE.charmcaster, 0.5);
  }
}
