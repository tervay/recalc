import {
  createParser,
  parseAsBoolean,
  parseAsFloat,
  parseAsString,
} from 'nuqs';
import * as z from 'zod';

import Measurement from '~/lib/models/Measurement';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import type { Bore, StageFamily } from '~/lib/types/common';
import { zStageFamilySchema } from '~/lib/types/common';

export const StringParam = parseAsString;

export const NumberParam = parseAsFloat;

export const BooleanParam = parseAsBoolean;

function parseMeasurement(value: string): Measurement | null {
  try {
    const { s, u } = JSON.parse(value);
    if (!Number.isFinite(s) || typeof u !== 'string') return null;
    return Measurement.fromDict({ s, u });
  } catch {
    return null;
  }
}

function serializeMeasurement(value: Measurement): string {
  return JSON.stringify(value.toDict());
}

export const MeasurementParam = Object.assign(
  createParser<Measurement>({
    parse: parseMeasurement,
    serialize: serializeMeasurement,
  }),
  {
    withDefault(defaultValue: Measurement) {
      return createParser<Measurement>({
        parse(value) {
          const parsed = parseMeasurement(value);
          return parsed?.isCompatible(defaultValue.units()) ? parsed : null;
        },
        serialize: serializeMeasurement,
      }).withDefault(defaultValue);
    },
  },
);

export const MotorParam = createParser<Motor>({
  parse(value) {
    try {
      const { name, quantity } = JSON.parse(value);
      if (typeof name !== 'string' || !Number.isFinite(quantity)) return null;
      return Motor.fromDict({ name, quantity });
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value.toDict());
  },
});

export const MotorNameParam = createParser<string>({
  parse(value) {
    return ALL_MOTORS.some((motor) => motor.name === value) ? value : null;
  },
  serialize(value) {
    return value;
  },
});

export const RatioParam = createParser<Ratio>({
  parse(value) {
    try {
      const { magnitude, ratioType } = JSON.parse(value);
      const parsedType = z.enum(RatioType).safeParse(ratioType);
      if (!Number.isFinite(magnitude) || !parsedType.success) return null;
      return Ratio.fromDict({ magnitude, ratioType: parsedType.data });
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

/**
 * Per-stage transmission-family constraints for the ratio finder, applied
 * positionally (index 0 = stage 1, index 1 = stage 2). Each inner array lists
 * the families allowed for that stage; an empty inner array means "any family".
 * The stage count is not encoded here -- it is still discovered automatically.
 */
const zStageConstraintsSchema = z.array(z.array(zStageFamilySchema));

export const StageConstraintListParam = createParser<StageFamily[][]>({
  parse(value) {
    try {
      const result = zStageConstraintsSchema.safeParse(JSON.parse(value));
      return result.success ? result.data : null;
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
