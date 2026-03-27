import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import type { MotorDict } from '~/lib/models/Motor';
import Motor from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export interface WpilibArmSimState {
  angleRadians: number;
  angularVelocityRadPerSec: number;
  statorCurrentDrawAmps: number;
  supplyCurrentDrawAmps: number;
  timeSeconds: number;
  batteryVoltageVolts: number;
  motorAppliedVoltageVolts: number;
  motorRpm: number;
  energyJoules: number;
  success: boolean;
}

export async function simulateArmWpilib(
  motor_: MotorDict,
  ratio_: RatioDict,
  momentOfInertia_: MeasurementDict,
  armLength_: MeasurementDict,
  minAngle_: MeasurementDict,
  maxAngle_: MeasurementDict,
  startingAngle_: MeasurementDict,
  statorVoltage_: MeasurementDict,
  supplyVoltage_: MeasurementDict,
  statorLimit_: MeasurementDict,
  supplyLimit_: MeasurementDict,
  batteryResistance_: MeasurementDict,
  goingDownOrUp: 'down' | 'up',
  efficiency: number,
  batteryVoltageFilterTimeConstantSeconds: number,
): Promise<WpilibArmSimState[]> {
  const wpilibc = await initWpilibc();

  const motor = Motor.fromDict(motor_);
  const ratio = Ratio.fromDict(ratio_);
  const momentOfInertia = Measurement.fromDict(momentOfInertia_);
  const armLength = Measurement.fromDict(armLength_);
  const minAngle = Measurement.fromDict(minAngle_);
  const maxAngle = Measurement.fromDict(maxAngle_);
  const startingAngle = Measurement.fromDict(startingAngle_);
  const supplyVoltage = Measurement.fromDict(supplyVoltage_);
  const statorLimit = Measurement.fromDict(statorLimit_);
  const supplyLimit = Measurement.fromDict(supplyLimit_);
  const batteryResistance = Measurement.fromDict(batteryResistance_);
  const statorVoltage = Measurement.fromDict(statorVoltage_);

  if (
    ratio.asNumber() === 0 ||
    motor.quantity === 0 ||
    momentOfInertia.baseScalar === 0 ||
    armLength.baseScalar === 0 ||
    statorVoltage.baseScalar === 0 ||
    supplyVoltage.baseScalar === 0
  ) {
    return [];
  }

  const wasmMotor = motor.toWpilibMotor();
  try {
    return wpilibc.simulateArm(
      wasmMotor,
      ratio.asNumber(),
      momentOfInertia.to('kg m^2').scalar,
      armLength.to('m').scalar,
      minAngle.to('rad').scalar,
      maxAngle.to('rad').scalar,
      startingAngle.to('rad').scalar,
      statorLimit.to('A').scalar * motor.quantity,
      supplyLimit.to('A').scalar * motor.quantity,
      statorVoltage.to('V').scalar,
      batteryResistance.to('Ohm').scalar,
      supplyVoltage.to('V').scalar,
      efficiency,
      goingDownOrUp === 'up',
      0.001,
      10,
      3.0,
      batteryVoltageFilterTimeConstantSeconds,
    ) as WpilibArmSimState[];
  } finally {
    wasmMotor.delete();
  }
}
