import { GraphConfig } from "common/components/graphing/graphConfig";
import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor, { nominalVoltage } from "common/models/Motor";
import MotorPlaygroundList, {
  MotorPlaygroundEntry,
} from "common/models/MotorPlaygroundList";
import PageConfig from "common/models/PageConfig";
import { MotorPlaygroundListParam } from "common/models/Params";
import Ratio from "common/models/Ratio";
import { lazy } from "react";
import { withDefault } from "serialize-query-params";

const motorsConfig: PageConfig = {
  url: "/motors",
  title: "Motor Playground",
  description: "FRC motor playground",
  image: "/media/Motor",
  component: lazy(() => import("./components/MotorsPage")),
};

export default motorsConfig;

export const MotorPlaygroundParams = {
  motorList: withDefault(
    MotorPlaygroundListParam,
    new MotorPlaygroundList(
      Motor.getAllMotors().map(
        (m) =>
          new MotorPlaygroundEntry(
            Motor.fromIdentifier(
              m.identifier,
              ["Falcon 500", "NEO"].includes(m.identifier) ? 1 : 0,
            ),
            new Measurement(60, "A"),
            nominalVoltage,
            new Ratio(1),
            {
              showCurrent: true,
              showPower: true,
              showTorque: true,
            },
          ),
      ),
    ),
  ),
};
export type MotorPlaygroundState = Stateify<typeof MotorPlaygroundParams>;

const maxTorque = 6;
const maxPower = 600;
const maxCurrent = 120;
// const maxRpm = 19500;

export const graphConfig = GraphConfig.options(
  {
    "y0-power": {
      type: "linear",
      title: {
        display: true,
        text: "Power (W)",
      },
      min: 0,
      max: maxPower,
      position: "right",
    },
    "y0-torque": {
      type: "linear",
      title: {
        display: true,
        text: "Torque (N*m)",
      },
      min: 0,
      max: maxTorque,
    },
    "y0-current": {
      type: "linear",
      title: {
        display: true,
        text: "Current (A)",
      },
      min: 0,
      max: maxCurrent,
    },
    x: {
      type: "linear",
      beginAtZero: true,
      title: {
        display: true,
        text: "RPM",
      },
      min: 0,
      // max: maxRpm,
    },
    ...Motor.getAllChoices().reduce((acc, _, i) => {
      return {
        ...acc,
        [`y${i + 1}-power`]: {
          type: "linear",
          display: false,
          min: 0,
          max: maxPower,
        },
        [`y${i + 1}-torque`]: {
          type: "linear",
          display: false,
          min: 0,
          max: maxTorque,
        },
        [`y${i + 1}-current`]: {
          type: "linear",
          display: false,
          min: 0,
          max: maxCurrent,
        },
      };
    }, {}),
  },
  {
    maintainAspectRatio: true,
    showLegend: false,
  },
);

graphConfig.aspectRatio = 1.2;
