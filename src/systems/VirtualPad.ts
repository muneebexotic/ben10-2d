/**
 * On-screen controls as plain state. The Touch scene writes it, InputMap reads
 * it alongside the keyboard, so gameplay never knows which one was used.
 */
export type PadButton = 'jump' | 'attack' | 'special' | 'transform' | 'pause' | 'dialPrev' | 'dialNext';

export interface StickDirections {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface StickTuning {
  radius: number;
  deadZone: number;
  upSlope: number;
  downSlope: number;
}

/**
 * Maps a stick offset to directions. Sideways wins near the horizon so running
 * never accidentally aims up or drops through a platform.
 */
export function stickDirections(dx: number, dy: number, t: StickTuning): StickDirections {
  const dead = t.radius * t.deadZone;
  const out = { left: false, right: false, up: false, down: false };
  if (Math.hypot(dx, dy) < dead) return out;
  if (Math.abs(dx) >= dead * 0.75) {
    out.left = dx < 0;
    out.right = dx > 0;
  }
  if (dy < -dead && -dy >= Math.abs(dx) * t.upSlope) out.up = true;
  if (dy > dead && dy >= Math.abs(dx) * t.downSlope) out.down = true;
  return out;
}

class VirtualPad {
  readonly stick: StickDirections = { left: false, right: false, up: false, down: false };
  private readonly held = new Set<PadButton>();
  private readonly latched = new Set<PadButton>();
  private anyTap = false;
  /** How long the Omnitrix button was held before its tap fired (touch transforms on release). */
  transformLeadMs = 0;

  press(button: PadButton): void {
    this.held.add(button);
    this.latched.add(button);
  }

  release(button: PadButton): void {
    this.held.delete(button);
  }

  isHeld(button: PadButton): boolean {
    return this.held.has(button);
  }

  /** True once per press. */
  consume(button: PadButton): boolean {
    const hit = this.latched.has(button);
    this.latched.delete(button);
    return hit;
  }

  /** Any touch on the screen (skips cinematics). */
  tap(): void {
    this.anyTap = true;
  }

  consumeTap(): boolean {
    const hit = this.anyTap;
    this.anyTap = false;
    return hit;
  }

  setStick(d: StickDirections): void {
    this.stick.left = d.left;
    this.stick.right = d.right;
    this.stick.up = d.up;
    this.stick.down = d.down;
  }

  reset(): void {
    this.held.clear();
    this.latched.clear();
    this.anyTap = false;
    this.transformLeadMs = 0;
    this.setStick({ left: false, right: false, up: false, down: false });
  }
}

export const pad = new VirtualPad();
