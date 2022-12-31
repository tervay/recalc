import { Stateify } from "common/models/ExtraTypes";
import PageConfig from "common/models/PageConfig";
import { RatioPairParam } from "common/models/Params";
import RatioPairList from "common/models/RatioPair";
import { lazy } from "react";
import { withDefault } from "serialize-query-params";

const ratioConfig: PageConfig = {
  url: "/ratio",
  title: "Ratio Calculator (WIP)",
  description: "Ratio calculator (WIP)",
  version: 1,
  component: lazy(() => import("web/calculators/ratio/components/RatioPage")),
};

export default ratioConfig;

export const RatioParamsV1 = {
  ratioPairs: withDefault(
    RatioPairParam,
    new RatioPairList([
      [18, 72],
      [24, 48],
    ])
  ),
};
export type RatioStateV1 = Stateify<typeof RatioParamsV1>;
