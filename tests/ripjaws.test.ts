import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { CHAPTER_3 } from '../src/levels/chapter3';
import { CHAPTER_5 } from '../src/levels/chapter5';
import { CHAPTER_6 } from '../src/levels/chapter6';
import { buildCells } from '../src/levels/buildLevel';
import { canReach, HUMAN_CAPS, type Pos } from '../src/levels/reachability';
import { checkpointsFor } from '../src/levels/checkpoints';
import type { LevelData } from '../src/levels/types';
import { misfireLines } from '../src/aliens/misfire';
import { SWIM, SWIM_BEN, SWIM_FEEL, BREATH } from '../src/config/swim';
import { createSwimState, enterWater, stepSwim } from '../src/systems/swim/SwimMotor';
import { Breath } from '../src/systems/swim/Breath';
import { Omnitrix } from '../src/systems/Omnitrix';

const RIPJAWS = getAlien('ripjaws');

/** From the last checkpoint before the card (or the start), can this form get its hands on it? */
function reachesCard(level: LevelData, id: string, caps = RIPJAWS.reach, from?: Pos): boolean {
  const card = level.entities.find((e): e is Extract<typeof e, { type: 'card' }> => e.type === 'card' && e.id === id)!;
  const cps = [...checkpointsFor(level), ...level.entities.filter((e) => e.type === 'checkpoint')]
    .filter((c): c is Extract<typeof c, { type: 'checkpoint' }> => c.type === 'checkpoint' && c.x <= card.x)
    .sort((a, b) => b.x - a.x);
  const start: Pos = from ?? (cps[0] ? { x: cps[0].x + 1, y: cps[0].y - 1 } : { x: level.playerStart.x, y: level.playerStart.y - 1 });
  return canReach(level, buildCells(level), start, (p) => Math.abs(p.x - card.x) <= 1 && Math.abs(p.y - card.y) <= 2, caps);
}

/** Chapter 3's vat sits past the lockdown's vent, which Wildmutt sniffs open on the way (it stays open). */
const CH3_VENT_OPEN: LevelData = { ...CHAPTER_3, entities: CHAPTER_3.entities.filter((e) => !(e.type === 'hiddenDoor' && e.id === 'ch3-lock-door')) };
const FROM: Record<string, { level: LevelData; at: Pos }> = { 'ch3-card-vat': { level: CH3_VENT_OPEN, at: { x: 340, y: 8 } } };

describe('Ripjaws', () => {
  it('joins the dial in Chapter 7, swims anywhere, drains on land', () => {
    expect(RIPJAWS.unlockChapter).toBe(7);
    expect(RIPJAWS.swim?.anyWater).toBe(true);
    expect(RIPJAWS.swim?.breathMs).toBe(Infinity);
    expect(RIPJAWS.landDrain).toBeGreaterThan(1);
    // The fastest swimmer of them all.
    for (const [id, s] of Object.entries(SWIM)) if (id !== 'ripjaws') expect(RIPJAWS.swim!.speed, id).toBeGreaterThan(s.speed);
  });

  it('opens the cards that waited for him in Chapters 3, 5 and 6', () => {
    const waiting: Array<[LevelData, string]> = [
      [CHAPTER_3, 'ch3-card-vat'],
      [CHAPTER_5, 'ch5-card-flooded'],
      [CHAPTER_6, 'ch6-card-cistern'],
    ];
    for (const [level, id] of waiting) {
      const card = level.entities.find((e) => e.type === 'card' && e.id === id) as { requires?: string } | undefined;
      expect(card?.requires, id).toBe('ripjaws');
      const from = FROM[id];
      expect(reachesCard(from?.level ?? level, id, RIPJAWS.reach, from?.at), id).toBe(true);
      expect(reachesCard(from?.level ?? level, id, HUMAN_CAPS, from?.at), `${id} (human)`).toBe(false);
    }
  });

  it('has a misfire line for every other alien, both ways', () => {
    for (const other of ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly', 'upgrade', 'diamondhead', 'ghostfreak', 'greymatter']) {
      expect(misfireLines(other, 'ripjaws').length, `${other} > ripjaws`).toBeGreaterThan(0);
      expect(misfireLines('ripjaws', other).length, `ripjaws > ${other}`).toBeGreaterThan(0);
    }
  });
});

describe('swimming', () => {
  const water = { surface: 100, currentX: 0, currentY: 0 };
  const deep = { top: 140, height: 22 };

  it('swims toward the stick with momentum, and coasts to a stop without it', () => {
    const s = createSwimState();
    let vx = 0;
    for (let i = 0; i < 60; i++) vx = stepSwim(s, { moveX: 1, moveY: 0, jumpPressed: false }, SWIM_BEN, deep, water, 16, SWIM_FEEL.floatAbove).vx;
    expect(vx).toBeCloseTo(SWIM_BEN.speed, 0);
    const after = stepSwim(s, { moveX: 0, moveY: 0, jumpPressed: false }, SWIM_BEN, deep, water, 16, SWIM_FEEL.floatAbove).vx;
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(vx);
  });

  it('sinks slowly doing nothing; Ripjaws hangs still', () => {
    const ben = createSwimState();
    const rip = createSwimState();
    let vyBen = 0;
    let vyRip = 0;
    for (let i = 0; i < 60; i++) {
      vyBen = stepSwim(ben, { moveX: 0, moveY: 0, jumpPressed: false }, SWIM_BEN, deep, water, 16, SWIM_FEEL.floatAbove).vy;
      vyRip = stepSwim(rip, { moveX: 0, moveY: 0, jumpPressed: false }, SWIM.ripjaws, deep, water, 16, SWIM_FEEL.floatAbove).vy;
    }
    expect(vyBen).toBeCloseTo(SWIM_BEN.sink, 0);
    expect(vyRip).toBe(0);
  });

  it('JUMP strokes upward under water, and jumps out at the surface', () => {
    const s = createSwimState();
    const stroke = stepSwim(s, { moveX: 0, moveY: 0, jumpPressed: true }, SWIM_BEN, deep, water, 16, SWIM_FEEL.floatAbove);
    expect(stroke.stroked).toBe(true);
    expect(stroke.vy).toBeLessThanOrEqual(-SWIM_BEN.stroke);
    // A second press inside the stroke's cooldown does nothing.
    expect(stepSwim(s, { moveX: 0, moveY: 0, jumpPressed: true }, SWIM_BEN, deep, water, 16, SWIM_FEEL.floatAbove).stroked).toBe(false);
    const surfaced = stepSwim(createSwimState(), { moveX: 0, moveY: 0, jumpPressed: true }, SWIM_BEN, { top: 96, height: 22 }, water, 16, SWIM_FEEL.floatAbove);
    expect(surfaced.jumpedOut).toBe(true);
    expect(surfaced.vy).toBe(-SWIM_BEN.jumpOut);
  });

  it('the surface holds a swimmer in unless it jumps out', () => {
    const s = createSwimState();
    enterWater(s, 0, -200, 1);
    const res = stepSwim(s, { moveX: 0, moveY: -1, jumpPressed: false }, SWIM_BEN, { top: 85, height: 22 }, water, 16, SWIM_FEEL.floatAbove);
    expect(res.vy).toBe(0);
  });

  it('currents carry the swimmer on top of its own swimming, less for the strong', () => {
    const current = { surface: 100, currentX: 100, currentY: 0 };
    const ben = stepSwim(createSwimState(), { moveX: 0, moveY: 0, jumpPressed: false }, SWIM_BEN, deep, current, 16, SWIM_FEEL.floatAbove).vx;
    const rip = stepSwim(createSwimState(), { moveX: 0, moveY: 0, jumpPressed: false }, SWIM.ripjaws, deep, current, 16, SWIM_FEEL.floatAbove).vx;
    expect(ben).toBeCloseTo(100, 0);
    expect(rip).toBeLessThan(ben);
  });
});

describe('breath', () => {
  it('runs out, then chokes every couple of seconds, and refills fast at the surface', () => {
    const b = new Breath(1000);
    const events: string[] = [];
    for (let t = 0; t < 1000 + BREATH.damageEveryMs * 2 + 50; t += 50) {
      const e = b.update(50, true);
      if (e) events.push(e);
    }
    expect(events).toEqual(['low', 'empty', 'choke', 'choke']);
    expect(b.empty).toBe(true);
    for (let t = 0; t < BREATH.refillMs + 50; t += 50) b.update(50, false);
    expect(b.ratio).toBe(1);
  });

  it('forms without lungs never run out', () => {
    const b = new Breath(Infinity);
    for (let i = 0; i < 1000; i++) expect(b.update(100, true)).toBeNull();
    expect(b.ratio).toBe(1);
    expect(b.needsAir).toBe(false);
  });
});

describe('Omnitrix drain rate', () => {
  it('runs the alien timer faster while the rate is up', () => {
    const omni = new Omnitrix({ transformDurationMs: 10_000, cooldownMs: 1000, warningMs: 500, wrongTransformChance: 0 }, ['ripjaws']);
    omni.transform();
    omni.setDrainRate(2.5);
    omni.update(1000);
    expect(omni.timeRemainingMs).toBeCloseTo(7500, 0);
    omni.setDrainRate(1);
    omni.update(1000);
    expect(omni.timeRemainingMs).toBeCloseTo(6500, 0);
  });
});
