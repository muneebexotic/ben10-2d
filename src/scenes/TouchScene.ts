import Phaser from 'phaser';
import { TOUCH } from '../config/touch';
import { PALETTE } from '../config/palette';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { getSettings } from '../systems/Settings';
import { pad, stickDirections, type PadButton } from '../systems/VirtualPad';
import { TouchButton, TouchDial, TouchStick } from '../ui/TouchControls';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';

type ButtonId = 'jump' | 'attack' | 'special' | 'pause';

type Track =
  | { kind: 'stick' }
  | { kind: 'button'; id: ButtonId }
  | { kind: 'dial'; startX: number; downAt: number; swiped: boolean }
  | { kind: 'tap' };

const PAD_BUTTON: Record<ButtonId, PadButton> = { jump: 'jump', attack: 'attack', special: 'special', pause: 'pause' };

/**
 * On-screen controls layered over the level and HUD. Only writes the shared
 * virtual pad; gameplay reads it through InputMap like a keyboard.
 */
export class TouchScene extends Phaser.Scene {
  private stick!: TouchStick;
  private buttons!: Record<ButtonId, TouchButton>;
  private dial!: TouchDial;
  private readonly tracks = new Map<number, Track>();
  private cinematic = false;
  private hudVisible = true;
  private omnitrixVisible = false;
  private levelRunning = true;

  constructor() {
    super(SCENES.touch);
  }

  create(): void {
    this.tracks.clear();
    this.cinematic = false;
    this.hudVisible = true;
    this.omnitrixVisible = false;
    this.levelRunning = true;
    pad.reset();

    const B = TOUCH.buttons;
    this.stick = new TouchStick(this);
    this.buttons = {
      jump: new TouchButton(this, B.jump.x, B.jump.y, B.jump.r, TEX.touchJump, 'JUMP', PALETTE.omnitrix),
      attack: new TouchButton(this, B.attack.x, B.attack.y, B.attack.r, TEX.touchPunch, 'ATTACK', PALETTE.fire1),
      special: new TouchButton(this, B.special.x, B.special.y, B.special.r, TEX.touchRoll, 'SPECIAL', PALETTE.jammer),
      pause: new TouchButton(this, B.pause.x, B.pause.y, B.pause.r, TEX.touchPause, '', PALETTE.uiDim),
    };
    this.dial = new TouchDial(this, B.omnitrix.x, B.omnitrix.y, B.omnitrix.r);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => this.onUp(p));
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, (p: Phaser.Input.Pointer) => this.onUp(p));

    const on = EventBus.on.bind(EventBus);
    on('hud:letterbox', (p) => {
      this.cinematic = p.visible;
      if (p.visible) this.releaseAll();
    }, this);
    on('hud:visible', (p) => {
      this.hudVisible = p.visible;
      if (p.omnitrix !== undefined) this.omnitrixVisible = p.omnitrix && p.visible;
    }, this);
    on('omnitrix:acquired', () => (this.omnitrixVisible = true), this);
    on('omnitrix:tick', (t) => this.dial.setTick(t), this);
    on('omnitrix:dial', (p) => this.dial.nudge(p.direction), this);
    on('alien:transformed', () => this.setFormIcons(true), this);
    on('alien:reverted', () => this.setFormIcons(false), this);
    on('hud:reset', () => {
      this.setFormIcons(false);
      this.releaseAll();
    }, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.offContext(this);
      this.releaseAll();
    });
    this.scene.bringToTop();
    this.refreshVisibility();
    // Like the HUD, this scene starts a frame after the level: ask for the current letterbox/HUD state.
    EventBus.emit('hud:ready');
  }

  private get enabled(): boolean {
    const mode = getSettings().touchControls;
    return mode === 'on' || (mode === 'auto' && inputMode.current === 'touch');
  }

  private setFormIcons(alien: boolean): void {
    this.buttons.attack.setIcon(alien ? TEX.touchFire : TEX.touchPunch);
    this.buttons.special.setIcon(alien ? TEX.touchBurst : TEX.touchRoll);
  }

  // ------------------------------------------------------------ Pointers

  private onDown(p: Phaser.Input.Pointer): void {
    if (p.wasTouch) inputMode.set('touch');
    if (!this.levelRunning) return;
    // Any touch skips cinematics, wherever it lands.
    pad.tap();
    if (!this.enabled || !this.hudVisible || this.cinematic) {
      this.tracks.set(p.id, { kind: 'tap' });
      return;
    }

    if (this.omnitrixVisible && this.dial.contains(p.x, p.y) < this.nearestButton(p.x, p.y).score) {
      this.tracks.set(p.id, { kind: 'dial', startX: p.x, downAt: performance.now(), swiped: false });
      this.dial.setPressed(true);
      return;
    }
    const hit = this.nearestButton(p.x, p.y);
    if (hit.id) {
      this.tracks.set(p.id, { kind: 'button', id: hit.id });
      this.buttons[hit.id].setPressed(true);
      pad.press(PAD_BUTTON[hit.id]);
      return;
    }
    if (p.x < TOUCH.stick.zoneRight && p.y > TOUCH.stick.zoneTop && !this.stickInUse()) {
      this.tracks.set(p.id, { kind: 'stick' });
      this.stick.grab(p.x, p.y, this.scale.width, this.scale.height);
      return;
    }
    this.tracks.set(p.id, { kind: 'tap' });
  }

  private onMove(p: Phaser.Input.Pointer): void {
    const track = this.tracks.get(p.id);
    if (!track || !p.isDown) return;
    if (track.kind === 'stick') {
      const { dx, dy } = this.stick.drag(p.x, p.y);
      pad.setStick(stickDirections(dx, dy, TOUCH.stick));
    } else if (track.kind === 'button') {
      // Sliding a thumb from one button to its neighbour switches buttons (jump into attack, etc.).
      const hit = this.nearestButton(p.x, p.y);
      if (hit.id && hit.id !== track.id && hit.id !== 'pause' && track.id !== 'pause') {
        this.buttons[track.id].setPressed(false);
        pad.release(PAD_BUTTON[track.id]);
        track.id = hit.id;
        this.buttons[hit.id].setPressed(true);
        pad.press(PAD_BUTTON[hit.id]);
      }
    } else if (track.kind === 'dial') {
      const dx = p.x - track.startX;
      if (Math.abs(dx) >= TOUCH.swipePx) {
        track.swiped = true;
        track.startX = p.x;
        const button: PadButton = dx > 0 ? 'dialNext' : 'dialPrev';
        pad.press(button);
        pad.release(button);
      }
    }
  }

  private onUp(p: Phaser.Input.Pointer): void {
    const track = this.tracks.get(p.id);
    this.tracks.delete(p.id);
    if (!track) return;
    if (track.kind === 'stick') {
      this.stick.release();
      pad.setStick({ left: false, right: false, up: false, down: false });
    } else if (track.kind === 'button') {
      this.buttons[track.id].setPressed(false);
      pad.release(PAD_BUTTON[track.id]);
    } else if (track.kind === 'dial') {
      this.dial.setPressed(false);
      if (!track.swiped) {
        // A tap transforms on release; the time the finger was down counts toward perfect-transform timing.
        pad.transformLeadMs = performance.now() - track.downAt;
        pad.press('transform');
        pad.release('transform');
      }
    }
  }

  private nearestButton(x: number, y: number): { id: ButtonId | null; score: number } {
    let best: ButtonId | null = null;
    let score = Infinity;
    for (const id of Object.keys(this.buttons) as ButtonId[]) {
      const s = this.buttons[id].contains(x, y);
      if (s < score) {
        score = s;
        best = id;
      }
    }
    return { id: best, score };
  }

  private stickInUse(): boolean {
    for (const t of this.tracks.values()) if (t.kind === 'stick') return true;
    return false;
  }

  private releaseAll(): void {
    this.tracks.clear();
    pad.reset();
    this.stick?.release();
    if (this.buttons) for (const b of Object.values(this.buttons)) b.setPressed(false);
    this.dial?.setPressed(false);
  }

  // ------------------------------------------------------------ Frame

  private refreshVisibility(): void {
    // Cinematics hide the controls completely; a tap anywhere skips them.
    const show = this.enabled && this.levelRunning && this.hudVisible && !this.cinematic;
    this.stick.root.setVisible(show);
    for (const b of Object.values(this.buttons)) b.root.setVisible(show);
    this.dial.root.setVisible(show && this.omnitrixVisible);
  }

  override update(time: number): void {
    const active = this.scene.isActive(SCENES.level);
    if (active !== this.levelRunning) {
      // Paused (menu, game over): hide, and never let a held button leak into the resumed game.
      this.levelRunning = active;
      this.releaseAll();
    }
    this.refreshVisibility();
    this.stick.applyAlpha(this.stickInUse());
    for (const b of Object.values(this.buttons)) b.applyAlpha();
    this.dial.applyAlpha();
    this.dial.update(time);
  }
}
