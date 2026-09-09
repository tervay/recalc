import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import { FLYWHEEL_SIMULATION_TIMEOUT_SECONDS } from '~/lib/math/flywheel.worker';
import {
  type SimState,
  type MetricSource,
  type ConfigOptResult,
  type ConfigOptOutput,
  peakSupplyCurrent,
  makeGrid,
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

export interface FlywheelOptimizerResult extends MetricSource {
  statorLimitAmps: number;
  optimalRatio: number;
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
  timeoutSeconds = FLYWHEEL_SIMULATION_TIMEOUT_SECONDS,
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

export async function optimizeRatio(
  motorDict: MotorDict,
  moiDict: MeasurementDict,
  targetRpmDict: MeasurementDict,
  supplyLimitDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  statorLimitAmps: number,
  _initialRatio: number,
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
  try {
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

    const searchResult = searchOptimalRatio(
      (ratioMagnitude) => {
        const states = simulate(
          wpilibc,
          p,
          ratioMagnitude,
          totalStatorAmps,
          totalSupplyAmps,
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
        lowerBound: 0.25,
        upperBound: Math.min(maxRatio, 20),
        coarseSamples: RATIO_SEARCH_COARSE_SAMPLES,
        localSamples: RATIO_SEARCH_LOCAL_SAMPLES,
      },
    );

    if (!searchResult) {
      return {
        statorLimitAmps,
        optimalRatio: Number.NaN,
        timeToGoalSeconds: FLYWHEEL_SIMULATION_TIMEOUT_SECONDS,
        energyJoules: 0,
        peakCurrentAmps: 0,
      };
    }

    return {
      statorLimitAmps,
      optimalRatio: searchResult.ratio,
      timeToGoalSeconds: searchResult.metrics.timeToGoalSeconds,
      energyJoules: searchResult.metrics.energyJoules,
      peakCurrentAmps: searchResult.metrics.peakCurrentAmps,
    };
  } finally {
    p.wpilibMotor.delete();
  }
}

export async function optimizeConfiguration(
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
): Promise<ConfigOptOutput> {
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

  try {
    const maxStator = Measurement.fromDict(
      maximumComfortableStatorLimitDict,
    ).to('A').scalar;
    const maxSupply = Measurement.fromDict(
      maximumComfortableSupplyLimitDict,
    ).to('A').scalar;

    const motorFreeSpeedRadPerSec = p.wpilibMotor.getFreeSpeedRadPerSec();
    const maxRatio =
      p.targetRadPerSec > 0
        ? Math.max(1, (0.95 * motorFreeSpeedRadPerSec) / p.targetRadPerSec)
        : 1;

    const allResults: ConfigOptResult[] = [];

    for (const statorAmps of makeGrid(maxStator)) {
      const totalStatorAmps = statorAmps * p.motorQuantity;
      for (const supplyAmps of makeGrid(maxSupply)) {
        const totalSupplyAmps = supplyAmps * p.motorQuantity;

        try {
          const searchResult = searchOptimalRatio(
            (ratioMagnitude) => {
              const states = simulate(
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
              lowerBound: 0.25,
              upperBound: Math.min(maxRatio, 20),
              coarseSamples: RATIO_SEARCH_COARSE_SAMPLES,
              localSamples: RATIO_SEARCH_LOCAL_SAMPLES,
            },
          );

          allResults.push(
            searchResult
              ? {
                  statorLimitAmps: statorAmps,
                  supplyLimitAmps: supplyAmps,
                  optimalRatio: searchResult.ratio,
                  timeToGoalSeconds: searchResult.metrics.timeToGoalSeconds,
                  peakCurrentAmps: searchResult.metrics.peakCurrentAmps,
                  energyJoules: searchResult.metrics.energyJoules,
                  success: true,
                }
              : {
                  statorLimitAmps: statorAmps,
                  supplyLimitAmps: supplyAmps,
                  optimalRatio: Number.NaN,
                  timeToGoalSeconds: Number.POSITIVE_INFINITY,
                  peakCurrentAmps: 0,
                  energyJoules: 0,
                  success: false,
                },
          );
        } catch {
          allResults.push({
            statorLimitAmps: statorAmps,
            supplyLimitAmps: supplyAmps,
            optimalRatio: Number.NaN,
            timeToGoalSeconds: Number.POSITIVE_INFINITY,
            peakCurrentAmps: 0,
            energyJoules: 0,
            success: false,
          });
        }
      }
    }

    return reduceConfigOutput(allResults);
  } finally {
    p.wpilibMotor.delete();
  }
}

workerpool.worker({ optimizeRatio, optimizeConfiguration });
