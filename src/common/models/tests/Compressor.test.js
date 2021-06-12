import Compressor from "common/models/Compressor";
import Measurement from "common/models/Measurement";

describe("Compressor", () => {
  test("getAllCompressors returns all compressor instances", () => {
    const allCompressors = Compressor.getAllCompressors();

    expect(allCompressors).toHaveLength(8);
    allCompressors.forEach((c) => {
      expect(c).toBeInstanceOf(Compressor);
    });
  });

  test.each([
    [
      Compressor.VIAIR_90C_13_8V(),
      {
        weight: new Measurement(2.4, "lb"),
      },
    ],
    [
      Compressor.VIAIR_90C_12V(),
      {
        weight: new Measurement(2.4, "lb"),
      },
    ],
    [
      Compressor.VIAIR_250C_IG_13_8V(),
      {
        weight: new Measurement(6.75, "lb"),
      },
    ],
    [
      Compressor.VIAIR_330C_IG_13_8V(),
      {
        weight: new Measurement(8.25, "lb"),
      },
    ],
    [
      Compressor.THOMAS_215_12V(),
      {
        weight: new Measurement(3, "lb"),
      },
    ],
    [
      Compressor.THOMAS_405_12V(),
      {
        weight: new Measurement(4.3, "lb"),
      },
    ],
    [
      Compressor.ANDYMARK_1_1_PUMP_12V(),
      {
        weight: new Measurement(3.37, "lb"),
      },
    ],
    [
      Compressor.CP26(),
      {
        weight: new Measurement(5.8, "lb"),
      },
    ],
  ])("%p Fields are properly set from compressorMap", (compressor, data) => {
    expect(compressor).toMatchObject({
      url: expect.any(String),
      weight: expect.toEqualMeasurement(data.weight),
      cfmFn: expect.any(Function),
    });
  });

  describe.each(Compressor.getAllCompressors())(
    "%p CFM function",
    (compressor) => {
      test("Returns FRC-legal values at 0 psi", () => {
        expect(
          compressor.cfmFn(new Measurement(0, "psi"))
        ).toBeGreaterThanMeasurement(new Measurement(0, "ft^3/min"));

        expect(
          compressor.cfmFn(new Measurement(0, "psi"))
        ).toBeLessThanMeasurement(new Measurement(1.1005, "ft^3/min"));
      });

      test("Decreases as PSI increases", () => {
        const zeroPsiCfm = compressor.cfmFn(new Measurement(0, "psi"));
        const twentyPsiCfm = compressor.cfmFn(new Measurement(20, "psi"));
        const fiftyPsiCfm = compressor.cfmFn(new Measurement(50, "psi"));

        expect(zeroPsiCfm).toBeGreaterThanMeasurement(twentyPsiCfm);
        expect(twentyPsiCfm).toBeGreaterThanMeasurement(fiftyPsiCfm);
      });
    }
  );
});
