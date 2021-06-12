import Measurement from "../Measurement";
import Pulley from "../Pulley";

const mm = (n) => new Measurement(n, "mm");
const inch = (n) => new Measurement(n, "in");

const testCases = [
  {
    pitch: mm(3),
    teeth: 28,
    pitchDiameter: inch(1.0527),
  },
  {
    pitch: mm(5),
    teeth: 118,
    pitchDiameter: inch(7.3938),
  },
  {
    pitch: mm(7),
    teeth: 54,
    pitchDiameter: inch(4.7371),
  },
];

describe("Belt", () => {
  test.each(testCases)(
    "%p Fills fields given teeth and pitch",
    ({ pitch, teeth, pitchDiameter }) => {
      const p = Pulley.fromTeeth(teeth, pitch);
      expect(p.pitchDiameter).toBeCloseToMeasurement(pitchDiameter);
    }
  );

  test.each(testCases)(
    "%p Fills fields given pitchDiameter and pitch",
    ({ pitch, teeth, pitchDiameter }) => {
      const p = Pulley.fromPitchDiameter(pitchDiameter, pitch);
      expect(p.teeth).toEqual(teeth);
    }
  );
});
