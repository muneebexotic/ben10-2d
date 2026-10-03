import { GAME_HEIGHT } from './constants';

/**
 * On-screen controls, in game pixels. The view is 360 tall and 640 or more
 * wide (wide phones): the right-hand buttons are placed `right` pixels in from
 * the right edge, so they stay under the thumb. Hit areas are larger than what is drawn.
 */
export const TOUCH = {
  stick: {
    /** Touches that start left of this fraction of the screen width (and below the HUD) grab the stick. */
    zoneRightFraction: 0.42,
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
    jump: { right: 50, y: GAME_HEIGHT - 52, r: 30 },
    attack: { right: 118, y: GAME_HEIGHT - 40, r: 25 },
    special: { right: 96, y: GAME_HEIGHT - 108, r: 22 },
    omnitrix: { right: 40, y: GAME_HEIGHT - 132, r: 27 },
    /** Top centre. */
    pause: { y: 13, r: 11 },
  },
  /** Touch targets reach this much further than the drawn circle. */
  hitPadding: 1.3,
  /** Sideways travel on the Omnitrix button that turns a tap into a dial swipe. */
  swipePx: 16,
  /**
   * Holding the Omnitrix this long (without swiping) fans the dial out into a
   * radial picker: aliens on an arc to the button's left (screen angles: 90 is
   * down, 180 left, 270 up). Let go on one to pick it and transform.
   */
  radial: { holdMs: 300, radius: 70, slotR: 15, fromDeg: 115, toDeg: 255, deadZone: 26 },
  idleAlpha: 0.38,
  pressedAlpha: 0.78,
} as const;
