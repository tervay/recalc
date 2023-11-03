import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, { MotorDict, nominalVoltage } from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { expose } from "common/tooling/promise-worker";
import { linspace, stringifyMeasurements } from "common/tooling/util";

export interface IliteResultDicts {
  maxVelocity: MeasurementDict;
  maxTractiveForce: MeasurementDict;
  outputCurrentAtMaxTractiveForce: MeasurementDict;
  voltageAtMaxTractiveForce: MeasurementDict;
  maxTheoreticalSpeed: MeasurementDict;
}

export interface IliteResult {
  maxVelocity: Measurement;
  maxTractiveForce: Measurement;
  outputCurrentAtMaxTractiveForce: Measurement;
  voltageAtMaxTractiveForce: Measurement;
  maxTheoreticalSpeed: Measurement;
}

type DecelerationMethod = "Brake" | "Coast" | "Reverse";
const decelerationMethodToAccelerationThreshold: Record<
  DecelerationMethod,
  number
> = {
  Brake: 0.2,
  Coast: 0.05,
  Reverse: 1.0,
};

export function iliteSim(args: {
  swerve_: boolean;
  motor_: MotorDict;
  ratio_: RatioDict;
  efficiency_: number;
  weightInspected_: MeasurementDict;
  weightAuxilliary_: MeasurementDict;
  wheelDiameter_: MeasurementDict;
  wheelCOFStatic_: number;
  wheelCOFDynamic_: number;
  wheelCOFLateral_: number;
  wheelBaseLength_: MeasurementDict;
  wheelBaseWidth_: MeasurementDict;
  weightDistributionFrontBack_: number;
  weightDistributionLeftRight_: number;
  sprintDistance_: MeasurementDict;
  targetTimeToGoal_: MeasurementDict;
  numCyclesPerMatch_: number;
  batteryVoltageAtRest_: MeasurementDict;
  appliedVoltageRamp_: MeasurementDict;
  motorCurrentLimit_: MeasurementDict;
  batteryResistance_: MeasurementDict;
  batteryAmpHours_: MeasurementDict;
  peakBatteryDischarge_: number;
  maxSimulationTime_: MeasurementDict;
  gearRatioMin_: RatioDict;
  gearRatioMax_: RatioDict;
  filtering_: number;
  maxSpeedAccelerationThreshold_: MeasurementDict;
  throttleResponseMin_: number;
  throttleResponseMax_: number;
}): IliteResultDicts {
  const swerve = args.swerve_;
  const motor = Motor.fromDict(args.motor_);
  const ratio = Ratio.fromDict(args.ratio_);
  const efficiency = args.efficiency_ / 100;
  const weightInspected = Measurement.fromDict(args.weightInspected_);
  const weightAuxilliary = Measurement.fromDict(args.weightAuxilliary_);
  const wheelDiameter = Measurement.fromDict(args.wheelDiameter_);
  const wheelCOFStatic = args.wheelCOFStatic_;
  const wheelCOFDynamic = args.wheelCOFDynamic_;
  const wheelCOFLateral = args.wheelCOFLateral_;
  const wheelBaseLength = Measurement.fromDict(args.wheelBaseLength_);
  const wheelBaseWidth = Measurement.fromDict(args.wheelBaseWidth_);
  const weightDistributionFrontBack = args.weightDistributionFrontBack_;
  const weightDistributionLeftRight = args.weightDistributionLeftRight_;
  const sprintDistance = Measurement.fromDict(args.sprintDistance_);
  const targetTimeToGoal = Measurement.fromDict(args.targetTimeToGoal_);
  const numCyclesPerMatch = args.numCyclesPerMatch_;
  const batteryVoltageAtRest = Measurement.fromDict(args.batteryVoltageAtRest_);
  const appliedVoltageRamp = Measurement.fromDict(args.appliedVoltageRamp_);
  const motorCurrentLimit = Measurement.fromDict(args.motorCurrentLimit_);
  const batteryResistance = Measurement.fromDict(args.batteryResistance_);
  const batteryAmpHours = Measurement.fromDict(args.batteryAmpHours_);
  const peakBatteryDischarge = args.peakBatteryDischarge_;
  const maxSimulationTime = Measurement.fromDict(args.maxSimulationTime_);
  const gearRatioMin = Ratio.fromDict(args.gearRatioMin_);
  const gearRatioMax = Ratio.fromDict(args.gearRatioMax_);
  const filtering = args.filtering_;
  const maxSpeedAccelerationThreshold = Measurement.fromDict(
    args.maxSpeedAccelerationThreshold_,
  );
  const throttleResponseMin = args.throttleResponseMin_;
  const throttleResponseMax = args.throttleResponseMax_;

  // ===================
  const totalMass = weightInspected.add(weightAuxilliary);
  const totalWeightForce = totalMass.mul(Measurement.GRAVITY.negate());
  const gearing = 1.0 / ratio.asNumber();
  const specVoltage = nominalVoltage;
  const deceleration_complete_threshold =
    decelerationMethodToAccelerationThreshold["Brake"];
  const expectedVoltageLoss = new Measurement(0.18, "V");
  const numSimRows = 100;
  const appliedVoltageRatio = batteryVoltageAtRest
    .sub(expectedVoltageLoss)
    .div(specVoltage);
  const actualFreeSpeed = motor.freeSpeed.mul(
    batteryVoltageAtRest.div(specVoltage),
  );
  const stallTorque = motor.stallTorque.mul(appliedVoltageRatio);
  const dutyCycle = 0.75;
  const stallCurrent = motor.stallCurrent.mul(appliedVoltageRatio);
  const freeCurrent = motor.freeCurrent.mul(appliedVoltageRatio);
  const currentLimit = Measurement.min(
    motorCurrentLimit,
    motorCurrentLimit,
    // batteryVoltageAtRest
    //   .div(12)
    //   .mul(batteryAmpHours.div(peakBatteryDischarge))
    //   .div(motor.quantity),
  );
  const simTimeRes = maxSimulationTime.div(numSimRows);
  const mass = totalMass;

  // console.log(
  //   stringifyMeasurements({
  //     currentLimit,
  //     stallTorque,
  //     mass: mass.toBase(),
  //   }),
  // );

  const radius = wheelDiameter.div(2);
  const currentLimitedMaxMotorTorque = currentLimit
    .sub(freeCurrent)
    .div(stallCurrent.sub(freeCurrent))
    .mul(stallTorque);
  const weightTimesCOF = totalWeightForce.mul(wheelCOFStatic);
  const maxTorqueAtWheel = weightTimesCOF.mul(radius);
  const maxMotorTorque = maxTorqueAtWheel
    .mul(gearing)
    .div(motor.quantity)
    .div(efficiency);
  const gearedStallTorque = stallTorque
    .mul(motor.quantity)
    .div(gearing)
    .mul(efficiency);
  const estimatedTorqueLoss = totalMass
    .mul(1 - efficiency)
    .div(totalMass)
    .mul(stallTorque);
  const deltaVolts = appliedVoltageRamp.mul(simTimeRes);
  const maxMotorTorqueBeforeWheelSlip = maxMotorTorque;

  const maxTractiveForceAtWheels = Measurement.min(
    maxMotorTorqueBeforeWheelSlip,
    currentLimitedMaxMotorTorque,
  )
    .mul(motor.quantity * ratio.asNumber())
    .div(radius)
    .mul(efficiency);

  // console.log(
  //   stringifyMeasurements({
  //     // maxMotorTorqueBeforeWheelSlip: maxMotorTorqueBeforeWheelSlip
  //     //   .toBase()
  //     //   .format(),
  //     // currentLimitedMaxMotorTorque: currentLimitedMaxMotorTorque
  //     //   .toBase()
  //     //   .format(),
  //     maxTorqueAtWheel: maxTorqueAtWheel.to("N m"),
  //     mass: mass.to("kg"),
  //     weightTimesCOF: weightTimesCOF.to("N"),
  //     maxTractiveForceAtWheels: maxTractiveForceAtWheels.to("N"),
  //     maxMotorTorqueBeforeWheelSlip: maxMotorTorqueBeforeWheelSlip.to("N m"),
  //     maxMotorTorque: maxMotorTorque.to("N m"),
  //   }),
  // );

  const outputCurrentAtMaxTractiveForce = Measurement.min(
    maxMotorTorqueBeforeWheelSlip,
    currentLimitedMaxMotorTorque,
  )
    .div(stallTorque)
    .mul(stallCurrent.sub(freeCurrent))
    .add(freeCurrent)
    .mul(motor.quantity)
    .mul(dutyCycle)
    .div(efficiency);

  const voltageAtMaxTractiveForce = batteryVoltageAtRest.sub(
    outputCurrentAtMaxTractiveForce.mul(batteryResistance),
  );

  // ilite sim uses 12V motor free speed here, not 12.6(ish) motor free speed
  const maxTheoreticalSpeed = actualFreeSpeed
    .mul(gearing)
    .mul(wheelDiameter)
    .mul(Math.PI)
    .div(new Measurement(2 * Math.PI, "rad"))
    .to("ft/s");

  const appliedVoltageRatios = [0];
  const motorSpeed = [new Measurement(0, "rpm")];
  const attemptedTorqueAtMotor = [new Measurement(0, "N m")];
  const attemptedCurrentDraw = [new Measurement(0, "A")];
  const actualAppliedTorque = [new Measurement(0, "N m")];
  const distanceTraveled = [new Measurement(0, "m")];
  const isMaxSpeed = [false];
  const isWheelSlipping = [false];
  const floorSpeed = [new Measurement(0, "ft/s")];
  const appliedVoltage = [new Measurement(0, "V")];
  const isHitTarget = [distanceTraveled[0].gte(sprintDistance)];
  const isFinishedDecelerating = [isHitTarget[0]];
  const appliedAcceleration = [
    isFinishedDecelerating[0] && isHitTarget[0]
      ? new Measurement(0, "m/s2")
      : actualAppliedTorque[0]
          .mul(stallCurrent)
          .div(gearing)
          .div(radius)
          .div(mass)
          .mul(efficiency),
  ];
  const absAcceleration = [appliedAcceleration[0].abs()];
  const clampedPerMotorCurrentDraw = [
    Measurement.min(attemptedCurrentDraw[0].abs(), currentLimit).mul(
      attemptedCurrentDraw[0].sign(),
    ),
  ];
  const actualCurrentDraw = [
    isFinishedDecelerating[0] && isHitTarget[0]
      ? new Measurement(0, "A")
      : Measurement.min(
          stallCurrent
            .sub(freeCurrent)
            .mul(actualAppliedTorque[0])
            .div(stallTorque)
            .abs()
            .add(freeCurrent)
            .div(efficiency),
          clampedPerMotorCurrentDraw[0],
        ),
  ];
  const absAppliedVoltage = [appliedVoltage[0].abs()];
  const isCurrentLimiting = [
    actualCurrentDraw[0].abs().gte(clampedPerMotorCurrentDraw[0].sub(1)) &&
      attemptedCurrentDraw[0].abs().gte(currentLimit),
  ];
  const systemVoltage = [
    batteryVoltageAtRest.sub(
      actualCurrentDraw[0]
        .mul(dutyCycle)
        .mul(motor.quantity)
        .mul(batteryResistance),
    ),
  ];
  const coulombs = [
    Measurement.min(actualCurrentDraw[0], currentLimit)
      .mul(simTimeRes)
      .mul(1000)
      .div(60)
      .div(60)
      .div(efficiency),
  ];

  const appliedCOF = [
    totalWeightForce.mul(wheelCOFStatic).mul(radius).mul(gearing),
  ];

  const timesteps = linspace(
    maxSimulationTime.div(numSimRows).to("s").scalar,
    maxSimulationTime.to("s").scalar,
    maxSimulationTime.div(numSimRows).to("s").scalar,
  );

  console.log(
    stringifyMeasurements({
      coulombs: coulombs[0].to("C"),
    }),
  );

  return {
    maxVelocity: new Measurement(motor.quantity, "m/s").toDict(),
    maxTractiveForce: maxTractiveForceAtWheels.toDict(),
    outputCurrentAtMaxTractiveForce: outputCurrentAtMaxTractiveForce.toDict(),
    voltageAtMaxTractiveForce: voltageAtMaxTractiveForce.toDict(),
    maxTheoreticalSpeed: maxTheoreticalSpeed.toDict(),
  };
}

const workerFunctions = { iliteSim };
expose(workerFunctions);
type DriveWorkerFunctions = typeof workerFunctions;
export type { DriveWorkerFunctions };
