import type { WpilibMotorSimState } from '~/lib/math/motors.worker';

export interface MotorChartRow {
  angularVelocityRPM: number;
  currentDrawAmps: number;
  torqueNewtonMeters: number;
  efficiencyPercent: number;
  percentOfFreeSpeed: number;
}

interface GearMotorChartDataParams {
  motorARows: readonly MotorChartRow[];
  motorAFreeSpeedRPM: number;
  motorBRows: readonly MotorChartRow[];
  motorBFreeSpeedRPM: number;
}

interface GearedMotorChartData {
  motorARows: readonly MotorChartRow[];
  motorBRows: readonly MotorChartRow[];
}

export function buildMotorChartData(
  states: WpilibMotorSimState[],
  freeSpeedRPM: number,
): MotorChartRow[] {
  return states.map((s) => ({
    ...s,
    efficiencyPercent: s.efficiency * 100,
    percentOfFreeSpeed:
      freeSpeedRPM > 0 ? (s.angularVelocityRPM / freeSpeedRPM) * 100 : 0,
  }));
}

/**
 * Applies an ideal reduction to the faster motor so both outputs have the same
 * free speed. Electrical values and efficiency remain motor-side quantities.
 */
export function gearMotorChartDataToSameSpeed({
  motorARows,
  motorAFreeSpeedRPM,
  motorBRows,
  motorBFreeSpeedRPM,
}: GearMotorChartDataParams): GearedMotorChartData {
  const unchanged = { motorARows, motorBRows };
  if (
    motorARows.length === 0 ||
    motorBRows.length === 0 ||
    !Number.isFinite(motorAFreeSpeedRPM) ||
    !Number.isFinite(motorBFreeSpeedRPM) ||
    motorAFreeSpeedRPM <= 0 ||
    motorBFreeSpeedRPM <= 0 ||
    motorAFreeSpeedRPM === motorBFreeSpeedRPM
  ) {
    return unchanged;
  }

  function applyReduction(
    rows: readonly MotorChartRow[],
    reduction: number,
  ): MotorChartRow[] {
    return rows.map((row) => ({
      ...row,
      angularVelocityRPM: row.angularVelocityRPM / reduction,
      torqueNewtonMeters: row.torqueNewtonMeters * reduction,
    }));
  }

  if (motorAFreeSpeedRPM > motorBFreeSpeedRPM) {
    return {
      motorARows: applyReduction(
        motorARows,
        motorAFreeSpeedRPM / motorBFreeSpeedRPM,
      ),
      motorBRows,
    };
  }

  return {
    motorARows,
    motorBRows: applyReduction(
      motorBRows,
      motorBFreeSpeedRPM / motorAFreeSpeedRPM,
    ),
  };
}

export type ComparisonXKey = 'angularVelocityRPM' | 'percentOfFreeSpeed';

type MotorMetricKey =
  | 'currentDrawAmps'
  | 'torqueNewtonMeters'
  | 'efficiencyPercent';

export interface ComparisonChartRow {
  x: number;
  aCurrentDrawAmps: number | null;
  aTorqueNewtonMeters: number | null;
  aEfficiencyPercent: number | null;
  bCurrentDrawAmps: number | null;
  bTorqueNewtonMeters: number | null;
  bEfficiencyPercent: number | null;
}

// Recharts' tooltip looks up a series' value by row index into whatever
// array that series was given. Motor A and motor B are independent sweeps
// with different lengths and different x-values at each index, so passing
// each its own array makes the tooltip pair up unrelated rows. Resampling
// both onto one shared, evenly-spaced x grid gives every row a single,
// correct index for both motors.
const COMPARISON_SAMPLE_COUNT = 400;

function sampleAt(
  rows: readonly MotorChartRow[],
  xKey: ComparisonXKey,
  yKey: MotorMetricKey,
  targetX: number,
): number | null {
  if (rows.length === 0) return null;

  const first = rows[0][xKey];
  const last = rows[rows.length - 1][xKey];
  if (targetX < first || targetX > last) return null;

  let lo = 0;
  let hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rows[mid][xKey] <= targetX) lo = mid;
    else hi = mid;
  }

  const a = rows[lo];
  const b = rows[hi];
  if (b[xKey] === a[xKey]) return a[yKey];
  const t = (targetX - a[xKey]) / (b[xKey] - a[xKey]);
  return a[yKey] + t * (b[yKey] - a[yKey]);
}

export function buildComparisonChartData(
  motorARows: readonly MotorChartRow[],
  motorBRows: readonly MotorChartRow[],
  xKey: ComparisonXKey,
): ComparisonChartRow[] {
  const maxX = Math.max(
    motorARows.at(-1)?.[xKey] ?? 0,
    motorBRows.at(-1)?.[xKey] ?? 0,
  );
  if (maxX <= 0) return [];

  return Array.from({ length: COMPARISON_SAMPLE_COUNT + 1 }, (_, i) => {
    const x = (maxX * i) / COMPARISON_SAMPLE_COUNT;
    return {
      x,
      aCurrentDrawAmps: sampleAt(motorARows, xKey, 'currentDrawAmps', x),
      aTorqueNewtonMeters: sampleAt(motorARows, xKey, 'torqueNewtonMeters', x),
      aEfficiencyPercent: sampleAt(motorARows, xKey, 'efficiencyPercent', x),
      bCurrentDrawAmps: sampleAt(motorBRows, xKey, 'currentDrawAmps', x),
      bTorqueNewtonMeters: sampleAt(motorBRows, xKey, 'torqueNewtonMeters', x),
      bEfficiencyPercent: sampleAt(motorBRows, xKey, 'efficiencyPercent', x),
    };
  });
}
