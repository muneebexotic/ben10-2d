import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { DIVE } from '../../../../config/dive';
import { PALETTE } from '../../../../config/palette';
import { TELL } from '../../../../config/tells';
import { attackBreaks, bendAt, DIVE_TRACK, laneOf, meet, onLanes, speedAt, type CartState, type DiveEvent, type DiveSpecial } from '../../../../levels/diveTrack';
import type { BountyPlan } from '../../../../levels/types';
import { EventBus } from '../../../../systems/EventBus';
import { a11y } from '../../../../systems/Accessibility';
import { DEV_TOOLS } from '../../../../systems/LaunchParams';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { brakeScreech, clawCharge, clawFire, crystalBreak, dynamiteBoom, erupt, missileBoom, missileIncoming, railClack, rockSmash, trackerLock } from '../../../../systems/audio/bountySfx';
import { createDiveView, type DiveSprite, type DiveView } from '../../../dive/DiveView';
import { TEX } from '../../../preload/assetKeys';
import { CH5_TEX } from '../../../preload/bounty';
import { SCENES } from '../../../SceneKeys';
import type { SetPiece, StoryKit } from '../StoryKit';

type Phase = 'wait' | 'board' | 'swing' | 'ride' | 'outro' | 'done';

interface Live {
  ev: DiveEvent;
  /** Cues already played (bit flags). */
  cues: number;
  /** 'gone': passed or destroyed. */
  state: 'ahead' | 'gone';
  /** A drone's strike: the track it painted (-1 before the paint). */
  paint: number;
  shotDown: boolean;
}

interface Shot {
  x: number;
  z: number;
  lane: number;
  alive: boolean;
}

interface Burst {
  x: number;
  y: number;
  z: number;
  color: number;
  life: number;
  size: number;
}

/** Where the drone's missile lands, past the drone (m). */
const MISSILE_AHEAD = 30;

/**
 * THE DEEP DIVE (Chapter 5): Kraab cuts the brake cable and the ore cart runs
 * away down the Diamond Deep's haulage way. The camera swings from the side
 * view round behind the cart and the game turns 3D (DiveScene draws it; this
 * runs it): three tracks, rocks, crates, beams to duck, gaps to jump, Kraab
 * erupting through the rails, Sixsix's drone painting a track for a missile,
 * Kraab's claw cannon from a side tunnel. Every form rides differently: its
 * attack (J) and special (K) come from its `ride` definition. At the bottom
 * the rails end on a broken trestle and the cart flies out over the crystal
 * cavern; the camera swings back to the side and Ben lands in 2D.
 */
export class MineDive implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly view: DiveView = createDiveView();
  private readonly live: Live[];
  private readonly shots: Shot[] = [];
  private readonly bursts: Burst[] = [];
  private d = 0;
  private x = 0;
  private lane = 1;
  private airMs = 0;
  private airTotal = 1;
  private airHeight = 0.9;
  private duckMs = 0;
  private special: DiveSpecial | null = null;
  private specialMs = 0;
  private specialReadyAt = 0;
  private shieldUsed = false;
  private attackReadyAt = 0;
  private attackAnim = 0;
  private graceMs = 0;
  private hits = 0;
  private clackIn = 0;
  private cardTaken = false;
  private prevLeft = false;
  private prevRight = false;
  private prevDuck = false;
  private flash = 0;
  private shake = 0;
  private time = 0;
  private cart: Phaser.GameObjects.Image | null = null;
  private claw: Phaser.GameObjects.Sprite | null = null;
  private readonly tipped = new Set<string>();
  private readonly floorY: number;
  private readonly cartX0: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: BountyPlan['dive'],
    resumeX: number,
  ) {
    this.floorY = spec.floor * TILE;
    this.cartX0 = spec.cartX * TILE + TILE / 2;
    this.live = DIVE_TRACK.events.map((ev) => ({ ev, cues: 0, state: 'ahead', paint: -1, shotDown: false }));
    if (resumeX > spec.landX * TILE - TILE * 6) {
      this.phase = 'done';
      return;
    }
    this.cart = kit.scene.add.image(this.cartX0, this.floorY, CH5_TEX.oreCart).setOrigin(0.5, 1).setDepth(DEPTH.props);
  }

  /** The ride is over (or was never needed): the cavern beat may start. */
  get done(): boolean {
    return this.phase === 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'board' || this.phase === 'swing' || this.phase === 'outro';
  }

  get storyLock(): boolean {
    return this.phase === 'board' || this.phase === 'swing' || this.phase === 'outro';
  }

  update(dtMs: number, realDtMs: number, controls: Controls): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    this.t += realDtMs;
    this.time += realDtMs;
    switch (this.phase) {
      case 'wait':
        if (!p.dead && p.grounded && p.x >= this.spec.triggerX * TILE && Math.abs(p.y - this.floorY) < TILE * 2) this.board();
        return;
      case 'board':
        this.updateBoard();
        return;
      case 'swing':
        this.updateSwing();
        this.render();
        return;
      case 'ride':
        this.updateRide(dtMs, controls);
        this.render();
        return;
      case 'outro':
        this.updateOutro();
        this.render();
        return;
      default:
        return;
    }
  }

  // ------------------------------------------------------------ In 2D: the station

  private board(): void {
    const kit = this.kit;
    this.phase = 'board';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.setLetterbox(true);
    kit.camera.lockTo(this.cartX0, this.floorY - 60);
    kit.speech.show('ALL ABOARD!', 1000);
  }

  private updateBoard(): void {
    const kit = this.kit;
    const p = kit.player;
    const cart = this.cart!;
    // Ben hops in.
    if (this.t < 500) {
      const k = this.t / 500;
      p.teleport(Phaser.Math.Linear(p.x, cart.x, k), this.floorY - 10 - Math.sin(k * Math.PI) * 26);
      return;
    }
    p.teleport(cart.x, this.floorY - 10);
    if (!this.claw && this.t >= 700) {
      // Kraab's claw comes up through the boards and snips the brake cable.
      this.claw = kit.scene.add.sprite(cart.x - 30, this.floorY + 10, CH5_TEX.kraab, 6).setOrigin(0.5, 1).setDepth(DEPTH.props + 1).setScale(0.6);
      kit.scene.tweens.add({ targets: this.claw, y: this.floorY + 2, duration: 220, yoyo: true, hold: 500 });
      kit.fx.burst('debris', cart.x - 30, this.floorY, 12);
      playSfx(erupt, 0.8);
    }
    if (this.t >= 1150 && this.t - 16 < 1150) {
      kit.fx.burst('spark', cart.x - 20, this.floorY - 6, 14);
      playSfx(brakeScreech, 0.8, 1.3);
      kit.dialogue.say('kraab', 'HOPE YOU LIKE ROLLER COASTERS, BOY!', 1800);
    }
    if (this.t >= 1700) {
      // It starts to roll... and the camera swings round behind it.
      const k = (this.t - 1700) / 900;
      cart.x = this.cartX0 + k * k * 40;
      p.teleport(cart.x, this.floorY - 10);
      if (this.t >= 2600) this.startSwing();
    }
  }

  private startSwing(): void {
    const kit = this.kit;
    this.phase = 'swing';
    this.t = 0;
    this.cart?.setVisible(false);
    this.claw?.destroy();
    this.claw = null;
    // Ben waits out the ride on the cavern floor, out of sight and out of reach.
    kit.player.teleport(this.spec.landX * TILE, this.spec.landY * TILE);
    kit.player.visual.setHidden(true);
    kit.setLetterbox(false);
    kit.camera.unlock();
    const v = this.view;
    v.yaw = Math.PI / 2;
    v.fade = 1;
    kit.scene.scene.launch(SCENES.dive, { view: v });
    kit.setWorldHidden(true);
    kit.omni.worksWhileLocked = true;
    kit.playMusic('dive');
    EventBus.emit('hud:banner', { title: 'THE DEEP DIVE', subtitle: 'NO BRAKES', color: PALETTE.diamondhead, durationMs: 1800, style: 'slam' });
  }

  private updateSwing(): void {
    const v = this.view;
    // Dev builds: ?dive=<metres> starts the ride part-way down (to test the end).
    if (DEV_TOOLS && this.d === 0) {
      const from = Number(new URLSearchParams(window.location.search).get('dive') ?? 0);
      if (from > 0) {
        this.d = from;
        for (const l of this.live) if (l.ev.at < from) l.state = 'gone';
      }
    }
    const k = Math.min(1, this.t / DIVE.camera.swingMs);
    v.fade = Math.max(0, 1 - this.t / 300);
    v.yaw = (Math.PI / 2) * (1 - Phaser.Math.Easing.Sine.InOut(k));
    this.d += speedAt(0) * 0.4 * (16 / 1000);
    if (k >= 1) {
      v.yaw = 0;
      this.phase = 'ride';
      this.t = 0;
    }
  }

  // ------------------------------------------------------------ The ride

  private cartState(): CartState {
    return { x: this.x, airborne: this.airMs > 0, ducking: this.duckMs > 0, special: this.special };
  }

  private updateRide(dtMs: number, c: Controls): void {
    const kit = this.kit;
    const p = kit.player;
    const dt = dtMs / 1000;
    const scale = this.special === 'boost' ? DIVE.boostScale : 1;
    if (dt > 0) this.d += speedAt(this.d) * dt * scale;
    // Lanes: one tap, one track.
    if (c.left && !this.prevLeft) this.lane = Math.max(0, this.lane - 1);
    if (c.right && !this.prevRight) this.lane = Math.min(DIVE.lanes.length - 1, this.lane + 1);
    this.prevLeft = c.left;
    this.prevRight = c.right;
    const tx = DIVE.lanes[this.lane];
    this.x += Phaser.Math.Clamp(tx - this.x, -DIVE.laneSpeed * dt, DIVE.laneSpeed * dt);
    // Jump, duck.
    if (c.jumpPressed && this.airMs <= 0) this.hop(DIVE.jumpMs, 0.9);
    if (c.down) this.duckMs = Math.max(this.duckMs, 120);
    if (c.down && this.duckMs < DIVE.duckMs && !this.prevDuck) this.duckMs = DIVE.duckMs;
    this.prevDuck = c.down;
    this.airMs = Math.max(0, this.airMs - dtMs);
    this.duckMs = Math.max(0, this.duckMs - dtMs);
    this.graceMs = Math.max(0, this.graceMs - dtMs);
    this.attackAnim = Math.max(0, this.attackAnim - dtMs);
    // The form's moves.
    const ride = p.form.ride;
    if (c.attackPressed && this.time >= this.attackReadyAt) this.attack(ride?.attack ?? 'strike', ride?.color ?? PALETTE.white);
    if (c.specialPressed) this.trySpecial(ride?.special ?? null);
    if (this.specialMs > 0) {
      this.specialMs -= dtMs;
      if (this.specialMs <= 0) this.special = null;
    }
    this.updateShots(dt);
    this.updateEvents();
    // Wheels on the rail joints.
    this.clackIn -= dtMs;
    if (this.clackIn <= 0 && this.airMs <= 0) {
      this.clackIn = 9000 / Math.max(8, speedAt(this.d));
      playSfx(railClack, 0.5, 0.9 + Math.random() * 0.2);
    }
    if (this.d >= DIVE_TRACK.trestle) this.launch();
  }

  private hop(ms: number, height: number): void {
    this.airMs = ms;
    this.airTotal = ms;
    this.airHeight = height;
    playSfx('jump', 0.7, 0.8);
  }

  private trySpecial(kind: DiveSpecial | null): void {
    const kit = this.kit;
    if (kind === null) {
      this.tip('no-special', 'TRANSFORM ({T}) FOR AN ALIEN\'S SPECIAL!');
      return;
    }
    if (this.time < this.specialReadyAt) return;
    this.special = kind;
    this.specialMs = DIVE.special[kind];
    this.specialReadyAt = this.time + DIVE.special.cooldownMs;
    this.shieldUsed = false;
    if (kind === 'rocket') this.hop(DIVE.rocketJumpMs, 1.4);
    if (kind === 'fly') this.hop(DIVE.special.fly, 0.75);
    const lines: Record<DiveSpecial, string> = { rocket: 'ROCKET JUMP!', brace: 'BRACE!', boost: 'TOO SLOW!', senses: '*SNIFF*', fly: 'BUZZ!', merge: 'TAKEOVER!', phase: 'BOO.', shield: 'CRYSTAL SHIELD!' };
    kit.speech.show(lines[kind], 900);
    playSfx('swap', 0.6, 1.2);
  }

  private attack(kind: 'shot' | 'smash' | 'strike', color: number): void {
    this.attackReadyAt = this.time + DIVE.attack.cooldownMs;
    this.attackAnim = 220;
    const lane = laneOf(this.x);
    if (kind === 'shot') {
      const s = this.shots.find((sh) => !sh.alive) ?? (this.shots.length < 6 ? this.shots[this.shots.push({ x: 0, z: 0, lane: 0, alive: false }) - 1] : null);
      if (!s) return;
      s.alive = true;
      s.x = DIVE.lanes[lane];
      s.z = this.d + 0.8;
      s.lane = lane;
      this.burst(this.x, -0.4, this.d + 1, color, 0.5);
      playSfx('fireball', 0.7, 1.1);
      return;
    }
    // Up close: the first thing ahead on this track within reach.
    const reach = kind === 'smash' ? DIVE.attack.smashRange : DIVE.attack.strikeRange;
    const target = this.live.find((l) => l.state === 'ahead' && l.ev.lanes.includes(lane) && l.ev.at > this.d && l.ev.at - this.d <= reach && attackBreaks(kind, l.ev.kind));
    playSfx(kind === 'smash' ? 'punchHit' : 'swing', 0.9);
    this.burst(DIVE.lanes[lane], -0.5, this.d + 2.5, color, 0.6);
    if (target) this.smash(target, color);
  }

  private updateShots(dt: number): void {
    for (const s of this.shots) {
      if (!s.alive) continue;
      s.z += DIVE.attack.shotSpeed * dt;
      if (s.z > this.d + DIVE.attack.shotRange) {
        s.alive = false;
        continue;
      }
      for (const l of this.live) {
        if (l.state !== 'ahead' || !attackBreaks('shot', l.ev.kind)) continue;
        const drone = l.ev.kind === 'drone';
        const z = drone ? this.droneZ(l) : l.ev.at;
        const inLine = drone ? Math.abs(DIVE.lanes[s.lane] - this.droneX(l)) < 0.8 : l.ev.lanes.includes(s.lane);
        if (inLine && Math.abs(s.z - z) < 1.5) {
          s.alive = false;
          this.smash(l, this.kit.player.form.ride?.color ?? PALETTE.white);
          break;
        }
      }
    }
  }

  /** A drone flies ahead of the cart, painting its track, until the strike lands or it's shot down. */
  private droneZ(l: Live): number {
    return Math.max(l.ev.at, Math.min(this.d + 26, l.ev.at + MISSILE_AHEAD - 4));
  }

  private droneX(l: Live): number {
    return DIVE.lanes[l.ev.lanes[0]] + Math.sin(this.time * 0.004) * 0.25;
  }

  private smash(l: Live, color: number): void {
    const kit = this.kit;
    const ev = l.ev;
    l.state = 'gone';
    const x = ev.kind === 'drone' ? this.droneX(l) : DIVE.lanes[ev.lanes[0]];
    const z = ev.kind === 'drone' ? this.droneZ(l) : ev.at;
    if (ev.kind === 'drone') l.shotDown = true;
    if (ev.kind === 'crate') {
      this.burst(x, -0.6, z, PALETTE.fire1, 2.4);
      playSfx(dynamiteBoom, 0.9);
      if (z - this.d < DIVE.crateBlastRange && onLanes(this.x, ev.lanes)) this.hurt('crate');
    } else {
      this.burst(x, -0.6, z, color, 1.2);
      playSfx(ev.kind === 'rock' ? rockSmash : 'explode', 0.8);
    }
    if (ev.kind !== 'rock') kit.onEnemyKilled();
  }

  private updateEvents(): void {
    for (const l of this.live) {
      if (l.state !== 'ahead') continue;
      const ev = l.ev;
      const ahead = ev.at - this.d;
      if (ev.tip && ahead < 55) this.tip(ev.kind, ev.tip);
      if (ev.kind === 'drone') {
        this.updateDrone(l);
        continue;
      }
      // Sound cues latch once each (a slow frame can't skip them).
      if (ev.kind === 'kraab' && ahead < 9 && this.cue(l, 1)) playSfx(erupt, 0.9);
      if (ev.kind === 'cannon' && ahead < 40 && this.cue(l, 1)) playSfx(clawCharge, 0.8);
      if (ev.kind === 'cannon' && ahead < 6 && this.cue(l, 2)) playSfx(clawFire, 1);
      const end = ev.kind === 'gap' ? ev.at + (ev.len ?? 6) : ev.at;
      if (this.d < ev.at - DIVE.hitDepth * 0.5) continue;
      if (ev.kind === 'gap') {
        // Over the gap: in the air the whole way, or down it goes.
        if (this.d >= end) {
          l.state = 'gone';
          continue;
        }
        if (meet('gap', ev.lanes, this.cartState()) === 'hit') {
          l.state = 'gone';
          this.hurt('gap');
          this.hop(500, 0.4);
        }
        continue;
      }
      l.state = 'gone';
      let outcome = meet(ev.kind, ev.lanes, this.cartState());
      if (ev.kind === 'card' && ev.high && this.airMs <= 0) outcome = 'clear';
      this.resolve(l, outcome);
    }
  }

  private updateDrone(l: Live): void {
    const ahead = l.ev.at - this.d;
    const strikeAt = l.ev.at + MISSILE_AHEAD;
    if (ahead < 55 && l.paint < 0 && !l.shotDown) {
      l.paint = l.ev.lanes[0];
      playSfx(trackerLock, 0.8);
    }
    if (this.d >= strikeAt - DIVE.hitDepth * 0.5) {
      l.state = 'gone';
      if (l.shotDown) return;
      playSfx(missileBoom, 0.9);
      this.burst(DIVE.lanes[l.paint], -0.8, strikeAt, PALETTE.sixsix, 2);
      this.resolve(l, meet('missile', [l.paint], this.cartState()));
      return;
    }
    if (strikeAt - this.d < 12 && this.cue(l, 2)) playSfx(missileIncoming, 0.8);
  }

  private resolve(l: Live, outcome: ReturnType<typeof meet>): void {
    const kit = this.kit;
    const kind = l.ev.kind;
    switch (outcome) {
      case 'hit':
        this.hurt(kind === 'drone' ? 'missile' : (kind as keyof typeof DIVE.damage));
        if (kind === 'crate') this.burst(this.x, -0.6, this.d + 1, PALETTE.fire1, 2.2);
        return;
      case 'shielded':
        if (this.shieldUsed) {
          this.hurt(kind === 'drone' ? 'missile' : (kind as keyof typeof DIVE.damage));
          return;
        }
        this.shieldUsed = true;
        this.burst(this.x, -0.4, this.d + 1.2, PALETTE.diamondhead, 1.4);
        playSfx(crystalBreak, 0.9);
        return;
      case 'smashed':
        this.smash(l, 0xff8a6a);
        return;
      case 'collect':
        if (kind === 'smoothy') {
          const healed = kit.player.heal(1);
          playSfx('heal');
          this.burst(this.x, -0.6, this.d + 1, 0xff8fc8, 0.8);
          if (healed > 0) EventBus.emit('player:health', { hp: kit.player.hp, max: kit.player.maxHp, delta: healed });
        } else if (kind === 'card') {
          this.cardTaken = true;
          playSfx('card');
          this.burst(this.x, 0, this.d + 1, PALETTE.gold, 1);
          EventBus.emit('hud:banner', { title: 'CARD!', subtitle: 'GRAB IT AT THE BOTTOM', color: PALETTE.gold, durationMs: 1400, style: 'soft' });
        }
        return;
      default:
        return;
    }
  }

  private hurt(kind: keyof typeof DIVE.damage): void {
    const kit = this.kit;
    if (this.graceMs > 0) return;
    this.graceMs = DIVE.hitGraceMs;
    this.hits++;
    this.flash = 1;
    this.shake = 10;
    kit.fx.hitStop(60);
    playSfx('hurt', 1);
    const p = kit.player;
    const outcome = p.takeDamage(DIVE.damage[kind], p.x - 10, 'contact');
    kit.onPlayerHurt(outcome);
  }

  /** True the first time cue `bit` is asked for on this event. */
  private cue(l: Live, bit: number): boolean {
    if (l.cues & bit) return false;
    l.cues |= bit;
    return true;
  }

  private tip(id: string, text: string): void {
    if (this.tipped.has(id)) return;
    this.tipped.add(id);
    this.kit.tutorial.tip(`dive-${id}`, text, 3500, 9);
  }

  private burst(x: number, y: number, z: number, color: number, size: number): void {
    const b = this.bursts.find((bb) => bb.life <= 0) ?? (this.bursts.length < 12 ? this.bursts[this.bursts.push({ x: 0, y: 0, z: 0, color: 0, life: 0, size: 0 }) - 1] : null);
    if (!b) return;
    b.x = x;
    b.y = y;
    b.z = z;
    b.color = color;
    b.life = 320;
    b.size = size;
  }

  // ------------------------------------------------------------ Off the trestle

  private launch(): void {
    this.phase = 'outro';
    this.t = 0;
    playSfx('jump', 1, 0.6);
    this.kit.speech.show('WHOA-OA-OA!', 1400);
  }

  private updateOutro(): void {
    const v = this.view;
    const k = Math.min(1, this.t / DIVE.camera.outroMs);
    this.d += speedAt(this.d) * (16 / 1000) * (1 - k * 0.5);
    // Up off the end of the rails and down into the glow, the camera swinging round to the side.
    this.airMs = 1;
    this.airHeight = 0;
    v.yaw = -(Math.PI / 2) * Phaser.Math.Easing.Sine.In(k);
    v.fade = Math.max(0, (k - 0.7) / 0.3);
    if (k >= 1) this.land();
  }

  private land(): void {
    const kit = this.kit;
    this.phase = 'done';
    kit.omni.worksWhileLocked = false;
    kit.scene.scene.stop(SCENES.dive);
    kit.setWorldHidden(false);
    const p = kit.player;
    const x = this.spec.landX * TILE;
    const y = this.spec.landY * TILE;
    p.visual.setHidden(false);
    p.teleport(x, y - 70);
    p.setVelocityX(80);
    p.controlsEnabled = true;
    kit.camera.snap(x, y);
    // The cart comes down after him and smashes on the cavern floor.
    const cart = kit.scene.add.image(x + 30, y - 120, CH5_TEX.oreCart).setOrigin(0.5, 1).setDepth(DEPTH.props).setAngle(-30);
    kit.scene.tweens.add({
      targets: cart,
      y,
      angle: 160,
      x: x + 46,
      duration: 520,
      ease: 'Quad.easeIn',
      onComplete: () => {
        kit.fx.burst('debris', cart.x, y, 20);
        kit.fx.burst('dust', cart.x, y, 16);
        kit.fx.shake(0.012, 260);
        playSfx('explode', 0.8, 0.7);
      },
    });
    if (this.cardTaken) kit.payReward('dive', x + 40, y - 60);
    if (this.hits === 0) kit.achievement('deep-diver');
    kit.playMusic('mine');
  }

  // ------------------------------------------------------------ The picture

  private slot(i: number): DiveSprite {
    const s = this.view.sprites[i];
    s.width = undefined;
    s.tint = undefined;
    s.alpha = undefined;
    s.flip = undefined;
    s.angle = undefined;
    s.additive = undefined;
    return s;
  }

  private render(): void {
    const v = this.view;
    const p = this.kit.player;
    v.travel = this.d;
    v.time = this.time;
    v.bend = bendAt(this.d + 15);
    v.depth = Math.min(1, this.d / DIVE_TRACK.trestle);
    v.cavern = Phaser.Math.Clamp((this.d - (DIVE_TRACK.trestle - 70)) / 70, 0, 1);
    v.trestle = DIVE_TRACK.trestle;
    v.flash = this.flash * (a11y.reduceFlashing ? 0.3 : 1);
    this.flash = Math.max(0, this.flash - 0.06);
    v.cartShake = this.shake;
    this.shake = Math.max(0, this.shake - 0.6);
    v.speed = Phaser.Math.Clamp((speedAt(this.d) - 12) / 12, 0, 1);
    // The camera trails the cart across the tracks and rises with its hops.
    const air = this.airMs > 0 && this.airTotal > 0 ? Math.sin((1 - this.airMs / this.airTotal) * Math.PI) * this.airHeight : 0;
    v.cartX = this.x;
    v.cartAir = this.phase === 'outro' ? 0.6 - Math.max(0, this.t - 500) * 0.004 : air;
    v.camX += (this.x * 0.75 - v.camX) * 0.12;
    v.camY = DIVE.camera.height + air * 0.35;
    v.cartTilt = (DIVE.lanes[this.lane] - this.x) * -14;
    // Gaps ahead.
    let gi = 0;
    v.gaps[0] = v.gaps[1] = v.gaps[2] = v.gaps[3] = -1;
    for (const ev of DIVE_TRACK.events) {
      if (ev.kind !== 'gap' || ev.at + (ev.len ?? 6) < this.d - 2 || gi > 2) continue;
      v.gaps[gi] = ev.at;
      v.gaps[gi + 1] = ev.at + (ev.len ?? 6);
      gi += 2;
    }
    // The rider: from behind, or from the side while the camera swings.
    const form = p.form;
    v.rider.side = Math.abs(v.yaw) > 0.6;
    v.rider.key = form.ride?.back ?? form.texture;
    v.rider.frame = this.duckMs > 0 ? 2 : this.attackAnim > 0 ? 1 : 0;
    v.rider.sideKey = form.texture;
    v.rider.sideFrame = 0;
    v.rider.ghost = this.special === 'phase';
    v.aura = this.special;
    this.renderTrack();
  }

  private renderTrack(): void {
    const v = this.view;
    let n = 0;
    let w = 0;
    const max = v.sprites.length - 2;
    for (const l of this.live) {
      if (n >= max) break;
      const ev = l.ev;
      const ahead = ev.at - this.d;
      if (l.state !== 'ahead' || ahead > 95 || ahead < -2) continue;
      const lane = ev.lanes[0];
      switch (ev.kind) {
        case 'rock':
        case 'crate':
        case 'crabbot':
          for (const ln of ev.lanes) {
            const s = this.slot(n++);
            s.x = DIVE.lanes[ln];
            s.y = -1;
            s.z = ev.at;
            s.key = ev.kind === 'rock' ? CH5_TEX.fallingRock : ev.kind === 'crate' ? CH5_TEX.dynamite : CH5_TEX.crabbot;
            s.frame = ev.kind === 'rock' ? (ln + Math.floor(ev.at)) % 3 : ev.kind === 'crabbot' ? (ahead < 22 ? 2 : Math.floor(this.time / 120) % 2) : 0;
            s.size = ev.kind === 'rock' ? 0.8 : ev.kind === 'crate' ? 0.55 : 0.5;
          }
          break;
        case 'beam': {
          const s = this.slot(n++);
          s.x = 0;
          s.y = -0.02;
          s.z = ev.at;
          s.key = CH5_TEX.diveBeam;
          s.frame = 0;
          s.size = 0.28;
          s.width = 3.3;
          break;
        }
        case 'kraab': {
          // A crack racing back along the track toward the cart, then Kraab erupting.
          if (w < v.warnings.length && ahead < DIVE.warnAhead.kraab) this.warn(w++, [lane], ev.at - Math.max(0, ahead - 2), ev.at + 1, TELL.kraab.core, TELL.kraab.edge, 0.9);
          if (ahead < 9) {
            const s = this.slot(n++);
            s.x = DIVE.lanes[lane];
            s.y = -1;
            s.z = ev.at;
            s.key = CH5_TEX.kraab;
            s.frame = 6;
            s.size = 1.45 * Math.min(1, (9 - ahead) / 3);
          }
          break;
        }
        case 'cannon': {
          const s = this.slot(n++);
          s.x = 1.55;
          s.y = -0.2;
          s.z = ev.at + 2;
          s.key = TEX.light;
          s.frame = 0;
          s.size = 0.9 + Math.sin(this.time * 0.02) * 0.1;
          s.tint = PALETTE.kraab;
          s.additive = true;
          if (w < v.warnings.length && ahead < DIVE.warnAhead.cannon) this.warn(w++, ev.lanes, ev.at - 2, ev.at + 2, TELL.kraab.core, TELL.kraab.edge, 0.95);
          if (ahead < 6) {
            const b = this.slot(n++);
            b.x = 0.5;
            b.y = -0.75;
            b.z = ev.at;
            b.key = TEX.light;
            b.frame = 0;
            b.size = 0.5;
            b.width = 2.6;
            b.tint = PALETTE.kraab;
            b.additive = true;
          }
          break;
        }
        case 'drone': {
          if (l.shotDown) break;
          const s = this.slot(n++);
          s.x = this.droneX(l);
          s.y = 0.35;
          s.z = this.droneZ(l);
          s.key = CH5_TEX.tracker;
          s.frame = l.paint >= 0 ? 2 : Math.floor(this.time / 80) % 2;
          s.size = 0.32;
          s.flip = true;
          if (l.paint >= 0 && w < v.warnings.length) {
            const strikeAt = ev.at + MISSILE_AHEAD;
            this.warn(w++, [l.paint], strikeAt - 1.5, strikeAt + 1.5, TELL.sixsix.core, TELL.sixsix.edge, 0.95);
            if (strikeAt - this.d < 11) {
              const m = this.slot(n++);
              m.x = DIVE.lanes[l.paint];
              m.y = -1 + Math.max(0, (strikeAt - this.d - 1) / 10) * 2;
              m.z = strikeAt;
              m.key = TEX.missile;
              m.frame = 0;
              m.size = 0.3;
              m.angle = 90;
            }
          }
          break;
        }
        case 'smoothy':
        case 'card': {
          const s = this.slot(n++);
          s.x = DIVE.lanes[lane];
          s.y = ev.high ? 0.15 : -0.85 + Math.sin(this.time * 0.006) * 0.05;
          s.z = ev.at;
          s.key = ev.kind === 'card' ? TEX.card : TEX.smoothy;
          s.frame = 0;
          s.size = 0.38;
          break;
        }
        case 'gap':
          // The shader cuts the rails; a warning sign hangs before it.
          if (w < v.warnings.length && ahead < 40) this.warn(w++, [0, 1, 2], ev.at - 3, ev.at, PALETTE.enemy, PALETTE.gold, 0.5);
          break;
        default:
          break;
      }
    }
    for (const s of this.shots) {
      if (!s.alive || n >= max) continue;
      const o = this.slot(n++);
      o.x = s.x;
      o.y = -0.55;
      o.z = s.z;
      o.key = TEX.light;
      o.frame = 0;
      o.size = 0.28;
      o.tint = this.kit.player.form.ride?.color ?? PALETTE.white;
      o.additive = true;
    }
    for (const b of this.bursts) {
      if (b.life <= 0 || n >= max) continue;
      b.life -= 16;
      const o = this.slot(n++);
      o.x = b.x;
      o.y = b.y - b.size * 0.3;
      o.z = b.z;
      o.key = TEX.light;
      o.frame = 0;
      o.size = b.size * (1.4 - b.life / 320);
      o.tint = b.color;
      o.additive = true;
      o.alpha = b.life / 320;
    }
    v.spriteCount = n;
    v.warningCount = w;
  }

  private warn(i: number, lanes: readonly number[], from: number, to: number, color: number, edge: number, alpha: number): void {
    const wn = this.view.warnings[i];
    wn.lanes = lanes;
    wn.from = from;
    wn.to = to;
    wn.color = color;
    wn.edge = edge;
    wn.alpha = alpha;
  }

  destroy(): void {
    const kit = this.kit;
    if (kit.scene.scene.isActive(SCENES.dive) || kit.scene.scene.isPaused(SCENES.dive)) kit.scene.scene.stop(SCENES.dive);
    kit.setWorldHidden(false);
    kit.omni.worksWhileLocked = false;
    this.cart?.destroy();
    this.claw?.destroy();
  }
}
