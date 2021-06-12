import Filament from "common/models/Filament";

describe("Filament", () => {
  test("getAllFilaments returns all Filament instances", () => {
    const all = Filament.getAllFilaments();

    expect(all).toHaveLength(15);
    for (const f of all) {
      expect(f).toBeInstanceOf(Filament);
      expect(f.name).toBeDefined();
    }
  });
});
