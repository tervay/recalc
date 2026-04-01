import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import type { MotorDict } from '~/lib/models/Motor';
import Motor from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export interface WpilibFlywheelSimState {
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
      3.0,
      batteryVoltageFilterTimeConstantSeconds,
      initialAngularVelocityRadPerSec,
    ) as WpilibFlywheelSimState[];
  } finally {
    wasmMotor.delete();
  }
}
