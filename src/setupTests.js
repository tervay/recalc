// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";
// import "jest-canvas-mock";

jest.mock("./common/tooling/graph.js", () => ({
  Graph: () => null,
}));

import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";

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

function validateInstanceOf(obj, cls) {
  if (!(obj instanceof cls)) {
    return generateFailure(`Expected ${obj} to be an instanceof ${cls.name}`);
  } else {
    return generateSuccess(
      `Expected ${obj} not to be an instanceof ${cls.name}`
    );
  }
}

function validateMeasurementInstances(received, measurement) {
  const validateReceived = validateInstanceOf(received, Measurement);
  if (!validateReceived.pass) {
    return validateReceived;
  }

  const validateMeasurement = validateInstanceOf(measurement, Measurement);
  if (!validateMeasurement.pass) {
    return validateMeasurement;
  }

  if (received.kind() !== measurement.kind()) {
    return generateFailure(
      `Expected ${received.format()} to be the same units as ${measurement.format()}`
    );
  }

  return null;
}

function validateMotorInstance(received, motor) {
  const validateReceived = validateInstanceOf(received, Motor);
  if (!validateReceived.pass) {
    return validateReceived;
  }

  const validateMotor = validateInstanceOf(motor, Motor);
  if (!validateMotor.pass) {
    return validateMotor;
  }

  return null;
}

function validateRatioInstance(received, ratio) {
  const validateReceived = validateInstanceOf(received, Ratio);
  if (!validateReceived.pass) {
    return validateReceived;
  }

  const validateMotor = validateInstanceOf(ratio, Ratio);
  if (!validateMotor.pass) {
    return validateMotor;
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
  // https://github.com/facebook/jest/blob/395e93ec121a7a6e752a2e74e257ca507a684d1a/packages/expect/src/matchers.ts#L127-L196
  toBeCloseToMeasurement(received, measurement, precision = 2) {
    const validatedMeasurements = validateMeasurementInstances(
      received,
      measurement
    );
    if (validatedMeasurements !== null) {
      return validatedMeasurements;
    }

    received = received.to(measurement);

    return Math.pow(10, -precision) / 2 >
      Math.abs(measurement.scalar - received.scalar)
      ? generateSuccess(
          `Expected ${received.format()} not to be a Measurement close to ${measurement.format()}`
        )
      : generateFailure(
          `Expected ${received.format()} to be a Measurement close to ${measurement.format()}`
        );
  },
  toEqualMotor(received, motor) {
    const validatedMotors = validateMotorInstance(received, motor);
    if (validatedMotors !== null) {
      return validatedMotors;
    }

    return received.eq(motor)
      ? generateSuccess(
          `Expected ${received.toString()} not to be a Motor equal to ${motor.toString()}`
        )
      : generateFailure(
          `Expected ${received.toString()} to be a Motor equal to ${motor.toString()}`
        );
  },
  toEqualRatio(received, ratio) {
    const validatedRatios = validateRatioInstance(received, ratio);
    if (validatedRatios !== null) {
      return validatedRatios;
    }

    return received.eq(ratio)
      ? generateSuccess(
          `Expected ${received.toString()} not to be a Ratio equal to ${ratio.toString()}`
        )
      : generateFailure(
          `Expected ${received.toString()} to be a Ratio equal to ${ratio.toString()}`
        );
  },
});
