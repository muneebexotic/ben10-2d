/**
 * What Chapter 8's enemies know beyond the drone world, filled in by the
 * circus's systems: where to leave a puff of fear gas (a popped balloon
 * hound), and when and where Ben last struck (the maze's reflections copy
 * him a beat later).
 */
export interface CircusEnv {
  /** Leaves a puff of fear gas at (x, y) (null outside Chapter 8). */
  gas: ((x: number, y: number) => void) | null;
  /** Ben's last attack: game time, where, which way. */
  lastAttack: { at: number; x: number; y: number; facing: 1 | -1 };
}

export const circusEnv: CircusEnv = { gas: null, lastAttack: { at: -Infinity, x: 0, y: 0, facing: 1 } };

/** Back to the start (a level ending, or a new one starting). */
export function resetCircusEnv(): void {
  circusEnv.gas = null;
  circusEnv.lastAttack.at = -Infinity;
}
