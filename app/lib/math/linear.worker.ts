import Measurement, { type MeasurementDict } from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

const SIM_TIMESTEP_S = 0.0001;
const SIM_DECIMATION = 10;
const SIM_MAX_SECONDS = 3.0;

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
  batteryResistance: MeasurementDict,
  batteryVoltage: MeasurementDict,
  angle: MeasurementDict,
  efficiency: number,
  cascade: boolean,
  batteryVoltageFilterTimeConstantSeconds: number,
  maxVelocityDict: MeasurementDict,
  maxAccelerationDict: MeasurementDict,
  qPositionMeters: number,
  qVelocityMPS: number,
  rVolts: number,
  sensorDelaySeconds: number,
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
      Measurement.fromDict(batteryResistance).to('Ohm').scalar,
      Measurement.fromDict(batteryVoltage).to('V').scalar,
      SIM_TIMESTEP_S,
      SIM_DECIMATION,
      SIM_MAX_SECONDS,
      Measurement.fromDict(angle).to('rad').scalar,
      efficiency,
      cascade,
      batteryVoltageFilterTimeConstantSeconds,
      Measurement.fromDict(maxVelocityDict).to('m/s').scalar,
      Measurement.fromDict(maxAccelerationDict).to('m/s^2').scalar,
      qPositionMeters,
      qVelocityMPS,
      rVolts,
      sensorDelaySeconds,
    ) as WpilibElevatorSimState[];
  } finally {
    wasmMotor.delete();
  }
}
