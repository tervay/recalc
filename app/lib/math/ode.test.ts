import { describe, expect, it } from 'vitest';

import ODESolver, {
  type ODEFunction,
  type StoppingInfo,
  solveMotorODE,
} from '~/lib/math/ode';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';

describe('ODESolver', () => {
  describe('euler', () => {
    it('solves simple ODE correctly', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 1);

      const result = solver.euler(10);

      expect(result).toMatchSnapshot();
    });

    it('handles zero resolution', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 1);

      const result = solver.euler(0);

      expect(result).toMatchSnapshot();
    });

    it('handles zero time range', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 0);

      const result = solver.euler(10);

      expect(result).toMatchSnapshot();
    });

    it('handles multiple state variables', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[1], -y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1, 0], 0, 1);

      const result = solver.euler(10);

      expect(result).toMatchSnapshot();
    });

    it('handles zero initial conditions', () => {
      const ode: ODEFunction = (_t, _y) => ({
        changeRates: [1],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [0], 0, 1);

      const result = solver.euler(10);

      expect(result).toMatchSnapshot();
    });
  });

  describe('rk4', () => {
    it('solves simple ODE correctly', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 1);

      const result = solver.rk4(10);

      expect(result).toMatchSnapshot();
    });

    it('handles zero resolution', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 1);

      const result = solver.rk4(0);

      expect(result).toMatchSnapshot();
    });

    it('handles shouldStop condition', () => {
      let stopCount = 0;
      const ode: ODEFunction = (_t, y) => {
        stopCount++;
        return {
          changeRates: [y[0]],
          shouldStop: stopCount > 5,
        };
      };
      const solver = new ODESolver(ode, [1], 0, 1);

      const result = solver.rk4(100);

      expect(result).toMatchSnapshot();
    });

    it('handles NaN in y0', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [NaN], 0, 1);

      const result = solver.rk4(10);

      expect(result).toMatchSnapshot();
    });

    it('handles zero time range', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 0);

      const result = solver.rk4(10);

      expect(result).toMatchSnapshot();
    });

    it('handles multiple state variables', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[1], -y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1, 0], 0, 1);

      const result = solver.rk4(10);

      expect(result).toMatchSnapshot();
    });
  });

  describe('midpoint', () => {
    it('solves simple ODE correctly', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 1);

      const result = solver.midpoint(10);

      expect(result).toMatchSnapshot();
    });

    it('handles zero resolution', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 1);

      const result = solver.midpoint(0);

      expect(result).toMatchSnapshot();
    });

    it('handles zero time range', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1], 0, 0);

      const result = solver.midpoint(10);

      expect(result).toMatchSnapshot();
    });

    it('handles multiple state variables', () => {
      const ode: ODEFunction = (_t, y) => ({
        changeRates: [y[1], -y[0]],
        shouldStop: false,
      });
      const solver = new ODESolver(ode, [1, 0], 0, 1);

      const result = solver.midpoint(10);

      expect(result).toMatchSnapshot();
    });
  });
});

describe.concurrent('solveMotorODE', () => {
  it('solves motor ODE correctly', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const supplyLimit = new Measurement(100, 'A');
    const statorLimit = new Measurement(60, 'A');
    const shouldStop = (info: StoppingInfo) => info.stepNumber > 100;
    const J = new Measurement(0.01, 'kg*m^2');
    const antiTorque = new Measurement(0, 'N*m');
    const efficiency = 90;

    const result = solveMotorODE(
      motor,
      statorVoltage,
      supplyVoltage,
      supplyLimit,
      statorLimit,
      shouldStop,
      J,
      antiTorque,
      efficiency,
    );

    expect(result).toMatchSnapshot();
  }, 10000);

  it('handles zero motor quantity', () => {
    const motor = Motor.KrakenX60sFOC(0);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const supplyLimit = new Measurement(100, 'A');
    const statorLimit = new Measurement(60, 'A');
    const shouldStop = (info: StoppingInfo) => info.stepNumber > 100;
    const J = new Measurement(0.01, 'kg*m^2');
    const antiTorque = new Measurement(0, 'N*m');
    const efficiency = 90;

    const result = solveMotorODE(
      motor,
      statorVoltage,
      supplyVoltage,
      supplyLimit,
      statorLimit,
      shouldStop,
      J,
      antiTorque,
      efficiency,
    );

    expect(result).toMatchSnapshot();
  }, 10000);

  it('handles zero efficiency', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const supplyLimit = new Measurement(100, 'A');
    const statorLimit = new Measurement(60, 'A');
    const shouldStop = (info: StoppingInfo) => info.stepNumber > 100;
    const J = new Measurement(0.01, 'kg*m^2');
    const antiTorque = new Measurement(0, 'N*m');
    const efficiency = 0;

    const result = solveMotorODE(
      motor,
      statorVoltage,
      supplyVoltage,
      supplyLimit,
      statorLimit,
      shouldStop,
      J,
      antiTorque,
      efficiency,
    );

    expect(result).toMatchSnapshot();
  }, 10000);

  it('handles zero J', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const supplyLimit = new Measurement(100, 'A');
    const statorLimit = new Measurement(60, 'A');
    const shouldStop = (info: StoppingInfo) => info.stepNumber > 100;
    const J = new Measurement(0, 'kg*m^2');
    const antiTorque = new Measurement(0, 'N*m');
    const efficiency = 90;

    const result = solveMotorODE(
      motor,
      statorVoltage,
      supplyVoltage,
      supplyLimit,
      statorLimit,
      shouldStop,
      J,
      antiTorque,
      efficiency,
    );

    expect(result).toMatchSnapshot();
  }, 10000);

  it('handles stopping condition', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const supplyLimit = new Measurement(100, 'A');
    const statorLimit = new Measurement(60, 'A');
    let callCount = 0;
    const shouldStop = () => {
      callCount++;
      return callCount > 10;
    };
    const J = new Measurement(0.01, 'kg*m^2');
    const antiTorque = new Measurement(0, 'N*m');
    const efficiency = 90;

    const result = solveMotorODE(
      motor,
      statorVoltage,
      supplyVoltage,
      supplyLimit,
      statorLimit,
      shouldStop,
      J,
      antiTorque,
      efficiency,
    );

    expect(result).toMatchSnapshot();
  });

  it('handles zero voltage', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(0, 'V');
    const supplyVoltage = new Measurement(0, 'V');
    const supplyLimit = new Measurement(100, 'A');
    const statorLimit = new Measurement(60, 'A');
    const shouldStop = () => false;
    const J = new Measurement(0.01, 'kg*m^2');
    const antiTorque = new Measurement(0, 'N*m');
    const efficiency = 90;

    expect(() => {
      solveMotorODE(
        motor,
        statorVoltage,
        supplyVoltage,
        supplyLimit,
        statorLimit,
        shouldStop,
        J,
        antiTorque,
        efficiency,
      );
    }).toThrow();
  }, 10000);

  it('handles non-zero antiTorque', () => {
    const motor = Motor.KrakenX60sFOC(1);
    const statorVoltage = new Measurement(12, 'V');
    const supplyVoltage = new Measurement(12, 'V');
    const supplyLimit = new Measurement(100, 'A');
    const statorLimit = new Measurement(60, 'A');
    const shouldStop = (info: StoppingInfo) => info.stepNumber > 100;
    const J = new Measurement(0.01, 'kg*m^2');
    const antiTorque = new Measurement(1, 'N*m');
    const efficiency = 90;

    const result = solveMotorODE(
      motor,
      statorVoltage,
      supplyVoltage,
      supplyLimit,
      statorLimit,
      shouldStop,
      J,
      antiTorque,
      efficiency,
    );

    expect(result).toMatchSnapshot();
  }, 10000);
});
