import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";

import {
  fixFloatingPoint,
  getDate,
  isLocalhost,
  objectify,
  unobjectify,
  uuid,
} from "../util";

describe("util", () => {
  test.each([
    ["localhost", true],
    ["0.0.0.0", true],
    ["127.0.0.1", true],
    ["[::1]", true],
    ["", true],
    ["example.com", false],
    ["example.local", true],
    ["example", false],
  ])("%p isLocalHost", (host, expected) => {
    delete global.window.location;
    global.window = Object.create(window);
    global.window.location = {
      href: `http://${host}/`,
      origin: `http://${host}`,
      protocol: `http`,
      host: host,
      hostname: host,
      pathname: "/",
    };

    expect(isLocalhost()).toBe(expected);
  });

  test("getDate", () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(1997, 5 - 1, 20, 3, 40, 27, 91));

    expect(getDate()).toEqual("1997-05-20T07:40:27.091Z");

    jest.useRealTimers();
  });

  test("uuid returns non-repeating numbers", () => {
    let uuids = Array.from(Array(1000)).map((_) => uuid());
    const isArrayUnique = (arr) =>
      Array.isArray(arr) && new Set(arr).size === arr.length;

    expect(isArrayUnique([1, 2, 3])).toBeTruthy();
    expect(isArrayUnique([1, 1, 2])).toBeFalsy();
    expect(isArrayUnique([])).toBeTruthy();

    expect(uuids).toHaveLength(1000);
    expect(isArrayUnique(uuids)).toBeTruthy();
  });

  test.each([
    [{ foo: "bar" }, { foo: "bar" }],
    [
      [1, 2, 3],
      [1, 2, 3],
    ],
    [
      [
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ],
      [
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ],
    ],
    [
      [{ m: [new Measurement(1, "in")] }],
      [{ m: [{ constructorId: 2, s: 1, u: "in" }] }],
    ],
    [
      { m: new Measurement(5, "in") },
      {
        m: {
          constructorId: 2,
          s: 5,
          u: "in",
        },
      },
    ],
    [
      { foo: { a: new Ratio(3) } },
      {
        foo: {
          a: {
            constructorId: 1,
            magnitude: 3,
            ratioType: Ratio.REDUCTION,
          },
        },
      },
    ],
    [
      {
        foo: {
          bar: {
            motor: Motor.Falcon500s(3),
          },
          inner: 1,
        },
        outer: new Measurement(12, "psi"),
      },
      {
        foo: {
          bar: {
            motor: {
              constructorId: 0,
              name: "Falcon 500",
              quantity: 3,
            },
          },
          inner: 1,
        },
        outer: {
          constructorId: 2,
          s: 12,
          u: "psi",
        },
      },
    ],
  ])("%p objectify", (obj, expected) => {
    expect(objectify(obj)).toMatchObject(expected);
  });

  test.each([
    [{ foo: "bar" }, { foo: "bar" }],
    [
      {
        m: {
          constructorId: 2,
          s: 5,
          u: "in",
        },
      },
      {
        m: expect.toEqualMeasurement(new Measurement(5, "in")),
      },
    ],
    [
      {
        foo: {
          a: {
            constructorId: 1,
            magnitude: 3,
            ratioType: Ratio.REDUCTION,
          },
        },
      },
      {
        foo: {
          a: expect.toEqualRatio(new Ratio(3)),
        },
      },
    ],
    [
      {
        foo: {
          bar: {
            motor: {
              constructorId: 0,
              name: "Falcon 500",
              quantity: 3,
            },
          },
          inner: 1,
        },
        outer: {
          constructorId: 2,
          s: 12,
          u: "psi",
        },
      },
      {
        foo: {
          bar: {
            motor: expect.toEqualMotor(Motor.Falcon500s(3)),
          },
          inner: 1,
        },
        outer: expect.toEqualMeasurement(new Measurement(12, "psi")),
      },
    ],
    [
      [{ m: [{ constructorId: 2, s: 1, u: "in" }] }],
      [{ m: [expect.toEqualMeasurement(new Measurement(1, "in"))] }],
    ],
  ])("%p unobjectify", (obj, expected) => {
    expect(unobjectify(obj)).toMatchObject(expected);
  });

  test.each([
    {
      n: 0.020000000000000004,
      expected: 0.02,
    },
    {
      n: 3.000000000000000001,
      expected: 3,
    },
    {
      n: 5,
      expected: 5,
    },
    {
      n: 6.125,
      expected: 6.125,
    },
  ])("%p fixFloatingPoint", ({ n, expected }) => {
    expect(fixFloatingPoint(n)).toEqual(expected);
  });
});
