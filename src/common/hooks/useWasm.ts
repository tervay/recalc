import { useState } from "react";

export interface BaseWASMModule {
  _malloc: (size: number) => number;
  HEAPU8: Uint8Array;
}

const useWASM = <T>(
  helperOutput: (
    Module?: unknown,
    ...args: unknown[]
  ) => Promise<BaseWASMModule & T>,
) => {
  const [methods, setMethods] = useState<(BaseWASMModule & T) | null>(null);

  helperOutput().then((m) => {
    !methods && setMethods(m);
  });

  return methods;
};

export default useWASM;
