import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import PageConfig from "common/models/PageConfig";
import { MeasurementParam, PulleyParam } from "common/models/Params";
import Pulley from "common/models/Pulley";
import { lazy } from "react";
import { BooleanParam, NumberParam, withDefault } from "serialize-query-params";

const beltsConfig: PageConfig = {
  url: "/belts",
  title: "Belt Calculator",
  description: "Timing belt center-center calculator",
  image: "/media/Belts",
  version: 1,
  component: lazy(() => import("web/calculators/belts/components/BeltsPage")),
};

export default beltsConfig;

export const BeltsParamsV1 = {
  customBeltTeeth: withDefault(NumberParam, 125),
  desiredCenter: withDefault(MeasurementParam, new Measurement(5, "in")),
  extraCenter: withDefault(MeasurementParam, new Measurement(0.0, "mm")),
  p1Teeth: withDefault(NumberParam, 16),
  p2Teeth: withDefault(NumberParam, 24),
  pitch: withDefault(MeasurementParam, new Measurement(3, "mm")),
  toothIncrement: withDefault(NumberParam, 5),
  useCustomBelt: withDefault(BooleanParam, false),
};
export type BeltsStateV1 = Stateify<typeof BeltsParamsV1>;

export const BeltParamsV2 = {
  pulley: withDefault(
    PulleyParam,
    Pulley.fromTeeth(100, new Measurement(15, "mm")),
  ),
};
export type BeltStateV2 = Stateify<typeof BeltParamsV2>;
