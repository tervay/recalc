import { describe, expect, it } from 'vitest';

import Measurement from '~/lib/models/Measurement';
import Model from '~/lib/models/Model';
import Motor, {
  ALL_MOTORS,
  IntendedProgram,
  type MotorSpecs,
  completeMotorSpecs,
  generateMotorCurves,
} from '~/lib/models/Motor';

describe('Motor', () => {
  describe('constructor', () => {
    it('handles zero quantity', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        0,
      );
      expect(motor.quantity).toBe(0);
    });

    it('handles negative quantity', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        -5,
      );
      expect(motor.quantity).toBe(-5);
    });

    it('calculates resistance correctly', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.resistance.scalar).toBeCloseTo(12 / 257, 5);
    });

    it('calculates kT correctly', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.kT.scalar).toBeCloseTo(4.69 / (257 - 1.5), 5);
    });

    it('calculates kV correctly', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      const resistance = motor.voltage.div(motor.stallCurrent);
      const expectedKV = motor.freeSpeed.div(
        motor.voltage.sub(resistance.mul(motor.freeCurrent)),
      );
      expect(motor.kV.scalar).toBeCloseTo(expectedKV.scalar, 3);
    });

    it('calculates kE as the supply voltage over the free speed', () => {
      const motor = Motor.KrakenX60(1);
      expect(motor.kE.to('V*s/rad').scalar).toBeCloseTo(0.0188939, 7);
    });

    it('throws when the stall current equals the free current', () => {
      expect(() => {
        new Motor(
          'Test Motor',
          new Measurement(6000, 'rpm'),
          new Measurement(4.69, 'N*m'),
          new Measurement(1.5, 'A'),
          new Measurement(1.5, 'A'),
          new Measurement(12, 'V'),
          1,
        );
      }).toThrow('Divide by zero');
    });

    it('throws error with zero stallCurrent (division by zero)', () => {
      expect(() => {
        new Motor(
          'Test Motor',
          new Measurement(6000, 'rpm'),
          new Measurement(4.69, 'N*m'),
          new Measurement(0, 'A'),
          new Measurement(1.5, 'A'),
          new Measurement(12, 'V'),
          1,
        );
      }).toThrow('Divide by zero');
    });

    it('throws error with zero voltage and non-zero stallCurrent', () => {
      expect(() => {
        new Motor(
          'Test Motor',
          new Measurement(6000, 'rpm'),
          new Measurement(4.69, 'N*m'),
          new Measurement(257, 'A'),
          new Measurement(1.5, 'A'),
          new Measurement(0, 'V'),
          1,
        );
      }).toThrow('Divide by zero');
    });

    it('handles very small stallCurrent', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(0.001, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.resistance.scalar).toBe(12000);
    });

    it('handles very large stallCurrent', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(1e6, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.resistance.scalar).toBeCloseTo(12 / 1e6, 10);
    });

    it('handles zero freeSpeed (division by zero in kV)', () => {
      expect(() => {
        new Motor(
          'Test Motor',
          new Measurement(0, 'rpm'),
          new Measurement(4.69, 'N*m'),
          new Measurement(257, 'A'),
          new Measurement(1.5, 'A'),
          new Measurement(12, 'V'),
          1,
        );
      }).toThrow('Divide by zero');
    });

    it('handles very small freeSpeed', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(0.001, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.kV.scalar).toBeGreaterThan(0);
    });

    it('handles very large freeSpeed', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(1e6, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.kV.scalar).toBeGreaterThan(0);
    });

    it('handles zero stallTorque', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(0, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.kT.scalar).toBe(0);
    });

    it('handles negative stallTorque', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(-4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.kT.scalar).toBeCloseTo(-4.69 / (257 - 1.5), 5);
    });

    it('handles zero freeCurrent', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(0, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.freeCurrent.scalar).toBe(0);
    });

    it('handles negative freeCurrent', () => {
      const motor = new Motor(
        'Test Motor',
        new Measurement(6000, 'rpm'),
        new Measurement(4.69, 'N*m'),
        new Measurement(257, 'A'),
        new Measurement(-1.5, 'A'),
        new Measurement(12, 'V'),
        1,
      );
      expect(motor.freeCurrent.scalar).toBe(-1.5);
    });
  });

  describe('fromSpecs', () => {
    it('creates motor from valid specs', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      const motor = Motor.fromSpecs(specs, 1);
      expect(motor.identifier).toBe('Test Motor');
      expect(motor.quantity).toBe(1);
    });

    it('handles zero quantity', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      const motor = Motor.fromSpecs(specs, 0);
      expect(motor.quantity).toBe(0);
    });

    it('handles negative quantity', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      const motor = Motor.fromSpecs(specs, -5);
      expect(motor.quantity).toBe(-5);
    });

    it('handles very large quantity', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      const motor = Motor.fromSpecs(specs, 1e6);
      expect(motor.quantity).toBe(1e6);
    });
  });

  describe('fromName', () => {
    it('creates motor from valid name', () => {
      const motor = Motor.fromName('Falcon 500', 1);
      expect(motor.identifier).toBe('Falcon 500');
      expect(motor.quantity).toBe(1);
    });

    it('handles zero quantity', () => {
      const motor = Motor.fromName('Falcon 500', 0);
      expect(motor.quantity).toBe(0);
    });

    it('throws error with invalid name', () => {
      expect(() => {
        Motor.fromName('Invalid Motor Name', 1);
      }).toThrow(TypeError);
    });

    it('handles empty string name', () => {
      expect(() => {
        Motor.fromName('', 1);
      }).toThrow(TypeError);
    });
  });

  describe('static factory methods', () => {
    it('KrakenX60sFOC creates correct motor', () => {
      const motor = Motor.KrakenX60sFOC(1);
      expect(motor.identifier).toBe('Kraken X60 (FOC)');
    });

    it('KrakenX60 creates correct motor', () => {
      const motor = Motor.KrakenX60(1);
      expect(motor.identifier).toBe('Kraken X60');
    });

    it('Falcon500 creates correct motor', () => {
      const motor = Motor.Falcon500(1);
      expect(motor.identifier).toBe('Falcon 500');
    });

    it('NEO creates correct motor', () => {
      const motor = Motor.NEO(1);
      expect(motor.identifier).toBe('NEO');
    });

    it('handles zero quantity in factory methods', () => {
      const motor = Motor.Falcon500(0);
      expect(motor.quantity).toBe(0);
    });

    it('handles negative quantity in factory methods', () => {
      const motor = Motor.Falcon500(-5);
      expect(motor.quantity).toBe(-5);
    });
  });

  describe('toDict', () => {
    it('returns correct dict structure', () => {
      const motor = Motor.Falcon500(1);
      const dict = motor.toDict();
      expect(dict.name).toBe('Falcon 500');
      expect(dict.quantity).toBe(1);
    });

    it('handles zero quantity', () => {
      const motor = Motor.Falcon500(0);
      const dict = motor.toDict();
      expect(dict.quantity).toBe(0);
    });

    it('handles negative quantity', () => {
      const motor = Motor.Falcon500(-5);
      const dict = motor.toDict();
      expect(dict.quantity).toBe(-5);
    });
  });

  describe('fromDict', () => {
    it('creates motor from valid dict', () => {
      const dict = { name: 'Falcon 500', quantity: 1 };
      const motor = Motor.fromDict(dict);
      expect(motor.identifier).toBe('Falcon 500');
      expect(motor.quantity).toBe(1);
    });

    it('handles zero quantity', () => {
      const dict = { name: 'Falcon 500', quantity: 0 };
      const motor = Motor.fromDict(dict);
      expect(motor.quantity).toBe(0);
    });

    it('handles negative quantity', () => {
      const dict = { name: 'Falcon 500', quantity: -5 };
      const motor = Motor.fromDict(dict);
      expect(motor.quantity).toBe(-5);
    });

    it('throws error with invalid name', () => {
      const dict = { name: 'Invalid Motor', quantity: 1 };
      expect(() => Motor.fromDict(dict)).toThrow(TypeError);
    });
  });

  describe('eq', () => {
    it('returns true for motors with same identifier', () => {
      const motor1 = Motor.Falcon500(1);
      const motor2 = Motor.Falcon500(2);
      expect(motor1.eq(motor2)).toBe(true);
    });

    it('returns false for motors with different identifiers', () => {
      const motor1 = Motor.Falcon500(1);
      const motor2 = Motor.NEO(1);
      expect(motor1.eq(motor2)).toBe(false);
    });

    it('returns false for different types', () => {
      const motor = Motor.Falcon500(1);
      const other = {} as Model;
      expect(motor.eq(other)).toBe(false);
    });
  });

  describe('completeMotorSpecs', () => {
    it('calculates complete specs correctly', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      const complete = completeMotorSpecs(specs);
      expect(complete.resistance.scalar).toBeCloseTo(12 / 257, 5);
      expect(complete.kT.scalar).toBeCloseTo(4.69 / (257 - 1.5), 5);
    });

    it('throws error with zero stallCurrent', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(0, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      expect(() => completeMotorSpecs(specs)).toThrow('Divide by zero');
    });

    it('throws error with zero voltage', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(0, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      expect(() => completeMotorSpecs(specs)).toThrow('Divide by zero');
    });

    it('handles zero stallTorque', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(0, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      const complete = completeMotorSpecs(specs);
      expect(complete.kT.scalar).toBe(0);
    });

    it('handles zero freeCurrent', () => {
      const specs: MotorSpecs = {
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(0, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      };
      const complete = completeMotorSpecs(specs);
      expect(complete.freeCurrent.scalar).toBe(0);
    });
  });

  describe('generateMotorCurves', () => {
    it('returns empty array with zero voltage', () => {
      const specs = completeMotorSpecs({
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      });
      const curves = generateMotorCurves(
        specs,
        new Measurement(60, 'A'),
        new Measurement(0, 'A'),
      );
      expect(curves).toEqual([]);
    });

    it('returns empty array with zero statorLimit', () => {
      const specs = completeMotorSpecs({
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      });
      const curves = generateMotorCurves(
        specs,
        new Measurement(0, 'A'),
        new Measurement(60, 'A'),
      );
      expect(curves).toEqual([]);
    });

    it('returns empty array with zero supplyLimit', () => {
      const specs = completeMotorSpecs({
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      });
      const curves = generateMotorCurves(
        specs,
        new Measurement(60, 'A'),
        new Measurement(0, 'A'),
      );
      expect(curves).toEqual([]);
    });

    it('generates curves with valid inputs', () => {
      const specs = completeMotorSpecs({
        name: 'Test Motor',
        freeSpeed: new Measurement(6000, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      });
      const curves = generateMotorCurves(
        specs,
        new Measurement(60, 'A'),
        new Measurement(60, 'A'),
      );
      expect(curves.length).toBeGreaterThan(0);
    });

    it('handles very small freeSpeed', () => {
      const specs = completeMotorSpecs({
        name: 'Test Motor',
        freeSpeed: new Measurement(10, 'rpm'),
        stallTorque: new Measurement(4.69, 'N*m'),
        stallCurrent: new Measurement(257, 'A'),
        freeCurrent: new Measurement(1.5, 'A'),
        voltage: new Measurement(12, 'V'),
        motorWeight: new Measurement(1, 'kg'),
        controllerWeight: new Measurement(1, 'kg'),
        type: 'Brushless',
        dataSource: 'Custom',
        vendors: ['Custom'],
        intendedProgram: IntendedProgram.OTHER,
      });
      const curves = generateMotorCurves(
        specs,
        new Measurement(60, 'A'),
        new Measurement(60, 'A'),
      );
      expect(curves.length).toBeGreaterThan(0);
    });
  });

  describe('ALL_MOTORS', () => {
    it('contains valid motor specs', () => {
      expect(ALL_MOTORS.length).toBeGreaterThan(0);
      ALL_MOTORS.forEach((motor) => {
        expect(motor.name).toBeTruthy();
        expect(motor.voltage.scalar).toBeGreaterThan(0);
        expect(motor.stallCurrent.scalar).toBeGreaterThan(0);
        expect(motor.freeSpeed.scalar).toBeGreaterThan(0);
      });
    });

    it('all motors can be created', () => {
      ALL_MOTORS.forEach((motorSpec) => {
        const motor = Motor.fromSpecs(motorSpec, 1);
        expect(motor.identifier).toBe(motorSpec.name);
      });
    });
  });

  describe('maxEfficiencyAtCurrentLimit', () => {
    it('places the efficiency peak at the geometric mean of free and stall current', () => {
      const motor = Motor.KrakenX60(1);
      expect(motor.peakEfficiencyCurrent.to('A').scalar).toBeCloseTo(32.55, 2);
    });

    it('returns the closed-form peak efficiency when the limit does not bind', () => {
      const motor = Motor.KrakenX60(1);
      expect(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(1000, 'A')),
      ).toBeCloseTo(0.856406, 5);
    });

    it('returns the closed-form peak efficiency for a brushed motor', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(1000, 'A')),
      ).toBeCloseTo(0.654334, 5);
    });

    it('plateaus above the peak current', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(1000, 'A')),
      ).toBeCloseTo(
        motor.maxEfficiencyAtCurrentLimit(motor.peakEfficiencyCurrent),
        10,
      );
    });

    it('evaluates efficiency at the limit when the limit binds', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(10, 'A')),
      ).toBeCloseTo(0.601515, 5);
    });

    it('is lower under a binding limit than under a non-binding one', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(10, 'A')),
      ).toBeLessThan(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(1000, 'A')),
      );
    });

    it('ignores quantity, reporting a per-motor figure', () => {
      expect(
        Motor.fromName('CIM', 4).maxEfficiencyAtCurrentLimit(
          new Measurement(1000, 'A'),
        ),
      ).toBe(
        Motor.fromName('CIM', 1).maxEfficiencyAtCurrentLimit(
          new Measurement(1000, 'A'),
        ),
      );
    });

    it('returns zero for a zero limit', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(motor.maxEfficiencyAtCurrentLimit(new Measurement(0, 'A'))).toBe(
        0,
      );
    });

    it('returns zero for a negative limit', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(motor.maxEfficiencyAtCurrentLimit(new Measurement(-5, 'A'))).toBe(
        0,
      );
    });

    it('returns zero when the limit equals the free current', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(motor.maxEfficiencyAtCurrentLimit(motor.freeCurrent)).toBe(0);
    });

    it('converts the limit before comparing, so unit choice does not matter', () => {
      const motor = Motor.fromName('CIM', 1);
      expect(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(10000, 'mA')),
      ).toBeCloseTo(0.601515, 5);
    });

    // An ideal motor with kT === kE peaks at (sqrt(Istall) - sqrt(Ifree)) /
    // (sqrt(Istall) + sqrt(Ifree)); a real one is that scaled by kT / kE.
    it.each<[string, number]>([
      ['Kraken X60', 1.0195],
      ['CIM', 0.8737],
    ])('scales the %s peak by kT / kE', (name, expectedRatio) => {
      const motor = Motor.fromName(name, 1);
      const stall = motor.stallCurrent.to('A').scalar;
      const free = motor.freeCurrent.to('A').scalar;
      const ideal =
        (Math.sqrt(stall) - Math.sqrt(free)) /
        (Math.sqrt(stall) + Math.sqrt(free));

      expect(
        motor.maxEfficiencyAtCurrentLimit(new Measurement(1000, 'A')) / ideal,
      ).toBeCloseTo(expectedRatio, 4);
    });

    it('stays below 100% for every motor in the library', () => {
      const overUnity = ALL_MOTORS.filter(
        (spec) =>
          Motor.fromSpecs(spec, 1).maxEfficiencyAtCurrentLimit(
            new Measurement(1000, 'A'),
          ) >= 1,
      ).map((spec) => spec.name);

      expect(overUnity).toEqual([]);
    });
  });
});
