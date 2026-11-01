import Phaser from 'phaser';
import { TILE } from '../../../../config/constants';
import { CH7_REACTOR } from '../../../../config/chapter7';
import { PALETTE } from '../../../../config/palette';
import type { PlumberPlan } from '../../../../levels/types';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import type { UnlockBeat } from '../../story/UnlockBeat';
import { doorClunk, lightsThud } from '../water/sfx';
import type { BaseSystems } from '../water/BaseSystems';
import { plumberKevin } from './actors';
import { CONTAINMENT_FAILURE, FLOOD_LINES, GLIMPSE_LINE, REACTOR_LINES, SEA_LINES } from './lines';

type Phase = 'wait' | 'talk' | 'drain' | 'flood' | 'unlock' | 'done';

/**
 * The reactor (GAME_DESIGN.md, Chapter 7, beats 6 to 8). On the way, Kevin is
 * a shadow dashing past ahead of Ben. At the reactor he's drinking it in:
 * a few words, then the base goes dark, CONTAINMENT FAILURE, he's gone
 * through the ceiling, the hatches seal and the sea pours in. When Ben's air
 * runs low (or the room has been full a while), the Omnitrix answers:
 * NEW DNA DETECTED, Ripjaws, and he bursts through the glass into the open
 * sea. A run resumed past the glass starts with all of it done.
 */
export class Reactor implements SetPiece {
  private phase: Phase = 'wait';
  private glimpsed = false;
  private kevin: FamilyActor | null = null;
  private fullFor = 0;
  private bubblesIn = 0;
  private readonly timers: Array<{ at: number; fn: () => void }> = [];

  constructor(
    private readonly kit: StoryKit,
    private readonly base: BaseSystems,
    private readonly plan: PlumberPlan,
    private readonly beat: UnlockBeat | null,
    resumeX: number,
  ) {
    const r = plan.reactor;
    if (resumeX > plan.glimpse.windowX * TILE) this.glimpsed = true;
    if (resumeX > r.glass.x * TILE) {
      // Past the glass: the reactor is dark and flooded, the glass gone.
      for (const h of r.hatches) base.doors.set(h, false, true);
      base.tanks.snapLevel(r.tank, r.floodTo);
      kit.collapse(r.glass);
      base.tanks.rebuildOpen();
      base.setLamps('reactor', 'emergency', false);
      this.phase = 'done';
    }
  }

  get cinematic(): boolean {
    return this.phase === 'talk';
  }

  get storyLock(): boolean {
    return this.phase === 'talk' || this.phase === 'drain' || this.phase === 'unlock';
  }

  update(dtMs: number, realDtMs: number, _controls: Controls): void {
    const kit = this.kit;
    const now = kit.now();
    for (let i = this.timers.length - 1; i >= 0; i--) {
      if (now < this.timers[i].at) continue;
      const t = this.timers[i];
      this.timers.splice(i, 1);
      t.fn();
    }
    this.kevin?.update(realDtMs);
    const p = kit.player;
    if (!this.glimpsed && p.x >= this.plan.glimpse.triggerX * TILE && !p.dead) this.glimpse();
    const r = this.plan.reactor;
    switch (this.phase) {
      case 'wait':
        if (p.x >= r.triggerX * TILE && !p.dead) this.confront();
        break;
      case 'talk':
      case 'drain':
        this.drainLight();
        break;
      case 'flood':
        this.flood(dtMs);
        break;
    }
  }

  /** A shadow dashing past ahead: Kevin, heading for the reactor. */
  private glimpse(): void {
    const kit = this.kit;
    const G = CH7_REACTOR.glimpse;
    this.glimpsed = true;
    const k = this.kevinActor();
    const x = this.plan.glimpse.windowX * TILE;
    k.place(x + G.fromPx, this.plan.glimpse.floor * TILE);
    k.sprite.setTint(G.tint).setTintMode(Phaser.TintModes.FILL);
    k.runTo(x + G.toPx, G.speed, () => {
      k.hide();
      k.sprite.clearTint();
    });
    kit.speech.show(GLIMPSE_LINE, 1800);
  }

  private kevinActor(): FamilyActor {
    this.kevin ??= plumberKevin(this.kit);
    return this.kevin;
  }

  /** Kevin at the reactor, drinking it in: Ben stops to see. */
  private confront(): void {
    const kit = this.kit;
    const r = this.plan.reactor;
    this.phase = 'talk';
    const k = this.kevinActor();
    k.sprite.clearTint();
    k.place(r.kevinX * TILE, r.floor * TILE);
    k.face(-1);
    k.pose('absorb');
    const p = kit.player;
    p.controlsEnabled = false;
    p.setVelocityX(0);
    kit.dialogue.play(REACTOR_LINES, { onDone: () => this.drain() });
  }

  private drainLight(): void {
    const L = CH7_REACTOR.drainLight;
    const k = this.kevin;
    if (k?.visible) this.kit.lighting.add(k.x, k.feetY - 18, L.radius, L.color, L.intensity);
  }

  /** He takes it all: the base goes dark, he blasts the bulkhead overhead and he's gone. */
  private drain(): void {
    const kit = this.kit;
    const r = this.plan.reactor;
    this.phase = 'drain';
    this.base.setLamps('reactor', 'emergency');
    this.base.setLamps('flooded', 'emergency', false);
    playSfx(lightsThud, 1, 0.6);
    kit.fx.shake(0.012, 600);
    EventBus.emit('hud:banner', { title: CONTAINMENT_FAILURE, color: PALETTE.enemy, durationMs: 1800, style: 'boss' });
    const k = this.kevinActor();
    k.hold('windup', 500);
    this.after(CH7_REACTOR.blastMs, () => {
      // The bolt into the ceiling's bulkhead.
      kit.fx.flash(k.x, 20 * TILE + 8, CH7_REACTOR.drainLight.color, 40, 400);
      kit.fx.burst('mana', k.x, 20 * TILE + 8, 18);
      kit.fx.shake(0.01, 300);
      k.hopTo(k.x - 2 * TILE, 28 * TILE, 420);
    });
    this.after(CH7_REACTOR.exitMs, () => {
      kit.fx.burst('mana', k.x, k.feetY - 20, 14);
      k.hide();
      // The hatches seal and the sea pours in.
      for (const h of r.hatches) this.base.doors.set(h, false);
      playSfx(doorClunk, 1);
      this.base.tanks.setLevel(r.tank, r.floodTo, CH7_REACTOR.floodSpeed);
      kit.dialogue.play(FLOOD_LINES);
      kit.player.controlsEnabled = true;
      this.phase = 'flood';
    });
  }

  /** The room fills; when Ben's air runs low the watch answers. */
  private flood(dtMs: number): void {
    const kit = this.kit;
    const r = this.plan.reactor;
    const tanks = this.base.tanks;
    this.bubblesIn -= dtMs;
    if (this.bubblesIn <= 0 && !tanks.settled(r.tank)) {
      this.bubblesIn = CH7_REACTOR.bubblesEveryMs;
      // The sea breaking in round the glass.
      const g = r.glass;
      kit.fx.burst('bubble', g.x * TILE - 4, (g.y + Math.random() * g.h) * TILE, 4);
    }
    if (tanks.settled(r.tank)) this.fullFor += dtMs;
    const p = kit.player;
    const lowAir = p.breath.needsAir && p.underwater && p.breath.ratio <= CH7_REACTOR.unlockAir;
    if (!p.dead && (lowAir || this.fullFor >= CH7_REACTOR.unlockAfterFullMs)) this.unlock();
  }

  private unlock(): void {
    this.phase = 'unlock';
    // The watch reads the archive next door: never a misfire, and Ben gets his air back as a fish.
    this.kit.player.breath.fill();
    if (this.beat) this.beat.start(() => this.smash());
    else this.smash();
  }

  /** Out through the glass and into the open sea. */
  private smash(): void {
    const kit = this.kit;
    const r = this.plan.reactor;
    const g = r.glass;
    this.phase = 'done';
    kit.collapse(g);
    this.base.tanks.rebuildOpen();
    for (let i = 0; i < g.h; i += 2) kit.fx.burst('bubble', (g.x + 0.5) * TILE, (g.y + i) * TILE, 8);
    kit.fx.flash((g.x + 0.5) * TILE, (g.y + g.h / 2) * TILE, 0xbaf0ff, 60, 500);
    kit.fx.shake(0.02, 500);
    playSfx(doorClunk, 1, 0.7);
    const p = kit.player;
    p.setFacing(1);
    p.setVelocityX(CH7_REACTOR.burstSpeed);
    this.after(1800, () => kit.dialogue.play(SEA_LINES));
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push({ at: this.kit.now() + ms, fn });
  }

  destroy(): void {
    this.timers.length = 0;
    this.kevin?.destroy();
  }
}
