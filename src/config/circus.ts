/**
 * Chapter 8's numbers: Cacklejack's goons and traps, the funhouse's toys and
 * the mirror maze. Speeds px/s, times ms, damage in hearts.
 */

/** A grinner: lobs a cream pie on an arc after holding it up (the tell). */
export const GRINNER = {
  hp: 4,
  body: { width: 14, height: 26 },
  patrolSpeed: 34,
  noticeX: 190,
  noticeY: 90,
  windupMs: 760,
  pieSpeed: 190,
  pieGravity: 420,
  pieDamage: 1,
  restMs: [1300, 2200] as const,
  contactDamage: 1,
} as const;

/** A jack-in-the-box: winds up its tune when Ben is near (the tell), then a glove springs out along the floor. */
export const JACKBOX = {
  hp: 5,
  body: { width: 18, height: 18 },
  /** Ben this close (px, either side, about level) sets it winding. */
  triggerX: 96,
  triggerY: 40,
  windMs: 900,
  /** How far the glove reaches, and how long it stays out. */
  reach: 92,
  punchMs: 380,
  damage: 1,
  knockback: 260,
  /** A hit while it winds jams it for this long (any attack). */
  jamMs: 3200,
  /** Unjammed, it waits this long before it can wind again. */
  jamRecoverMs: 600,
  /** The tune's notes: this far apart as it starts winding, this much closer by the punch. */
  tuneStepMs: 140,
  tuneFasterMs: 90,
  restMs: [1400, 2000] as const,
  contactDamage: 0.5,
} as const;

/** A balloon hound: drifts, stretches (the tell) and swoops along a line; pops into fear gas. */
export const HOUND = {
  hp: 1,
  body: { width: 20, height: 12 },
  drift: 22,
  seekRange: 200,
  stretchMs: 640,
  swoopSpeed: 260,
  swoopMs: 700,
  restMs: [1500, 2400] as const,
  contactDamage: 1,
  /** Its pop leaves a puff of fear gas: this big, this long, this much a tick. */
  gas: { radius: 26, lifeMs: 2200, damage: 0.5, everyMs: 600 },
} as const;

/** A stilt walker: a sweeping kick after drawing a stilt back (the tell); a low hit or a roll topples him. */
export const STILTS = {
  hp: 9,
  body: { width: 16, height: 56 },
  walkSpeed: 26,
  noticeX: 160,
  noticeY: 110,
  windupMs: 820,
  kickMs: 320,
  kickReach: 40,
  kickHeight: 20,
  kickDamage: 1.5,
  kickKnockback: 280,
  /** Hits below this height (px above his feet) take out a stilt: two and he topples (a roll or a smash: at once). */
  lowZone: 26,
  stiltHits: 2,
  downMs: 3600,
  /** The fall itself (TIMBER!), and the wait after he's back up before he can kick. */
  toppleMs: 700,
  upRecoverMs: 800,
  /** Down on the floor he takes this much more from everything. */
  downDamageTaken: 1.8,
  restMs: [1500, 2300] as const,
  contactDamage: 1,
} as const;

/** A reflection in the maze: waits in its mirror, steps out, and strikes a beat after Ben does. */
export const REFLECTION = {
  hp: 5,
  body: { width: 10, height: 22 },
  wakeX: 110,
  walkSpeed: 70,
  /** It copies Ben's attacks this long after he makes them (the tell: it copies his wind-up). */
  echoMs: 320,
  reach: 22,
  damage: 1,
  knockback: 200,
  /** Between its own attacks, at least this long. */
  cooldownMs: 700,
  tint: 0x6a4a9a,
  contactDamage: 0.5,
} as const;

/** The funhouse's toys. */
export const TOYS = {
  /** Bounce pads: a curled ball goes this much higher than anyone else. */
  padBallScale: 1.25,
  padCooldownMs: 250,
  /** How long a pad shows squashed after a launch. */
  padSquashMs: 180,
  /** Bumpers: the kick (px/s), the radius they touch (px), and how long they stay lit. */
  bumperKick: 380,
  bumperRadius: 15,
  bumperLitMs: 160,
  /** A bumper can kick again after this long; it always kicks up at least this hard (px/s). */
  bumperCooldownMs: 200,
  bumperMinUp: 120,
  /** PINBALL WIZARD: this many bumper hits as a rolling Ricochet in one visit. */
  pinballWizardHits: 20,
  /** Kickers: a ball at least this fast is thrown up (vy) and on (its speed kept, at least `minOut`). */
  kickerMinSpeed: 190,
  kickerVy: 520,
  kickerMinOut: 260,
  kickerFlashMs: 220,
  /** The loop: a ball at least this fast at its foot goes round (the trip takes the circumference at its speed). */
  loopMinSpeed: 250,
  /** Out of the loop, its foot won't take the ball again for this long (on a fast screen it's still on the foot next frame). */
  loopCooldownMs: 400,
  /** Riding the loop, Ben can't be hurt for up to this long. */
  loopGuardMs: 1200,
  /** Angled mirrors: how long they flash after firing a ball off. */
  deflectorFlashMs: 220,
  /** An angled mirror fires a ball again only after this long. Sideways, the ball leaves with this lift (px/s). */
  deflectorCooldownMs: 300,
  deflectorLift: 60,
  /**
   * Fired straight up a shaft, the ball rides it like a pneumatic tube at this speed (px/s), for as long as the
   * mirror's own speed says: `speed / chuteSpeed` seconds times this (960 up a 22-row shaft: just past its top).
   */
  chuteSpeed: 560,
  chuteMsPerSpeed: 0.42,
  /** Mirror doors light up when Ben is this close (px) for this long. */
  doorWakeRange: 34,
  doorWakeMs: 420,
  /** A lying mirror's reflection gives itself away: it sways this far (px) and bobs this far as if breathing. */
  lieSway: 3,
  lieBob: 2,
  /** The high striker: damage that rings the bell; less sends the puck part of the way. */
  strikerBell: 4,
  strikerRiseMs: 520,
} as const;
