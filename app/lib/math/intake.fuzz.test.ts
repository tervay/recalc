import { describe, expect, it } from 'vitest';

import { cartesian } from '~/lib/math/fuzzTestUtils';
import {
  calculateAllRecommendedRatiosAndStallTorques,
  calculateLinearSurfaceSpeed,
  calculateRecommendedRatio,
} from '~/lib/math/intake';
import Measurement from '~/lib/models/Measurement';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';

const DRIVETRAIN_SPEEDS_FPS = [4, 9.5, 14, 17.3, 21];
const ROLLER_DIAMETERS_IN = [1, 1.5, 2, 2.625, 4];
const CURRENT_LIMITS_A = [5, 20, 40, 80, 200, 1000];
const QUANTITIES = [1, 2, 3];

const motors = ALL_MOTORS.map((specs) => Motor.fromSpecs(specs, 1));

describe('intake calculator invariants', () => {
  it('runs the roller surface at twice drivetrain speed at the recommended ratio', () => {
    const violations = cartesian(
      motors,
      DRIVETRAIN_SPEEDS_FPS,
      ROLLER_DIAMETERS_IN,
    ).filter(([motor, speed, diameter]) => {
      const drivetrainSpeed = new Measurement(speed, 'ft/s');
      const rollerDiameter = new Measurement(diameter, 'in');
      const surfaceSpeed = calculateLinearSurfaceSpeed(
        motor,
        calculateRecommendedRatio(motor, drivetrainSpeed, rollerDiameter),
        rollerDiameter,
      );
      return Math.abs(surfaceSpeed.to('ft/s').scalar - 2 * speed) > 1e-9;
    });

    expect(violations).toEqual([]);
  });

  it('never reports more torque than the motors can produce through the ratio', () => {
    const violations = cartesian(
      ALL_MOTORS,
      CURRENT_LIMITS_A,
      QUANTITIES,
    ).filter(([specs, amps, quantity]) =>
      calculateAllRecommendedRatiosAndStallTorques(
        new Measurement(14, 'ft/s'),
        new Measurement(2, 'in'),
        Motor.fromSpecs(specs, quantity),
        new Measurement(amps, 'A'),
      ).some(
        ({ motor, ratio, stallTorque }) =>
          stallTorque.to('N*m').scalar >
          motor.stallTorque.to('N*m').scalar *
            quantity *
            ratio.asNumber() *
            (1 + 1e-9),
      ),
    );

    expect(violations).toEqual([]);
  });

  it('never lowers the reported torque when the current limit rises', () => {
    const torquesAt = (amps: number) =>
      calculateAllRecommendedRatiosAndStallTorques(
        new Measurement(14, 'ft/s'),
        new Measurement(2, 'in'),
        Motor.KrakenX60sFOC(1),
        new Measurement(amps, 'A'),
      ).map((r) => r.stallTorque.to('N*m').scalar);

    const sweeps = CURRENT_LIMITS_A.map(torquesAt);
    const drops = sweeps.flatMap((torques, i) =>
      i === 0
        ? []
        : torques.filter((torque, motor) => torque < sweeps[i - 1][motor]),
    );

    expect(drops).toEqual([]);
  });
});
