import { maxBy } from 'es-toolkit';
import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import {
  type SimState,
  type MetricSource,
  type ConfigOptResult,
  type ConfigOptOutput,
  type RatioSearchResult,
  peakSupplyCurrent,
  makeCenteredCurrentGrid,
  reduceConfigOutput,
  RATIO_SEARCH_COARSE_SAMPLES,
  RATIO_SEARCH_LOCAL_SAMPLES,
  searchOptimalRatio,
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
  _initialRatio: number,
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
  try {
    const totalStatorAmps = statorLimitAmps * p.motorQuantity;
    const totalSupplyAmps =
      Measurement.fromDict(supplyLimitDict).to('A').scalar * p.motorQuantity;

    const searchResult = searchOptimalRatio(
      (ratioMagnitude) => {
        const result = simulate(
          wpilibc,
          p,
          ratioMagnitude,
          totalStatorAmps,
          totalSupplyAmps,
        );
        return result.success
          ? {
              timeToGoalSeconds: result.timeSeconds,
              energyJoules: result.energyJoules,
              peakCurrentAmps: result.peakSupplyCurrent,
            }
          : null;
      },
      {
        lowerBound: MIN_RATIO,
        upperBound: MAX_RATIO,
        coarseSamples: RATIO_SEARCH_COARSE_SAMPLES,
        localSamples: RATIO_SEARCH_LOCAL_SAMPLES,
      },
    );

    if (!searchResult) {
      return {
        statorLimitAmps,
        optimalRatio: Number.NaN,
        timeToGoalSeconds: 3,
        energyJoules: 0,
        peakSupplyCurrentAmps: 0,
      };
    }

    return {
      statorLimitAmps,
      optimalRatio: searchResult.ratio,
      timeToGoalSeconds: searchResult.metrics.timeToGoalSeconds,
      energyJoules: searchResult.metrics.energyJoules,
      peakSupplyCurrentAmps: searchResult.metrics.peakCurrentAmps,
    };
  } finally {
    p.wpilibMotor.delete();
  }
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
  statorInputAmps: number,
  supplyInputAmps: number,
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

  try {
    const allResults: ConfigOptResult[] = [];

    for (const statorAmps of makeCenteredCurrentGrid(statorInputAmps)) {
      const totalStatorAmps = statorAmps * p.motorQuantity;
      for (const supplyAmps of makeCenteredCurrentGrid(supplyInputAmps)) {
        const totalSupplyAmps = supplyAmps * p.motorQuantity;

        let searchResult: RatioSearchResult<MetricSource> | null;
        try {
          searchResult = searchOptimalRatio(
            (ratioMagnitude) => {
              const states = simulateUp(
                wpilibc,
                p,
                ratioMagnitude,
                totalStatorAmps,
                totalSupplyAmps,
                1.5,
              );
              const last = states[states.length - 1];
              return last?.success
                ? {
                    timeToGoalSeconds: last.timeSeconds,
                    energyJoules: last.energyJoules,
                    peakCurrentAmps: peakSupplyCurrent(states),
                  }
                : null;
            },
            {
              lowerBound: MIN_RATIO,
              upperBound: MAX_RATIO,
              coarseSamples: RATIO_SEARCH_COARSE_SAMPLES,
              localSamples: RATIO_SEARCH_LOCAL_SAMPLES,
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

        if (!searchResult) {
          allResults.push({
            statorLimitAmps: statorAmps,
            supplyLimitAmps: supplyAmps,
            optimalRatio: Number.NaN,
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
          optimalRatio: searchResult.ratio,
          timeToGoalSeconds: searchResult.metrics.timeToGoalSeconds,
          peakCurrentAmps: searchResult.metrics.peakCurrentAmps,
          energyJoules: searchResult.metrics.energyJoules,
          success: true,
        });
      }
    }

    return reduceConfigOutput(allResults);
  } finally {
    p.wpilibMotor.delete();
  }
}

workerpool.worker({ optimizeRatio, optimizeConfiguration });
