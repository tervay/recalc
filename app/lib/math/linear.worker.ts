import Measurement, { type MeasurementDict } from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export interface WpilibElevatorSimState {
  positionMeters: number;
  velocityMetersPerSecond: number;
  statorCurrentDrawAmps: number;
  supplyCurrentDrawAmps: number;
  timeSeconds: number;
  batteryVoltageVolts: number;
  motorAppliedVoltageVolts: number;
  motorRpm: number;
  energyJoules: number;
  success: boolean;
}

export async function simulateElevatorWpilib(
  motorDict: MotorDict,
  ratio: RatioDict,
  load: MeasurementDict,
  spoolDiameter: MeasurementDict,
  travelDistance: MeasurementDict,
  statorLimitDict: MeasurementDict,
  supplyLimitDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistance: MeasurementDict,
  batteryVoltage: MeasurementDict,
  angle: MeasurementDict,
  efficiency: number,
  cascade: boolean,
  batteryVoltageFilterTimeConstantSeconds: number,
): Promise<WpilibElevatorSimState[]> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const wasmMotor = motor.toWpilibMotor();
  try {
    return wpilibc.simulateElevator(
      wasmMotor,
      Ratio.fromDict(ratio).asNumber(),
      Measurement.fromDict(load).to('kg').scalar,
      Measurement.fromDict(spoolDiameter).div(2).to('m').scalar,
      Measurement.fromDict(travelDistance).to('m').scalar,
      Measurement.fromDict(statorLimitDict).to('A').scalar * motor.quantity,
      Measurement.fromDict(supplyLimitDict).to('A').scalar * motor.quantity,
      Measurement.fromDict(statorVoltageDict).to('V').scalar,
      Measurement.fromDict(batteryResistance).to('Ohm').scalar,
      Measurement.fromDict(batteryVoltage).to('V').scalar,
      0.0001,
      10,
      3.0,
      Measurement.fromDict(angle).to('rad').scalar,
      efficiency,
      cascade,
      batteryVoltageFilterTimeConstantSeconds,
    ) as WpilibElevatorSimState[];
  } finally {
    wasmMotor.delete();
  }
}
