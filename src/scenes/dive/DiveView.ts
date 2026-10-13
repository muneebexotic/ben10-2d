/**
 * What THE DEEP DIVE looks like this frame. The ride's logic (MineDive, in
 * the level) writes it; DiveScene only draws it. Positions are metres: x
 * across the tunnel (0 is the middle track), y up (the floor is -1), z along
 * the track from the station.
 */
export interface DiveSprite {
  key: string;
  frame: number;
  x: number;
  y: number;
  z: number;
  /** Height on screen in metres (its width follows the texture). A beam sets `width` too. */
  size: number;
  width?: number;
  tint?: number;
  alpha?: number;
  flip?: boolean;
  angle?: number;
  additive?: boolean;
}

/** A warning painted on the floor along tracks (a crack racing, a missile's landing spot, the cannon's line). */
export interface DiveWarning {
  lanes: readonly number[];
  from: number;
  to: number;
  color: number;
  edge: number;
  alpha: number;
}

export interface DiveView {
  /** Distance travelled (m) and where the camera is (behind the cart, across, up). */
  travel: number;
  camX: number;
  camY: number;
  camBehind: number;
  /** 0 looking down the track; PI/2 looking at the side wall (the swing in and out of 3D). */
  yaw: number;
  bend: number;
  /** 0 deep in the mine, 1 out over the crystal cavern. */
  cavern: number;
  /** How deep (0-1): crystal veins thicken. */
  depth: number;
  trestle: number;
  /** Up to two gaps in the rails ahead (start, end). */
  gaps: [number, number, number, number];
  /** A red hit flash (0-1). */
  flash: number;
  lamp: number;
  time: number;
  /** The cart: across, how high it's hopped (m), its shake and tilt. */
  cartX: number;
  cartAir: number;
  cartShake: number;
  cartTilt: number;
  /** The rider, from behind (or from the side during the swing). */
  rider: { key: string; frame: number; side: boolean; sideKey: string; sideFrame: number; color: number; ghost: boolean };
  /** A shield in front of the cart (Diamondhead), a phase shimmer (Ghostfreak), a brace glow (Four Arms). */
  aura: 'shield' | 'phase' | 'brace' | 'merge' | 'fly' | 'boost' | 'senses' | 'rocket' | null;
  /** A pool of sprite slots; the first `spriteCount` are drawn this frame. */
  sprites: DiveSprite[];
  spriteCount: number;
  warnings: DiveWarning[];
  warningCount: number;
  /** Speed lines (0-1) and a black fade (0-1). */
  speed: number;
  fade: number;
}

export const DIVE_FOCAL = 1.25;

export function createDiveView(): DiveView {
  return {
    travel: 0,
    camX: 0,
    camY: -0.32,
    camBehind: 1.9,
    yaw: 0,
    bend: 0,
    cavern: 0,
    depth: 0,
    trestle: 1e6,
    gaps: [-1, -1, -1, -1],
    flash: 0,
    lamp: 1,
    time: 0,
    cartX: 0,
    cartAir: 0,
    cartShake: 0,
    cartTilt: 0,
    rider: { key: '', frame: 0, side: false, sideKey: '', sideFrame: 0, color: 0xffffff, ghost: false },
    aura: null,
    sprites: Array.from({ length: 48 }, () => ({ key: '', frame: 0, x: 0, y: 0, z: 0, size: 1 })),
    spriteCount: 0,
    warnings: Array.from({ length: 8 }, () => ({ lanes: [], from: 0, to: 0, color: 0, edge: 0, alpha: 0 })),
    warningCount: 0,
    speed: 0,
    fade: 0,
  };
}

/**
 * Where a world point lands on a screen `w` x `h` px, and how many pixels a
 * metre is there. Returns false behind the camera. Matches the shader.
 */
export function project(v: DiveView, x: number, y: number, z: number, w: number, h: number, out: { x: number; y: number; s: number }): boolean {
  const zr = z - (v.travel - v.camBehind);
  const dx = x + v.bend * zr * zr - v.camX;
  const cy = Math.cos(v.yaw);
  const sy = Math.sin(v.yaw);
  const vx = dx * cy - zr * sy;
  const vz = dx * sy + zr * cy;
  if (vz <= 0.15) return false;
  const half = h / 2;
  const k = (DIVE_FOCAL / vz) * half;
  out.x = w / 2 + vx * k;
  out.y = half - (y - v.camY) * k;
  out.s = k;
  return true;
}
