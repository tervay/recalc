import Measurement from "common/models/Measurement";

import {
  calculateCenterGivenSpecificBelt,
  calculateClosestCenters,
  calculateTeethInMesh,
  teethToPD,
  testables,
} from "../math";

const mm = (s) => new Measurement(s, "mm");
const inch = (s) => new Measurement(s, "in");

describe("Belt math", () => {
  test.each([
    // HTD 5mm
    [18, mm(5), inch(1.128)],
    [24, mm(5), inch(1.504)],
    [30, mm(5), inch(1.88)],
    [36, mm(5), inch(2.256)],
    // GT2 3mm
    [12, mm(3), inch(0.451)],
    [16, mm(3), inch(0.602)],
    [24, mm(3), inch(0.902)],
    [36, mm(3), inch(1.353)],
    [48, mm(3), inch(1.805)],
    [60, mm(3), inch(2.256)],
  ])("%p Teeth to pitch diameter", (teeth, pitch, expected) => {
    expect(teethToPD(teeth, pitch)).toBeCloseToMeasurement(expected);
  });

  test.each([
    [
      {
        pitch: mm(3),
        p1Teeth: 18,
        p2Teeth: 24,
        desiredCenter: inch(5),
        extraCenter: inch(0),
        minBeltToothCount: 10,
        maxBeltToothCount: 200,
        beltToothIncrement: 5,
        expectedObj: {
          smaller: {
            teeth: 105,
            distance: inch(4.9592),
          },
          larger: {
            teeth: 110,
            distance: inch(5.2546),
          },
        },
      },
      {
        pitch: mm(5),
        p1Teeth: 60,
        p2Teeth: 20,
        desiredCenter: inch(8),
        extraCenter: inch(1),
        minBeltToothCount: 10,
        maxBeltToothCount: 200,
        beltToothIncrement: 10,
        expectedObj: {
          smaller: {
            teeth: 120,
            distance: inch(8.7727),
          },
          larger: {
            teeth: 130,
            distance: inch(9.7865),
          },
        },
      },
    ],
  ])(
    "%p Calculate closest centers",
    ({
      pitch,
      p1Teeth,
      p2Teeth,
      desiredCenter,
      extraCenter,
      minBeltToothCount,
      maxBeltToothCount,
      beltToothIncrement,
      expectedObj: { smaller: expectedSmaller, larger: expectedLarger },
    }) => {
      const { smaller, larger } = calculateClosestCenters(
        pitch,
        teethToPD(p1Teeth, pitch),
        teethToPD(p2Teeth, pitch),
        desiredCenter,
        extraCenter,
        minBeltToothCount,
        maxBeltToothCount,
        beltToothIncrement
      );

      expect(expectedSmaller.teeth).toBe(smaller.teeth);
      expect(expectedSmaller.distance).toBeCloseToMeasurement(smaller.distance);

      expect(expectedLarger.teeth).toBe(larger.teeth);
      expect(expectedLarger.distance).toBeCloseToMeasurement(larger.distance);
    }
  );

  test.each([
    {
      pitch: mm(3),
      p1PitchDiameter: teethToPD(18, mm(3)),
      p2PitchDiameter: teethToPD(24, mm(3)),
      beltTeeth: 340,
      expectedSmaller: {
        teeth: 340,
        distance: expect.toBeCloseToMeasurement(new Measurement(18.8389, "in")),
      },
      extraCenter: new Measurement(0, "in"),
    },
    {
      pitch: mm(5),
      p1PitchDiameter: teethToPD(52, mm(5)),
      p2PitchDiameter: teethToPD(54, mm(5)),
      beltTeeth: 118,
      expectedSmaller: {
        teeth: 118,
        distance: expect.toBeCloseToMeasurement(new Measurement(8.4, "in")),
      },
      extraCenter: new Measurement(2, "in"),
    },
  ])(
    "%p Calculate closest centers given a specific belt",
    ({
      pitch,
      p1PitchDiameter,
      p2PitchDiameter,
      beltTeeth,
      expectedSmaller,
      extraCenter,
    }) => {
      expect(
        calculateCenterGivenSpecificBelt(
          pitch,
          p1PitchDiameter,
          p2PitchDiameter,
          beltTeeth,
          extraCenter
        )
      ).toMatchObject({
        smaller: expectedSmaller,
        larger: {
          teeth: 0,
          distance: expect.toEqualMeasurement(new Measurement(0, "in")),
        },
      });
    }
  );

  test.each([
    {
      p1PitchDiameter: teethToPD(18, mm(3)),
      p2PitchDiameter: teethToPD(30, mm(3)),
      p1Teeth: 18,
      p2Teeth: 30,
      realDistance: inch(5.961),
      expected: 8.77295,
    },
    {
      p1PitchDiameter: teethToPD(60, mm(5)),
      p2PitchDiameter: teethToPD(14, mm(5)),
      p1Teeth: 60,
      p2Teeth: 14,
      realDistance: inch(10.0362),
      expected: 6.32988,
    },
  ])(
    "%p Calculate teeth in mesh",
    ({
      p1PitchDiameter,
      p2PitchDiameter,
      p1Teeth,
      p2Teeth,
      realDistance,
      expected,
    }) => {
      expect(
        calculateTeethInMesh(
          p1PitchDiameter,
          p2PitchDiameter,
          p1Teeth,
          p2Teeth,
          realDistance
        )
      ).toBeCloseTo(expected);
    }
  );

  test.each([
    {
      pitch: mm(3),
      p1PitchDiameter: teethToPD(30, mm(3)),
      p2PitchDiameter: teethToPD(12, mm(3)),
      beltTeeth: 139,
      expected: inch(6.96),
    },
    {
      pitch: mm(5),
      p1PitchDiameter: teethToPD(52, mm(5)),
      p2PitchDiameter: teethToPD(54, mm(5)),
      beltTeeth: 340,
      expected: inch(28.24796),
    },
  ])(
    "%p Calculate distance",
    ({ pitch, p1PitchDiameter, p2PitchDiameter, beltTeeth, expected }) => {
      expect(
        testables.calculateDistance(
          pitch,
          p1PitchDiameter,
          p2PitchDiameter,
          beltTeeth
        )
      ).toBeCloseToMeasurement(expected);
    }
  );
});
