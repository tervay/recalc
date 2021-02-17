// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";
import Measurement from "common/models/Measurement";

function generateFailure(msg) {
  return {
    pass: false,
    message: () => msg,
  };
}

function generateSuccess(msg) {
  return {
    pass: true,
    message: () => msg,
  };
}

function validateMeasurementInstances(received, measurement) {
  if (!(received instanceof Measurement)) {
    return generateFailure(
      `Expected ${received.toString()} to be an instanceof Measurement`
    );
  }
  if (!(measurement instanceof Measurement)) {
    return generateFailure(
      `Expected ${measurement.toString()} to be an instanceof Measurement`
    );
  }
  return null;
}

expect.extend({
  toEqualMeasurement(received, measurement) {
    const validatedMeasurements = validateMeasurementInstances(
      received,
      measurement
    );
    if (validatedMeasurements !== null) {
      return validatedMeasurements;
    }

    return received.eq(measurement)
      ? generateSuccess(
          `Expected ${received.format()} not to be a Measurement equal to ${measurement.format()}`
        )
      : generateFailure(
          `Expected ${received.format()} to be a Measurement equal to ${measurement.format()}`
        );
  },
  toBeGreaterThanMeasurement(received, measurement) {
    const validatedMeasurements = validateMeasurementInstances(
      received,
      measurement
    );
    if (validatedMeasurements !== null) {
      return validatedMeasurements;
    }

    return received.gt(measurement)
      ? generateSuccess(
          `Expected ${received.format()} not to be a Measurement greater than ${measurement.format()}`
        )
      : generateFailure(
          `Expected ${received.format()} to be a Measurement greater than ${measurement.format()}`
        );
  },
  toBeGreaterThanOrEqualMeasurement(received, measurement) {
    const validatedMeasurements = validateMeasurementInstances(
      received,
      measurement
    );
    if (validatedMeasurements !== null) {
      return validatedMeasurements;
    }

    return received.gte(measurement)
      ? generateSuccess(
          `Expected ${received.format()} not to be a Measurement greater than or equal to ${measurement.format()}`
        )
      : generateFailure(
          `Expected ${received.format()} to be a Measurement greater than or equal to ${measurement.format()}`
        );
  },
  toBeLessThanMeasurement(received, measurement) {
    const validatedMeasurements = validateMeasurementInstances(
      received,
      measurement
    );
    if (validatedMeasurements !== null) {
      return validatedMeasurements;
    }

    return received.lt(measurement)
      ? generateSuccess(
          `Expected ${received.format()} not to be a Measurement less than ${measurement.format()}`
        )
      : generateFailure(
          `Expected ${received.format()} to be a Measurement less than ${measurement.format()}`
        );
  },
  toBeLessThanOrEqualMeasurement(received, measurement) {
    const validatedMeasurements = validateMeasurementInstances(
      received,
      measurement
    );
    if (validatedMeasurements !== null) {
      return validatedMeasurements;
    }

    return received.lte(measurement)
      ? generateSuccess(
          `Expected ${received.format()} not to be a Measurement less than or equal to ${measurement.format()}`
        )
      : generateFailure(
          `Expected ${received.format()} to be a Measurement less than or equal to ${measurement.format()}`
        );
  },
});
