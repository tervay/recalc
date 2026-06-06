import { maxBy } from 'es-toolkit';

export type OptimizationPriority =
  | 'timeToGoal'
  | 'peakCurrent'
  | 'energy'
  | 'avgPower';

export interface SimState {
  supplyCurrentDrawAmps: number;
  timeSeconds: number;
  energyJoules: number;
  success: boolean;
}

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

export function getMetric<T extends MetricSource>(
  r: T,
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
