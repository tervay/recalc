import Measurement from "common/models/Measurement";
import "vitest";

interface CustomMatchers<CustomMatcherResult = any> {
  toEqualMeasurement(expected: Measurement): CustomMatcherResult;
  toBeCloseToMeasurement(
    expected: Measurement,
    precision: number = 2,
  ): CustomMatcherResult;
  toBeLessThanMeasurement(expected: Measurement): CustomMatcherResult;
  toBeLessThanOrEqualToMeasurement(expected: Measurement): CustomMatcherResult;
  toBeGreaterThanMeasurement(expected: Measurement): CustomMatcherResult;
  toBeGreaterThanOrEqualToMeasurement(
    expected: Measurement,
  ): CustomMatcherResult;
  toEqualModel<M extends Model>(expected: M): CustomMatcherResult;
  toAllBeVisible(): CustomMatcherResult;
  toAllBeEnabled(): CustomMatcherResult;
  toAllBeDisabled(): CustomMatcherResult;
  toHaveValues<Map extends IdToElementMap>(expected: {
    [k in keyof Map]: number;
  }): CustomMatcherResult;
  toAllHaveValue(expected: number): CustomMatcherResult;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
