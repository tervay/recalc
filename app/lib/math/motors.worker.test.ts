import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateMotorCurve } from '~/lib/math/motors.worker';
import Measurement from '~/lib/models/Measurement';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

const statorLimit = new Measurement(1000, 'A');
const supplyLimit = new Measurement(1000, 'A');
const statorVoltage = new Measurement(12, 'V');
const supplyVoltage = new Measurement(12, 'V');

async function curveFor(motorName: string) {
  return generateMotorCurve({
    motor: Motor.fromName(motorName, 1).toDict(),
    statorLimit: statorLimit.toDict(),
    supplyLimit: supplyLimit.toDict(),
    statorVoltage: statorVoltage.toDict(),
    supplyVoltage: supplyVoltage.toDict(),
  });
}

describe('generateMotorCurve linearity', () => {
  // The data was always linear; the chart plotted it on a category axis. These
  // lock the sweep itself down.
  it('puts every current sample on the straight line from stall to free speed', async () => {
    const motor = Motor.fromName('Kraken X60', 1);
    const states = await curveFor('Kraken X60');
    expect(states.length).toBeGreaterThan(100);

    const stallCurrent = motor.stallCurrent.to('A').scalar;
    const freeCurrent = motor.freeCurrent.to('A').scalar;
    const freeSpeedRPM = motor.freeSpeed.to('rpm').scalar;

    for (const state of states) {
      const expected =
        stallCurrent -
        ((stallCurrent - freeCurrent) * state.angularVelocityRPM) /
          freeSpeedRPM;
      expect(
        state.currentDrawAmps,
        `${state.angularVelocityRPM} rpm`,
      ).toBeCloseTo(expected, 4);
    }
  });

  it('puts every torque sample on the straight line from stall to zero', async () => {
    const motor = Motor.fromName('Kraken X60', 1);
    const states = await curveFor('Kraken X60');

    const kT =
      motor.stallTorque.to('N*m').scalar / motor.stallCurrent.to('A').scalar;
    const stallCurrent = motor.stallCurrent.to('A').scalar;
    const freeCurrent = motor.freeCurrent.to('A').scalar;
    const freeSpeedRPM = motor.freeSpeed.to('rpm').scalar;

    for (const state of states) {
      const expectedCurrent =
        stallCurrent -
        ((stallCurrent - freeCurrent) * state.angularVelocityRPM) /
          freeSpeedRPM;
      expect(
        state.torqueNewtonMeters,
        `${state.angularVelocityRPM} rpm`,
      ).toBeCloseTo(kT * expectedCurrent, 4);
    }
  });

  it('starts at the stall point rather than one timestep past it', async () => {
    const motor = Motor.fromName('Kraken X60', 1);
    const states = await curveFor('Kraken X60');

    expect(states[0].angularVelocityRPM).toBe(0);
    expect(states[0].currentDrawAmps).toBeCloseTo(
      motor.stallCurrent.to('A').scalar,
      4,
    );
    expect(states[0].torqueNewtonMeters).toBeCloseTo(
      motor.stallTorque.to('N*m').scalar,
      4,
    );
  });

  it('sweeps monotonically up to free speed', async () => {
    const motor = Motor.fromName('Kraken X60', 1);
    const states = await curveFor('Kraken X60');
    const last = states[states.length - 1];

    for (let i = 1; i < states.length; i++) {
      expect(states[i].angularVelocityRPM).toBeGreaterThan(
        states[i - 1].angularVelocityRPM,
      );
    }

    expect(last.angularVelocityRPM).toBeLessThanOrEqual(
      motor.freeSpeed.to('rpm').scalar,
    );
    expect(last.angularVelocityRPM).toBeGreaterThan(
      0.99 * motor.freeSpeed.to('rpm').scalar,
    );
  });
});

describe('generateMotorCurve voltages', () => {
  // The route used to pass these two transposed. Both are MeasurementDict, so
  // nothing caught it, and 12 V / 12 V defaults hid it.
  it('does not treat the stator and supply voltage as interchangeable', async () => {
    const args = {
      motor: Motor.fromName('Kraken X60', 1).toDict(),
      statorLimit: new Measurement(1000, 'A').toDict(),
      supplyLimit: new Measurement(60, 'A').toDict(),
    };

    const sixOnTwelve = await generateMotorCurve({
      ...args,
      statorVoltage: new Measurement(6, 'V').toDict(),
      supplyVoltage: new Measurement(12, 'V').toDict(),
    });
    const twelveOnSix = await generateMotorCurve({
      ...args,
      statorVoltage: new Measurement(12, 'V').toDict(),
      supplyVoltage: new Measurement(6, 'V').toDict(),
    });

    expect(sixOnTwelve[0].currentDrawAmps).not.toBeCloseTo(
      twelveOnSix[0].currentDrawAmps,
      1,
    );
  });

  it('caps the applied voltage, and so the stall current, at the supply voltage', async () => {
    const motor = Motor.fromName('Kraken X60', 1);
    const states = await generateMotorCurve({
      motor: motor.toDict(),
      statorLimit: statorLimit.toDict(),
      supplyLimit: supplyLimit.toDict(),
      statorVoltage: new Measurement(12, 'V').toDict(),
      supplyVoltage: new Measurement(6, 'V').toDict(),
    });

    // 6 V across the winding resistance, not 12 V.
    expect(states[0].currentDrawAmps).toBeCloseTo(
      6 / motor.resistance.to('Ohm').scalar,
      4,
    );
  });
});

describe('generateMotorCurve current limits', () => {
  it('holds the stator current at its limit through the low-speed region', async () => {
    const limit = 90;
    const states = await generateMotorCurve({
      motor: Motor.fromName('Kraken X60', 1).toDict(),
      statorLimit: new Measurement(limit, 'A').toDict(),
      supplyLimit: supplyLimit.toDict(),
      statorVoltage: statorVoltage.toDict(),
      supplyVoltage: supplyVoltage.toDict(),
    });

    expect(states[0].currentDrawAmps).toBeCloseTo(limit, 4);
    for (const state of states) {
      expect(
        state.currentDrawAmps,
        `${state.angularVelocityRPM} rpm`,
      ).toBeLessThanOrEqual(limit + 1e-6);
    }
  });

  it('scales the limits by the motor quantity', async () => {
    const single = await generateMotorCurve({
      motor: Motor.fromName('Kraken X60', 1).toDict(),
      statorLimit: new Measurement(90, 'A').toDict(),
      supplyLimit: supplyLimit.toDict(),
      statorVoltage: statorVoltage.toDict(),
      supplyVoltage: supplyVoltage.toDict(),
    });
    const double = await generateMotorCurve({
      motor: Motor.fromName('Kraken X60', 2).toDict(),
      statorLimit: new Measurement(90, 'A').toDict(),
      supplyLimit: supplyLimit.toDict(),
      statorVoltage: statorVoltage.toDict(),
      supplyVoltage: supplyVoltage.toDict(),
    });

    expect(double[0].currentDrawAmps).toBeCloseTo(
      2 * single[0].currentDrawAmps,
      4,
    );
  });
});

describe('generateMotorCurve efficiency', () => {
  it('never reports efficiency at or above 100%', async () => {
    // Kraken X60, NEO, and Falcon 500 all have Kt * Kv > 1, which previously
    // produced efficiencies above 100% near free speed.
    for (const name of ['Kraken X60', 'NEO', 'Falcon 500']) {
      const states = await curveFor(name);
      for (const state of states) {
        expect(state.efficiency).toBeLessThan(1);
        expect(state.efficiency).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps efficiency within [0, 1) for every motor in the library', async () => {
    for (const spec of ALL_MOTORS) {
      const states = await curveFor(spec.name);
      for (const state of states) {
        expect(
          state.efficiency,
          `${spec.name} @ ${state.angularVelocityRPM} rpm`,
        ).toBeLessThan(1);
        expect(
          state.efficiency,
          `${spec.name} @ ${state.angularVelocityRPM} rpm`,
        ).toBeGreaterThanOrEqual(0);
      }
    }
  }, 60000);

  it('is ~0% at stall and approaches 0% at free speed', async () => {
    const states = await curveFor('Kraken X60');
    expect(states.length).toBeGreaterThan(2);

    // At stall (lowest speed) there is no shaft power, so efficiency is ~0.
    const first = states[0];
    expect(first.efficiency).toBeLessThan(0.05);

    // At free speed the current collapses to the free current, so the useful
    // shaft power (and thus efficiency) returns to ~0.
    const last = states[states.length - 1];
    expect(last.efficiency).toBeLessThan(0.1);
  });

  it('peaks at a sensible efficiency somewhere in the middle of the curve', async () => {
    const states = await curveFor('Kraken X60');
    const peak = Math.max(...states.map((s) => s.efficiency));
    // Brushless FRC motors peak well above 50% but below 100%.
    expect(peak).toBeGreaterThan(0.5);
    expect(peak).toBeLessThan(1);
  });

  it('reports exactly zero efficiency at the stall point', async () => {
    const states = await curveFor('Kraken X60');

    expect(states[0].angularVelocityRPM).toBe(0);
    expect(states[0].efficiency).toBe(0);
  });

  // eta = (kT / kE) * (1 - Ifree / I) * (1 - (I - Ifree) / (Istall - Ifree)),
  // the form issue #2244 derives. The old curve used wpilib's stall-derived Kt
  // and dropped the free current from the speed fraction.
  it('follows the closed-form efficiency at every point of the sweep', async () => {
    const motor = Motor.fromName('Kraken X60', 1);
    const states = await curveFor('Kraken X60');
    const kTOverKe =
      motor.kT.to('N*m/A').scalar / motor.kE.to('V*s/rad').scalar;
    const freeCurrent = motor.freeCurrent.to('A').scalar;
    const torqueCurrent = motor.stallCurrent.to('A').scalar - freeCurrent;

    for (const state of states) {
      const i = state.currentDrawAmps;
      const expected =
        kTOverKe *
        (1 - freeCurrent / i) *
        (1 - (i - freeCurrent) / torqueCurrent);

      expect(state.efficiency, `${state.angularVelocityRPM} rpm`).toBeCloseTo(
        Math.max(0, expected),
        6,
      );
    }
  });

  // The comparison table reports peak efficiency from a closed form rather than
  // sweeping all 26 motors. These pin that form to the simulation the chart
  // above the table plots.
  it.each(['Kraken X60', 'NEO', 'CIM'])(
    'peaks for %s where Motor.maxEfficiencyAtCurrentLimit says it should',
    async (name) => {
      const states = await curveFor(name);
      const peak = Math.max(...states.map((s) => s.efficiency));

      expect(peak).toBeCloseTo(
        Motor.fromName(name, 1).maxEfficiencyAtCurrentLimit(statorLimit),
        4,
      );
    },
  );
});

describe('generateMotorCurve termination', () => {
  it('resolves instead of hanging when the current limit is zero', async () => {
    // A zero stator limit pins the applied voltage at back-EMF, which is 0 V at
    // rest, so the sweep never accelerates and would spin without the cap.
    const result = await generateMotorCurve({
      motor: Motor.fromName('Kraken X60', 1).toDict(),
      statorLimit: new Measurement(0, 'A').toDict(),
      supplyLimit: supplyLimit.toDict(),
      statorVoltage: statorVoltage.toDict(),
      supplyVoltage: supplyVoltage.toDict(),
    });

    expect(Array.isArray(result)).toBe(true);
    for (const state of result) {
      expect(state.angularVelocityRPM).toBe(0);
      expect(state.currentDrawAmps).toBeCloseTo(0, 6);
    }
  }, 10_000);

  it('returns an empty curve when the supply voltage is zero', async () => {
    const result = await generateMotorCurve({
      motor: Motor.fromName('Kraken X60', 1).toDict(),
      statorLimit: statorLimit.toDict(),
      supplyLimit: supplyLimit.toDict(),
      statorVoltage: statorVoltage.toDict(),
      supplyVoltage: new Measurement(0, 'V').toDict(),
    });

    expect(result).toEqual([]);
  });
});

describe('generateMotorCurve wasm cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes the wpilib DCMotor it allocates', async () => {
    await initWpilibc();
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');

    await curveFor('Kraken X60');

    // The sweep reuses a single DCMotor instead of allocating one per use site.
    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
  });
});
