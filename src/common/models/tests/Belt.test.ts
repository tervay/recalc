import { SimpleBelt } from "common/models/Belt";
import { mm } from "common/models/ExtraTypes";
import { describe, expect, test } from "vitest";
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
    eq: new SimpleBelt(100, mm(3)),
  },
  {
    pitch: mm(5),
    teeth: 340,
    length: mm(1700),
    toDict: {
      teeth: 340,
      pitch: mm(5).toDict(),
    },
    eq: new SimpleBelt(340, mm(5)),
  },
  {
    pitch: mm(7),
    teeth: 45,
    length: mm(315),
    toDict: {
      teeth: 45,
      pitch: mm(7).toDict(),
    },
    eq: new SimpleBelt(45, mm(7)),
  },
];

describe("Belt model", () => {
  test.each(testCases)(
    "%p Fills fields given teeth and pitch",
    ({ pitch, teeth, length }) => {
      const b = new SimpleBelt(teeth, pitch);
      expect(b.length).toBeCloseToMeasurement(length);
    },
  );

  test.each(testCases)(
    "%p Fills fields given length and pitch",
    ({ pitch, teeth, length }) => {
      const calculatedTeeth = Math.round(length.div(pitch).scalar);
      const b = new SimpleBelt(calculatedTeeth, pitch);
      expect(b.teeth).toBeCloseTo(teeth);
    },
  );

  test.each(testCases)(
    "%p toDict returns expected data",
    ({ pitch, teeth, toDict }) => {
      expect(new SimpleBelt(teeth, pitch).toDict()).toMatchObject(toDict);
    },
  );

  test.each(testCases)("%p eq", ({ pitch, teeth, eq }) => {
    expect(new SimpleBelt(teeth, pitch)).toEqualModel(eq);
    expect(new SimpleBelt(teeth, pitch)).not.toEqualModel(
      new Measurement(1, "inch"),
    );
    expect(new SimpleBelt(teeth + 10, pitch)).not.toEqualModel(eq);
    expect(new SimpleBelt(teeth, pitch.add(mm(1)))).not.toEqualModel(eq);
  });
});
