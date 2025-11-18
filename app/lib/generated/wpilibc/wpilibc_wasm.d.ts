// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
  /**
   * @param {string|null=} returnType
   * @param {Array=} argTypes
   * @param {Array=} args
   * @param {Object=} opts
   */
  function ccall(
    ident: any,
    returnType?: string,
    argTypes?: any[],
    args?: any[],
    opts?: any,
  ): any;
  /**
   * @param {string=} returnType
   * @param {Array=} argTypes
   * @param {Object=} opts
   */
  function cwrap(
    ident: any,
    returnType?: string,
    argTypes?: any[],
    opts?: any,
  ): any;
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
    maxBytesToRead?: number,
    ignoreNul?: boolean,
  ): string;
  function stringToUTF8(str: any, outPtr: any, maxBytesToWrite: any): any;
}
interface WasmModule {
  _free(_0: number): void;
  _malloc(_0: number): number;
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
export interface VectorDouble extends ClassHandle {
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

export interface ElevatorSim extends ClassHandle {
  hasHitLowerLimit(): boolean;
  hasHitUpperLimit(): boolean;
  setInputVoltage(voltageVolts: number): void;
  update(dtSeconds: number): void;
  getPosition(): number;
  getVelocity(): number;
  getCurrentDraw(): number;
}

export interface FlywheelSim extends ClassHandle {
  setInputVoltage(voltageVolts: number): void;
  update(dtSeconds: number): void;
  getAngularVelocity(): number;
  getCurrentDraw(): number;
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
  ElevatorSim: {
    new (
      _0: DCMotor | null,
      _1: number,
      _2: number,
      _3: number,
      _4: number,
      _5: number,
      _6: boolean,
      _7: number,
    ): ElevatorSim;
  };
  FlywheelSim: {
    new (_0: DCMotor | null, _1: number, _2: number): FlywheelSim;
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
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
