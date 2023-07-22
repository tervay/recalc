import { describe, expect, test } from "vitest";
import Compressor from "../Compressor";
import { cfm, lb, psi } from "../ExtraTypes";

describe("Compressor model", () => {
  test.each([
    {
      id: "AndyMark 1.1 Pump (12V)",
      data: {
        weight: lb(3.37),
        url: "https://www.andymark.com/products/1-1-pump-12v",
      },
    },
    {
      id: "VIAIR 90C (12V)",
      data: {
        weight: lb(2.4),
        url: "https://www.andymark.com/products/air-compressor",
      },
    },
    {
      id: "VIAIR 90C (13.8V)",
      data: {
        weight: lb(2.4),
        url: "https://www.viaircorp.com/c-models/90c",
      },
    },
    {
      id: "VIAIR 250C-IG (13.8V)",
      data: {
        weight: lb(6.75),
        url: "https://www.viaircorp.com/ig-series/250c-ig",
      },
    },
    {
      id: "VIAIR 330C-IG (13.8V)",
      data: {
        weight: lb(8.25),
        url: "https://www.viaircorp.com/ig-series/330c-ig",
      },
    },
    {
      id: "Thomas 215 (12V)",
      data: {
        weight: lb(3.0),
        url: "https://www.gardnerdenver.com/en-us/thomas/wob-l-piston-pumps-compressors/215-series",
      },
    },
    {
      id: "Thomas 405 (12V)",
      data: {
        weight: lb(4.3),
        url: "https://www.gardnerdenver.com/en-us/thomas/wob-l-piston-pumps-compressors/405-series",
      },
    },
    {
      id: "CP26 (12V)",
      data: {
        weight: lb(5.8),
        url: "https://partstospray.com/cp26forroboticsmax092cfmmax130psi.aspx",
      },
    },
  ])("%p fromIdentifier yields correct data", ({ id, data }) => {
    const c = Compressor.fromIdentifier(id);
    expect(c.weight).toEqualMeasurement(data.weight);
    expect(c.url).toEqual(data.url);
  });

  test.each(Compressor.getAllCompressors())(
    "%p cfmFn is always positive 0-120psi",
    (compressor) => {
      expect(compressor.cfmAtPressure(psi(0))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(20))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(40))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(60))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(80))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(100))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(110))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(115))).toBeGreaterThanMeasurement(
        cfm(0),
      );
      expect(compressor.cfmAtPressure(psi(120))).toBeGreaterThanMeasurement(
        cfm(0),
      );
    },
  );

  test.each([
    {
      compressor: Compressor.VIAIR_90C_12V(),
      dict: {
        name: "VIAIR 90C (12V)",
      },
    },
    {
      compressor: Compressor.VIAIR_90C_13V(),
      dict: {
        name: "VIAIR 90C (13.8V)",
      },
    },
    {
      compressor: Compressor.ANDYMARK_11(),
      dict: {
        name: "AndyMark 1.1 Pump (12V)",
      },
    },
  ])("%p toDict()", ({ compressor, dict }) => {
    expect(compressor.toDict()).toMatchObject(dict);
  });
});
