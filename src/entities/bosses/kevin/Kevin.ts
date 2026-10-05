import Phaser from 'phaser';
import { getAlien, hasAlien } from '../../../aliens/registry';
import { DEPTH } from '../../../config/constants';
import { CHIMERA, COILS, COPY_RULES, KEVIN, TURN } from '../../../config/kevin';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { pace } from '../../../systems/Difficulty';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../../types';
import type { ArenaBoss } from '../ArenaBoss';
import type { BossWorld } from '../HunterDrone';
import { Coil } from './Coil';
import { COPY_MOVE_FNS, newMove, type MoveFn, type MoveState } from './copyMoves';
import { KevinHazards } from './KevinHazards';
import { KevinLook, type KevinPose } from './KevinLook';
import { coilDrain, freshMove, lunge, scan, volley, type KevinBody } from './kevinMoves';
import { HUMAN, Reliance, copyMultiplier, topCopies, type CopyLevel } from './rules';
import { KEVIN_BOSS_LINES } from './lines';

type State = 'intro' | 'idle' | 'move' | 'stagger' | 'transition' | 'dying' | 'dead';
type Plan = 'volley' | 'lunge' | 'scan' | 'copy' | 'coil';

const BAGS: Plan[][] = [
  ['volley', 'scan', 'lunge', 'volley', 'scan'],
  ['coil', 'copy', 'lunge', 'copy', 'coil', 'volley', 'copy'],
];

export interface KevinOptions {
  /** The turn: a one-alien copy fight with the DNA he just stole (no phases, no coils). */
  stolen?: string;
}

/**
 * KEVIN 11. He copies the aliens Ben uses: the more Ben leans on one, the
 * stronger Kevin's copy of it gets (levels I-III, shown on the copy meter),
 * so switching is the counterplay. Phase 1 COPYCAT: bolts, the absorb lunge,
 * and scans that turn him into a purple copy of Ben's alien. Phase 2
 * OVERCHARGE: he drains the tesla coils (Upgrade can turn one on him) and
 * switches between Ben's two favourite aliens on his own. Phase 3 KEVIN 11:
 * the hybrid wearing a piece of every alien he copied, overloading now and then.
 */
export class Kevin implements ArenaBoss, KevinBody {
  readonly name: string;
  readonly subtitle: string;
  readonly maxHp: number;
  readonly phase2Title = 'OVERCHARGE!';
  readonly defeatTitle = KEVIN.defeatTitle;
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  readonly extraTargets: readonly Damageable[] = [];
  readonly extraHazards: readonly Hazard[];
  readonly liftables: readonly Liftable[] = [];
  readonly floorY: number;
  readonly kh: KevinHazards;
  readonly coils: Coil[] = [];
  readonly reliance = new Reliance();
  hp: number;
  phase = 0;
  lastDamage = 0;
  x: number;
  lift = 0;
  facing: 1 | -1 = -1;
  strike = 0;
  private state: State = 'intro';
  private stateT = 0;
  private wait = 0;
  private bag: Plan[] = [];
  private readonly look: KevinLook;
  private move: MoveFn | null = null;
  private readonly m: MoveState = newMove();
  private level: 1 | 2 | 3 = 1;
  /** As a copy: attacks left before it wears off. */
  private copyLeft = 0;
  private sinceCopy = 0;
  private syncSpent = false;
  private flashLeft = 0;
  private glow = 0;
  private unstable = false;
  private chimeraIndex = 0;
  private chimeraForms: string[] = [];
  private attacksSinceOverload = 0;
  private lastLabelAt = 0;
  private metersAt = 0;
  private meterKey = '';
  private readonly stolen: string | null;
  private dyingStep = 0;
  private readonly train: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    readonly w: BossWorld,
    x: number,
    opts: KevinOptions = {},
  ) {
    this.stolen = opts.stolen ?? null;
    this.x = x;
    this.floorY = w.arena.floorY;
    this.maxHp = this.stolen ? TURN.maxHp : KEVIN.maxHp;
    this.hp = this.maxHp;
    this.name = this.stolen ? 'KEVIN' : KEVIN.name;
    this.subtitle = this.stolen && hasAlien(this.stolen) ? `STOLEN DNA: ${getAlien(this.stolen).name}` : KEVIN.subtitle;
    this.kh = new KevinHazards(this.floorY, w.fx, w.lighting, w.telegraph);
    this.extraHazards = this.kh.all();
    this.look = new KevinLook(scene, x, this.floorY, DEPTH.boss);
    if (this.stolen) {
      this.look.copy(this.stolen);
      this.level = TURN.level as 2;
      this.copyLeft = Infinity;
    } else {
      // The service track behind the hall's grating (his way out, later).
      const a = w.arena;
      const g = scene.add.graphics().setDepth(DEPTH.decorBack + 1);
      g.fillStyle(0x0a0c12, 0.85).fillRect(a.left - 16, this.floorY - 104, a.right - a.left + 32, 48);
      g.fillStyle(0x3a3e48, 1).fillRect(a.left - 16, this.floorY - 58, a.right - a.left + 32, 2);
      for (let gx = a.left - 16; gx < a.right + 16; gx += 12) g.fillStyle(0x2a2e38, 1).fillRect(gx, this.floorY - 104, 2, 48);
      // The coils stand at either end of the hall; Upgrade can merge into them.
      [a.left + 56, a.right - 56].forEach((cx, i) => {
        const coil = new Coil(scene, w.fx, w.lighting, () => w.now, cx, this.floorY, i, (fx, fy) => this.overloadFrom(fx, fy));
        this.coils.push(coil);
        w.addMachine?.(coil);
      });
    }
  }

  // ------------------------------------------------------------ Body

  get alive(): boolean {
    return this.state !== 'dying' && this.state !== 'dead';
  }

  get defeated(): boolean {
    return !this.alive;
  }

  get introducing(): boolean {
    return this.state === 'intro';
  }

  get active(): boolean {
    return this.alive && this.state !== 'intro' && this.state !== 'transition';
  }

  get damage(): number {
    return this.strike > 0 ? this.strike : KEVIN.contactDamage;
  }

  get bodyH(): number {
    return this.look.kind === 'chimera' ? KEVIN.chimeraBody.height : this.look.kind === 'copy' ? KEVIN.copyBody.height : KEVIN.body.height;
  }

  private get bodyW(): number {
    return this.look.kind === 'chimera' ? KEVIN.chimeraBody.width : this.look.kind === 'copy' ? KEVIN.copyBody.width : KEVIN.body.width;
  }

  get shotTint(): number {
    const id = this.look.copied;
    return id && hasAlien(id) ? Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(getAlien(id).theme.color), Phaser.Display.Color.ValueToColor(PALETTE.kevin), 100, 55).color : PALETTE.kevin;
  }

  hitbox(out: Rect): boolean {
    // Staggered (OUT OF SYNC, a coil's OVERLOAD!, UNSTABLE!) he's a punish window: touching him doesn't hurt.
    if (!this.active || this.state === 'stagger') return false;
    out.x = this.x - this.bodyW / 2 + 3;
    out.y = this.floorY - this.lift - this.bodyH + 4;
    out.w = this.bodyW - 6;
    out.h = this.bodyH - 4;
    return true;
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.state === 'intro') return false;
    out.x = this.x - this.bodyW / 2;
    out.y = this.floorY - this.lift - this.bodyH;
    out.w = this.bodyW;
    out.h = this.bodyH;
    return true;
  }

  pose(p: KevinPose): void {
    this.look.setPose(p);
  }

  clampX(x: number): number {
    const a = this.w.arena;
    return Phaser.Math.Clamp(x, a.left + KEVIN.wallGap, a.right - KEVIN.wallGap);
  }

  playerForm(): string {
    return this.w.playerForm?.() ?? HUMAN;
  }

  // ------------------------------------------------------------ Damage

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.state === 'intro' || this.state === 'transition') return 'none';
    const attacker = this.playerForm();
    const copied = this.look.kind === 'copy' ? this.look.copied : null;
    const { mult, verdict } = copyMultiplier({
      attacker,
      copied,
      copyLevel: this.level,
      sinceCopyMs: this.sinceCopy,
      syncSpent: this.syncSpent,
      chimera: this.look.kind === 'chimera' ? { levelOf: (f) => this.levelOf(f) } : undefined,
      unstable: this.unstable,
    });
    const dmg = hit.damage * mult;
    if (!this.stolen) this.reliance.hit(attacker, dmg);
    this.label(verdict, attacker);
    if (verdict === 'outOfSync') {
      this.syncSpent = true;
      this.stagger(COPY_RULES.outOfSyncStaggerMs);
    }
    return this.damageBy(dmg, hit);
  }

  private label(verdict: string, attacker: string): void {
    const now = this.w.now;
    const y = this.floorY - this.lift - this.bodyH - 14;
    if (verdict === 'outOfSync') {
      this.w.fx.popText(this.x, y, 'OUT OF SYNC!', PALETTE.gold, 1.2);
      playSfx('perfect', 0.8, 1.2);
      this.w.tip('kevin-sync', 'SWITCH RIGHT AFTER HE COPIES: OUT OF SYNC!', 3200);
      return;
    }
    if (now - this.lastLabelAt < 900) return;
    if (verdict === 'perfectCopy') {
      this.lastLabelAt = now;
      this.w.fx.popText(this.x, y, 'PERFECT COPY', PALETTE.kevin);
      this.w.tip('kevin-perfect', "HE'S COPIED IT PERFECTLY. SWITCH ALIENS!", 3500);
    } else if (verdict === 'resisted') {
      this.lastLabelAt = now;
      this.w.fx.popText(this.x, y, 'RESISTED', PALETTE.kevinDark);
      this.w.tip('kevin-resist', attacker !== HUMAN && this.look.kind === 'chimera' ? 'KEVIN 11 RESISTS WHAT HE COPIED BEST. USE THE OTHERS!' : 'HE COPIES WHAT YOU USE. SWITCH ALIENS!', 3500);
    }
  }

  private damageBy(dmg: number, hit: Hit | null): HitResult {
    this.lastDamage = dmg;
    this.hp = Math.max(0, this.hp - dmg);
    this.flashLeft = 80;
    if (hit) this.w.fx.burst('volt', hit.x, hit.y, dmg >= 5 ? 10 : 4);
    playSfx('droneHit', 0.7, 0.8);
    this.w.onHealth(this.hp / this.maxHp, this.phase);
    if (this.hp <= 0) {
      this.die();
      return 'killed';
    }
    this.checkPhase();
    return 'hit';
  }

  /** Upgrade discharged a coil into him. */
  private overloadFrom(fx: number, fy: number): void {
    if (!this.alive) return;
    const cy = this.floorY - this.lift - this.bodyH / 2;
    for (let i = 0; i < 3; i++) this.scene.time.delayedCall(i * 70, () => this.w.fx.beam(fx, fy, this.x, cy, i === 1 ? PALETTE.white : PALETTE.upgrade, 4 - i, 160));
    this.w.fx.burst('circuit', this.x, cy, 24);
    this.w.fx.shake(0.014, 360);
    this.w.fx.popText(this.x, cy - 40, 'OVERLOAD!', PALETTE.upgrade, 1.2);
    playSfx('hackBlast', 1, 0.9);
    this.damageBy(COILS.overload.damage, null);
    if (this.alive) this.stagger(COILS.overload.stunMs);
    this.w.tip('kevin-coil', 'UPGRADE CAN TURN THE COILS ON HIM!', 3000);
  }

  private stagger(ms: number): void {
    if (this.state === 'transition' || !this.alive) return;
    this.cancelMove();
    this.lift = 0;
    this.state = 'stagger';
    this.stateT = 0;
    this.wait = pace.punish(ms);
    this.pose('hurt');
  }

  private checkPhase(): void {
    if (this.stolen) return;
    const ratio = this.hp / this.maxHp;
    const want = ratio <= KEVIN.phase3At ? 2 : ratio <= KEVIN.phase2At ? 1 : 0;
    if (want <= this.phase || this.state === 'transition') return;
    this.phase = want;
    this.cancelMove();
    this.lift = 0;
    this.state = 'transition';
    this.stateT = 0;
    this.bag = [];
    this.pose('absorb');
    playSfx('powerSurge', 1, this.phase === 1 ? 0.8 : 0.6);
    const line = this.phase === 1 ? KEVIN_BOSS_LINES.phase2 : KEVIN_BOSS_LINES.phase3;
    this.w.fx.popText(this.x, this.floorY - 70, line, PALETTE.kevin);
    const a = this.w.arena;
    const far = this.x < (a.left + a.right) / 2 ? a.right - KEVIN.phaseSmoothyFromWall : a.left + KEVIN.phaseSmoothyFromWall;
    this.w.dropPickup(far, this.floorY - 60);
    if (this.phase === 1) this.w.onPhase2();
  }

  private cancelMove(): void {
    this.move = null;
    this.strike = 0;
    for (const c of this.coils) c.draining = false;
    this.w.cancelThreat();
  }

  private die(): void {
    this.cancelMove();
    this.kh.clear();
    this.w.hazards.clear();
    this.state = 'dying';
    this.stateT = 0;
    this.dyingStep = 0;
    this.lift = 0;
    this.w.time.slowMo(0.25, 900, 500);
    playSfx('bigExplode', 0.8, 0.8);
    if (!this.stolen && this.reliance.peakLevel < 3) this.w.achievement?.('nothing-to-copy');
  }

  /** How well he copied `form` (KEVIN 11's resistances). */
  private levelOf(form: string): CopyLevel {
    return this.chimeraForms.includes(form) ? this.reliance.level(form) : 0;
  }

  // ------------------------------------------------------------ Copies

  /** The lunge caught Ben as an alien: his copy of it jumps a level, Ben loses time, and he turns into it. */
  absorb(form: string): void {
    this.reliance.bump(form);
    this.w.drainAlienTime?.(KEVIN.lunge.drainAlienMs);
    this.w.fx.popText(this.x, this.floorY - 60, 'ABSORBED!', PALETTE.kevin, 1.2);
    this.w.fx.ring(this.w.player.x, this.w.player.centerY, PALETTE.kevin, 40, 300);
    playSfx('absorb', 1);
    this.becomeCopy(form, this.reliance.copyLevel(form));
  }

  scanned(form: string): void {
    if (form !== HUMAN) {
      this.becomeCopy(form, this.reliance.copyLevel(form));
      return;
    }
    // Human Ben: he copies what he remembers best, or has nothing to copy.
    const best = this.reliance.ranked()[0];
    if (best) this.becomeCopy(best, this.reliance.copyLevel(best));
    else {
      this.w.fx.popText(this.x, this.floorY - 56, 'NOTHING TO COPY?', PALETTE.kevin);
      this.pose('laugh');
    }
  }

  private becomeCopy(form: string, level: 1 | 2 | 3): void {
    if (!hasAlien(form)) return;
    this.look.copy(form);
    this.level = level;
    this.copyLeft = KEVIN.copyAttacks[Math.min(2, this.phase)];
    this.sinceCopy = 0;
    this.syncSpent = false;
    this.glow = 1;
    const y = this.floorY - this.bodyH / 2;
    this.w.fx.flash(this.x, y, PALETTE.kevin, 40, 300);
    this.w.fx.burst('volt', this.x, y, 18);
    this.w.fx.popText(this.x, this.floorY - this.bodyH - 18, `COPY ${'I'.repeat(level)}: ${getAlien(form).name}`, PALETTE.kevin);
    playSfx('transformBoom', 0.6, 0.7);
    this.toIdle(300);
  }

  private dropCopy(): void {
    if (this.look.kind !== 'copy' || this.stolen) return;
    this.look.human();
    this.w.fx.burst('volt', this.x, this.floorY - 20, 12);
    playSfx('revert', 0.6, 0.8);
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    this.stateT += dtMs;
    this.sinceCopy += dtMs;
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    this.glow = Math.max(0, this.glow - dtMs / 600);
    this.kh.update(dtMs, this.w.now);
    if (this.active && !this.stolen) this.reliance.tick(dtMs, this.playerForm());
    switch (this.state) {
      case 'intro':
        this.updateIntro();
        break;
      case 'idle':
        this.updateIdle(dtMs);
        break;
      case 'move':
        this.updateMove(dtMs);
        break;
      case 'stagger':
        if (this.stateT >= this.wait) {
          this.unstable = false;
          this.toIdle();
        }
        break;
      case 'transition':
        this.updateTransition();
        break;
      case 'dying':
        this.updateDying(dtMs);
        break;
      case 'dead':
        break;
    }
    this.render(dtMs);
    this.emitMeter();
  }

  private introStarted = false;
  private introDone = false;

  private updateIntro(): void {
    if (!this.introStarted) {
      this.introStarted = true;
      this.facing = this.w.player.x < this.x ? -1 : 1;
      const go = () => this.powerUp();
      if (!this.stolen && this.w.dialogue && this.w.introSeen === false) {
        this.w.holdPlayer?.(true);
        this.w.dialogue(KEVIN_BOSS_LINES.intro, go);
      } else this.scene.time.delayedCall(this.stolen ? 200 : 400, go);
    }
    if (this.introDone && this.stateT > 0) {
      this.w.holdPlayer?.(false);
      this.toIdle(500);
    }
  }

  /** He drinks the hall's power: the coils flare, the lights dip, and he laughs. */
  private powerUp(): void {
    const fx = this.w.fx;
    this.pose('absorb');
    playSfx('powerSurge', 1, 0.9);
    for (const c of this.coils) {
      c.draining = true;
      for (let i = 0; i < 4; i++) this.scene.time.delayedCall(i * 120, () => fx.beam(c.topX, c.topY, this.x, this.floorY - 20, PALETTE.kevin, 2, 140));
    }
    this.scene.time.delayedCall(this.stolen ? 300 : 800, () => {
      for (const c of this.coils) c.draining = false;
      fx.ring(this.x, this.floorY - 20, PALETTE.kevin, 120, 500);
      fx.shake(0.01, 300);
      this.pose('laugh');
      if (!this.stolen) this.w.tip('kevin-copies', 'HE COPIES THE ALIENS YOU USE. THE MORE YOU USE ONE, THE BETTER HIS COPY: SWITCH!', 5000);
      this.introDone = true;
      this.stateT = 1;
    });
  }

  private toIdle(extraMs = 0): void {
    this.state = 'idle';
    this.stateT = 0;
    this.strike = 0;
    const base = this.look.kind === 'chimera' ? CHIMERA.idleMs : KEVIN.idleMs[Math.min(2, this.phase)];
    this.wait = pace.bossRest(base) + extraMs;
    this.pose('idle');
  }

  private updateIdle(dtMs: number): void {
    const p = this.w.player;
    const dx = p.x - this.x;
    this.facing = dx < 0 ? -1 : 1;
    // Human Kevin keeps his distance; copies and the hybrid close in.
    const want = this.look.kind === 'human' ? KEVIN.preferDistance : 70;
    const speed = this.look.kind === 'chimera' ? KEVIN.runSpeed * 0.5 : KEVIN.runSpeed;
    let moving = false;
    if (Math.abs(dx) < want - 30) {
      this.x = this.clampX(this.x - Math.sign(dx) * speed * (dtMs / 1000));
      moving = true;
    } else if (Math.abs(dx) > want + 50) {
      this.x = this.clampX(this.x + Math.sign(dx) * speed * (dtMs / 1000));
      moving = true;
    }
    this.pose(moving ? 'run' : 'idle');
    if (moving && this.look.kind === 'human') this.facing = (Math.sign(dx) || 1) as 1 | -1;
    if (this.stateT < this.wait || p.dead) return;
    this.chooseMove();
  }

  private chooseMove(): void {
    // A copy keeps using its alien's moves until it wears off.
    if (this.look.kind === 'copy') {
      if (this.copyLeft <= 0) {
        this.dropCopy();
        this.toIdle(200);
        return;
      }
      this.copyLeft--;
      this.startMove(COPY_MOVE_FNS[this.copyStyle(this.look.copied)]);
      return;
    }
    if (this.look.kind === 'chimera') {
      this.chooseChimeraMove();
      return;
    }
    if (this.bag.length === 0) this.bag = [...BAGS[Math.min(1, this.phase)]];
    const plan = this.bag.shift()!;
    switch (plan) {
      case 'volley':
        this.startMove(volley);
        break;
      case 'lunge':
        this.startMove(lunge);
        break;
      case 'scan':
        this.startMove(scan);
        break;
      case 'coil':
        this.startMove(coilDrain);
        break;
      case 'copy': {
        // Phase 2: he switches to Ben's favourites by himself.
        const picks = topCopies(this.reliance, this.playerForm());
        const pick = picks[Math.floor(Math.random() * picks.length)];
        if (pick) this.becomeCopy(pick, this.reliance.copyLevel(pick));
        else this.startMove(volley);
        break;
      }
    }
  }

  private chooseChimeraMove(): void {
    if (this.attacksSinceOverload >= CHIMERA.overloadEvery) {
      this.attacksSinceOverload = 0;
      this.unstable = true;
      this.state = 'stagger';
      this.stateT = 0;
      this.wait = pace.punish(CHIMERA.overloadMs);
      this.pose('overload');
      this.w.fx.popText(this.x, this.floorY - 70, 'UNSTABLE!', PALETTE.gold, 1.2);
      playSfx('omnitrixGlitch', 1, 0.6);
      this.w.tip('kevin-unstable', 'UNSTABLE! HIT HIM NOW!', 2500);
      return;
    }
    this.attacksSinceOverload++;
    const forms = this.chimeraForms;
    if (forms.length === 0) {
      this.level = 1;
      this.startMove(this.attacksSinceOverload % 2 === 0 ? coilDrain : COPY_MOVE_FNS.bolt);
      return;
    }
    const form = forms[this.chimeraIndex % forms.length];
    this.chimeraIndex++;
    this.level = this.reliance.copyLevel(form);
    // Every third attack he drains a coil instead.
    if (this.chimeraIndex % 3 === 0 && this.coils.length > 0) this.startMove(coilDrain);
    else this.startMove(COPY_MOVE_FNS[this.copyStyle(form)]);
  }

  private copyStyle(form: string | null) {
    return form && hasAlien(form) ? (getAlien(form).copy?.style ?? 'bolt') : 'bolt';
  }

  private startMove(fn: MoveFn): void {
    this.move = fn;
    freshMove(this.m);
    this.state = 'move';
    this.stateT = 0;
  }

  private updateMove(dtMs: number): void {
    if (!this.move) {
      this.toIdle();
      return;
    }
    this.m.t += dtMs;
    if (!this.move(this, this.m, this.level, dtMs)) return;
    this.move = null;
    this.strike = 0;
    if (this.state === 'move') this.toIdle();
  }

  private updateTransition(): void {
    const fx = this.w.fx;
    if (chance(0.5)) fx.burst('volt', this.x + (Math.random() - 0.5) * 40, this.floorY - Math.random() * 50, 2);
    this.w.lighting.add(this.x, this.floorY - 30, 120, PALETTE.kevin, 0.8);
    for (const c of this.coils) {
      c.draining = this.stateT < 1300;
      if (c.draining && chance(0.5)) fx.beam(c.topX, c.topY, this.x, this.floorY - 24, PALETTE.kevin, 2, 60);
    }
    if (this.stateT < 1400) return;
    if (this.phase === 2) {
      // He swallows every copy at once: KEVIN 11.
      this.chimeraForms = this.reliance.ranked().filter((f) => hasAlien(f)).slice(0, 6);
      this.look.chimera(this.chimeraForms);
      fx.flash(this.x, this.floorY - 30, PALETTE.kevin, 90, 500);
      fx.shake(0.018, 500);
      playSfx('chestPound', 1, 0.6);
      this.w.fx.popText(this.x, this.floorY - 80, 'KEVIN 11!', PALETTE.kevin, 1.4);
    } else this.dropCopy();
    this.toIdle(400);
  }

  // ------------------------------------------------------------ Defeat and escape

  private updateDying(dtMs: number): void {
    const fx = this.w.fx;
    const S = this.stolen ? [0, 0, 0] : [900, 1800, 3400];
    if (this.dyingStep === 0) {
      // Every volt he stole blows back out.
      if (chance(0.6)) fx.burst('volt', this.x + (Math.random() - 0.5) * 60, this.floorY - Math.random() * 60, 3);
      this.w.lighting.add(this.x, this.floorY - 30, 140 + Math.random() * 40, PALETTE.kevin, 1);
      if (this.stateT < (this.stolen ? 500 : S[0])) return;
      this.dyingStep = 1;
      this.look.human();
      this.pose('hurt');
      fx.ring(this.x, this.floorY - 20, PALETTE.kevin, 260, 900);
      fx.flash(this.x, this.floorY - 20, PALETTE.white, 120, 500);
      fx.shake(0.02, 600);
      playSfx('powerDown', 1, 0.8);
      if (this.stolen) {
        this.state = 'dead';
        this.w.onDefeated(this.x, this.floorY - 20);
      }
      return;
    }
    if (this.dyingStep === 1) {
      if (this.stateT < S[1]) return;
      this.dyingStep = 2;
      const escape = () => this.escape();
      if (this.w.dialogue) this.w.dialogue(KEVIN_BOSS_LINES.defeat, escape);
      else escape();
      return;
    }
    if (this.dyingStep >= 3) this.updateTrain(dtMs);
  }

  /** A freight train roars along the service track behind the hall; he leaps onto it and is gone. */
  private escape(): void {
    if (this.dyingStep !== 2) return;
    this.dyingStep = 3;
    this.stateT = 0;
    const a = this.w.arena;
    const y = this.floorY - 58;
    for (let i = 0; i < 4; i++) {
      this.train.push(this.scene.add.image(a.right + 60 + i * 110, y, TEX.trainCar, i === 0 ? 0 : 1).setOrigin(0, 1).setScale(0.86).setFlipX(true).setTint(0x8a8aa0).setDepth(DEPTH.decorBack + 2));
    }
    playSfx('trainHorn', 0.9);
    this.pose('run');
  }

  private updateTrain(dtMs: number): void {
    const speed = 520 * (dtMs / 1000);
    for (const c of this.train) c.x -= speed;
    this.w.lighting.add(this.train[0].x - 20, this.floorY - 80, 90, PALETTE.white, 0.8);
    if (this.dyingStep === 3) {
      // He jumps for the roof as the second car goes by.
      const roof = this.floorY - 58 - 44 * 0.86;
      if (this.stateT > 500 && this.train[1].x < this.x + 40) {
        this.pose('jump');
        this.facing = -1;
        playSfx('jump', 1, 0.9);
        this.scene.tweens.add({ targets: this, lift: this.floorY - roof, duration: 380, ease: 'Quad.easeOut' });
        this.dyingStep = 4;
        this.stateT = 0;
      }
      return;
    }
    // Riding the roof away, laughing.
    if (this.stateT > 380) {
      this.x -= speed;
      this.pose('laugh');
    }
    if (this.train[this.train.length - 1].x + 120 < this.w.arena.left - 100) this.finishEscape();
  }

  private finishEscape(): void {
    this.state = 'dead';
    this.look.setVisible(false);
    this.w.onDefeated(this.x, this.floorY - 20);
  }

  /** The story takes Kevin back after the turn: this sprite goes, his spot is handed over. */
  handOff(): { x: number; feetY: number; facing: 1 | -1 } {
    this.look.setVisible(false);
    this.state = 'dead';
    return { x: this.x, feetY: this.floorY - this.lift, facing: this.facing };
  }

  // ------------------------------------------------------------ Look

  private render(dtMs: number): void {
    this.look.place(this.x, this.floorY - this.lift, this.facing, dtMs, this.flashLeft > 0, this.glow + (this.unstable ? 0.5 : 0));
    if (this.state === 'dead') return;
    const cy = this.floorY - this.lift - this.bodyH / 2;
    this.w.lighting.add(this.x, cy, this.look.kind === 'human' ? 34 : 60, PALETTE.kevin, this.look.kind === 'human' ? 0.5 : 0.8);
  }

  /** The copy meter: every alien he has data on, with its copy level. */
  private emitMeter(): void {
    if (!this.w.copies || this.stolen) return;
    if (this.w.now - this.metersAt < 200) return;
    this.metersAt = this.w.now;
    const list = this.reliance.ranked().filter((f) => hasAlien(f)).map((id) => ({ id, level: this.reliance.level(id) }));
    const current = this.look.kind === 'copy' ? this.look.copied : null;
    const key = `${list.map((e) => `${e.id}${e.level}`).join(',')}|${current}`;
    if (key === this.meterKey) return;
    this.meterKey = key;
    this.w.copies(list, current);
  }
}
