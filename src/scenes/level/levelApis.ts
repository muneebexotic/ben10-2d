import type Phaser from 'phaser';
import type { FxApi } from '../../aliens/types';
import type { Drone, DroneWorld } from '../../entities/enemies/Drone';
import type { Projectiles } from '../../entities/Projectiles';
import type { Telegraphs } from '../../entities/enemies/Telegraphs';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { LevelWorld } from './LevelWorld';

/** The effects surface abilities get: the level's Fx and lighting, nothing else. */
export function createFxApi(fx: Fx, lighting: Lighting): FxApi {
  return {
    burst: (k, x, y, n) => fx.burst(k, x, y, n),
    trail: (k, x, y, n) => fx.trail(k, x, y, n),
    ring: (x, y, c, r, ms) => fx.ring(x, y, c, r, ms),
    flash: (x, y, c, r, ms) => fx.flash(x, y, c, r, ms),
    rays: (x, y, c, r, ms) => fx.rays(x, y, c, r, ms),
    light: (x, y, r, c, ms) => fx.light(x, y, r, c, ms),
    frameLight: (x, y, r, c, i) => lighting.add(x, y, r, c, i),
    shake: (i, ms) => fx.shake(i, ms),
    hitStop: (ms) => fx.hitStop(ms),
    slowMo: (scale, ms, recover) => fx.slowMo(scale, ms, recover),
    popText: (x, y, text, color) => fx.popText(x, y, text, color),
    speedLine: (x, y, dir, color) => fx.speedLine(x, y, dir, color),
    crack: (x, y, size) => fx.crack(x, y, size),
  };
}

export interface DroneWorldDeps {
  scene: Phaser.Scene;
  now(): number;
  player: DroneWorld['player'];
  fx: Fx;
  lighting: Lighting;
  projectiles: Projectiles;
  telegraph: Telegraphs;
  world: LevelWorld;
  onKilled(d: Drone): void;
  threat(d: Drone, at: number): void;
  cancelThreat(d: Drone): void;
}

/** What drones can see of the level. `aggressive` is flipped by Training's passive mode. */
export function createDroneWorld(d: DroneWorldDeps): DroneWorld {
  const cam = () => d.scene.cameras.main;
  return {
    get now() {
      return d.now();
    },
    player: d.player,
    fx: d.fx,
    lighting: d.lighting,
    projectiles: d.projectiles,
    telegraph: d.telegraph,
    aggressive: true,
    get view() {
      return cam().worldView;
    },
    onScreen: (x, y, m) => {
      const v = cam().worldView;
      return x > v.x + m && x < v.right - m && y > v.y + m && y < v.bottom - m;
    },
    groundBelow: (x, y) => d.world.groundBelow(x, y),
    isSolid: (x, y) => d.world.isSolid(x, y) || d.world.isOneWay(x, y),
    isWater: (x, y) => d.world.inWater(x, y),
    onKilled: (drone) => d.onKilled(drone),
    threat: (drone, at) => d.threat(drone, at),
    cancelThreat: (drone) => d.cancelThreat(drone),
  };
}
