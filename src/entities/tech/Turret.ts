import Phaser from 'phaser';
import { COMBAT } from '../../config/combat';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TECH } from '../../config/tech';
import { TEX } from '../../scenes/preload/assetKeys';
import { blinkOn } from '../../systems/Accessibility';
import { pace } from '../../systems/Difficulty';
import type { Controls } from '../../systems/InputMap';
import { playSfx } from '../../systems/audio/Sfx';
import type { Damageable, Hit, HitResult, Rect } from '../types';
import type { Machine, TechDeps } from './Machine';

const T = TECH.turret;
type State = 'idle' | 'aim' | 'burst' | 'rest' | 'possessed' | 'friendly' | 'broken';

/**
 * A laser turret on a pedestal (or hanging from the ceiling). Hostile ones
 * sweep a laser sight onto Ben, lock, and fire a three-shot burst; anyone can
 * wreck one. Upgrade merges in and it's his: up and down aim it, J fires.
 * Once he's been inside, it stays friendly.
 */
export class Turret implements Machine, Damageable {
  readonly kind = 'turret';
  readonly stopsThrows = true;
  private readonly base: Phaser.GameObjects.Image;
  private readonly head: Phaser.GameObjects.Image;
  private state: State;
  private stateT = 0;
  private shotsLeft = 0;
  private nextShotAt = 0;
  private aim: number;
  private facing: 1 | -1;
  private flashLeft = 0;
  private awake = false;
  hp: number = T.hp;
  lastDamage = 0;
  holding = false;
  readonly anchorX: number;
  readonly anchorY: number;
  /** The level counts it toward kills when it's wrecked while hostile. */
  onWrecked: (() => void) | null = null;

  constructor(
    private readonly d: TechDeps,
    readonly id: string,
    tx: number,
    ty: number,
    hostile: boolean,
    private readonly ceiling: boolean,
    facing: 1 | -1,
  ) {
    const x = tx * TILE + TILE / 2;
    // Floor turrets stand on row ty; ceiling ones hang under it.
    const baseY = ceiling ? (ty + 1) * TILE : ty * TILE;
    this.base = d.scene.add.image(x, baseY, TEX.turretBase).setOrigin(0.5, 1).setDepth(DEPTH.enemies - 1).setFlipY(ceiling);
    if (ceiling) this.base.setOrigin(0.5, 0);
    const headY = ceiling ? baseY + 16 : baseY - 16;
    this.head = d.scene.add.image(x, headY, TEX.turretHead, hostile ? 0 : 1).setOrigin(8 / 24, 7 / 14).setDepth(DEPTH.enemies);
    this.facing = facing;
    this.aim = facing > 0 ? 0 : Math.PI;
    this.state = hostile ? 'idle' : 'friendly';
    this.anchorX = x;
    this.anchorY = ceiling ? headY + 12 : baseY;
    this.render();
  }

  private get hostile(): boolean {
    return this.state === 'idle' || this.state === 'aim' || this.state === 'burst' || this.state === 'rest';
  }

  get alive(): boolean {
    return this.state !== 'broken';
  }

  /** Hostile turrets count as enemies; Upgrade's own aren't targets at all. */
  get countsAsEnemy(): boolean {
    return this.hostile;
  }

  private get muzzle(): { x: number; y: number } {
    return { x: this.head.x + Math.cos(this.aim) * 14, y: this.head.y + Math.sin(this.aim) * 14 };
  }

  // ------------------------------------------------------------ Damageable

  hurtbox(out: Rect): boolean {
    if (!this.hostile) return false;
    out.x = this.head.x - 10;
    out.y = this.head.y - 8;
    out.w = 20;
    out.h = this.ceiling ? 16 : 24;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.hostile) return 'none';
    const dmg = hit.damage * (hit.kind === 'tech' ? COMBAT.techVsMachine : 1);
    this.lastDamage = dmg;
    this.hp -= dmg;
    this.flashLeft = 80;
    this.awake = true;
    this.d.fx.burst('spark', hit.x, hit.y, 5);
    playSfx('armorTink', 0.7, 1.2);
    if (this.hp > 0) return 'hit';
    this.wreck();
    return 'killed';
  }

  private wreck(): void {
    this.state = 'broken';
    this.d.cancelThreat(this);
    this.d.fx.explosion(this.head.x, this.head.y, 'small');
    this.head.setFrame(2);
    // It droops, dead.
    this.aim = this.facing > 0 ? 0.55 : Math.PI - 0.55;
    this.onWrecked?.();
  }

  // ------------------------------------------------------------ Machine

  mergeBox(out: Rect): boolean {
    if (this.state === 'broken' || this.state === 'possessed') return false;
    out.x = this.head.x - 14;
    out.y = this.ceiling ? this.head.y - 8 : this.head.y - 6;
    out.w = 28;
    out.h = this.ceiling ? 26 : 24;
    return true;
  }

  enter(facing: 1 | -1): void {
    this.d.cancelThreat(this);
    this.state = 'possessed';
    this.holding = true;
    this.facing = facing;
    this.aim = facing > 0 ? 0 : Math.PI;
    this.head.setFrame(1);
    this.d.fx.popText(this.head.x, this.head.y - 18, 'HIJACKED!', PALETTE.upgrade);
    playSfx('powerUp', 0.7, 1.3);
  }

  control(c: Controls, dtMs: number): void {
    if (this.state !== 'possessed') return;
    const dt = dtMs / 1000;
    if (c.left && !c.right) this.facing = -1;
    else if (c.right && !c.left) this.facing = 1;
    // Tilt is measured from straight ahead, so up is up whichever way it faces.
    let tilt = this.facing > 0 ? this.aim : Math.PI - this.aim;
    tilt = Phaser.Math.Angle.Wrap(tilt);
    if (c.up) tilt -= T.tiltSpeed * dt;
    if (c.down) tilt += T.tiltSpeed * dt;
    tilt = Phaser.Math.Clamp(tilt, T.minTilt, T.maxTilt);
    this.aim = this.facing > 0 ? tilt : Math.PI - tilt;
    if ((c.attackHeld || c.attackPressed) && this.d.now() >= this.nextShotAt) {
      this.nextShotAt = this.d.now() + T.playerShotEveryMs;
      const m = this.muzzle;
      this.d.projectiles.spawn('laser', 'player', m.x, m.y, Math.cos(this.aim) * T.playerShotSpeed, Math.sin(this.aim) * T.playerShotSpeed, T.playerShotDamage, 900, 4, { hitKind: 'tech', knockback: 140, tint: PALETTE.upgrade });
      this.d.fx.flash(m.x, m.y, PALETTE.upgrade, 12, 100);
      this.head.x -= Math.cos(this.aim) * 2;
      playSfx('laser', 0.6, 1.4);
    }
  }

  release(): void {
    if (this.state !== 'possessed') return;
    this.state = 'friendly';
    this.holding = false;
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.stateT += dtMs;
    // Recoil settles back.
    this.head.x += (this.anchorX - this.head.x) * Math.min(1, dtMs / 60);
    if (this.hostile) this.updateHostile();
    this.render();
  }

  /** A set piece keeps it powered down (the LASER LAIR before the lockdown). */
  sleep(): void {
    this.sleeping = true;
  }

  /** Powers up at once: lights, a beep, then it starts hunting. */
  wakeNow(): void {
    this.sleeping = false;
    if (!this.hostile || this.awake) return;
    this.awake = true;
    this.setState('rest');
    this.d.fx.flash(this.head.x, this.head.y, PALETTE.enemy, 20, 200);
    playSfx('beep', 0.5, 1.4);
  }

  private sleeping = false;

  private updateHostile(): void {
    if (this.sleeping) return;
    const d = this.d;
    const p = d.player;
    const now = d.now();
    const dx = p.x - this.head.x;
    const dy = p.centerY - this.head.y;
    const dist = Math.hypot(dx, dy);
    if (!this.awake) {
      if (dist < T.wakeDistance) {
        this.awake = true;
        this.setState('rest');
      }
      return;
    }
    const sees = !p.dead && dist < T.range && this.lineOfSight(p.x, p.centerY);
    switch (this.state) {
      case 'idle':
        // A slow sweep while it looks for him.
        this.aim = (this.facing > 0 ? 0 : Math.PI) + Math.sin(now * 0.0016) * 0.35;
        if (sees) {
          this.setState('aim');
          d.threat(this, now + T.aimMs);
          playSfx('laserCharge', 0.6, 1.1);
        }
        break;
      case 'aim': {
        if (this.stateT < T.aimMs - T.aimLockMs) {
          this.aim = Math.atan2(dy, dx);
          this.facing = dx < 0 ? -1 : 1;
        }
        const locked = this.stateT >= T.aimMs - T.aimLockMs;
        const m = this.muzzle;
        d.telegraph.dashed(m.x, m.y, m.x + Math.cos(this.aim) * T.range, m.y + Math.sin(this.aim) * T.range, PALETTE.enemy, locked ? 0.95 : blinkOn(this.stateT, 70) ? 0.55 : 0.3, this.stateT * 0.05, locked ? 2 : 1);
        d.lighting.add(m.x, m.y, 18 + (this.stateT / T.aimMs) * 22, PALETTE.enemy, 0.9);
        if (this.stateT >= T.aimMs) {
          this.setState('burst');
          this.shotsLeft = T.burstShots;
          this.nextShotAt = now;
        }
        break;
      }
      case 'burst':
        if (now >= this.nextShotAt && this.shotsLeft > 0) {
          this.shotsLeft--;
          this.nextShotAt = now + T.burstEveryMs;
          const m = this.muzzle;
          d.projectiles.spawn('laser', 'enemy', m.x, m.y, Math.cos(this.aim) * T.shotSpeed, Math.sin(this.aim) * T.shotSpeed, T.shotDamage, 1600, 4);
          d.fx.flash(m.x, m.y, PALETTE.enemy, 10, 90);
          this.head.x -= Math.cos(this.aim) * 2;
          playSfx('laser', 0.7, 1.15);
        }
        if (this.shotsLeft <= 0) this.setState('rest');
        break;
      case 'rest':
        if (this.stateT >= pace.rest(T.restMs)) this.setState('idle');
        break;
    }
  }

  private lineOfSight(tx: number, ty: number): boolean {
    const x0 = this.head.x;
    const y0 = this.head.y;
    const steps = Math.ceil(Math.hypot(tx - x0, ty - y0) / 8);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.d.isSolid(x0 + (tx - x0) * t, y0 + (ty - y0) * t)) return false;
    }
    return true;
  }

  private setState(s: State): void {
    this.state = s;
    this.stateT = 0;
  }

  private render(): void {
    const h = this.head;
    h.setRotation(this.aim);
    // Keep the turret upright: pointing left it flips instead of hanging upside down.
    h.setFlipY(Math.cos(this.aim) < 0);
    if (this.flashLeft > 0) h.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
    else h.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    if (this.state === 'broken') return;
    const color = this.hostile ? PALETTE.enemy : PALETTE.upgrade;
    this.d.lighting.add(h.x, h.y, this.state === 'possessed' ? 34 : 20, color, 0.7);
  }

  destroy(): void {
    this.base.destroy();
    this.head.destroy();
  }
}
