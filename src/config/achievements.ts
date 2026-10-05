/**
 * Achievements: each is either a lifetime counter reaching a goal, or a
 * one-off moment the game reports (`event`). Counters live in the save file
 * per file, so they add up across runs and chapters.
 *
 * `icon` is an alien id or one of the UI icons in `ui/achievementIcon.ts`.
 */
export type LifetimeCounter =
  | 'transforms'
  | 'fireKOs'
  | 'parries'
  | 'smoothies'
  | 'perfects'
  | 'improvised'
  | 'hiddenPaths'
  | 'gummed'
  | 'pounceHits'
  | 'cards'
  | 'jokes'
  | 'takeovers';

export type AchievementIcon = 'heatblast' | 'fourarms' | 'xlr8' | 'wildmutt' | 'stinkfly' | 'upgrade' | 'ben' | 'smoothy' | 'card' | 'boss' | 'clock' | 'skull' | 'omnitrix' | 'star' | 'laugh';

export interface AchievementDef {
  id: string;
  title: string;
  text: string;
  icon: AchievementIcon;
  /** Unlocks when this lifetime counter reaches `goal`. */
  counter?: LifetimeCounter;
  goal?: number;
  /** Hidden on the list until unlocked (shows as ???). */
  secret?: boolean;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'hero-time', title: "IT'S HERO TIME", text: 'TRANSFORM FOR THE FIRST TIME', icon: 'omnitrix', counter: 'transforms', goal: 1 },
  { id: 'pyromaniac', title: 'PYROMANIAC', text: 'DEFEAT 100 ENEMIES WITH FIRE', icon: 'heatblast', counter: 'fireKOs', goal: 100 },
  { id: 'deflector', title: 'DEFLECTOR', text: 'PARRY 25 LASERS AS BEN', icon: 'ben', counter: 'parries', goal: 25 },
  { id: 'smoothie-addict', title: 'SMOOTHIE ADDICT', text: 'DRINK 25 MR. SMOOTHY CUPS', icon: 'smoothy', counter: 'smoothies', goal: 25 },
  { id: 'perfectionist', title: 'PERFECTIONIST', text: 'LAND 10 PERFECT TRANSFORMS', icon: 'star', counter: 'perfects', goal: 10 },
  { id: 'clutch', title: 'ROLL WITH IT', text: 'KO 5 ENEMIES AS THE WRONG ALIEN', icon: 'laugh', counter: 'improvised', goal: 5 },
  { id: 'nose-knows', title: 'THE NOSE KNOWS', text: 'SNIFF OUT 3 HIDDEN PATHS', icon: 'wildmutt', counter: 'hiddenPaths', goal: 3 },
  { id: 'pounce', title: 'POUNCE!', text: 'LAND ON 20 ENEMIES FROM ABOVE AS WILDMUTT', icon: 'wildmutt', counter: 'pounceHits', goal: 20 },
  { id: 'sticky', title: 'STICKY SITUATION', text: 'GUM 10 ENEMIES IN PLACE WITH SLIME', icon: 'stinkfly', counter: 'gummed', goal: 10 },
  { id: 'card-shark', title: 'CARD SHARK', text: 'COLLECT 12 SUMO SLAMMERS CARDS', icon: 'card', counter: 'cards', goal: 12 },
  { id: 'comedian', title: 'WRONG ALIEN, RIGHT TIME', text: 'FIND 10 MISFIRE JOKES', icon: 'laugh', counter: 'jokes', goal: 10 },
  { id: 'strike', title: 'STEE-RIKE!', text: 'BOWL OVER 3 ENEMIES WITH ONE THROW', icon: 'fourarms' },
  { id: 'full-omnitrix', title: 'FULL OMNITRIX', text: 'GET 5 FORMS INTO ONE COMBO', icon: 'omnitrix' },
  { id: 'speed-demon', title: 'SPEED DEMON', text: "BEAT A CHAPTER'S PAR TIME", icon: 'xlr8' },
  { id: 'untouchable', title: 'UNTOUCHABLE', text: 'BEAT A BOSS WITHOUT TAKING A HIT', icon: 'boss' },
  { id: 'no-sweat', title: 'NO SWEAT', text: 'CLEAR A CHAPTER WITHOUT DYING', icon: 'clock' },
  { id: 'hard-as-nails', title: 'HARD AS NAILS', text: 'CLEAR A CHAPTER ON HARD', icon: 'skull' },
  { id: 'act-1', title: 'THE SUMMER BEGINS', text: 'FINISH ACT 1', icon: 'omnitrix', secret: true },
  { id: 'omnitrix-master', title: 'OMNITRIX MASTER', text: 'S RANK A CHAPTER ON EASY, NORMAL AND HARD', icon: 'star' },
  { id: 'high-score', title: 'NEW HIGH SCORE', text: "BEAT KEV'S SUMO SLAMMERS RECORD", icon: 'card' },
  { id: 'hostile-takeover', title: 'HOSTILE TAKEOVER', text: 'TAKE OVER 15 MACHINES AS UPGRADE', icon: 'upgrade', counter: 'takeovers', goal: 15 },
  { id: 'nothing-to-copy', title: 'NOTHING TO COPY', text: 'BEAT KEVIN 11 BEFORE ANY COPY HITS LEVEL III', icon: 'boss' },
];

/** Thrown enemies that bowl over this many in one throw: STEE-RIKE! */
export const STRIKE_ACHIEVEMENT_HITS = 3;
/** Forms (Ben counts) in one combo for FULL OMNITRIX. */
export const FULL_OMNITRIX_FORMS = 5;
/** How long the unlock toast stays up (ms). */
export const ACHIEVEMENT_TOAST_MS = 3600;
