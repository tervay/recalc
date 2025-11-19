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
export interface Translation3d extends ClassHandle {
  getX(): number;
  getY(): number;
  getZ(): number;
  getDistance(_0: Translation3d): number;
  getNorm(): number;
}

export interface Rotation3d extends ClassHandle {
  getX(): number;
  getY(): number;
  getZ(): number;
}

export interface Transform3d extends ClassHandle {}

export interface Pose3d extends ClassHandle {
  getTranslation(): Translation3d;
  getRotation(): Rotation3d;
  transformBy(_0: Transform3d): Pose3d;
  relativeTo(_0: Pose3d): Pose3d;
  getX(): number;
  getY(): number;
  getZ(): number;
}

interface EmbindModule {
  Translation3d: {
    new (): Translation3d;
    new (_0: number, _1: number, _2: number): Translation3d;
    new (_0: number, _1: Rotation3d): Translation3d;
  };
  Rotation3d: {
    new (): Rotation3d;
    new (_0: number, _1: number, _2: number): Rotation3d;
  };
  Transform3d: {
    new (): Transform3d;
    new (_0: Translation3d, _1: Rotation3d): Transform3d;
    new (_0: number, _1: number, _2: number, _3: Rotation3d): Transform3d;
  };
  Pose3d: {
    new (): Pose3d;
    new (_0: Translation3d, _1: Rotation3d): Pose3d;
  };
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
