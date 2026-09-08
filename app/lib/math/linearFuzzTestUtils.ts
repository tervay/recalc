import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

/**
 * The linear calculator fuzz suites deliberately use a fixed matrix instead
 * of runtime randomness. A failing case can therefore be copied directly
 * into a focused test, and snapshots remain stable in CI.
 */
export const LINEAR_FUZZ_NUMBERS = [
  0, 1e-9, 0.001, 0.1, 0.5, 1, 2, 5, 10, 40, 100, 1_000,
] as const;

export const LINEAR_FUZZ_MOTORS = [
  ['kraken-x60-foc-1', Motor.KrakenX60sFOC(1)],
  ['kraken-x60-2', Motor.KrakenX60(2)],
  ['neo-1', Motor.NEO(1)],
] as const satisfies readonly [string, Motor][];

export function reduction(value: number): Ratio {
  return new Ratio(value, RatioType.REDUCTION);
}

export function measurement(value: number, units: string): Measurement {
  return new Measurement(value, units);
}

export function asDict(value: number, units: string): MeasurementDict {
  return measurement(value, units).toDict();
}

export function snapshotNumber(
  value: number,
  significantDigits = 7,
): number | string {
  if (Number.isNaN(value)) return '<NaN>';
  if (value === Number.POSITIVE_INFINITY) return '<Infinity>';
  if (value === Number.NEGATIVE_INFINITY) return '<-Infinity>';
  if (Object.is(value, -0)) return 0;
  return Number(value.toPrecision(significantDigits));
}

export function snapshotMeasurement(
  value: Measurement,
  units: string,
  significantDigits = 7,
): number | string {
  return snapshotNumber(value.to(units).scalar, significantDigits);
}

export function expectFiniteNumbers(values: readonly number[]): void {
  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new Error(`Expected a finite number, received ${String(value)}`);
    }
  }
}

export function expectNonNegativeNumbers(values: readonly number[]): void {
  expectFiniteNumbers(values);
  for (const value of values) {
    if (value < 0) {
      throw new Error(`Expected a non-negative number, received ${value}`);
    }
  }
}

type CartesianValues<Sets extends readonly (readonly unknown[])[]> = {
  [Key in keyof Sets]: Sets[Key] extends readonly (infer Value)[]
    ? Value
    : never;
};

export function cartesian<const Sets extends readonly (readonly unknown[])[]>(
  ...sets: Sets
): CartesianValues<Sets>[] {
  const products = sets.reduce<unknown[][]>(
    (products, set) =>
      products.flatMap((prefix) => set.map((value) => [...prefix, value])),
    [[]],
  );
  return products as CartesianValues<Sets>[];
}

export function measurementSummary(
  value: Measurement,
  units: string,
): { value: number | string; units: string } {
  return { value: snapshotMeasurement(value, units), units };
}

export function sampleForSnapshot<T>(
  values: readonly T[],
  maxSamples = 64,
): T[] {
  if (values.length <= maxSamples) return [...values];

  const stride = Math.ceil(values.length / maxSamples);
  return values.filter(
    (_, index) => index % stride === 0 || index === values.length - 1,
  );
}
