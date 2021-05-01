import Measurement from "common/models/Measurement";
import { BooleanParam, NumberParam, StringParam } from "serialize-query-params";

import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "../query-strings";

describe("Query strings", () => {
  describe("queryStringToDefaults", () => {
    test.each([
      {
        query: "?a=1&b=foo&c=0",
        queryParams: {
          a: NumberParam,
          b: StringParam,
          c: BooleanParam,
        },
        defaults: { a: 2, b: "bar", c: true },
        expected: { a: 1, b: "foo", c: false },
      },
      {
        query:
          '?pitch=%7B"s"%3A3%2C"u"%3A"mm"%7D&foo=%7B"s"%3A25%2C"u"%3A"kg"%7D',
        queryParams: {
          pitch: Measurement.getParam(),
          foo: Measurement.getParam(),
        },
        defaults: {
          pitch: new Measurement(15, "mm"),
          foo: new Measurement(5, "kg"),
        },
        expected: {
          pitch: expect.toEqualMeasurement(new Measurement(3, "mm")),
          foo: expect.toEqualMeasurement(new Measurement(25, "kg")),
        },
      },
    ])(
      "%p Works with no conversion function and everything provided",
      ({ query, queryParams, defaults, expected }) => {
        expect(
          queryStringToDefaults(query, queryParams, defaults)
        ).toMatchObject(expected);
      }
    );

    test.each([
      {
        query: "?a=1&b=foo&c=0",
        queryParams: {
          a: NumberParam,
          b: StringParam,
          c: BooleanParam,
          d: NumberParam,
          e: StringParam,
          f: BooleanParam,
        },
        defaults: { a: 2, b: "bar", c: true, d: 10, e: "baz", f: true },
        expected: { a: 1, b: "foo", c: false, d: 10, e: "baz", f: true },
      },
      {
        query:
          '?pitch=%7B"s"%3A3%2C"u"%3A"mm"%7D&foo=%7B"s"%3A25%2C"u"%3A"kg"%7D',
        queryParams: {
          pitch: Measurement.getParam(),
          foo: Measurement.getParam(),
          bar: Measurement.getParam(),
        },
        defaults: {
          pitch: new Measurement(15, "mm"),
          foo: new Measurement(5, "kg"),
          bar: new Measurement(12, "N"),
        },
        expected: {
          pitch: expect.toEqualMeasurement(new Measurement(3, "mm")),
          foo: expect.toEqualMeasurement(new Measurement(25, "kg")),
          bar: expect.toEqualMeasurement(new Measurement(12, "N")),
        },
      },
    ])(
      "%p Works with no conversion function and some things missing",
      ({ query, queryParams, defaults, expected }) => {
        expect(
          queryStringToDefaults(query, queryParams, defaults)
        ).toMatchObject(expected);
      }
    );

    test("Works with no conversion function and extra params provided", () => {
      const result = queryStringToDefaults(
        '?pitch=%7B"s"%3A3%2C"u"%3A"mm"%7D&foo=%7B"s"%3A25%2C"u"%3A"kg"%7D',
        {
          pitch: Measurement.getParam(),
        },
        {
          pitch: new Measurement(5, "mm"),
        }
      );

      expect(Object.keys(result)).toHaveLength(1);
      expect(result).toMatchObject({
        pitch: expect.toEqualMeasurement(new Measurement(3, "mm")),
      });
    });
  });

  describe("stateToQueryString", () => {
    test.each([
      {
        qphs: [
          new QueryableParamHolder({ foo: 2 }, NumberParam),
          new QueryableParamHolder({ bar: true }, BooleanParam),
          new QueryableParamHolder(
            { baz: new Measurement(5, "ft") },
            Measurement.getParam()
          ),
        ],
        expected: "bar=1&baz=%7B%22s%22%3A60%2C%22u%22%3A%22in%22%7D&foo=2",
      },
      {
        qphs: [
          new QueryableParamHolder(
            { foo: new Measurement(5, "N * m / s^2") },
            Measurement.getParam()
          ),
          new QueryableParamHolder({ bar: false }, BooleanParam),
        ],
        expected: "bar=0&foo=%7B%22s%22%3A5%2C%22u%22%3A%22N%2Am%2Fs2%22%7D",
      },
    ])("%p works", ({ qphs, expected }) => {
      expect(stateToQueryString(qphs)).toEqual(expected);
    });
  });
});
