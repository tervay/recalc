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

export interface SimulateElevatorWpilibParams {
  motorDict: MotorDict;
  ratio: RatioDict;
  load: MeasurementDict;
  spoolDiameter: MeasurementDict;
  travelDistance: MeasurementDict;
  statorLimitDict: MeasurementDict;
  supplyLimitDict: MeasurementDict;
  batteryResistance: MeasurementDict;
  batteryVoltage: MeasurementDict;
  angle: MeasurementDict;
  efficiency: number;
  cascade: boolean;
  batteryVoltageFilterTimeConstantSeconds: number;
  maxVelocityDict: MeasurementDict;
  maxAccelerationDict: MeasurementDict;
  qPositionMeters: number;
  qVelocityMPS: number;
  rVolts: number;
  sensorDelaySeconds: number;
  kalmanFilterPositionStdDev: MeasurementDict;
  kalmanFilterVelocityStdDev: MeasurementDict;
  kalmanFilterEncoderPositionStdDev: MeasurementDict;
}

export interface ComputeElevatorFeedbackGainsParams {
  motorDict: MotorDict;
  ratio: RatioDict;
  load: MeasurementDict;
  spoolDiameter: MeasurementDict;
  efficiency: number;
  qPosition: MeasurementDict;
  qVelocity: MeasurementDict;
  rVolts: MeasurementDict;
  feedbackDt: MeasurementDict;
  sensorDelay: MeasurementDict;
}

export interface FeedbackGains {
  kP: number;
  kD: number;
}

export async function computeElevatorFeedbackGains({
  motorDict,
  ratio,
  load,
  spoolDiameter,
  efficiency,
  qPosition,
  qVelocity,
  rVolts,
  feedbackDt,
  sensorDelay,
}: ComputeElevatorFeedbackGainsParams): Promise<FeedbackGains> {
  const wpilibc = await initWpilibc();
  const motor = Motor.fromDict(motorDict);
  const ratioValue = Ratio.fromDict(ratio);
  const loadMeasurement = Measurement.fromDict(load);
  const spoolRadius = Measurement.fromDict(spoolDiameter).div(2);
  const dt = Measurement.fromDict(feedbackDt);
  const r = Measurement.fromDict(rVolts);

  if (
    ratioValue.asNumber() === 0 ||
    motor.quantity === 0 ||
    loadMeasurement.baseScalar === 0 ||
    spoolRadius.baseScalar === 0 ||
    dt.to('s').scalar <= 0 ||
    r.to('V').scalar <= 0
  ) {
    return { kP: 0, kD: 0 };
  }

  const wasmMotor = motor.toWpilibMotor();
  try {
    return wpilibc.computeElevatorFeedbackGains(
      wasmMotor,
      ratioValue.asNumber(),
      loadMeasurement.to('kg').scalar,
      spoolRadius.to('m').scalar,
      efficiency,
      Measurement.fromDict(qPosition).to('m').scalar,
      Measurement.fromDict(qVelocity).to('m/s').scalar,
      r.to('V').scalar,
      dt.to('s').scalar,
      Measurement.fromDict(sensorDelay).to('s').scalar,
    ) as FeedbackGains;
  } finally {
    wasmMotor.delete();
  }
}

export async function simulateElevatorWpilib({
  motorDict,
  ratio,
  load,
  spoolDiameter,
  travelDistance,
  statorLimitDict,
  supplyLimitDict,
  batteryResistance,
  batteryVoltage,
  angle,
  efficiency,
  cascade,
  batteryVoltageFilterTimeConstantSeconds,
  maxVelocityDict,
  maxAccelerationDict,
  qPositionMeters,
  qVelocityMPS,
  rVolts,
  sensorDelaySeconds,
  kalmanFilterPositionStdDev,
  kalmanFilterVelocityStdDev,
  kalmanFilterEncoderPositionStdDev,
}: SimulateElevatorWpilibParams): Promise<WpilibElevatorSimState[]> {
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
      Measurement.fromDict(kalmanFilterPositionStdDev).to('m').scalar,
      Measurement.fromDict(kalmanFilterVelocityStdDev).to('m/s').scalar,
      Measurement.fromDict(kalmanFilterEncoderPositionStdDev).to('m').scalar,
    ) as WpilibElevatorSimState[];
  } finally {
    wasmMotor.delete();
  }
}
