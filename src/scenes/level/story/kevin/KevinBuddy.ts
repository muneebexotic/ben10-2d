import { getAlien, hasAlien } from '../../../../aliens/registry';
import { TILE } from '../../../../config/constants';
import { BUDDY } from '../../../../config/kevin';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { KevinActor } from './KevinActor';
import { KEVIN_CHATTER, SUMO_LINES } from './lines';

interface Crumb {
  x: number;
  y: number;
}

const RUN_SPEED = 125;
const CRUMB_GAP = 6;
const TRAIL_MAX = 240;

/**
 * Kevin as Ben's buddy, from the arcade to the subway: he follows Ben's trail
 * (hopping where Ben jumped), throws bolts at whatever Ben is fighting,
 * cheers the first time he sees each alien, chats now and then, and dares
 * Ben to beat his SUMO SLAMMERS score. Invulnerable; enemies ignore him.
 * The player should like him.
 */
export class KevinBuddy implements SetPiece {
  private readonly trail: Crumb[] = [];
  private boltIn: number = BUDDY.bolt.everyMs[0];
  private chatterIn: number = BUDDY.chatterMs[0];
  private chatterIndex = 0;
  private readonly cheered = new Set<string>();
  private lastCheerAt = -99999;
  private dared = false;
  private onward = false;
  private readonly sumoX: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly actor: KevinActor,
  ) {
    const sumo = kit.level.entities.find((e) => e.type === 'sumo');
    this.sumoX = sumo ? sumo.x * TILE : Infinity;
    EventBus.on('alien:transformed', this.onTransformed, this);
    EventBus.on('arcade:result', this.onSumo, this);
  }

  get cinematic(): boolean {
    return false;
  }

  get storyLock(): boolean {
    return false;
  }

  /** Kevin joins Ben now, appearing a step behind him. */
  join(withPuff: boolean): void {
    const p = this.kit.player;
    const x = p.x - p.facing * 30;
    const y = this.kit.world.groundBelow(x, p.y - 8);
    this.trail.length = 0;
    if (withPuff) this.actor.appear(x, y, 'buddy');
    else this.actor.place(x, y, 'buddy');
    this.actor.pose('idle');
  }

  update(dtMs: number, _realDtMs: number, _controls: Controls): void {
    const a = this.actor;
    if (a.mode !== 'buddy') return;
    const p = this.kit.player;
    if (p.grounded && !p.dead) this.crumb(p.x, p.y);
    this.follow(dtMs);
    this.fight(dtMs);
    this.chat(dtMs);
    this.sumoBeats();
  }

  private crumb(x: number, y: number): void {
    const last = this.trail[this.trail.length - 1];
    if (last && Math.abs(last.x - x) < CRUMB_GAP && Math.abs(last.y - y) < 2) return;
    this.trail.push({ x, y });
    if (this.trail.length > TRAIL_MAX) this.trail.shift();
  }

  private follow(dtMs: number): void {
    const a = this.actor;
    const p = this.kit.player;
    if (a.moving) return;
    const far = Math.abs(p.x - a.x) + Math.abs(p.y - a.feetY);
    // Way behind (a respawn, a lift, a flight across a gap): he catches up off-screen with a hop.
    if (far > BUDDY.catchUpPx || this.trail.length === 0) {
      if (far > BUDDY.catchUpPx && p.grounded) this.join(true);
      else if (Math.abs(p.x - a.x) > BUDDY.stopPx) a.pose('idle');
      return;
    }
    if (Math.abs(p.x - a.x) <= BUDDY.stopPx && Math.abs(p.y - a.feetY) < 4) {
      a.faceBen();
      a.pose('idle');
      return;
    }
    // Next crumb ahead of him on Ben's trail.
    while (this.trail.length > 1 && Math.abs(this.trail[0].x - a.x) < 3 && Math.abs(this.trail[0].y - a.feetY) < 3) this.trail.shift();
    const next = this.trail[0];
    if (!next) return;
    const dy = next.y - a.feetY;
    const dx = next.x - a.x;
    if (Math.abs(dy) > 3 || Math.abs(dx) > 26) {
      // Ben jumped here: hop to the farthest crumb on that ledge within reach.
      let target = next;
      for (const c of this.trail) {
        if (Math.abs(c.y - next.y) > 2 || Math.abs(c.x - a.x) > 90) break;
        target = c;
      }
      this.trail.splice(0, this.trail.indexOf(target) + 1);
      a.hopTo(target.x, target.y, 380);
      return;
    }
    const lag = this.trail.length > 30 ? 1.6 : 1;
    const step = Math.sign(dx) * Math.min(Math.abs(dx), RUN_SPEED * lag * (dtMs / 1000));
    a.x += step;
    a.feetY = next.y;
    a.face(dx < 0 ? -1 : 1);
    a.pose(Math.abs(step) > 0.1 ? 'run' : 'idle');
    if (Math.abs(next.x - a.x) < 1) this.trail.shift();
  }

  /** A bolt at whatever Ben's fighting, every few seconds. */
  private fight(dtMs: number): void {
    const a = this.actor;
    this.boltIn -= dtMs;
    if (this.boltIn > 0 || a.moving) return;
    const target = this.kit.nearestEnemy(a.x, a.handY, BUDDY.bolt.range);
    if (!target) {
      this.boltIn = 400;
      return;
    }
    const B = BUDDY.bolt;
    a.throwBolt(target.x, target.y, B.damage, B.speed, B.knockback);
    this.boltIn = B.everyMs[0] + Math.random() * (B.everyMs[1] - B.everyMs[0]);
  }

  private chat(dtMs: number): void {
    if (this.kit.dialogue.playing) return;
    this.chatterIn -= dtMs;
    if (this.chatterIn > 0) return;
    const C = BUDDY.chatterMs;
    this.chatterIn = C[0] + Math.random() * (C[1] - C[0]);
    if (this.kit.nearestEnemy(this.actor.x, this.actor.feetY, 200)) return;
    const line = KEVIN_CHATTER[this.chatterIndex % KEVIN_CHATTER.length];
    this.chatterIndex++;
    this.kit.dialogue.say('kevin', line, 2400);
  }

  /** The first time he sees each alien, he loses it. */
  private onTransformed(p: { alienId: string; wrong: boolean }): void {
    if (this.actor.mode !== 'buddy' || this.cheered.has(p.alienId) || !hasAlien(p.alienId)) return;
    const now = this.kit.now();
    if (now - this.lastCheerAt < 5000) return;
    const cheer = getAlien(p.alienId).copy?.cheer;
    if (!cheer) return;
    this.cheered.add(p.alienId);
    this.lastCheerAt = now;
    this.chatterIn = Math.max(this.chatterIn, 6000);
    this.kit.scene.time.delayedCall(700, () => {
      if (this.actor.mode === 'buddy' && !this.kit.dialogue.playing) this.kit.dialogue.say('kevin', cheer, 2300);
    });
  }

  /** The dare by the SUMO SLAMMERS cabinet, and "a place with more juice" after. */
  private sumoBeats(): void {
    const px = this.kit.player.x;
    if (!this.dared && px >= this.sumoX - 7 * TILE && px < this.sumoX + 2 * TILE) {
      this.dared = true;
      this.kit.dialogue.play([SUMO_LINES.dare]);
    }
    if (!this.onward && this.dared && px >= this.sumoX + 18 * TILE) this.goOnward();
  }

  private onSumo(p: { won: boolean }): void {
    if (this.actor.mode !== 'buddy') return;
    this.dared = true;
    const lines = p.won ? SUMO_LINES.won : SUMO_LINES.lost;
    this.kit.scene.time.delayedCall(400, () => this.kit.dialogue.play([...lines, SUMO_LINES.onward]));
    this.onward = true;
  }

  private goOnward(): void {
    this.onward = true;
    this.kit.dialogue.play([SUMO_LINES.onward]);
  }

  destroy(): void {
    EventBus.off('alien:transformed', this.onTransformed, this);
    EventBus.off('arcade:result', this.onSumo, this);
  }
}
