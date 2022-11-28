import { Quantity, Unit } from "@buge/ts-units";
import { Angle } from "@buge/ts-units/angle/dimension";
import { Mass } from "@buge/ts-units/mass/dimension";
import {
  kilograms,
  meters,
  minutes,
  newtons,
  turns,
  volts,
} from "common/models/units/allUnits";

// Simple remaps
export const revolutions: Unit<Angle> = turns;
export const pounds: Unit<Mass> = kilograms.times(2.204623).withSymbol("lb");

// Angular speed
type AngularSpeedDimension = {
  angle: 1;
  time: -1;
};
export type AngularSpeed = Quantity<AngularSpeedDimension>;
export const rpm: Unit<AngularSpeedDimension> = revolutions
  .per(minutes)
  .withSymbol("rpm");

// MotorVelocityConstant
type MotorVelocityConstantDimension = {
  // rpm
  angle: 1;
  // time: -1;

  // per volt
  mass: -1;
  length: -2;
  // time: 3;
  current: 1;

  // results in
  time: 2;
};
export type MotorVelocityConstant = Quantity<MotorVelocityConstantDimension>;
export const rpmPerVolt: Unit<MotorVelocityConstantDimension> = rpm.per(volts);

// Torque
type TorqueDimension = {
  // Newton
  mass: 1;
  //   length: 1;
  time: -2;

  // meters
  //   length: 1;

  // results in
  length: 2;
};
export type Torque = Quantity<TorqueDimension>;
export const newtonmeters: Unit<TorqueDimension> = newtons.times(meters);
