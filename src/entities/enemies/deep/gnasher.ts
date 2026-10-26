import { GNASHER } from '../../../config/plumber';
import { TELL } from '../../../config/tells';
import { DEEP_TEX } from '../../../scenes/preload/cartoon/plumber/deepSheets';
import { pace } from '../../../systems/Difficulty';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import { rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { show } from '../magic/kit';
import { faceOf, setFace } from '../mutants/kit';
import { seesBen, swimPhysics } from './kit';
import { DEEP_SFX } from './sfx';

/**
 * A gnasher swarm: a school of little piranha-toothed fish that circles its
 * patch. When Ben is near the school bunches up tight and turns toward him
 * (the tell: a red streak where it's going), then darts at him in a line,
 * then scatters and drifts back. Area attacks scatter it fastest.
 */
export class GnasherBrain implements DroneBrain {
  readonly kind = 'gnasher' as const;
  readonly texture = DEEP_TEX.gnasher;
  readonly maxHp = GNASHER.hp;
  readonly body = GNASHER.body;
  readonly organic = { glow: 0xffb04a };

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    const G = GNASHER;
    const wet = swimPhysics(d, w, dtMs);
    if (!wet) {
      if (d.state !== 'dry') {
        w.cancelThreat(d);
        d.setState('dry');
      }
      return;
    }
    if (d.state === 'dry') d.setState('idle');
    const p = w.player;
    switch (d.state) {
      case 'idle': {
        const t = w.now * 0.001 * G.circleSpeed + d.seed;
        d.vx = (d.homeX + Math.cos(t) * G.circleRadius * 1.6 - d.x) * 2;
        d.vy = (d.homeY + Math.sin(t) * G.circleRadius * 0.7 - d.y) * 2;
        if (Math.abs(d.vx) > 4) setFace(d, d.vx);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0 && seesBen(d, w, G.noticeRange)) {
          d.setState('bunch');
          w.threat(d, w.now + G.bunchMs);
          playSfx(DEEP_SFX.school, 0.7);
        }
        break;
      }
      case 'bunch': {
        d.vx *= 0.8;
        d.vy *= 0.8;
        // It turns with him until the last moment, then commits.
        if (d.stateT < G.bunchMs * 0.75) d.aim = Math.atan2(p.centerY - d.y, p.x - d.x);
        setFace(d, Math.cos(d.aim));
        const k = d.stateT / G.bunchMs;
        const reach = G.dartSpeed * (G.dartMs / 1000);
        w.telegraph.dashed(d.x, d.y, d.x + Math.cos(d.aim) * reach, d.y + Math.sin(d.aim) * reach, TELL.deepmaw, 0.3 + k * 0.6, d.stateT * 0.08, 2);
        if (d.stateT >= G.bunchMs) d.setState('dart');
        break;
      }
      case 'dart':
        d.vx = Math.cos(d.aim) * G.dartSpeed;
        d.vy = Math.sin(d.aim) * G.dartSpeed;
        if (chance(0.6)) w.fx.trail('bubble', d.x - Math.cos(d.aim) * 8, d.y - Math.sin(d.aim) * 8);
        if (d.stateT >= G.dartMs) {
          d.setState('scatter');
          d.nextActionAt = w.now + pace.rest(rand(G.restMs));
        }
        break;
      case 'scatter':
        // Drifting back to its patch.
        d.vx = (d.homeX - d.x) * 0.9;
        d.vy = (d.homeY - d.y) * 0.9;
        if (Math.abs(d.vx) > 4) setFace(d, d.vx);
        if (d.stateT >= 600) d.setState('idle');
        break;
    }
  }

  harmful(d: Drone): boolean {
    return d.state !== 'dry' && d.state !== 'scatter';
  }

  contactDamage(): number {
    return GNASHER.contactDamage;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    if (d.state !== 'bunch' && d.state !== 'dart') return;
    w.cancelThreat(d);
    d.setState('scatter');
    d.nextActionAt = w.now + pace.rest(rand(GNASHER.restMs));
  }

  onRecover(d: Drone): void {
    d.setState('idle');
  }

  render(d: Drone): void {
    d.sprite.setFlipX(faceOf(d) < 0);
    if (d.state === 'bunch') show(d, 'gnasher-bunch');
    else if (d.state === 'dart') show(d, 'gnasher-dart');
    else if (d.state === 'dry') show(d, 'gnasher-flop');
    else show(d, 'gnasher-swim');
    // Darting, the school points along its line.
    if (!d.downed) d.sprite.setRotation(d.state === 'dart' || d.state === 'bunch' ? Math.atan2(Math.sin(d.aim), Math.abs(Math.cos(d.aim))) * faceOf(d) : 0);
  }
}
