import { describe, expect, test } from "vitest";
import { generateOptions } from "../math";
import { RatioFinderStateV1 } from "..";
import { Gearbox } from "common/models/Gearbox";

describe("ratioFinder math", () => {
  test("should find gearboxes with target reduction of 15", () => {
    const state: RatioFinderStateV1 = {
      targetReduction: 15,
      reductionError: 0.1,
      minStages: 1,
      maxStages: 2,
      startingBore: "SplineXS",
      forceStartingPinionSize: false,
      startingPinionSize: 14,
      printablePulleys: false,

      // Planetaries
      enableVPs: false,
      enableMPs: true,
      enableSports: true,

      // Pulleys
      enableGT2: true,
      enableHTD: true,
      enableRT25: true,
      minPulleyTeeth: 8,
      maxPulleyTeeth: 84,

      // Sprockets
      enable25Chain: true,
      enable35Chain: true,
      minSprocketTeeth: 8,
      maxSprocketTeeth: 84,

      // Gears
      enable20DPGears: true,
      enable32DPGears: true,
      minGearTeeth: 7,
      maxGearTeeth: 84,

      // Pinions
      enableNEOPinions: true,
      enableFalconPinions: true,
      enable775Pinions: true,
      enable550Pinions: true,
      enableKrakenPinions: true,
      enableVortexPinions: true,

      // Vendors
      enableVEX: true,
      enableREV: true,
      enableWCP: true,
      enableAM: true,
      enableTTB: true,

      // Other bores
      enable12HexBore: true,
      enable38HexBore: true,
      enableBearingBore: true,
      enable875Bore: true,
      enableMaxSpline: true,
      enableSplineXL: true,
    };

    const results = generateOptions(state);
    
    console.log(`Found ${results.length} gearboxes`);
    
    // Log first 10 results for inspection
    results.slice(0, 10).forEach((gbObj, i) => {
      const gb = Gearbox.fromObj(gbObj);
      console.log(`${i + 1}. Ratio: ${gb.getRatio().toFixed(3)}, Stages: ${gb.getStages()}`);
      gb.stages.forEach((stage, j) => {
        console.log(`   Stage ${j + 1}: ${stage.driving}:${stage.driven} (ratio: ${stage.getRatio().toFixed(3)})`);
        console.log(`     Driving: ${stage.drivingMethods.length} options, Driven: ${stage.drivenMethods.length} options`);
      });
    });

    // Basic assertions
    expect(results.length).toBeGreaterThan(0);
    
    // Check that all results are within the target range
    results.forEach((gbObj) => {
      const gb = Gearbox.fromObj(gbObj);
      const ratio = gb.getRatio();
      expect(ratio).toBeGreaterThanOrEqual(state.targetReduction - state.reductionError);
      expect(ratio).toBeLessThanOrEqual(state.targetReduction + state.reductionError);
    });

    // Check that all results have the correct number of stages
    results.forEach((gbObj) => {
      const gb = Gearbox.fromObj(gbObj);
      expect(gb.getStages()).toBeGreaterThanOrEqual(state.minStages);
      expect(gb.getStages()).toBeLessThanOrEqual(state.maxStages);
    });

    // Check that all first stages start with the correct bore
    results.forEach((gbObj) => {
      const gb = Gearbox.fromObj(gbObj);
      const firstStageDrivingBores = gb.stages[0].drivingMethods.map(m => m.bore);
      expect(firstStageDrivingBores.some(bore => bore === state.startingBore)).toBe(true);
    });
  });

  test("should find gearboxes with forced starting pinion size", () => {
    const state: RatioFinderStateV1 = {
      targetReduction: 15,
      reductionError: 0.1,
      minStages: 1,
      maxStages: 2,
      startingBore: "SplineXS",
      forceStartingPinionSize: true,
      startingPinionSize: 14,
      printablePulleys: false,

      enableVPs: false,
      enableMPs: true,
      enableSports: true,

      enableGT2: true,
      enableHTD: true,
      enableRT25: true,
      minPulleyTeeth: 8,
      maxPulleyTeeth: 84,

      enable25Chain: true,
      enable35Chain: true,
      minSprocketTeeth: 8,
      maxSprocketTeeth: 84,

      enable20DPGears: true,
      enable32DPGears: true,
      minGearTeeth: 7,
      maxGearTeeth: 84,

      enableNEOPinions: true,
      enableFalconPinions: true,
      enable775Pinions: true,
      enable550Pinions: true,
      enableKrakenPinions: true,
      enableVortexPinions: true,

      enableVEX: true,
      enableREV: true,
      enableWCP: true,
      enableAM: true,
      enableTTB: true,

      enable12HexBore: true,
      enable38HexBore: true,
      enableBearingBore: true,
      enable875Bore: true,
      enableMaxSpline: true,
      enableSplineXL: true,
    };

    const results = generateOptions(state);
    
    console.log(`Found ${results.length} gearboxes with forced pinion size`);

    expect(results.length).toBeGreaterThan(0);

    // Check that all first stages have the forced starting pinion size
    results.forEach((gbObj) => {
      const gb = Gearbox.fromObj(gbObj);
      const firstStageDrivingSizes = gb.stages[0].drivingMethods.map(m => m.teeth);
      expect(firstStageDrivingSizes.some(teeth => teeth === state.startingPinionSize)).toBe(true);
    });
  });

  test("should include printed pulleys when enabled", () => {
    const state: RatioFinderStateV1 = {
      targetReduction: 4,
      reductionError: 0.1,
      minStages: 1,
      maxStages: 1,
      startingBore: "SplineXS",
      forceStartingPinionSize: false,
      startingPinionSize: 14,
      printablePulleys: true,

      enableVPs: false,
      enableMPs: false,
      enableSports: false,

      enableGT2: true,
      enableHTD: false,
      enableRT25: false,
      minPulleyTeeth: 10,
      maxPulleyTeeth: 40,

      enable25Chain: false,
      enable35Chain: false,
      minSprocketTeeth: 8,
      maxSprocketTeeth: 84,

      enable20DPGears: false,
      enable32DPGears: false,
      minGearTeeth: 7,
      maxGearTeeth: 84,

      enableNEOPinions: true,
      enableFalconPinions: true,
      enable775Pinions: true,
      enable550Pinions: true,
      enableKrakenPinions: true,
      enableVortexPinions: true,

      enableVEX: false,
      enableREV: false,
      enableWCP: false,
      enableAM: false,
      enableTTB: false,

      enable12HexBore: true,
      enable38HexBore: true,
      enableBearingBore: true,
      enable875Bore: true,
      enableMaxSpline: true,
      enableSplineXL: true,
    };

    const results = generateOptions(state);
    
    console.log(`Found ${results.length} gearboxes with printed pulleys`);

    expect(results.length).toBeGreaterThan(0);

    // Check that we have printed pulleys
    const hasPrintedPulleys = results.some((gbObj) => {
      const gb = Gearbox.fromObj(gbObj);
      return gb.stages.some(stage => 
        stage.drivingMethods.some(m => m.vendor === "Printed") ||
        stage.drivenMethods.some(m => m.vendor === "Printed")
      );
    });

    expect(hasPrintedPulleys).toBe(true);
  });
});

