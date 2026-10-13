import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { TETRAX } from '../../config/hunters';
import { PALETTE } from '../../config/palette';
import { TELL } from '../../config/tells';
import { blinkOn } from '../../systems/Accessibility';
import { pace } from '../../systems/Difficulty';
import { damp } from '../../systems/Pacing';
import { playSfx } from '../../systems/audio/Sfx';
import { crystalBreak, glint, shardVolley } from '../../systems/audio/bountySfx';
import type { Damageable, Hazard, Hit, HitResult, Rect } from '../types';
import { HunterLook } from './HunterLook';
import type { HunterWorld } from './HunterWorld';
import { tetraxDamage } from './tetraxRules';

type Attack = 'strike' | 'volley' | 'spikes';
type State = 'idle' | 'walk' | 'glint' | 'strike' | 'volley' | 'spikes' | 'guard' | 'rest' | 'stagger' | 'yield' | 'off';

const DEG = Math.PI / 180;
const rand = (r: readonly [number, number]) => r[0] + Math.random() * (r[1] - r[0]);

/**
 * Tetrax Shard, a Petrosapien: all crystal, cool and honourable. Every strike
 * starts with a glint (a star of light on his arm, the same length on every
 * difficulty) and the attack's own tell: the zone his lunge covers, the fan of
 * his shard volley, or the line of markers his crystal spikes erupt along.
 * Sometimes he guards (front hits do nothing) and counters. Near the end he
 * yields instead of falling.
 */
export class TetraxFighter implements Damageable, Hazard {
  readonly look: HunterLook;
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  hp: number = TETRAX.hp;
  readonly maxHp: number = TETRAX.hp;
  lastDamage = 0;
  fighting = false;
  private state: State = 'off';
  private t = 0;
  private vx = 0;
  private nextAt = 0;
  private attack: Attack = 'strike';
  private attacks = 0;
  private aim = 0;
  private spikesDone = 0;
  private readonly spikeXs: number[] = [];
  private heat = 0;
  private heatedLeft = 0;
  bounds = { left: 0, right: 0, floor: 0 };
  /** He yields (the fight is won). */
  onYield: (() => void) | null = null;
  onHealth: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly w: HunterWorld,
  ) {
    this.look = new HunterLook(scene, 'tetrax', DEPTH.boss);
    this.look.setVisible(false);
  }

  get x(): number {
    return this.look.x;
  }

  get y(): number {
    return this.look.feetY;
  }

  get alive(): boolean {
    return this.fighting && this.state !== 'yield';
  }

  get heated(): boolean {
    return this.heatedLeft > 0;
  }

  /** Posed in a story beat (a cameo). */
  stand(x: number, floor: number, pose: string, facing: 1 | -1): void {
    this.look.place(x, floor);
    this.look.face(facing);
    this.look.setVisible(true);
    this.look.play(pose);
  }

  start(x: number, floor: number, left: number, right: number): void {
    this.fighting = true;
    this.hp = this.maxHp;
    this.bounds = { left, right, floor };
    this.stand(x, floor, 'idle', -1);
    this.set('rest');
    this.nextAt = this.w.now + 900;
  }

  hide(): void {
    this.fighting = false;
    this.state = 'off';
    this.look.setVisible(false);
  }

  private set(s: State): void {
    this.state = s;
    this.t = 0;
  }

  // ------------------------------------------------------------ Combat interfaces

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    out.x = this.x - TETRAX.body.width / 2;
    out.y = this.y - TETRAX.body.height;
    out.w = TETRAX.body.width;
    out.h = TETRAX.body.height;
    return true;
  }

  get active(): boolean {
    return this.alive && this.state !== 'stagger';
  }

  get damage(): number {
    return this.state === 'strike' ? TETRAX.strike.damage : TETRAX.contactDamage;
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    if (this.state === 'strike') {
      out.x = this.look.facing > 0 ? this.x - 4 : this.x - TETRAX.strike.reach;
      out.y = this.y - 40;
      out.w = TETRAX.strike.reach + 4;
      out.h = 36;
      return true;
    }
    out.x = this.x - 9;
    out.y = this.y - 44;
    out.w = 18;
    out.h = 42;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    const r = tetraxDamage(hit, { heated: this.heated, guarding: this.state === 'guard', x: this.x, facing: this.look.facing });
    const { fx } = this.w;
    if (r.blocked) {
      fx.burst('crystal', hit.x, hit.y, 6);
      fx.popText(this.x, this.y - 58, 'BLOCKED!', PALETTE.tetrax);
      playSfx('armorTink', 0.9, 1.3);
      return 'blocked';
    }
    if (r.heats) {
      this.heat++;
      if (this.heat >= TETRAX.rules.heatHits && !this.heated) {
        this.heatedLeft = TETRAX.rules.heatMs;
        fx.popText(this.x, this.y - 58, 'RED HOT!', PALETTE.fire1);
      }
    }
    if (r.shatter) {
      this.heatedLeft = 0;
      this.heat = 0;
      fx.popText(this.x, this.y - 58, 'SHATTER!', PALETTE.white, 2);
      fx.burst('crystal', this.x, this.y - 24, 24);
      fx.hitStop(70);
      playSfx(crystalBreak, 1);
      this.stagger();
    } else if (r.cracked) {
      fx.popText(this.x, this.y - 58, 'CRACK!', PALETTE.tetrax);
      fx.burst('crystal', hit.x, hit.y, 10);
      this.stagger();
    } else if (hit.shot === 'shard') {
      fx.popText(this.x, this.y - 58, 'TINK', PALETTE.diamondheadGlow);
    }
    this.lastDamage = r.damage;
    this.hp -= r.damage;
    this.look.flash();
    fx.burst('crystal', hit.x, hit.y, 4);
    playSfx('droneHit', 0.6, 1.4);
    this.onHealth?.();
    if (this.hp <= this.maxHp * TETRAX.yieldAt) {
      this.hp = Math.max(1, this.hp);
      this.yieldNow();
      return 'killed';
    }
    return 'hit';
  }

  private stagger(): void {
    this.w.cancelThreat(this);
    this.set('stagger');
    this.look.play('hurt');
  }

  private yieldNow(): void {
    this.w.cancelThreat(this);
    this.set('yield');
    this.look.play('yield');
    this.onYield?.();
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    if (!this.look.visible) return;
    this.t += dtMs;
    this.heatedLeft = Math.max(0, this.heatedLeft - dtMs);
    if (this.fighting) this.updateFight(dtMs);
    const hot = this.heated ? (blinkOn(this.t, 160) ? 0xffb080 : 0xff8a5a) : null;
    this.look.render(dtMs, hot);
    if (this.look.visible) this.w.lighting.add(this.x, this.y - 28, 34, this.heated ? PALETTE.fire1 : PALETTE.tetrax, 0.6);
  }

  private updateFight(dtMs: number): void {
    const w = this.w;
    const p = w.player;
    const dt = dtMs / 1000;
    const floor = this.bounds.floor;
    switch (this.state) {
      case 'idle':
      case 'walk': {
        const dx = p.x - this.x;
        this.look.face(dx);
        if (w.now >= this.nextAt && !p.dead) {
          this.choose(Math.abs(dx));
          return;
        }
        this.vx = Math.abs(dx) > 80 ? Math.sign(dx) * TETRAX.walkSpeed : Math.abs(dx) < 40 ? -Math.sign(dx) * TETRAX.walkSpeed * 0.6 : 0;
        this.look.play(this.vx !== 0 ? 'walk' : 'idle');
        this.step(dt);
        return;
      }
      case 'glint': {
        // The star on his arm: every attack starts here.
        const k = this.t / TETRAX.glintMs;
        const ax = this.x + this.look.facing * 14;
        const ay = this.y - 36;
        w.lighting.add(ax, ay, 10 + k * 26, 0xffffff, 1);
        if (blinkOn(this.t, 90)) w.fx.trail('crystal', ax, ay);
        this.drawTell(k);
        if (this.t >= TETRAX.glintMs) this.release();
        return;
      }
      case 'strike':
        this.step(dt);
        if (this.t >= TETRAX.strike.lungeMs) {
          this.vx = 0;
          this.rest();
        }
        return;
      case 'volley':
        if (this.t >= 360) this.rest();
        return;
      case 'spikes': {
        const S = TETRAX.spikes;
        // Markers came first (in the glint); the spikes erupt along them one by one.
        while (this.spikesDone < this.spikeXs.length && this.t >= this.spikesDone * S.gapMs) {
          const sx = this.spikeXs[this.spikesDone++];
          w.fx.spikes(sx, floor, 14, PALETTE.tetrax);
          w.fx.burst('crystal', sx, floor - 6, 6);
          w.blastPlayer(sx, floor - 12, 14, S.damage);
          playSfx(crystalBreak, 0.5, 1.4);
        }
        if (this.spikesDone >= this.spikeXs.length && this.t >= this.spikeXs.length * S.gapMs + 300) this.rest();
        return;
      }
      case 'guard':
        if (this.t >= TETRAX.guard.ms) {
          // The counter: straight into a glinted strike.
          this.attack = 'strike';
          this.look.face(p.x - this.x);
          this.set('glint');
          this.look.play('glint');
          w.threat(this, w.now + TETRAX.glintMs);
          playSfx(glint, 0.9);
        }
        return;
      case 'stagger':
        this.vx = damp(this.vx, 0.8);
        if (this.t >= pace.punish(700)) this.rest();
        return;
      case 'rest':
        this.vx = damp(this.vx, 0.8);
        if (this.t >= 300) {
          this.look.play('idle');
          this.set('idle');
        }
        return;
      default:
        return;
    }
  }

  private choose(dist: number): void {
    const w = this.w;
    this.attacks++;
    // Every fifth move he guards and counters; otherwise the strike up close, volleys and spikes at range.
    if (this.attacks % 5 === 0) {
      this.set('guard');
      this.look.play('guard');
      return;
    }
    this.attack = dist < 70 ? 'strike' : this.attacks % 2 === 0 ? 'spikes' : 'volley';
    if (this.attack === 'spikes') {
      const S = TETRAX.spikes;
      const dir = Math.sign(w.player.x - this.x) || this.look.facing;
      this.spikeXs.length = 0;
      for (let i = 1; i <= S.count; i++) this.spikeXs.push(Phaser.Math.Clamp(this.x + dir * i * S.spacingPx, this.bounds.left + 8, this.bounds.right - 8));
    }
    this.aim = Math.atan2(w.player.centerY - (this.y - 34), w.player.x - this.x);
    this.set('glint');
    this.look.play('glint');
    w.threat(this, w.now + TETRAX.glintMs);
    playSfx(glint, 0.9);
  }

  private drawTell(k: number): void {
    const w = this.w;
    const floor = this.bounds.floor;
    const dir = this.look.facing;
    if (this.attack === 'strike') {
      const reach = TETRAX.strike.reach + TETRAX.strike.lungeSpeed * (TETRAX.strike.lungeMs / 1000);
      w.telegraph.zone(dir > 0 ? this.x : this.x - reach, floor - 40, reach, 40, TELL.tetrax, 0.35 + k * 0.55, this.t * 0.05, dir);
    } else if (this.attack === 'volley') {
      if (this.t < TETRAX.glintMs - 200) this.aim = Math.atan2(w.player.centerY - (this.y - 34), w.player.x - this.x);
      const V = TETRAX.volley;
      for (let i = 0; i < V.shards; i++) {
        const a = this.aim + (i - (V.shards - 1) / 2) * V.fanDeg * DEG;
        w.telegraph.dashed(this.x, this.y - 34, this.x + Math.cos(a) * 240, this.y - 34 + Math.sin(a) * 240, TELL.tetrax, 0.2 + k * 0.6, this.t * 0.05, 1);
      }
    } else {
      for (const sx of this.spikeXs) w.telegraph.target(sx, floor - 2, 8, TELL.tetrax, 0.35 + k * 0.55);
    }
  }

  private release(): void {
    const w = this.w;
    const dir = this.look.facing;
    if (this.attack === 'strike') {
      this.set('strike');
      this.look.play('strike');
      this.vx = dir * TETRAX.strike.lungeSpeed;
      playSfx('swing', 1, 0.8);
      w.fx.speedLine(this.x, this.y - 24, dir, PALETTE.tetrax);
    } else if (this.attack === 'volley') {
      this.set('volley');
      this.look.play('volley');
      const V = TETRAX.volley;
      for (let i = 0; i < V.shards; i++) {
        const a = this.aim + (i - (V.shards - 1) / 2) * V.fanDeg * DEG;
        w.projectiles.spawn('shard', 'enemy', this.x + Math.cos(a) * 10, this.y - 34 + Math.sin(a) * 10, Math.cos(a) * V.speed, Math.sin(a) * V.speed, V.damage, 2000, 4, { tint: 0x9ab8ff });
      }
      playSfx(shardVolley, 1);
    } else {
      this.set('spikes');
      this.look.play('volley');
      this.spikesDone = 0;
    }
  }

  private rest(): void {
    this.set('rest');
    this.nextAt = this.w.now + pace.rest(rand(TETRAX.restMs));
  }

  private step(dt: number): void {
    const nx = this.look.x + this.vx * dt;
    if (!this.w.isSolid(nx + Math.sign(this.vx) * 12, this.y - 12)) this.look.x = nx;
    this.look.x = Phaser.Math.Clamp(this.look.x, this.bounds.left + 12, this.bounds.right - 12);
  }

  destroy(): void {
    this.look.destroy();
  }
}
