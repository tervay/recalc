import {
  createParser,
  parseAsBoolean,
  parseAsFloat,
  parseAsString,
} from 'nuqs';

import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import type { Bore } from '~/lib/types/common';

export const StringParam = parseAsString;

export const NumberParam = parseAsFloat;

export const BooleanParam = parseAsBoolean;

export const MeasurementParam = createParser<Measurement>({
  parse(value) {
    try {
      const { s, u } = JSON.parse(value);
      if (typeof s !== 'number' || typeof u !== 'string') return null;
      return Measurement.fromDict({ s, u });
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value.toDict());
  },
});

export const MotorParam = createParser<Motor>({
  parse(value) {
    try {
      const { name, quantity } = JSON.parse(value);
      if (typeof name !== 'string' || typeof quantity !== 'number') return null;
      return Motor.fromDict({ name, quantity });
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value.toDict());
  },
});

export const RatioParam = createParser<Ratio>({
  parse(value) {
    try {
      const { magnitude, ratioType } = JSON.parse(value);
      if (typeof magnitude !== 'number' || typeof ratioType !== 'string')
        return null;
      return Ratio.fromDict({ magnitude, ratioType: ratioType as RatioType });
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value.toDict());
  },
});

export type RatioPair = [number, number];

export const RatioPairListParam = createParser<RatioPair[]>({
  parse(value) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (item): item is RatioPair =>
            Array.isArray(item) &&
            item.length === 2 &&
            typeof item[0] === 'number' &&
            typeof item[1] === 'number',
        )
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value);
  },
});

export const BoreParam = createParser<Bore>({
  parse(value) {
    return value as Bore;
  },
  serialize(value) {
    return value;
  },
});
