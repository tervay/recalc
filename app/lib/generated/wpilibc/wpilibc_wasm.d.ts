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
  withReduction(gearboxReduction: number): DCMotor | null;
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

export interface SingleJointedArmSim extends ClassHandle {
  hasHitLowerLimit(): boolean;
  hasHitUpperLimit(): boolean;
  setInputVoltage(voltageVolts: number): void;
  update(dtSeconds: number): void;
  getAngle(): number;
  getAngularVelocity(): number;
  getCurrentDraw(): number;
}

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
  SingleJointedArmSim: {
    new (
      _0: DCMotor | null,
      _1: number,
      _2: number,
      _3: number,
      _4: number,
      _5: number,
      _6: boolean,
      _7: number,
    ): SingleJointedArmSim;
  };
  RoboRioSim_setVInVoltage(voltageVolts: number): void;
  RobotController_getInputVoltage(): number;
  BatterySim_calculate(currentDrawsAmps: VectorDouble): number;
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
    gearing: number,
    loadKg: number,
    spoolRadiusMeters: number,
    travelDistanceMeters: number,
    statorLimitAmps: number,
    supplyLimitAmps: number,
    batteryResistanceOhms: number,
    batteryVoltageVolts: number,
    simTimestep: number,
    decimation: number,
    maxSimSeconds: number,
    angleRadians: number,
    efficiency: number,
    cascade: boolean,
    batteryVoltageFilterTimeConstantSeconds: number,
    maxVelocityMPS: number,
    maxAccelerationMPS2: number,
    qPositionMeters: number,
    qVelocityMPS: number,
    rVolts: number,
    sensorDelaySeconds: number,
    kalmanFilterPositionStdDev: number,
    kalmanFilterVelocityStdDev: number,
    kalmanFilterEncoderPositionStdDev: number,
  ): any;
  simulateFlywheel(
    motor: DCMotor | null,
    gearing: number,
    moiKgMSquared: number,
    targetAngularVelocityRadPerSec: number,
    statorLimitAmps: number,
    supplyLimitAmps: number,
    statorVoltageVolts: number,
    batteryResistanceOhms: number,
    batteryVoltageVolts: number,
    efficiency: number,
    simTimestep: number,
    decimation: number,
    maxSimSeconds: number,
    batteryVoltageFilterTimeConstantSeconds: number,
    initialAngularVelocityRadPerSec: number,
  ): any;
  simulateArm(
    motor: DCMotor | null,
    gearing: number,
    momentOfInertiaKgMSquared: number,
    armLengthMeters: number,
    minAngleRadians: number,
    maxAngleRadians: number,
    startingAngleRadians: number,
    statorLimitAmps: number,
    supplyLimitAmps: number,
    statorVoltageVolts: number,
    batteryResistanceOhms: number,
    batteryVoltageVolts: number,
    efficiency: number,
    goingUp: boolean,
    simTimestep: number,
    decimation: number,
    maxSimSeconds: number,
    batteryVoltageFilterTimeConstantSeconds: number,
  ): any;
  computeElevatorFeedbackGains(
    motor: DCMotor | null,
    gearing: number,
    massKg: number,
    spoolRadiusMeters: number,
    efficiency: number,
    qPositionMeters: number,
    qVelocityMPS: number,
    rVolts: number,
    dtSeconds: number,
    sensorDelaySeconds: number,
  ): any;
  computeArmFeedbackGains(
    motor: DCMotor | null,
    gearing: number,
    momentOfInertiaKgMSquared: number,
    efficiency: number,
    qPositionRad: number,
    qVelocityRadPerSec: number,
    rVolts: number,
    dtSeconds: number,
    sensorDelaySeconds: number,
  ): any;
  computeFlywheelFeedbackGains(
    motor: DCMotor | null,
    gearing: number,
    momentOfInertiaKgMSquared: number,
    efficiency: number,
    qVelocityRadPerSec: number,
    rVolts: number,
    dtSeconds: number,
    sensorDelaySeconds: number,
  ): any;
  computeLinearFeedforwardGains(
    motor: DCMotor | null,
    gearing: number,
    loadKg: number,
    spoolRadiusMeters: number,
    efficiency: number,
    angleRadians: number,
  ): any;
  computeAngularFeedforwardGains(
    motor: DCMotor | null,
    gearing: number,
    momentOfInertiaKgMSquared: number,
    efficiency: number,
    comMassKg: number,
    comLengthMeters: number,
  ): any;
  computeFlywheelFeedforwardGains(
    motor: DCMotor | null,
    gearing: number,
    momentOfInertiaKgMSquared: number,
    efficiency: number,
  ): any;
}

export type MainModule = WasmModule & EmbindModule;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
