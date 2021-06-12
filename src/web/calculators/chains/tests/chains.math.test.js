import Measurement from "common/models/Measurement";

import { calculateClosestCenters, teethToPD } from "../math";

const inch = (n) => new Measurement(n, "in");

describe("Chain math", () => {
  test.each([
    [32, "#25", inch(2.551)],
    [40, "#25", inch(3.186)],
    [66, "#25", inch(5.254)],
    [22, "#35", inch(2.635)],
    [33, "#35", inch(3.945)],
    [54, "#35", inch(6.449)],
    [20, "#50 / Bike", inch(3.196)],
    [40, "#50 / Bike", inch(6.373)],
    [56, "#50 / Bike", inch(8.917)],
  ])("%p teethToPD", (teeth, chain, expected) => {
    expect(teethToPD(teeth, chain)).toBeCloseToMeasurement(expected);
  });

  test.each([
    {
      chain: "#25",
      p1Teeth: 40,
      p2Teeth: 40,
      desiredCenter: inch(6),
      extraCenter: inch(0),
      expected: {
        smaller: {
          teeth: 88,
          distance: expect.toBeCloseToMeasurement(inch(6)),
        },
        larger: {
          teeth: 88,
          distance: expect.toBeCloseToMeasurement(inch(6)),
        },
      },
    },
    {
      chain: "#35",
      p1Teeth: 40,
      p2Teeth: 40,
      desiredCenter: inch(6),
      extraCenter: inch(2),
      expected: {
        smaller: {
          teeth: 72,
          distance: expect.toBeCloseToMeasurement(inch(8)),
        },
        larger: {
          teeth: 72,
          distance: expect.toBeCloseToMeasurement(inch(8)),
        },
      },
    },
    {
      chain: "#35",
      p1Teeth: 20,
      p2Teeth: 40,
      desiredCenter: inch(6),
      extraCenter: inch(0),
      expected: {
        smaller: {
          teeth: 62,
          distance: expect.toBeCloseToMeasurement(inch(5.879)),
        },
        larger: {
          teeth: 64,
          distance: expect.toBeCloseToMeasurement(inch(6.261)),
        },
      },
    },
  ])(
    "%p calculateClosestCenters",
    ({ chain, p1Teeth, p2Teeth, desiredCenter, extraCenter, expected }) => {
      expect(
        calculateClosestCenters(
          chain,
          p1Teeth,
          p2Teeth,
          desiredCenter,
          extraCenter
        )
      ).toMatchObject(expected);
    }
  );
});
