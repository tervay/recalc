import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig";
import { MeasurementParam, MotorParam, RatioParam } from "common/models/Params";
import Ratio, { RatioType } from "common/models/Ratio";
import { lazy } from "react";
import { BooleanParam, withDefault } from "serialize-query-params";

const flywheelConfig: PageConfig = {
  url: "/flywheel",
  title: "Flywheel Calculator",
  description: "Flywheel calculator",
  image: "/media/Flywheel",
  version: 2,
  component: lazy(
    () => import("web/calculators/flywheel/components/FlywheelPage")
  ),
};
export default flywheelConfig;

export const FlywheelParamsV1 = {
  motor: withDefault(MotorParam, Motor.fromIdentifier("Falcon 500", 1)),
  ratio: withDefault(RatioParam, new Ratio(1, RatioType.REDUCTION)),
  radius: withDefault(MeasurementParam, new Measurement(2, "in")),
  targetSpeed: withDefault(MeasurementParam, new Measurement(2000, "rpm")),
  weight: withDefault(MeasurementParam, new Measurement(5, "lbs")),
  momentOfInertia: withDefault(
    MeasurementParam,
    new Measurement(10, "lb in^2")
  ),
  useCustomMoi: withDefault(BooleanParam, false),
};

export const FlywheelStateV2Defaults = {
  motor: Motor.fromIdentifier("Falcon 500", 2),
  motorRatio: new Ratio(2, RatioType.STEP_UP),
  currentLimit: new Measurement(40, "A"),
  shooterRadius: new Measurement(3, "in"),
  shooterWeight: new Measurement(1, "lbs"),
  shooterTargetSpeed: new Measurement(11000, "rpm"),
  shooterMomentOfInertia: new Measurement(22.5, "lb in^2"),
  useCustomShooterMoi: false,
  flywheelRadius: new Measurement(2, "in"),
  flywheelWeight: new Measurement(1.5, "lbs"),
  flywheelRatio: new Ratio(1, RatioType.REDUCTION),
  flywheelMomentOfInertia: new Measurement(3, "lb in^2"),
  useCustomFlywheelMoi: false,
  projectileRadius: new Measurement(2, "in"),
  projectileWeight: new Measurement(5, "lbs"),
};

// export const FlywheelParamsV2 = Foo(FlywheelStateV2Defaults);
export const FlywheelParamsV2 = {
  motor: withDefault(MotorParam, FlywheelStateV2Defaults.motor),
  motorRatio: withDefault(RatioParam, FlywheelStateV2Defaults.motorRatio),
  currentLimit: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.currentLimit
  ),
  shooterRadius: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.shooterRadius
  ),
  shooterWeight: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.shooterWeight
  ),
  shooterTargetSpeed: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.shooterTargetSpeed
  ),
  shooterMomentOfInertia: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.shooterMomentOfInertia
  ),
  useCustomShooterMoi: withDefault(
    BooleanParam,
    FlywheelStateV2Defaults.useCustomShooterMoi
  ),
  flywheelRadius: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.flywheelRadius
  ),
  flywheelWeight: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.flywheelWeight
  ),
  flywheelRatio: withDefault(RatioParam, FlywheelStateV2Defaults.flywheelRatio),
  flywheelMomentOfInertia: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.flywheelMomentOfInertia
  ),
  useCustomFlywheelMoi: withDefault(
    BooleanParam,
    FlywheelStateV2Defaults.useCustomFlywheelMoi
  ),
  projectileRadius: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.projectileRadius
  ),
  projectileWeight: withDefault(
    MeasurementParam,
    FlywheelStateV2Defaults.projectileWeight
  ),
};

export type FlywheelStateV1 = Stateify<typeof FlywheelParamsV1>;
export type FlywheelStateV2 = Stateify<typeof FlywheelParamsV2>;
