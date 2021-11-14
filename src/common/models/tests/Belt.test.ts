import Belt from "common/models/Belt";
import { mm } from "common/models/ExtraTypes";
import Measurement from "../Measurement";

const testCases = [
  {
    pitch: mm(3),
    teeth: 100,
    length: mm(300),
    toDict: {
      teeth: 100,
      pitch: mm(3).toDict(),
    },
    eq: new Belt(100, mm(3), mm(100 * 3)),
  },
  {
    pitch: mm(5),
    teeth: 340,
    length: mm(1700),
    toDict: {
      teeth: 340,
      pitch: mm(5).toDict(),
    },
    eq: new Belt(340, mm(5), mm(340 * 5)),
  },
  {
    pitch: mm(7),
    teeth: 45,
    length: mm(315),
    toDict: {
      teeth: 45,
      pitch: mm(7).toDict(),
    },
    eq: new Belt(45, mm(7), mm(45 * 7)),
  },
];

describe("Belt model", () => {
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

  test.each(testCases)(
    "%p toDict returns expected data",
    ({ pitch, teeth, toDict }) => {
      expect(Belt.fromTeeth(teeth, pitch).toDict()).toMatchObject(toDict);
    }
  );

  test.each(testCases)("%p eq", ({ pitch, teeth, eq }) => {
    expect(Belt.fromTeeth(teeth, pitch)).toEqualModel(eq);
    expect(Belt.fromTeeth(teeth, pitch)).not.toEqualModel(
      new Measurement(1, "inch")
    );
    expect(Belt.fromTeeth(teeth + 10, pitch)).not.toEqualModel(eq);
    expect(Belt.fromTeeth(teeth, pitch.add(mm(1)))).not.toEqualModel(eq);
  });
});
