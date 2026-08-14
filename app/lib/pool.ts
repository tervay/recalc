import { pool as newPool } from 'workerpool';
import type { WorkerPoolOptions } from 'workerpool';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...args: any[]) => any;

type PickFunctions<T> = {
  [
    K in keyof T as K extends string ? (T[K] extends Fn ? K : never) : never
  ]: T[K] extends Fn ? T[K] : never;
};

interface TypedPool<T extends Record<string, Fn>> {
  exec<K extends keyof T & string>(
    method: K,
    params: Parameters<T[K]>,
  ): Promise<Awaited<ReturnType<T[K]>>>;
  terminate(force?: boolean, timeout?: number): Promise<void>;
}

export function getPool<T>(
  script: string,
  options?: WorkerPoolOptions,
): TypedPool<PickFunctions<T>> {
  const pool = newPool(script, {
    workerType: 'web',
    workerOpts: { type: 'module' },
    ...options,
  });

  return pool as unknown as TypedPool<PickFunctions<T>>;
}
