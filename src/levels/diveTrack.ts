import { DIVE } from '../config/dive';

/**
 * THE DEEP DIVE's track: what's on the rails and where (metres from the
 * station), how the tunnel bends, and the rules for what hits the cart.
 * Pure data and functions, so the ride is unit tested without a renderer.
 */

/** What's on the track. 'missile' is never placed: a drone's strike lands as one. */
export type DiveKind = 'rock' | 'crate' | 'beam' | 'gap' | 'crabbot' | 'kraab' | 'drone' | 'cannon' | 'smoothy' | 'card' | 'missile';
export type DiveSpecial = 'rocket' | 'brace' | 'boost' | 'senses' | 'fly' | 'merge' | 'phase' | 'shield';

export interface DiveEvent {
  kind: DiveKind;
  /** Track distance (m). A drone hovers here and paints the lane its missile lands on at `at + 30`. */
  at: number;
  /** Tracks it covers (0 left, 1 middle, 2 right). Gaps and beams span all three. */
  lanes: readonly number[];
  /** Gap length (m). */
  len?: number;
  /** A card floats high: only a jump catches it. */
  high?: boolean;
  /** The first of its kind teaches its answer (a tip). */
  tip?: string;
}

const ALL = [0, 1, 2] as const;

/** The ride, start to trestle. Each new hazard is introduced alone with a tip, then mixed in. */
export const DIVE_TRACK: { readonly length: number; readonly trestle: number; readonly events: readonly DiveEvent[]; readonly bends: ReadonlyArray<{ at: number; bend: number }> } = {
  length: 800,
  /** Where the rails end on a broken trestle over the crystal cavern. */
  trestle: 772,
  bends: [
    { at: 0, bend: 0 },
    { at: 60, bend: 0.012 },
    { at: 130, bend: -0.014 },
    { at: 210, bend: 0.004 },
    { at: 280, bend: 0.018 },
    { at: 360, bend: -0.02 },
    { at: 440, bend: 0.01 },
    { at: 500, bend: -0.024 },
    { at: 560, bend: 0.024 },
    { at: 630, bend: -0.012 },
    { at: 700, bend: 0.006 },
    { at: 760, bend: 0 },
  ],
  events: [
    { kind: 'rock', at: 70, lanes: [1], tip: '{MOVE} LEFT AND RIGHT: SWITCH TRACKS!' },
    { kind: 'rock', at: 105, lanes: [0, 1] },
    { kind: 'smoothy', at: 118, lanes: [2] },
    { kind: 'beam', at: 150, lanes: ALL, tip: '{DOWN}: DUCK!' },
    { kind: 'gap', at: 190, lanes: ALL, len: 7, tip: '{JUMP}: JUMP THE GAP!' },
    { kind: 'crabbot', at: 232, lanes: [1], tip: '{J}: ATTACK WHAT\'S AHEAD! {K}: YOUR ALIEN\'S SPECIAL!' },
    { kind: 'crate', at: 250, lanes: [2] },
    { kind: 'rock', at: 268, lanes: [0] },
    { kind: 'kraab', at: 310, lanes: [1], tip: 'A CRACK RACING AT YOU: SWITCH TRACKS!' },
    { kind: 'beam', at: 335, lanes: ALL },
    { kind: 'rock', at: 352, lanes: [1, 2] },
    { kind: 'gap', at: 372, lanes: ALL, len: 8 },
    { kind: 'drone', at: 400, lanes: [1], tip: "SIXSIX'S DRONE PAINTS A TRACK: GET OFF IT, OR SHOOT IT DOWN!" },
    { kind: 'crabbot', at: 446, lanes: [0, 2] },
    { kind: 'rock', at: 470, lanes: [1] },
    { kind: 'smoothy', at: 482, lanes: [1] },
    { kind: 'rock', at: 498, lanes: [0, 1] },
    { kind: 'rock', at: 520, lanes: [1, 2] },
    { kind: 'card', at: 545, lanes: [1], high: true },
    { kind: 'beam', at: 562, lanes: ALL },
    { kind: 'cannon', at: 600, lanes: [1, 2], tip: "KRAAB'S CANNON! GET CLEAR OF THE GLOW!" },
    { kind: 'crate', at: 622, lanes: [0] },
    { kind: 'gap', at: 640, lanes: ALL, len: 9 },
    { kind: 'drone', at: 662, lanes: [0] },
    { kind: 'kraab', at: 700, lanes: [2] },
    { kind: 'crabbot', at: 712, lanes: [0, 1] },
    { kind: 'beam', at: 734, lanes: ALL },
    { kind: 'rock', at: 750, lanes: [0, 2] },
  ],
};

/** Track speed at a distance (m/s): out of the station slowly, faster and faster. */
export function speedAt(d: number): number {
  const S = DIVE.speed;
  if (d <= S.cruiseAt) return S.start + (S.cruise - S.start) * (d / S.cruiseAt);
  if (d <= S.topAt) return S.cruise + (S.top - S.cruise) * ((d - S.cruiseAt) / (S.topAt - S.cruiseAt));
  return S.top;
}

/** How hard the tunnel bends at a distance (the shader's coefficient), eased between the track's keys. */
export function bendAt(d: number, bends = DIVE_TRACK.bends): number {
  if (d <= bends[0].at) return bends[0].bend;
  for (let i = 1; i < bends.length; i++) {
    const b = bends[i];
    if (d <= b.at) {
      const a = bends[i - 1];
      const t = (d - a.at) / (b.at - a.at);
      const s = t * t * (3 - 2 * t);
      return a.bend + (b.bend - a.bend) * s;
    }
  }
  return bends[bends.length - 1].bend;
}

/** The track (0-2) a lateral position is on, nearest centre. */
export function laneOf(x: number): number {
  let best = 0;
  for (let i = 1; i < DIVE.lanes.length; i++) if (Math.abs(x - DIVE.lanes[i]) < Math.abs(x - DIVE.lanes[best])) best = i;
  return best;
}

/** Is the cart (its centre at lateral `x`) touching any of these tracks? Mid-hop it can touch two. */
export function onLanes(x: number, lanes: readonly number[]): boolean {
  return lanes.some((l) => Math.abs(x - DIVE.lanes[l]) < 0.78);
}

export interface CartState {
  x: number;
  airborne: boolean;
  ducking: boolean;
  /** The special running right now, if any. */
  special: DiveSpecial | null;
}

/** What happens when the cart reaches something: it's clear, it hits, the shield takes it, or the cart smashes through. */
export type DiveOutcome = 'clear' | 'hit' | 'shielded' | 'smashed' | 'collect';

/**
 * The cart meets an event at its distance. Pure: unit tested.
 * - Gaps need the cart in the air (a jump, a rocket jump, Stinkfly's flight; Upgrade's merge hops it).
 * - Beams need a duck (or phasing, or Four Arms' brace splintering them).
 * - Rocks, crates and crab-bots: be on another track, or over them, or phase, or smash through (brace).
 * - Kraab, missiles and the cannon: be on another track, or phase; the crystal shield stops them.
 */
export function meet(kind: DiveKind, lanes: readonly number[], cart: CartState): DiveOutcome {
  const s = cart.special;
  if (kind === 'drone') return 'clear';
  if (kind === 'smoothy' || kind === 'card') return onLanes(cart.x, lanes) ? 'collect' : 'clear';
  if (kind === 'gap') return cart.airborne || s === 'merge' ? 'clear' : 'hit';
  if (s === 'merge' || s === 'phase') return 'clear';
  if (kind === 'beam') {
    if (cart.ducking) return 'clear';
    if (s === 'brace') return 'smashed';
    if (s === 'shield') return 'shielded';
    return 'hit';
  }
  if (!onLanes(cart.x, lanes)) return 'clear';
  if (kind === 'rock' || kind === 'crate' || kind === 'crabbot') {
    if (cart.airborne) return 'clear';
    if (s === 'brace') return 'smashed';
    if (s === 'shield') return 'shielded';
    return 'hit';
  }
  // Kraab erupting, a missile landing, the cannon's blast.
  return s === 'shield' ? 'shielded' : 'hit';
}

/** Can this attack destroy that? Shots fly far but don't break rock; smashes break anything up close. */
export function attackBreaks(attack: 'shot' | 'smash' | 'strike', kind: DiveKind): boolean {
  if (kind === 'crabbot' || kind === 'crate') return true;
  if (kind === 'drone') return attack === 'shot';
  if (kind === 'rock') return attack === 'smash';
  return false;
}
