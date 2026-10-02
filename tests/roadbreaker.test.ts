import { describe, expect, it } from 'vitest';
import { ROADBREAKER as RB } from '../src/config/roadbreaker';
import { coreMultiplier, tireMultiplier, type CoreState } from '../src/entities/bosses/roadbreaker/rules';

const truck: CoreState = { mode: 'truck', stalled: false, seized: false, ventOpen: false, platesBroken: 0 };
const robot: CoreState = { mode: 'robot', stalled: false, seized: false, ventOpen: false, platesBroken: 0 };

describe('ROADBREAKER damage: the right alien for each moment', () => {
  it("the rolling truck's armour gives only to smash", () => {
    expect(coreMultiplier(truck, 'smash')).toBe(1);
    for (const kind of ['melee', 'fire', 'burst', 'rocket'] as const) expect(coreMultiplier(truck, kind)).toBe(RB.truck.armour);
  });

  it('a stalled truck takes extra from everything', () => {
    for (const kind of ['melee', 'fire', 'smash'] as const) expect(coreMultiplier({ ...truck, stalled: true }, kind)).toBe(RB.truck.stalledMultiplier);
  });

  it("tires shred to XLR8's cuts and shrug off fire", () => {
    expect(tireMultiplier('melee')).toBeGreaterThan(1);
    expect(tireMultiplier('fire')).toBeLessThan(0.5);
    expect(tireMultiplier('smash')).toBe(1);
  });

  it('the robot core opens up as Four Arms breaks its plates', () => {
    const steps = [0, 1, 2, 3].map((n) => coreMultiplier({ ...robot, platesBroken: n }, 'melee'));
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    expect(steps[3]).toBe(1);
  });

  it("open vents let Heatblast's fire in; a seized robot takes extra", () => {
    expect(coreMultiplier({ ...robot, ventOpen: true }, 'fire')).toBeCloseTo(RB.robot.coreArmour[0] * RB.robot.vent.fireMultiplier);
    expect(coreMultiplier({ ...robot, ventOpen: true }, 'smash')).toBe(RB.robot.coreArmour[0]);
    expect(coreMultiplier({ ...robot, seized: true }, 'melee')).toBeCloseTo(RB.robot.coreArmour[0] * RB.robot.vent.seizedMultiplier);
  });

  it('switching pays: the best answer at each stage beats sticking with one alien', () => {
    // Fireballs into an open vent beat fireballs into the plates; smash beats fire on the rolling truck.
    expect(coreMultiplier({ ...robot, ventOpen: true }, 'fire')).toBeGreaterThan(coreMultiplier(robot, 'fire') * 2);
    expect(coreMultiplier(truck, 'smash')).toBeGreaterThan(coreMultiplier(truck, 'fire') * 4);
  });
});
