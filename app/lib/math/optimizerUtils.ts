import { maxBy } from 'es-toolkit';

import type { ElevatorSimRow } from '~/lib/wpilib/wpilibc';

export type OptimizationPriority =
  | 'timeToGoal'
  | 'peakCurrent'
  | 'energy'
  | 'avgPower';

export type SimState = Pick<
  ElevatorSimRow,
  'supplyCurrentDrawAmps' | 'timeSeconds' | 'energyJoules' | 'success'
>;

export interface MetricSource {
  timeToGoalSeconds: number;
  peakCurrentAmps: number;
  energyJoules: number;
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

export function peakSupplyCurrent(states: SimState[]): number {
  return (
    maxBy(states, (s) => s.supplyCurrentDrawAmps)?.supplyCurrentDrawAmps ?? 0
  );
}

export function getMetric(
  r: MetricSource,
  priority: OptimizationPriority,
): number {
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
    default:
      throw new Error(`Unhandled optimization priority: ${priority as string}`);
  }
}

export function selectBest<T extends MetricSource>(
  candidates: T[],
  priorities: OptimizationPriority[],
  tolerance: number,
): { result: T; tier1Count: number; tier2Count: number } {
  let pool = candidates;
  const multiplier = 1 + tolerance;

  const best0 = Math.min(...pool.map((r) => getMetric(r, priorities[0])));
  const tier1 = pool.filter(
    (r) => getMetric(r, priorities[0]) <= best0 * multiplier,
  );
  pool = tier1;

  let tier2 = tier1;
  if (priorities.length > 1) {
    const best1 = Math.min(...pool.map((r) => getMetric(r, priorities[1])));
    tier2 = pool.filter(
      (r) => getMetric(r, priorities[1]) <= best1 * multiplier,
    );
    pool = tier2;

    for (let i = 2; i < priorities.length - 1; i++) {
      const best = Math.min(...pool.map((r) => getMetric(r, priorities[i])));
      pool = pool.filter(
        (r) => getMetric(r, priorities[i]) <= best * multiplier,
      );
    }
  }

  const last = priorities[priorities.length - 1];
  const result = pool.reduce((acc, r) =>
    getMetric(r, last) < getMetric(acc, last) ? r : acc,
  );

  return { result, tier1Count: tier1.length, tier2Count: tier2.length };
}

export function makeGrid(max: number): number[] {
  return Array.from({ length: Math.ceil(max / 10) }, (_, i) =>
    Math.min((i + 1) * 10, max),
  );
}

export const OPTIMIZER_SIM_CEIL_SECONDS = 3.0;

const OPTIMIZER_SIM_PROFILE_MARGIN = 1.3;
const OPTIMIZER_SIM_PROFILE_PAD_SECONDS = 0.15;

/**
 * Duration of a rest-to-rest trapezoidal motion profile: the time WPILib's
 * `TrapezoidProfile` reports for the same distance and limits. The elevator
 * sim loop stops the moment the profile completes, so this is also the
 * shortest sim window in which a config can possibly reach its goal.
 *
 * Infinite when the limits cannot produce motion; zero for a zero move.
 */
export function trapezoidProfileDurationSeconds(
  distanceMeters: number,
  maxVelocityMPS: number,
  maxAccelerationMPS2: number,
): number {
  if (
    !Number.isFinite(distanceMeters) ||
    !Number.isFinite(maxVelocityMPS) ||
    !Number.isFinite(maxAccelerationMPS2) ||
    maxVelocityMPS <= 0 ||
    maxAccelerationMPS2 <= 0
  ) {
    return Number.POSITIVE_INFINITY;
  }

  if (distanceMeters <= 0) {
    return 0;
  }

  const distanceToReachVmax = maxVelocityMPS ** 2 / maxAccelerationMPS2;

  if (distanceToReachVmax >= distanceMeters) {
    return 2 * Math.sqrt(distanceMeters / maxAccelerationMPS2);
  }

  return (
    2 * (maxVelocityMPS / maxAccelerationMPS2) +
    (distanceMeters - distanceToReachVmax) / maxVelocityMPS
  );
}

/**
 * Sim window for one optimizer trial: the profile duration plus a margin for
 * controller lag, never below `floorSeconds` (the caller's historical cap) and
 * never above `OPTIMIZER_SIM_CEIL_SECONDS`. Bounding it keeps a pathologically
 * slow config from stalling the grid.
 */
export function adaptiveSimSeconds(
  distanceMeters: number,
  maxVelocityMPS: number,
  maxAccelerationMPS2: number,
  floorSeconds: number,
): number {
  const duration = trapezoidProfileDurationSeconds(
    distanceMeters,
    maxVelocityMPS,
    maxAccelerationMPS2,
  );

  if (!Number.isFinite(duration)) {
    return OPTIMIZER_SIM_CEIL_SECONDS;
  }

  const padded =
    duration * OPTIMIZER_SIM_PROFILE_MARGIN + OPTIMIZER_SIM_PROFILE_PAD_SECONDS;

  return Math.min(OPTIMIZER_SIM_CEIL_SECONDS, Math.max(floorSeconds, padded));
}

/**
 * Collapse a flat list of grid-cell results into a ConfigOptOutput, selecting
 * the fastest successful cell as the recommendation. Shared by the serial
 * optimizer and the parallel (pool-dispatched) orchestrator so both paths
 * produce identical output for the same set of cells.
 */
export function reduceConfigOutput(
  allResults: ConfigOptResult[],
): ConfigOptOutput {
  const successResults = allResults.filter((r) => r.success);

  if (successResults.length === 0) {
    return { recommended: null, allResults };
  }

  const recommended = successResults.reduce((best, r) =>
    r.timeToGoalSeconds < best.timeToGoalSeconds ? r : best,
  );

  return { recommended, allResults };
}
