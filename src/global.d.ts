/* eslint-disable @typescript-eslint/no-explicit-any */
import Measurement from "common/models/Measurement";
import { IdToElementMap } from "testing/calculatorMatchers";

declare module "*.scss" {
  const content: { [className: string]: string };
  export = content;
}

declare module "*.css" {
  const content: { [className: string]: string };
  export = content;
}

declare module "*.md" {
  const content: any;
  export default content;
}

declare module "raw-loader!*" {
  const content: string;
  export default content;
}

type FlattenedPromise<T> = unknown extends T
  ? Promise<T>
  : T extends Promise<infer _U>
  ? T
  : Promise<T>;

type AnyFunction = (...args: any[]) => any;
type Async<F extends AnyFunction> = (
  ...args: Parameters<F>
) => FlattenedPromise<ReturnType<F>>;
export type Workerized<T> = Worker & {
  [K in keyof T]: T[K] extends AnyFunction ? Async<T[K]> : never;
};
declare module "workerize-loader!*" {
  export function createInstance<T>(): Workerized<T>;
  export = createInstance;
}

declare global {
  namespace jest {
    interface Matchers {
      toEqualMeasurement(expected: Measurement): CustomMatcherResult;
      toBeCloseToMeasurement(
        expected: Measurement,
        precision: number = 2
      ): CustomMatcherResult;
      toBeLessThanMeasurement(expected: Measurement): CustomMatcherResult;
      toBeLessThanOrEqualToMeasurement(
        expected: Measurement
      ): CustomMatcherResult;
      toBeGreaterThanMeasurement(expected: Measurement): CustomMatcherResult;
      toBeGreaterThanOrEqualToMeasurement(
        expected: Measurement
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
  }
}
