import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import type { MotorDict } from '~/lib/models/Motor';
import Motor from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';
import type {
  FeedbackGains,
  FeedforwardGains,
  FlywheelSimRow,
} from '~/lib/wpilib/wpilibc';

export type { FeedbackGains, FeedforwardGains };

export const FLYWHEEL_SIMULATION_TIMEOUT_SECONDS = 3;

export type WpilibFlywheelSimState = FlywheelSimRow;

export async function computeFlywheelFeedbackGains(
  motor_: MotorDict,
  ratio_: RatioDict,
  momentOfInertia_: MeasurementDict,
  efficiency: number,
  qVelocity_: MeasurementDict,
  rVolts_: MeasurementDict,
  feedbackDt_: MeasurementDict,
  sensorDelay_: MeasurementDict,
): Promise<FeedbackGains> {
  const wpilibc = await initWpilibc();

  const motor = Motor.fromDict(motor_);
  const ratio = Ratio.fromDict(ratio_);
  const momentOfInertia = Measurement.fromDict(momentOfInertia_);
  const feedbackDt = Measurement.fromDict(feedbackDt_);
  const rVolts = Measurement.fromDict(rVolts_);

  if (
    ratio.asNumber() === 0 ||
    motor.quantity === 0 ||
    momentOfInertia.scalar === 0 ||
    feedbackDt.to('s').scalar <= 0 ||
    rVolts.to('V').scalar <= 0
  ) {
    return { kP: 0, kD: 0 };
  }

  const wasmMotor = motor.toWpilibMotor();
  try {
    return wpilibc.computeFlywheelFeedbackGains(
      wasmMotor,
      ratio.asNumber(),
      momentOfInertia.to('kg m^2').scalar,
      efficiency,
      Measurement.fromDict(qVelocity_).to('rad/s').scalar,
      rVolts.to('V').scalar,
      feedbackDt.to('s').scalar,
      Measurement.fromDict(sensorDelay_).to('s').scalar,
    );
  } finally {
    wasmMotor.delete();
  }
}

export async function computeFlywheelFeedforwardGains(
  motor_: MotorDict,
  ratio_: RatioDict,
  momentOfInertia_: MeasurementDict,
  efficiency: number,
): Promise<FeedforwardGains> {
  const wpilibc = await initWpilibc();

  const motor = Motor.fromDict(motor_);
  const ratio = Ratio.fromDict(ratio_);
  const momentOfInertia = Measurement.fromDict(momentOfInertia_);

  if (
    ratio.asNumber() === 0 ||
    motor.quantity === 0 ||
    momentOfInertia.scalar === 0
  ) {
    return { kV: 0, kA: 0, kG: 0 };
  }

  const wasmMotor = motor.toWpilibMotor();
  try {
    return wpilibc.computeFlywheelFeedforwardGains(
      wasmMotor,
      ratio.asNumber(),
      momentOfInertia.to('kg m^2').scalar,
      efficiency,
    );
  } finally {
    wasmMotor.delete();
  }
}

export async function simulateFlywheelWpilib(
  motor_: MotorDict,
  ratio_: RatioDict,
  statorLimit_: MeasurementDict,
  supplyLimit_: MeasurementDict,
  statorVoltage_: MeasurementDict,
  batteryResistance_: MeasurementDict,
  batteryVoltage_: MeasurementDict,
  momentOfInertia_: MeasurementDict,
  targetRPM_: MeasurementDict,
  efficiency: number,
  batteryVoltageFilterTimeConstantSeconds: number,
  initialAngularVelocityRadPerSec: number = 0,
): Promise<WpilibFlywheelSimState[]> {
  const wpilibc = await initWpilibc();

  const motor = Motor.fromDict(motor_);
  const ratio = Ratio.fromDict(ratio_);
  const statorLimit = Measurement.fromDict(statorLimit_);
  const supplyLimit = Measurement.fromDict(supplyLimit_);
  const statorVoltage = Measurement.fromDict(statorVoltage_);
  const batteryResistance = Measurement.fromDict(batteryResistance_);
  const batteryVoltage = Measurement.fromDict(batteryVoltage_);
  const momentOfInertia = Measurement.fromDict(momentOfInertia_);
  const targetRPM = Measurement.fromDict(targetRPM_);

  if (
    ratio.asNumber() === 0 ||
    motor.quantity === 0 ||
    statorLimit.scalar === 0 ||
    supplyLimit.scalar === 0 ||
    momentOfInertia.scalar === 0 ||
    statorVoltage.scalar === 0 ||
    batteryVoltage.scalar === 0 ||
    batteryResistance.scalar === 0 ||
    targetRPM.scalar === 0
  ) {
    return [];
  }

  const wasmMotor = motor.toWpilibMotor();
  try {
    return wpilibc.simulateFlywheel(
      wasmMotor,
      ratio.asNumber(),
      momentOfInertia.to('kg m^2').scalar,
      targetRPM.to('rad/s').scalar,
      statorLimit.to('A').scalar * motor.quantity,
      supplyLimit.to('A').scalar * motor.quantity,
      statorVoltage.to('V').scalar,
      batteryResistance.to('Ohm').scalar,
      batteryVoltage.to('V').scalar,
      efficiency,
      0.0005,
      10,
      FLYWHEEL_SIMULATION_TIMEOUT_SECONDS,
      batteryVoltageFilterTimeConstantSeconds,
      initialAngularVelocityRadPerSec,
    );
  } finally {
    wasmMotor.delete();
  }
}
