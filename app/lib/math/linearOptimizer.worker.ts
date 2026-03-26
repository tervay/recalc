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

export interface OptimizerResult {
  statorLimitAmps: number;
  optimalRatio: number;
  timeToGoalSeconds: number;
  energyJoules: number;
  peakCurrentAmps: number;
}

export interface SingleSimResult {
  ratioMagnitude: number;
  supplyLimitAmps: number;
  statorLimitAmps: number;
  timeToGoalSeconds: number;
  energyJoules: number;
  peakCurrentAmps: number;
}

export interface ConfigOptResult {
  statorLimitAmps: number;
  supplyLimitAmps: number;
  optimalRatio: number;
  timeToGoalSeconds: number;
  peakCurrentAmps: number;
  energyJoules: number;
  success: boolean;
}

export interface ConfigOptOutput {
  recommended: ConfigOptResult | null;
  tier1Count: number;
  tier2Count: number;
  targetResult: ConfigOptResult | null;
  allResults: ConfigOptResult[];
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
  loadKg: number;
  spoolRadiusMeters: number;
  travelDistanceMeters: number;
  statorVoltageVolts: number;
  batteryResistanceOhms: number;
  batteryVoltageVolts: number;
  angleRadians: number;
  efficiency: number;
  cascade: boolean;
  batteryVoltageFilterTimeConstantSeconds: number;
}

type WpilibcModule = Awaited<ReturnType<typeof initWpilibc>>;

function parseMech(
  motor: Motor,
  loadDict: MeasurementDict,
  spoolDiameterDict: MeasurementDict,
  travelDistanceDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  angleDict: MeasurementDict,
  efficiency: number,
  cascade: boolean,
  batteryVoltageFilterTimeConstantSeconds: number,
): MechParams {
  return {
    wpilibMotor: motor.toWpilibMotor(),
    motorQuantity: motor.quantity,
    loadKg: Measurement.fromDict(loadDict).to('kg').scalar,
    spoolRadiusMeters: Measurement.fromDict(spoolDiameterDict).div(2).to('m')
      .scalar,
    travelDistanceMeters:
      Measurement.fromDict(travelDistanceDict).to('m').scalar,
    statorVoltageVolts: Measurement.fromDict(statorVoltageDict).to('V').scalar,
    batteryResistanceOhms: Measurement.fromDict(batteryResistanceDict).to('Ohm')
      .scalar,
    batteryVoltageVolts:
      Measurement.fromDict(batteryVoltageDict).to('V').scalar,
    angleRadians: Measurement.fromDict(angleDict).to('rad').scalar,
    efficiency,
    cascade,
    batteryVoltageFilterTimeConstantSeconds,
  };
}

function simulate(
  wpilibc: WpilibcModule,
  p: MechParams,
  ratioMagnitude: number,
  totalStatorAmps: number,
  supplyAmps: number,
  timeoutSeconds = 3.0,
): SimState[] {
  return wpilibc.simulateElevator(
    p.wpilibMotor,
    ratioMagnitude,
    p.loadKg,
    p.spoolRadiusMeters,
    p.travelDistanceMeters,
    totalStatorAmps,
    supplyAmps * p.motorQuantity,
    p.statorVoltageVolts,
    p.batteryResistanceOhms,
    p.batteryVoltageVolts,
    0.0005,
    10,
    timeoutSeconds,
    p.angleRadians,
    p.efficiency,
    p.cascade,
    p.batteryVoltageFilterTimeConstantSeconds,
  );
}

function peakSupplyCurrent(states: SimState[]): number {
  return (
    maxBy(states, (s) => s.supplyCurrentDrawAmps)?.supplyCurrentDrawAmps ?? 0
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
): number {
  const objective = (r: number): number => {
    const states = simulate(wpilibc, p, r, totalStatorAmps, supplyAmps, 1);
    const last = states[states.length - 1];
    return last.success ? last.timeSeconds : Number.POSITIVE_INFINITY;
  };

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

function getMetric(r: ConfigOptResult, priority: OptimizationPriority): number {
  switch (priority) {
    case 'timeToGoal':
      return r.timeToGoalSeconds;
    case 'peakCurrent':
      return r.peakCurrentAmps;
    case 'energy':
      return r.energyJoules;
    case 'avgPower':
      return r.timeToGoalSeconds > 0
        ? r.energyJoules / r.timeToGoalSeconds
        : Number.POSITIVE_INFINITY;
  }
}

function selectBest(
  candidates: ConfigOptResult[],
  priorities: OptimizationPriority[],
  tolerance: number,
): { result: ConfigOptResult; tier1Count: number; tier2Count: number } {
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
  loadDict: MeasurementDict,
  spoolDiameterDict: MeasurementDict,
  travelDistanceDict: MeasurementDict,
  supplyLimitDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  statorLimitAmps: number,
  initialRatio: number,
  angleDict: MeasurementDict,
  efficiency: number,
  cascade: boolean,
  batteryVoltageFilterTimeConstantSeconds: number,
): Promise<OptimizerResult> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    loadDict,
    spoolDiameterDict,
    travelDistanceDict,
    statorVoltageDict,
    batteryResistanceDict,
    batteryVoltageDict,
    angleDict,
    efficiency,
    cascade,
    batteryVoltageFilterTimeConstantSeconds,
  );
  const totalStatorAmps = statorLimitAmps * p.motorQuantity;
  const supplyAmps = Measurement.fromDict(supplyLimitDict).to('A').scalar;

  const optimalRatio = minimize(
    (r) => {
      const states = simulate(wpilibc, p, r, totalStatorAmps, supplyAmps);
      return states[states.length - 1].timeSeconds;
    },
    { lowerBound: 0.25, upperBound: 50, guess: initialRatio },
  );

  const states = simulate(
    wpilibc,
    p,
    optimalRatio,
    totalStatorAmps,
    supplyAmps,
  );
  const last = states[states.length - 1];

  return {
    statorLimitAmps,
    optimalRatio,
    timeToGoalSeconds: last.timeSeconds,
    energyJoules: last.energyJoules,
    peakCurrentAmps: peakSupplyCurrent(states),
  };
}

async function simulateOnce(
  motorDict: MotorDict,
  ratioMagnitude: number,
  loadDict: MeasurementDict,
  spoolDiameterDict: MeasurementDict,
  travelDistanceDict: MeasurementDict,
  statorLimitAmps: number,
  supplyLimitAmps: number,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  angleDict: MeasurementDict,
  efficiency: number,
  cascade: boolean,
  batteryVoltageFilterTimeConstantSeconds: number,
): Promise<SingleSimResult> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    loadDict,
    spoolDiameterDict,
    travelDistanceDict,
    statorVoltageDict,
    batteryResistanceDict,
    batteryVoltageDict,
    angleDict,
    efficiency,
    cascade,
    batteryVoltageFilterTimeConstantSeconds,
  );

  const states = simulate(
    wpilibc,
    p,
    ratioMagnitude,
    statorLimitAmps * p.motorQuantity,
    supplyLimitAmps,
  );
  const last = states[states.length - 1];

  return {
    ratioMagnitude,
    supplyLimitAmps,
    statorLimitAmps,
    timeToGoalSeconds: last.timeSeconds,
    energyJoules: last.energyJoules,
    peakCurrentAmps: peakSupplyCurrent(states),
  };
}

async function optimizeConfiguration(
  motorDict: MotorDict,
  loadDict: MeasurementDict,
  spoolDiameterDict: MeasurementDict,
  travelDistanceDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistanceDict: MeasurementDict,
  batteryVoltageDict: MeasurementDict,
  targetTimeSeconds: number,
  maximumComfortableStatorLimitDict: MeasurementDict,
  maximumComfortableSupplyLimitDict: MeasurementDict,
  angleDict: MeasurementDict,
  efficiency: number,
  cascade: boolean,
  batteryVoltageFilterTimeConstantSeconds: number,
  priorities: OptimizationPriority[],
  prioritySlack: number,
): Promise<ConfigOptOutput> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const p = parseMech(
    motor,
    loadDict,
    spoolDiameterDict,
    travelDistanceDict,
    statorVoltageDict,
    batteryResistanceDict,
    batteryVoltageDict,
    angleDict,
    efficiency,
    cascade,
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

  const allResults: ConfigOptResult[] = [];

  for (const statorAmps of makeGrid(maxStator)) {
    const totalStatorAmps = statorAmps * p.motorQuantity;
    for (const supplyAmps of makeGrid(maxSupply)) {
      const optimalRatio = findOptimalRatio(
        wpilibc,
        p,
        totalStatorAmps,
        supplyAmps,
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

      const states = simulate(
        wpilibc,
        p,
        optimalRatio,
        totalStatorAmps,
        supplyAmps,
        1.5,
      );
      const last = states[states.length - 1];

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
    return {
      recommended: null,
      tier1Count: 0,
      tier2Count: 0,
      targetResult: null,
      allResults,
    };
  }

  const {
    result: recommended,
    tier1Count,
    tier2Count,
  } = selectBest(successResults, priorities, prioritySlack);

  const targetCandidates = successResults.filter(
    (r) => r.timeToGoalSeconds <= targetTimeSeconds,
  );
  let targetResult: ConfigOptResult | null = null;
  if (targetCandidates.length > 0) {
    targetResult = selectBest(
      targetCandidates,
      priorities,
      prioritySlack,
    ).result;
  }

  return {
    recommended,
    tier1Count,
    tier2Count,
    targetResult,
    allResults,
  };
}

workerpool.worker({ optimizeRatio, simulateOnce, optimizeConfiguration });
