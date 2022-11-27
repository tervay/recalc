import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import calcMatchers from "testing/calculatorMatchers";
import { expect } from "vitest";

const _oldLog = console.debug;
console.debug = (...msg) => {
  if (!msg[0].includes("Debug(2)")) {
    _oldLog(...msg);
  }
};

export interface Result {
  pass: boolean;
  message: () => string;
}

function fail(message: string): Result {
  return {
    pass: false,
    message: () => message,
  };
}

function pass(message: string): Result {
  return {
    pass: true,
    message: () => message,
  };
}

function messageForMeasurements(
  m1: Measurement,
  m2: Measurement,
  pass: boolean,
  status: string
): string {
  return pass
    ? `${m1.format()} is ${status} ${m2.format()}`
    : `${m1.format()} is not ${status} ${m2.format()}`;
}

function messageForModelEquality<T extends Model>(
  m1: T,
  m2: T,
  pass: boolean
): string {
  return pass
    ? `${JSON.stringify(m1.toDict())} is equal to ${JSON.stringify(
        m2.toDict()
      )}`
    : `${JSON.stringify(m1.toDict())} is not equal to ${JSON.stringify(
        m2.toDict()
      )}`;
}

function passOrFailOnMeasurementStatus(
  fn: (a: Measurement, b: Measurement) => boolean,
  a: Measurement,
  b: Measurement,
  status: string
): Result {
  return fn(a, b)
    ? pass(messageForMeasurements(a, b, true, status))
    : fail(messageForMeasurements(a, b, false, status));
}

function passOrFailOnModelsEqual<T extends Model>(
  fn: (a: T, b: T) => boolean,
  a: T,
  b: T
): Result {
  return fn(a, b)
    ? pass(messageForModelEquality(a, b, true))
    : fail(messageForModelEquality(a, b, false));
}

expect.extend({
  ...{
    toEqualMeasurement(
      received: Measurement,
      measurement: Measurement
    ): Result {
      return passOrFailOnMeasurementStatus(
        (a, b) => a.eq(b),
        received,
        measurement,
        "equal to"
      );
    },
    toBeCloseToMeasurement(
      received: Measurement,
      measurement: Measurement,
      precision = 2
    ): Result {
      return passOrFailOnMeasurementStatus(
        (a, b) => Math.pow(10, -precision) / 2 > Math.abs(a.scalar - b.scalar),
        received.to(measurement.units()),
        measurement,
        "close to"
      );
    },
    toBeLessThanMeasurement(
      received: Measurement,
      measurement: Measurement
    ): Result {
      return passOrFailOnMeasurementStatus(
        (a, b) => a.lt(b),
        received,
        measurement,
        "less than"
      );
    },
    toBeLessThanOrEqualToMeasurement(
      received: Measurement,
      measurement: Measurement
    ): Result {
      return passOrFailOnMeasurementStatus(
        (a, b) => a.lte(b),
        received,
        measurement,
        "less than or equal to"
      );
    },
    toBeGreaterThanMeasurement(
      received: Measurement,
      measurement: Measurement
    ): Result {
      return passOrFailOnMeasurementStatus(
        (a, b) => a.gt(b),
        received,
        measurement,
        "greater than"
      );
    },
    toBeGreaterThanOrEqualToMeasurement(
      received: Measurement,
      measurement: Measurement
    ): Result {
      return passOrFailOnMeasurementStatus(
        (a, b) => a.gte(b),
        received,
        measurement,
        "greater than or equal to"
      );
    },
    toEqualModel<M extends Model>(received: M, model: M): Result {
      return passOrFailOnModelsEqual((a, b) => a.eq(b), received, model);
    },
  },
  ...calcMatchers,
});
