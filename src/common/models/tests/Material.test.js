import Material from "common/models/Material";
import Measurement from "common/models/Measurement";

describe("Material", () => {
  test("toDict returns valid structure", () => {
    const m = Material.Steel4140();
    expect(m.toDict()).toEqual({ name: "4140 Steel" });
  });

  test("fromDict parses correctly", () => {
    const m = Material.fromDict({ name: "4140 Steel" });
    expect(m.name).toEqual("4140 Steel");
    expect(m.mechanical.tensileStrengthUltimate).toEqualMeasurement(
      new Measurement(1080, "MPa")
    );
  });

  test("Safe tensile strength is 1/3 of max tensile strength", () => {
    const m = Material.Steel4140();
    expect(m.getSafeMaterialStrength()).toEqualMeasurement(
      new Measurement(990 / 3, "MPa")
    );
  });

  test("getAllMaterials returns expected values", () => {
    const all = Material.getAllMaterials();
    expect(all).toHaveLength(20);
    for (const m of all) {
      expect(m).toBeInstanceOf(Material);
      expect(m.name).toBeDefined();
    }
  });
});
