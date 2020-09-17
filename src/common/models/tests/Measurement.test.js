import Measurement from "common/models/Measurement";
import each from "jest-each";
import Qty from "js-quantities";

test("All constructors function properly", () => {
  const m = new Measurement(1, "in");
  expect(m.scalar).toBe(1);
  expect(m.units()).toBe("in");

  const m2 = Measurement.fromQty(Qty(1, "in"));
  expect(m2.scalar).toBe(1);
  expect(m.units()).toBe("in");

  const m3 = new Measurement(1);
  expect(m3.scalar).toBe(1);
  expect(m3.units()).toBe("");
});

each([
  [
    [2791, "lbs"],
    [
      [1265.976, "kg"],
      [1265976, "g"],
      [44655.99, "oz"],
    ],
  ],
  [
    [340, "s"],
    [
      [0.0944444, "hr"],
      [5.666664, "min"],
      [0.0039352, "day"],
    ],
  ],
  [
    [20, "in"],
    [
      [508, "mm"],
      [0.000315657, "mi"],
      [0.508, "m"],
    ],
  ],
  [[694, "rpm"], [[72.675501, "rad/sec"]]],
  [
    [5254, "J"],
    [
      [1.459444, "W*hr"],
      [1.25573575526, "kilocal"],
      [5254, "N*m"],
    ],
  ],
  [
    [6328, "W"],
    [
      [8.485988, "hp"],
      [28 * 226, "V*A"],
    ],
  ],
  [
    [3538, "psi"],
    [
      [24.39365, "MPa"],
      [240.746607453386, "atm"],
      [243.936500002, "bar"],
    ],
  ],
  [[401, "N*m/V"], [[401, "N*m/V"]]],
]).test(
  "Constructor properly simplifies units",
  ([simplifiedMag, simplifiedUnits], unsimplifiedExpressions) => {
    unsimplifiedExpressions.forEach(([magnitude, units]) => {
      // console.log(magnitude, units);
      const m = new Measurement(magnitude, units);
      expect(m.scalar).toBeCloseTo(simplifiedMag);
      expect(m.units()).toBe(simplifiedUnits);
    });
  }
);

each([
  [
    [2791, "lbs"],
    [5254, "kg"],
    [14374.0873, "lbs"],
  ],
  [
    [340, "min"],
    [6328, "hr"],
    [22801200, "s"],
  ],
]).test(
  "Properly adds 2 Measurement instances",
  ([mag1, units1], [mag2, units2], [mag3, units3]) => {
    const m1 = new Measurement(mag1, units1);
    const m2 = new Measurement(mag2, units2);
    const result = m1.add(m2);

    expect(result.scalar).toBeCloseTo(mag3);
    expect(result.units()).toBe(units3);
  }
);
