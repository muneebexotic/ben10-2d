import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { CH5_BEATS, TETRAX } from '../../../../config/hunters';
import { MISFIRE } from '../../../../config/omnitrix';
import { PALETTE } from '../../../../config/palette';
import { TELL } from '../../../../config/tells';
import { KraabFighter } from '../../../../entities/hunters/KraabFighter';
import { HunterLook } from '../../../../entities/hunters/HunterLook';
import { pickForcedMisfire } from '../../../../entities/hunters/huntRules';
import type { Rect } from '../../../../entities/types';
import type { BountyPlan } from '../../../../levels/types';
import { blinkOn } from '../../../../systems/Accessibility';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { brakeScreech, glint, liftRattle, shardVolley, sixsixLaugh } from '../../../../systems/audio/bountySfx';
import { TEX } from '../../../preload/assetKeys';
import type { SetPiece, StoryKit } from '../StoryKit';
import { kitWorld } from './kitWorld';
import { LIFT_CORNERED, LIFT_DUD, LIFT_PROMPT, LIFT_SURVIVED } from './lines';

type Phase = 'wait' | 'rise' | 'cornered' | 'pick' | 'survive' | 'drop' | 'done';
type Attack = 'volley' | 'salvo' | 'claw';

/** How long the watch waits for Ben to pick before it goes off on its own (ms). */
const PICK_TIMEOUT_MS = 3500;
/** The hunters' attacks while he survives: one every so often, in turn. */
const ATTACK_EVERY_MS = 2300;
const ATTACKS: readonly Attack[] = ['volley', 'salvo', 'claw'];
const DEG = Math.PI / 180;

/**
 * The lift (GAME_DESIGN.md Chapter 5, beat 8). Ben rides the mine lift up
 * the shaft; it jams halfway and all three hunters corner him on the deck.
 * The volley is coming; he reaches for the obvious alien... and the watch,
 * by the story's one named exception (`ch5-lift` in FORCED_MISFIRES),
 * misfires anyway. Fifteen seconds to survive the wrong alien (the fix swap
 * is held back), a pair of crab-bots dropping in for an IMPROVISED! KO,
 * then Kraab snaps the chain: the deck drops, and he bursts through the
 * shaft wall into the chamber where THE HUNTERS begins.
 */
export class LiftAmbush implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly rect: Rect;
  private readonly body: Phaser.Physics.Arcade.Image;
  private readonly deck: Phaser.GameObjects.TileSprite;
  private readonly chains: Phaser.GameObjects.Graphics;
  private readonly kraab: KraabFighter;
  private readonly sixsix: HunterLook;
  private readonly tetrax: HunterLook;
  private readonly bottomY: number;
  private readonly stopY: number;
  private rattleIn = 0;
  private attackIn = 0;
  private attackIndex = 0;
  private attack: { kind: Attack; t: number; aim: number } | null = null;
  private hpAtMisfire = 0;
  private crabsIn = 0;
  private vy = 0;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: BountyPlan['lift'],
    private readonly wall: BountyPlan['hunters']['wall'],
    resumeX: number,
  ) {
    this.bottomY = spec.bottom * TILE;
    this.stopY = spec.stop * TILE;
    // The deck sits flush with the floor (sunk into it), so Ben walks straight on.
    this.rect = { x: spec.x * TILE, y: this.bottomY, w: spec.w * TILE, h: 10 };
    const r = this.rect;
    this.chains = kit.scene.add.graphics().setDepth(DEPTH.terrain - 1);
    this.deck = kit.scene.add.tileSprite(r.x, r.y, r.w, 10, TEX.liftDeck).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
    this.body = kit.scene.physics.add.staticImage(r.x + r.w / 2, r.y + r.h / 2, TEX.whitePx).setVisible(false);
    this.body.setDisplaySize(r.w, r.h).refreshBody();
    kit.scene.physics.add.collider(kit.player.zone, this.body);
    kit.world.addSolid(this.rect);
    const w = kitWorld(kit);
    this.kraab = new KraabFighter(kit.scene, w);
    this.sixsix = new HunterLook(kit.scene, 'sixsix', DEPTH.boss);
    this.tetrax = new HunterLook(kit.scene, 'tetrax', DEPTH.boss);
    this.sixsix.setVisible(false);
    this.tetrax.setVisible(false);
    if (resumeX >= spec.x * TILE) {
      // Already past it: the deck lies crashed at the bottom and the wall into the chamber is down.
      this.phase = 'done';
      this.deck.setAngle(2);
      kit.collapse(wall);
    }
    if (this.phase !== 'done') this.drawChains(true);
  }

  get cinematic(): boolean {
    return this.phase === 'rise' || this.phase === 'cornered' || this.phase === 'drop';
  }

  get storyLock(): boolean {
    return this.phase !== 'wait' && this.phase !== 'done';
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.kraab.update(realDtMs);
    this.sixsix.render(realDtMs);
    this.tetrax.render(realDtMs);
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    this.t += realDtMs;
    switch (this.phase) {
      case 'wait':
        if (!p.dead && p.grounded && p.x > this.rect.x + 8 && p.x < this.rect.x + this.rect.w - 8 && Math.abs(p.y - this.rect.y) < 4) this.startRise();
        return;
      case 'rise': {
        const k = Math.min(1, this.t / CH5_BEATS.lift.riseMs);
        this.moveDeck(Phaser.Math.Linear(this.bottomY, this.stopY, Phaser.Math.Easing.Sine.InOut(k)));
        this.rattleIn -= realDtMs;
        if (this.rattleIn <= 0) {
          this.rattleIn = 700;
          playSfx(liftRattle, 0.6);
        }
        if (k >= 1) this.jam();
        return;
      }
      case 'pick':
        this.drawVolleyTell(Math.min(1, this.t / PICK_TIMEOUT_MS));
        if (this.t >= PICK_TIMEOUT_MS) this.misfire(kit.omni.omnitrix.selectedAlien ?? 'diamondhead');
        return;
      case 'survive':
        this.updateSurvive(realDtMs);
        return;
      case 'drop': {
        this.vy = Math.min(900, this.vy + 1600 * (realDtMs / 1000));
        const y = Math.min(this.bottomY, this.rect.y + this.vy * (realDtMs / 1000));
        this.moveDeck(y);
        this.kraab.look.feetY = y;
        this.tetrax.feetY = y;
        if (y >= this.bottomY) this.crash();
        return;
      }
      default:
        return;
    }
  }

  private moveDeck(y: number): void {
    const r = this.rect;
    r.y = y;
    this.deck.setY(y);
    this.body.setPosition(r.x + r.w / 2, r.y + r.h / 2).refreshBody();
    this.drawChains(false);
  }

  /** Two chains from the deck up into the dark. */
  private drawChains(force: boolean): void {
    if (!force && this.phase === 'done') return;
    const g = this.chains;
    const r = this.rect;
    g.clear();
    if (this.phase === 'done' && !force) return;
    g.lineStyle(2, 0x6a6a7a, 1);
    for (const x of [r.x + 10, r.x + r.w - 10]) {
      for (let y = r.y; y > r.y - 26 * TILE; y -= 6) g.lineBetween(x, y, x + (Math.floor(y / 6) % 2 === 0 ? 1 : -1), y - 4);
    }
  }

  private startRise(): void {
    const kit = this.kit;
    this.phase = 'rise';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.setLetterbox(true);
    kit.speech.show('GOING UP!', 1200);
    playSfx('clamp', 0.8);
  }

  private jam(): void {
    const kit = this.kit;
    this.phase = 'cornered';
    this.t = 0;
    kit.fx.shake(0.012, 300);
    playSfx(brakeScreech, 1);
    // All three, from three sides.
    const y = this.rect.y;
    this.kraab.stand(this.rect.x + 14, y, 'idle', 1);
    kit.fx.burst('debris', this.kraab.x, y, 14);
    this.tetrax.place(this.rect.x + this.rect.w - 12, y);
    this.tetrax.face(-1);
    this.tetrax.setVisible(true);
    this.tetrax.play('idle');
    kit.fx.burst('crystal', this.tetrax.x, y - 26, 20);
    this.sixsix.place(kit.player.x, y - 92);
    this.sixsix.setVisible(true);
    this.sixsix.play('fly');
    kit.camera.lockTo(this.rect.x + this.rect.w / 2, y - 60);
    kit.dialogue.play(LIFT_CORNERED, { skippable: true, onDone: () => this.startPick() });
  }

  private startPick(): void {
    const kit = this.kit;
    this.phase = 'pick';
    this.t = 0;
    kit.setLetterbox(false);
    kit.player.controlsEnabled = true;
    // Whatever Ben is now, the watch is ready for the obvious answer.
    if (kit.player.isAlien) kit.omni.forceRevert('jammed');
    kit.omni.recharge();
    kit.tutorial.tip('lift-pick', LIFT_PROMPT, PICK_TIMEOUT_MS, 9);
    kit.omni.interceptTransform = (wanted) => {
      this.misfire(wanted);
      return true;
    };
    this.tetrax.play('glint');
    this.kraab.chargeAt(kit.player.x, kit.player.centerY);
    playSfx(glint, 0.9);
  }

  /** Everything's aimed at him: the glint, the claw's charge, the paint. */
  private drawVolleyTell(k: number): void {
    const kit = this.kit;
    const p = kit.player;
    this.kraab.aimAt(p.x, p.centerY);
    this.kraab.drawCharge(k);
    kit.telegraph.reticle(p.x, p.centerY, TELL.sixsix, 1.6 - k * 0.6, this.t * 0.006, 0.4 + k * 0.6);
    kit.lighting.add(this.tetrax.x + this.tetrax.facing * 14, this.tetrax.feetY - 36, 10 + k * 24, 0xffffff, blinkOn(this.t, 90) ? 1 : 0.6);
  }

  private misfire(wanted: string): void {
    const kit = this.kit;
    if (this.phase !== 'pick') return;
    kit.omni.interceptTransform = null;
    const dial = kit.omni.omnitrix.unlockedAliens;
    const got = pickForcedMisfire(wanted, dial);
    const asked = dial.includes(wanted) ? wanted : (dial[0] ?? wanted);
    this.hpAtMisfire = kit.player.hp + kit.player.formHp;
    if (got) kit.omni.forceMisfire('ch5-lift', asked, got, CH5_BEATS.lift.surviveMs);
    this.phase = 'survive';
    this.t = 0;
    this.attackIn = CH5_BEATS.lift.volleyAt + 1400;
    this.crabsIn = 3200;
    this.kraab.look.play('idle');
    this.tetrax.play('idle');
    // The hunters' jeers wait for the misfire card to clear.
    kit.scene.time.delayedCall(MISFIRE.cardMs + 400, () => {
      if (this.phase !== 'survive') return;
      kit.dialogue.play(LIFT_DUD);
      playSfx(sixsixLaugh, 1);
    });
  }

  private updateSurvive(dtMs: number): void {
    const kit = this.kit;
    const p = kit.player;
    // Sixsix hovers over Ben.
    this.sixsix.x += (p.x - this.sixsix.x) * Math.min(1, dtMs * 0.003);
    this.sixsix.feetY = this.rect.y - 92 + Math.sin(this.t * 0.004) * 6;
    this.sixsix.face(p.x - this.sixsix.x);
    if (this.crabsIn > 0) {
      this.crabsIn -= dtMs;
      if (this.crabsIn <= 0) {
        // A pair of crab-bots drops off the shaft wall: something to KO with the wrong alien.
        for (const dx of [-30, 30]) kit.spawnDrone('crabbot', this.rect.x + this.rect.w / 2 + dx, this.rect.y - 40, { delayMs: 900 });
      }
    }
    this.attackIn -= dtMs;
    if (!this.attack && this.attackIn <= 0 && this.t < CH5_BEATS.lift.surviveMs - 1500) {
      this.attack = { kind: ATTACKS[this.attackIndex++ % ATTACKS.length], t: 0, aim: 0 };
      this.attackIn = ATTACK_EVERY_MS;
      this.beginAttack();
    }
    if (this.attack) this.updateAttack(dtMs);
    // The hold on the fix swap shows as a countdown over Ben.
    const left = Math.ceil((CH5_BEATS.lift.surviveMs - this.t) / 1000);
    if (left >= 1 && Math.floor((this.t - dtMs) / 1000) !== Math.floor(this.t / 1000)) kit.fx.popText(p.x, p.y - 56, String(left), PALETTE.white);
    if (this.t >= CH5_BEATS.lift.surviveMs) this.chainSnaps();
  }

  private beginAttack(): void {
    const a = this.attack!;
    const kit = this.kit;
    if (a.kind === 'volley') {
      this.tetrax.play('glint');
      playSfx(glint, 0.9);
    } else if (a.kind === 'salvo') {
      kit.hazards?.salvo(kit.player.x, this.rect.y, 3, 30, 950);
      this.attack = null;
    } else {
      this.kraab.chargeAt(kit.player.x, kit.player.centerY);
    }
  }

  private updateAttack(dtMs: number): void {
    const a = this.attack!;
    const kit = this.kit;
    const p = kit.player;
    a.t += dtMs;
    if (a.kind === 'volley') {
      const ox = this.tetrax.x - 8;
      const oy = this.tetrax.feetY - 34;
      if (a.t < TETRAX.glintMs - 200) a.aim = Math.atan2(p.centerY - oy, p.x - ox);
      const k = a.t / TETRAX.glintMs;
      for (let i = -1; i <= 1; i++) {
        const ang = a.aim + i * TETRAX.volley.fanDeg * DEG;
        kit.telegraph.dashed(ox, oy, ox + Math.cos(ang) * 200, oy + Math.sin(ang) * 200, TELL.tetrax, 0.2 + k * 0.6, a.t * 0.05, 1);
      }
      if (a.t >= TETRAX.glintMs) {
        for (let i = -1; i <= 1; i++) {
          const ang = a.aim + i * TETRAX.volley.fanDeg * DEG;
          kit.projectiles.spawn('shard', 'enemy', ox, oy, Math.cos(ang) * TETRAX.volley.speed, Math.sin(ang) * TETRAX.volley.speed, TETRAX.volley.damage, 1800, 4, { tint: 0x9ab8ff });
        }
        playSfx(shardVolley, 1);
        this.tetrax.play('volley');
        this.attack = null;
      }
      return;
    }
    // The claw.
    const ms = 1300;
    if (a.t < ms - 250) this.kraab.aimAt(p.x, p.centerY);
    this.kraab.drawCharge(Math.min(1, a.t / ms));
    if (a.t >= ms) {
      this.kraab.fireNow();
      this.attack = null;
    }
  }

  private chainSnaps(): void {
    const kit = this.kit;
    this.phase = 'drop';
    this.t = 0;
    this.vy = 0;
    this.attack = null;
    kit.player.setInvulnerable(2500);
    kit.speech.show(LIFT_SURVIVED, 1800);
    if (kit.player.hp + kit.player.formHp >= this.hpAtMisfire) kit.achievement('clutch-misfire');
    // Kraab snaps the chain; Sixsix and Tetrax leave the deck to it.
    this.kraab.look.play('guard');
    playSfx('clang', 1, 0.7);
    kit.fx.burst('spark', this.rect.x + 10, this.rect.y - 40, 14);
    this.sixsix.play('fly');
    kit.scene.tweens.add({ targets: this.sixsix, feetY: this.sixsix.feetY - 260, duration: 900, ease: 'Quad.easeIn', onComplete: () => this.sixsix.setVisible(false) });
    kit.fx.burst('crystal', this.tetrax.x, this.tetrax.feetY - 26, 20);
    this.tetrax.setVisible(false);
  }

  private crash(): void {
    const kit = this.kit;
    this.phase = 'done';
    this.chains.clear();
    this.deck.setAngle(2);
    kit.fx.shake(0.02, 450);
    kit.fx.burst('dust', this.rect.x + this.rect.w / 2, this.bottomY, 30);
    kit.fx.burst('debris', this.rect.x + this.rect.w / 2, this.bottomY, 20);
    playSfx('explode', 1, 0.6);
    // Kraab rides it down and smashes through the wall into the chamber.
    kit.collapse(this.wall);
    const wx = (this.wall.x + this.wall.w / 2) * TILE;
    kit.fx.burst('debris', wx, this.bottomY - 40, 30);
    this.kraab.look.play('charge');
    kit.scene.tweens.add({ targets: this.kraab.look, x: wx + 60, duration: 500, onComplete: () => this.kraab.hide() });
    kit.reachCheckpoint(this.spec.checkpoint);
    kit.camera.unlock();
  }

  destroy(): void {
    if (this.kit.omni.interceptTransform) this.kit.omni.interceptTransform = null;
    this.kraab.destroy();
    this.sixsix.destroy();
    this.tetrax.destroy();
    this.chains.destroy();
    this.deck.destroy();
  }
}
