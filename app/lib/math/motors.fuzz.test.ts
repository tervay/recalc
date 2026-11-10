import { describe, expect, it } from 'vitest';

import { cartesian, measurement } from '~/lib/math/fuzzTestUtils';
import {
  generateMotorCurve,
  type WpilibMotorSimState,
} from '~/lib/math/motors.worker';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';

const LIMITS = cartesian([20, 60, 120], [30, 80]);

const curve = (
  motor: Motor,
  statorA: number,
  supplyA: number,
  statorV = 12,
): Promise<WpilibMotorSimState[]> =>
  generateMotorCurve({
    motor: motor.toDict(),
    statorLimit: measurement(statorA, 'A').toDict(),
    supplyLimit: measurement(supplyA, 'A').toDict(),
    statorVoltage: measurement(statorV, 'V').toDict(),
    supplyVoltage: measurement(12.3, 'V').toDict(),
  });

const motors = ALL_MOTORS.map((specs) => Motor.fromSpecs(specs, 1));

describe('motor curve invariants', { timeout: 120_000 }, () => {
  it('keeps efficiency between 0 and 1', async () => {
    const violations: string[] = [];
    for (const motor of motors) {
      for (const [statorA, supplyA] of LIMITS) {
        const rows = await curve(motor, statorA, supplyA);
        if (rows.some((r) => !(r.efficiency >= 0 && r.efficiency <= 1))) {
          violations.push(`${motor.identifier} ${statorA}/${supplyA}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('never draws more stator current than the limit', async () => {
    const violations: string[] = [];
    for (const motor of motors) {
      for (const [statorA, supplyA] of LIMITS) {
        const rows = await curve(motor, statorA, supplyA);
        if (rows.some((r) => r.currentDrawAmps > statorA * (1 + 1e-9))) {
          violations.push(`${motor.identifier} ${statorA}/${supplyA}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('never produces more than the rated stall torque', async () => {
    const violations: string[] = [];
    for (const motor of motors) {
      const stallTorque = motor.stallTorque.to('N*m').scalar;
      const rows = await curve(motor, 10_000, 10_000);
      if (rows.some((r) => r.torqueNewtonMeters > stallTorque * (1 + 1e-6))) {
        violations.push(motor.identifier);
      }
    }

    expect(violations).toEqual([]);
  });

  it('starts at the rated stall torque when nothing limits current', async () => {
    const violations: string[] = [];
    for (const motor of motors) {
      const [stall] = await curve(motor, 10_000, 10_000);
      const expected = motor.stallTorque.to('N*m').scalar;
      if (Math.abs(stall.torqueNewtonMeters - expected) > expected * 1e-6) {
        violations.push(motor.identifier);
      }
    }

    expect(violations).toEqual([]);
  });

  it('doubles the stall torque with two motors', async () => {
    const violations: string[] = [];
    for (const specs of ALL_MOTORS) {
      const [single] = await curve(Motor.fromSpecs(specs, 1), 40, 40);
      const [double] = await curve(Motor.fromSpecs(specs, 2), 40, 40);
      if (
        Math.abs(double.torqueNewtonMeters - 2 * single.torqueNewtonMeters) >
        1e-9 * Math.max(1, single.torqueNewtonMeters)
      ) {
        violations.push(specs.name);
      }
    }

    expect(violations).toEqual([]);
  });
});
