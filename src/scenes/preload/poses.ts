/** Shared character rig: limb poses and the run cycle every procedural sprite is drawn from. */

export interface LegPose {
  footX: number;
  lift: number;
}

export interface ArmPose {
  hx: number;
  hy: number;
}

export interface Pose {
  bob: number;
  lean: number;
  front: LegPose;
  back: LegPose;
  frontArm: ArmPose;
  backArm: ArmPose;
  fist?: boolean;
  eyesClosed?: boolean;
  mouthOpen?: boolean;
  glow?: number;
}

const RUN_FOOT = [3, 1, -1, -3, -1, 1];
const RUN_LIFT = [0, 0, 0, 1, 3, 2];
const RUN_BOB = [1, 0, 0, 1, 0, 0];

/** Frame `i` (0-5) of a six-frame run cycle; `stride` scales foot travel. */
export function runPose(i: number, stride: number): Pose {
  const b = (i + 3) % 6;
  const fx = Math.round(RUN_FOOT[i] * stride);
  const bx = Math.round(RUN_FOOT[b] * stride);
  return {
    bob: RUN_BOB[i],
    lean: 1,
    front: { footX: fx, lift: RUN_LIFT[i] },
    back: { footX: bx, lift: RUN_LIFT[b] },
    frontArm: { hx: -Math.round(fx * 0.9), hy: 5 - Math.abs(Math.round(fx / 2)) },
    backArm: { hx: -Math.round(bx * 0.9), hy: 5 - Math.abs(Math.round(bx / 2)) },
  };
}

/** Draws a thick limb from (sx, sy) along (dx, dy) with a square brush. */
export function limb(
  rect: (x: number, y: number, w: number, h: number, color: number) => unknown,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  thickness: number,
  color: number,
): void {
  const steps = Math.ceil(Math.max(1, Math.hypot(dx, dy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    rect(Math.round(sx + dx * t), Math.round(sy + dy * t), thickness, thickness, color);
  }
}
