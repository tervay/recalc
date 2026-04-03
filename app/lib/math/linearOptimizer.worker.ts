import minimize from 'minimize-golden-section-1d';
import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import { calculateGuessedLimits } from '~/lib/math/linear';
import {
  type SimState,
  type MetricSource,
  peakSupplyCurrent,
  makeGrid,
} from '~/lib/math/optimizerUtils';
import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export interface OptimizerResult extends MetricSource {
  statorLimitAmps: number;
  optimalRatio: number;
}

export interface SingleSimResult extends MetricSource {
  ratioMagnitude: number;
  supplyLimitAmps: number;
  statorLimitAmps: number;
}

export interface ConfigOptResult extends MetricSource {
  statorLimitAmps: number;
  supplyLimitAmps: number;
  optimalRatio: number;
  success: boolean;
}

export interface ConfigOptOutput {
  recommended: ConfigOptResult | null;
  allResults: ConfigOptResult[];
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
  );
  return {
    velocity: v_max_guessed.to('m/s').scalar,
    acceleration: a_max_guessed.to('m/s^2').scalar,
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

/**
 * Find the optimal gear ratio by first doing a coarse logarithmic scan to
 * bracket the valid region, then refining with golden section search.
 *
 * Golden section search alone can get stuck when both interior sample points
 * land in the failure zone (ratio too low OR too high both produce
 * POSITIVE_INFINITY), giving it no gradient signal to escape. The pre-scan
 * locates the finite valley so the optimizer always starts inside it.
 *
 * Returns NaN if no ratio in [0.25, 50] produces a successful simulation.
 */
function findOptimalRatio(
  wpilibc: WpilibcModule,
  p: MechParams,
  totalStatorAmps: number,
  supplyAmps: number,
  maxVelocityMPS: number | null,
  maxAccelerationMPS2: number | null,
  control: SimControlParams,
): number {
  const { qPositionMeters, qVelocityMPS, rVolts, sensorDelaySeconds } = control;
  const needsGuessing = maxVelocityMPS === null || maxAccelerationMPS2 === null;

  const guessLimitsForRatio = needsGuessing
    ? (r: number) =>
        guessLimitsFromMech(
          p,
          r,
          totalStatorAmps / p.motorQuantity,
          supplyAmps,
          rVolts,
        )
    : undefined;

  function runSim(r: number, velocity: number, acceleration: number): number {
    const states = simulate({
      wpilibc,
      mech: p,
      ratioMagnitude: r,
      totalStatorAmps,
      supplyAmps,
      maxVelocityMPS: velocity,
      maxAccelerationMPS2: acceleration,
      control: {
        qPositionMeters,
        qVelocityMPS,
        rVolts,
        sensorDelaySeconds,
      },
      timeoutSeconds: 1,
    });
    if (states.length === 0) return Number.POSITIVE_INFINITY;
    const last = states[states.length - 1];
    return last.success ? last.timeSeconds : Number.POSITIVE_INFINITY;
  }

  function objective(r: number): number {
    let velocity: number;
    let acceleration: number;

    if (needsGuessing) {
      const guessed = guessLimitsForRatio!(r);
      velocity = maxVelocityMPS ?? guessed.velocity;
      acceleration = maxAccelerationMPS2 ?? guessed.acceleration;
    } else {
      velocity = maxVelocityMPS!;
      acceleration = maxAccelerationMPS2!;
    }

    return runSim(r, velocity, acceleration);
  }

  // Coarse log-spaced scan: find any successful bracket before minimizing.
  const numScanPoints = 16;
  const logLow = Math.log(0.25);
  const logHigh = Math.log(50);
  const scan = Array.from({ length: numScanPoints }, (_, i) => {
    const r = Math.exp(logLow + (i / (numScanPoints - 1)) * (logHigh - logLow));
    return { r, t: objective(r) };
  });

  let firstValidIdx = -1;
  let lastValidIdx = -1;
  let bestIdx = -1;
  for (let i = 0; i < scan.length; i++) {
    if (isFinite(scan[i].t)) {
      if (firstValidIdx === -1) firstValidIdx = i;
      lastValidIdx = i;
      if (bestIdx === -1 || scan[i].t < scan[bestIdx].t) bestIdx = i;
    }
  }

  if (firstValidIdx === -1) {
    return NaN;
  }

  const bracketLow = firstValidIdx > 0 ? scan[firstValidIdx - 1].r : 0.25;
  const bracketHigh =
    lastValidIdx < numScanPoints - 1 ? scan[lastValidIdx + 1].r : 50;

  return minimize(objective, {
    lowerBound: bracketLow,
    upperBound: bracketHigh,
    guess: scan[bestIdx].r,
    tolerance: 0.05,
  });
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
  initialRatio,
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

  const optimalRatio = minimize(
    (r) => {
      const states = simulate({
        wpilibc,
        mech: p,
        ratioMagnitude: r,
        totalStatorAmps,
        supplyAmps,
        maxVelocityMPS,
        maxAccelerationMPS2,
        control,
      });
      if (states.length === 0) return Number.POSITIVE_INFINITY;
      return states[states.length - 1].timeSeconds;
    },
    { lowerBound: 0.25, upperBound: 50, guess: initialRatio },
  );

  const states = simulate({
    wpilibc,
    mech: p,
    ratioMagnitude: optimalRatio,
    totalStatorAmps,
    supplyAmps,
    maxVelocityMPS,
    maxAccelerationMPS2,
    control,
  });

  const result = extractSimResult(states);
  if (!result) {
    return {
      statorLimitAmps,
      optimalRatio,
      timeToGoalSeconds: Number.POSITIVE_INFINITY,
      energyJoules: 0,
      peakCurrentAmps: 0,
    };
  }

  return {
    statorLimitAmps,
    optimalRatio,
    timeToGoalSeconds: result.timeToGoalSeconds,
    energyJoules: result.energyJoules,
    peakCurrentAmps: result.peakCurrentAmps,
  };
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
    };
  }

  return {
    ratioMagnitude,
    supplyLimitAmps,
    statorLimitAmps,
    timeToGoalSeconds: result.timeToGoalSeconds,
    energyJoules: result.energyJoules,
    peakCurrentAmps: result.peakCurrentAmps,
  };
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

export async function optimizeConfiguration({
  motorDict,
  loadDict,
  spoolDiameterDict,
  travelDistanceDict,
  batteryResistanceDict,
  batteryVoltageDict,
  maximumComfortableStatorLimitDict,
  maximumComfortableSupplyLimitDict,
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
  kalmanFilterPositionStdDevDict,
  kalmanFilterVelocityStdDevDict,
  kalmanFilterEncoderPositionStdDevDict,
}: OptimizeConfigurationParams): Promise<ConfigOptOutput> {
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
    kalmanFilterPositionStdDevDict,
    kalmanFilterVelocityStdDevDict,
    kalmanFilterEncoderPositionStdDevDict,
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
      const control: SimControlParams = {
        qPositionMeters,
        qVelocityMPS,
        rVolts,
        sensorDelaySeconds,
      };

      const optimalRatio = findOptimalRatio(
        wpilibc,
        p,
        totalStatorAmps,
        supplyAmps,
        maxVelocityMPS,
        maxAccelerationMPS2,
        control,
      );

      if (isNaN(optimalRatio)) {
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

      let effectiveVelocity = maxVelocityMPS;
      let effectiveAcceleration = maxAccelerationMPS2;

      if (effectiveVelocity === null || effectiveAcceleration === null) {
        const guessed = guessLimitsFromMech(
          p,
          optimalRatio,
          statorAmps,
          supplyAmps,
          rVolts,
        );
        effectiveVelocity = effectiveVelocity ?? guessed.velocity;
        effectiveAcceleration = effectiveAcceleration ?? guessed.acceleration;
      }

      const states = simulate({
        wpilibc,
        mech: p,
        ratioMagnitude: optimalRatio,
        totalStatorAmps,
        supplyAmps,
        maxVelocityMPS: effectiveVelocity,
        maxAccelerationMPS2: effectiveAcceleration,
        control,
        timeoutSeconds: 1.5,
      });

      const result = extractSimResult(states);
      if (!result) {
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
        timeToGoalSeconds: result.timeToGoalSeconds,
        peakCurrentAmps: result.peakCurrentAmps,
        energyJoules: result.energyJoules,
        success: result.success,
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

workerpool.worker({ optimizeRatio, simulateOnce, optimizeConfiguration });
