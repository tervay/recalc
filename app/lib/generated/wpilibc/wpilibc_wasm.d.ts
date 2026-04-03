// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
  /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  function UTF8ToString(
    ptr: number,
    maxBytesToRead?: number | undefined,
    ignoreNul?: boolean | undefined,
  ): string;
  function stringToUTF8(str: any, outPtr: any, maxBytesToWrite: any): any;
}
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
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
