import { describe, expect, it } from 'vitest';

import { computeShotResult, type ShooterMode } from '~/lib/math/ballShot';
import {
  computeFlywheelFeedforwardGains,
  simulateFlywheelWpilib,
} from '~/lib/math/flywheel.worker';
import { cartesian, measurement, reduction } from '~/lib/math/fuzzTestUtils';
import Motor from '~/lib/models/Motor';

type SpinUpCase = {
  motor: Motor;
  ratio: number;
  statorA: number;
  supplyA: number;
  batteryV: number;
  moiInLb: number;
  targetRpm: number;
  efficiency: number;
};

const spinUpCases: SpinUpCase[] = cartesian(
  [Motor.KrakenX60sFOC(1), Motor.NEO(2)],
  [0.75, 1.5],
  [40, 80],
  [30, 60],
  [6, 24],
  [2500, 4000],
  [0.8, 1],
).map(([motor, ratio, statorA, supplyA, moiInLb, targetRpm, efficiency]) => ({
  motor,
  ratio,
  statorA,
  supplyA,
  batteryV: 12.3,
  moiInLb,
  targetRpm,
  efficiency,
}));

async function spinUpSeconds(c: SpinUpCase): Promise<number> {
  const states = await simulateFlywheelWpilib(
    c.motor.toDict(),
    reduction(c.ratio).toDict(),
    measurement(c.statorA, 'A').toDict(),
    measurement(c.supplyA, 'A').toDict(),
    measurement(12, 'V').toDict(),
    measurement(0.015, 'Ohm').toDict(),
    measurement(c.batteryV, 'V').toDict(),
    measurement(c.moiInLb, 'in2*lbs').toDict(),
    measurement(c.targetRpm, 'rpm').toDict(),
    c.efficiency,
    0.1,
  );
  const last = states.at(-1);
  return last?.success ? last.timeSeconds : Number.POSITIVE_INFINITY;
}

async function monotonicViolations(
  bump: (c: SpinUpCase) => SpinUpCase,
  direction: 'faster' | 'slower',
) {
  const violations: { before: number; after: number }[] = [];
  for (const c of spinUpCases) {
    const before = await spinUpSeconds(c);
    if (!Number.isFinite(before)) continue;
    const after = await spinUpSeconds(bump(c));
    const worse = direction === 'faster' ? after > before : after < before;
    if (worse) violations.push({ before, after });
  }
  return violations;
}

describe('flywheel spin-up invariants', { timeout: 120_000 }, () => {
  it('covers mostly flywheels that reach their target', async () => {
    const times = await Promise.all(spinUpCases.map(spinUpSeconds));

    expect(times.filter(Number.isFinite).length).toBeGreaterThan(
      spinUpCases.length / 2,
    );
  });

  it('never spins up slower when the stator limit rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, statorA: c.statorA * 1.25 }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never spins up slower when the supply limit rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, supplyA: c.supplyA * 1.25 }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never spins up slower when efficiency rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, efficiency: Math.min(1, c.efficiency + 0.1) }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never spins up slower when the battery voltage rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, batteryV: c.batteryV + 0.4 }),
        'faster',
      ),
    ).toEqual([]);
  });

  it('never spins up faster when the moment of inertia rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, moiInLb: c.moiInLb * 1.25 }),
        'slower',
      ),
    ).toEqual([]);
  });

  it('never spins up faster when the target speed rises', async () => {
    expect(
      await monotonicViolations(
        (c) => ({ ...c, targetRpm: c.targetRpm * 1.1 }),
        'slower',
      ),
    ).toEqual([]);
  });

  it('reports a kV that does not depend on efficiency', async () => {
    const kVAt = async (efficiency: number) =>
      (
        await computeFlywheelFeedforwardGains(
          Motor.KrakenX60sFOC(2).toDict(),
          reduction(1.5).toDict(),
          measurement(12, 'in2*lbs').toDict(),
          efficiency,
        )
      ).kV;

    expect(await kVAt(0.6)).toBeCloseTo(await kVAt(1), 12);
  });
});

describe('ball shot invariants', () => {
  const modes: ShooterMode[] = ['single-hooded', 'dual-shooter', 'compound'];
  const shots = cartesian(
    modes,
    [0.0254, 0.0508],
    [0.05, 0.12],
    [0.1, 0.27],
    [2e-5, 4e-4, 3e-3],
    [150, 400],
    [0.5, 1, 2],
  ).map(([mode, rW, rB, mB, iW, omega, G]) => ({
    mode,
    omega,
    rW,
    rB,
    mB,
    iW,
    G,
    result: computeShotResult({
      mode,
      flywheelOmega: measurement(omega, 'rad/s'),
      shooterRadius: measurement(rW, 'm'),
      combinedMOI: measurement(iW, 'kg*m^2'),
      ballMass: measurement(mB, 'kg'),
      ballRadius: measurement(rB, 'm'),
      ballMOI: measurement(0.4 * mB * rB * rB, 'kg*m^2'),
      secondaryRadius: measurement(0.0381, 'm'),
      secondaryToShooterRatio: G,
    }),
  }));

  it('never gives the ball more energy than the flywheel loses', () => {
    const violations = shots.filter(
      ({ result }) =>
        result.ballKineticEnergy.to('J').scalar >
        result.flywheelEnergyLost.to('J').scalar * (1 + 1e-9),
    );

    expect(violations).toEqual([]);
  });

  it('never launches a ball at rest backwards', () => {
    const violations = shots.filter(
      ({ result }) => result.exitVelocity.to('m/s').scalar < 0,
    );

    expect(violations).toEqual([]);
  });

  it('never speeds up the flywheel when launching a ball at rest', () => {
    const violations = shots.filter(
      ({ omega, result }) => result.postShotOmega.to('rad/s').scalar > omega,
    );

    expect(violations).toEqual([]);
  });

  it('never launches a hooded ball faster than half the wheel surface speed', () => {
    const violations = shots.filter(
      ({ mode, omega, rW, result }) =>
        mode === 'single-hooded' &&
        result.exitVelocity.to('m/s').scalar > (rW * omega) / 2 + 1e-12,
    );

    expect(violations).toEqual([]);
  });
});
