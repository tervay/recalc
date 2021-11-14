import { GraphConfig } from "common/components/graphing/graphConfig";
import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig";
import { MeasurementParam, MotorParam, RatioParam } from "common/models/Params";
import Ratio, { RatioType } from "common/models/Ratio";
import { lazy } from "react";
import { NumberParam, withDefault } from "serialize-query-params";

const armConfig: PageConfig = {
  url: "/arm",
  title: "Arm Calculator",
  description: "Arm calculator",
  image: "/media/Arm",
  version: 1,
  component: lazy(() => import("web/calculators/arm/components/ArmPage")),
};

export default armConfig;

export const ArmParamsV1 = {
  motor: withDefault(MotorParam, Motor.Falcon500s(2)),
  ratio: withDefault(RatioParam, new Ratio(100, RatioType.REDUCTION)),
  comLength: withDefault(MeasurementParam, new Measurement(20, "in")),
  armMass: withDefault(MeasurementParam, new Measurement(15, "lb")),
  currentLimit: withDefault(MeasurementParam, new Measurement(40, "A")),
  startAngle: withDefault(MeasurementParam, Measurement.CIRCLE_RIGHT()),
  endAngle: withDefault(MeasurementParam, Measurement.CIRCLE_UP()),
  iterationLimit: withDefault(NumberParam, 10000),
};
export type ArmStateV1 = Stateify<typeof ArmParamsV1>;

enum CounterBalanceInfoMode {
  DESIRE_SPRING = 0,
  DESIRE_MOUNT = 1,
}
export const ArmsParamV2 = {
  ...ArmParamsV1,
  infoMode: withDefault(NumberParam, CounterBalanceInfoMode.DESIRE_SPRING),
  stringArmMountDistance: withDefault(
    MeasurementParam,
    new Measurement(5, "in")
  ),
  springConstant: withDefault(MeasurementParam, new Measurement(2, "N/m")),
  stringPulleyMountHeight: withDefault(
    MeasurementParam,
    new Measurement(4, "in")
  ),
};

export const armGraphConfig = GraphConfig.options(
  {
    "y-current": {
      type: "linear",
      position: "left",
      beginAtZero: true,
      title: {
        display: true,
        text: "Current (A)",
      },
    },
    "y-position": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: true,
        text: "Position (deg)",
      },
    },
    "y-rpm": {
      type: "linear",
      beginAtZero: true,
      title: {
        display: true,
        text: "Motor RPM",
      },
    },
    "y-torque": {
      type: "linear",
      beginAtZero: true,
      title: {
        display: true,
        text: "Motor Torque",
      },
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
  }
);
