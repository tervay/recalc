import { describe, expect, it } from 'vitest';

import {
  computeArmFeedforwardGains,
  simulateArmWpilib,
} from '~/lib/math/arm.worker';
import { cartesian, measurement, reduction } from '~/lib/math/fuzzTestUtils';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

type ArmCase = {
  motor: Motor;
  ratio: number;
  loadLb: number;
  lengthIn: number;
  maxDeg: number;
  statorA: number;
  supplyA: number;
  efficiency: number;
};

const armCases: ArmCase[] = cartesian(
  [Motor.KrakenX60sFOC(1), Motor.NEO(2)],
  [40, 120],
  [4, 15],
  [12, 30],
  [90, 135],
  [40, 80],
  [40, 60],
  [0.8],
).map(
  ([motor, ratio, loadLb, lengthIn, maxDeg, statorA, supplyA, efficiency]) => ({
    motor,
    ratio,
    loadLb,
    lengthIn,
    maxDeg,
    statorA,
    supplyA,
    efficiency,
  }),
);

const pointMassMoi = (c: ArmCase) => {
  const length = new Measurement(c.lengthIn, 'in');
  return new Measurement(c.loadLb, 'lb').mul(length).mul(length);
};

async function upSeconds(c: ArmCase): Promise<number> {
  const states = await simulateArmWpilib(
    c.motor.toDict(),
    reduction(c.ratio).toDict(),
    pointMassMoi(c).toDict(),
    measurement(c.lengthIn, 'in').toDict(),
    measurement(0, 'deg').toDict(),
    measurement(c.maxDeg, 'deg').toDict(),
    measurement(0, 'deg').toDict(),
    measurement(12, 'V').toDict(),
    measurement(12.3, 'V').toDict(),
    measurement(c.statorA, 'A').toDict(),
    measurement(c.supplyA, 'A').toDict(),
    measurement(0.015, 'Ohm').toDict(),
    'up',
    c.efficiency,
    0.1,
  );
  const last = states.at(-1);
  return last?.success ? last.timeSeconds : Number.POSITIVE_INFINITY;
}

async function monotonicViolations(
  bump: (c: ArmCase) => ArmCase,
  direction: 'faster' | 'slower',
) {
  const violations: { before: number; after: number }[] = [];
  for (const c of armCases) {
    const before = await upSeconds(c);
    if (!Number.isFinite(before)) continue;
    const after = await upSeconds(bump(c));
    const worse = direction === 'faster' ? after > before : after < before;
    if (worse) violations.push({ before, after });
  }
  return violations;
}

describe('arm invariants', { timeout: 120_000 }, () => {
  it('covers mostly mechanisms that reach their goal', async () => {
    const times = await Promise.all(armCases.map(upSeconds));

    expect(times.filter(Number.isFinite).length).toBeGreaterThan(
      armCases.length / 2,
    );
  });

  it('never lifts slower when the stator limit rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, statorA: c.statorA * 1.25 }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never lifts slower when the supply limit rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, supplyA: c.supplyA * 1.25 }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never lifts slower when efficiency rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, efficiency: Math.min(1, c.efficiency + 0.1) }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never lifts faster when the load rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, loadLb: c.loadLb * 1.25 }),
        'slower',
      ),
    ).toEqual([]);
  });

  it('never lifts faster when the arm travels farther', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, maxDeg: c.maxDeg + 15 }),
        'slower',
      ),
    ).toEqual([]);
  });

  it('reports a kG that scales linearly with the load', async () => {
    const kGFor = async (loadLb: number) => {
      const c = { ...armCases[0], loadLb };
      return (
        await computeArmFeedforwardGains(
          c.motor.toDict(),
          reduction(c.ratio).toDict(),
          pointMassMoi(c).toDict(),
          c.efficiency,
          measurement(loadLb, 'lb').toDict(),
          measurement(c.lengthIn, 'in').toDict(),
        )
      ).kG;
    };

    expect(await kGFor(10)).toBeCloseTo((await kGFor(5)) * 2, 9);
  });

  it('gives the same lift time for an arm length in meters as in inches', async () => {
    const c = armCases[0];
    const inches = await upSeconds(c);
    const length = new Measurement(c.lengthIn * 0.0254, 'm');
    const states = await simulateArmWpilib(
      c.motor.toDict(),
      reduction(c.ratio).toDict(),
      pointMassMoi(c).toDict(),
      length.toDict(),
      measurement(0, 'rad').toDict(),
      measurement((c.maxDeg * Math.PI) / 180, 'rad').toDict(),
      measurement(0, 'rad').toDict(),
      measurement(12, 'V').toDict(),
      measurement(12.3, 'V').toDict(),
      measurement(c.statorA, 'A').toDict(),
      measurement(c.supplyA, 'A').toDict(),
      measurement(0.015, 'Ohm').toDict(),
      'up',
      c.efficiency,
      0.1,
    );

    expect(states.at(-1)?.timeSeconds).toBeCloseTo(inches, 9);
  });
});
