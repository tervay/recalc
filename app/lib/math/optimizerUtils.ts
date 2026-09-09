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

export interface RatioSearchOptions {
  lowerBound: number;
  upperBound: number;
  coarseSamples: number;
  localSamples: number;
}

export interface RatioSearchResult<T extends MetricSource> {
  ratio: number;
  metrics: T;
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

const RECOMMENDATION_TIME_BUCKET_SECONDS = 0.05;
const RECOMMENDATION_CURRENT_BUCKET_AMPS = 5;
const RECOMMENDATION_ENERGY_BUCKET_JOULES = 5;

export const RATIO_SEARCH_COARSE_SAMPLES = 32;
export const RATIO_SEARCH_LOCAL_SAMPLES = 16;

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

function recommendationBucket(value: number, width: number): number {
  const scaledValue = value / width;
  const nearestInteger = Math.round(scaledValue);
  const floatingPointTolerance =
    Number.EPSILON * Math.max(1, Math.abs(scaledValue)) * 4;

  // Decimal boundaries such as 0.15 / 0.05 can be represented just below
  // their mathematical integer in binary floating point. Treat that tiny
  // representation error as the exact boundary; values materially below it
  // remain in the lower half-open bucket.
  if (Math.abs(scaledValue - nearestInteger) <= floatingPointTolerance) {
    return nearestInteger;
  }

  return Math.floor(scaledValue);
}

export function averagePower(metric: MetricSource): number {
  return metric.timeToGoalSeconds > 0
    ? metric.energyJoules / metric.timeToGoalSeconds
    : Number.POSITIVE_INFINITY;
}

function compareNumber(left: number, right: number): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Compares simulation results using the optimizer's lexicographic objective.
 * Lower time, current, energy buckets, and then raw average power win.
 */
export function compareBucketedMetrics(
  left: MetricSource,
  right: MetricSource,
): number {
  const bucketComparisons: Array<[number, number]> = [
    [
      recommendationBucket(
        left.timeToGoalSeconds,
        RECOMMENDATION_TIME_BUCKET_SECONDS,
      ),
      recommendationBucket(
        right.timeToGoalSeconds,
        RECOMMENDATION_TIME_BUCKET_SECONDS,
      ),
    ],
    [
      recommendationBucket(
        left.peakCurrentAmps,
        RECOMMENDATION_CURRENT_BUCKET_AMPS,
      ),
      recommendationBucket(
        right.peakCurrentAmps,
        RECOMMENDATION_CURRENT_BUCKET_AMPS,
      ),
    ],
    [
      recommendationBucket(
        left.energyJoules,
        RECOMMENDATION_ENERGY_BUCKET_JOULES,
      ),
      recommendationBucket(
        right.energyJoules,
        RECOMMENDATION_ENERGY_BUCKET_JOULES,
      ),
    ],
  ];

  for (const [leftBucket, rightBucket] of bucketComparisons) {
    const comparison = compareNumber(leftBucket, rightBucket);
    if (comparison !== 0) return comparison;
  }

  return compareNumber(averagePower(left), averagePower(right));
}

function isSelectableMetricSource(result: MetricSource): boolean {
  return (
    Number.isFinite(result.timeToGoalSeconds) &&
    result.timeToGoalSeconds >= 0 &&
    Number.isFinite(result.peakCurrentAmps) &&
    result.peakCurrentAmps >= 0 &&
    Number.isFinite(result.energyJoules)
  );
}

export function selectBestBucketed<T extends MetricSource>(
  candidates: T[],
): T | null {
  const selectable = candidates.filter(isSelectableMetricSource);
  const first = selectable[0];
  if (!first) return null;

  return selectable
    .slice(1)
    .reduce(
      (best, candidate) =>
        compareBucketedMetrics(candidate, best) < 0 ? candidate : best,
      first,
    );
}

function logarithmicSamples(
  lowerBound: number,
  upperBound: number,
  sampleCount: number,
): number[] {
  if (sampleCount === 1 || lowerBound === upperBound) {
    return [lowerBound];
  }

  const lowerLog = Math.log(lowerBound);
  const upperLog = Math.log(upperBound);

  return Array.from({ length: sampleCount }, (_, index) =>
    Math.exp(lowerLog + (index / (sampleCount - 1)) * (upperLog - lowerLog)),
  );
}

interface EvaluatedRatio<T extends MetricSource> extends MetricSource {
  ratio: number;
  metrics: T;
}

/**
 * Searches a positive ratio interval with a deterministic logarithmic scan.
 * The best coarse sample's neighboring interval is then refined with a second
 * logarithmic scan. The evaluator should return null for an unsuccessful trial.
 */
export function searchOptimalRatio<T extends MetricSource>(
  evaluate: (ratio: number) => T | null,
  options: RatioSearchOptions,
): RatioSearchResult<T> | null {
  const { lowerBound, upperBound, coarseSamples, localSamples } = options;

  if (
    !Number.isFinite(lowerBound) ||
    !Number.isFinite(upperBound) ||
    lowerBound <= 0 ||
    upperBound < lowerBound ||
    !Number.isInteger(coarseSamples) ||
    coarseSamples < 1 ||
    !Number.isInteger(localSamples) ||
    localSamples < 1
  ) {
    return null;
  }

  const cache = new Map<number, T | null>();
  const evaluateOnce = (ratio: number): T | null => {
    if (cache.has(ratio)) {
      return cache.get(ratio) ?? null;
    }

    const result = evaluate(ratio);
    cache.set(ratio, result);
    return result;
  };

  const coarseRatios = logarithmicSamples(
    lowerBound,
    upperBound,
    coarseSamples,
  );

  const evaluateRatios = (ratios: number[]): EvaluatedRatio<T>[] => {
    const candidates: EvaluatedRatio<T>[] = [];
    for (const ratio of ratios) {
      const metrics = evaluateOnce(ratio);
      if (metrics && isSelectableMetricSource(metrics)) {
        candidates.push({ ratio, metrics, ...metrics });
      }
    }
    return candidates;
  };

  const coarseCandidates = evaluateRatios(coarseRatios);
  const bestCoarse = selectBestBucketed(coarseCandidates);
  if (!bestCoarse) return null;

  const bestCoarseIndex = coarseRatios.findIndex(
    (ratio) => ratio === bestCoarse.ratio,
  );
  const localLowerBound =
    bestCoarseIndex > 0 ? coarseRatios[bestCoarseIndex - 1] : lowerBound;
  const localUpperBound =
    bestCoarseIndex < coarseRatios.length - 1
      ? coarseRatios[bestCoarseIndex + 1]
      : upperBound;
  const localCandidates = evaluateRatios(
    logarithmicSamples(localLowerBound, localUpperBound, localSamples),
  );
  const best = selectBestBucketed([...coarseCandidates, ...localCandidates]);

  return best ? { ratio: best.ratio, metrics: best.metrics } : null;
}

function isSelectableRecommendation(result: ConfigOptResult): boolean {
  return (
    result.success &&
    Number.isFinite(result.timeToGoalSeconds) &&
    result.timeToGoalSeconds >= 0 &&
    Number.isFinite(result.peakCurrentAmps) &&
    result.peakCurrentAmps >= 0 &&
    Number.isFinite(result.energyJoules)
  );
}

/**
 * Collapse a flat list of grid-cell results into a ConfigOptOutput.
 *
 * Recommendations use half-open buckets: time is grouped by 0.05 seconds and
 * peak current by 5 amps. Exact boundaries belong to the higher bucket (for
 * example, 0.05 is in the [0.05, 0.10) time bucket and 5 is in the [5, 10)
 * current bucket). The first result in the input order wins exact ties, which
 * keeps serial and parallel grids deterministic without changing allResults.
 *
 * Only successful results with finite, non-negative time/current and finite
 * energy are selectable. Energy is compared as reported by the simulator;
 * this intentionally preserves signed finite energy values from arm results.
 */
export function reduceConfigOutput(
  allResults: ConfigOptResult[],
): ConfigOptOutput {
  const selectableResults = allResults.filter(isSelectableRecommendation);

  const recommended = selectBestBucketed(selectableResults);

  return { recommended, allResults };
}
