import { describe, expect, it } from 'vitest';

import {
  calculateLinearFeedforwardKa,
  calculateLinearFeedforwardKg,
  calculateLinearFeedforwardKv,
} from '~/lib/math/kVkA';
import { simulateElevatorWpilib } from '~/lib/math/linear.worker';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

function makeFeedforward(
  motor: Motor,
  ratio: Ratio,
  spoolDiameter: Measurement,
  load: Measurement,
  angle: Measurement,
  efficiency: number,
  batteryVoltage: Measurement,
) {
  const spoolRadius = spoolDiameter.div(2);
  const kV = calculateLinearFeedforwardKv(
    motor,
    ratio,
    spoolRadius,
    efficiency,
  );
  const kA = calculateLinearFeedforwardKa(
    motor,
    ratio,
    spoolRadius,
    load,
    efficiency,
  );
  const kG = calculateLinearFeedforwardKg(kA, angle);
  const kVScalar = kV.to('V*s/m').scalar;
  const kAScalar = kA.to('V*s^2/m').scalar;
  const kGScalar = kG.to('V').scalar;
  const battV = batteryVoltage.to('V').scalar;
  // Split the available voltage budget (battV - kG) evenly between the
  // velocity and acceleration terms so that the feedforward at (vMax, aMax)
  // equals exactly battV. This ensures the simulation can follow the profile
  // throughout the acceleration phase without exceeding V_supply.
  const vAvailable = Math.max(0, battV - kGScalar);
  const maxVelocity = new Measurement(
    kVScalar === 0 ? 0 : vAvailable / (2 * kVScalar),
    'm/s',
  );
  const maxAcceleration = new Measurement(
    kAScalar === 0 ? 0 : vAvailable / (2 * kAScalar),
    'm/s^2',
  );
  return { kV, kA, kG, maxVelocity, maxAcceleration };
}

describe('simulateElevatorWpilib', () => {
  it('simulates a typical elevator and reaches goal successfully', async () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(2, RatioType.REDUCTION);
    const load = new Measurement(10, 'lb');
    const spoolDiameter = new Measurement(2, 'in');
    const travelDistance = new Measurement(40, 'in');
    // Use unconstrained current limits and a stiff battery (0Ω resistance) so
    // the feedforward-derived profile can be followed without voltage sag.
    // A real battery with 0.015Ω would sag to ~7.5V under stall current,
    // preventing the elevator from reaching the feedforward-computed maxAccel.
    const currentLimit = new Measurement(1000, 'A');
    const supplyLimit = new Measurement(1000, 'A');
    const batteryResistance = new Measurement(0, 'Ohm');
    const batteryVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');

    const { maxVelocity, maxAcceleration } = makeFeedforward(
      motor,
      ratio,
      spoolDiameter,
      load,
      angle,
      1.0,
      batteryVoltage,
    );

    const result = await simulateElevatorWpilib(
      motor.toDict(),
      ratio.toDict(),
      load.toDict(),
      spoolDiameter.toDict(),
      travelDistance.toDict(),
      currentLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      batteryVoltage.toDict(),
      angle.toDict(),
      1.0,
      false,
      0.1,
      maxVelocity.toDict(),
      maxAcceleration.toDict(),
      0.1,
      0.1,
      12,
      0.001,
    );

    expect(result.length).toBeGreaterThan(0);
    const last = result[result.length - 1];
    expect(last.positionMeters).toBeCloseTo(travelDistance.to('m').scalar, 1);
  });

  it('velocity profile is trapezoidal: rises then falls', async () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(15, 'lb');
    const spoolDiameter = new Measurement(1.5, 'in');
    const travelDistance = new Measurement(60, 'in');
    const currentLimit = new Measurement(1000, 'A');
    const supplyLimit = new Measurement(1000, 'A');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const batteryVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');

    const { maxVelocity, maxAcceleration } = makeFeedforward(
      motor,
      ratio,
      spoolDiameter,
      load,
      angle,
      1.0,
      batteryVoltage,
    );

    const result = await simulateElevatorWpilib(
      motor.toDict(),
      ratio.toDict(),
      load.toDict(),
      spoolDiameter.toDict(),
      travelDistance.toDict(),
      currentLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      batteryVoltage.toDict(),
      angle.toDict(),
      1.0,
      false,
      0.1,
      maxVelocity.toDict(),
      maxAcceleration.toDict(),
      0.1,
      0.1,
      12,
      0.001,
    );

    expect(result.length).toBeGreaterThan(10);

    // Find the peak velocity index
    let peakIdx = 0;
    for (let i = 1; i < result.length; i++) {
      if (
        result[i].velocityMetersPerSecond >
        result[peakIdx].velocityMetersPerSecond
      ) {
        peakIdx = i;
      }
    }

    // Peak should not be at the very start or very end (trapezoidal shape)
    expect(peakIdx).toBeGreaterThan(0);
    expect(peakIdx).toBeLessThan(result.length - 1);

    // Velocity should increase before peak and decrease after
    const firstVel = result[0].velocityMetersPerSecond;
    const peakVel = result[peakIdx].velocityMetersPerSecond;
    const lastVel = result[result.length - 1].velocityMetersPerSecond;
    expect(peakVel).toBeGreaterThan(firstVel);
    expect(peakVel).toBeGreaterThan(lastVel);
  });

  it('cascade mode simulates first-stage mechanics: half travel, double load', async () => {
    const motor = Motor.KrakenX60sFOC(1);
    const ratio = new Ratio(4, RatioType.REDUCTION);
    const load = new Measurement(10, 'lb');
    const spoolDiameter = new Measurement(2, 'in');
    const travelDistance = new Measurement(40, 'in');
    const currentLimit = new Measurement(1000, 'A');
    const supplyLimit = new Measurement(1000, 'A');
    const batteryResistance = new Measurement(0.015, 'Ohm');
    const batteryVoltage = new Measurement(12, 'V');
    const angle = new Measurement(90, 'deg');

    const { maxVelocity, maxAcceleration } = makeFeedforward(
      motor,
      ratio,
      spoolDiameter,
      load,
      angle,
      1.0,
      batteryVoltage,
    );

    const commonArgs = [
      motor.toDict(),
      ratio.toDict(),
      load.toDict(),
      spoolDiameter.toDict(),
      travelDistance.toDict(),
      currentLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      batteryVoltage.toDict(),
      angle.toDict(),
      1.0,
    ] as const;

    const [standard, cascade] = await Promise.all([
      simulateElevatorWpilib(
        ...commonArgs,
        false,
        0.1,
        maxVelocity.toDict(),
        maxAcceleration.toDict(),
        0.1,
        0.1,
        12,
        0.001,
      ),
      simulateElevatorWpilib(
        ...commonArgs,
        true,
        0.1,
        maxVelocity.toDict(),
        maxAcceleration.toDict(),
        0.1,
        0.1,
        12,
        0.001,
      ),
    ]);

    const travelDistanceMeters = travelDistance.to('m').scalar;

    // Non-cascade should reach approximately the full travel distance
    // (within 15 cm — discrete feedforward vs. RKDP integration leaves a small
    // residual that accumulates over many timesteps)
    const standardFinalPos = standard[standard.length - 1].positionMeters;
    expect(standardFinalPos).toBeGreaterThan(travelDistanceMeters - 0.15);

    // Cascade first-stage travel is approximately half the carriage travel
    const cascadeFinalPos = cascade[cascade.length - 1].positionMeters;
    expect(cascadeFinalPos).toBeGreaterThan(travelDistanceMeters / 2 - 0.15);
    expect(cascadeFinalPos).toBeLessThan(travelDistanceMeters / 2 + 0.15);
    // Cascade goal is half the full goal
    expect(cascadeFinalPos).toBeLessThan(standardFinalPos * 0.75);
  });
});
