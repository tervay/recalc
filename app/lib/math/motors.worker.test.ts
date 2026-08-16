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
  return generateMotorCurve(
    Motor.fromName(motorName, 1).toDict(),
    statorLimit.toDict(),
    supplyLimit.toDict(),
    statorVoltage.toDict(),
    supplyVoltage.toDict(),
  );
}

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
});

describe('generateMotorCurve termination', () => {
  it('resolves instead of hanging when the current limit is zero', async () => {
    // A zero stator limit drives iMax to 0, which pins vApplied at vBackEmf
    // every iteration. At velocity 0 that keeps vApplied at 0 forever, so the
    // loop never accelerates and would spin forever without an iteration cap.
    const zeroStatorLimit = new Measurement(0, 'A');

    const result = await generateMotorCurve(
      Motor.fromName('Kraken X60', 1).toDict(),
      zeroStatorLimit.toDict(),
      supplyLimit.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
    );

    expect(Array.isArray(result)).toBe(true);
  }, 10_000);
});

describe('generateMotorCurve wasm cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes the wpilib DCMotor and DCMotorSim it allocates', async () => {
    const wpilibc = await initWpilibc();
    const toWpilibMotorSpy = vi.spyOn(Motor.prototype, 'toWpilibMotor');
    const motorSimDeleteSpy = vi.spyOn(wpilibc.DCMotorSim.prototype, 'delete');

    await curveFor('Kraken X60');

    // The fix reuses a single DCMotor instead of allocating one per use site.
    expect(toWpilibMotorSpy).toHaveBeenCalledTimes(1);
    const wpilibMotor = toWpilibMotorSpy.mock.results[0].value;
    expect(wpilibMotor.isDeleted()).toBe(true);
    expect(motorSimDeleteSpy).toHaveBeenCalledTimes(1);
  });
});
