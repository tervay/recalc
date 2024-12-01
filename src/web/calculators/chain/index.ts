import Chain from "common/models/Chain";
import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import PageConfig from "common/models/PageConfig";
import { ChainParam, MeasurementParam } from "common/models/Params";
import { lazy } from "react";
import { BooleanParam, NumberParam, withDefault } from "serialize-query-params";

const chainConfig: PageConfig = {
  url: "/chains",
  title: "Chain Calculator",
  description: "Chain calculator",
  image: "/media/Chain",
  version: 1,
  component: lazy(() => import("web/calculators/chain/components/ChainPage")),
};

export default chainConfig;

export const ChainParamsV1 = {
  chain: withDefault(ChainParam, new Chain("#25")),
  p1Teeth: withDefault(NumberParam, 16),
  p2Teeth: withDefault(NumberParam, 36),
  desiredCenter: withDefault(MeasurementParam, new Measurement(5, "in")),
  extraCenter: withDefault(MeasurementParam, new Measurement(0, "in")),
  allowHalfLinks: withDefault(BooleanParam, false),
};
export type ChainStateV1 = Stateify<typeof ChainParamsV1>;
