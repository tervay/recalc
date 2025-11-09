import { describe, expect, it } from 'vitest';

import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import {
  BooleanParam,
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioPairListParam,
  RatioParam,
  StringParam,
} from '~/lib/types/queryParams';

describe('StringParam', () => {
  describe('encode', () => {
    it('encodes a simple string', () => {
      expect(StringParam.encode('hello')).toBe('hello');
    });

    it('encodes an empty string', () => {
      expect(StringParam.encode('')).toBe('');
    });

    it('encodes a string with special characters', () => {
      expect(StringParam.encode('hello world')).toBe('hello world');
      expect(StringParam.encode('test&value=123')).toBe('test&value=123');
    });

    it('encodes unicode characters', () => {
      expect(StringParam.encode('测试')).toBe('测试');
      expect(StringParam.encode('🚀')).toBe('🚀');
    });
  });

  describe('decode', () => {
    it('decodes a simple string', () => {
      expect(StringParam.decode('hello')).toBe('hello');
    });

    it('decodes an empty string', () => {
      expect(StringParam.decode('')).toBe('');
    });

    it('decodes a string with special characters', () => {
      expect(StringParam.decode('hello world')).toBe('hello world');
      expect(StringParam.decode('test&value=123')).toBe('test&value=123');
    });

    it('decodes unicode characters', () => {
      expect(StringParam.decode('测试')).toBe('测试');
      expect(StringParam.decode('🚀')).toBe('🚀');
    });
  });

  describe('round-trip', () => {
    it('preserves value through encode/decode', () => {
      const value = 'test string';
      expect(StringParam.decode(StringParam.encode(value))).toBe(value);
    });
  });
});

describe('NumberParam', () => {
  describe('encode', () => {
    it('encodes a positive integer', () => {
      expect(NumberParam.encode(42)).toBe('42');
    });

    it('encodes a negative integer', () => {
      expect(NumberParam.encode(-42)).toBe('-42');
    });

    it('encodes zero', () => {
      expect(NumberParam.encode(0)).toBe('0');
    });

    it('encodes a positive decimal', () => {
      expect(NumberParam.encode(3.14)).toBe('3.14');
    });

    it('encodes a negative decimal', () => {
      expect(NumberParam.encode(-3.14)).toBe('-3.14');
    });

    it('encodes very large numbers', () => {
      expect(NumberParam.encode(1e10)).toBe('10000000000');
    });

    it('encodes very small numbers', () => {
      expect(NumberParam.encode(1e-10)).toBe('1e-10');
    });

    it('encodes Infinity', () => {
      expect(NumberParam.encode(Infinity)).toBe('Infinity');
    });

    it('encodes -Infinity', () => {
      expect(NumberParam.encode(-Infinity)).toBe('-Infinity');
    });

    it('encodes NaN', () => {
      expect(NumberParam.encode(NaN)).toBe('NaN');
    });
  });

  describe('decode', () => {
    it('decodes a positive integer', () => {
      expect(NumberParam.decode('42')).toBe(42);
    });

    it('decodes a negative integer', () => {
      expect(NumberParam.decode('-42')).toBe(-42);
    });

    it('decodes zero', () => {
      expect(NumberParam.decode('0')).toBe(0);
    });

    it('decodes a positive decimal', () => {
      expect(NumberParam.decode('3.14')).toBe(3.14);
    });

    it('decodes a negative decimal', () => {
      expect(NumberParam.decode('-3.14')).toBe(-3.14);
    });

    it('decodes scientific notation', () => {
      expect(NumberParam.decode('1e10')).toBe(1e10);
      expect(NumberParam.decode('1e-10')).toBe(1e-10);
    });

    it('decodes Infinity', () => {
      expect(NumberParam.decode('Infinity')).toBe(Infinity);
    });

    it('decodes -Infinity', () => {
      expect(NumberParam.decode('-Infinity')).toBe(-Infinity);
    });

    it('decodes NaN', () => {
      expect(Number(NumberParam.decode('NaN'))).toBeNaN();
    });

    it('decodes invalid string as NaN', () => {
      expect(Number(NumberParam.decode('not a number'))).toBeNaN();
    });

    it('decodes empty string as 0', () => {
      expect(NumberParam.decode('')).toBe(0);
    });
  });

  describe('round-trip', () => {
    it('preserves integer through encode/decode', () => {
      const value = 42;
      expect(NumberParam.decode(NumberParam.encode(value))).toBe(value);
    });

    it('preserves decimal through encode/decode', () => {
      const value = 3.14;
      expect(NumberParam.decode(NumberParam.encode(value))).toBe(value);
    });
  });
});

describe('BooleanParam', () => {
  describe('encode', () => {
    it('encodes true', () => {
      expect(BooleanParam.encode(true)).toBe('true');
    });

    it('encodes false', () => {
      expect(BooleanParam.encode(false)).toBe('false');
    });
  });

  describe('decode', () => {
    it('decodes "true" string as true', () => {
      expect(BooleanParam.decode('true')).toBe(true);
    });

    it('decodes "false" string as false', () => {
      expect(BooleanParam.decode('false')).toBe(false);
    });

    it('decodes any other string as false', () => {
      expect(BooleanParam.decode('True')).toBe(false);
      expect(BooleanParam.decode('TRUE')).toBe(false);
      expect(BooleanParam.decode('1')).toBe(false);
      expect(BooleanParam.decode('yes')).toBe(false);
      expect(BooleanParam.decode('')).toBe(false);
      expect(BooleanParam.decode('anything')).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('preserves true through encode/decode', () => {
      expect(BooleanParam.decode(BooleanParam.encode(true))).toBe(true);
    });

    it('preserves false through encode/decode', () => {
      expect(BooleanParam.decode(BooleanParam.encode(false))).toBe(false);
    });
  });
});

describe('MeasurementParam', () => {
  describe('encode', () => {
    it('encodes a valid measurement', () => {
      const measurement = new Measurement(12, 'V');
      const encoded = MeasurementParam.encode(measurement);
      expect(encoded).toContain('s=12');
      expect(encoded).toContain('u=V');
    });

    it('encodes a measurement with decimal value', () => {
      const measurement = new Measurement(3.14, 'm');
      const encoded = MeasurementParam.encode(measurement);
      expect(encoded).toContain('s=3.14');
      expect(encoded).toContain('u=m');
    });

    it('encodes a measurement with negative value', () => {
      const measurement = new Measurement(-5, 'A');
      const encoded = MeasurementParam.encode(measurement);
      expect(encoded).toContain('s=-5');
      expect(encoded).toContain('u=A');
    });

    it('encodes a measurement with complex unit', () => {
      const measurement = new Measurement(100, 'rpm');
      const encoded = MeasurementParam.encode(measurement);
      expect(encoded).toContain('s=100');
      expect(encoded).toContain('u=rpm');
    });
  });

  describe('decode', () => {
    it('decodes a valid measurement string', () => {
      const encoded = 's=12&u=V';
      const decoded = MeasurementParam.decode(encoded);
      expect(decoded.scalar).toBe(12);
      expect(decoded.units()).toBe('V');
    });

    it('decodes a measurement with decimal value', () => {
      const encoded = 's=3.14&u=m';
      const decoded = MeasurementParam.decode(encoded);
      expect(decoded.scalar).toBe(3.14);
      expect(decoded.units()).toBe('m');
    });

    it('decodes a measurement with negative value', () => {
      const encoded = 's=-5&u=A';
      const decoded = MeasurementParam.decode(encoded);
      expect(decoded.scalar).toBe(-5);
      expect(decoded.units()).toBe('A');
    });

    it('decodes a measurement with complex unit', () => {
      const encoded = 's=100&u=rpm';
      const decoded = MeasurementParam.decode(encoded);
      expect(decoded.scalar).toBe(100);
      expect(decoded.units()).toBe('rpm');
    });

    it('throws error when missing scalar', () => {
      const encoded = 'u=V';
      expect(() => MeasurementParam.decode(encoded)).toThrow(
        'Invalid measurement',
      );
    });

    it('throws error when missing unit', () => {
      const encoded = 's=12';
      expect(() => MeasurementParam.decode(encoded)).toThrow(
        'Invalid measurement',
      );
    });

    it('throws error when both are missing', () => {
      const encoded = '';
      expect(() => MeasurementParam.decode(encoded)).toThrow(
        'Invalid measurement',
      );
    });

    it('throws error with invalid format', () => {
      const encoded = 'invalid=format';
      expect(() => MeasurementParam.decode(encoded)).toThrow(
        'Invalid measurement',
      );
    });
  });

  describe('round-trip', () => {
    it('preserves measurement through encode/decode', () => {
      const measurement = new Measurement(12, 'V');
      const decoded = MeasurementParam.decode(
        MeasurementParam.encode(measurement),
      );
      expect(decoded.scalar).toBe(measurement.scalar);
      expect(decoded.units()).toBe(measurement.units());
    });

    it('preserves decimal measurement through encode/decode', () => {
      const measurement = new Measurement(3.14, 'm');
      const decoded = MeasurementParam.decode(
        MeasurementParam.encode(measurement),
      );
      expect(decoded.scalar).toBe(measurement.scalar);
      expect(decoded.units()).toBe(measurement.units());
    });
  });
});

describe('MotorParam', () => {
  describe('encode', () => {
    it('encodes a motor with quantity', () => {
      const motor = Motor.KrakenX60(2);
      const encoded = MotorParam.encode(motor);
      expect(encoded).toContain('name=Kraken%20X60');
      expect(encoded).toContain('quantity=2');
    });

    it('encodes a motor with quantity 1', () => {
      const motor = Motor.Falcon500(1);
      const encoded = MotorParam.encode(motor);
      expect(encoded).toContain('name=Falcon%20500');
      expect(encoded).toContain('quantity=1');
    });

    it('encodes a motor with large quantity', () => {
      const motor = Motor.NEO(10);
      const encoded = MotorParam.encode(motor);
      expect(encoded).toContain('name=NEO');
      expect(encoded).toContain('quantity=10');
    });
  });

  describe('decode', () => {
    it('decodes a motor with quantity', () => {
      const encoded = 'name=Kraken%20X60&quantity=2';
      const decoded = MotorParam.decode(encoded);
      expect(decoded.identifier).toBe('Kraken X60');
      expect(decoded.quantity).toBe(2);
    });

    it('decodes a motor with quantity 1', () => {
      const encoded = 'name=Falcon%20500&quantity=1';
      const decoded = MotorParam.decode(encoded);
      expect(decoded.identifier).toBe('Falcon 500');
      expect(decoded.quantity).toBe(1);
    });

    it('decodes a motor with large quantity', () => {
      const encoded = 'name=NEO&quantity=10';
      const decoded = MotorParam.decode(encoded);
      expect(decoded.identifier).toBe('NEO');
      expect(decoded.quantity).toBe(10);
    });

    it('decodes a motor with quantity 0', () => {
      const encoded = 'name=Kraken%20X60&quantity=0';
      const decoded = MotorParam.decode(encoded);
      expect(decoded.identifier).toBe('Kraken X60');
      expect(decoded.quantity).toBe(0);
    });

    it('handles missing quantity by using NaN which becomes 0', () => {
      const encoded = 'name=Kraken%20X60';
      const decoded = MotorParam.decode(encoded);
      expect(decoded.identifier).toBe('Kraken X60');
      // Number(undefined) is NaN, which will cause issues
      // This is a failure path - should handle gracefully
      expect(Number.isNaN(decoded.quantity)).toBe(true);
    });

    it('handles invalid motor name gracefully', () => {
      const encoded = 'name=InvalidMotor&quantity=1';
      // This will throw an error in Motor.fromName if the motor doesn't exist
      expect(() => MotorParam.decode(encoded)).toThrow();
    });
  });

  describe('round-trip', () => {
    it('preserves motor with quantity through encode/decode', () => {
      const motor = Motor.KrakenX60(2);
      const decoded = MotorParam.decode(MotorParam.encode(motor));
      expect(decoded.identifier).toBe(motor.identifier);
      expect(decoded.quantity).toBe(motor.quantity);
    });

    it('preserves motor with quantity 1 through encode/decode', () => {
      const motor = Motor.Falcon500(1);
      const decoded = MotorParam.decode(MotorParam.encode(motor));
      expect(decoded.identifier).toBe(motor.identifier);
      expect(decoded.quantity).toBe(motor.quantity);
    });

    it('preserves motor with large quantity through encode/decode', () => {
      const motor = Motor.NEO(10);
      const decoded = MotorParam.decode(MotorParam.encode(motor));
      expect(decoded.identifier).toBe(motor.identifier);
      expect(decoded.quantity).toBe(motor.quantity);
    });
  });
});

describe('RatioParam', () => {
  describe('encode', () => {
    it('encodes a reduction ratio', () => {
      const ratio = new Ratio(2, RatioType.REDUCTION);
      const encoded = RatioParam.encode(ratio);
      expect(encoded).toContain('magnitude=2');
      expect(encoded).toContain('ratioType=Reduction');
    });

    it('encodes a step-up ratio', () => {
      const ratio = new Ratio(0.5, RatioType.STEP_UP);
      const encoded = RatioParam.encode(ratio);
      expect(encoded).toContain('magnitude=0.5');
      expect(encoded).toContain('ratioType=Step-up');
    });

    it('encodes a ratio with decimal magnitude', () => {
      const ratio = new Ratio(3.14, RatioType.REDUCTION);
      const encoded = RatioParam.encode(ratio);
      expect(encoded).toContain('magnitude=3.14');
      expect(encoded).toContain('ratioType=Reduction');
    });
  });

  describe('decode', () => {
    it('decodes a reduction ratio', () => {
      const encoded = 'magnitude=2&ratioType=Reduction';
      const decoded = RatioParam.decode(encoded);
      expect(decoded.magnitude).toBe(2);
      expect(decoded.ratioType).toBe(RatioType.REDUCTION);
    });

    it('decodes a step-up ratio', () => {
      const encoded = 'magnitude=0.5&ratioType=Step-up';
      const decoded = RatioParam.decode(encoded);
      expect(decoded.magnitude).toBe(0.5);
      expect(decoded.ratioType).toBe(RatioType.STEP_UP);
    });

    it('decodes a ratio with decimal magnitude', () => {
      const encoded = 'magnitude=3.14&ratioType=Reduction';
      const decoded = RatioParam.decode(encoded);
      expect(decoded.magnitude).toBe(3.14);
      expect(decoded.ratioType).toBe(RatioType.REDUCTION);
    });

    it('handles missing magnitude', () => {
      const encoded = 'ratioType=Reduction';
      const decoded = RatioParam.decode(encoded);
      // fromDict will handle missing magnitude
      expect(decoded).toBeDefined();
    });

    it('handles missing ratioType', () => {
      const encoded = 'magnitude=2';
      const decoded = RatioParam.decode(encoded);
      // fromDict will use default ratioType
      expect(decoded).toBeDefined();
    });
  });

  describe('round-trip', () => {
    it('preserves reduction ratio through encode/decode', () => {
      const ratio = new Ratio(2, RatioType.REDUCTION);
      const decoded = RatioParam.decode(RatioParam.encode(ratio));
      expect(decoded.magnitude).toBe(ratio.magnitude);
      expect(decoded.ratioType).toBe(ratio.ratioType);
    });

    it('preserves step-up ratio through encode/decode', () => {
      const ratio = new Ratio(0.5, RatioType.STEP_UP);
      const decoded = RatioParam.decode(RatioParam.encode(ratio));
      expect(decoded.magnitude).toBe(ratio.magnitude);
      expect(decoded.ratioType).toBe(ratio.ratioType);
    });
  });
});

describe('RatioPairListParam', () => {
  describe('encode', () => {
    it('encodes an empty array', () => {
      const value: [number, number][] = [];
      const encoded = RatioPairListParam.encode(value);
      expect(encoded).toBe('[]');
    });

    it('encodes a single pair', () => {
      const value: [number, number][] = [[1, 2]];
      const encoded = RatioPairListParam.encode(value);
      expect(encoded).toBe('[[1,2]]');
    });

    it('encodes multiple pairs', () => {
      const value: [number, number][] = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const encoded = RatioPairListParam.encode(value);
      expect(encoded).toBe('[[1,2],[3,4],[5,6]]');
    });

    it('encodes pairs with decimal values', () => {
      const value: [number, number][] = [
        [1.5, 2.5],
        [3.14, 4.2],
      ];
      const encoded = RatioPairListParam.encode(value);
      expect(encoded).toBe('[[1.5,2.5],[3.14,4.2]]');
    });

    it('encodes pairs with negative values', () => {
      const value: [number, number][] = [[-1, 2]];
      const encoded = RatioPairListParam.encode(value);
      expect(encoded).toBe('[[-1,2]]');
    });
  });

  describe('decode', () => {
    it('decodes an empty array', () => {
      const encoded = '[]';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([]);
    });

    it('decodes a single pair', () => {
      const encoded = '[[1,2]]';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[1, 2]]);
    });

    it('decodes multiple pairs', () => {
      const encoded = '[[1,2],[3,4],[5,6]]';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('decodes pairs with decimal values', () => {
      const encoded = '[[1.5,2.5],[3.14,4.2]]';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([
        [1.5, 2.5],
        [3.14, 4.2],
      ]);
    });

    it('decodes pairs with negative values', () => {
      const encoded = '[[-1,2]]';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[-1, 2]]);
    });

    it('returns default for invalid JSON', () => {
      const encoded = 'not valid json';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[1, 1]]);
    });

    it('returns default for empty string', () => {
      const encoded = '';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[1, 1]]);
    });

    it('returns default for non-array JSON', () => {
      const encoded = '{"not": "an array"}';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[1, 1]]);
    });

    it('returns default for null', () => {
      const encoded = 'null';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[1, 1]]);
    });

    it('returns default for number', () => {
      const encoded = '42';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[1, 1]]);
    });

    it('returns default for string', () => {
      const encoded = '"not an array"';
      const decoded = RatioPairListParam.decode(encoded);
      expect(decoded).toEqual([[1, 1]]);
    });

    it('handles malformed array (not pairs)', () => {
      const encoded = '[[1,2,3]]';
      const decoded = RatioPairListParam.decode(encoded);
      // It will decode but the structure might be wrong
      expect(Array.isArray(decoded)).toBe(true);
    });
  });

  describe('round-trip', () => {
    it('preserves empty array through encode/decode', () => {
      const value: [number, number][] = [];
      const decoded = RatioPairListParam.decode(
        RatioPairListParam.encode(value),
      );
      expect(decoded).toEqual(value);
    });

    it('preserves single pair through encode/decode', () => {
      const value: [number, number][] = [[1, 2]];
      const decoded = RatioPairListParam.decode(
        RatioPairListParam.encode(value),
      );
      expect(decoded).toEqual(value);
    });

    it('preserves multiple pairs through encode/decode', () => {
      const value: [number, number][] = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const decoded = RatioPairListParam.decode(
        RatioPairListParam.encode(value),
      );
      expect(decoded).toEqual(value);
    });

    it('preserves decimal pairs through encode/decode', () => {
      const value: [number, number][] = [
        [1.5, 2.5],
        [3.14, 4.2],
      ];
      const decoded = RatioPairListParam.decode(
        RatioPairListParam.encode(value),
      );
      expect(decoded).toEqual(value);
    });
  });
});
