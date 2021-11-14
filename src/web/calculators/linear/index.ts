import { GraphConfig } from "common/components/graphing/graphConfig";
import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig";
import { MeasurementParam, MotorParam, RatioParam } from "common/models/Params";
import Ratio, { RatioType } from "common/models/Ratio";
import { lazy } from "react";
import { NumberParam, withDefault } from "serialize-query-params";

const linearConfig: PageConfig = {
  url: "/linear",
  title: "Linear Mechanism Calculator",
  description: "Linear mechanism calculator",
  image: "/media/Elevator",
  version: 1,
  component: lazy(() => import("web/calculators/linear/components/LinearPage")),
};

export default linearConfig;

export const LinearParamsV1 = {
  motor: withDefault(MotorParam, Motor.Falcon500s(1)),
  travelDistance: withDefault(MeasurementParam, new Measurement(40, "in")),
  spoolDiameter: withDefault(MeasurementParam, new Measurement(1, "in")),
  load: withDefault(MeasurementParam, new Measurement(120, "lb")),
  ratio: withDefault(RatioParam, new Ratio(2, RatioType.REDUCTION)),
  efficiency: withDefault(NumberParam, 100),
};
export type LinearStateV1 = Stateify<typeof LinearParamsV1>;

export const linearGraphConfig = GraphConfig.options(
  {
    "y-current": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: true,
        text: "Current Draw per Motor (A)",
      },
    },
    "y-time": {
      type: "linear",
      position: "left",
      beginAtZero: true,
      title: {
        display: true,
        text: "Loaded Time to Goal (s)",
      },
    },
    x: {
      type: "linear",
      beginAtZero: true,
      title: {
        display: true,
        text: "Ratio Magnitude",
      },
    },
  },
  {
    maintainAspectRatio: false,
  }
);
