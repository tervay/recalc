import { Stateify } from "common/models/ExtraTypes";
import PageConfig from "common/models/PageConfig";
import { lazy } from "react";
import { NumberParam, withDefault } from "use-query-params";

const gearConfig: PageConfig = {
  url: "/gears",
  title: "Gear Spacing Calculator",
  description: "Calculates c-c spacing between two gears.",
  version: 1,
  component: lazy(() => import("web/calculators/gears/components/GearPage")),
};

export default gearConfig;

export const GearParamsV1 = {
  gear1Teeth: withDefault(NumberParam, 20),
  gear2Teeth: withDefault(NumberParam, 40),
  gearDP: withDefault(NumberParam, 20),
};

export type GearStateV1 = Stateify<typeof GearParamsV1>;
