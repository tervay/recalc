import Chain from "common/models/Chain";
import { inch } from "common/models/ExtraTypes";
import { describe, expect, test } from "vitest";
import {
  calculateCenterDistance,
  calculateCenters,
} from "web/calculators/chain/math";

describe("math", () => {
  test.each([
    {
      chain: new Chain("#25"),
      p1Teeth: 24,
      p2Teeth: 24,
      links: 64,
      expected: inch(5),
    },
    {
      chain: new Chain("#35"),
      p1Teeth: 104,
      p2Teeth: 104,
      links: 136,
      expected: inch(6),
    },
    {
      chain: new Chain("#25"),
      p1Teeth: 24,
      p2Teeth: 36,
      links: 78.15,
      expected: inch(6),
    },
  ])(
    "%p calculateCenterDistance",
    ({ chain, p1Teeth, p2Teeth, links, expected }) => {
      expect(
        calculateCenterDistance(chain, p1Teeth, p2Teeth, links),
      ).toBeCloseToMeasurement(expected);
    },
  );
  test.each([
    {
      chain: new Chain("#25"),
      p1Teeth: 24,
      p2Teeth: 36,
      desiredCenter: inch(5),
      allowHalfLinks: false,
      expected: {
        smaller: { links: 70, distance: inch(4.977) },
        larger: { links: 72, distance: inch(5.228) },
      },
    },
    {
      chain: new Chain("#35"),
      p1Teeth: 52,
      p2Teeth: 54,
      desiredCenter: inch(8),
      allowHalfLinks: false,
      expected: {
        smaller: { links: 94, distance: inch(7.6865) },
        larger: { links: 96, distance: inch(8.0616) },
      },
    },
    {
      chain: new Chain("#25"),
      p1Teeth: 100,
      p2Teeth: 14,
      desiredCenter: inch(1),
      allowHalfLinks: false,
      expected: {
        smaller: { links: 0, distance: inch(0) },
        larger: { links: 0, distance: inch(0) },
      },
    },
    {
      chain: new Chain("#25"),
      p1Teeth: 100,
      p2Teeth: 14,
      desiredCenter: inch(10),
      allowHalfLinks: true,
      expected: {
        smaller: { links: 141, distance: inch(9.909) },
        larger: { links: 142, distance: inch(10.042) },
      },
    },
  ])(
    "%p calculateCenters",
    ({ chain, p1Teeth, p2Teeth, desiredCenter, expected, allowHalfLinks }) => {
      const centers = calculateCenters(
        chain,
        p1Teeth,
        p2Teeth,
        desiredCenter,
        allowHalfLinks,
      );

      expect(centers.larger.distance).toBeCloseToMeasurement(
        expected.larger.distance,
      );
      expect(centers.larger.links).toBe(expected.larger.links);
      expect(centers.smaller.distance).toBeCloseToMeasurement(
        expected.smaller.distance,
      );
      expect(centers.smaller.links).toBe(expected.smaller.links);
    },
  );
});
