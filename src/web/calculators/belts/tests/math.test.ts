import Belt from "common/models/Belt";
import { inch, mm } from "common/models/ExtraTypes";
import Pulley from "common/models/Pulley";
import { describe, expect, test } from "vitest";
import {
  calculateClosestCenters,
  calculateDistance,
  teethInMesh,
} from "web/calculators/belts/math";

describe("Belt math", () => {
  test.each([
    {
      p1: Pulley.fromTeeth(18, mm(3)),
      p2: Pulley.fromTeeth(24, mm(3)),
      desiredCenter: inch(5),
      multipleOf: 5,
      result: {
        smaller: {
          belt: Belt.fromTeeth(105, mm(3)),
          distance: inch(4.9592),
        },
        larger: {
          belt: Belt.fromTeeth(110, mm(3)),
          distance: inch(5.2546),
        },
      },
    },
    {
      p1: Pulley.fromTeeth(20, mm(5)),
      p2: Pulley.fromTeeth(60, mm(5)),
      desiredCenter: inch(8),
      multipleOf: 3,
      result: {
        smaller: {
          belt: Belt.fromTeeth(120, mm(5)),
          distance: inch(7.773),
        },
        larger: {
          belt: Belt.fromTeeth(123, mm(5)),
          distance: inch(8.072),
        },
      },
    },
  ])(
    "%p Calculate closest centers",
    ({
      p1,
      p2,
      desiredCenter,
      multipleOf,
      result: { smaller: expectedSmaller, larger: expectedLarger },
    }) => {
      const { smaller, larger } = calculateClosestCenters(
        p1,
        p2,
        desiredCenter,
        multipleOf
      );

      expect(smaller.belt).toEqualModel(expectedSmaller.belt);
      expect(expectedSmaller.distance).toBeCloseToMeasurement(smaller.distance);
      expect(larger.belt).toEqualModel(expectedLarger.belt);
      expect(expectedLarger.distance).toBeCloseToMeasurement(larger.distance);
    }
  );

  test.each([
    {
      p1: Pulley.fromTeeth(18, mm(3)),
      p2: Pulley.fromTeeth(30, mm(3)),
      realDistance: inch(5.961),
      expectedP1: 8.77295,
      expectedP2: 14.621,
    },
    {
      p1: Pulley.fromTeeth(14, mm(3)),
      p2: Pulley.fromTeeth(60, mm(3)),
      realDistance: inch(10.0362),
      expectedP1: 6.59792,
      expectedP2: 28.276,
    },
  ])(
    "%p Calculate teeth in mesh",
    ({ p1, p2, realDistance, expectedP1, expectedP2 }) => {
      expect(teethInMesh(p1, p2, realDistance, p1)).toBeCloseTo(expectedP1);
      expect(teethInMesh(p1, p2, realDistance, p2)).toBeCloseTo(expectedP2);
    }
  );
  test.each([
    {
      p1: Pulley.fromTeeth(30, mm(3)),
      p2: Pulley.fromTeeth(12, mm(3)),
      belt: Belt.fromTeeth(139, mm(3)),
      expected: inch(6.96),
    },
    {
      p1: Pulley.fromTeeth(52, mm(5)),
      p2: Pulley.fromTeeth(54, mm(5)),
      belt: Belt.fromTeeth(340, mm(5)),
      expected: inch(28.24796),
    },
  ])("%p Calculate distance", ({ p1, p2, belt, expected }) => {
    expect(calculateDistance(p1, p2, belt)).toBeCloseToMeasurement(expected);
  });
});
