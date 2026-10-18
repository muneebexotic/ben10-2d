import Phaser from 'phaser';
import { CH6_BEATS } from '../../config/chapter6';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { GREYMATTER_TEX } from '../../aliens/greymatter/art';
import { activeDifficultyId } from '../../systems/Difficulty';
import { flashCamera, shakeCamera } from '../../systems/Accessibility';
import { inputMode } from '../../systems/InputMode';
import { playSfx } from '../../systems/audio/Sfx';
import { MAGIC_SFX } from '../../entities/enemies/magic/sfx';
import { pixelText } from '../../ui/text';
import { frameView } from '../../ui/view';
import { CH6_TEX } from '../preload/karachi/keys';
import { SCENES } from '../SceneKeys';
import {
  flooded,
  GEAR_LAYOUT,
  gearSpin,
  newPipeBoard,
  openings,
  PENDULUM,
  pendulumAngle,
  pinDrops,
  pipeHint,
  pipesSolved,
  turnPipe,
  type PipeBoard,
} from './rules';

export interface SpellEngineData {
  /** 0 pipes, 1 gears, 2 pendulum (a restart from the halfway checkpoint on Easy starts at 2). */
  startStage: number;
  /** A stage was solved (`next`: the stage now starting). */
  onStage(next: number): void;
  /** All three solved. `hinted`: a hint was shown on the way. */
  onDone(hinted: boolean): void;
}

const STAGES = ['MANA PIPES', 'THE GEAR TRAIN', 'THE PENDULUM'] as const;
/** Stuck this long on a stage (no progress), a hint shows (sooner on Easy). */
const TILE = 40;

const INSTRUCTIONS: ReadonlyArray<{ keys: string; touch: string }> = [
  { keys: '{ARROWS} CHOOSE A PIPE, {CONFIRM} TURN IT. SEND THE MANA DOWN THE DRAIN!', touch: 'TAP A PIPE TO TURN IT. SEND THE MANA DOWN THE DRAIN!' },
  { keys: 'TOUCHING GEARS TURN OPPOSITE WAYS. {ARROWS} PICK A SLOT, {CONFIRM} DROP THE GEAR. JAM IT!', touch: 'TOUCHING GEARS TURN OPPOSITE WAYS. TAP A SLOT TO DROP THE GEAR. JAM IT!' },
  { keys: '{CONFIRM} WHEN THE PENDULUM CROSSES THE GREEN: LOCK THREE PINS!', touch: 'TAP WHEN THE PENDULUM CROSSES THE GREEN: LOCK THREE PINS!' },
];

const HINTS = [
  'HINT: TURN THE GLOWING PIPE UNTIL THE MANA FLOWS INTO IT.',
  'HINT: THREE GEARS ALL TOUCHING EACH OTHER CAN\'T TURN. FIND THE SLOT THAT MAKES A TRIANGLE.',
  'HINT: THE GREEN ZONE IS WIDER NOW, AND THE SWING SLOWER. TAP RIGHT IN THE MIDDLE.',
];

/**
 * THE SPELL ENGINE (Chapter 6): Grey Matter inside the clock tower's
 * mechanism, three small puzzles about thinking, not the clock (Gwen holds
 * the transformation open; the level freezes the timer). Reroute the mana
 * pipes into the drain, jam the gear train with a ring of three, and time
 * the pendulum to lock the escapement. Tap or keys; hints after a while.
 * Launched over the level (which keeps running underneath, holding Ben).
 */
export class SpellEngineScene extends Phaser.Scene {
  private opts!: SpellEngineData;
  private stage = 0;
  private stuckMs = 0;
  private hinted = false;
  private hintShown = false;
  private finished = false;
  private stageRoot: Phaser.GameObjects.Container | null = null;
  private label!: Phaser.GameObjects.BitmapText;
  private help!: Phaser.GameObjects.BitmapText;
  private hintText!: Phaser.GameObjects.BitmapText;
  private gm!: Phaser.GameObjects.Sprite;
  private dots: Phaser.GameObjects.Arc[] = [];
  private time0 = 0;
  // Pipes.
  private board: PipeBoard | null = null;
  private tiles: Phaser.GameObjects.Image[] = [];
  private cursor = 0;
  private cursorBox: Phaser.GameObjects.Rectangle | null = null;
  private hintBox: Phaser.GameObjects.Rectangle | null = null;
  private core: Phaser.GameObjects.Image | null = null;
  private wetCount = 0;
  // Gears.
  private gearImgs = new Map<string, Phaser.GameObjects.Image>();
  private slotImgs = new Map<string, Phaser.GameObjects.Image>();
  private spare: Phaser.GameObjects.Image | null = null;
  private spareAt: string | null = null;
  private slotCursor = 0;
  private jamT = -1;
  // Pendulum.
  private bob: Phaser.GameObjects.Container | null = null;
  private zone: Phaser.GameObjects.Graphics | null = null;
  private pins: Phaser.GameObjects.Image[] = [];
  private lever: Phaser.GameObjects.Image | null = null;
  private pinsLocked = 0;
  private swingT = 0;
  private periodMs: number = PENDULUM.periodMs;
  private windowRad: number = PENDULUM.windowRad;
  private cooldown = 0;

  constructor() {
    super(SCENES.spellEngine);
  }

  create(data: SpellEngineData): void {
    this.opts = data;
    this.stage = data.startStage;
    this.finished = false;
    this.hinted = false;
    this.dots = [];
    const frame = frameView(this);
    const w = this.scale.width;
    this.add.rectangle(frame.left, 0, w, GAME_HEIGHT, 0x07050c, 0.92).setOrigin(0, 0);
    this.add.tileSprite(frame.left, 0, w, GAME_HEIGHT, CH6_TEX.clockworkWall).setOrigin(0, 0).setAlpha(0.25);
    // A brass frame around the works.
    this.add.rectangle(GAME_WIDTH / 2, 186, 420, 220, 0x000000, 0).setStrokeStyle(3, 0xa87a2a, 1);
    pixelText(this, GAME_WIDTH / 2, 22, 'THE SPELL ENGINE', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.greymatter });
    this.label = pixelText(this, GAME_WIDTH / 2, 48, '', { originX: 0.5, originY: 0.5, color: PALETTE.cream });
    this.help = pixelText(this, GAME_WIDTH / 2, 316, '', { originX: 0.5, originY: 0.5, color: PALETTE.white, maxWidth: 560, align: 'center' });
    this.hintText = pixelText(this, GAME_WIDTH / 2, 340, '', { originX: 0.5, originY: 0.5, color: PALETTE.gold, maxWidth: 580, align: 'center' });
    for (let i = 0; i < STAGES.length; i++) this.dots.push(this.add.circle(GAME_WIDTH / 2 - 16 + i * 16, 64, 4, 0x3a3440));
    this.gm = this.add.sprite(110, 290, GREYMATTER_TEX.sheet, 0).setOrigin(0.5, 1).setScale(2).play('greymatter-idle');

    const kb = this.input.keyboard!;
    const move = (dx: number, dy: number) => this.move(dx, dy);
    kb.on('keydown-LEFT', () => move(-1, 0));
    kb.on('keydown-A', () => move(-1, 0));
    kb.on('keydown-RIGHT', () => move(1, 0));
    kb.on('keydown-D', () => move(1, 0));
    kb.on('keydown-UP', () => move(0, -1));
    kb.on('keydown-W', () => move(0, -1));
    kb.on('keydown-DOWN', () => move(0, 1));
    kb.on('keydown-S', () => move(0, 1));
    for (const key of ['ENTER', 'SPACE', 'J', 'X']) kb.on(`keydown-${key}`, () => this.confirm());
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => this.tap(p));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.removeAllListeners();
      this.input.removeAllListeners();
    });
    this.buildStage();
  }

  /** The level is paused (its menu is up): the puzzle waits. */
  private get live(): boolean {
    return this.scene.isActive(SCENES.level) && !this.finished;
  }

  private buildStage(): void {
    this.stageRoot?.destroy();
    this.stageRoot = this.add.container(0, 0);
    this.stuckMs = 0;
    this.hintShown = false;
    this.hintText.setText('');
    this.time0 = 0;
    this.dots.forEach((d, i) => d.setFillStyle(i < this.stage ? PALETTE.greymatter : i === this.stage ? PALETTE.cream : 0x3a3440));
    this.label.setText(`${this.stage + 1}/3: ${STAGES[this.stage]}`);
    const ins = INSTRUCTIONS[this.stage];
    this.help.setText(inputMode.format(inputMode.current === 'touch' ? ins.touch : ins.keys));
    if (this.stage === 0) this.buildPipes();
    else if (this.stage === 1) this.buildGears();
    else this.buildPendulum();
  }

  // ------------------------------------------------------------ Stage 1: pipes

  private get boardX(): number {
    return GAME_WIDTH / 2 - (5 * TILE) / 2;
  }

  private readonly boardY = 100;

  private buildPipes(): void {
    const root = this.stageRoot!;
    this.board = newPipeBoard();
    this.tiles = [];
    const b = this.board;
    for (let i = 0; i < b.tiles.length; i++) {
      const x = this.boardX + (i % b.cols) * TILE + TILE / 2;
      const y = this.boardY + Math.floor(i / b.cols) * TILE + TILE / 2;
      const img = this.add.image(x, y, CH6_TEX.pipe, 0).setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.turn(i));
      root.add(img);
      this.tiles.push(img);
    }
    // The Charm's mana comes in on the left; the Engine waits top right; the drain bottom right.
    root.add(this.add.image(this.boardX - 20, this.boardY + b.inletRow * TILE + TILE / 2, CH6_TEX.charm, 0).setScale(2.5));
    root.add(pixelText(this, this.boardX - 20, this.boardY + b.inletRow * TILE - 6, 'CHARM', { originX: 0.5, originY: 1, color: PALETTE.mana }));
    this.core = this.add.image(this.boardX + b.cols * TILE + 30, this.boardY + TILE / 2, CH6_TEX.engineCore);
    root.add(this.core);
    root.add(pixelText(this, this.core.x, this.core.y + 28, 'ENGINE', { originX: 0.5, originY: 0, color: PALETTE.hex }));
    const drainY = this.boardY + b.outletRow * TILE + TILE / 2;
    root.add(this.add.image(this.boardX + b.cols * TILE + 24, drainY, CH6_TEX.drain).setAngle(-90));
    root.add(pixelText(this, this.boardX + b.cols * TILE + 24, drainY + 24, 'DRAIN', { originX: 0.5, originY: 0, color: PALETTE.greymatter }));
    this.cursor = b.inletRow * b.cols;
    this.cursorBox = this.add.rectangle(0, 0, TILE - 2, TILE - 2, 0, 0).setStrokeStyle(2, PALETTE.greymatter, 1);
    this.hintBox = this.add.rectangle(0, 0, TILE + 2, TILE + 2, 0, 0).setStrokeStyle(2, PALETTE.gold, 1).setVisible(false);
    root.add([this.cursorBox, this.hintBox]);
    this.wetCount = 0;
    this.refreshPipes();
    this.placeCursor();
  }

  private turn(i: number): void {
    if (!this.live || !this.board || this.stage !== 0) return;
    this.cursor = i;
    turnPipe(this.board, i);
    playSfx('uiMove', 0.8, 1.2);
    const img = this.tiles[i];
    this.tweens.add({ targets: img, scale: { from: 0.85, to: 1 }, duration: 120 });
    this.hopTo(img.x, this.boardY - 2);
    this.refreshPipes();
    this.placeCursor();
  }

  private refreshPipes(): void {
    const b = this.board!;
    const wet = flooded(b);
    b.tiles.forEach((t, i) => {
      const kind = t.kind === 'straight' ? 0 : t.kind === 'elbow' ? 1 : 2;
      this.tiles[i].setFrame(kind + (wet.has(i) ? 3 : 0)).setAngle(t.rot * 90);
    });
    // Progress (more mana flowing) resets the hint clock.
    if (wet.size > this.wetCount) this.stuckMs = 0;
    this.wetCount = wet.size;
    // Mana reaching the top right flows into the Engine: it glows hungrily.
    const feeding = wet.has(b.cols - 1) && openings(b.tiles[b.cols - 1]).includes(1);
    this.core?.setTint(feeding ? PALETTE.white : 0xffffff).setScale(feeding ? 1.15 : 1);
    if (pipesSolved(b)) this.solved();
  }

  private placeCursor(): void {
    const img = this.tiles[this.cursor];
    if (img && this.cursorBox) this.cursorBox.setPosition(img.x, img.y).setVisible(inputMode.current !== 'touch');
  }

  // ------------------------------------------------------------ Stage 2: gears

  private readonly gearOx = GAME_WIDTH / 2 - 193;
  private readonly gearOy = 96;

  private buildGears(): void {
    const root = this.stageRoot!;
    this.gearImgs.clear();
    this.slotImgs.clear();
    this.jamT = -1;
    for (const s of GEAR_LAYOUT.slots) {
      const x = this.gearOx + s.x;
      const y = this.gearOy + s.y;
      if (GEAR_LAYOUT.filled.includes(s.id)) {
        const img = this.add.image(x, y, CH6_TEX.gear, 0).setScale(s.r / 20);
        root.add(img);
        this.gearImgs.set(s.id, img);
      } else {
        const slot = this.add.image(x, y, CH6_TEX.gearSlot).setScale(s.r / 18).setInteractive({ useHandCursor: true });
        slot.on('pointerdown', () => this.dropGear(s.id));
        root.add(slot);
        this.slotImgs.set(s.id, slot);
      }
    }
    const drive = GEAR_LAYOUT.slots[0];
    root.add(this.add.image(this.gearOx + drive.x - 46, this.gearOy + drive.y, CH6_TEX.engineCore).setScale(0.8));
    root.add(pixelText(this, this.gearOx + drive.x - 46, this.gearOy + drive.y + 24, 'ENGINE', { originX: 0.5, originY: 0, color: PALETTE.hex }));
    // Grey Matter carries the spare gear.
    this.spare = this.add.image(this.gm.x, this.gm.y - 44, CH6_TEX.gear, 1).setScale(0.7);
    root.add(this.spare);
    this.spareAt = null;
    this.slotCursor = 0;
    this.cursorBox = this.add.rectangle(0, 0, 40, 40, 0, 0).setStrokeStyle(2, PALETTE.greymatter, 1);
    this.hintBox = this.add.rectangle(0, 0, 44, 44, 0, 0).setStrokeStyle(2, PALETTE.gold, 1).setVisible(false);
    root.add([this.cursorBox, this.hintBox]);
    this.placeSlotCursor();
  }

  private dropGear(id: string): void {
    if (!this.live || this.stage !== 1 || this.jamT >= 0) return;
    const slot = GEAR_LAYOUT.slots.find((s) => s.id === id)!;
    const x = this.gearOx + slot.x;
    const y = this.gearOy + slot.y;
    this.spareAt = id;
    this.slotCursor = GEAR_LAYOUT.empty.indexOf(id);
    this.hopTo(x, y + slot.r + 4);
    this.tweens.add({ targets: this.spare, x, y, scale: slot.r / 20, duration: 260, ease: 'Back.Out' });
    playSfx(MAGIC_SFX.clang, 0.6, 1.3);
    this.placeSlotCursor();
    const spin = gearSpin(new Set([...GEAR_LAYOUT.filled, id]));
    if (spin.jammed) {
      this.jamT = 0;
      playSfx(MAGIC_SFX.slam, 0.9, 1.3);
      shakeCamera(this.cameras.main, 260, 0.006);
    } else {
      this.hintText.setText(this.hintShown ? HINTS[1] : 'IT JUST TURNS ALONG. THE ENGINE KEEPS RUNNING...');
    }
  }

  private placeSlotCursor(): void {
    const id = GEAR_LAYOUT.empty[this.slotCursor];
    const slot = GEAR_LAYOUT.slots.find((s) => s.id === id);
    if (slot && this.cursorBox) this.cursorBox.setPosition(this.gearOx + slot.x, this.gearOy + slot.y).setVisible(inputMode.current !== 'touch');
  }

  private updateGears(dt: number): void {
    const filled = new Set<string>(GEAR_LAYOUT.filled);
    if (this.spareAt) filled.add(this.spareAt);
    const { spin, jammed } = gearSpin(filled);
    for (const s of GEAR_LAYOUT.slots) {
      const img = s.id === this.spareAt ? this.spare : this.gearImgs.get(s.id);
      if (!img) continue;
      // Smaller gears turn faster, as real ones do.
      const v = (spin.get(s.id) ?? 0) * (2.2 / s.r) * dt * 6;
      img.angle += v;
      if (jammed) img.setPosition(this.gearOx + s.x + (Math.random() - 0.5) * 2, this.gearOy + s.y + (Math.random() - 0.5) * 2);
    }
    if (this.jamT >= 0) {
      this.jamT += dt;
      if (this.jamT > 400 && this.jamT - dt <= 400) this.hintText.setText('JAMMED! THREE GEARS IN A RING CAN\'T TURN AT ALL.');
      if (this.jamT >= 1300) this.solved();
    }
  }

  // ------------------------------------------------------------ Stage 3: the pendulum

  private buildPendulum(): void {
    const root = this.stageRoot!;
    const px = GAME_WIDTH / 2;
    const py = 86;
    this.pinsLocked = 0;
    this.swingT = 0;
    this.periodMs = PENDULUM.periodMs;
    this.windowRad = PENDULUM.windowRad;
    this.zone = this.add.graphics();
    root.add(this.zone);
    this.drawZone();
    const rod = this.add.rectangle(0, 0, 3, 150, 0xa87a2a).setOrigin(0.5, 0);
    const bobImg = this.add.circle(0, 158, 14, 0xe0b04a).setStrokeStyle(2, 0x6a4a1a);
    this.bob = this.add.container(px, py, [rod, bobImg]);
    root.add(this.bob);
    root.add(this.add.circle(px, py, 5, 0xe0b04a));
    this.lever = this.add.image(px + 150, 270, CH6_TEX.lever, 0).setOrigin(0.5, 1).setScale(1.5);
    root.add(this.lever);
    this.pins = [];
    for (let i = 0; i < PENDULUM.pins; i++) {
      root.add(this.add.rectangle(px - 20 + i * 20, 286, 10, 18, 0x1a1420).setStrokeStyle(1, 0x6a4a1a));
      const pin = this.add.image(px - 20 + i * 20, 286, CH6_TEX.pin).setVisible(false);
      root.add(pin);
      this.pins.push(pin);
    }
    this.hopTo(px + 120, 290);
  }

  /** The green window the bob must be in: an arc under the pivot. Redrawn only when it changes. */
  private drawZone(): void {
    const g = this.zone!;
    const px = GAME_WIDTH / 2;
    const py = 86;
    g.clear();
    g.lineStyle(10, PALETTE.greymatter, 0.35);
    g.beginPath();
    g.arc(px, py, 158, Math.PI / 2 - this.windowRad, Math.PI / 2 + this.windowRad);
    g.strokePath();
    g.lineStyle(1, 0xa87a2a, 0.6);
    g.beginPath();
    g.arc(px, py, 158, Math.PI / 2 - PENDULUM.amplitude, Math.PI / 2 + PENDULUM.amplitude);
    g.strokePath();
  }

  private pull(): void {
    if (!this.live || this.stage !== 2 || this.cooldown > 0 || this.pinsLocked >= PENDULUM.pins) return;
    this.cooldown = 350;
    this.lever?.setFrame(1);
    this.time.delayedCall(200, () => this.lever?.setFrame(0));
    this.gm.play('greymatter-scan', true);
    const a = pendulumAngle(this.swingT, this.periodMs);
    if (pinDrops(a, this.windowRad)) {
      const pin = this.pins[this.pinsLocked];
      pin.setVisible(true).setY(250);
      this.tweens.add({ targets: pin, y: 286, duration: 180, ease: 'Bounce.Out' });
      this.pinsLocked++;
      this.stuckMs = 0;
      playSfx(MAGIC_SFX.clunk, 0.9, 1.1 + this.pinsLocked * 0.1);
      shakeCamera(this.cameras.main, 120, 0.004);
      this.windowRad *= PENDULUM.tighten;
      this.periodMs *= PENDULUM.quicken;
      this.drawZone();
      if (this.pinsLocked >= PENDULUM.pins) this.time.delayedCall(500, () => this.solved());
    } else {
      playSfx('beepFinal', 0.4, 0.6);
      this.hintText.setText(a < 0 ? 'TOO EARLY! WAIT FOR THE GREEN.' : 'TOO LATE! WAIT FOR THE GREEN.');
    }
  }

  // ------------------------------------------------------------ Input

  private move(dx: number, dy: number): void {
    if (!this.live) return;
    inputMode.set('keyboard');
    if (this.stage === 0 && this.board) {
      const b = this.board;
      const x = Phaser.Math.Clamp((this.cursor % b.cols) + dx, 0, b.cols - 1);
      const y = Phaser.Math.Clamp(Math.floor(this.cursor / b.cols) + dy, 0, b.rows - 1);
      this.cursor = y * b.cols + x;
      this.placeCursor();
    } else if (this.stage === 1) {
      const n = GEAR_LAYOUT.empty.length;
      this.slotCursor = (this.slotCursor + (dx || dy) + n) % n;
      this.placeSlotCursor();
    }
    playSfx('uiMove', 0.4);
  }

  private confirm(): void {
    if (!this.live) return;
    inputMode.set('keyboard');
    if (this.stage === 0) this.turn(this.cursor);
    else if (this.stage === 1) this.dropGear(GEAR_LAYOUT.empty[this.slotCursor]);
    else this.pull();
  }

  /** Taps on pieces are handled by the pieces; in the pendulum stage a tap anywhere pulls the lever. */
  private tap(p: Phaser.Input.Pointer): void {
    if (p.wasTouch) inputMode.set('touch');
    if (this.stage === 2) this.pull();
  }

  /** Grey Matter hops over to where he's working. */
  private hopTo(x: number, feetY: number): void {
    this.tweens.killTweensOf(this.gm);
    const fromY = this.gm.y;
    this.gm.setFlipX(x < this.gm.x).play('greymatter-run', true);
    this.tweens.add({
      targets: this.gm,
      x,
      duration: 260,
      onUpdate: (tw) => this.gm.setY(Phaser.Math.Linear(fromY, feetY, tw.progress) - Math.sin(tw.progress * Math.PI) * 18),
      onComplete: () => this.gm.play('greymatter-idle', true),
    });
  }

  private solved(): void {
    if (this.finished) return;
    playSfx('sumoWin', 0.7, 1.2);
    flashCamera(this.cameras.main, 160, 160, 255, 120);
    this.gm.setFrame(13);
    if (this.stage < STAGES.length - 1) {
      this.stage++;
      this.opts.onStage(this.stage);
      this.time.delayedCall(700, () => this.buildStage());
      return;
    }
    this.finished = true;
    this.label.setText('ENGINE JAMMED!');
    this.dots.forEach((d) => d.setFillStyle(PALETTE.greymatter));
    this.time.delayedCall(1100, () => {
      this.opts.onDone(this.hinted);
      this.scene.stop();
    });
  }

  override update(_time: number, delta: number): void {
    if (!this.live) return;
    this.time0 += delta;
    this.cooldown = Math.max(0, this.cooldown - delta);
    this.stuckMs += delta;
    const hintAfter = activeDifficultyId() === 'easy' ? CH6_BEATS.engine.hintAfterEasyMs : CH6_BEATS.engine.hintAfterMs;
    if (!this.hintShown && this.stuckMs >= hintAfter) this.showHint();
    if (this.stage === 0 && this.hintShown && this.board && this.hintBox) {
      const i = pipeHint(this.board);
      if (i !== null) this.hintBox.setPosition(this.tiles[i].x, this.tiles[i].y).setVisible(Math.floor(this.time0 / 250) % 2 === 0);
    }
    if (this.stage === 1) this.updateGears(delta);
    if (this.stage === 2 && this.bob) {
      this.swingT += delta;
      this.bob.setRotation(pendulumAngle(this.swingT, this.periodMs));
    }
  }

  private showHint(): void {
    this.hintShown = true;
    this.hinted = true;
    this.hintText.setText(HINTS[this.stage]);
    if (this.stage === 1 && this.hintBox) {
      const s = GEAR_LAYOUT.slots.find((g) => g.id === GEAR_LAYOUT.answer)!;
      this.hintBox.setPosition(this.gearOx + s.x, this.gearOy + s.y).setVisible(true);
    } else if (this.stage === 2) {
      this.windowRad *= PENDULUM.hintWindow;
      this.periodMs *= PENDULUM.hintSlow;
      this.drawZone();
    }
  }
}
