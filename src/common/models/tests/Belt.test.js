import Belt from "../Belt";
import Measurement from "../Measurement";

const mm = (n) => new Measurement(n, "mm");

const testCases = [
  {
    pitch: mm(3),
    teeth: 100,
    length: mm(300),
  },
  {
    pitch: mm(5),
    teeth: 340,
    length: mm(1700),
  },
  {
    pitch: mm(7),
    teeth: 45,
    length: mm(315),
  },
];

describe("Belt", () => {
  test.each(testCases)(
    "%p Fills fields given teeth and pitch",
    ({ pitch, teeth, length }) => {
      const b = Belt.fromTeeth(teeth, pitch);
      expect(b.length).toBeCloseToMeasurement(length);
    }
  );

  test.each(testCases)(
    "%p Fills fields given length and pitch",
    ({ pitch, teeth, length }) => {
      const b = Belt.fromLength(length, pitch);
      expect(b.teeth).toBeCloseTo(teeth);
    }
  );
});
