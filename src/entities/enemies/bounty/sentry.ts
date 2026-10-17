import { BOUNTY_SHARED, SENTRY } from '../../../config/bounty';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { CH5_TEX } from '../../../scenes/preload/bounty/keys';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import { crystalBreak, glint, shardVolley } from '../../../systems/audio/bountySfx';
import type { Hit } from '../../types';
import { aimAt, canShoot, lineOfSight, rand } from '../brainKit';
import type { Drone, DroneBrain, DroneWorld } from '../Drone';
import { walkPhysics } from '../mutants/kit';

const DEG = Math.PI / 180;

/**
 * Tetrax's crystal sentry: living crystal, rooted to the spot. It glints (a
 * star of light at its tip and three dashed lines: the tell), then fires a
 * fan of shards. Diamondhead drinks the shards in for alien time. Crystal:
 * nothing to take over, and smash hits crack it.
 */
export class SentryBrain implements DroneBrain {
  readonly kind = 'sentry' as const;
  readonly texture = CH5_TEX.sentry;
  readonly maxHp = SENTRY.hp;
  readonly body = SENTRY.body;
  readonly walker = true;
  readonly hackable = false;
  readonly stopsThrows = true;

  update(d: Drone, w: DroneWorld, dtMs: number): void {
    walkPhysics(d, w, dtMs);
    d.vx = 0;
    d.kx = 0;
    const p = w.player;
    const tipY = d.y - SENTRY.body.height / 2 + 2;
    if (d.state === 'idle') {
      if (w.now >= d.nextActionAt && d.stunLeft <= 0 && canShoot(d, w, SENTRY.aggroRange) && lineOfSight(w, d.x, tipY, p.x, p.centerY)) {
        d.setState('glint');
        d.aim = aimAt(d, w);
        w.threat(d, w.now + SENTRY.glintMs);
        playSfx(glint, 0.7);
      }
      return;
    }
    if (d.state === 'glint') {
      const t = d.stateT / SENTRY.glintMs;
      const locked = d.stateT >= SENTRY.glintMs - 220;
      if (!locked) d.aim = Math.atan2(p.centerY - tipY, p.x - d.x);
      for (let i = -1; i <= 1; i++) {
        const a = d.aim + i * SENTRY.fanDeg * DEG;
        w.telegraph.dashed(d.x, tipY, d.x + Math.cos(a) * 220, tipY + Math.sin(a) * 220, TELL.tetrax, locked ? 0.9 : 0.2 + t * 0.4, d.stateT * 0.05, locked ? 2 : 1);
      }
      w.lighting.add(d.x, tipY, 16 + t * 30, PALETTE.tetrax, blinkOn(d.stateT, 90) ? 1 : 0.7);
      if (d.stateT >= SENTRY.glintMs) {
        for (let i = 0; i < SENTRY.shards; i++) {
          const a = d.aim + (i - (SENTRY.shards - 1) / 2) * SENTRY.fanDeg * DEG;
          w.projectiles.spawn('shard', 'enemy', d.x + Math.cos(a) * 6, tipY + Math.sin(a) * 6, Math.cos(a) * SENTRY.shardSpeed, Math.sin(a) * SENTRY.shardSpeed, SENTRY.shardDamage, SENTRY.shardLifeMs, SENTRY.shardRadius, { tint: 0x9ab8ff });
        }
        w.threat(d, w.now);
        w.fx.burst('crystal', d.x, tipY, 6);
        playSfx(shardVolley, 0.8);
        d.setState('spent');
      }
      return;
    }
    if (d.state === 'spent' && d.stateT >= SENTRY.spentMs) {
      d.setState('idle');
      d.nextActionAt = w.now + pace.rest(rand(SENTRY.restMs));
    }
  }

  harmful(): boolean {
    return true;
  }

  contactDamage(): number {
    return SENTRY.contactDamage;
  }

  damageTakenMultiplier(_d: Drone, hit: Hit): number {
    return hit.kind === 'smash' || hit.heavy ? SENTRY.smashMultiplier : 1;
  }

  onHurt(d: Drone, w: DroneWorld): void {
    w.fx.burst('crystal', d.x, d.y, 4);
  }

  deathFx(d: Drone, w: DroneWorld): void {
    w.fx.burst('crystal', d.x, d.y, 26);
    w.fx.ring(d.x, d.y, PALETTE.tetrax, 30, 300);
    w.fx.light(d.x, d.y, 70, PALETTE.tetrax, 300);
    playSfx(crystalBreak, 0.9);
  }

  render(d: Drone, w: DroneWorld): void {
    const s = d.sprite;
    const frame = d.state === 'glint' ? 1 : d.state === 'spent' ? 2 : 0;
    if (s.anims.isPlaying) s.stop();
    if (String(s.frame.name) !== String(frame)) s.setFrame(frame);
    w.lighting.add(d.x, d.y - 6, 22, BOUNTY_SHARED.sentryGlow, 0.5);
  }
}
