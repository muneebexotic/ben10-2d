import { TILE } from '../../../../config/constants';
import { CH5_BEATS } from '../../../../config/hunters';
import { PALETTE } from '../../../../config/palette';
import { KraabFighter } from '../../../../entities/hunters/KraabFighter';
import { TetraxFighter } from '../../../../entities/hunters/TetraxFighter';
import type { Projectile } from '../../../../entities/Projectiles';
import type { BountyPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { burrow, crystalBreak, erupt } from '../../../../systems/audio/bountySfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { kitWorld } from './kitWorld';
import { CAVERN_ARRIVAL, CAVERN_HINT, CAVERN_MISSED, CAVERN_REFLECTED } from './lines';

type Phase = 'wait' | 'arrive' | 'unlock' | 'charge' | 'flying' | 'gone' | 'done';

/** Tries before Kraab gives up and leaves anyway (the story never stalls on a missed shield). */
const MAX_TRIES = 3;

/**
 * The bottom of the Diamond Deep. Ben lands in the crystal cavern between
 * Kraab, charging his claw cannon on the broken trestle, and Tetrax, blocking
 * the way out. The watch reads the crystals: Diamondhead. Kraab fires; held
 * up facing him, the crystal shield sends the blast straight back
 * (REFLECTED!) and blows Kraab off the trestle. Tetrax notices.
 */
export class CrystalCave implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private tries = 0;
  private readonly kraab: KraabFighter;
  private readonly tetrax: TetraxFighter;
  private shot: Projectile | null = null;
  private readonly floorY: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: BountyPlan['crystal'],
    private readonly landX: number,
    private readonly beat: UnlockBeat | null,
    resumeX: number,
    /** The ride down is over (Ben waits out THE DEEP DIVE standing right here). */
    private readonly ready: () => boolean,
  ) {
    this.floorY = spec.floor * TILE;
    const w = kitWorld(kit);
    this.kraab = new KraabFighter(kit.scene, w);
    this.tetrax = new TetraxFighter(kit.scene, w);
    if (resumeX > spec.tetraxX * TILE) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'arrive';
  }

  get storyLock(): boolean {
    return this.phase === 'arrive' || this.phase === 'unlock';
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.kraab.update(realDtMs);
    this.tetrax.update(realDtMs);
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    this.t += realDtMs;
    switch (this.phase) {
      case 'wait':
        if (this.ready() && !p.dead && p.x >= (this.landX - 4) * TILE && p.y >= this.floorY - TILE * 4 && p.grounded) this.arrive();
        return;
      case 'charge': {
        const ms = CH5_BEATS.crystal.chargeMs;
        const k = Math.min(1, this.t / ms);
        if (this.t < ms - 300) this.kraab.aimAt(p.x, p.centerY);
        this.kraab.drawCharge(k);
        if (this.t >= ms) {
          this.shot = this.kraab.fireNow();
          this.phase = 'flying';
          this.t = 0;
        }
        return;
      }
      case 'flying':
        this.watchShot();
        return;
      default:
        return;
    }
  }

  private arrive(): void {
    const kit = this.kit;
    this.phase = 'arrive';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.setLetterbox(true);
    const kx = this.spec.kraabX * TILE;
    const ky = this.spec.kraabY * TILE;
    this.kraab.stand(kx, ky, 'erupt', 1);
    kit.fx.burst('debris', kx, ky, 18);
    kit.fx.shake(0.01, 240);
    playSfx(erupt, 1);
    const tx = this.spec.tetraxX * TILE;
    this.tetrax.stand(tx, this.floorY, 'idle', -1);
    kit.fx.burst('crystal', tx, this.floorY - 26, 24);
    kit.fx.ring(tx, this.floorY - 26, PALETTE.tetrax, 40, 400);
    playSfx(crystalBreak, 0.7, 1.3);
    kit.camera.lockTo((kx + tx) / 2, this.floorY - 70);
    kit.dialogue.play(CAVERN_ARRIVAL, { skippable: true, onDone: () => this.unlock() });
  }

  private unlock(): void {
    const kit = this.kit;
    this.phase = 'unlock';
    kit.camera.unlock();
    kit.setLetterbox(false);
    this.kraab.look.play('idle');
    const standoff = () => {
      kit.player.controlsEnabled = true;
      this.startCharge();
    };
    if (this.beat && !this.beat.done) this.beat.start(standoff);
    else {
      // A replay (a retry from the cavern): the watch reads the crystals again, so the standoff's
      // answer is in hand rather than a human Ben told to hold a shield he hasn't got.
      if (kit.player.form.id !== 'diamondhead') kit.omni.forceInto('diamondhead');
      standoff();
    }
  }

  private startCharge(): void {
    this.phase = 'charge';
    this.t = 0;
    this.tries++;
    const p = this.kit.player;
    this.kraab.chargeAt(p.x, p.centerY);
    this.kit.tutorial.tip('shield-reflect', CAVERN_HINT, CH5_BEATS.crystal.chargeMs + 1500, 9);
  }

  /** The blast either comes back at Kraab (the shield) or ends on something else. */
  private watchShot(): void {
    const kit = this.kit;
    const s = this.shot;
    if (!s) return;
    if (s.active && s.team === 'player') {
      // Coming back his way: it lands on him (he doesn't get out of the way in time).
      const dx = s.x - this.kraab.x;
      const dy = s.y - (this.kraab.y - 24);
      if (dx * dx + dy * dy < 34 * 34 || this.t > 1600) {
        kit.projectiles.kill(s, true);
        this.shot = null;
        this.reflected();
      }
      return;
    }
    if (s.active) return;
    this.shot = null;
    if (this.tries >= MAX_TRIES) {
      this.giveUp();
      return;
    }
    kit.speech.show(kit.player.form.id === 'diamondhead' ? CAVERN_MISSED[Math.min(this.tries - 1, CAVERN_MISSED.length - 1)] : 'OW! HE\'S CHARGING AGAIN!', 1800);
    this.startCharge();
  }

  private reflected(): void {
    const kit = this.kit;
    const kx = this.kraab.x;
    const ky = this.kraab.y;
    kit.tutorial.complete('shield-reflect');
    kit.fx.explosion(kx, ky - 20, 'big');
    kit.fx.popText(kx, ky - 64, 'REFLECTED!', PALETTE.diamondhead, 2);
    kit.fx.hitStop(110);
    kit.time.slowMo(0.3, 700, 300);
    kit.fx.shake(0.014, 320);
    this.kraab.look.play('hurt');
    // Blown off the trestle; he digs out the far side of the cavern.
    kit.scene.tweens.add({
      targets: this.kraab.look,
      x: kx - 40,
      feetY: this.floorY,
      duration: 650,
      ease: 'Quad.easeIn',
      onComplete: () => this.burrowAway(),
    });
    kit.dialogue.play(CAVERN_REFLECTED, { onDone: () => this.tetraxLeaves() });
  }

  private burrowAway(): void {
    this.kraab.look.play('burrow');
    this.kit.fx.burst('dust', this.kraab.x, this.floorY, 16);
    playSfx(burrow, 0.9);
    this.kit.scene.time.delayedCall(450, () => this.kraab.hide());
  }

  private giveUp(): void {
    this.kit.dialogue.play([{ who: 'kraab', text: "BAH! YOU'LL KEEP, BOY!", ms: 1600 }, { who: 'tetrax', text: '...', ms: 1000 }], { onDone: () => this.tetraxLeaves() });
    this.burrowAway();
  }

  private tetraxLeaves(): void {
    const kit = this.kit;
    const x = this.tetrax.x;
    kit.fx.burst('crystal', x, this.floorY - 26, 26);
    kit.fx.ring(x, this.floorY - 26, PALETTE.tetrax, 44, 400);
    playSfx(crystalBreak, 0.7, 1.4);
    this.tetrax.hide();
    this.phase = 'done';
    kit.tutorial.tip('platform', '{UP}+{K}: GROW A CRYSTAL PLATFORM!', 5000, 7);
  }

  destroy(): void {
    this.kraab.destroy();
    this.tetrax.destroy();
  }
}
