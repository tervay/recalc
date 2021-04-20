import Material from "common/models/Material";
import Measurement from "common/models/Measurement";

describe("Material", () => {
  test("toDict returns valid structure", () => {
    const m = Material.Steel4140Annealed();
    expect(m.toDict()).toEqual({ name: "4140 Steel Annealed" });
  });

  test("fromDict parses correctly", () => {
    const m = Material.fromDict({ name: "4140 Steel Annealed" });
    expect(m.name).toEqual("4140 Steel Annealed");
    expect(m.tensileStrength).toEqualMeasurement(new Measurement(98000, "psi"));
  });

  test("Safe tensile strength is 1/3 of max tensile strength", () => {
    const m = Material.Steel4140Annealed();
    expect(m.getSafeMaterialStrength()).toEqualMeasurement(
      new Measurement(98000 / 3, "psi")
    );
  });

  test("getAllMaterials returns expected values", () => {
    const all = Material.getAllMaterials();
    expect(all).toHaveLength(19);
    for (const m of all) {
      expect(m).toBeInstanceOf(Material);
      expect(m.name).toBeDefined();
    }
  });
});
