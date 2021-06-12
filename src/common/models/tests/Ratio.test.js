import Ratio from "common/models/Ratio";

describe("Ratio", () => {
  test("Default constructor uses reduction ratio", () => {
    const r = new Ratio(3);
    expect(r.magnitude).toBe(3);
    expect(r.ratioType).toBe(Ratio.REDUCTION);
    expect(r.ratioType).toBe("Reduction");
    expect(r.asNumber()).toBe(3);
  });

  test.each([
    [new Ratio(1.0), 1],
    [new Ratio(2.0), 2],
    [new Ratio(3.0, Ratio.REDUCTION), 3],
    [new Ratio(4.0, Ratio.STEP_UP), 0.25],
    [new Ratio(5.0, Ratio.STEP_UP), 0.2],
  ])("%p asNumber() works correctly", (ratio, expected) => {
    expect(ratio.asNumber()).toEqual(expected);
  });

  test.each([
    [
      new Ratio(3),
      {
        magnitude: 3,
        ratioType: "Reduction",
      },
    ],
    [
      new Ratio(5, Ratio.REDUCTION),
      {
        magnitude: 5,
        ratioType: "Reduction",
      },
    ],
    [
      new Ratio(8, Ratio.STEP_UP),
      {
        magnitude: 8,
        ratioType: "Step-up",
      },
    ],
  ])("%p toDict() works correctly", (ratio, dict) => {
    expect(ratio.toDict()).toEqual(dict);
  });

  test("fromDict() works correctly", () => {
    const d = {
      magnitude: 8,
      ratioType: "Step-up",
    };

    const r = Ratio.fromDict(d);
    expect(r.magnitude).toEqual(8);
    expect(r.ratioType).toEqual("Step-up");
    expect(r.asNumber()).toEqual(0.125);
  });
});
