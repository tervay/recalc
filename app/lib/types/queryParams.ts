import queryString from 'query-string';

import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';

export interface DefaultAndQueryParamProvider<T> {
  queryParam: QueryParam<T>;
  defaultValue: T;
}

export function withDefault<T>(
  param: QueryParam<T>,
  defaultValue: T,
): DefaultAndQueryParamProvider<T> {
  return {
    queryParam: param,
    defaultValue,
  };
}

export interface QueryParam<T> {
  encode: (value: T) => string;
  decode: (value: string) => T;
}

export const StringParam: QueryParam<string> = {
  encode: (value) => value,
  decode: (value) => value,
};

export const NumberParam: QueryParam<number> = {
  encode: (value) => value.toString(),
  decode: (value) => Number(value),
};

export const BooleanParam: QueryParam<boolean> = {
  encode: (value) => value.toString(),
  decode: (value) => value === 'true',
};

export const MeasurementParam: QueryParam<Measurement> = {
  encode: (value) => queryString.stringify(value.toDict()),
  decode: (value) => {
    const parsed = queryString.parse(value);

    if ('s' in parsed && 'u' in parsed) {
      return Measurement.fromDict({
        s: Number(parsed.s),
        u: parsed.u as string,
      });
    }

    throw new Error('Invalid measurement');
  },
};

export const MotorParam: QueryParam<Motor> = {
  encode: (value) => queryString.stringify(value.toDict()),
  decode: (value) => {
    const parsed = queryString.parse(value);
    return Motor.fromDict({
      name: parsed.name as string,
      quantity: Number(parsed.quantity),
    });
  },
};

export const RatioParam: QueryParam<Ratio> = {
  encode: (value) => queryString.stringify(value.toDict()),
  decode: (value) => {
    const parsed = queryString.parse(value);
    return Ratio.fromDict({
      magnitude: Number(parsed.magnitude),
      ratioType: parsed.ratioType as RatioType,
    });
  },
};

export type RatioPair = [number, number];

export const RatioPairListParam: QueryParam<RatioPair[]> = {
  encode: (value) => JSON.stringify(value),
  decode: (value) => {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as RatioPair[];
      }
      return [[1, 1]];
    } catch {
      return [[1, 1]];
    }
  },
};
