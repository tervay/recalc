import { maxBy } from 'es-toolkit';
import minimize from 'minimize-golden-section-1d';
import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export interface FlywheelOptimizerResult {
  statorLimitAmps: number;
  optimalRatio: number;
  timeToGoalSeconds: number;
  energyJoules: number;
  peakSupplyCurrentAmps: number;
}

interface SimState {
  supplyCurrentDrawAmps: number;
  timeSeconds: number;
  energyJoules: number;
  success: boolean;
}

interface MechParams {
  wpilibMotor: DCMotor;
  motorQuantity: number;
  moiKgMSquared: number;
  targetRadPerSec: number;
  statorVoltageVolts: number;
  batteryResistanceOhms: number;
  batteryVoltageVolts: number;
  efficiency: number;
}

type WpilibcModule = Awaited<ReturnType<typeof initWpilibc>>;

function parseMech(
  motor: Motor,
  moiDict: MeasurementDict,
  targetRpmDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  efficiency: number,
): MechParams {
  return {
    wpilibMotor: motor.toWpilibMotor(),
    motorQuantity: motor.quantity,
    moiKgMSquared: Measurement.fromDict(moiDict).to('kg m^2').scalar,
    targetRadPerSec: Measurement.fromDict(targetRpmDict).to('rad/s').scalar,
    statorVoltageVolts: Measurement.fromDict(statorVoltageDict).to('V').scalar,
    batteryResistanceOhms: Measurement.fromDict(batteryResistanceDict).to('Ohm')
      .scalar,
    batteryVoltageVolts:
      Measurement.fromDict(batteryVoltageDict).to('V').scalar,
    efficiency,
  };
}

function simulate(
  wpilibc: WpilibcModule,
  p: MechParams,
  ratioMagnitude: number,
  totalStatorAmps: number,
  totalSupplyAmps: number,
  timeoutSeconds = 3.0,
): SimState[] {
  return wpilibc.simulateFlywheel(
    p.wpilibMotor,
    ratioMagnitude,
    p.moiKgMSquared,
    p.targetRadPerSec,
    totalStatorAmps,
    totalSupplyAmps,
    p.statorVoltageVolts,
    p.batteryResistanceOhms,
    p.batteryVoltageVolts,
    p.efficiency,
    0.001,
    10,
    timeoutSeconds,
  );
}

function peakSupplyCurrent(states: SimState[]): number {
  return (
    maxBy(states, (s) => s.supplyCurrentDrawAmps)?.supplyCurrentDrawAmps ?? 0
  );
}

async function optimizeRatio(
  motorDict: MotorDict,
  moiDict: MeasurementDict,
  targetRpmDict: MeasurementDict,
  supplyLimitDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  statorLimitAmps: number,
  initialRatio: number,
  efficiency: number,
): Promise<FlywheelOptimizerResult> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    moiDict,
    targetRpmDict,
    statorVoltageDict,
    batteryResistanceDict,
    batteryVoltageDict,
    efficiency,
  );
  const totalStatorAmps = statorLimitAmps * p.motorQuantity;
  const supplyAmps = Measurement.fromDict(supplyLimitDict).to('A').scalar;
  const totalSupplyAmps = supplyAmps * p.motorQuantity;

  // Compute the maximum ratio where the motor can still reach the target speed.
  // Free speed at the load = motorFreeSpeed / ratio, so ratio_max = motorFreeSpeed / targetSpeed.
  // Leave some headroom (0.95) since you can't actually reach free speed under load.
  const motorFreeSpeedRadPerSec = p.wpilibMotor.getFreeSpeedRadPerSec();
  const maxRatio =
    p.targetRadPerSec > 0
      ? Math.max(1, (0.95 * motorFreeSpeedRadPerSec) / p.targetRadPerSec)
      : 1;

  const optimalRatio = minimize(
    (r) => {
      const states = simulate(wpilibc, p, r, totalStatorAmps, totalSupplyAmps);
      const last = states[states.length - 1];
      return last?.success ? last.timeSeconds : Number.POSITIVE_INFINITY;
    },
    {
      lowerBound: 0.25,
      upperBound: Math.min(maxRatio, 20),
      guess: Math.min(initialRatio, maxRatio),
    },
  );

  const states = simulate(
    wpilibc,
    p,
    optimalRatio,
    totalStatorAmps,
    totalSupplyAmps,
  );
  const last = states[states.length - 1];

  return {
    statorLimitAmps,
    optimalRatio,
    timeToGoalSeconds: last.timeSeconds,
    energyJoules: last.energyJoules,
    peakSupplyCurrentAmps: peakSupplyCurrent(states),
  };
}

workerpool.worker({ optimizeRatio });
