import type { Ledge } from './rules';

export type ClimbPose = 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'hurt';

/** A rockling rolling down the spiral, or a gargoyle swooping in from behind the tower. */
export interface ClimbFoe {
  alive: boolean;
  s: number;
  h: number;
  /** Distance off the wall (gargoyles fly out from it). */
  out: number;
  vs: number;
  vh: number;
}

/**
 * What THE TOWER WRAP looks like this frame: TowerClimb (in the level) runs
 * the climb and writes it; TowerScene only draws it.
 */
export interface TowerView {
  ledges: readonly Ledge[];
  top: number;
  camS: number;
  camH: number;
  s: number;
  h: number;
  facing: 1 | -1;
  pose: ClimbPose;
  /** The current form's sheet and animation prefix. */
  texture: string;
  animPrefix: string;
  /** Where the form's feet sit in its frame (sprite origin y). */
  originY: number;
  /** 1 right after a hit, fading. */
  flash: number;
  rocklings: ClimbFoe[];
  gargoyles: ClimbFoe[];
  /** Wind: the warning (0-1) and the gust's push direction while it blows (-1, 0, 1). */
  windWarn: number;
  windDir: number;
  time: number;
  /** 0 climbing, rising to 1 as the finish fades out. */
  done: number;
}
