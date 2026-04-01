import { maxBy } from 'es-toolkit';
import minimize from 'minimize-golden-section-1d';
import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export type OptimizationPriority =
  | 'timeToGoal'
  | 'peakCurrent'
  | 'energy'
  | 'avgPower';

export interface FlywheelOptimizerResult {
  statorLimitAmps: number;
  optimalRatio: number;
  timeToGoalSeconds: number;
  energyJoules: number;
  peakSupplyCurrentAmps: number;
}

export interface FlywheelConfigOptResult {
  statorLimitAmps: number;
  supplyLimitAmps: number;
  optimalRatio: number;
  timeToGoalSeconds: number;
  peakSupplyCurrentAmps: number;
  energyJoules: number;
  success: boolean;
}

export interface FlywheelConfigOptOutput {
  recommended: FlywheelConfigOptResult | null;
  tier1Count: number;
  tier2Count: number;
  allResults: FlywheelConfigOptResult[];
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
  batteryVoltageFilterTimeConstantSeconds: number;
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
  batteryVoltageFilterTimeConstantSeconds: number,
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
    batteryVoltageFilterTimeConstantSeconds,
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
    p.batteryVoltageFilterTimeConstantSeconds,
    0,
  );
}

function peakSupplyCurrent(states: SimState[]): number {
  return (
    maxBy(states, (s) => s.supplyCurrentDrawAmps)?.supplyCurrentDrawAmps ?? 0
  );
}

function getMetric(
  r: FlywheelConfigOptResult,
  priority: OptimizationPriority,
): number {
  switch (priority) {
    case 'timeToGoal':
      return r.timeToGoalSeconds;
    case 'peakCurrent':
      return r.peakSupplyCurrentAmps;
    case 'energy':
      return r.energyJoules;
    case 'avgPower':
      return r.timeToGoalSeconds > 0
        ? r.energyJoules / r.timeToGoalSeconds
        : Number.POSITIVE_INFINITY;
  }
}

function selectBest(
  candidates: FlywheelConfigOptResult[],
  priorities: OptimizationPriority[],
  tolerance: number,
): {
  result: FlywheelConfigOptResult;
  tier1Count: number;
  tier2Count: number;
} {
  let pool = candidates;
  const multiplier = 1 + tolerance;

  const best0 = Math.min(...pool.map((r) => getMetric(r, priorities[0])));
  const tier1 = pool.filter(
    (r) => getMetric(r, priorities[0]) <= best0 * multiplier,
  );
  pool = tier1;

  const best1 = Math.min(...pool.map((r) => getMetric(r, priorities[1])));
  const tier2 = pool.filter(
    (r) => getMetric(r, priorities[1]) <= best1 * multiplier,
  );
  pool = tier2;

  for (let i = 2; i < priorities.length - 1; i++) {
    const best = Math.min(...pool.map((r) => getMetric(r, priorities[i])));
    pool = pool.filter((r) => getMetric(r, priorities[i]) <= best * multiplier);
  }

  const last = priorities[priorities.length - 1];
  const result = pool.reduce((acc, r) =>
    getMetric(r, last) < getMetric(acc, last) ? r : acc,
  );

  return { result, tier1Count: tier1.length, tier2Count: tier2.length };
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
  batteryVoltageFilterTimeConstantSeconds: number,
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
    batteryVoltageFilterTimeConstantSeconds,
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

async function optimizeConfiguration(
  motorDict: MotorDict,
  moiDict: MeasurementDict,
  targetRpmDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  maximumComfortableStatorLimitDict: MeasurementDict,
  maximumComfortableSupplyLimitDict: MeasurementDict,
  efficiency: number,
  batteryVoltageFilterTimeConstantSeconds: number,
  priorities: OptimizationPriority[],
  prioritySlack: number,
): Promise<FlywheelConfigOptOutput> {
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
    batteryVoltageFilterTimeConstantSeconds,
  );

  const maxStator = Measurement.fromDict(maximumComfortableStatorLimitDict).to(
    'A',
  ).scalar;
  const maxSupply = Measurement.fromDict(maximumComfortableSupplyLimitDict).to(
    'A',
  ).scalar;

  const makeGrid = (max: number) =>
    Array.from({ length: Math.ceil(max / 10) }, (_, i) =>
      Math.min((i + 1) * 10, max),
    );

  const motorFreeSpeedRadPerSec = p.wpilibMotor.getFreeSpeedRadPerSec();
  const maxRatio =
    p.targetRadPerSec > 0
      ? Math.max(1, (0.95 * motorFreeSpeedRadPerSec) / p.targetRadPerSec)
      : 1;

  const allResults: FlywheelConfigOptResult[] = [];

  for (const statorAmps of makeGrid(maxStator)) {
    const totalStatorAmps = statorAmps * p.motorQuantity;
    for (const supplyAmps of makeGrid(maxSupply)) {
      const totalSupplyAmps = supplyAmps * p.motorQuantity;

      let optimalRatio: number;
      try {
        optimalRatio = minimize(
          (r) => {
            const states = simulate(
              wpilibc,
              p,
              r,
              totalStatorAmps,
              totalSupplyAmps,
              1.5,
            );
            const last = states[states.length - 1];
            return last?.success ? last.timeSeconds : Number.POSITIVE_INFINITY;
          },
          {
            lowerBound: 0.25,
            upperBound: Math.min(maxRatio, 20),
            guess: Math.min(1, maxRatio),
          },
        );
      } catch {
        allResults.push({
          statorLimitAmps: statorAmps,
          supplyLimitAmps: supplyAmps,
          optimalRatio: NaN,
          timeToGoalSeconds: Number.POSITIVE_INFINITY,
          peakSupplyCurrentAmps: 0,
          energyJoules: 0,
          success: false,
        });
        continue;
      }

      const states = simulate(
        wpilibc,
        p,
        optimalRatio,
        totalStatorAmps,
        totalSupplyAmps,
        1.5,
      );
      const last = states[states.length - 1];

      allResults.push({
        statorLimitAmps: statorAmps,
        supplyLimitAmps: supplyAmps,
        optimalRatio,
        timeToGoalSeconds: last.timeSeconds,
        peakSupplyCurrentAmps: peakSupplyCurrent(states),
        energyJoules: last.energyJoules,
        success: last.success,
      });
    }
  }

  const successResults = allResults.filter((r) => r.success);

  if (successResults.length === 0) {
    return {
      recommended: null,
      tier1Count: 0,
      tier2Count: 0,
      allResults,
    };
  }

  const {
    result: recommended,
    tier1Count,
    tier2Count,
  } = selectBest(successResults, priorities, prioritySlack);

  return {
    recommended,
    tier1Count,
    tier2Count,
    allResults,
  };
}

workerpool.worker({ optimizeRatio, optimizeConfiguration });
