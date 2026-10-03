import { MUTANT_SHARED, ROACH } from '../../../config/mutants';
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
 * Mutant roach: a shell that shrugs off claws, fists and goo, and a habit of
 * dropping off the ceiling (its antennae twitch and grit falls first).
 * Heatblast cooks it; flipped onto its back it's soft for everyone.
 */
export class RoachBrain implements DroneBrain {
  readonly kind = 'roach' as const;
  readonly texture = TEX.roach;
  readonly maxHp = ROACH.hp;
  readonly body = ROACH.body;
  readonly walker = true;
  readonly organic = { glow: 0xc8a04a };

  constructor(private readonly onCeiling = false) {}

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    if (d.state === 'idle' && this.onCeiling && d.memo.dropped !== 1) {
      this.cling(d, w);
      return;
    }
    const f = walkPhysics(d, w, dtMs);
    const p = w.player;
    switch (d.state) {
      case 'idle':
      case 'fall':
        if (f.grounded && d.state === 'fall') {
          w.fx.burst('dust', d.x, d.y + ROACH.body.height / 2, 6);
          playSfx('land', 0.6, 1.4);
          w.cancelThreat(d);
          d.setState('pause');
          break;
        }
        if (d.state === 'idle') patrol(d, f, 30, 40);
        if (d.state === 'idle' && notices(d, w)) d.setState('pause');
        break;
      case 'pause':
        d.vx = damp(d.vx, 0.75);
        setFace(d, p.x - d.x);
        if (w.now >= d.nextActionAt && d.stunLeft <= 0 && notices(d, w, MUTANT_SHARED.noticeX * 1.3)) {
          d.setState('hiss');
          d.setCharging(true);
          w.threat(d, w.now + ROACH.hissMs + 150);
          playSfx('hiss', 0.5, 1.3);
        }
        break;
      case 'hiss':
        d.vx = 0;
        if (d.stateT >= ROACH.hissMs) {
          d.setCharging(false);
          d.setState('scuttle');
          playSfx('skitter', 0.7, 0.8);
        }
        break;
      case 'scuttle':
        d.vx = f.ledge ? 0 : faceOf(d) * ROACH.scuttleSpeed;
        if (chance(0.3)) w.fx.burst('dust', d.x - faceOf(d) * 8, d.y + ROACH.body.height / 2, 1);
        if (d.stateT >= ROACH.scuttleMs || f.wall) {
          w.cancelThreat(d);
          d.nextActionAt = w.now + pace.rest(rand(ROACH.pauseMs));
          d.setState('pause');
        }
        break;
    }
  }

  /** Upside down on the ceiling: waits for Ben to walk under, twitches, drops. */
  private cling(d: Drone, w: DroneWorld): void {
    d.vx = 0;
    d.vy = 0;
    d.ky = 0;
    const p = w.player;
    const under = Math.abs(p.x - d.x) < ROACH.dropRange + 40 && p.centerY > d.y && w.aggressive && !p.dead;
    if (d.memo.tell === undefined) {
      if (under && w.now >= d.nextActionAt) {
        d.memo.tell = w.now;
        w.threat(d, w.now + ROACH.dropTellMs + 260);
        playSfx('skitter', 0.5, 1.2);
      }
      return;
    }
    // The tell: grit rains down under it.
    if (chance(0.5)) w.fx.burst('debris', d.x + (Math.random() - 0.5) * 10, d.y + 6, 1);
    if (w.now - d.memo.tell >= ROACH.dropTellMs) {
      d.memo.dropped = 1;
      d.setState('fall');
      d.vy = 60;
      playSfx('hiss', 0.4, 1.5);
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return ROACH.contactDamage;
  }

  damageTakenMultiplier(d: Drone, hit: Hit): number {
    if (d.downed) return ROACH.flippedMultiplier;
    if (hit.kind === 'fire' || hit.kind === 'burst' || hit.kind === 'rocket') return ROACH.fireMultiplier;
    if (hit.kind === 'smash') return 1;
    return ROACH.shellMultiplier;
  }

  onHurt(d: Drone, w: DroneWorld, hit: Hit): void {
    // Knocked off the ceiling by anything.
    if (this.onCeiling && d.memo.dropped !== 1) {
      d.memo.dropped = 1;
      d.setState('fall');
    }
    if (!d.downed && (hit.kind === 'melee' || hit.kind === 'slime') && Math.random() < 0.5) {
      w.fx.burst('spark', hit.x + (d.x - hit.x) * 0.6, d.y, 3);
      w.fx.popText(d.x, d.y - 12, 'SHELL!', PALETTE.uiDim);
      playSfx('armorTink', 0.5, 1.4);
    }
  }

  onRecover(d: Drone): void {
    d.setState('pause');
  }

  render(d: Drone): void {
    const ceiling = this.onCeiling && d.memo.dropped !== 1;
    d.sprite.setFlipY(ceiling).setFlipX(faceOf(d) < 0);
    if (d.state === 'scuttle' || d.state === 'idle') {
      if (!d.sprite.anims.isPlaying) d.sprite.play('roach-idle');
      d.sprite.anims.timeScale = d.state === 'scuttle' ? 3 : 1;
    }
  }
}
