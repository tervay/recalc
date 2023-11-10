import { A, Nm, V, fps, ft_s2, m_s, rpm } from "common/models/ExtraTypes";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, { MotorDict, nominalVoltage } from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { expose } from "common/tooling/promise-worker";
import { enumerate, linspace } from "common/tooling/util";

export interface IliteResultDicts {
  maxVelocity: MeasurementDict;
  maxTractiveForce: MeasurementDict;
  outputCurrentAtMaxTractiveForce: MeasurementDict;
  voltageAtMaxTractiveForce: MeasurementDict;
  maxTheoreticalSpeed: MeasurementDict;
  timeSteps: MeasurementDict[];
  velocityOverTime: MeasurementDict[];
  accelOverTime: MeasurementDict[];
  positionOverTime: MeasurementDict[];
  sysVoltageOverTime: MeasurementDict[];
  totalCurrDrawOverTime: MeasurementDict[];
}

export interface IliteResult {
  maxVelocity: Measurement;
  maxTractiveForce: Measurement;
  outputCurrentAtMaxTractiveForce: Measurement;
  voltageAtMaxTractiveForce: Measurement;
  maxTheoreticalSpeed: Measurement;
  timeSteps: Measurement[];
  velocityOverTime: Measurement[];
  accelOverTime: Measurement[];
  positionOverTime: Measurement[];
  sysVoltageOverTime: Measurement[];
  totalCurrDrawOverTime: Measurement[];
}

function verifyRow(
  row: number,
  data: {
    floorSpeed: Measurement;
    appliedVoltage: Measurement;
    appliedVoltageRatio: number;
    absAppliedVoltage: Measurement;
    motorSpeed: Measurement;
    systemVoltage: Measurement;
    attemptedCurrentDraw: Measurement;
    actualAppliedTorque: Measurement;
    appliedAcceleration: Measurement;
  },
): boolean {
  if (![fps(0), fps(0), m_s(1.19351)][row].eq(data.floorSpeed)) {
    console.log(row, "failed on floor speed", data.floorSpeed.format());
    return false;
  }

  if (![V(0), V(12.42), V(8.1)][row].eq(data.appliedVoltage)) {
    console.log(row, "failed on app volt", data.appliedVoltage.format());
    return false;
  }

  if (![rpm(0), rpm(0), rpm(263.7648)][row].eq(data.motorSpeed)) {
    console.log(row, "failed on motor spd", data.motorSpeed.format());
    return false;
  }
  if (![V(12.6), V(9.36), V(9.36)][row].eq(data.systemVoltage)) {
    console.log(row, "failed on sys volt", data.systemVoltage.format());
    return false;
  }
  if (
    ![A(0), A(184.67800714285713), A(112.96435993374712)][row].eq(
      data.attemptedCurrentDraw,
    )
  ) {
    console.log(
      row,
      "failed on att curr draw",
      data.attemptedCurrentDraw.format(),
    );
    return false;
  }
  if (
    ![Nm(0), Nm(1.038481676126878), Nm(1.0317135071073578)][row].eq(
      data.actualAppliedTorque,
    )
  ) {
    console.log(row, "failed on appl torq", data.actualAppliedTorque.format());
    return false;
  }

  if (
    ![ft_s2(0), ft_s2(23.870333431531442), ft_s2(23.714761643476926)][row].eq(
      data.appliedAcceleration,
    )
  ) {
    console.log(row, "failed on appl acc", data.appliedAcceleration.format());
    return false;
  }

  return true;
}

type DecelerationMethod = "Brake" | "Coast" | "Reverse";
const decelerationMethodToAccelerationThreshold: Record<
  DecelerationMethod,
  Measurement
> = {
  Brake: new Measurement(0.2, "ft/s2"),
  Coast: new Measurement(0.05, "ft/s2"),
  Reverse: new Measurement(1.0, "ft/s2"),
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
  const appliedAcceleration = [new Measurement(0, "m/s2")];
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

  let ttg = 0;
  for (const [row, time] of enumerate(timesteps, 1)) {
    floorSpeed.push(
      Measurement.max(
        appliedAcceleration[row - 1].mul(simTimeRes).add(floorSpeed[row - 1]),
        new Measurement(0, "ft/s"),
      ),
    );

    if (!isHitTarget[row - 1]) {
      appliedVoltage.push(
        Measurement.min(
          batteryVoltageAtRest.sub(
            actualCurrentDraw[row - 1]
              .mul(motor.quantity)
              .mul(batteryResistance),
          ),
          appliedVoltage[row - 1].add(deltaVolts),
        ).sub(expectedVoltageLoss),
      );
    } else {
      if (
        floorSpeed[row - 1]
          .sub(new Measurement(1, "ft/s"))
          .lte(new Measurement(0, "ft/s"))
      ) {
        appliedVoltage.push(new Measurement(0, "V"));
      } else {
        appliedVoltage.push(
          Measurement.max(
            Measurement.maxAll(appliedVoltage).negate(),
            appliedVoltage[row - 1].sub(deltaVolts),
          ),
        );
      }
    }

    appliedVoltageRatios.push(
      appliedVoltage[row].div(batteryVoltageAtRest).toBase().scalar,
    );
    absAppliedVoltage.push(appliedVoltage[row].abs());

    motorSpeed.push(
      floorSpeed[row]
        .div(wheelDiameter.mul(Math.PI))
        .div(gearing)
        .mul(Math.abs(appliedVoltageRatios[row]))
        .mul(new Measurement(2 * Math.PI, "rad")),
    );

    if (isFinishedDecelerating[row - 1] || isHitTarget[row - 1]) {
      attemptedTorqueAtMotor.push(new Measurement(0, "N m"));
    } else {
      if (appliedVoltage[row].eq(new Measurement(0, "V"))) {
        console.log("uh");
      } else {
        attemptedTorqueAtMotor.push(
          actualFreeSpeed
            .mul(appliedVoltageRatios[row])
            .sub(motorSpeed[row])
            .div(actualFreeSpeed.mul(appliedVoltageRatios[row]))
            .mul(stallTorque)
            .mul(appliedVoltageRatios[row]),
        );
      }
    }

    attemptedCurrentDraw.push(
      isFinishedDecelerating[row - 1] && isHitTarget[row - 1]
        ? new Measurement(0, "A")
        : attemptedTorqueAtMotor[row]
            .div(stallTorque)
            .mul(stallCurrent.sub(freeCurrent))
            .add(freeCurrent)
            .mul(filtering)
            .add(attemptedCurrentDraw[row - 1].mul(1 - filtering))
            .abs(),
    );

    isCurrentLimiting.push(attemptedCurrentDraw[row].abs().gte(currentLimit));

    clampedPerMotorCurrentDraw.push(
      Measurement.min(
        attemptedCurrentDraw[row].abs(),
        currentLimit.mul(attemptedCurrentDraw[row].sign()),
      ),
    );

    const b = Measurement.maxAll(actualAppliedTorque).mul(-1);
    const factor =
      isHitTarget[row - 1] && appliedVoltage[row].lt(new Measurement(0, "V"))
        ? -1
        : 1;

    const a1 = clampedPerMotorCurrentDraw[row]
      .sub(freeCurrent)
      .mul(factor)
      .div(stallCurrent.sub(freeCurrent))
      .mul(stallTorque)
      .mul(efficiency)
      .sub(estimatedTorqueLoss.mul(floorSpeed[row]).div(maxTheoreticalSpeed))
      .sub(estimatedTorqueLoss.mul(isHitTarget[row] ? 1 : 0).div(efficiency));

    const a2 = appliedCOF[row - 1].div(motor.quantity);

    const a = Measurement.min(a1, a2);
    actualAppliedTorque.push(Measurement.max(a, b));

    isWheelSlipping.push(
      attemptedCurrentDraw[row].abs().gte(new Measurement(0, "A")) &&
        actualAppliedTorque[row].mul(motor.quantity).gte(appliedCOF[row - 1]) &&
        appliedVoltage[row].to("V").scalar != 0,
    );

    appliedAcceleration.push(
      isFinishedDecelerating[row - 1] && isHitTarget[row - 1]
        ? new Measurement(0, "m/s2")
        : actualAppliedTorque[row]
            .mul(motor.quantity)
            .div(gearing)
            .div(radius)
            .div(mass)
            .mul(efficiency),
    );

    absAcceleration.push(appliedAcceleration[row].abs());

    distanceTraveled.push(
      distanceTraveled[row - 1]
        .add(appliedAcceleration[row].mul(0.5).mul(simTimeRes.mul(simTimeRes)))
        .add(floorSpeed[row].mul(simTimeRes)),
    );

    isHitTarget.push(distanceTraveled[row].gte(sprintDistance));

    if (isHitTarget[isHitTarget.length - 1] && ttg == 0) {
      ttg = time;
    }

    if (isHitTarget[row]) {
      appliedCOF.push(attemptedTorqueAtMotor[row]);
    } else {
      appliedCOF.push(
        totalWeightForce
          .mul(isWheelSlipping[row - 1] ? wheelCOFDynamic : wheelCOFStatic)
          .mul(radius)
          .mul(gearing)
          .mul(attemptedTorqueAtMotor[row].sign()),
      );
    }

    isFinishedDecelerating.push(
      isFinishedDecelerating[row - 1] ||
        (isHitTarget[row] &&
          floorSpeed[row].lte(
            deceleration_complete_threshold.mul(new Measurement(1, "s")),
          )),
    );

    actualCurrentDraw.push(
      isFinishedDecelerating[row] && isHitTarget[row]
        ? new Measurement(0, "A")
        : Measurement.min(
            stallCurrent
              .sub(freeCurrent)
              .mul(actualAppliedTorque[row])
              .div(stallTorque)
              .div(efficiency)
              .add(freeCurrent)
              .div(efficiency),
            clampedPerMotorCurrentDraw[row],
          ),
    );

    systemVoltage.push(
      batteryVoltageAtRest.sub(
        actualCurrentDraw[row]
          .mul(dutyCycle)
          .mul(motor.quantity)
          .mul(batteryResistance),
      ),
    );
  }

  return {
    maxVelocity: Measurement.maxAll(floorSpeed).toDict(),
    maxTractiveForce: maxTractiveForceAtWheels.toDict(),
    outputCurrentAtMaxTractiveForce: outputCurrentAtMaxTractiveForce.toDict(),
    voltageAtMaxTractiveForce: voltageAtMaxTractiveForce.toDict(),
    maxTheoreticalSpeed: maxTheoreticalSpeed.toDict(),
    timeSteps: timesteps.map((t) => new Measurement(t, "s").toDict()),
    velocityOverTime: floorSpeed.map((m) => m.toDict()),
    positionOverTime: distanceTraveled.map((m) => m.toDict()),
    accelOverTime: absAcceleration.map((m) => m.toDict()),
    sysVoltageOverTime: systemVoltage.map((m) => m.toDict()),
    totalCurrDrawOverTime: actualCurrentDraw.map((m) => m.toDict()),
  };
}

const workerFunctions = { iliteSim };
expose(workerFunctions);
type DriveWorkerFunctions = typeof workerFunctions;
export type { DriveWorkerFunctions };
