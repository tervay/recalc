import Measurement from "common/models/Measurement";
import each from "jest-each";

import { calculateClosestCenters, teethToPD } from "../math";

const mm = (s) => new Measurement(s, "mm");
const inch = (s) => new Measurement(s, "in");

each([
  // Vex pulleys
  // HTD 5mm
  [18, mm(5), 1.128],
  [24, mm(5), 1.504],
  [30, mm(5), 1.88],
  [36, mm(5), 2.256],
  // GT2 3mm
  [12, mm(3), 0.451],
  [16, mm(3), 0.602],
  [24, mm(3), 0.902],
  [36, mm(3), 1.353],
  [48, mm(3), 1.805],
  [60, mm(3), 2.256],
]).test("teeth -> pitch diameter", (teeth, pitch, expected) => {
  expect(teethToPD(teeth, pitch).to("in").scalar).toBeCloseTo(expected, 3);
});

each([
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
          distance: 4.9592,
        },
        larger: {
          teeth: 110,
          distance: 5.2546,
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
          distance: 8.7727,
        },
        larger: {
          teeth: 130,
          distance: 9.7865,
        },
      },
    },
  ],
]).test(
  "calculate closest centers",
  ({
    pitch,
    p1Teeth,
    p2Teeth,
    desiredCenter,
    extraCenter,
    minBeltToothCount,
    maxBeltToothCount,
    beltToothIncrement,
    expectedObj,
  }) => {
    const { smaller: expectedSmaller, larger: expectedLarger } = expectedObj;

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
    expect(expectedSmaller.distance).toBeCloseTo(
      smaller.distance.to("in").scalar,
      2
    );

    expect(expectedLarger.teeth).toBe(larger.teeth);
    expect(expectedLarger.distance).toBeCloseTo(
      larger.distance.to("in").scalar,
      2
    );
  }
);
