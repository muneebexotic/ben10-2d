import Phaser from 'phaser';
import { getAlien, hasAlien } from '../../../../aliens/registry';
import { DEPTH, TILE } from '../../../../config/constants';
import { TURN } from '../../../../config/kevin';
import { PALETTE } from '../../../../config/palette';
import { BossHazards } from '../../../../entities/bosses/BossHazards';
import type { BossWorld } from '../../../../entities/bosses/HunterDrone';
import { Kevin } from '../../../../entities/bosses/kevin/Kevin';
import type { TechDoor } from '../../../../entities/tech/TechDoor';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { chance } from '../../../../systems/Pacing';
import { music } from '../../../../systems/audio/Music';
import { playSfx } from '../../../../systems/audio/Sfx';
import { TEX } from '../../../preload/assetKeys';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { KevinActor } from './KevinActor';
import { TURN_AFTER, TURN_LINES } from './lines';

export interface TurnSpec {
  triggerX: number;
  fromX: number;
  toX: number;
  floor: number;
  kevinX: number;
  exitX: number;
}

type Phase = 'wait' | 'talk' | 'grab' | 'steal' | 'fight' | 'restore' | 'flee' | 'done';

/**
 * The turn, in the substation. Kevin finally asks for the watch, then takes
 * what he can: he grabs Ben and absorbs whatever alien he is (a human Ben's
 * watch goes off in the surge). Ben reverts, that alien's slot on the dial
 * goes dark (DNA STOLEN), and Kevin becomes a twisted purple copy of it.
 * The watch recharges, so there's always something else to switch to. Beat
 * the copy and the DNA blows back into the watch; Kevin, overloaded, shorts
 * out the shutter and flees down the tunnel.
 */
export class TheTurn implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private stolen: string | null = null;
  private boss: Kevin | null = null;
  private hazards: BossHazards | null = null;
  private readonly walls: Phaser.Physics.Arcade.Image[] = [];
  private readonly wallSprites: Phaser.GameObjects.Sprite[] = [];
  private readonly floorY: number;
  private readonly steps = new Set<string>();

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: TurnSpec,
    private readonly actor: KevinActor,
    resumeX: number,
  ) {
    this.floorY = spec.floor * TILE;
    if (resumeX > spec.toX * TILE) {
      this.phase = 'done';
      this.door()?.openNow(null, PALETTE.kevin);
    }
  }

  get cinematic(): boolean {
    return this.phase === 'talk' || this.phase === 'grab' || this.phase === 'steal' || this.phase === 'flee';
  }

  get storyLock(): boolean {
    return this.phase !== 'wait' && this.phase !== 'fight' && this.phase !== 'done';
  }

  update(dtMs: number, realDtMs: number, _controls: Controls): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    for (const s of this.wallSprites) if (s.visible) kit.lighting.add(s.x, s.y, 30, PALETTE.kevin, 0.5);
    if (this.phase === 'wait') {
      // Kevin waits in the substation, drinking from the transformers.
      if (this.actor.mode === 'hidden' && p.x > (this.spec.fromX - 14) * TILE) {
        this.actor.place(this.spec.kevinX * TILE, this.floorY, 'scripted');
        this.actor.face(-1);
        this.actor.drink(this.actor.x + 30, this.floorY - 40, 99999);
      }
      if (p.x < this.spec.triggerX * TILE || p.dead || !p.grounded) return;
      this.begin();
      return;
    }
    this.t += realDtMs;
    if (this.phase === 'fight') {
      this.boss?.update(dtMs);
      this.hazards?.update(dtMs, kit.now());
      return;
    }
    if (this.phase === 'grab') this.updateGrab();
    else if (this.phase === 'steal' && this.t >= TURN.transformMs) this.startFight();
  }

  private begin(): void {
    const kit = this.kit;
    this.phase = 'talk';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.player.setInvulnerable(20000);
    kit.setLetterbox(true);
    this.raiseWalls();
    music.stop(600);
    if (this.actor.mode === 'hidden') this.actor.place(this.spec.kevinX * TILE, this.floorY, 'scripted');
    this.actor.drink(this.actor.x + 30, this.floorY - 40, 600);
    this.actor.faceBen();
    kit.camera.lockTo(((this.spec.fromX + this.spec.toX) / 2) * TILE, this.floorY - 60);
    kit.dialogue.play(TURN_LINES, { skippable: true, onDone: () => this.grab() });
  }

  /** He lunges and grabs Ben by the wrist. */
  private grab(): void {
    if (this.phase !== 'talk') return;
    this.phase = 'grab';
    this.t = 0;
    const kit = this.kit;
    const p = kit.player;
    const side = this.actor.x > p.x ? 1 : -1;
    this.actor.pose('lunge');
    this.actor.hopTo(p.x + side * 14, this.floorY, 260, () => {
      this.actor.face(side > 0 ? -1 : 1);
      this.actor.drink(p.x, p.centerY, TURN.absorbMs);
      this.steps.add('caught');
      this.t = 0;
      playSfx('grab', 1, 0.8);
      kit.fx.shake(0.01, 300);
      // A human Ben's watch goes off in the surge.
      if (!p.isAlien) {
        const o = kit.omni.omnitrix;
        const pick = o.selectedAlien && !o.isBlocked(o.selectedAlien) ? o.selectedAlien : o.unlockedAliens.find((id) => !o.isBlocked(id));
        if (pick) kit.omni.forceInto(pick);
      }
    });
  }

  private updateGrab(): void {
    const kit = this.kit;
    const p = kit.player;
    if (!this.steps.has('caught')) return;
    p.glow(PALETTE.kevin, Math.min(1, this.t / TURN.absorbMs));
    if (chance(0.5)) kit.fx.burst('volt', p.x, p.centerY, 2);
    if (this.t < TURN.absorbMs) return;
    p.glow(PALETTE.kevin, 0);
    this.steal();
  }

  /** The DNA goes: Ben reverts, the slot goes dark, Kevin becomes the copy. */
  private steal(): void {
    const kit = this.kit;
    const p = kit.player;
    this.phase = 'steal';
    this.t = 0;
    const form = p.form.id;
    this.stolen = hasAlien(form) ? form : null;
    kit.omni.forceRevert('forced');
    if (this.stolen) {
      kit.omni.steal(this.stolen, true);
      this.actor.look.copy(this.stolen);
      kit.fx.popText(p.x, p.y - 46, 'DNA STOLEN!', PALETTE.kevin, 1.3);
    }
    kit.omni.recharge();
    playSfx('absorb', 1, 0.7);
    playSfx('omnitrixGlitch', 0.9);
    kit.fx.flash(this.actor.x, this.floorY - 20, PALETTE.kevin, 60, 400);
    kit.fx.burst('volt', this.actor.x, this.floorY - 20, 30);
    kit.fx.shake(0.014, 400);
    // Knocked back a step.
    p.setVelocityX(this.actor.x > p.x ? -160 : 160);
    this.actor.pose('laugh');
  }

  private startFight(): void {
    const kit = this.kit;
    this.phase = 'fight';
    const S = this.spec;
    const hazards = new BossHazards(kit.scene, this.floorY, kit.fx, kit.lighting, kit.telegraph);
    this.hazards = hazards;
    for (const h of hazards.all()) kit.combat.addHazard(h);
    const self = this;
    const world: BossWorld = {
      get now() {
        return self.kit.now();
      },
      fx: kit.fx,
      lighting: kit.lighting,
      telegraph: kit.telegraph,
      projectiles: kit.projectiles,
      hazards,
      time: kit.time,
      player: kit.player,
      arena: { left: S.fromX * TILE + 8, right: S.toX * TILE - 8, floorY: this.floorY, top: this.floorY - 16 * TILE },
      spawnAdd: () => undefined,
      aliveAdds: () => 0,
      dropPickup: () => undefined,
      onPhase2: () => undefined,
      onHealth: (ratio, phase) => EventBus.emit('boss:health', { ratio, phase }),
      onDefeated: () => this.restore(),
      threat: (at) => kit.threat(this, at),
      cancelThreat: () => kit.cancelThreat(this),
      tip: (id, text, ms) => kit.tutorial.tip(id, text, ms, 8),
      playerForm: () => kit.player.form.id,
      drainAlienTime: (ms) => kit.omni.drain(ms),
    };
    const boss = new Kevin(kit.scene, world, this.actor.x, this.stolen ? { stolen: this.stolen } : { stolen: 'heatblast' });
    this.boss = boss;
    kit.combat.addTarget(boss);
    kit.combat.addHazard(boss);
    for (const h of boss.extraHazards) kit.combat.addHazard(h);
    this.actor.hide();
    this.actor.look.human();
    EventBus.emit('boss:show', { name: boss.name, subtitle: boss.subtitle });
    EventBus.emit('boss:health', { ratio: 1, phase: 0 });
    kit.playMusic('kevin');
    kit.setLetterbox(false);
    kit.camera.unlock();
    kit.player.controlsEnabled = true;
    kit.player.setInvulnerable(800);
    const name = this.stolen ? getAlien(this.stolen).name : 'YOUR ALIEN';
    kit.tutorial.tip('turn-switch', `HE STOLE ${name}! FIGHT HIM WITH ANOTHER ALIEN: {T}`, 6000, 9);
  }

  /** Beaten: the DNA blows back into the watch. */
  private restore(): void {
    if (this.phase !== 'fight' || !this.boss) return;
    const kit = this.kit;
    this.phase = 'restore';
    this.t = 0;
    const at = this.boss.handOff();
    this.hazards?.clear();
    EventBus.emit('boss:hide');
    this.actor.place(at.x, this.floorY, 'scripted');
    this.actor.face(at.facing);
    this.actor.pose('hurt');
    this.actor.glow = 1;
    const p = kit.player;
    for (let i = 0; i < 4; i++) kit.scene.time.delayedCall(i * 90, () => kit.fx.beam(at.x, this.floorY - 20, p.x, p.centerY, i % 2 ? PALETTE.omnitrix : PALETTE.white, 3, 160));
    kit.scene.time.delayedCall(400, () => {
      if (this.stolen) kit.omni.steal(this.stolen, false);
      kit.fx.ring(p.x, p.centerY, PALETTE.omnitrix, 60, 500);
      kit.fx.burst('green', p.x, p.centerY, 24);
      kit.fx.popText(p.x, p.y - 46, 'DNA RESTORED!', PALETTE.omnitrix, 1.2);
      playSfx('unlock', 0.9);
    });
    kit.time.slowMo(0.3, 700, 300);
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.player.setInvulnerable(8000);
    kit.setLetterbox(true);
    music.stop(500);
    kit.scene.time.delayedCall(TURN.restoreMs, () => kit.dialogue.play(TURN_AFTER, { skippable: true, onDone: () => this.flee() }));
  }

  /** Crackling and furious, he shorts out the shutter and runs. */
  private flee(): void {
    if (this.phase !== 'restore') return;
    this.phase = 'flee';
    const kit = this.kit;
    const doorX = (this.spec.exitX - 3) * TILE;
    this.actor.runTo(doorX, 220, () => {
      this.actor.face(1);
      this.actor.pose('lunge');
      this.door()?.openNow('OVERLOADED!', PALETTE.kevin);
      kit.fx.burst('volt', doorX + 20, this.floorY - 24, 20);
      playSfx('powerSurge', 0.8, 1.2);
      kit.scene.time.delayedCall(450, () =>
        this.actor.runTo((this.spec.exitX + 8) * TILE, 240, () => {
          this.actor.hide();
          this.end();
        }),
      );
    });
  }

  private end(): void {
    const kit = this.kit;
    this.phase = 'done';
    this.lowerWalls();
    kit.setLetterbox(false);
    kit.player.controlsEnabled = true;
    kit.player.setInvulnerable(600);
    kit.playMusic('subway');
    kit.speech.show("KEVIN! ...GREAT. NOW HE'S A SUPERVILLAIN.", 2200);
  }

  private raiseWalls(): void {
    const kit = this.kit;
    const top = this.floorY - 14 * TILE;
    for (const x of [this.spec.fromX * TILE + 4, this.spec.toX * TILE - 4]) {
      const wall = kit.scene.physics.add.staticImage(x, (top + this.floorY) / 2, TEX.whitePx).setVisible(false);
      wall.setDisplaySize(8, this.floorY - top).refreshBody();
      kit.scene.physics.add.collider(kit.player.zone, wall);
      this.walls.push(wall);
      for (let y = top; y < this.floorY; y += TILE) {
        const s = kit.scene.add.sprite(x, y + 8, TEX.arenaWall, 0).setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD).setTint(PALETTE.kevin).play('arena-hum');
        s.setScale(1, 0);
        kit.scene.tweens.add({ targets: s, scaleY: 1, duration: 300, delay: (this.floorY - y) * 2 });
        this.wallSprites.push(s);
      }
    }
    playSfx('gateDown', 0.8, 1.3);
  }

  private lowerWalls(): void {
    for (const w of this.walls) w.disableBody(true, true);
    for (const s of this.wallSprites) s.setVisible(false);
  }

  private door(): TechDoor | undefined {
    const e = this.kit.level.entities.find((en) => en.type === 'techDoor' && en.x >= this.spec.toX - 1 && en.x <= this.spec.exitX);
    return e && e.type === 'techDoor' ? (this.kit.machine(e.id) as TechDoor | undefined) : undefined;
  }

  destroy(): void {
    if (this.phase === 'fight') EventBus.emit('boss:hide');
    for (const w of this.walls) w.destroy();
    for (const s of this.wallSprites) s.destroy();
  }
}
