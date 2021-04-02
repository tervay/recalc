import Measurement from "common/models/Measurement";
import { BooleanParam, NumberParam, StringParam } from "serialize-query-params";
import { queryStringToDefaults } from "../query-strings";

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
    "Works with no conversion function and everything provided",
    ({ query, queryParams, defaults, expected }) => {
      expect(queryStringToDefaults(query, queryParams, defaults)).toMatchObject(
        expected
      );
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
    "Works with no conversion function and some things missing",
    ({ query, queryParams, defaults, expected }) => {
      expect(queryStringToDefaults(query, queryParams, defaults)).toMatchObject(
        expected
      );
    }
  );
});
