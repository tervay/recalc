import { GraphConfig } from "common/components/graphing/graphConfig";
import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig";
import { MeasurementParam, MotorParam, RatioParam } from "common/models/Params";
import Ratio, { RatioType } from "common/models/Ratio";
import { lazy } from "react";
import { BooleanParam, NumberParam, withDefault } from "serialize-query-params";

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
  motor: withDefault(MotorParam, Motor.KrakensWithFOC(2)),
  travelDistance: withDefault(MeasurementParam, new Measurement(60, "in")),
  spoolDiameter: withDefault(MeasurementParam, new Measurement(1, "in")),
  load: withDefault(MeasurementParam, new Measurement(15, "lb")),
  ratio: withDefault(RatioParam, new Ratio(2, RatioType.REDUCTION)),
  efficiency: withDefault(NumberParam, 100),
  currentLimit: withDefault(MeasurementParam, new Measurement(40, "A")),
  angle: withDefault(MeasurementParam, new Measurement(90, "deg")),
  limitAcceleration: withDefault(BooleanParam, false),
  limitedAcceleration: withDefault(
    MeasurementParam,
    new Measurement(400, "in/s2"),
  ),
  limitDeceleration: withDefault(BooleanParam, false),
  limitedDeceleration: withDefault(
    MeasurementParam,
    new Measurement(50, "in/s2"),
  ),
  limitVelocity: withDefault(BooleanParam, false),
  limitedVelocity: withDefault(MeasurementParam, new Measurement(10, "in/s")),
};
export type LinearStateV1 = Stateify<typeof LinearParamsV1>;

export const linearGraphConfig = GraphConfig.options(
  {
    "y-position": {
      type: "linear",
      position: "left",
      beginAtZero: true,
      title: {
        display: true,
        text: "Position (in)",
      },
    },
    "y-velocity": {
      type: "linear",
      position: "left",
      beginAtZero: true,
      title: {
        display: true,
        text: "Velocity (in/s)",
      },
      min: 0,
    },
    "y-current": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: true,
        text: "Current Draw (A)",
      },
      min: 0,
    },
    x: {
      type: "linear",
      beginAtZero: true,
      title: {
        display: true,
        text: "Time (s)",
      },
    },
  },
  {
    maintainAspectRatio: false,
  },
);
