import Measurement from "common/models/Measurement";
import Qty from "js-quantities";

describe("Measurement", () => {
  test("Constructor accepts magnitude and units", () => {
    const m = new Measurement(1, "lbs");
    expect(m.units()).toEqual("lbs");
    expect(m.scalar).toEqual(1);
  });

  test.each([
    [
      [5, "milliOhm"],
      [0.005, "Ohm"],
    ],
    [
      [3, "min"],
      [180, "s"],
    ],
    [
      [1, "kg"],
      [2.204, "lbs"],
    ],
    [
      [14, "oz"],
      [0.875, "lbs"],
    ],
    [
      [5, "m"],
      [196.85, "in"],
    ],
    [
      [30, "rad/s"],
      [286.48, "rpm"],
    ],
    [
      [15, "N m"],
      [15, "J"],
    ],
    [
      [200, "C / s"],
      [200, "A"],
    ],
    [
      [100, "W / V"],
      [100, "A"],
    ],
    [
      [25, "A Ohm"],
      [25, "V"],
    ],
    [
      [10, "A V"],
      [10, "W"],
    ],
    [
      [5, "atm"],
      [73.48, "psi"],
    ],
    [
      [10, "lb / m3"],
      [0.004536, "g/cm3"],
    ],
    [
      [10, "m^2"],
      [15500.03, "in2"],
    ],
  ])(
    "%p Simplify returns simplified jsQty",
    ([complexMagnitude, complexUnits], [simpleMagnitude, simpleUnits]) => {
      const complexMeasurement = new Qty(complexMagnitude, complexUnits);
      const simplified = Measurement.simplify(complexMeasurement);

      expect(simplified.units()).toEqual(simpleUnits);
      expect(simplified.scalar).toBeCloseTo(simpleMagnitude);
    }
  );

  describe("Math functions map to inner Qty functions", () => {
    test("Has math functions with non-empty functions", () => {
      const m = new Measurement(1, "in");
      const regex = /\(\) => \{\}/;
      expect(m).toMatchObject({
        add: expect.not.stringMatching(regex),
        sub: expect.not.stringMatching(regex),
        mul: expect.not.stringMatching(regex),
        div: expect.not.stringMatching(regex),
        eq: expect.not.stringMatching(regex),
        lt: expect.not.stringMatching(regex),
        lte: expect.not.stringMatching(regex),
        gt: expect.not.stringMatching(regex),
        gte: expect.not.stringMatching(regex),
      });
    });

    test.each([
      [
        new Measurement(1, "in"),
        new Measurement(3, "in"),
        new Measurement(4, "in"),
      ],
      [
        new Measurement(3, "oz"),
        new Measurement(10, "kg"),
        new Measurement(22.23, "lb"),
      ],
    ])("%p Add", (a, b, result) => {
      expect(a.add(b)).toBeCloseToMeasurement(result);
    });

    test.each([
      [
        new Measurement(5, "kg"),
        new Measurement(2, "kg"),
        new Measurement(3, "kg"),
      ],
      [
        new Measurement(15, "J"),
        new Measurement(8, "N m"),
        new Measurement(7, "J"),
      ],
    ])("%p Sub", (a, b, result) => {
      expect(a.sub(b)).toBeCloseToMeasurement(result);
    });

    test.each([
      [
        new Measurement(5, "m"),
        new Measurement(3, "ft"),
        new Measurement(7086.614, "in^2"),
      ],
      [
        new Measurement(5, "A"),
        new Measurement(3, "V"),
        new Measurement(15, "W"),
      ],
    ])("%p Mul", (a, b, result) => {
      expect(a.mul(b)).toBeCloseToMeasurement(result);
    });

    test.each([
      [
        new Measurement(20, "W"),
        new Measurement(5, "A"),
        new Measurement(4, "V"),
      ],
      [new Measurement(10, "ft"), new Measurement(5, "ft"), new Measurement(2)],
    ])("%p Div", (a, b, result) => {
      expect(a.div(b)).toBeCloseToMeasurement(result);
    });

    test.each([
      [new Measurement(5, "in"), new Measurement(5, "in")],
      [new Measurement(5, "cm"), new Measurement(0.05, "m")],
    ])("%p Eq", (a, b) => {
      expect(a).toEqualMeasurement(b);
    });

    test.each([
      [new Measurement(5, "in"), new Measurement(10, "in")],
      [new Measurement(10, "m"), new Measurement(10000, "cm")],
    ])("%p lt", (a, b) => {
      expect(a).toBeLessThanMeasurement(b);
    });

    test.each([
      [new Measurement(5, "in"), new Measurement(10, "in")],
      [new Measurement(5, "in"), new Measurement(5, "in")],
      [new Measurement(10, "m"), new Measurement(10000, "cm")],
      [new Measurement(10, "m"), new Measurement(1000, "cm")],
    ])("%p lte", (a, b) => {
      expect(a).toBeLessThanOrEqualMeasurement(b);
    });

    test.each([
      [new Measurement(5, "in"), new Measurement(10, "in")],
      [new Measurement(10, "m"), new Measurement(10000, "cm")],
    ])("%p gt", (a, b) => {
      expect(b).toBeGreaterThanMeasurement(a);
    });

    test.each([
      [new Measurement(5, "in"), new Measurement(10, "in")],
      [new Measurement(5, "in"), new Measurement(5, "in")],
      [new Measurement(10, "m"), new Measurement(10000, "cm")],
      [new Measurement(10, "m"), new Measurement(1000, "cm")],
    ])("%p gte", (a, b) => {
      expect(b).toBeGreaterThanOrEqualMeasurement(a);
    });
  });

  test("toDict() serializes correctly", () => {
    const m = new Measurement(1, "in");
    expect(m.toDict()).toEqual({ s: 1, u: "in" });
  });

  test("fromDict() parses correctly", () => {
    const d = { s: 1, u: "in" };
    expect(Measurement.fromDict(d)).toEqualMeasurement(
      new Measurement(1, "in")
    );
  });

  test("copy() returns an equal, new instance", () => {
    const m1 = new Measurement(1, "in");
    const m2 = m1;
    const copy = m1.copy();

    expect(m1).toBe(m2);
    expect(m1).not.toBe(copy);
    expect(m1).toEqualMeasurement(copy);
  });

  test.each([
    [
      new Measurement(1, "in"),
      new Measurement(5, "ft"),
      new Measurement(10, "yd"),
      new Measurement(5, "ft"),
    ],
    [
      new Measurement(15, "ft"),
      new Measurement(5, "ft"),
      new Measurement(20, "ft"),
      new Measurement(15, "ft"),
    ],
    [
      new Measurement(10, "A"),
      new Measurement(25, "A"),
      new Measurement(20, "A"),
      new Measurement(20, "A"),
    ],
  ])("%p clamp() works correctly", (min, measurement, max, expected) => {
    expect(measurement.clamp(min, max)).toEqualMeasurement(expected);
  });

  test("inverse() works correctly", () => {
    expect(new Measurement(5, "in/s").inverse()).toEqualMeasurement(
      new Measurement(0.2, "s/in")
    );

    expect(() => new Measurement(0, "A/V").inverse()).toThrowError(
      "Divide by zero"
    );
  });

  test.each([
    [new Measurement(-5, "A"), new Measurement(5, "A")],
    [new Measurement(0, "ft"), new Measurement(0, "ft")],
    [new Measurement(20, "V"), new Measurement(20, "V")],
  ])("%p abs() works correctly", (measurement, expected) => {
    expect(measurement.abs()).toEqualMeasurement(expected);
  });

  test.each([
    [new Measurement(-5, "ft"), -1],
    [new Measurement(0, "V"), 0],
    [new Measurement(10, "Ohm"), 1],
  ])("%p sign() works correctly", (measurement, expected) => {
    expect(measurement.sign()).toEqual(expected);
  });

  test.each([
    [new Measurement(-5, "A"), new Measurement(5, "A")],
    [new Measurement(0, "ft"), new Measurement(0, "ft")],
    [new Measurement(20, "V"), new Measurement(-20, "V")],
  ])("%p negate() works correctly", (measurement, expected) => {
    expect(measurement.negate()).toEqualMeasurement(expected);
  });

  test.each([
    [new Measurement(5, "A"), new Measurement(5, "A/rad")],
    [new Measurement(0, "rad rpm"), new Measurement(0, "rpm")],
  ])("%p removeRad() works correctly", (measurement, expected) => {
    expect(measurement.removeRad()).toEqualMeasurement(expected);
  });

  test("Measurement.min() works correctly", () => {
    expect(
      Measurement.min(new Measurement(5, "A"), new Measurement(10, "A"))
    ).toEqualMeasurement(new Measurement(5, "A"));
  });

  test("Measurement.max() works correctly", () => {
    expect(
      Measurement.max(new Measurement(5, "A"), new Measurement(10, "A"))
    ).toEqualMeasurement(new Measurement(10, "A"));
  });
});
