/* eslint-disable @typescript-eslint/no-explicit-any */
import "vitest";

declare module "*.scss" {
  const content: { [className: string]: string };
  export = content;
}

declare module "*.css" {
  const content: { [className: string]: string };
  export = content;
}

declare module "*.md" {
  const content: any;
  export default content;
}

declare module "raw-loader!*" {
  const content: string;
  export default content;
}

type FlattenedPromise<T> = unknown extends T
  ? Promise<T>
  : T extends Promise<infer _U>
  ? T
  : Promise<T>;

type AnyFunction = (...args: any[]) => any;
type Async<F extends AnyFunction> = (
  ...args: Parameters<F>
) => FlattenedPromise<ReturnType<F>>;
export type Workerized<T> = Worker & {
  [K in keyof T]: T[K] extends AnyFunction ? Async<T[K]> : never;
};
declare module "workerize-loader!*" {
  export function createInstance<T>(): Workerized<T>;
  export = createInstance;
}
