import Phaser from 'phaser';
import { CAMERA } from '../../config/constants';

/** Platformer camera: look-ahead in the facing direction, ground-anchored vertical follow, arena lock. */
export class CameraRig {
  private cx = 0;
  private cy = 0;
  private look = 0;
  private groundY = 0;
  private lock: { x: number; y: number } | null = null;

  constructor(private readonly cam: Phaser.Cameras.Scene2D.Camera) {}

  snap(x: number, feetY: number): void {
    this.cx = x;
    this.cy = feetY - CAMERA.verticalOffset;
    this.groundY = feetY;
    this.cam.centerOn(this.cx, this.cy);
  }

  lockTo(x: number, y: number): void {
    this.lock = { x, y };
  }

  unlock(): void {
    this.lock = null;
  }

  get locked(): boolean {
    return this.lock !== null;
  }

  update(x: number, feetY: number, facing: 1 | -1, grounded: boolean, dtMs: number): void {
    const dt = dtMs / 1000;
    let tx: number;
    let ty: number;
    if (this.lock) {
      tx = this.lock.x;
      ty = this.lock.y;
      const k = 1 - Math.exp(-3.5 * dt);
      this.cx += (tx - this.cx) * k;
      this.cy += (ty - this.cy) * k;
    } else {
      this.look += (facing * CAMERA.lookAhead - this.look) * (1 - Math.exp(-2.2 * dt));
      const viewH = this.cam.height / this.cam.zoom;
      const top = this.cy - viewH / 2;
      // Anchor to the ground Ben stands on; follow jumps only near the top of the screen, always follow falls.
      if (grounded || feetY > this.groundY) this.groundY = feetY;
      else if (feetY < top + 80) this.groundY = Math.min(this.groundY, feetY + 60);
      tx = x + this.look;
      ty = this.groundY - CAMERA.verticalOffset;
      this.cx += (tx - this.cx) * (1 - Math.exp(-7 * dt));
      this.cy += (ty - this.cy) * (1 - Math.exp(-4.5 * dt));
    }
    this.cam.centerOn(this.cx, this.cy);
  }
}
