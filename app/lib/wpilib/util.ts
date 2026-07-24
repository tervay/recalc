import type { VectorDouble } from '~/lib/generated/wpilibc/wpilibc_wasm';
import { getWpilibcModuleSync } from '~/lib/wpilib/wpilibc';

export function arrayToVectorDouble(values: number[]): VectorDouble {
  const vec = new (getWpilibcModuleSync().VectorDouble)();

  for (const value of values) {
    vec.push_back(value);
  }

  return vec;
}
