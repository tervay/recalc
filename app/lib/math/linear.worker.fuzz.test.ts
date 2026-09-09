import { describe, expect, it } from 'vitest';

import {
  computeElevatorFeedbackGains,
  computeElevatorFeedforwardGains,
  simulateElevatorWpilib,
} from '~/lib/math/linear.worker';
import type { WpilibElevatorSimState } from '~/lib/math/linear.worker';
import {
  cartesian,
  LINEAR_FUZZ_MOTORS,
  measurement,
  reduction,
  snapshotNumber,
} from '~/lib/math/linearFuzzTestUtils';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

const KALMAN_POSITION = new Measurement(2, 'in');
const KALMAN_VELOCITY = new Measurement(40, 'in/s');
const KALMAN_ENCODER_POSITION = new Measurement(0.001, 'in');

const gainCases = cartesian(
  LINEAR_FUZZ_MOTORS,
  [1, 4],
  [1, 15],
  [1, 2],
  [-90, 0, 90],
  [0.5, 1],
).map(([motor, ratio, load, spoolDiameter, angle, efficiency]) => ({
  name: `${motor[0]} ratio=${ratio} load=${load} spool=${spoolDiameter} angle=${angle} efficiency=${efficiency}`,
  motor: motor[1],
  ratio,
  load,
  spoolDiameter,
  angle,
  efficiency,
}));

type SimulationCase = {
  name: string;
  motor: Motor;
  ratio: number;
  load: number;
  spoolDiameter: number;
  travelDistance: number;
  angle: number;
  efficiency: number;
  cascade: boolean;
  statorLimit: number;
  supplyLimit: number;
  batteryResistance: number;
};

const simulationCases: SimulationCase[] = [
  {
    name: 'vertical standard elevator',
    motor: Motor.KrakenX60sFOC(1),
    ratio: 2,
    load: 10,
    spoolDiameter: 2,
    travelDistance: 20,
    angle: 90,
    efficiency: 1,
    cascade: false,
    statorLimit: 1_000,
    supplyLimit: 1_000,
    batteryResistance: 0,
  },
  {
    name: 'horizontal standard elevator',
    motor: Motor.KrakenX60(2),
    ratio: 4,
    load: 5,
    spoolDiameter: 1.5,
    travelDistance: 12,
    angle: 0,
    efficiency: 0.9,
    cascade: false,
    statorLimit: 500,
    supplyLimit: 500,
    batteryResistance: 0.005,
  },
  {
    name: 'negative-angle cascade elevator',
    motor: Motor.NEO(1),
    ratio: 5,
    load: 8,
    spoolDiameter: 2,
    travelDistance: 16,
    angle: -45,
    efficiency: 0.75,
    cascade: true,
    statorLimit: 500,
    supplyLimit: 500,
    batteryResistance: 0.005,
  },
  {
    name: 'tight-current vertical elevator',
    motor: Motor.KrakenX60sFOC(2),
    ratio: 8,
    load: 15,
    spoolDiameter: 1,
    travelDistance: 10,
    angle: 90,
    efficiency: 0.5,
    cascade: false,
    statorLimit: 80,
    supplyLimit: 60,
    batteryResistance: 0.015,
  },
];

function simulationParams(testCase: SimulationCase) {
  const maxVelocity = new Measurement(1.5, 'm/s');
  const maxAcceleration = new Measurement(4, 'm/s^2');
  return {
    motorDict: testCase.motor.toDict(),
    ratio: reduction(testCase.ratio).toDict(),
    load: measurement(testCase.load, 'lb').toDict(),
    spoolDiameter: measurement(testCase.spoolDiameter, 'in').toDict(),
    travelDistance: measurement(testCase.travelDistance, 'in').toDict(),
    statorLimitDict: measurement(testCase.statorLimit, 'A').toDict(),
    supplyLimitDict: measurement(testCase.supplyLimit, 'A').toDict(),
    batteryResistance: measurement(testCase.batteryResistance, 'Ohm').toDict(),
    batteryVoltage: measurement(12, 'V').toDict(),
    angle: measurement(testCase.angle, 'deg').toDict(),
    efficiency: testCase.efficiency,
    cascade: testCase.cascade,
    batteryVoltageFilterTimeConstantSeconds: 0.1,
    maxVelocityDict: maxVelocity.toDict(),
    maxAccelerationDict: maxAcceleration.toDict(),
    qPositionMeters: 0.02,
    qVelocityMPS: 0.4,
    rVolts: 12,
    sensorDelaySeconds: 0.001,
    kalmanFilterPositionStdDev: KALMAN_POSITION.toDict(),
    kalmanFilterVelocityStdDev: KALMAN_VELOCITY.toDict(),
    kalmanFilterEncoderPositionStdDev: KALMAN_ENCODER_POSITION.toDict(),
  };
}

function finiteGainValues(values: readonly number[]): void {
  for (const value of values) expect(Number.isFinite(value)).toBe(true);
}

function summarizeTrajectory(
  states: WpilibElevatorSimState[],
  testCase: SimulationCase,
) {
  expect(states.length).toBeGreaterThan(0);

  for (let index = 0; index < states.length; index++) {
    const state = states[index];
    finiteGainValues([
      state.positionMeters,
      state.velocityMetersPerSecond,
      state.statorCurrentDrawAmps,
      state.supplyCurrentDrawAmps,
      state.timeSeconds,
      state.batteryVoltageVolts,
      state.motorAppliedVoltageVolts,
      state.motorRpm,
      state.energyJoules,
    ]);
    expect(
      index === 0 ||
        state.timeSeconds > (states[index - 1]?.timeSeconds ?? -Infinity),
    ).toBe(true);
    expect(Math.abs(state.statorCurrentDrawAmps)).toBeLessThanOrEqual(
      testCase.statorLimit * testCase.motor.quantity * 1.01 + 1e-6,
    );
    expect(Math.abs(state.supplyCurrentDrawAmps)).toBeLessThanOrEqual(
      testCase.supplyLimit * testCase.motor.quantity * 1.01 + 1e-6,
    );
    expect(Math.abs(state.motorAppliedVoltageVolts)).toBeLessThanOrEqual(12.01);
  }

  const first = states[0];
  const middle = states[Math.floor(states.length / 2)];
  const last = states[states.length - 1];
  const maxVelocity = Math.max(
    ...states.map((state) => state.velocityMetersPerSecond),
  );
  const maxCurrent = Math.max(
    ...states.map((state) => Math.abs(state.supplyCurrentDrawAmps)),
  );

  return {
    name: testCase.name,
    rows: states.length,
    first: {
      position: snapshotNumber(first.positionMeters),
      velocity: snapshotNumber(first.velocityMetersPerSecond),
      time: snapshotNumber(first.timeSeconds),
    },
    middle: {
      position: snapshotNumber(middle.positionMeters),
      velocity: snapshotNumber(middle.velocityMetersPerSecond),
      time: snapshotNumber(middle.timeSeconds),
    },
    last: {
      position: snapshotNumber(last.positionMeters),
      velocity: snapshotNumber(last.velocityMetersPerSecond),
      time: snapshotNumber(last.timeSeconds),
      energy: snapshotNumber(last.energyJoules),
      success: last.success,
    },
    maxVelocity: snapshotNumber(maxVelocity),
    maxSupplyCurrent: snapshotNumber(maxCurrent),
  };
}

describe('linear worker gain fuzz cases', () => {
  it('returns finite feedforward and feedback gains across the input matrix', async () => {
    const snapshot = [];

    for (const testCase of gainCases) {
      const feedforward = await computeElevatorFeedforwardGains({
        motorDict: testCase.motor.toDict(),
        ratio: reduction(testCase.ratio).toDict(),
        load: measurement(testCase.load, 'lb').toDict(),
        spoolDiameter: measurement(testCase.spoolDiameter, 'in').toDict(),
        efficiency: testCase.efficiency,
        angle: measurement(testCase.angle, 'deg').toDict(),
      });
      const feedback = await computeElevatorFeedbackGains({
        motorDict: testCase.motor.toDict(),
        ratio: reduction(testCase.ratio).toDict(),
        load: measurement(testCase.load, 'lb').toDict(),
        spoolDiameter: measurement(testCase.spoolDiameter, 'in').toDict(),
        efficiency: testCase.efficiency,
        qPosition: measurement(0.02, 'm').toDict(),
        qVelocity: measurement(0.4, 'm/s').toDict(),
        rVolts: measurement(12, 'V').toDict(),
        feedbackDt: measurement(0.02, 's').toDict(),
        sensorDelay: measurement(0.001, 's').toDict(),
      });

      finiteGainValues([feedforward.kV, feedforward.kA, feedforward.kG]);
      finiteGainValues([feedback.kP, feedback.kD]);
      expect(feedforward.kV).toBeGreaterThan(0);
      expect(feedforward.kA).toBeGreaterThan(0);

      snapshot.push({
        name: testCase.name,
        feedforward: {
          kV: snapshotNumber(feedforward.kV),
          kA: snapshotNumber(feedforward.kA),
          kG: snapshotNumber(feedforward.kG),
        },
        feedback: {
          kP: snapshotNumber(feedback.kP),
          kD: snapshotNumber(feedback.kD),
        },
      });
    }

    expect(snapshot).toMatchSnapshot();
  }, 120_000);

  it('returns zero gains for every TypeScript-side guard condition', async () => {
    const base = {
      motorDict: Motor.KrakenX60sFOC(1).toDict(),
      ratio: reduction(2).toDict(),
      load: measurement(10, 'lb').toDict(),
      spoolDiameter: measurement(2, 'in').toDict(),
      efficiency: 1,
      angle: measurement(90, 'deg').toDict(),
      qPosition: measurement(0.02, 'm').toDict(),
      qVelocity: measurement(0.4, 'm/s').toDict(),
      rVolts: measurement(12, 'V').toDict(),
      feedbackDt: measurement(0.02, 's').toDict(),
      sensorDelay: measurement(0.001, 's').toDict(),
    };

    const cases = [
      {
        name: 'zero ratio',
        ratio: reduction(0).toDict(),
        load: base.load,
        spoolDiameter: base.spoolDiameter,
        efficiency: base.efficiency,
      },
      {
        name: 'zero load',
        ratio: base.ratio,
        load: measurement(0, 'lb').toDict(),
        spoolDiameter: base.spoolDiameter,
        efficiency: base.efficiency,
      },
      {
        name: 'zero spool',
        ratio: base.ratio,
        load: base.load,
        spoolDiameter: measurement(0, 'in').toDict(),
        efficiency: base.efficiency,
      },
    ];

    for (const testCase of cases) {
      const feedforward = await computeElevatorFeedforwardGains({
        motorDict: base.motorDict,
        ratio: testCase.ratio,
        load: testCase.load,
        spoolDiameter: testCase.spoolDiameter,
        efficiency: testCase.efficiency,
        angle: base.angle,
      });
      expect(feedforward).toEqual({ kV: 0, kA: 0, kG: 0 });

      const feedback = await computeElevatorFeedbackGains({
        motorDict: base.motorDict,
        ratio: testCase.ratio,
        load: testCase.load,
        spoolDiameter: testCase.spoolDiameter,
        efficiency: testCase.efficiency,
        qPosition: base.qPosition,
        qVelocity: base.qVelocity,
        rVolts: base.rVolts,
        feedbackDt: base.feedbackDt,
        sensorDelay: base.sensorDelay,
      });
      expect(feedback).toEqual({ kP: 0, kD: 0 });
    }

    const zeroEfficiencyFeedforward = await computeElevatorFeedforwardGains({
      motorDict: base.motorDict,
      ratio: base.ratio,
      load: base.load,
      spoolDiameter: base.spoolDiameter,
      efficiency: 0,
      angle: base.angle,
    });
    expect(zeroEfficiencyFeedforward).toEqual({ kV: 0, kA: 0, kG: 0 });

    const feedbackCases = [
      {
        qPosition: measurement(0, 'm').toDict(),
        qVelocity: base.qVelocity,
        rVolts: base.rVolts,
        feedbackDt: base.feedbackDt,
      },
      {
        qPosition: base.qPosition,
        qVelocity: measurement(0, 'm/s').toDict(),
        rVolts: base.rVolts,
        feedbackDt: base.feedbackDt,
      },
      {
        qPosition: base.qPosition,
        qVelocity: base.qVelocity,
        rVolts: measurement(0, 'V').toDict(),
        feedbackDt: base.feedbackDt,
      },
      {
        qPosition: base.qPosition,
        qVelocity: base.qVelocity,
        rVolts: base.rVolts,
        feedbackDt: measurement(0, 's').toDict(),
      },
    ];
    for (const override of feedbackCases) {
      const feedback = await computeElevatorFeedbackGains({
        motorDict: base.motorDict,
        ratio: base.ratio,
        load: base.load,
        spoolDiameter: base.spoolDiameter,
        efficiency: base.efficiency,
        qPosition: override.qPosition,
        qVelocity: override.qVelocity,
        rVolts: override.rVolts,
        feedbackDt: override.feedbackDt,
        sensorDelay: base.sensorDelay,
      });
      expect(feedback).toEqual({ kP: 0, kD: 0 });
    }
  }, 120_000);
});

describe('linear elevator simulation fuzz cases', () => {
  it('returns coherent finite trajectories across mechanism variants', async () => {
    const snapshot = [];

    for (const testCase of simulationCases) {
      const states = await simulateElevatorWpilib(simulationParams(testCase));
      snapshot.push(summarizeTrajectory(states, testCase));
    }

    expect(snapshot).toMatchSnapshot();
  }, 120_000);

  it('keeps successful endpoints near the effective target distance', async () => {
    for (const testCase of simulationCases.slice(0, 3)) {
      const states = await simulateElevatorWpilib(simulationParams(testCase));
      const last = states.at(-1);
      expect(last).toBeDefined();
      if (!last?.success) continue;

      const targetMeters = measurement(testCase.travelDistance, 'in').to(
        'm',
      ).scalar;
      const effectiveTarget = testCase.cascade
        ? targetMeters / 2
        : targetMeters;
      expect(last.positionMeters).toBeCloseTo(effectiveTarget, 1);
      expect(last.velocityMetersPerSecond).toBeCloseTo(0, 1);
    }
  }, 120_000);

  it('keeps cascade travel below the equivalent non-cascade target', async () => {
    const testCase = simulationCases[0];
    const [standard, cascade] = await Promise.all([
      simulateElevatorWpilib(simulationParams({ ...testCase, cascade: false })),
      simulateElevatorWpilib(simulationParams({ ...testCase, cascade: true })),
    ]);
    const standardLast = standard.at(-1);
    const cascadeLast = cascade.at(-1);
    expect(standardLast).toBeDefined();
    expect(cascadeLast).toBeDefined();
    expect(cascadeLast?.positionMeters).toBeLessThan(
      (standardLast?.positionMeters ?? 0) * 0.75,
    );
  }, 120_000);
});
