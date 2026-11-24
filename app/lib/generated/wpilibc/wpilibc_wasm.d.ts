// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
  _malloc(_0: number): number;
  _free(_0: number): void;
}

export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
  // @ts-ignore - If targeting lower than ESNext, this symbol might not exist.
  [Symbol.dispose](): void;
  clone(): this;
}
export interface VectorDouble extends ClassHandle, Iterable<number> {
  size(): number;
  get(_0: number): number | undefined;
  push_back(_0: number): void;
  resize(_0: number, _1: number): void;
  set(_0: number, _1: number): boolean;
}

export type FeedbackGains = { kP: number; kD: number };

export type FeedforwardGains = { kV: number; kA: number; kG: number };

export type ElevatorSimRows = {
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
  timeToGoalSeconds: number;
}[];

export type ArmSimRows = {
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
}[];

export type FlywheelSimRows = {
  angularVelocityRadPerSec: number;
  statorCurrentDrawAmps: number;
  supplyCurrentDrawAmps: number;
  timeSeconds: number;
  batteryVoltageVolts: number;
  motorAppliedVoltageVolts: number;
  motorRpm: number;
  energyJoules: number;
  success: boolean;
}[];

export type MotorCurveRows = {
  angularVelocityRadPerSec: number;
  statorCurrentDrawAmps: number;
  supplyCurrentDrawAmps: number;
  torqueNewtonMeters: number;
  motorAppliedVoltageVolts: number;
  efficiency: number;
}[];

export interface DCMotor extends ClassHandle {
  getFreeCurrentAmps(): number;
  getFreeSpeedRadPerSec(): number;
  getKtNMPerAmp(): number;
  getKvRadPerSecPerVolt(): number;
  getNominalVoltageVolts(): number;
  getROhms(): number;
  getStallCurrentAmps(): number;
  getStallTorqueNewtonMeters(): number;
  currentFromSpeedAndVoltage(
    speedRadPerSec: number,
    inputVoltageVolts: number,
  ): number;
  currentFromTorque(torqueNewtonMeters: number): number;
  torqueFromCurrent(currentAmps: number): number;
  voltageFromTorqueAndSpeed(
    torqueNewtonMeters: number,
    speedRadPerSec: number,
  ): number;
  speedFromTorqueAndVoltage(
    torqueNewtonMeters: number,
    inputVoltageVolts: number,
  ): number;
  withReduction(gearboxReduction: number): DCMotor;
}

export interface DCMotorSim extends ClassHandle {
  setInputVoltage(voltageVolts: number): void;
  update(dtSeconds: number): void;
  getAngularPosition(): number;
  getAngularVelocity(): number;
  getAngularAcceleration(): number;
  getTorque(): number;
  getInputVoltage(): number;
  getJ(): number;
  getCurrentDraw(): number;
}

export type ElevatorSimParams = {
  gearing: number;
  loadKg: number;
  spoolRadiusMeters: number;
  travelDistanceMeters: number;
  statorLimitAmps: number;
  supplyLimitAmps: number;
  batteryResistanceOhms: number;
  batteryVoltageVolts: number;
  simTimestep: number;
  decimation: number;
  maxSimSeconds: number;
  angleRadians: number;
  efficiency: number;
  cascade: boolean;
  batteryVoltageFilterTimeConstantSeconds: number;
  maxVelocityMPS: number;
  maxAccelerationMPS2: number;
  qPositionMeters: number;
  qVelocityMPS: number;
  rVolts: number;
  sensorDelaySeconds: number;
  kalmanFilterPositionStdDev: number;
  kalmanFilterVelocityStdDev: number;
  kalmanFilterEncoderPositionStdDev: number;
};

export type FlywheelSimParams = {
  gearing: number;
  momentOfInertiaKgMSquared: number;
  targetAngularVelocityRadPerSec: number;
  statorLimitAmps: number;
  supplyLimitAmps: number;
  statorVoltageVolts: number;
  batteryResistanceOhms: number;
  batteryVoltageVolts: number;
  efficiency: number;
  simTimestep: number;
  decimation: number;
  maxSimSeconds: number;
  batteryVoltageFilterTimeConstantSeconds: number;
  initialAngularVelocityRadPerSec: number;
};

export type MotorCurveParams = {
  momentOfInertiaKgMSquared: number;
  statorLimitAmps: number;
  supplyLimitAmps: number;
  statorVoltageVolts: number;
  supplyVoltageVolts: number;
  simTimestep: number;
  decimation: number;
  maxIterations: number;
};

export type ArmSimParams = {
  gearing: number;
  momentOfInertiaKgMSquared: number;
  armLengthMeters: number;
  minAngleRadians: number;
  maxAngleRadians: number;
  startingAngleRadians: number;
  statorLimitAmps: number;
  supplyLimitAmps: number;
  statorVoltageVolts: number;
  batteryResistanceOhms: number;
  batteryVoltageVolts: number;
  efficiency: number;
  goingUp: boolean;
  simTimestep: number;
  decimation: number;
  maxSimSeconds: number;
  batteryVoltageFilterTimeConstantSeconds: number;
};

export type ElevatorFeedbackParams = {
  gearing: number;
  massKg: number;
  spoolRadiusMeters: number;
  efficiency: number;
  qPositionMeters: number;
  qVelocityMPS: number;
  rVolts: number;
  dtSeconds: number;
  sensorDelaySeconds: number;
};

export type ArmFeedbackParams = {
  gearing: number;
  momentOfInertiaKgMSquared: number;
  efficiency: number;
  qPositionRad: number;
  qVelocityRadPerSec: number;
  rVolts: number;
  dtSeconds: number;
  sensorDelaySeconds: number;
};

export type FlywheelFeedbackParams = {
  gearing: number;
  momentOfInertiaKgMSquared: number;
  efficiency: number;
  qVelocityRadPerSec: number;
  rVolts: number;
  dtSeconds: number;
  sensorDelaySeconds: number;
};

export type LinearFeedforwardParams = {
  gearing: number;
  loadKg: number;
  spoolRadiusMeters: number;
  efficiency: number;
  angleRadians: number;
};

export type AngularFeedforwardParams = {
  gearing: number;
  momentOfInertiaKgMSquared: number;
  efficiency: number;
  comMassKg: number;
  comLengthMeters: number;
};

export type FlywheelFeedforwardParams = {
  gearing: number;
  momentOfInertiaKgMSquared: number;
  efficiency: number;
};

interface EmbindModule {
  VectorDouble: {
    new (): VectorDouble;
  };
  DCMotor: {
    new (
      _0: number,
      _1: number,
      _2: number,
      _3: number,
      _4: number,
      _5: number,
    ): DCMotor;
  };
  DCMotorSim: {
    new (_0: DCMotor | null, _1: number, _2: number): DCMotorSim;
  };
  RoboRioSim_setVInVoltage(voltageVolts: number): void;
  RobotController_getInputVoltage(): number;
  BatterySim_calculateDefaultBatteryLoadedVoltage(
    currentDrawsAmps: VectorDouble,
  ): number;
  BatterySim_calculateLoadedBatteryVoltage(
    nominalVoltageVolts: number,
    resistanceOhms: number,
    currentDrawsAmps: VectorDouble,
  ): number;
  simulateElevator(
    motor: DCMotor | null,
    params: ElevatorSimParams,
  ): ElevatorSimRows;
  simulateFlywheel(
    motor: DCMotor | null,
    params: FlywheelSimParams,
  ): FlywheelSimRows;
  simulateMotorCurve(
    motor: DCMotor | null,
    params: MotorCurveParams,
  ): MotorCurveRows;
  simulateArm(motor: DCMotor | null, params: ArmSimParams): ArmSimRows;
  computeElevatorFeedbackGains(
    motor: DCMotor | null,
    params: ElevatorFeedbackParams,
  ): FeedbackGains;
  computeArmFeedbackGains(
    motor: DCMotor | null,
    params: ArmFeedbackParams,
  ): FeedbackGains;
  computeFlywheelFeedbackGains(
    motor: DCMotor | null,
    params: FlywheelFeedbackParams,
  ): FeedbackGains;
  computeLinearFeedforwardGains(
    motor: DCMotor | null,
    params: LinearFeedforwardParams,
  ): FeedforwardGains;
  computeAngularFeedforwardGains(
    motor: DCMotor | null,
    params: AngularFeedforwardParams,
  ): FeedforwardGains;
  computeFlywheelFeedforwardGains(
    motor: DCMotor | null,
    params: FlywheelFeedforwardParams,
  ): FeedforwardGains;
}

export type MainModule = WasmModule & EmbindModule;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
