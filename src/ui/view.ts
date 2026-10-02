import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_MAX_WIDTH, GAME_WIDTH } from '../config/constants';

/**
 * Wide screens. The game is laid out on a 640x360 frame; with EXPAND scaling a
 * wide phone gets a wider view (up to GAME_MAX_WIDTH). Menus and the HUD keep
 * their frame layout centred by sliding the camera, and anything pinned to an
 * edge (BACK, the timer, the touch buttons) moves out to the real edge.
 */

/** Current view width in game pixels (640 up to GAME_MAX_WIDTH). */
export function viewWidth(scene: Phaser.Scene): number {
  return Math.max(GAME_WIDTH, Math.floor(scene.scale.width));
}

export function viewHeight(scene: Phaser.Scene): number {
  return Math.floor(scene.scale.height) || GAME_HEIGHT;
}

/** How far the view reaches past the 640 frame on each side. */
export function sideMargin(scene: Phaser.Scene): number {
  return Math.floor((viewWidth(scene) - GAME_WIDTH) / 2);
}

/** Left edge of anything that should cover every possible view, in frame coordinates. */
export const COVER_X = -Math.ceil((GAME_MAX_WIDTH - GAME_WIDTH) / 2);
/** Width that covers the widest possible view. */
export const COVER_W = GAME_MAX_WIDTH + 2;

type Edge = 'left' | 'right';

interface Pin {
  target: { x: number; setX(x: number): unknown; active?: boolean };
  edge: Edge;
  inset: number;
}

/**
 * Keeps a scene's 640 frame centred on any view width and pins objects to the
 * real screen edges. Re-applies itself whenever the view is resized.
 */
export class ViewFrame {
  private readonly pins: Pin[] = [];
  private readonly listeners: Array<(width: number) => void> = [];
  private width = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly slideCamera = true) {
    const onResize = () => this.apply();
    scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
    this.apply();
  }

  /** Pins an object `inset` pixels from the left or right screen edge (frame coordinates follow). */
  pin<T extends Pin['target']>(target: T, edge: Edge, inset: number): T {
    this.pins.push({ target, edge, inset });
    this.place(this.pins[this.pins.length - 1]);
    return target;
  }

  /** Called with the new view width now and after every resize. */
  onResize(cb: (width: number) => void): void {
    this.listeners.push(cb);
    cb(this.width);
  }

  /** Frame x of the left screen edge (0 or negative on wide screens). */
  get left(): number {
    return this.slideCamera ? -sideMargin(this.scene) : 0;
  }

  /** Frame x of the right screen edge. */
  get right(): number {
    return this.left + viewWidth(this.scene);
  }

  private apply(): void {
    const scene = this.scene;
    if (!scene.cameras?.main) return;
    this.width = viewWidth(scene);
    if (this.slideCamera) scene.cameras.main.setScroll(-sideMargin(scene), 0);
    for (const p of this.pins) this.place(p);
    for (const cb of this.listeners) cb(this.width);
  }

  private place(p: Pin): void {
    if (p.target.active === false) return;
    p.target.setX(p.edge === 'left' ? this.left + p.inset : this.right - p.inset);
  }
}

const frames = new WeakMap<Phaser.Scene, ViewFrame>();

/**
 * The scene's view frame (created on first use, dropped when the scene shuts
 * down): its 640 frame is centred on wide screens and edge pins follow resizes.
 */
export function frameView(scene: Phaser.Scene): ViewFrame {
  let frame = frames.get(scene);
  if (!frame) {
    frame = new ViewFrame(scene, true);
    frames.set(scene, frame);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => frames.delete(scene));
  }
  return frame;
}
