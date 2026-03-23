import { maxBy } from 'lodash-es';
import minimize from 'minimize-golden-section-1d';
import workerpool from 'workerpool';

import type { DCMotor } from '~/lib/generated/wpilibc/wpilibc_wasm';
import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

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
  recommended: ConfigOptResult;
  tier1Count: number;
  tier2Count: number;
  targetResult: ConfigOptResult | null;
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
  );
}

function peakSupplyCurrent(states: SimState[]): number {
  return (
    maxBy(states, (s) => s.supplyCurrentDrawAmps)?.supplyCurrentDrawAmps ?? 0
  );
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
  );
  const totalStatorAmps = statorLimitAmps * p.motorQuantity;
  const supplyAmps = Measurement.fromDict(supplyLimitDict).to('A').scalar;

  const optimalRatio = minimize(
    (r) => {
      const states = simulate(wpilibc, p, r, totalStatorAmps, supplyAmps);
      return states[states.length - 1].timeSeconds;
    },
    { lowerBound: 1, upperBound: 10, guess: initialRatio },
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

  const results: ConfigOptResult[] = [];

  for (const statorAmps of makeGrid(maxStator)) {
    const totalStatorAmps = statorAmps * p.motorQuantity;
    for (const supplyAmps of makeGrid(maxSupply)) {
      const optimalRatio = minimize(
        (r) => {
          const states = simulate(wpilibc, p, r, totalStatorAmps, supplyAmps);
          return states[states.length - 1].success
            ? states[states.length - 1].timeSeconds
            : Number.POSITIVE_INFINITY;
        },
        { lowerBound: 1, upperBound: 30, guess: 10, tolerance: 0.05 },
      );

      const states = simulate(
        wpilibc,
        p,
        optimalRatio,
        totalStatorAmps,
        supplyAmps,
        1.5,
      );
      const last = states[states.length - 1];

      results.push({
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

  const successResults = results.filter((r) => r.success);
  const minTime = Math.min(...successResults.map((r) => r.timeToGoalSeconds));
  const tier1 = successResults.filter(
    (r) => r.timeToGoalSeconds <= minTime * 1.1,
  );

  const minCurrent = Math.min(...tier1.map((r) => r.peakCurrentAmps));
  const tier2 = tier1.filter((r) => r.peakCurrentAmps <= minCurrent * 1.1);

  const recommended = tier2.reduce((best, r) =>
    r.energyJoules < best.energyJoules ? r : best,
  );

  const targetCandidates = successResults.filter(
    (r) => r.timeToGoalSeconds <= targetTimeSeconds,
  );
  let targetResult: ConfigOptResult | null = null;
  if (targetCandidates.length > 0) {
    const targetMinCurrent = Math.min(
      ...targetCandidates.map((r) => r.peakCurrentAmps),
    );
    const targetTier = targetCandidates.filter(
      (r) => r.peakCurrentAmps <= targetMinCurrent * 1.1,
    );
    targetResult = targetTier.reduce((best, r) =>
      r.energyJoules < best.energyJoules ? r : best,
    );
  }

  return {
    recommended,
    tier1Count: tier1.length,
    tier2Count: tier2.length,
    targetResult,
  };
}

workerpool.worker({ optimizeRatio, simulateOnce, optimizeConfiguration });
