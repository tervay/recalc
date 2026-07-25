import { maxBy } from 'es-toolkit';
import minimize from 'minimize-golden-section-1d';
import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import {
  type SimState,
  type ConfigOptResult,
  type ConfigOptOutput,
  peakSupplyCurrent,
  makeGrid,
} from '~/lib/math/optimizerUtils';
import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export type {
  ConfigOptResult,
  ConfigOptOutput,
} from '~/lib/math/optimizerUtils';

export interface ArmOptimizerResult {
  statorLimitAmps: number;
  optimalRatio: number;
  timeToGoalSeconds: number;
  energyJoules: number;
  peakSupplyCurrentAmps: number;
}

// Arm gear ratios are large reductions; bracket the golden-section search well
// above 1:1 to avoid the degenerate low-ratio region.
const MIN_RATIO = 5;
const MAX_RATIO = 500;
const INITIAL_RATIO_GUESS = 100;

interface MechParams {
  wpilibMotor: DCMotor;
  motorQuantity: number;
  moiKgMSquared: number;
  armLengthMeters: number;
  minAngleRadians: number;
  maxAngleRadians: number;
  statorVoltageVolts: number;
  batteryResistanceOhms: number;
  batteryVoltageVolts: number;
  efficiency: number;
}

type WpilibcModule = Awaited<ReturnType<typeof initWpilibc>>;

function parseMech(
  motor: Motor,
  moiDict: MeasurementDict,
  armLengthDict: MeasurementDict,
  minAngleDict: MeasurementDict,
  maxAngleDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  efficiency: number,
): MechParams {
  return {
    wpilibMotor: motor.toWpilibMotor(),
    motorQuantity: motor.quantity,
    moiKgMSquared: Measurement.fromDict(moiDict).to('kg m^2').scalar,
    armLengthMeters: Measurement.fromDict(armLengthDict).to('m').scalar,
    minAngleRadians: Measurement.fromDict(minAngleDict).to('rad').scalar,
    maxAngleRadians: Measurement.fromDict(maxAngleDict).to('rad').scalar,
    statorVoltageVolts: Measurement.fromDict(statorVoltageDict).to('V').scalar,
    batteryResistanceOhms: Measurement.fromDict(batteryResistanceDict).to('Ohm')
      .scalar,
    batteryVoltageVolts:
      Measurement.fromDict(batteryVoltageDict).to('V').scalar,
    efficiency,
  };
}

// Simulate both going up and going down; return the worse (longer) time so the
// optimizer minimizes the bottleneck direction.
function simulate(
  wpilibc: WpilibcModule,
  p: MechParams,
  ratioMagnitude: number,
  totalStatorAmps: number,
  totalSupplyAmps: number,
  timeoutSeconds = 3.0,
): {
  timeSeconds: number;
  energyJoules: number;
  peakSupplyCurrent: number;
  success: boolean;
} {
  const upStates: SimState[] = wpilibc.simulateArm(
    p.wpilibMotor,
    ratioMagnitude,
    p.moiKgMSquared,
    p.armLengthMeters,
    p.minAngleRadians,
    p.maxAngleRadians,
    p.minAngleRadians,
    totalStatorAmps,
    totalSupplyAmps,
    p.statorVoltageVolts,
    p.batteryResistanceOhms,
    p.batteryVoltageVolts,
    p.efficiency,
    true,
    0.001,
    10,
    timeoutSeconds,
    0.1,
  );

  const downStates: SimState[] = wpilibc.simulateArm(
    p.wpilibMotor,
    ratioMagnitude,
    p.moiKgMSquared,
    p.armLengthMeters,
    p.minAngleRadians,
    p.maxAngleRadians,
    p.maxAngleRadians,
    totalStatorAmps,
    totalSupplyAmps,
    p.statorVoltageVolts,
    p.batteryResistanceOhms,
    p.batteryVoltageVolts,
    p.efficiency,
    false,
    0.001,
    10,
    timeoutSeconds,
    0.1,
  );

  const upLast = upStates[upStates.length - 1];
  const downLast = downStates[downStates.length - 1];

  if (!upLast || !downLast) {
    return {
      timeSeconds: timeoutSeconds,
      energyJoules: 0,
      peakSupplyCurrent: 0,
      success: false,
    };
  }

  const success = upLast.success && downLast.success;
  // Optimize for the bottleneck direction
  const timeSeconds = Math.max(upLast.timeSeconds, downLast.timeSeconds);
  const energyJoules = upLast.energyJoules + downLast.energyJoules;

  const allStates = [...upStates, ...downStates];
  const peakSupplyCurrent =
    maxBy(allStates, (s) => s.supplyCurrentDrawAmps)?.supplyCurrentDrawAmps ??
    0;

  return { timeSeconds, energyJoules, peakSupplyCurrent, success };
}

// Simulate the going-up direction only. The arm fights gravity on the way up,
// so it is the bottleneck direction; the configuration grid optimizes for it.
function simulateUp(
  wpilibc: WpilibcModule,
  p: MechParams,
  ratioMagnitude: number,
  totalStatorAmps: number,
  totalSupplyAmps: number,
  timeoutSeconds = 3.0,
): SimState[] {
  return wpilibc.simulateArm(
    p.wpilibMotor,
    ratioMagnitude,
    p.moiKgMSquared,
    p.armLengthMeters,
    p.minAngleRadians,
    p.maxAngleRadians,
    p.minAngleRadians,
    totalStatorAmps,
    totalSupplyAmps,
    p.statorVoltageVolts,
    p.batteryResistanceOhms,
    p.batteryVoltageVolts,
    p.efficiency,
    true,
    0.001,
    10,
    timeoutSeconds,
    0.1,
  );
}

async function optimizeRatio(
  motorDict: MotorDict,
  moiDict: MeasurementDict,
  armLengthDict: MeasurementDict,
  minAngleDict: MeasurementDict,
  maxAngleDict: MeasurementDict,
  supplyLimitDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  statorLimitAmps: number,
  initialRatio: number,
  efficiency: number,
): Promise<ArmOptimizerResult> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    moiDict,
    armLengthDict,
    minAngleDict,
    maxAngleDict,
    statorVoltageDict,
    batteryResistanceDict,
    batteryVoltageDict,
    efficiency,
  );
  const totalStatorAmps = statorLimitAmps * p.motorQuantity;
  const totalSupplyAmps =
    Measurement.fromDict(supplyLimitDict).to('A').scalar * p.motorQuantity;

  const optimalRatio = minimize(
    (r) => {
      const result = simulate(wpilibc, p, r, totalStatorAmps, totalSupplyAmps);
      return result.success ? result.timeSeconds : Number.POSITIVE_INFINITY;
    },
    { lowerBound: 5, upperBound: 500, guess: initialRatio },
  );

  const result = simulate(
    wpilibc,
    p,
    optimalRatio,
    totalStatorAmps,
    totalSupplyAmps,
  );

  return {
    statorLimitAmps,
    optimalRatio,
    timeToGoalSeconds: result.timeSeconds,
    energyJoules: result.energyJoules,
    peakSupplyCurrentAmps: result.peakSupplyCurrent,
  };
}

export async function optimizeConfiguration(
  motorDict: MotorDict,
  moiDict: MeasurementDict,
  armLengthDict: MeasurementDict,
  minAngleDict: MeasurementDict,
  maxAngleDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  maximumComfortableStatorLimitDict: MeasurementDict,
  maximumComfortableSupplyLimitDict: MeasurementDict,
  efficiency: number,
): Promise<ConfigOptOutput> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    moiDict,
    armLengthDict,
    minAngleDict,
    maxAngleDict,
    statorVoltageDict,
    batteryResistanceDict,
    batteryVoltageDict,
    efficiency,
  );

  const maxStator = Measurement.fromDict(maximumComfortableStatorLimitDict).to(
    'A',
  ).scalar;
  const maxSupply = Measurement.fromDict(maximumComfortableSupplyLimitDict).to(
    'A',
  ).scalar;

  const allResults: ConfigOptResult[] = [];

  for (const statorAmps of makeGrid(maxStator)) {
    const totalStatorAmps = statorAmps * p.motorQuantity;
    for (const supplyAmps of makeGrid(maxSupply)) {
      const totalSupplyAmps = supplyAmps * p.motorQuantity;

      let optimalRatio: number;
      try {
        optimalRatio = minimize(
          (r) => {
            const states = simulateUp(
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
            lowerBound: MIN_RATIO,
            upperBound: MAX_RATIO,
            guess: INITIAL_RATIO_GUESS,
          },
        );
      } catch {
        allResults.push({
          statorLimitAmps: statorAmps,
          supplyLimitAmps: supplyAmps,
          optimalRatio: NaN,
          timeToGoalSeconds: Number.POSITIVE_INFINITY,
          peakCurrentAmps: 0,
          energyJoules: 0,
          success: false,
        });
        continue;
      }

      const states = simulateUp(
        wpilibc,
        p,
        optimalRatio,
        totalStatorAmps,
        totalSupplyAmps,
        1.5,
      );
      const last = states[states.length - 1];

      if (!last) {
        allResults.push({
          statorLimitAmps: statorAmps,
          supplyLimitAmps: supplyAmps,
          optimalRatio,
          timeToGoalSeconds: Number.POSITIVE_INFINITY,
          peakCurrentAmps: 0,
          energyJoules: 0,
          success: false,
        });
        continue;
      }

      allResults.push({
        statorLimitAmps: statorAmps,
        supplyLimitAmps: supplyAmps,
        optimalRatio,
        timeToGoalSeconds: last.timeSeconds,
        peakCurrentAmps: peakSupplyCurrent(states),
        energyJoules: last.energyJoules,
        success: last.success,
      });
    }
  }

  const successResults = allResults.filter((r) => r.success);

  if (successResults.length === 0) {
    return { recommended: null, allResults };
  }

  const recommended = successResults.reduce((best, r) =>
    r.timeToGoalSeconds < best.timeToGoalSeconds ? r : best,
  );

  return { recommended, allResults };
}

workerpool.worker({ optimizeRatio, optimizeConfiguration });
