import { GAME_HEIGHT, GAME_WIDTH } from './constants';

/** On-screen controls, in game pixels (640x360). Hit areas are larger than what is drawn. */
export const TOUCH = {
  stick: {
    /** Touches that start left of this line (and below the HUD) grab the stick. */
    zoneRight: GAME_WIDTH * 0.42,
    zoneTop: 70,
    homeX: 82,
    homeY: GAME_HEIGHT - 76,
    radius: 34,
    knobRadius: 15,
    /** Fraction of the radius before a direction registers. */
    deadZone: 0.28,
    /** How steep (|dy| / |dx|) a push must be to count as up (aim) or down (drop through). */
    upSlope: 0.6,
    downSlope: 1,
  },
  buttons: {
    jump: { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 52, r: 30 },
    attack: { x: GAME_WIDTH - 118, y: GAME_HEIGHT - 40, r: 25 },
    special: { x: GAME_WIDTH - 96, y: GAME_HEIGHT - 108, r: 22 },
    omnitrix: { x: GAME_WIDTH - 40, y: GAME_HEIGHT - 132, r: 27 },
    pause: { x: GAME_WIDTH / 2, y: 13, r: 11 },
  },
  /** Touch targets reach this much further than the drawn circle. */
  hitPadding: 1.3,
  /** Sideways travel on the Omnitrix button that turns a tap into a dial swipe. */
  swipePx: 16,
  idleAlpha: 0.38,
  pressedAlpha: 0.78,
} as const;
