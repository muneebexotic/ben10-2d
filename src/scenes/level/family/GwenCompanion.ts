import Phaser from 'phaser';
import { DEPTH, FX } from '../../../config/constants';
import { GWEN, SPELL_ORDER, type SpellId } from '../../../config/gwen';
import { PALETTE } from '../../../config/palette';
import { TOUCH } from '../../../config/touch';
import { blinkOn } from '../../../systems/Accessibility';
import { EventBus } from '../../../systems/EventBus';
import { GwenSpells } from '../../../systems/GwenSpells';
import type { Controls } from '../../../systems/InputMap';
import { touchControlsOn } from '../../../systems/Settings';
import { playSfx } from '../../../systems/audio/Sfx';
import { TEX } from '../../preload/assetKeys';
import { GWEN_FRAME, GWEN_FRAMES } from '../../preload/family';
import type { StoryKit } from '../story/StoryKit';
import { FamilyActor } from './FamilyActor';
import { GWEN_SFX } from './gwenAudio';
import { GWEN_CAST_LINES, GWEN_CHATTER, GWEN_NOT_READY, GWEN_UNKNOWN } from './gwenLines';

interface Crumb {
  x: number;
  y: number;
}

export interface GwenOptions {
  /** Spells she already knows (the file's). */
  known: readonly SpellId[];
  /** Her idle banter (a chapter's own, or the generic lines). */
  chatter?: readonly string[];
  /** A spell went off (achievements). */
  onCast?: (spell: SpellId) => void;
  /** She learned a spell (the file saves it). */
  onLearn?: (spell: SpellId) => void;
  /** Her running speed (px/s) when a chapter sets its own (drawn frame by frame, her feet keep pace up to this); she pops back in when far behind. */
  runSpeed?: number;
}

const STATE_EVERY_MS = 100;

/**
 * Gwen at Ben's side: she follows his trail (hopping where he jumped), throws
 * a small mana bolt now and then, and casts the spell the player calls with
 * {G}: SHIELD (a bubble that pops shots and eats one hit), STUN (Up+G: a
 * burst that freezes everything near Ben) and REVEAL (Down+G: Ben sees
 * hidden things for a while, like Wildmutt does).
 *
 * Support, never a second protagonist: she stands behind Ben, goes
 * see-through when she's in front of him or under the touch controls, and
 * enemies ignore her. Set pieces borrow her `actor` (`scripted`) and hand
 * her back with `join()`.
 */
export class GwenCompanion {
  readonly actor: FamilyActor;
  readonly spells: GwenSpells;
  private readonly trail: Crumb[] = [];
  private boltIn: number = GWEN.bolt.everyMs[0];
  private chatterIn: number = GWEN.chatterMs[0];
  private chatterIndex = 0;
  private shieldMs = 0;
  private revealMs = 0;
  private complainedAt = -99999;
  private readonly spoken = new Set<SpellId>();
  private readonly bubble: Phaser.GameObjects.Image;
  private readonly lens: Phaser.GameObjects.Graphics;
  private stateIn = 0;
  private readonly charge: number[] = [0, 0, 0];
  private alpha = 1;
  /** Spells the file has saved (a forced first cast teaches her before the story saves it). */
  private readonly saved = new Set<SpellId>();
  /** Story moments can mute her banter (a cutscene, a puzzle with its own talk). */
  quiet = false;
  /** Spells can be called (the level holds them during cinematics). */
  canCast = true;

  constructor(
    private readonly kit: StoryKit,
    private readonly opts: GwenOptions,
  ) {
    const look = { texture: TEX.gwen, prefix: 'gwen', frameWidth: GWEN_FRAME.w, frameHeight: GWEN_FRAME.h, feetY: GWEN_FRAME.feetY, frames: GWEN_FRAMES, handHeight: 15 };
    this.actor = new FamilyActor(kit.scene, look, DEPTH.player - 1);
    this.spells = new GwenSpells(opts.known);
    for (const id of opts.known) this.saved.add(id);
    this.bubble = kit.scene.add.image(0, 0, TEX.manaBubble).setDepth(DEPTH.player + 1).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.lens = kit.scene.add.graphics().setDepth(DEPTH.player + 1).setVisible(false);
    this.drawLens();
  }

  /** She's with Ben and can cast. */
  get present(): boolean {
    return this.actor.mode === 'buddy';
  }

  /** Gwen joins Ben now, a step behind him (or where she already stands: `atX`). */
  join(withSparkle: boolean, atX?: number): void {
    const p = this.kit.player;
    const x = atX ?? p.x - p.facing * 24;
    const y = this.kit.world.groundBelow(x, p.y - 8);
    this.trail.length = 0;
    this.actor.place(x, y, 'buddy');
    this.actor.faceTo(p.x);
    this.actor.pose('idle');
    if (withSparkle) {
      this.kit.fx.burst('mana', x, y - 12, 10);
      this.kit.fx.flash(x, y - 12, GWEN.spells.shield.color, 20, 180, 0.6);
    }
  }

  /** She steps out (a set piece takes her, or she stays behind). */
  leave(): void {
    if (this.actor.mode === 'buddy') this.actor.hide();
    this.trail.length = 0;
  }

  /** She learns a spell (the chapter's story beats). True if it's new (to the file). */
  learn(id: SpellId, announce: boolean): boolean {
    const fresh = this.spells.learn(id) || !this.saved.has(id);
    if (!fresh) return false;
    this.saved.add(id);
    this.opts.onLearn?.(id);
    if (announce) {
      EventBus.emit('gwen:learned', { spell: id });
      playSfx(GWEN_SFX.learned, 0.9);
    }
    this.stateIn = 0;
    return true;
  }

  /** Everything ready again (a checkpoint restart). */
  refresh(): void {
    this.spells.refresh();
    this.stateIn = 0;
  }

  update(dtMs: number, realDtMs: number, controls: Controls): void {
    const p = this.kit.player;
    if (this.present) {
      if (p.grounded && !p.dead) this.crumb(p.x, p.y);
      this.follow(dtMs);
      this.fight(dtMs);
      this.chat(dtMs);
    }
    if ((controls.spellPressed || controls.spellPick !== null) && this.canCast) this.tryCast(controls);
    this.updateShield(dtMs);
    this.updateReveal(dtMs);
    this.actor.update(dtMs);
    this.fade(realDtMs);
    this.stateIn -= realDtMs;
    if (this.stateIn <= 0) this.emitState();
  }

  // ------------------------------------------------------------ Following

  private crumb(x: number, y: number): void {
    const F = GWEN.follow;
    const last = this.trail[this.trail.length - 1];
    if (last && Math.abs(last.x - x) < F.crumbGap && Math.abs(last.y - y) < 2) return;
    this.trail.push({ x, y });
    if (this.trail.length > F.trailMax) this.trail.shift();
  }

  private follow(dtMs: number): void {
    const F = GWEN.follow;
    const a = this.actor;
    const p = this.kit.player;
    if (a.moving) return;
    const far = Math.abs(p.x - a.x) + Math.abs(p.y - a.feetY);
    // Way behind (a respawn, a flight across a gap): she pops back in beside him.
    if (far > F.catchUpPx || this.trail.length === 0) {
      if (far > F.catchUpPx && p.grounded && !p.dead) this.join(true);
      else {
        a.faceTo(p.x);
        a.pose('idle');
      }
      return;
    }
    if (Math.abs(p.x - a.x) <= F.stopPx && Math.abs(p.y - a.feetY) < 4) {
      a.faceTo(p.x);
      a.pose('idle');
      return;
    }
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
      a.hopTo(target.x, target.y, F.hopMs);
      return;
    }
    const lag = this.trail.length > 30 ? 1.6 : 1;
    const speed = this.opts.runSpeed ?? F.runSpeed * lag;
    const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * (dtMs / 1000));
    a.x += step;
    a.feetY = next.y;
    a.face(dx < 0 ? -1 : 1);
    a.pose(Math.abs(step) > 0.1 ? 'run' : 'idle');
    if (Math.abs(next.x - a.x) < 1) this.trail.shift();
  }

  /** A mana bolt at whatever's near her, every few seconds. */
  private fight(dtMs: number): void {
    const a = this.actor;
    this.boltIn -= dtMs;
    if (this.boltIn > 0 || a.moving || this.kit.player.dead) return;
    const B = GWEN.bolt;
    const target = this.kit.nearestEnemy(a.x, a.handY, B.range);
    if (!target) {
      this.boltIn = 400;
      return;
    }
    a.faceTo(target.x);
    a.hold('cast', 260);
    const ang = Math.atan2(target.y - a.handY, target.x - a.handX);
    this.kit.projectiles.spawn('mana', 'player', a.handX, a.handY, Math.cos(ang) * B.speed, Math.sin(ang) * B.speed, B.damage, B.lifeMs, 4, { hitKind: 'burst', knockback: B.knockback });
    playSfx(GWEN_SFX.bolt, 0.55);
    this.boltIn = B.everyMs[0] + Math.random() * (B.everyMs[1] - B.everyMs[0]);
  }

  private chat(dtMs: number): void {
    if (this.quiet || this.kit.dialogue.playing) return;
    this.chatterIn -= dtMs;
    if (this.chatterIn > 0) return;
    const C = GWEN.chatterMs;
    this.chatterIn = C[0] + Math.random() * (C[1] - C[0]);
    if (this.kit.nearestEnemy(this.actor.x, this.actor.feetY, 200)) return;
    const lines = this.opts.chatter ?? GWEN_CHATTER;
    const line = lines[this.chatterIndex % lines.length];
    this.chatterIndex++;
    this.kit.dialogue.say('gwen', line, 2600);
  }

  // ------------------------------------------------------------ Spells

  private tryCast(controls: Controls): void {
    const p = this.kit.player;
    if (!this.present || p.dead || this.spells.knownSpells.length === 0) return;
    const spell = this.spells.pick({ up: controls.up, down: controls.down, pick: controls.spellPick });
    const now = this.kit.now();
    if (!this.spells.knows(spell)) return this.complain(GWEN_UNKNOWN);
    if (!this.spells.cast(spell, now)) return this.complain(GWEN_NOT_READY[Math.floor(Math.random() * GWEN_NOT_READY.length)]);
    this.effect(spell);
    if (!this.spoken.has(spell)) {
      this.spoken.add(spell);
      const lines = GWEN_CAST_LINES[spell];
      this.shout(lines[Math.floor(Math.random() * lines.length)], GWEN.spells[spell].color);
    }
    this.opts.onCast?.(spell);
  }

  /**
   * The story makes her cast (the first time a spell comes out of her): no
   * cooldown starts, so the player can try it right away.
   */
  forceCast(spell: SpellId): void {
    this.spells.learn(spell);
    this.spoken.add(spell);
    this.effect(spell);
  }

  private effect(spell: SpellId): void {
    const p = this.kit.player;
    this.actor.faceTo(p.x);
    this.actor.hold('cast', 420);
    this.kit.fx.beam(this.actor.handX, this.actor.handY, p.x, p.centerY, GWEN.spells[spell].color, 2, 160);
    if (spell === 'shield') this.castShield();
    else if (spell === 'stun') this.castStun();
    else this.castReveal();
    EventBus.emit('gwen:cast', { spell });
    this.stateIn = 0;
  }

  private complain(line: string): void {
    playSfx(GWEN_SFX.dud, 0.8);
    const now = this.kit.now();
    if (now - this.complainedAt < 2500) return;
    this.complainedAt = now;
    this.shout(line, PALETTE.cream);
  }

  /** A short line over her head (quick reactions; banter uses the dialogue box). */
  private shout(line: string, color: number): void {
    if (this.actor.visible) this.kit.fx.popText(this.actor.x, this.actor.feetY - GWEN_FRAME.feetY - 6, line, color);
  }

  private castShield(): void {
    const S = GWEN.spells.shield;
    this.shieldMs = S.durationMs;
    this.kit.player.setWard(S.durationMs, () => this.popShield());
    this.bubble.setVisible(true).setScale(0.4).setAlpha(1);
    this.kit.scene.tweens.add({ targets: this.bubble, scale: (S.radius * 2) / 48, duration: 160, ease: 'Back.Out' });
    playSfx(GWEN_SFX.shield, 0.9);
  }

  /** The bubble ate a hit: it bursts. */
  private popShield(): void {
    const p = this.kit.player;
    this.shieldMs = 0;
    this.bubble.setVisible(false);
    this.kit.fx.burst('mana', p.x, p.centerY, 16);
    this.kit.fx.ring(p.x, p.centerY, GWEN.spells.shield.color, 40, 260);
    playSfx(GWEN_SFX.shieldPop, 0.9);
  }

  private updateShield(dtMs: number): void {
    if (this.shieldMs <= 0) return;
    const p = this.kit.player;
    this.shieldMs -= dtMs;
    if (this.shieldMs <= 0 || p.dead) {
      this.shieldMs = 0;
      this.bubble.setVisible(false);
      p.setWard(0, null);
      return;
    }
    const S = GWEN.spells.shield;
    // Every shot that touches the bubble pops on it.
    const r2 = (S.radius + 2) ** 2;
    this.kit.projectiles.forEachActive('enemy', (shot) => {
      if ((shot.x - p.x) ** 2 + (shot.y - p.centerY) ** 2 > r2 + shot.radius * shot.radius) return;
      this.kit.projectiles.kill(shot, true);
      this.kit.fx.burst('mana', shot.x, shot.y, 4);
      playSfx(GWEN_SFX.shieldPing, 0.6);
    });
    this.bubble.setPosition(p.x, p.centerY);
    // The last stretch blinks so the player sees it running out.
    const ending = this.shieldMs < 700;
    this.bubble.setAlpha(ending && !blinkOn(this.kit.now(), 90) ? 0.25 : 0.85);
    this.kit.lighting.add(p.x, p.centerY, 34, S.color, 0.45);
  }

  private castStun(): void {
    const S = GWEN.spells.stun;
    const p = this.kit.player;
    const n = this.kit.combat.blast(p.x, p.centerY, S.radius, { damage: S.damage, kind: 'burst', x: p.x, y: p.centerY, knockback: S.knockback, stunMs: S.stunMs }, true);
    this.kit.fx.ring(p.x, p.centerY, S.color, S.radius, 320);
    this.kit.fx.ring(p.x, p.centerY, GWEN.spells.shield.color, S.radius * 0.7, 240, 0.6);
    this.kit.fx.burst('mana', p.x, p.centerY, 22);
    this.kit.fx.light(p.x, p.centerY, S.radius, S.color, 300);
    this.kit.fx.shake(FX.shakeLight, 140);
    if (n > 0) this.kit.fx.hitStop(60);
    playSfx(GWEN_SFX.stun, 1);
  }

  private castReveal(): void {
    const R = GWEN.spells.reveal;
    this.revealMs = R.durationMs;
    this.kit.player.extraSense = R.radius;
    this.lens.setVisible(true).setScale(0.2).setAlpha(0.9);
    this.kit.scene.tweens.add({ targets: this.lens, scale: 1, duration: 220, ease: 'Cubic.Out' });
    playSfx(GWEN_SFX.reveal, 0.9);
  }

  private updateReveal(dtMs: number): void {
    if (this.revealMs <= 0) return;
    const p = this.kit.player;
    this.revealMs -= dtMs;
    if (this.revealMs <= 0 || p.dead) {
      this.revealMs = 0;
      p.extraSense = 0;
      this.lens.setVisible(false);
      return;
    }
    const R = GWEN.spells.reveal;
    this.lens.setPosition(p.x, p.centerY);
    this.lens.rotation += dtMs * 0.0006;
    const ending = this.revealMs < 800;
    this.lens.setAlpha(ending && !blinkOn(this.kit.now(), 110) ? 0.2 : 0.75);
    this.kit.lighting.add(p.x, p.centerY, R.radius * 0.9, R.color, 0.35);
  }

  /** The reveal circle: dashed rings drawn once, then only moved and turned. */
  private drawLens(): void {
    const R = GWEN.spells.reveal;
    const g = this.lens;
    const dashes = 24;
    g.lineStyle(1, R.color, 0.9);
    for (let i = 0; i < dashes; i++) {
      const a0 = (i / dashes) * Math.PI * 2;
      g.beginPath();
      g.arc(0, 0, R.radius, a0, a0 + (Math.PI * 2) / dashes / 2);
      g.strokePath();
    }
    g.lineStyle(1, R.color, 0.35);
    g.strokeCircle(0, 0, R.radius - 4);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      g.fillStyle(R.color, 0.9);
      g.fillRect(Math.cos(a) * R.radius - 1, Math.sin(a) * R.radius - 1, 3, 3);
    }
  }

  // ------------------------------------------------------------ Readability

  /** See-through in front of Ben and under the thumbs, so she never hides him or a button. */
  private fade(realDtMs: number): void {
    if (!this.actor.visible) return;
    const p = this.kit.player;
    let want = 1;
    if (Math.abs(this.actor.x - p.x) < 12 && Math.abs(this.actor.feetY - p.y) < 22) want = GWEN.overlapAlpha;
    if (touchControlsOn() && this.underThumbs()) want = Math.min(want, GWEN.thumbAlpha);
    this.alpha += (want - this.alpha) * Math.min(1, realDtMs / 120);
    this.actor.sprite.setAlpha(this.alpha);
  }

  private underThumbs(): boolean {
    const cam = this.kit.scene.cameras.main;
    const sx = (this.actor.x - cam.worldView.x) * cam.zoom;
    const sy = (this.actor.centerY - cam.worldView.y) * cam.zoom;
    const S = TOUCH.stick;
    if ((sx - S.homeX) ** 2 + (sy - S.homeY) ** 2 < (S.radius * 2.2) ** 2) return true;
    // The button cluster: everything right of the leftmost button, below the Omnitrix button's top.
    const right = cam.width - (TOUCH.buttons.attack.right + TOUCH.buttons.attack.r + 50);
    return sx > right && sy > TOUCH.buttons.omnitrix.y - TOUCH.buttons.omnitrix.r - 8;
  }

  private emitState(): void {
    this.stateIn = STATE_EVERY_MS;
    const now = this.kit.now();
    for (let i = 0; i < SPELL_ORDER.length; i++) this.charge[i] = this.spells.charge(SPELL_ORDER[i], now);
    EventBus.emit('gwen:state', { present: this.present && this.canCast, known: this.spells.knownSpells, charge: this.charge });
  }

  destroy(): void {
    const p = this.kit.player;
    p.extraSense = 0;
    p.setWard(0, null);
    EventBus.emit('gwen:state', { present: false, known: [], charge: this.charge });
    this.actor.destroy();
    this.bubble.destroy();
    this.lens.destroy();
  }
}
