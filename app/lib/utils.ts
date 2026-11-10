export const SNAPSHOT_PRECISION = 5;

const FLOAT_NOISE = 1e-9;

export function snapToInteger(value: number): number {
  const nearest = Math.round(value);
  return Math.abs(value - nearest) < FLOAT_NOISE ? nearest : value;
}

export function roundToNearestMultiple(
  roundable: number,
  multipleOf: number,
): number {
  return Math.ceil(snapToInteger(roundable / multipleOf)) * multipleOf;
}

export function range(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function toFixed(
  n: number,
  precision: number = SNAPSHOT_PRECISION,
): number {
  return parseFloat(n.toFixed(precision));
}
