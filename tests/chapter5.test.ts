import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { DIVE } from '../src/config/dive';
import { DIAMONDHEAD as DIAMONDHEAD_TUNING } from '../src/config/aliens/diamondhead';
import { HEATBLAST as HEATBLAST_TUNING } from '../src/config/aliens/heatblast';
import { HUNTERS_BOSS, SIXSIX, TETRAX } from '../src/config/hunters';
import { cracksPillar, crabShelled, kraabShelled, pickForcedMisfire } from '../src/entities/hunters/huntRules';
import { tetraxDamage } from '../src/entities/hunters/tetraxRules';
import { buildCells, cellAt } from '../src/levels/buildLevel';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { CHAPTER_3 } from '../src/levels/chapter3';
import { CHAPTER_4 } from '../src/levels/chapter4';
import { CHAPTER_5 } from '../src/levels/chapter5';
import type { LevelData } from '../src/levels/types';
import { checkpointsFor } from '../src/levels/checkpoints';
import { attackBreaks, bendAt, DIVE_TRACK, meet, speedAt, type CartState } from '../src/levels/diveTrack';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import { availableCards, countedCards, lockedCards } from '../src/levels/secrets';
import { CELL, isSolidCell } from '../src/levels/tiles';
import { pendingUnlocks } from '../src/systems/Unlocks';

const HEATBLAST = getAlien('heatblast').reach;
const XLR8 = getAlien('xlr8').reach;
const FOURARMS = getAlien('fourarms').reach;
const WILDMUTT = getAlien('wildmutt').reach;
const STINKFLY = getAlien('stinkfly').reach;
const UPGRADE = getAlien('upgrade').reach;
const DIAMONDHEAD = getAlien('diamondhead').reach;
const GHOSTFREAK = getAlien('ghostfreak').reach;
const BEFORE: Capabilities[] = [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS, WILDMUTT, STINKFLY, UPGRADE];
const ALL: Capabilities[] = [...BEFORE, DIAMONDHEAD, GHOSTFREAK];
const BEFORE_IDS = ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly', 'upgrade'];
const NAMES = new Map<Capabilities, string>([
  [HUMAN_CAPS, 'human'],
  [HEATBLAST, 'heatblast'],
  [XLR8, 'xlr8'],
  [FOURARMS, 'fourarms'],
  [WILDMUTT, 'wildmutt'],
  [STINKFLY, 'stinkfly'],
  [UPGRADE, 'upgrade'],
  [DIAMONDHEAD, 'diamondhead'],
  [GHOSTFREAK, 'ghostfreak'],
]);

const level = CHAPTER_5;
const grid = buildCells(level);
const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };
const story = level.story!;
const bounty = story.bounty!;

function entity<T extends (typeof level.entities)[number]['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<(typeof level.entities)[number], { type: T }>[];
}
const card = (id: string) => entity('card').find((c) => c.id === id)!;
const cp = (id: string) => entity('checkpoint').find((c) => c.id === id)!;
const boss = entity('boss')[0];
const standAt = (x: number, row: number) => (p: Pos) => p.x === x && p.y === row - 1;
const grabs = (c: { x: number; y: number }, caps: Capabilities) => (p: Pos) => Math.abs(p.x - c.x) <= 1 && p.y >= c.y - 1 && p.y - c.y <= caps.jumpUp;
const pastX = (x: number) => (p: Pos) => p.x >= x;
/** Only `who` (one or more) can get from `from` to `goal`. */
function only(from: Pos, goal: (p: Pos) => boolean, who: Capabilities[], pool: Capabilities[] = ALL): void {
  for (const caps of pool) expect(canReach(level, grid, from, goal, caps), NAMES.get(caps)).toBe(who.includes(caps));
}
const at = (id: string): Pos => ({ x: cp(id).x, y: cp(id).y - 1 });

describe('chapter 5 layout', () => {
  it('builds a grid of the declared size, Ben starting at the town gate', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
    expect(isSolidCell(cellAt(grid, level.playerStart.x, level.playerStart.y))).toBe(true);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('checkpoints and smoothies sit on a surface with open space above', () => {
    for (const e of [...entity('checkpoint'), ...entity('smoothy')]) {
      const name = `${e.type} ${'id' in e ? e.id : ''} at ${e.x},${e.y}`;
      expect(cellAt(grid, e.x, e.y) !== CELL.EMPTY, `${name} has no surface`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1), `${name} is buried`).not.toBe(CELL.GROUND);
    }
  });

  it('walkers stand on floors, flyers hover in the open, and every hazard is inside the level', () => {
    for (const g of entity('gear')) {
      const name = `${g.kind} at ${g.x},${g.y}`;
      expect(cellAt(grid, g.x, g.y) !== CELL.EMPTY, `${name} has no floor`).toBe(true);
      expect(cellAt(grid, g.x, g.y - 1), name).toBe(CELL.EMPTY);
    }
    for (const d of entity('drone').filter((e) => e.kind === 'tracker')) expect(cellAt(grid, d.x, d.y), `tracker at ${d.x},${d.y}`).toBe(CELL.EMPTY);
    for (const e of [...entity('phaseWall'), ...entity('dynamite'), ...entity('laser'), ...entity('receiver'), ...entity('crystalGate'), ...entity('rockfall')]) {
      expect(e.x >= 0 && e.x < level.width, `${e.type} ${e.id}`).toBe(true);
    }
  });

  it('every receiver opens a gate that exists, and switches off an emitter that exists', () => {
    for (const r of entity('receiver')) {
      expect(entity('crystalGate').some((g) => g.id === r.gate), r.id).toBe(true);
      if (r.kills) expect(entity('laser').some((l) => l.id === r.kills), r.id).toBe(true);
    }
  });

  it('counts eight cards: five this chapter, three waiting for later aliens (each with a hint)', () => {
    expect(countedCards(level)).toHaveLength(8);
    const now = [...BEFORE_IDS, 'ghostfreak', 'diamondhead'];
    expect(availableCards(level, now)).toHaveLength(5);
    const locked = ['ch5-card-flooded', 'ch5-card-loop', 'ch5-card-mouse'];
    expect(lockedCards(level, now).map((c) => c.id).sort()).toEqual(locked);
    for (const id of locked) expect(entity('alienHint').some((h) => h.alien === card(id).requires), `${id} has a hint`).toBe(true);
  });

  it('every set piece has its own checkpoint on Hard: the jail, the dive, the cavern, the lift, the boss', () => {
    const hard = checkpointsFor(level, 'sparse').map((c) => c.id);
    for (const id of ['cp-jail', 'cp-dive', 'cp-cavern', 'cp-lift', 'cp-hunters']) expect(hard).toContain(id);
    // Each sits just before its set piece.
    expect(cp('cp-jail').x).toBeLessThan(bounty.netTrap.triggerX);
    expect(cp('cp-dive').x).toBeLessThan(bounty.dive.triggerX);
    expect(cp('cp-lift').x).toBeLessThan(bounty.lift.x);
    expect(cp('cp-hunters').x).toBeLessThan(boss.triggerX);
    // The dive lands on the cavern's checkpoint, before the standoff ends (Tetrax's spot).
    expect(bounty.dive.checkpoint).toBe('cp-cavern');
    expect(cp('cp-cavern').x).toBeGreaterThanOrEqual(bounty.dive.landX);
    expect(cp('cp-cavern').x).toBeLessThan(bounty.crystal.tetraxX);
    expect(bounty.lift.checkpoint).toBe('cp-hunters');
  });

  it("on Easy and Normal a checkpoint past the cavern standoff means a death at the laser doesn't replay it", () => {
    const crystals = cp('cp-crystals');
    expect(crystals.x).toBeGreaterThan(bounty.crystal.tetraxX);
    expect(crystals.x).toBeLessThan(Math.min(...entity('laser').map((l) => l.x), ...entity('gear').map((g) => g.x).filter((x) => x > bounty.crystal.tetraxX)));
    expect(checkpointsFor(level, 'normal').some((c) => c.id === 'cp-crystals')).toBe(true);
  });

  it('Ghostfreak joins in the jail, Diamondhead in the cavern; a restart past either already has them', () => {
    const unlocks = story.unlocks!;
    expect(pendingUnlocks(unlocks, BEFORE_IDS, null)).toEqual(['ghostfreak', 'diamondhead']);
    expect(pendingUnlocks(unlocks, BEFORE_IDS, cp('cp-hotel').x)).toEqual(['diamondhead']);
    expect(pendingUnlocks(unlocks, BEFORE_IDS, cp('cp-cavern').x)).toEqual([]);
    for (const u of unlocks) expect(u.scripted).toBe(true);
    expect(bounty.netTrap.alien).toBe('ghostfreak');
    expect(bounty.crystal.alien).toBe('diamondhead');
  });

  it("the set pieces' geometry is consistent", () => {
    const { netTrap, kraabHunt, dive, crystal, lift, hunters } = bounty;
    // The net drags Ben from the office, past the bars, into the cell; the generator stays outside.
    expect(netTrap.sixsixX).toBeLessThan(netTrap.triggerX);
    expect(netTrap.barsX).toBeGreaterThan(netTrap.triggerX);
    expect(netTrap.cellX).toBeGreaterThan(netTrap.barsX);
    expect(netTrap.generatorX).toBeLessThan(netTrap.barsX);
    expect(entity('phaseWall').some((w) => w.x === netTrap.barsX)).toBe(true);
    // Kraab's ambushes are in the tunnels, in order; the dive starts at their end.
    expect(kraabHunt.ambushes.every((a) => a.x > kraabHunt.fromX && a.x < kraabHunt.toX)).toBe(true);
    expect(kraabHunt.toX).toBeLessThanOrEqual(dive.triggerX + 6);
    // The cavern: Kraab one side of the landing, Tetrax the other.
    expect(crystal.kraabX).toBeLessThan(dive.landX);
    expect(crystal.tetraxX).toBeGreaterThan(dive.landX);
    // The lift rises in its shaft and the wall it crashes through leads into the boss chamber.
    expect(lift.stop).toBeLessThan(lift.bottom);
    expect(lift.triggerX).toBeGreaterThanOrEqual(lift.x);
    expect(hunters.wall.x).toBeGreaterThanOrEqual(lift.x + lift.w - 1);
    expect(hunters.chamber.from).toBeLessThanOrEqual(hunters.wall.x + hunters.wall.w);
    expect(boss.arenaFrom).toBeGreaterThanOrEqual(hunters.wall.x);
    expect(hunters.pillarX).toBeGreaterThan(hunters.chamber.from);
    expect(hunters.pillarX).toBeLessThan(hunters.chamber.to);
    expect(hunters.towerX).toBeGreaterThan(hunters.yard.from);
    expect(hunters.towerX).toBeLessThan(hunters.yard.to);
  });
});

describe('chapter 5 progression', () => {
  it('anyone walks from the gate down Main Street to the jail', () => {
    for (const caps of ALL) expect(canReach(level, grid, start, standAt(bounty.netTrap.triggerX, bounty.netTrap.floor), caps), NAMES.get(caps)).toBe(true);
  });

  it('only Ghostfreak gets out of the cell (the bars and the wall are phase walls)', () => {
    const cell: Pos = { x: bounty.netTrap.cellX, y: bounty.netTrap.floor - 1 };
    only(cell, pastX(cp('cp-hotel').x), [GHOSTFREAK]);
  });

  it('Ghostfreak gets through the haunted hotel to the mine head', () => {
    expect(canReach(level, grid, at('cp-hotel'), pastX(cp('cp-minehead').x), GHOSTFREAK)).toBe(true);
  });

  it("the tunnels' cave-in needs fire on the dynamite", () => {
    only(at('cp-tunnels'), pastX(300), [HEATBLAST]);
  });

  it("the alcove card under the tunnel floor needs the dynamite too", () => {
    const c = card('ch5-card-alcove');
    const past: Pos = { x: 301, y: 35 };
    for (const caps of ALL) expect(canReach(level, grid, past, grabs(c, caps), caps), NAMES.get(caps)).toBe(caps === HEATBLAST);
  });

  it('everyone rides THE DEEP DIVE from the station down to the crystal cavern', () => {
    for (const caps of ALL) expect(canReach(level, grid, at('cp-dive'), standAt(bounty.dive.landX, bounty.dive.landY), caps), NAMES.get(caps)).toBe(true);
  });

  it("the cavern's crystal gate needs Diamondhead's shield on the security laser", () => {
    only(at('cp-cavern'), pastX(cp('cp-lift').x), [DIAMONDHEAD]);
  });

  it('the lift crashes through into the boss chamber for anyone', () => {
    for (const caps of ALL) expect(canReach(level, grid, at('cp-lift'), pastX(boss.triggerX), caps), NAMES.get(caps)).toBe(true);
  });

  it('the high ledge card in the cavern: crystal platforms or flight', () => {
    const c = card('ch5-card-ledge');
    for (const caps of [DIAMONDHEAD, STINKFLY]) expect(canReach(level, grid, at('cp-cavern'), grabs(c, caps), caps), NAMES.get(caps)).toBe(true);
    for (const caps of [HUMAN_CAPS, XLR8, FOURARMS, GHOSTFREAK]) expect(canReach(level, grid, at('cp-cavern'), grabs(c, caps), caps), NAMES.get(caps)).toBe(false);
  });
});

describe('THE DEEP DIVE track', () => {
  const plain = (x: number, more: Partial<CartState> = {}): CartState => ({ x, airborne: false, ducking: false, special: null, ...more });

  it('events run in order along the track and end before the trestle', () => {
    const ats = DIVE_TRACK.events.map((e) => e.at);
    expect([...ats].sort((a, b) => a - b)).toEqual(ats);
    expect(ats[ats.length - 1]).toBeLessThan(DIVE_TRACK.trestle);
    expect(DIVE_TRACK.trestle).toBeLessThan(DIVE_TRACK.length);
  });

  it('every obstacle can be beaten by any alien with the basic moves (a free track, a jump or a duck)', () => {
    for (const e of DIVE_TRACK.events) {
      if (e.kind === 'smoothy' || e.kind === 'card' || e.kind === 'drone') continue;
      const ways = [0, 1, 2].flatMap((lane) => [plain(DIVE.lanes[lane]), plain(DIVE.lanes[lane], { airborne: true }), plain(DIVE.lanes[lane], { ducking: true })]);
      expect(ways.some((c) => meet(e.kind, e.lanes, c) === 'clear'), `${e.kind} at ${e.at}`).toBe(true);
      // Track hazards always leave a free track.
      if (e.kind !== 'gap' && e.kind !== 'beam') expect(e.lanes.length, `${e.kind} at ${e.at}`).toBeLessThan(3);
    }
  });

  it('a plain jump clears every gap at the speed the cart is doing there', () => {
    for (const e of DIVE_TRACK.events.filter((ev) => ev.kind === 'gap')) {
      const metres = (DIVE.jumpMs / 1000) * speedAt(e.at);
      expect(metres, `gap at ${e.at}`).toBeGreaterThan((e.len ?? 0) + 2);
    }
  });

  it('two all-track hazards never come closer than a jump plus a breath', () => {
    const wide = DIVE_TRACK.events.filter((e) => e.kind === 'gap' || e.kind === 'beam');
    for (let i = 1; i < wide.length; i++) {
      const gapM = wide[i].at - (wide[i - 1].at + (wide[i - 1].len ?? 0));
      const seconds = gapM / speedAt(wide[i].at);
      expect(seconds, `${wide[i - 1].kind} at ${wide[i - 1].at} then ${wide[i].kind} at ${wide[i].at}`).toBeGreaterThan(1.2);
    }
  });

  it('each new hazard is introduced with a tip the first time', () => {
    const seen = new Set<string>();
    for (const e of DIVE_TRACK.events) {
      if (seen.has(e.kind) || e.kind === 'smoothy' || e.kind === 'card' || e.kind === 'crate') continue;
      seen.add(e.kind);
      expect(e.tip, `first ${e.kind}`).toBeTruthy();
    }
  });

  it('the cart speeds up out of the station and the tunnel bends smoothly', () => {
    expect(speedAt(0)).toBe(DIVE.speed.start);
    expect(speedAt(DIVE.speed.cruiseAt)).toBeCloseTo(DIVE.speed.cruise);
    expect(speedAt(DIVE_TRACK.length)).toBe(DIVE.speed.top);
    for (let d = 1; d < DIVE_TRACK.length; d++) {
      expect(speedAt(d)).toBeGreaterThanOrEqual(speedAt(d - 1));
      expect(Math.abs(bendAt(d) - bendAt(d - 1))).toBeLessThan(0.002);
    }
  });

  it('specials: phasing passes through anything but a gap, the shield stops blasts, a brace smashes through', () => {
    const mid = DIVE.lanes[1];
    expect(meet('rock', [1], plain(mid, { special: 'phase' }))).toBe('clear');
    expect(meet('gap', [0, 1, 2], plain(mid, { special: 'phase' }))).toBe('hit');
    expect(meet('gap', [0, 1, 2], plain(mid, { special: 'merge' }))).toBe('clear');
    expect(meet('kraab', [1], plain(mid, { special: 'shield' }))).toBe('shielded');
    expect(meet('cannon', [1], plain(mid))).toBe('hit');
    expect(meet('rock', [1], plain(mid, { special: 'brace' }))).toBe('smashed');
    expect(meet('beam', [0, 1, 2], plain(mid, { ducking: true }))).toBe('clear');
    expect(meet('smoothy', [1], plain(mid))).toBe('collect');
    expect(meet('smoothy', [0], plain(mid))).toBe('clear');
  });

  it('attacks: shots down drones and crab-bots, only a smash breaks rock', () => {
    expect(attackBreaks('shot', 'drone')).toBe(true);
    expect(attackBreaks('smash', 'drone')).toBe(false);
    expect(attackBreaks('shot', 'crabbot')).toBe(true);
    expect(attackBreaks('shot', 'rock')).toBe(false);
    expect(attackBreaks('smash', 'rock')).toBe(true);
    expect(attackBreaks('strike', 'kraab')).toBe(false);
  });
});

describe("the hunters' rules", () => {
  it("Kraab's front shell stops light hits from the front; his back, his open claw and smashes get through", () => {
    expect(kraabShelled(1, 100, false, { x: 120, kind: 'melee', heavy: false })).toBe(true);
    expect(kraabShelled(1, 100, false, { x: 80, kind: 'melee', heavy: false })).toBe(false);
    expect(kraabShelled(1, 100, true, { x: 120, kind: 'melee', heavy: false })).toBe(false);
    expect(kraabShelled(1, 100, false, { x: 120, kind: 'smash', heavy: false })).toBe(false);
    expect(kraabShelled(-1, 100, false, { x: 120, kind: 'melee', heavy: true })).toBe(false);
  });

  it("a crab-bot's shell is the same, and nothing is shelled once it's flipped", () => {
    expect(crabShelled(-1, 50, false, { x: 40, kind: 'melee', heavy: false })).toBe(true);
    expect(crabShelled(-1, 50, false, { x: 60, kind: 'melee', heavy: false })).toBe(false);
    expect(crabShelled(-1, 50, true, { x: 40, kind: 'melee', heavy: false })).toBe(false);
    expect(crabShelled(-1, 50, false, { x: 40, kind: 'smash', heavy: false })).toBe(false);
  });

  it('only weight cracks the pillar: a smash, a throw, or Kraab\'s own blast sent back', () => {
    expect(cracksPillar({ kind: 'smash', heavy: false })).toBe(true);
    expect(cracksPillar({ kind: 'melee', heavy: true })).toBe(true);
    expect(cracksPillar({ kind: 'reflect', heavy: false, shot: 'claw' })).toBe(true);
    expect(cracksPillar({ kind: 'reflect', heavy: false, shot: 'shard' })).toBe(false);
    expect(cracksPillar({ kind: 'fire', heavy: false })).toBe(false);
    expect(cracksPillar({ kind: 'melee', heavy: false })).toBe(false);
  });

  it('Tetrax: shards barely scratch him, smashes crack him, fire heats him and the next hit shatters', () => {
    const R = TETRAX.rules;
    const open = { heated: false, guarding: false, x: 100, facing: 1 as const };
    expect(tetraxDamage({ damage: 4, kind: 'melee', shot: 'shard', heavy: false, x: 120 }, open).damage).toBeCloseTo(4 * R.shardMultiplier);
    const smash = tetraxDamage({ damage: 4, kind: 'smash', heavy: false, x: 120 }, open);
    expect(smash.cracked).toBe(true);
    expect(smash.damage).toBeCloseTo(4 * R.smashMultiplier);
    expect(tetraxDamage({ damage: 2, kind: 'fire', heavy: false, x: 120 }, open).heats).toBe(true);
    const hot = { ...open, heated: true };
    const shatter = tetraxDamage({ damage: 3, kind: 'melee', heavy: false, x: 120 }, hot);
    expect(shatter.shatter).toBe(true);
    expect(shatter.damage).toBeCloseTo(3 * R.heatedMultiplier);
    // Fire on hot crystal doesn't shatter it (it heats it more).
    expect(tetraxDamage({ damage: 2, kind: 'fire', heavy: false, x: 120 }, hot).shatter).toBe(false);
  });

  it("Tetrax's guard stops anything from the front except a smash; his back is open", () => {
    const guard = { heated: false, guarding: true, x: 100, facing: 1 as const };
    expect(tetraxDamage({ damage: 4, kind: 'melee', heavy: false, x: 120 }, guard)).toMatchObject({ blocked: true, damage: 0 });
    expect(tetraxDamage({ damage: 4, kind: 'smash', heavy: false, x: 120 }, guard).blocked).toBe(false);
    expect(tetraxDamage({ damage: 4, kind: 'melee', heavy: false, x: 80 }, guard).blocked).toBe(false);
  });
});

describe('Sixsix up the lift shaft', () => {
  // Ben on a ledge (anywhere on its outer two thirds) and Sixsix over the far side, at the worst of his drift.
  const { shaft } = bounty.hunters;
  const T = 16;
  const B = SIXSIX.boss;
  const elevations = HUNTERS_BOSS.ledges.flatMap((l) => {
    const onLeft = l.x * T + (l.w * T) / 2 < (shaft.w * T) / 2;
    const wall = onLeft ? l.x * T + 6 : (l.x + l.w) * T - 6;
    const inner = onLeft ? (l.x + (l.w * 2) / 3) * T : (l.x + l.w / 3) * T;
    const sixsix = onLeft ? shaft.w * T - B.hoverInset - B.hoverDriftPx : B.hoverInset + B.hoverDriftPx;
    return [wall, inner].map((x) => (Math.atan2(B.hoverAbove, Math.abs(sixsix - x)) * 180) / Math.PI);
  });
  const steepest = Math.max(...elevations);

  it('hovers on a diagonal every answer the tip names can reach: up-shots, up-shards and a tilted shield', () => {
    const F = HEATBLAST_TUNING.fireball;
    const S = DIAMONDHEAD_TUNING.shard;
    const SH = DIAMONDHEAD_TUNING.shield;
    expect(steepest).toBeLessThanOrEqual(38 + F.assistConeDeg);
    expect(steepest).toBeLessThanOrEqual(S.upDeg + S.assistConeDeg);
    expect(steepest).toBeLessThanOrEqual(SH.tiltDeg + SH.reflectAssistDeg);
  });

  it('stays clear of the next ledge up, so the climb never jumps Ben into him', () => {
    const gap = (HUNTERS_BOSS.ledges[1].up - HUNTERS_BOSS.ledges[0].up) * T;
    // Ben is about 40 px tall: his head on the next ledge stays under Sixsix's feet.
    expect(B.hoverAbove - gap).toBeGreaterThan(40);
  });
});

describe("the lift's forced misfire", () => {
  it('never gives Ben the alien he asked for, and picks one that can survive the volley', () => {
    const dial = ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly', 'upgrade', 'ghostfreak', 'diamondhead'];
    for (const wanted of dial) {
      const got = pickForcedMisfire(wanted, dial);
      expect(got).not.toBe(wanted);
      expect(dial).toContain(got);
    }
    // Ghostfreak phases through the volley: first choice, unless he's the one asked for.
    expect(pickForcedMisfire('diamondhead', dial)).toBe('ghostfreak');
    expect(pickForcedMisfire('ghostfreak', dial)).toBe('xlr8');
  });

  it('works with a short dial (practice runs, odd saves), and gives up with nothing else on it', () => {
    expect(pickForcedMisfire('heatblast', ['heatblast', 'wildmutt'])).toBe('wildmutt');
    expect(pickForcedMisfire('heatblast', ['heatblast'])).toBeNull();
    expect(pickForcedMisfire('heatblast', [])).toBeNull();
  });
});

describe('the new aliens open older secrets', () => {
  /** Only `who` can stand beside `cardId` (in its room, on its floor) from `from`, in an older chapter. */
  function onlyIn(lvl: LevelData, from: Pos, cardId: string, who: Capabilities[]): void {
    const g = buildCells(lvl);
    const c = lvl.entities.find((e) => e.type === 'card' && e.id === cardId) as { x: number; y: number };
    const beside = (p: Pos) => Math.abs(p.x - c.x) <= 1 && p.y === c.y - 1;
    for (const caps of ALL) expect(canReach(lvl, g, from, beside, caps), `${cardId}: ${NAMES.get(caps)}`).toBe(who.includes(caps));
  }

  it("Chapter 4's laser vault: Diamondhead bounces the beam into the receiver and the crystal seal drops", () => {
    onlyIn(CHAPTER_4, { x: 352, y: 32 }, 'ch4-card-laser', [DIAMONDHEAD]);
  });

  it("Chapter 4's sealed room: Ghostfreak walks through the welded door (from the mezzanine)", () => {
    onlyIn(CHAPTER_4, { x: 368, y: 24 }, 'ch4-card-sealed', [GHOSTFREAK]);
  });

  it("Chapter 3's sealed exhibit vault: Ghostfreak", () => {
    onlyIn(CHAPTER_3, { x: 180, y: 29 }, 'ch3-card-vault', [GHOSTFREAK]);
  });

  it("Chapter 1's cliff seam: Diamondhead sends the jammer's beam onto the seam in the ground", () => {
    onlyIn(CHAPTER_1, { x: 185, y: 23 }, 'ch1-card-beam', [DIAMONDHEAD]);
  });

  it('each one has a hint, a receiver for every gate, and stays above head height on the walkway', () => {
    for (const lvl of [CHAPTER_1, CHAPTER_3, CHAPTER_4]) {
      for (const c of lvl.entities.filter((e) => e.type === 'card' && (e.requires === 'diamondhead' || e.requires === 'ghostfreak')) as Array<{ id: string; requires: string }>) {
        expect(lvl.entities.some((e) => e.type === 'alienHint' && e.alien === c.requires), c.id).toBe(true);
      }
      for (const gate of lvl.entities.filter((e) => e.type === 'crystalGate') as Array<{ id: string }>) {
        expect(lvl.entities.some((e) => e.type === 'receiver' && e.gate === gate.id), gate.id).toBe(true);
      }
    }
    // Chapter 4's beam runs three rows over the depot floor: walkers pass under it.
    const laser = CHAPTER_4.entities.find((e) => e.type === 'laser' && e.id === 'ch4-vault-laser') as { y: number };
    expect(laser.y).toBe(33 - 3);
  });
});
