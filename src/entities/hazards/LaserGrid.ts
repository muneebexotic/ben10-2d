import Phaser from 'phaser';
import { SECURITY_LASER as L } from '../../config/bounty';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { CH5_TEX } from '../../scenes/preload/bounty';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import { crystalBreak, laserBurn, receiverOn } from '../../systems/audio/bountySfx';
import type { Rect } from '../types';

export type LaserDir = 'left' | 'right' | 'up' | 'down';

export interface LaserSpec {
  id: string;
  /** The emitter's tile; the beam leaves from its muzzle side. */
  x: number;
  y: number;
  dir: LaserDir;
}

export interface ReceiverSpec {
  id: string;
  x: number;
  y: number;
  /** The gate it opens once a reflected beam lights it. */
  gate: string;
  /** An emitter it switches off once lit (a laser bounced back into its own emitter overloads it). */
  kills?: string;
}

export interface GateSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A mirror the beams bounce off: where it is, the way it sends things, and half its height. */
export interface Mirror {
  x: number;
  y: number;
  angle: number;
  halfLength: number;
}

export interface LaserWorld {
  fx: Fx;
  lighting: Lighting;
  isSolid(x: number, y: number): boolean;
  /** Diamondhead's shield, while it's up. */
  mirror(): Mirror | null;
  /** Ben's hurtbox, or null when the beam goes through him (dead, phased). */
  playerBox(out: Rect): Rect | null;
  hurtPlayer(damage: number, fromX: number): void;
  addSolid(r: Rect): void;
  removeSolid(r: Rect): void;
  /** A gate opened (a banner, a line). */
  onGateOpened(id: string): void;
}

const DIRS: Record<LaserDir, [number, number]> = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
const STEP = 3;

interface Emitter {
  spec: LaserSpec;
  x: number;
  y: number;
  on: boolean;
  /** The traced beam this frame (x, y pairs) and how many bounces it took. */
  readonly path: number[];
}

interface Receiver {
  spec: ReceiverSpec;
  rect: Rect;
  sprite: Phaser.GameObjects.Image;
  charge: number;
  lit: boolean;
  /** A beam is on it this frame. */
  hot: boolean;
}

interface Gate {
  spec: GateSpec;
  rect: Rect;
  image: Phaser.GameObjects.TileSprite;
  body: Phaser.Physics.Arcade.Image;
  open: boolean;
}

/**
 * The mine's security lasers. Each emitter fires a beam that stops at
 * anything solid and burns Ben (the beam is the tell: it's always on). Held
 * up against one, Diamondhead's crystal shield bounces it the way the shield
 * faces (straight back, or tilted up or down); a bounced beam that reaches a
 * crystal receiver lights it, and the receiver opens its gate.
 */
export class LaserGrid {
  private readonly emitters: Emitter[] = [];
  private readonly receivers: Receiver[] = [];
  private readonly gates: Gate[] = [];
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly box: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private hurtCooldown = 0;

  constructor(
    scene: Phaser.Scene,
    lasers: readonly LaserSpec[],
    receivers: readonly ReceiverSpec[],
    gates: readonly GateSpec[],
    private readonly w: LaserWorld,
    opened: readonly string[] = [],
  ) {
    for (const spec of lasers) {
      const [dx, dy] = DIRS[spec.dir];
      const cx = spec.x * TILE + TILE / 2;
      const cy = spec.y * TILE + TILE / 2;
      const angle = Math.atan2(dy, dx);
      scene.add.image(cx, cy, CH5_TEX.laserEmitter).setRotation(angle).setDepth(DEPTH.props);
      this.emitters.push({ spec, x: cx + dx * 7, y: cy + dy * 7, on: true, path: [] });
    }
    for (const spec of receivers) {
      const cx = spec.x * TILE + TILE / 2;
      const cy = spec.y * TILE + TILE / 2;
      const sprite = scene.add.image(cx, cy, CH5_TEX.receiver, 0).setDepth(DEPTH.props);
      this.receivers.push({ spec, rect: { x: cx - 7, y: cy - 7, w: 14, h: 14 }, sprite, charge: 0, lit: false, hot: false });
    }
    for (const spec of gates) {
      const rect = { x: spec.x * TILE, y: spec.y * TILE, w: spec.w * TILE, h: spec.h * TILE };
      const image = scene.add.tileSprite(rect.x, rect.y, rect.w, rect.h, CH5_TEX.crystalGate, 0).setOrigin(0, 0).setDepth(DEPTH.terrain + 2);
      const body = scene.physics.add.staticImage(rect.x + rect.w / 2, rect.y + rect.h / 2, CH5_TEX.crystalGate).setVisible(false);
      body.setDisplaySize(rect.w, rect.h).refreshBody();
      const gate: Gate = { spec, rect, image, body, open: false };
      this.gates.push(gate);
      w.addSolid(rect);
      // A restart past it: already open.
      if (opened.includes(spec.id)) this.openGate(gate, true);
    }
    for (const r of this.receivers) {
      if (this.gates.some((g) => g.spec.id === r.spec.gate && g.open)) this.light(r, true);
    }
    this.g = scene.add.graphics().setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD);
  }

  /** Static bodies the player collides with (the level adds the collider). */
  get gateBodies(): Phaser.Physics.Arcade.Image[] {
    return this.gates.map((g) => g.body);
  }

  isOpen(gateId: string): boolean {
    return this.gates.some((g) => g.spec.id === gateId && g.open);
  }

  update(dtMs: number, view: Phaser.Geom.Rectangle): void {
    this.hurtCooldown = Math.max(0, this.hurtCooldown - dtMs);
    for (const r of this.receivers) r.hot = false;
    const g = this.g;
    g.clear();
    const mirror = this.w.mirror();
    for (const e of this.emitters) {
      if (!e.on || e.x < view.x - 300 || e.x > view.right + 300 || e.y < view.y - 300 || e.y > view.bottom + 300) continue;
      this.trace(e, mirror);
      this.draw(e);
    }
    for (const r of this.receivers) {
      if (r.lit) continue;
      r.charge = r.hot ? r.charge + dtMs : Math.max(0, r.charge - dtMs * 2);
      r.sprite.setTint(r.hot ? 0xffffff : 0xb0b0c0);
      if (r.hot) this.w.lighting.add(r.rect.x + 7, r.rect.y + 7, 20 + (r.charge / L.chargeMs) * 30, 0x9af0ff, 0.9);
      if (r.charge >= L.chargeMs) this.light(r, false);
    }
  }

  /** Walks the beam: off walls it stops, off the shield it bounces, into a receiver it charges it, into Ben it burns. */
  private trace(e: Emitter, mirror: Mirror | null): void {
    const path = e.path;
    path.length = 0;
    let [dx, dy] = DIRS[e.spec.dir];
    let x = e.x;
    let y = e.y;
    path.push(x, y);
    let bounces = 0;
    let sinceBounce = 99;
    const player = this.w.playerBox(this.box);
    for (let len = 0; len < L.maxLength; len += STEP) {
      x += dx * STEP;
      y += dy * STEP;
      sinceBounce += STEP;
      if (mirror && bounces < L.maxBounces && sinceBounce > 10 && Math.abs(x - mirror.x) <= 7 && Math.abs(y - mirror.y) <= mirror.halfLength) {
        const sx = Math.cos(mirror.angle);
        const sy = Math.sin(mirror.angle);
        // Only the shield's face reflects; a beam from behind goes into Diamondhead.
        if (dx * sx + dy * sy < 0) {
          path.push(x, y);
          dx = sx;
          dy = sy;
          bounces++;
          sinceBounce = 0;
          this.w.fx.burst('crystal', x, y, 1);
          continue;
        }
      }
      if (bounces > 0) {
        const r = this.receivers.find((rc) => !rc.lit && x >= rc.rect.x && x < rc.rect.x + rc.rect.w && y >= rc.rect.y && y < rc.rect.y + rc.rect.h);
        if (r) {
          r.hot = true;
          break;
        }
      }
      if (player && x >= player.x && x < player.x + player.w && y >= player.y && y < player.y + player.h) {
        if (this.hurtCooldown <= 0) {
          this.hurtCooldown = 400;
          this.w.hurtPlayer(L.damage, x - dx * 10);
          playSfx(laserBurn, 0.8);
        }
        break;
      }
      if (this.w.isSolid(x, y)) break;
    }
    path.push(x, y);
  }

  private draw(e: Emitter): void {
    const g = this.g;
    const p = e.path;
    if (p.length < 4) return;
    for (const [width, color, alpha] of [[L.thickness + 3, PALETTE.enemy, 0.25], [L.thickness, PALETTE.enemy, 0.85], [1, 0xffe0e0, 1]] as const) {
      g.lineStyle(width, color, alpha);
      g.beginPath();
      g.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
      g.strokePath();
    }
    // Light where the beam starts, bounces and ends.
    for (let i = 0; i < p.length; i += 2) this.w.lighting.add(p[i], p[i + 1], i === 0 ? 20 : 26, PALETTE.enemy, 0.8);
  }

  private light(r: Receiver, silent: boolean): void {
    r.lit = true;
    r.sprite.setFrame(1).clearTint();
    if (r.spec.kills) for (const e of this.emitters) if (e.spec.id === r.spec.kills) e.on = false;
    const gate = this.gates.find((gt) => gt.spec.id === r.spec.gate);
    if (!silent) {
      this.w.fx.burst('crystal', r.rect.x + 7, r.rect.y + 7, 16);
      this.w.fx.ring(r.rect.x + 7, r.rect.y + 7, 0x9af0ff, 40, 400);
      playSfx(receiverOn, 0.9);
    }
    if (gate && !gate.open) this.openGate(gate, silent);
  }

  private openGate(gate: Gate, silent: boolean): void {
    gate.open = true;
    this.w.removeSolid(gate.rect);
    gate.body.disableBody(true, true);
    gate.image.setVisible(false);
    if (silent) return;
    const { fx } = this.w;
    const r = gate.rect;
    for (let i = 0; i < 4; i++) fx.burst('crystal', r.x + r.w / 2, r.y + (r.h * (i + 0.5)) / 4, 8);
    fx.shake(0.006, 200);
    playSfx(crystalBreak, 1, 0.8);
    this.w.onGateOpened(gate.spec.id);
  }

  destroy(): void {
    this.g.destroy();
  }
}
