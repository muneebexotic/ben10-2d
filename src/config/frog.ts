/**
 * KING CROAK, Chapter 3's boss: a museum bullfrog Dr. Animo blew up to the
 * size of a car, with Animo riding on its head. Every attack has a tell that
 * reads the same on every difficulty; rests and punish windows scale with pace.
 *
 * Any alien can win. Switching pays: fire on the swollen throat pops it (a
 * stun), slime on its feet gums it to the floor, a Four Arms smash on the
 * outstretched tongue yanks it face-first, a pounce from above hits Animo,
 * and the long recoveries after a leap are XLR8's to punish.
 */
export const FROG = {
  name: 'KING CROAK',
  subtitle: "DR. ANIMO'S MASTERPIECE",
  maxHp: 150,
  defeatTitle: 'CROAKED!',
  /** Maximum mutation at this fraction of health, frenzy at the second. */
  phase2At: 0.6,
  phase3At: 0.25,
  body: { width: 72, height: 54 },
  /** Drawn and collided at this size (it grows again at maximum mutation). */
  scale: 1.25,
  /** Thick mutated hide: hits outside its weak moments do this fraction. */
  hideMultiplier: 0.45,
  contactDamage: 1,
  /** Rest between attacks per phase (scaled by the difficulty's boss rest). */
  idleMs: [1050, 850, 650] as const,
  hopSpeed: 70,
  introMs: 1800,
  leap: {
    crouchMs: 700,
    airMs: 900,
    height: 150,
    damage: 2,
    /** Landing: a shockwave runs out each way (jump it). */
    shockwaves: true,
    /** Stuck in the floor after landing: hits do extra. */
    recoverMs: 800,
    recoverMultiplier: 1.25,
  },
  tongue: {
    tellMs: 650,
    aimLockMs: 180,
    speed: 900,
    reach: 300,
    holdMs: 700,
    retractMs: 300,
    damage: 2,
    /** Hits on the outstretched tongue. */
    hitMultiplier: 1.5,
    /** A smash on the tongue (Four Arms) yanks the frog face-first. */
    yankStunMs: 2200,
    yankDamage: 10,
    maxAngleDeg: 35,
    hp: 14,
  },
  spit: {
    inflateMs: 850,
    globs: 3,
    spreadPx: 46,
    damage: 1,
    gravity: 520,
    flightMs: 750,
    /** The swollen throat takes double; fire pops it. */
    throatMultiplier: 2,
    popStunMs: 2000,
    popDamage: 8,
  },
  flop: {
    crouchMs: 500,
    riseMs: 450,
    trackMs: 1100,
    lockMs: 420,
    fallMs: 260,
    damage: 3,
    dazedMs: 1300,
  },
  /** Slime globs on its feet: enough of them glue it down. */
  gum: { globs: 4, windowMs: 3200, stuckMs: 3800, stuckMultiplier: 1.5 },
  /** Hits that come down on its head land on Animo too. */
  fromAbove: { multiplier: 1.5, margin: 14 },
  /** Animo's Transmodulator: every few attacks in phase 2+ he zaps up help. */
  zap: { tellMs: 700, every: 3, maxAdds: 3 },
  /** Phase 2: it grows. */
  growScale: 1.45,
} as const;
