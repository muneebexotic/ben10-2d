import Phaser from 'phaser';
import { TOUCH } from '../config/touch';
import { PALETTE } from '../config/palette';
import { EventBus } from '../systems/EventBus';
import { inputMode } from '../systems/InputMode';
import { touchControlsOn } from '../systems/Settings';
import { pad, stickDirections, type PadButton } from '../systems/VirtualPad';
import { TouchButton, TouchDial, TouchStick } from '../ui/TouchControls';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { getAlien, getForm, hasAlien, HUMAN_FORM } from '../aliens/registry';
import { RadialPicker } from '../ui/RadialPicker';
import type { OmnitrixTick } from '../systems/events';
import { viewWidth } from '../ui/view';

type ButtonId = 'jump' | 'attack' | 'special' | 'pause';

type Track =
  | { kind: 'stick' }
  | { kind: 'button'; id: ButtonId }
  | { kind: 'dial'; startX: number; startY: number; downAt: number; swiped: boolean; radial: boolean }
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
  private picker!: RadialPicker;
  private tick: OmnitrixTick | null = null;
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
      jump: new TouchButton(this, 0, B.jump.y, B.jump.r, TEX.touchJump, 'JUMP', PALETTE.omnitrix),
      attack: new TouchButton(this, 0, B.attack.y, B.attack.r, TEX.touchPunch, 'ATTACK', PALETTE.fire1),
      special: new TouchButton(this, 0, B.special.y, B.special.r, TEX.touchRoll, 'SPECIAL', PALETTE.jammer),
      pause: new TouchButton(this, 0, B.pause.y, B.pause.r, TEX.touchPause, '', PALETTE.uiDim),
    };
    this.dial = new TouchDial(this, 0, B.omnitrix.y, B.omnitrix.r);
    this.picker = new RadialPicker(this);
    this.layout();
    const onResize = () => this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, onResize));

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
    on('omnitrix:tick', (t) => {
      this.tick = t;
      this.dial.setTick(t);
    }, this);
    on('omnitrix:dial', (p) => this.dial.nudge(p.direction), this);
    on('alien:transformed', (p) => this.setFormIcons(p.alienId), this);
    on('alien:reverted', () => this.setFormIcons(HUMAN_FORM.id), this);
    on('hud:reset', () => {
      this.setFormIcons(HUMAN_FORM.id);
      this.releaseAll();
    }, this);
    // A finger still down when the page loses focus may never send its touchend: drop every hold,
    // or a stale stick track would keep the next thumb from grabbing the stick.
    this.game.events.on(Phaser.Core.Events.BLUR, this.releaseAll, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.releaseAll, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.offContext(this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.releaseAll, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.releaseAll, this);
      this.releaseAll();
    });
    this.scene.bringToTop();
    this.refreshVisibility();
    // Like the HUD, this scene starts a frame after the level: ask for the current letterbox/HUD state.
    EventBus.emit('hud:ready');
  }

  /** Right-hand buttons hug the right edge, whatever the screen's width; pause stays top centre. */
  private layout(): void {
    const w = viewWidth(this);
    const B = TOUCH.buttons;
    this.buttons.jump.moveTo(w - B.jump.right, B.jump.y);
    this.buttons.attack.moveTo(w - B.attack.right, B.attack.y);
    this.buttons.special.moveTo(w - B.special.right, B.special.y);
    // Whole pixels: the baked ring then lands exactly where the drawn one did.
    this.buttons.pause.moveTo(Math.round(w / 2), B.pause.y);
    this.dial.moveTo(w - B.omnitrix.right, B.omnitrix.y);
    this.releaseAll();
  }

  private get enabled(): boolean {
    return touchControlsOn();
  }

  /** ATTACK and SPECIAL show what they do in the current form (fist and roll, fireball and burst...). */
  private setFormIcons(formId: string): void {
    const icons = getForm(formId).touchIcons;
    this.buttons.attack.setIcon(icons.attack);
    this.buttons.special.setIcon(icons.special);
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
      this.tracks.set(p.id, { kind: 'dial', startX: p.x, startY: p.y, downAt: performance.now(), swiped: false, radial: false });
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
    if (p.x < viewWidth(this) * TOUCH.stick.zoneRightFraction && p.y > TOUCH.stick.zoneTop && !this.stickInUse()) {
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
      if (track.radial) {
        this.picker.point(p.x, p.y);
        return;
      }
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
      if (track.radial) {
        // Let go on an alien: pick it and transform (or swap) in one move. In the middle: never mind.
        const slot = this.picker.close();
        if (slot !== null) {
          pad.choose(slot);
          pad.transformLeadMs = 0;
          pad.press('transform');
          pad.release('transform');
        }
      } else if (!track.swiped) {
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
    this.picker?.close();
  }

  /** A held, unswiped Omnitrix opens the radial picker. */
  private checkRadial(): void {
    const now = performance.now();
    for (const track of this.tracks.values()) {
      if (track.kind !== 'dial' || track.swiped || track.radial || now - track.downAt < TOUCH.radial.holdMs) continue;
      const aliens = (this.tick?.unlocked ?? []).filter((id) => hasAlien(id));
      if (aliens.length < 2) continue;
      track.radial = true;
      const stolen = this.tick?.blocked ?? [];
      const items = aliens.map((id) => {
        const a = getAlien(id);
        return stolen.includes(id) ? { icon: a.hudIcon, color: PALETTE.kevinDark, name: 'DNA STOLEN' } : { icon: a.hudIcon, color: a.theme.color, name: a.name };
      });
      this.picker.show(this.dial.x, this.dial.y, items, Math.max(0, aliens.indexOf(this.tick?.selectedId ?? '')));
      this.picker.point(track.startX, track.startY);
    }
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
    this.checkRadial();
  }
}
