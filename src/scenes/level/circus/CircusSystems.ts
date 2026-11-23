import Phaser from 'phaser';
import { DEPTH, FX, TILE } from '../../../config/constants';
import { HOUND, TOYS } from '../../../config/circus';
import { circusEnv, resetCircusEnv } from '../../../entities/enemies/circus/kit';
import { CIRCUS_SFX } from '../../../entities/enemies/circus/sfx';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../../../entities/types';
import type { EntitySpawn } from '../../../levels/types';
import { CIRCUS_ART, MIRROR_FRAME, mirrorKey } from '../../preload/cartoon/circus/circusArt';
import type { Controls } from '../../../systems/InputMap';
import { playSfx } from '../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../story/StoryKit';

type Spawn<T extends EntitySpawn['type']> = Extract<EntitySpawn, { type: T }>;

/** The ball's radius (Ricochet curled up): its centre is this far over the feet. */
const BALL_R = 11;

interface Pad {
  e: Spawn<'bouncePad'>;
  img: Phaser.GameObjects.Image;
  readyAt: number;
  squashLeft: number;
}

interface Bumper {
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  readyAt: number;
  litLeft: number;
}

interface Kicker {
  e: Spawn<'kicker'>;
  img: Phaser.GameObjects.Image;
  flashLeft: number;
}

interface Deflector {
  e: Spawn<'deflector'>;
  img: Phaser.GameObjects.Image;
  readyAt: number;
  flashLeft: number;
}

interface Mirror {
  e: Spawn<'mirror'>;
  img: Phaser.GameObjects.Image;
  /** The x of its glass (centre of its column), and its top and bottom (px). */
  x: number;
  top: number;
  bottom: number;
  open: boolean;
  nearMs: number;
  /** A lying mirror Ben has walked through. */
  found: boolean;
}

interface Cloud {
  x: number;
  y: number;
  life: number;
  tick: number;
  img: Phaser.GameObjects.Image;
}

/** A reflection: a copy of whatever Ben is right now, in the glass. */
interface Reflection {
  sprite: Phaser.GameObjects.Sprite;
  anim: string;
}

/**
 * The high striker's pad: any hit sends the puck up the pole; a heavy enough
 * smash rings the bell (once) and pays out its card.
 */
class StrikerPad implements Damageable {
  readonly countsAsEnemy = false;
  alive = true;
  rung = false;
  /** The puck's height up the pole (0..1) and where it's heading. */
  puck = 0;
  goal = 0;
  private readonly rect: Rect;

  constructor(
    readonly e: Spawn<'striker'>,
    private readonly onStrike: (strength: number) => void,
  ) {
    this.rect = { x: e.x * TILE - 10, y: e.y * TILE - 12, w: 20, h: 12 };
  }

  hurtbox(out: Rect): boolean {
    out.x = this.rect.x;
    out.y = this.rect.y;
    out.w = this.rect.w;
    out.h = this.rect.h;
    return true;
  }

  accepts(_kind: HitKind): boolean {
    return true;
  }

  takeHit(hit: Hit): HitResult {
    // A smash counts in full; a plain blow for half.
    const strength = hit.damage * (hit.kind === 'smash' || hit.heavy ? 1 : 0.5);
    this.onStrike(strength);
    return 'blocked';
  }
}

/**
 * The circus's toys and traps as one system (Chapter 8): bounce pads,
 * pinball bumpers, kicker ramps, the loop, angled mirrors that fire a ball
 * off, the maze's mirror panels (glass, lying mirrors, doors that light up)
 * with reflections of Ben in them, the high striker and the fear gas a
 * popped balloon hound leaves. Every number is in `config/circus.ts`.
 */
export class CircusSystems implements SetPiece {
  readonly cinematic = false;
  readonly storyLock = false;
  private readonly pads: Pad[] = [];
  private readonly bumpers: Bumper[] = [];
  private readonly kickers: Kicker[] = [];
  private readonly deflectors: Deflector[] = [];
  private readonly mirrors: Mirror[] = [];
  private readonly clouds: Cloud[] = [];
  private readonly reflections: Reflection[] = [];
  private readonly loops: Array<{ cx: number; cy: number; R: number; footX: number; floorY: number }> = [];
  /** A ball fired straight up a shaft: held on the shaft's column while it rises (the stick can't steer it into a wall). */
  private chute: { x: number; speed: number; ms: number } | null = null;
  /** A ball going round a loop right now. */
  private ride: { loop: number; angle: number; dir: 1 | -1; speed: number } | null = null;
  private loopReadyAt = 0;
  private striker: StrikerPad | null = null;
  private strikerArt: { puck: Phaser.GameObjects.Image; x: number; foot: number; top: number } | null = null;
  private bumps = 0;
  private bumpsAwarded = false;
  private lookingGlass = false;
  private now = 0;

  constructor(private readonly kit: StoryKit) {
    const scene = kit.scene;
    for (const e of kit.level.entities) {
      if (e.type === 'bouncePad') {
        const img = scene.add.image((e.x + 1) * TILE, e.y * TILE, CIRCUS_ART.pad, '0').setOrigin(17 / 34, 11 / 12).setDepth(DEPTH.props);
        this.pads.push({ e, img, readyAt: 0, squashLeft: 0 });
      } else if (e.type === 'bumper') {
        const x = e.x * TILE + TILE / 2;
        const y = e.y * TILE + TILE / 2;
        this.bumpers.push({ x, y, img: scene.add.image(x, y, CIRCUS_ART.bumper, '0').setDepth(DEPTH.props), readyAt: 0, litLeft: 0 });
      } else if (e.type === 'kicker') {
        const img = scene.add.image(e.x * TILE + (e.dir > 0 ? 0 : TILE), e.y * TILE, CIRCUS_ART.kicker, '0').setOrigin(1 / 20, 15 / 16).setDepth(DEPTH.props).setFlipX(e.dir < 0);
        this.kickers.push({ e, img, flashLeft: 0 });
      } else if (e.type === 'loop') {
        const R = e.r * TILE;
        const floorY = e.y * TILE;
        const cx = e.x * TILE + TILE / 2;
        const cy = floorY - BALL_R - R;
        scene.add.image(cx, cy, CIRCUS_ART.loop).setDepth(DEPTH.decorBack + 2);
        this.loops.push({ cx, cy, R, footX: cx, floorY });
      } else if (e.type === 'deflector') {
        // A solid block to everyone; to a ball, a mirror that fires it off.
        kit.world.fillCells({ x: e.x, y: e.y, w: 1, h: 1 }, false);
        const img = scene.add.image(e.x * TILE + TILE / 2, e.y * TILE + TILE / 2, CIRCUS_ART.deflector, '0').setDepth(DEPTH.props).setFlipX(e.turn === 'left').setFlipY(e.turn === 'down' || e.turn === 'right');
        this.deflectors.push({ e, img, readyAt: 0, flashLeft: 0 });
      } else if (e.type === 'mirror') {
        const solid = e.kind !== 'lie';
        if (solid) kit.world.fillCells({ x: e.x, y: e.y, w: 1, h: e.h }, false);
        const frame = e.kind === 'real' ? MIRROR_FRAME.real : e.kind === 'lie' ? MIRROR_FRAME.lie : MIRROR_FRAME.door;
        const img = scene.add.image(e.x * TILE, e.y * TILE, mirrorKey(e.h), String(frame)).setOrigin(0, 0).setDepth(DEPTH.terrain + 1).setAlpha(0.88);
        this.mirrors.push({ e, img, x: e.x * TILE + TILE / 2, top: e.y * TILE, bottom: (e.y + e.h) * TILE, open: !solid, nearMs: 0, found: false });
      } else if (e.type === 'striker') {
        this.striker = new StrikerPad(e, (s) => this.strike(s));
        kit.addTarget(this.striker);
        const x = e.x * TILE;
        const foot = e.y * TILE;
        this.strikerArt = { puck: scene.add.image(x, foot - 14, CIRCUS_ART.puck).setDepth(DEPTH.props + 1), x, foot: foot - 14, top: foot - 12 * TILE + 6 };
      }
    }
    for (let i = 0; i < 4; i++) {
      // Over the glass (squeezed to fit it, half see-through), under Ben.
      const sprite = scene.add.sprite(0, 0, kit.player.visual.sprite.texture.key, 0).setVisible(false).setDepth(DEPTH.terrain + 1.5).setAlpha(0.55).setTint(0xb8c8ff);
      this.reflections.push({ sprite, anim: '' });
    }
    circusEnv.gas = (x, y) => this.gas(x, y);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => resetCircusEnv());
  }

  update(dtMs: number, _realDtMs: number, controls: Controls): void {
    const kit = this.kit;
    const p = kit.player;
    this.now = kit.now();
    if (!p.dead && (controls.attackPressed || controls.specialPressed)) {
      const last = circusEnv.lastAttack;
      last.at = this.now;
      last.x = p.x;
      last.y = p.centerY;
      last.facing = p.facing;
    }
    if (this.chute) {
      // Up the tube at a steady speed (the body's own speed cap is too low for a long shaft), until the top mirror takes it.
      this.chute.ms -= dtMs;
      if (p.dead || !p.rolling || this.chute.ms <= 0) this.chute = null;
      else p.setVelocity((this.chute.x - p.x) * 12, -this.chute.speed);
    }
    if (this.ride) this.stepLoop(dtMs);
    else if (!p.dead) {
      this.stepPads(dtMs);
      this.stepBumpers();
      this.stepKickers();
      this.stepDeflectors();
      this.stepLoopFeet();
    }
    this.stepMirrors(dtMs);
    this.stepGas(dtMs);
    this.stepStriker(dtMs);
    this.decay(dtMs);
  }

  // ------------------------------------------------------------ Bounce pads

  private stepPads(dtMs: number): void {
    const p = this.kit.player;
    for (const pad of this.pads) {
      pad.squashLeft = Math.max(0, pad.squashLeft - dtMs);
      const x0 = pad.e.x * TILE;
      const top = pad.e.y * TILE;
      if (p.x < x0 - 2 || p.x > x0 + 2 * TILE + 2 || Math.abs(p.y - top) > 3 || p.vy < -1 || this.now < pad.readyAt) continue;
      pad.readyAt = this.now + TOYS.padCooldownMs;
      pad.squashLeft = TOYS.padSquashMs;
      const power = pad.e.power * (p.rolling ? TOYS.padBallScale : 1);
      p.launch(Math.min(p.vy, -power), false);
      p.squash(0.75, 1.3);
      this.kit.fx.burst('spark', p.x, top, 6);
      playSfx(CIRCUS_SFX.boing, 0.9, p.rolling ? 0.8 : 1);
    }
  }

  // ------------------------------------------------------------ Bumpers

  private stepBumpers(): void {
    const p = this.kit.player;
    const cy = p.rolling ? p.y - BALL_R : p.centerY;
    for (const b of this.bumpers) {
      const dx = p.x - b.x;
      const dy = cy - b.y;
      const d = Math.hypot(dx, dy);
      if (d > TOYS.bumperRadius + (p.rolling ? BALL_R : 8) || this.now < b.readyAt) continue;
      b.readyAt = this.now + TOYS.bumperCooldownMs;
      b.litLeft = TOYS.bumperLitMs;
      const nx = d > 0.1 ? dx / d : p.facing;
      const ny = d > 0.1 ? dy / d : -1;
      p.setVelocity(nx * TOYS.bumperKick, Math.min(-TOYS.bumperMinUp, ny * TOYS.bumperKick));
      this.kit.fx.ring(b.x, b.y, 0xff5ac8, 22, 200);
      this.kit.fx.shake(FX.shakeLight * 0.6, 80);
      this.kit.fx.popText(b.x, b.y - 18, '100', 0xffe08a);
      playSfx(CIRCUS_SFX.ding, 0.9, 0.9 + Math.random() * 0.25);
      if (p.rolling && p.form.id === 'ricochet') {
        this.bumps++;
        if (this.bumps >= TOYS.pinballWizardHits && !this.bumpsAwarded) {
          this.bumpsAwarded = true;
          this.kit.achievement('pinball-wizard');
        }
      }
    }
  }

  // ------------------------------------------------------------ Kickers

  private stepKickers(): void {
    const p = this.kit.player;
    if (!p.rolling) return;
    for (const k of this.kickers) {
      const x0 = k.e.x * TILE;
      const top = k.e.y * TILE;
      if (p.x < x0 - 4 || p.x > x0 + TILE + 4 || p.y < top - TILE || p.y > top + 2) continue;
      if (Math.sign(p.vx) !== k.e.dir || Math.abs(p.vx) < TOYS.kickerMinSpeed) continue;
      p.launch(-TOYS.kickerVy, false);
      p.setVelocityX(k.e.dir * Math.max(Math.abs(p.vx), TOYS.kickerMinOut));
      k.flashLeft = TOYS.kickerFlashMs;
      this.kit.fx.burst('spark', p.x, top - 4, 10);
      this.kit.fx.speedLine(p.x, p.y - BALL_R, (-k.e.dir) as 1 | -1, 0xffe08a);
      playSfx(CIRCUS_SFX.boing, 1, 1.3);
    }
  }

  // ------------------------------------------------------------ The loop

  private stepLoopFeet(): void {
    const p = this.kit.player;
    if (!p.rolling || !p.grounded || this.now < this.loopReadyAt) return;
    for (let i = 0; i < this.loops.length; i++) {
      const L = this.loops[i];
      if (Math.abs(p.x - L.footX) > 6 || Math.abs(p.y - L.floorY) > 3) continue;
      const speed = Math.abs(p.vx);
      if (speed < TOYS.loopMinSpeed) continue;
      this.ride = { loop: i, angle: 0, dir: p.vx > 0 ? 1 : -1, speed };
      p.setInvulnerable(TOYS.loopGuardMs);
      playSfx(CIRCUS_SFX.whoosh, 1, 0.8);
      return;
    }
  }

  private stepLoop(dtMs: number): void {
    const r = this.ride!;
    const L = this.loops[r.loop];
    const p = this.kit.player;
    if (p.dead || !p.rolling) {
      this.ride = null;
      return;
    }
    r.angle += (r.speed * dtMs) / 1000 / L.R;
    if (r.angle >= Math.PI * 2) {
      // Out of the loop, on along the floor at the same speed.
      p.ride(L.footX + r.dir * 4, L.floorY);
      p.setVelocity(r.dir * r.speed, 0);
      this.ride = null;
      this.loopReadyAt = this.now + TOYS.loopCooldownMs;
      this.kit.fx.popText(L.cx, L.cy - L.R - 20, 'LOOP!', 0xffe08a);
      playSfx(CIRCUS_SFX.ding, 1, 1.4);
      return;
    }
    // Round the inside of the ring: from the foot, up the far side, over the top, down the near side.
    const bx = L.cx + Math.sin(r.angle) * L.R * r.dir;
    const by = L.cy + Math.cos(r.angle) * L.R;
    p.ride(bx, by + BALL_R);
    this.kit.fx.stream('spark', bx, by, 0.4);
  }

  // ------------------------------------------------------------ Angled mirrors

  private stepDeflectors(): void {
    const p = this.kit.player;
    if (!p.rolling) return;
    const bx = p.x;
    const by = p.y - BALL_R;
    for (const d of this.deflectors) {
      const x0 = d.e.x * TILE - 3;
      const y0 = d.e.y * TILE - 3;
      if (bx + BALL_R < x0 || bx - BALL_R > x0 + TILE + 6 || by + BALL_R < y0 || by - BALL_R > y0 + TILE + 6 || this.now < d.readyAt) continue;
      d.readyAt = this.now + TOYS.deflectorCooldownMs;
      d.flashLeft = TOYS.deflectorFlashMs;
      const cx = d.e.x * TILE + TILE / 2;
      const cy = d.e.y * TILE + TILE / 2;
      const s = d.e.speed;
      if (d.e.turn === 'up') {
        p.ride(cx, cy - TILE / 2 - 1);
        p.launch(-Math.min(s, TOYS.chuteSpeed), false);
        this.chute = { x: cx, speed: TOYS.chuteSpeed, ms: (s / TOYS.chuteSpeed) * 1000 * TOYS.chuteMsPerSpeed };
      } else if (d.e.turn === 'down') {
        p.ride(cx, cy + TILE / 2 + BALL_R * 2 + 1);
        p.setVelocity(0, s);
      } else {
        const dir = d.e.turn === 'right' ? 1 : -1;
        p.ride(cx + dir * (TILE / 2 + BALL_R + 1), cy + BALL_R + 2);
        p.setVelocity(dir * s, -TOYS.deflectorLift);
        this.chute = null;
      }
      this.kit.fx.flash(cx, cy, 0xd8f0ff, 24, 160);
      this.kit.fx.burst('crystal', cx, cy, 8);
      playSfx(CIRCUS_SFX.glass, 0.6, 1.6);
      playSfx(CIRCUS_SFX.boing, 0.8, 1.5);
    }
  }

  // ------------------------------------------------------------ Mirrors and reflections

  private stepMirrors(dtMs: number): void {
    const p = this.kit.player;
    const src = p.visual.sprite;
    let used = 0;
    for (const m of this.mirrors) {
      const dx = p.x - m.x;
      const level = p.y > m.top && p.y - 20 < m.bottom;
      // A door lights up as Ben comes close (Gwen's spell showing through), and opens.
      if (m.e.kind === 'door' && !m.open) {
        m.nearMs = Math.abs(dx) < TOYS.doorWakeRange && level ? m.nearMs + dtMs : 0;
        if (m.nearMs >= TOYS.doorWakeMs) this.openDoor(m);
      }
      // A lying mirror Ben walks through: found.
      if (m.e.kind === 'lie' && !m.found && Math.abs(dx) < 4 && level) {
        m.found = true;
        this.kit.fx.burst('crystal', m.x, p.centerY, 8);
        this.kit.fx.popText(m.x, p.y - 34, 'A LIE!', 0xd8c8ff);
        playSfx(CIRCUS_SFX.glass, 0.5, 1.8);
        this.checkLookingGlass();
      }
      // His reflection in the glass, near enough to see.
      if (!m.open || m.e.kind === 'lie') {
        if (used < this.reflections.length && Math.abs(dx) < 3 * TILE && level && !p.dead) this.showReflection(this.reflections[used++], m, src);
      }
    }
    for (let i = used; i < this.reflections.length; i++) this.reflections[i].sprite.setVisible(false);
  }

  private openDoor(m: Mirror): void {
    m.open = true;
    m.img.setFrame(String(MIRROR_FRAME.doorLit));
    this.kit.world.clearCells({ x: m.e.x, y: m.e.y, w: 1, h: m.e.h });
    this.kit.fx.flash(m.x, (m.top + m.bottom) / 2, 0xff7ad8, 40, 260);
    this.kit.fx.burst('mana', m.x, (m.top + m.bottom) / 2, 12);
    playSfx(CIRCUS_SFX.glass, 0.7, 0.8);
    this.kit.scene.tweens.add({ targets: m.img, alpha: 0.35, duration: 600 });
  }

  /**
   * Ben's reflection, squeezed into the glass and facing him. In a lying
   * mirror it gives itself away: it lags, faces the same way he does and
   * bobs as if it were breathing on its own.
   */
  private showReflection(r: Reflection, m: Mirror, src: Phaser.GameObjects.Sprite): void {
    const p = this.kit.player;
    const lie = m.e.kind === 'lie';
    const s = r.sprite;
    if (s.texture.key !== src.texture.key) s.setTexture(src.texture.key, src.frame.name);
    const key = src.anims.currentAnim?.key ?? '';
    if (key && key !== r.anim) {
      r.anim = key;
      s.play(key, true);
    } else if (!key && String(s.frame.name) !== String(src.frame.name)) s.setFrame(src.frame.name);
    s.setData('hdClip', src.getData('hdClip') ?? null);
    const side = p.x < m.x ? -1 : 1;
    const offset = Math.min(TILE * 0.6, Math.abs(p.x - m.x) * 0.25);
    const lag = lie ? Math.sin(this.now * 0.004) * TOYS.lieSway : 0;
    s.setVisible(true)
      .setOrigin(src.originX, src.originY)
      .setPosition(m.x + side * 2 - side * offset * (lie ? -1 : 1) + lag, Math.min(p.y, m.bottom) + (lie ? Math.sin(this.now * 0.006) * TOYS.lieBob : 0))
      .setScale(0.55 * src.scaleX, src.scaleY)
      .setFlipX(lie ? src.flipX : !src.flipX)
      .setAlpha(lie ? 0.5 : 0.6);
  }

  private checkLookingGlass(): void {
    if (this.lookingGlass) return;
    if (this.mirrors.every((m) => m.e.kind !== 'lie' || m.found)) {
      this.lookingGlass = true;
      this.kit.achievement('looking-glass');
    }
  }

  // ------------------------------------------------------------ Fear gas

  private gas(x: number, y: number): void {
    const H = HOUND.gas;
    const img = this.kit.scene.add.image(x, y, CIRCUS_ART.gas, '0').setDepth(DEPTH.fx).setAlpha(0.9).setScale(H.radius / 14);
    this.clouds.push({ x, y, life: H.lifeMs, tick: 0, img });
    playSfx(CIRCUS_SFX.hiss, 0.6);
  }

  private stepGas(dtMs: number): void {
    const H = HOUND.gas;
    const p = this.kit.player;
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.life -= dtMs;
      c.tick -= dtMs;
      const k = Math.max(0, c.life / H.lifeMs);
      c.img.setAlpha(0.9 * Math.min(1, k * 2)).setScale((H.radius / 14) * (1.1 - k * 0.2)).setFrame(String(Math.floor(Math.max(0, c.life) / 300) % 2));
      if (!p.dead && c.tick <= 0 && Math.hypot(p.x - c.x, p.centerY - c.y) < H.radius) {
        c.tick = H.everyMs;
        this.kit.onPlayerHurt(p.takeDamage(H.damage, c.x));
      }
      if (c.life <= 0) {
        c.img.destroy();
        this.clouds.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------------------ The high striker

  private strike(strength: number): void {
    const st = this.striker;
    if (!st || st.rung) return;
    playSfx(CIRCUS_SFX.thump, 1);
    const k = Math.min(1, strength / TOYS.strikerBell);
    st.goal = k;
    if (k >= 1) {
      st.rung = true;
      this.kit.fx.shake(FX.shakeMedium, 160);
    } else {
      this.kit.fx.popText(st.e.x * TILE, st.e.y * TILE - 40, k < 0.4 ? 'TRY AGAIN, KID!' : 'ALMOST!', 0xffe08a);
    }
  }

  private stepStriker(dtMs: number): void {
    const st = this.striker;
    const art = this.strikerArt;
    if (!st || !art) return;
    // The puck flies up to its goal, then falls back (unless the bell rang: it stays at the top).
    const speed = dtMs / TOYS.strikerRiseMs;
    if (st.puck < st.goal) {
      st.puck = Math.min(st.goal, st.puck + speed * 1.6);
      if (st.puck >= 1 && st.goal >= 1) this.ringBell();
    } else if (!st.rung && st.goal > 0) {
      st.goal = 0;
    } else if (!st.rung) st.puck = Math.max(0, st.puck - speed);
    art.puck.setY(art.foot + (art.top - art.foot) * st.puck);
  }

  private ringBell(): void {
    const st = this.striker!;
    const art = this.strikerArt!;
    playSfx(CIRCUS_SFX.bell, 1);
    this.kit.fx.rays(art.x, art.top - 4, 0xfff0a0, 40, 600);
    this.kit.fx.popText(art.x, art.top - 20, 'DING DONG!', 0xffe08a);
    this.kit.payReward(st.e.reward, art.x, art.top);
  }

  // ------------------------------------------------------------ Lights

  private decay(dtMs: number): void {
    for (const b of this.bumpers) {
      if (b.litLeft > 0) {
        b.litLeft -= dtMs;
        if (String(b.img.frame.name) !== '1') b.img.setFrame('1');
      } else if (String(b.img.frame.name) !== '0') b.img.setFrame('0');
    }
    for (const pad of this.pads) {
      const f = pad.squashLeft > 0 ? '1' : '0';
      if (String(pad.img.frame.name) !== f) pad.img.setFrame(f);
    }
    for (const k of this.kickers) {
      k.flashLeft = Math.max(0, k.flashLeft - dtMs);
      const f = k.flashLeft > 0 ? '1' : '0';
      if (String(k.img.frame.name) !== f) k.img.setFrame(f);
    }
    for (const d of this.deflectors) {
      d.flashLeft = Math.max(0, d.flashLeft - dtMs);
      const f = d.flashLeft > 0 ? '1' : '0';
      if (String(d.img.frame.name) !== f) d.img.setFrame(f);
    }
  }

  destroy(): void {
    for (const c of this.clouds) c.img.destroy();
    this.clouds.length = 0;
    resetCircusEnv();
  }
}
