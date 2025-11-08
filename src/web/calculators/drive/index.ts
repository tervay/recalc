import { GraphConfig } from "common/components/graphing/graphConfig";
import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig";
import { MeasurementParam, MotorParam, RatioParam } from "common/models/Params";
import Ratio from "common/models/Ratio";
import { lazy } from "react";
import { BooleanParam, NumberParam, withDefault } from "serialize-query-params";

const driveConfig: PageConfig = {
  url: "/drive",
  title: "Drivetrain Calculator",
  description: "Drivetrain Calculator",
  version: 1,
  component: lazy(() => import("web/calculators/drive/components/DrivePage")),
};

export default driveConfig;

export const DriveParamsV1 = {
  swerve: withDefault(BooleanParam, true),
  motor: withDefault(MotorParam, Motor.KrakensWithFOC(4)),
  ratio: withDefault(RatioParam, new Ratio(5.36)),
  efficiency: withDefault(NumberParam, 97),
  weightInspected: withDefault(MeasurementParam, new Measurement(125, "lb")),
  weightAuxilliary: withDefault(MeasurementParam, new Measurement(24, "lb")),
  wheelDiameter: withDefault(MeasurementParam, new Measurement(4, "in")),
  wheelCOFStatic: withDefault(NumberParam, 1.1),
  wheelCOFDynamic: withDefault(NumberParam, 0.9),
  wheelCOFLateral: withDefault(NumberParam, 1.1),
  wheelBaseLength: withDefault(MeasurementParam, new Measurement(27, "in")),
  wheelBaseWidth: withDefault(MeasurementParam, new Measurement(20, "in")),
  weightDistributionFrontBack: withDefault(NumberParam, 0.5),
  weightDistributionLeftRight: withDefault(NumberParam, 0.5),
  sprintDistance: withDefault(MeasurementParam, new Measurement(25, "ft")),
  targetTimeToGoal: withDefault(MeasurementParam, new Measurement(2, "s")),
  numCyclesPerMatch: withDefault(NumberParam, 24),
  batteryVoltageAtRest: withDefault(
    MeasurementParam,
    new Measurement(12.6, "V"),
  ),
  appliedVoltageRamp: withDefault(
    MeasurementParam,
    new Measurement(1200, "V/s"),
  ),
  motorCurrentLimit: withDefault(MeasurementParam, new Measurement(60, "A")),
  batteryResistance: withDefault(
    MeasurementParam,
    new Measurement(0.018, "ohm"),
  ),
  batteryAmpHours: withDefault(MeasurementParam, new Measurement(18, "A*h")),
  peakBatteryDischarge: withDefault(NumberParam, 20),
  maxSimulationTime: withDefault(MeasurementParam, new Measurement(4, "s")),
  gearRatioMin: withDefault(RatioParam, new Ratio(3)),
  gearRatioMax: withDefault(RatioParam, new Ratio(15)),
  filtering: withDefault(NumberParam, 1.0),
  maxSpeedAccelerationThreshold: withDefault(
    MeasurementParam,
    new Measurement(0.15, "ft/s2"),
  ),
  throttleResponseMin: withDefault(NumberParam, 0.5),
  throttleResponseMax: withDefault(NumberParam, 0.99),
};
export type DriveStateV1 = Stateify<typeof DriveParamsV1>;

export const motionGraphConfig = GraphConfig.options(
  {
    "y-velocity": {
      type: "linear",
      position: "left",
      beginAtZero: true,
      title: {
        display: true,
        text: "Velocity (ft/s)",
      },
    },
    "y-position": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: true,
        text: "Position (ft)",
      },
    },
    "y-accel": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: true,
        text: "Acceleration (ft/s2)",
      },
    },
    "y-currlimit": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: false,
      },
      display: false,
      min: 0,
      max: 5,
    },
    "y-wheelslip": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: false,
      },
      display: false,
      min: 0,
      max: 4,
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

export const electricalGraphConfig = GraphConfig.options(
  {
    "y-current": {
      type: "linear",
      position: "right",
      beginAtZero: true,
      title: {
        display: true,
        text: "Current (A)",
      },
    },
    "y-voltage": {
      type: "linear",
      position: "left",
      beginAtZero: true,
      title: {
        display: true,
        text: "Voltage (V)",
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
  },
);
