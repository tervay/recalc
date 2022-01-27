import { DependencyList, useEffect, useState } from "react";

export function useAsyncMemo<T>(
  initValue: T,
  calculate: () => Promise<T>,
  deps: DependencyList
): T {
  const [value, setValue] = useState<T>(initValue);
  useEffect(() => {
    calculate().then((v) => setValue(v));
  }, deps);
  return value;
}
