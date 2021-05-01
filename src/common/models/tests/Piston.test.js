import Measurement from "common/models/Measurement";
import Piston from "common/models/Piston";

const p = new Piston({
  enabled: true,
  bore: new Measurement(1.5, "in"),
  rodDiameter: new Measurement(0.375, "in"),
  strokeLength: new Measurement(6, "in"),
  pullPressure: new Measurement(50, "psi"),
  pushPressure: new Measurement(80, "psi"),
  period: new Measurement(1, "s"),
});

const workingPressure = new Measurement(110, "psi");
const lowPressure = new Measurement(15, "psi");

describe("Piston", () => {
  test("Constructor catches missed paramter", () => {
    expect(
      () =>
        new Piston({
          bore: new Measurement(1.5, "in"),
          rodDiameter: new Measurement(0.375, "in"),
          strokeLength: new Measurement(6, "in"),
          pullPressure: new Measurement(50, "psi"),
          pushPressure: new Measurement(80, "psi"),
        })
    ).toThrow("Provided undefined for a parameter to Piston!");
  });

  test.each([
    [workingPressure, new Measurement(864.6725484991103, "N")],
    [lowPressure, new Measurement(117.9098929771514, "N")],
  ])("%p getPushForce works correctly", (pressure, expectedResult) => {
    expect(p.getPushForce(pressure)).toEqualMeasurement(expectedResult);
  });

  test.each([
    [workingPressure, new Measurement(810.6305142179158, "N")],
    [lowPressure, new Measurement(110.5405246660794, "N")],
  ])("%p getPullForce works correctly", (pressure, expectedResult) => {
    expect(p.getPullForce(pressure)).toEqualMeasurement(expectedResult);
  });

  test("toDict() works correctly", () => {
    expect(p.toDict()).toEqual({
      enabled: true,
      bore: { u: "in", s: 1.5 },
      rodDiameter: { u: "in", s: 0.375 },
      strokeLength: { u: "in", s: 6 },
      pullPressure: { u: "psi", s: 50 },
      pushPressure: { u: "psi", s: 80 },
      period: { u: "s", s: 1 },
    });
  });

  test("fromDict() parses correctly", () => {
    const newPiston = Piston.fromDict({
      enabled: true,
      bore: { u: "in", s: 1.5 },
      rodDiameter: { u: "in", s: 0.375 },
      strokeLength: { u: "in", s: 6 },
      pullPressure: { u: "psi", s: 50 },
      pushPressure: { u: "psi", s: 80 },
      period: { u: "s", s: 1 },
    });

    expect(newPiston.enabled).toBeTruthy();
    expect(newPiston.bore).toEqualMeasurement(new Measurement(1.5, "in"));
    expect(newPiston.rodDiameter).toEqualMeasurement(
      new Measurement(0.375, "in")
    );
    expect(newPiston.strokeLength).toEqualMeasurement(new Measurement(6, "in"));
    expect(newPiston.pullPressure).toEqualMeasurement(
      new Measurement(50, "psi")
    );
    expect(newPiston.pushPressure).toEqualMeasurement(
      new Measurement(80, "psi")
    );
    expect(newPiston.period).toEqualMeasurement(new Measurement(1, "s"));
  });
});
