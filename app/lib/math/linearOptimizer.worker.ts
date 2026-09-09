import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import { calculateGuessedLimits } from '~/lib/math/linear';
import {
  type SimState,
  type MetricSource,
  type ConfigOptResult,
  type ConfigOptOutput,
  adaptiveSimSeconds,
  peakSupplyCurrent,
  makeGrid,
  reduceConfigOutput,
  RATIO_SEARCH_COARSE_SAMPLES,
  RATIO_SEARCH_LOCAL_SAMPLES,
  searchOptimalRatio,
  type RatioSearchResult,
} from '~/lib/math/optimizerUtils';
import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export type {
  ConfigOptResult,
  ConfigOptOutput,
} from '~/lib/math/optimizerUtils';

export interface OptimizerResult extends MetricSource {
  statorLimitAmps: number;
  optimalRatio: number;
}

export interface SingleSimResult extends MetricSource {
  ratioMagnitude: number;
  supplyLimitAmps: number;
  statorLimitAmps: number;
  success: boolean;
}

interface SimControlParams {
  qPositionMeters: number;
  qVelocityMPS: number;
  rVolts: number;
  sensorDelaySeconds: number;
}

interface MechParams {
  wpilibMotor: DCMotor;
  motorName: string;
  motorQuantity: number;
  loadKg: number;
  spoolRadiusMeters: number;
  travelDistanceMeters: number;
  batteryResistanceOhms: number;
  batteryVoltageVolts: number;
  angleRadians: number;
  efficiency: number;
  cascade: boolean;
  batteryVoltageFilterTimeConstantSeconds: number;
  kalmanFilterPositionStdDevM: number;
  kalmanFilterVelocityStdDevMPS: number;
  kalmanFilterEncoderPositionStdDevM: number;
}

type WpilibcModule = Awaited<ReturnType<typeof initWpilibc>>;

function parseMech(
  motor: Motor,
  loadDict: MeasurementDict,
  spoolDiameterDict: MeasurementDict,
  travelDistanceDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  angleDict: MeasurementDict,
  efficiency: number,
  cascade: boolean,
  batteryVoltageFilterTimeConstantSeconds: number,
  kalmanFilterPositionStdDevDict?: MeasurementDict,
  kalmanFilterVelocityStdDevDict?: MeasurementDict,
  kalmanFilterEncoderPositionStdDevDict?: MeasurementDict,
): MechParams {
  // Keep defaults aligned with `linear.tsx` so callers that don't provide these
  // parameters still get consistent simulation behavior.
  const kalmanPositionStdDevM = kalmanFilterPositionStdDevDict
    ? Measurement.fromDict(kalmanFilterPositionStdDevDict).to('m').scalar
    : new Measurement(2, 'in').to('m').scalar;
  const kalmanVelocityStdDevMPS = kalmanFilterVelocityStdDevDict
    ? Measurement.fromDict(kalmanFilterVelocityStdDevDict).to('m/s').scalar
    : new Measurement(40, 'in/s').to('m/s').scalar;
  const kalmanEncoderPositionStdDevM = kalmanFilterEncoderPositionStdDevDict
    ? Measurement.fromDict(kalmanFilterEncoderPositionStdDevDict).to('m').scalar
    : new Measurement(0.001, 'in').to('m').scalar;

  return {
    wpilibMotor: motor.toWpilibMotor(),
    motorName: motor.identifier,
    motorQuantity: motor.quantity,
    loadKg: Measurement.fromDict(loadDict).to('kg').scalar,
    spoolRadiusMeters: Measurement.fromDict(spoolDiameterDict).div(2).to('m')
      .scalar,
    travelDistanceMeters:
      Measurement.fromDict(travelDistanceDict).to('m').scalar,
    batteryResistanceOhms: Measurement.fromDict(batteryResistanceDict).to('Ohm')
      .scalar,
    batteryVoltageVolts:
      Measurement.fromDict(batteryVoltageDict).to('V').scalar,
    angleRadians: Measurement.fromDict(angleDict).to('rad').scalar,
    efficiency,
    cascade,
    batteryVoltageFilterTimeConstantSeconds,
    kalmanFilterPositionStdDevM: kalmanPositionStdDevM,
    kalmanFilterVelocityStdDevMPS: kalmanVelocityStdDevMPS,
    kalmanFilterEncoderPositionStdDevM: kalmanEncoderPositionStdDevM,
  };
}

// The elevator sim halves the travel for a cascade rig (elevator_sim.h), so the
// motion profile the sim actually runs is over this distance.
function simTravelMeters(p: MechParams): number {
  return p.cascade ? p.travelDistanceMeters * 0.5 : p.travelDistanceMeters;
}

function guessLimitsFromMech(
  p: MechParams,
  ratioMagnitude: number,
  statorAmps: number,
  supplyAmps: number,
  rVolts?: number,
): { velocity: number; acceleration: number } {
  const { v_max_guessed, a_max_guessed } = calculateGuessedLimits(
    Motor.fromName(p.motorName, p.motorQuantity),
    new Ratio(ratioMagnitude, RatioType.REDUCTION),
    new Measurement(p.loadKg, 'kg'),
    new Measurement(p.spoolRadiusMeters * 2, 'm'),
    new Measurement(statorAmps, 'A'),
    new Measurement(supplyAmps, 'A'),
    new Measurement(p.batteryVoltageVolts, 'V'),
    new Measurement(p.angleRadians, 'rad'),
    p.efficiency * 100,
    p.cascade,
    rVolts ? new Measurement(rVolts, 'V') : undefined,
    new Measurement(p.travelDistanceMeters, 'm'),
  );
  return {
    velocity: v_max_guessed.to('m/s').scalar,
    acceleration: a_max_guessed.to('m/s^2').scalar,
  };
}

function profileLimitsForRatio(
  p: MechParams,
  ratioMagnitude: number,
  totalStatorAmps: number,
  supplyAmps: number,
  maxVelocityMPS: number | null,
  maxAccelerationMPS2: number | null,
  rVolts: number,
): { velocity: number; acceleration: number } | null {
  const guessed = guessLimitsFromMech(
    p,
    ratioMagnitude,
    totalStatorAmps / p.motorQuantity,
    supplyAmps,
    rVolts,
  );

  if (
    !Number.isFinite(guessed.velocity) ||
    guessed.velocity <= 0 ||
    !Number.isFinite(guessed.acceleration) ||
    guessed.acceleration <= 0
  ) {
    return null;
  }

  const requestedLimits: Array<[number | null, number]> = [
    [maxVelocityMPS, guessed.velocity],
    [maxAccelerationMPS2, guessed.acceleration],
  ];

  for (const [requested, achievable] of requestedLimits) {
    if (
      requested !== null &&
      (!Number.isFinite(requested) || requested <= 0 || requested > achievable)
    ) {
      return null;
    }
  }

  return {
    velocity: maxVelocityMPS ?? guessed.velocity,
    acceleration: maxAccelerationMPS2 ?? guessed.acceleration,
  };
}

function extractSimResult(states: SimState[]): {
  timeToGoalSeconds: number;
  energyJoules: number;
  peakCurrentAmps: number;
  success: boolean;
} | null {
  if (states.length === 0) {
    return null;
  }
  const last = states[states.length - 1];
  return {
    timeToGoalSeconds: last.timeSeconds,
    energyJoules: last.energyJoules,
    peakCurrentAmps: peakSupplyCurrent(states),
    success: last.success,
  };
}

interface SimulateParams {
  wpilibc: WpilibcModule;
  mech: MechParams;
  ratioMagnitude: number;
  totalStatorAmps: number;
  supplyAmps: number;
  maxVelocityMPS: number;
  maxAccelerationMPS2: number;
  control: SimControlParams;
  timeoutSeconds?: number;
}

function simulate({
  wpilibc,
  mech: p,
  ratioMagnitude,
  totalStatorAmps,
  supplyAmps,
  maxVelocityMPS,
  maxAccelerationMPS2,
  control,
  timeoutSeconds = 3.0,
}: SimulateParams): SimState[] {
  return wpilibc.simulateElevator(
    p.wpilibMotor,
    ratioMagnitude,
    p.loadKg,
    p.spoolRadiusMeters,
    p.travelDistanceMeters,
    totalStatorAmps,
    supplyAmps * p.motorQuantity,
    p.batteryResistanceOhms,
    p.batteryVoltageVolts,
    0.0005,
    10,
    timeoutSeconds,
    p.angleRadians,
    p.efficiency,
    p.cascade,
    p.batteryVoltageFilterTimeConstantSeconds,
    maxVelocityMPS,
    maxAccelerationMPS2,
    control.qPositionMeters,
    control.qVelocityMPS,
    control.rVolts,
    control.sensorDelaySeconds,
    p.kalmanFilterPositionStdDevM,
    p.kalmanFilterVelocityStdDevMPS,
    p.kalmanFilterEncoderPositionStdDevM,
  );
}

function findOptimalRatio(
  wpilibc: WpilibcModule,
  p: MechParams,
  totalStatorAmps: number,
  supplyAmps: number,
  maxVelocityMPS: number | null,
  maxAccelerationMPS2: number | null,
  control: SimControlParams,
): RatioSearchResult<MetricSource> | null {
  const { qPositionMeters, qVelocityMPS, rVolts, sensorDelaySeconds } = control;

  return searchOptimalRatio(
    (ratioMagnitude) => {
      const profileLimits = profileLimitsForRatio(
        p,
        ratioMagnitude,
        totalStatorAmps,
        supplyAmps,
        maxVelocityMPS,
        maxAccelerationMPS2,
        rVolts,
      );
      if (profileLimits === null) return null;

      const states = simulate({
        wpilibc,
        mech: p,
        ratioMagnitude,
        totalStatorAmps,
        supplyAmps,
        maxVelocityMPS: profileLimits.velocity,
        maxAccelerationMPS2: profileLimits.acceleration,
        control: {
          qPositionMeters,
          qVelocityMPS,
          rVolts,
          sensorDelaySeconds,
        },
        timeoutSeconds: adaptiveSimSeconds(
          simTravelMeters(p),
          profileLimits.velocity,
          profileLimits.acceleration,
          1.5,
        ),
      });
      const result = extractSimResult(states);
      return result?.success ? result : null;
    },
    {
      lowerBound: 0.25,
      upperBound: 50,
      coarseSamples: RATIO_SEARCH_COARSE_SAMPLES,
      localSamples: RATIO_SEARCH_LOCAL_SAMPLES,
    },
  );
}

interface BaseLinearParams {
  motorDict: MotorDict;
  loadDict: MeasurementDict;
  spoolDiameterDict: MeasurementDict;
  travelDistanceDict: MeasurementDict;
  batteryResistanceDict: MeasurementDict;
  batteryVoltageDict: MeasurementDict;
  angleDict: MeasurementDict;
  efficiency: number;
  cascade: boolean;
  batteryVoltageFilterTimeConstantSeconds: number;
  qPositionMeters: number;
  qVelocityMPS: number;
  rVolts: number;
  sensorDelaySeconds: number;
}

export interface OptimizeRatioParams extends BaseLinearParams {
  supplyLimitDict: MeasurementDict;
  statorLimitAmps: number;
  initialRatio: number;
  maxVelocityMPS: number;
  maxAccelerationMPS2: number;
}

export async function optimizeRatio({
  motorDict,
  loadDict,
  spoolDiameterDict,
  travelDistanceDict,
  supplyLimitDict,
  batteryResistanceDict,
  batteryVoltageDict,
  statorLimitAmps,
  angleDict,
  efficiency,
  cascade,
  batteryVoltageFilterTimeConstantSeconds,
  maxVelocityMPS,
  maxAccelerationMPS2,
  qPositionMeters,
  qVelocityMPS,
  rVolts,
  sensorDelaySeconds,
}: OptimizeRatioParams): Promise<OptimizerResult> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    loadDict,
    spoolDiameterDict,
    travelDistanceDict,
    batteryResistanceDict,
    batteryVoltageDict,
    angleDict,
    efficiency,
    cascade,
    batteryVoltageFilterTimeConstantSeconds,
  );
  const totalStatorAmps = statorLimitAmps * p.motorQuantity;
  const supplyAmps = Measurement.fromDict(supplyLimitDict).to('A').scalar;

  const control: SimControlParams = {
    qPositionMeters,
    qVelocityMPS,
    rVolts,
    sensorDelaySeconds,
  };

  try {
    const searchResult = searchOptimalRatio(
      (ratioMagnitude) => {
        const states = simulate({
          wpilibc,
          mech: p,
          ratioMagnitude,
          totalStatorAmps,
          supplyAmps,
          maxVelocityMPS,
          maxAccelerationMPS2,
          control,
        });
        const result = extractSimResult(states);
        return result?.success ? result : null;
      },
      {
        lowerBound: 0.25,
        upperBound: 50,
        coarseSamples: RATIO_SEARCH_COARSE_SAMPLES,
        localSamples: RATIO_SEARCH_LOCAL_SAMPLES,
      },
    );

    if (!searchResult) {
      return {
        statorLimitAmps,
        optimalRatio: Number.NaN,
        timeToGoalSeconds: Number.POSITIVE_INFINITY,
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

export interface SimulateOnceParams extends BaseLinearParams {
  ratioMagnitude: number;
  statorLimitAmps: number;
  supplyLimitAmps: number;
  maxVelocityMPS: number;
  maxAccelerationMPS2: number;
}

export async function simulateOnce({
  motorDict,
  ratioMagnitude,
  loadDict,
  spoolDiameterDict,
  travelDistanceDict,
  statorLimitAmps,
  supplyLimitAmps,
  batteryResistanceDict,
  batteryVoltageDict,
  angleDict,
  efficiency,
  cascade,
  batteryVoltageFilterTimeConstantSeconds,
  maxVelocityMPS,
  maxAccelerationMPS2,
  qPositionMeters,
  qVelocityMPS,
  rVolts,
  sensorDelaySeconds,
}: SimulateOnceParams): Promise<SingleSimResult> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    loadDict,
    spoolDiameterDict,
    travelDistanceDict,
    batteryResistanceDict,
    batteryVoltageDict,
    angleDict,
    efficiency,
    cascade,
    batteryVoltageFilterTimeConstantSeconds,
  );

  try {
    const states = simulate({
      wpilibc,
      mech: p,
      ratioMagnitude,
      totalStatorAmps: statorLimitAmps * p.motorQuantity,
      supplyAmps: supplyLimitAmps,
      maxVelocityMPS,
      maxAccelerationMPS2,
      control: {
        qPositionMeters,
        qVelocityMPS,
        rVolts,
        sensorDelaySeconds,
      },
    });

    const result = extractSimResult(states);
    if (!result) {
      return {
        ratioMagnitude,
        supplyLimitAmps,
        statorLimitAmps,
        timeToGoalSeconds: Number.POSITIVE_INFINITY,
        energyJoules: 0,
        peakCurrentAmps: 0,
        success: false,
      };
    }

    return {
      ratioMagnitude,
      supplyLimitAmps,
      statorLimitAmps,
      timeToGoalSeconds: result.timeToGoalSeconds,
      energyJoules: result.energyJoules,
      peakCurrentAmps: result.peakCurrentAmps,
      success: result.success,
    };
  } finally {
    p.wpilibMotor.delete();
  }
}

export interface OptimizeConfigurationParams extends BaseLinearParams {
  maximumComfortableStatorLimitDict: MeasurementDict;
  maximumComfortableSupplyLimitDict: MeasurementDict;
  maxVelocityMPS: number | null;
  maxAccelerationMPS2: number | null;
  kalmanFilterPositionStdDevDict: MeasurementDict;
  kalmanFilterVelocityStdDevDict: MeasurementDict;
  kalmanFilterEncoderPositionStdDevDict: MeasurementDict;
}

export interface OptimizeConfigurationCellParams extends OptimizeConfigurationParams {
  statorAmps: number;
  supplyAmps: number;
}

// Builds the shared mechanism/control state used by every grid cell. Kept in
// one place so the serial and per-cell entry points parse inputs identically.
async function prepareConfig(params: OptimizeConfigurationParams): Promise<{
  wpilibc: WpilibcModule;
  p: MechParams;
  control: SimControlParams;
}> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(params.motorDict);
  const p = parseMech(
    motor,
    params.loadDict,
    params.spoolDiameterDict,
    params.travelDistanceDict,
    params.batteryResistanceDict,
    params.batteryVoltageDict,
    params.angleDict,
    params.efficiency,
    params.cascade,
    params.batteryVoltageFilterTimeConstantSeconds,
    params.kalmanFilterPositionStdDevDict,
    params.kalmanFilterVelocityStdDevDict,
    params.kalmanFilterEncoderPositionStdDevDict,
  );
  const control: SimControlParams = {
    qPositionMeters: params.qPositionMeters,
    qVelocityMPS: params.qVelocityMPS,
    rVolts: params.rVolts,
    sensorDelaySeconds: params.sensorDelaySeconds,
  };
  return { wpilibc, p, control };
}

// Optimizes the gear ratio for a single (stator, supply) grid cell and returns
// its result. This is the unit of work that the parallel orchestrator fans out
// across the worker pool, and the loop body the serial optimizer reuses.
function computeConfigCell(
  wpilibc: WpilibcModule,
  p: MechParams,
  control: SimControlParams,
  statorAmps: number,
  supplyAmps: number,
  maxVelocityMPS: number | null,
  maxAccelerationMPS2: number | null,
): ConfigOptResult {
  const totalStatorAmps = statorAmps * p.motorQuantity;

  const searchResult = findOptimalRatio(
    wpilibc,
    p,
    totalStatorAmps,
    supplyAmps,
    maxVelocityMPS,
    maxAccelerationMPS2,
    control,
  );

  if (!searchResult) {
    return {
      statorLimitAmps: statorAmps,
      supplyLimitAmps: supplyAmps,
      optimalRatio: NaN,
      timeToGoalSeconds: Number.POSITIVE_INFINITY,
      peakCurrentAmps: 0,
      energyJoules: 0,
      success: false,
    };
  }

  return {
    statorLimitAmps: statorAmps,
    supplyLimitAmps: supplyAmps,
    optimalRatio: searchResult.ratio,
    timeToGoalSeconds: searchResult.metrics.timeToGoalSeconds,
    peakCurrentAmps: searchResult.metrics.peakCurrentAmps,
    energyJoules: searchResult.metrics.energyJoules,
    success: true,
  };
}

/**
 * Optimize the ratio for a single grid cell. Exposed as a worker method so the
 * main thread can dispatch the whole stator x supply grid across the pool in
 * parallel instead of running it serially in one worker.
 */
export async function optimizeConfigurationCell(
  params: OptimizeConfigurationCellParams,
): Promise<ConfigOptResult> {
  const { wpilibc, p, control } = await prepareConfig(params);
  try {
    return computeConfigCell(
      wpilibc,
      p,
      control,
      params.statorAmps,
      params.supplyAmps,
      params.maxVelocityMPS,
      params.maxAccelerationMPS2,
    );
  } finally {
    p.wpilibMotor.delete();
  }
}

export async function optimizeConfiguration(
  params: OptimizeConfigurationParams,
): Promise<ConfigOptOutput> {
  const { wpilibc, p, control } = await prepareConfig(params);

  const maxStator = Measurement.fromDict(
    params.maximumComfortableStatorLimitDict,
  ).to('A').scalar;
  const maxSupply = Measurement.fromDict(
    params.maximumComfortableSupplyLimitDict,
  ).to('A').scalar;

  const allResults: ConfigOptResult[] = [];

  try {
    for (const statorAmps of makeGrid(maxStator)) {
      for (const supplyAmps of makeGrid(maxSupply)) {
        allResults.push(
          computeConfigCell(
            wpilibc,
            p,
            control,
            statorAmps,
            supplyAmps,
            params.maxVelocityMPS,
            params.maxAccelerationMPS2,
          ),
        );
      }
    }
  } finally {
    p.wpilibMotor.delete();
  }

  return reduceConfigOutput(allResults);
}

workerpool.worker({
  optimizeRatio,
  simulateOnce,
  optimizeConfiguration,
  optimizeConfigurationCell,
});
