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
  describe('serialize', () => {
    it('encodes a simple string', () => {
      expect(StringParam.serialize('hello')).toBe('hello');
    });

    it('encodes an empty string', () => {
      expect(StringParam.serialize('')).toBe('');
    });

    it('encodes a string with special characters', () => {
      expect(StringParam.serialize('hello world')).toBe('hello world');
      expect(StringParam.serialize('test&value=123')).toBe('test&value=123');
    });

    it('encodes unicode characters', () => {
      expect(StringParam.serialize('测试')).toBe('测试');
      expect(StringParam.serialize('🚀')).toBe('🚀');
    });
  });

  describe('parse', () => {
    it('decodes a simple string', () => {
      expect(StringParam.parse('hello')).toBe('hello');
    });

    it('decodes an empty string', () => {
      expect(StringParam.parse('')).toBe('');
    });

    it('decodes a string with special characters', () => {
      expect(StringParam.parse('hello world')).toBe('hello world');
      expect(StringParam.parse('test&value=123')).toBe('test&value=123');
    });

    it('decodes unicode characters', () => {
      expect(StringParam.parse('测试')).toBe('测试');
      expect(StringParam.parse('🚀')).toBe('🚀');
    });
  });

  describe('round-trip', () => {
    it('preserves value through serialize/parse', () => {
      const value = 'test string';
      expect(StringParam.parse(StringParam.serialize(value))).toBe(value);
    });
  });
});

describe('NumberParam', () => {
  describe('serialize', () => {
    it('encodes a positive integer', () => {
      expect(NumberParam.serialize(42)).toBe('42');
    });

    it('encodes a negative integer', () => {
      expect(NumberParam.serialize(-42)).toBe('-42');
    });

    it('encodes zero', () => {
      expect(NumberParam.serialize(0)).toBe('0');
    });

    it('encodes a positive decimal', () => {
      expect(NumberParam.serialize(3.14)).toBe('3.14');
    });

    it('encodes a negative decimal', () => {
      expect(NumberParam.serialize(-3.14)).toBe('-3.14');
    });

    it('encodes very large numbers', () => {
      expect(NumberParam.serialize(1e10)).toBe('10000000000');
    });

    it('encodes very small numbers', () => {
      expect(NumberParam.serialize(1e-10)).toBe('1e-10');
    });
  });

  describe('parse', () => {
    it('decodes a positive integer', () => {
      expect(NumberParam.parse('42')).toBe(42);
    });

    it('decodes a negative integer', () => {
      expect(NumberParam.parse('-42')).toBe(-42);
    });

    it('decodes zero', () => {
      expect(NumberParam.parse('0')).toBe(0);
    });

    it('decodes a positive decimal', () => {
      expect(NumberParam.parse('3.14')).toBe(3.14);
    });

    it('decodes a negative decimal', () => {
      expect(NumberParam.parse('-3.14')).toBe(-3.14);
    });

    it('decodes scientific notation', () => {
      expect(NumberParam.parse('1e10')).toBe(1e10);
      expect(NumberParam.parse('1e-10')).toBe(1e-10);
    });

    it('returns null for invalid string', () => {
      expect(NumberParam.parse('not a number')).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('preserves integer through serialize/parse', () => {
      const value = 42;
      expect(NumberParam.parse(NumberParam.serialize(value))).toBe(value);
    });

    it('preserves decimal through serialize/parse', () => {
      const value = 3.14;
      expect(NumberParam.parse(NumberParam.serialize(value))).toBe(value);
    });
  });
});

describe('BooleanParam', () => {
  describe('serialize', () => {
    it('encodes true', () => {
      expect(BooleanParam.serialize(true)).toBe('true');
    });

    it('encodes false', () => {
      expect(BooleanParam.serialize(false)).toBe('false');
    });
  });

  describe('parse', () => {
    it('decodes "true" string as true', () => {
      expect(BooleanParam.parse('true')).toBe(true);
    });

    it('decodes "false" string as false', () => {
      expect(BooleanParam.parse('false')).toBe(false);
    });

    it('treats non-"true" values as false (nuqs parseAsBoolean behavior)', () => {
      expect(BooleanParam.parse('1')).toBe(false);
      expect(BooleanParam.parse('yes')).toBe(false);
      expect(BooleanParam.parse('anything')).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('preserves true through serialize/parse', () => {
      expect(BooleanParam.parse(BooleanParam.serialize(true))).toBe(true);
    });

    it('preserves false through serialize/parse', () => {
      expect(BooleanParam.parse(BooleanParam.serialize(false))).toBe(false);
    });
  });
});

describe('MeasurementParam', () => {
  describe('serialize', () => {
    it('encodes a valid measurement as JSON', () => {
      const measurement = new Measurement(12, 'V');
      expect(MeasurementParam.serialize(measurement)).toBe('{"s":12,"u":"V"}');
    });

    it('encodes a measurement with decimal value', () => {
      const measurement = new Measurement(3.14, 'm');
      expect(MeasurementParam.serialize(measurement)).toBe(
        '{"s":3.14,"u":"m"}',
      );
    });

    it('encodes a measurement with negative value', () => {
      const measurement = new Measurement(-5, 'A');
      expect(MeasurementParam.serialize(measurement)).toBe('{"s":-5,"u":"A"}');
    });
  });

  describe('parse', () => {
    it('decodes a valid JSON measurement string', () => {
      const decoded = MeasurementParam.parse('{"s":12,"u":"V"}');
      expect(decoded?.scalar).toBe(12);
      expect(decoded?.units()).toBe('V');
    });

    it('decodes a measurement with decimal value', () => {
      const decoded = MeasurementParam.parse('{"s":3.14,"u":"m"}');
      expect(decoded?.scalar).toBe(3.14);
      expect(decoded?.units()).toBe('m');
    });

    it('decodes a measurement with negative value', () => {
      const decoded = MeasurementParam.parse('{"s":-5,"u":"A"}');
      expect(decoded?.scalar).toBe(-5);
      expect(decoded?.units()).toBe('A');
    });

    it('returns null when missing scalar', () => {
      expect(MeasurementParam.parse('{"u":"V"}')).toBeNull();
    });

    it('returns null when missing unit', () => {
      expect(MeasurementParam.parse('{"s":12}')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(MeasurementParam.parse('not json')).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('preserves measurement through serialize/parse', () => {
      const measurement = new Measurement(12, 'V');
      const decoded = MeasurementParam.parse(
        MeasurementParam.serialize(measurement),
      );
      expect(decoded?.scalar).toBe(measurement.scalar);
      expect(decoded?.units()).toBe(measurement.units());
    });

    it('preserves decimal measurement through serialize/parse', () => {
      const measurement = new Measurement(3.14, 'm');
      const decoded = MeasurementParam.parse(
        MeasurementParam.serialize(measurement),
      );
      expect(decoded?.scalar).toBe(measurement.scalar);
      expect(decoded?.units()).toBe(measurement.units());
    });
  });
});

describe('MotorParam', () => {
  describe('serialize', () => {
    it('encodes a motor as JSON', () => {
      const motor = Motor.KrakenX60(2);
      expect(MotorParam.serialize(motor)).toBe(
        '{"name":"Kraken X60","quantity":2}',
      );
    });

    it('encodes a motor with quantity 1', () => {
      const motor = Motor.Falcon500(1);
      expect(MotorParam.serialize(motor)).toBe(
        '{"name":"Falcon 500","quantity":1}',
      );
    });

    it('encodes a motor with large quantity', () => {
      const motor = Motor.NEO(10);
      expect(MotorParam.serialize(motor)).toBe('{"name":"NEO","quantity":10}');
    });
  });

  describe('parse', () => {
    it('decodes a motor from JSON', () => {
      const decoded = MotorParam.parse('{"name":"Kraken X60","quantity":2}');
      expect(decoded?.identifier).toBe('Kraken X60');
      expect(decoded?.quantity).toBe(2);
    });

    it('decodes a motor with spaces in name', () => {
      const decoded = MotorParam.parse('{"name":"Falcon 500","quantity":1}');
      expect(decoded?.identifier).toBe('Falcon 500');
      expect(decoded?.quantity).toBe(1);
    });

    it('decodes a motor with large quantity', () => {
      const decoded = MotorParam.parse('{"name":"NEO","quantity":10}');
      expect(decoded?.identifier).toBe('NEO');
      expect(decoded?.quantity).toBe(10);
    });

    it('returns null for missing quantity', () => {
      expect(MotorParam.parse('{"name":"Kraken X60"}')).toBeNull();
    });

    it('returns null for invalid motor name', () => {
      expect(
        MotorParam.parse('{"name":"InvalidMotor","quantity":1}'),
      ).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(MotorParam.parse('not json')).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('preserves motor with quantity through serialize/parse', () => {
      const motor = Motor.KrakenX60(2);
      const decoded = MotorParam.parse(MotorParam.serialize(motor));
      expect(decoded?.identifier).toBe(motor.identifier);
      expect(decoded?.quantity).toBe(motor.quantity);
    });

    it('preserves motor with quantity 1 through serialize/parse', () => {
      const motor = Motor.Falcon500(1);
      const decoded = MotorParam.parse(MotorParam.serialize(motor));
      expect(decoded?.identifier).toBe(motor.identifier);
      expect(decoded?.quantity).toBe(motor.quantity);
    });

    it('preserves motor with large quantity through serialize/parse', () => {
      const motor = Motor.NEO(10);
      const decoded = MotorParam.parse(MotorParam.serialize(motor));
      expect(decoded?.identifier).toBe(motor.identifier);
      expect(decoded?.quantity).toBe(motor.quantity);
    });
  });
});

describe('RatioParam', () => {
  describe('serialize', () => {
    it('encodes a reduction ratio as JSON', () => {
      const ratio = new Ratio(2, RatioType.REDUCTION);
      expect(RatioParam.serialize(ratio)).toBe(
        '{"magnitude":2,"ratioType":"Reduction"}',
      );
    });

    it('encodes a step-up ratio as JSON', () => {
      const ratio = new Ratio(0.5, RatioType.STEP_UP);
      expect(RatioParam.serialize(ratio)).toBe(
        '{"magnitude":0.5,"ratioType":"Step-up"}',
      );
    });

    it('encodes a ratio with decimal magnitude', () => {
      const ratio = new Ratio(3.14, RatioType.REDUCTION);
      expect(RatioParam.serialize(ratio)).toBe(
        '{"magnitude":3.14,"ratioType":"Reduction"}',
      );
    });
  });

  describe('parse', () => {
    it('decodes a reduction ratio from JSON', () => {
      const decoded = RatioParam.parse(
        '{"magnitude":2,"ratioType":"Reduction"}',
      );
      expect(decoded?.magnitude).toBe(2);
      expect(decoded?.ratioType).toBe(RatioType.REDUCTION);
    });

    it('decodes a step-up ratio from JSON', () => {
      const decoded = RatioParam.parse(
        '{"magnitude":0.5,"ratioType":"Step-up"}',
      );
      expect(decoded?.magnitude).toBe(0.5);
      expect(decoded?.ratioType).toBe(RatioType.STEP_UP);
    });

    it('decodes a ratio with decimal magnitude', () => {
      const decoded = RatioParam.parse(
        '{"magnitude":3.14,"ratioType":"Reduction"}',
      );
      expect(decoded?.magnitude).toBe(3.14);
      expect(decoded?.ratioType).toBe(RatioType.REDUCTION);
    });

    it('returns null for missing magnitude', () => {
      expect(RatioParam.parse('{"ratioType":"Reduction"}')).toBeNull();
    });

    it('returns null for missing ratioType', () => {
      expect(RatioParam.parse('{"magnitude":2}')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(RatioParam.parse('not json')).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('preserves reduction ratio through serialize/parse', () => {
      const ratio = new Ratio(2, RatioType.REDUCTION);
      const decoded = RatioParam.parse(RatioParam.serialize(ratio));
      expect(decoded?.magnitude).toBe(ratio.magnitude);
      expect(decoded?.ratioType).toBe(ratio.ratioType);
    });

    it('preserves step-up ratio through serialize/parse', () => {
      const ratio = new Ratio(0.5, RatioType.STEP_UP);
      const decoded = RatioParam.parse(RatioParam.serialize(ratio));
      expect(decoded?.magnitude).toBe(ratio.magnitude);
      expect(decoded?.ratioType).toBe(ratio.ratioType);
    });
  });
});

describe('RatioPairListParam', () => {
  describe('serialize', () => {
    it('encodes an empty array', () => {
      const value: [number, number][] = [];
      const encoded = RatioPairListParam.serialize(value);
      expect(encoded).toBe('[]');
    });

    it('encodes a single pair', () => {
      const value: [number, number][] = [[1, 2]];
      const encoded = RatioPairListParam.serialize(value);
      expect(encoded).toBe('[[1,2]]');
    });

    it('encodes multiple pairs', () => {
      const value: [number, number][] = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const encoded = RatioPairListParam.serialize(value);
      expect(encoded).toBe('[[1,2],[3,4],[5,6]]');
    });

    it('encodes pairs with decimal values', () => {
      const value: [number, number][] = [
        [1.5, 2.5],
        [3.14, 4.2],
      ];
      const encoded = RatioPairListParam.serialize(value);
      expect(encoded).toBe('[[1.5,2.5],[3.14,4.2]]');
    });

    it('encodes pairs with negative values', () => {
      const value: [number, number][] = [[-1, 2]];
      const encoded = RatioPairListParam.serialize(value);
      expect(encoded).toBe('[[-1,2]]');
    });
  });

  describe('parse', () => {
    it('decodes an empty array', () => {
      expect(RatioPairListParam.parse('[]')).toEqual([]);
    });

    it('decodes a single pair', () => {
      expect(RatioPairListParam.parse('[[1,2]]')).toEqual([[1, 2]]);
    });

    it('decodes multiple pairs', () => {
      expect(RatioPairListParam.parse('[[1,2],[3,4],[5,6]]')).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('decodes pairs with decimal values', () => {
      expect(RatioPairListParam.parse('[[1.5,2.5],[3.14,4.2]]')).toEqual([
        [1.5, 2.5],
        [3.14, 4.2],
      ]);
    });

    it('decodes pairs with negative values', () => {
      expect(RatioPairListParam.parse('[[-1,2]]')).toEqual([[-1, 2]]);
    });

    it('returns null for invalid JSON', () => {
      expect(RatioPairListParam.parse('not valid json')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(RatioPairListParam.parse('')).toBeNull();
    });

    it('returns null for non-array JSON', () => {
      expect(RatioPairListParam.parse('{"not": "an array"}')).toBeNull();
    });

    it('returns null for null JSON', () => {
      expect(RatioPairListParam.parse('null')).toBeNull();
    });

    it('returns null for number', () => {
      expect(RatioPairListParam.parse('42')).toBeNull();
    });

    it('returns null for string JSON', () => {
      expect(RatioPairListParam.parse('"not an array"')).toBeNull();
    });

    it('returns null for malformed array (not pairs)', () => {
      expect(RatioPairListParam.parse('[[1,2,3]]')).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('preserves empty array through serialize/parse', () => {
      const value: [number, number][] = [];
      expect(
        RatioPairListParam.parse(RatioPairListParam.serialize(value)),
      ).toEqual(value);
    });

    it('preserves single pair through serialize/parse', () => {
      const value: [number, number][] = [[1, 2]];
      expect(
        RatioPairListParam.parse(RatioPairListParam.serialize(value)),
      ).toEqual(value);
    });

    it('preserves multiple pairs through serialize/parse', () => {
      const value: [number, number][] = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      expect(
        RatioPairListParam.parse(RatioPairListParam.serialize(value)),
      ).toEqual(value);
    });

    it('preserves decimal pairs through serialize/parse', () => {
      const value: [number, number][] = [
        [1.5, 2.5],
        [3.14, 4.2],
      ];
      expect(
        RatioPairListParam.parse(RatioPairListParam.serialize(value)),
      ).toEqual(value);
    });
  });
});
