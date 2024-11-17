import { Stateify } from "common/models/ExtraTypes";
import PageConfig from "common/models/PageConfig";
import { BoreParam } from "common/models/Params";
import { lazy } from "react";
import { BooleanParam, NumberParam, withDefault } from "serialize-query-params";

const ratioFinderConfig: PageConfig = {
  url: "/ratioFinder",
  title: "Ratio Finder (WIP)",
  description: "Ratio Finder (WIP)",
  version: 1,
  component: lazy(
    () =>
      import("web/calculators/ratioFinder/components/RatioFinderCalculator"),
  ),
};

export default ratioFinderConfig;

export const RatioFinderParamsV1 = {
  targetReduction: withDefault(NumberParam, 15),
  reductionError: withDefault(NumberParam, 0.1),
  minStages: withDefault(NumberParam, 1),
  maxStages: withDefault(NumberParam, 2),
  startingBore: withDefault(BoreParam, "NEO"),
  forceStartingPinionSize: withDefault(BooleanParam, false),
  startingPinionSize: withDefault(NumberParam, 14),
  printablePulleys: withDefault(BooleanParam, false),

  enableVPs: withDefault(BooleanParam, false),
  enableMPs: withDefault(BooleanParam, true),
  enableSports: withDefault(BooleanParam, true),

  enableGT2: withDefault(BooleanParam, true),
  enableHTD: withDefault(BooleanParam, true),
  enableRT25: withDefault(BooleanParam, true),
  minPulleyTeeth: withDefault(NumberParam, 8),
  maxPulleyTeeth: withDefault(NumberParam, 84),

  enable25Chain: withDefault(BooleanParam, true),
  enable35Chain: withDefault(BooleanParam, true),
  minSprocketTeeth: withDefault(NumberParam, 8),
  maxSprocketTeeth: withDefault(NumberParam, 84),

  enable20DPGears: withDefault(BooleanParam, true),
  enable32DPGears: withDefault(BooleanParam, true),
  minGearTeeth: withDefault(NumberParam, 7),
  maxGearTeeth: withDefault(NumberParam, 84),
  enableNEOPinions: withDefault(BooleanParam, true),
  enableFalconPinions: withDefault(BooleanParam, true),
  enable775Pinions: withDefault(BooleanParam, true),
  enable550Pinions: withDefault(BooleanParam, true),
  enableKrakenPinions: withDefault(BooleanParam, true),
  enableVortexPinions: withDefault(BooleanParam, true),

  enableVEX: withDefault(BooleanParam, false),
  enableREV: withDefault(BooleanParam, true),
  enableWCP: withDefault(BooleanParam, true),
  enableAM: withDefault(BooleanParam, true),
  enableTTB: withDefault(BooleanParam, true),

  enable12HexBore: withDefault(BooleanParam, true),
  enable38HexBore: withDefault(BooleanParam, true),
  enableBearingBore: withDefault(BooleanParam, true),
  enable875Bore: withDefault(BooleanParam, true),
  enableMaxSpline: withDefault(BooleanParam, true),
  enableSplineXL: withDefault(BooleanParam, true),
};
export type RatioFinderStateV1 = Stateify<typeof RatioFinderParamsV1>;
