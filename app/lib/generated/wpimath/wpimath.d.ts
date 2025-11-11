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
    returnType?: (string | null) | undefined,
    argTypes?: any[] | undefined,
    args?: any[] | undefined,
    opts?: any | undefined,
  ): any;
  /**
   * @param {string=} returnType
   * @param {Array=} argTypes
   * @param {Object=} opts
   */
  function cwrap(
    ident: any,
    returnType?: string | undefined,
    argTypes?: any[] | undefined,
    opts?: any | undefined,
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
    maxBytesToRead?: number | undefined,
    ignoreNul?: boolean | undefined,
  ): string;
  function stringToUTF8(str: any, outPtr: any, maxBytesToWrite: any): any;
}
interface WasmModule {}

export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
  // @ts-ignore - If targeting lower than ESNext, this symbol might not exist.
  [Symbol.dispose](): void;
  clone(): this;
}
export interface Translation2d extends ClassHandle {
  getX(): number;
  getY(): number;
  getDistance(_0: Translation2d): number;
  getNorm(): number;
}

export interface Rotation2d extends ClassHandle {
  getRadians(): number;
  getDegrees(): number;
  getCos(): number;
  getSin(): number;
}

export interface Transform2d extends ClassHandle {}

export interface Pose2d extends ClassHandle {
  getTranslation(): Translation2d;
  getRotation(): Rotation2d;
  transformBy(_0: Transform2d): Pose2d;
  relativeTo(_0: Pose2d): Pose2d;
  getX(): number;
  getY(): number;
}

interface EmbindModule {
  Translation2d: {
    new (): Translation2d;
  };
  Rotation2d: {
    new (): Rotation2d;
  };
  Transform2d: {
    new (): Transform2d;
    new (_0: Translation2d, _1: Rotation2d): Transform2d;
  };
  Pose2d: {
    new (): Pose2d;
    new (_0: Translation2d, _1: Rotation2d): Pose2d;
  };
  createTranslation2d(_0: number, _1: number): Translation2d;
  createRotation2dFromRadians(_0: number): Rotation2d;
  createPose2d(_0: number, _1: number, _2: number): Pose2d;
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
