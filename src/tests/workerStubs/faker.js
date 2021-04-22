export function createFakeWorkerInstance(module) {
  return () =>
    Object.entries(module).reduce((accum, [fnName, fn]) => {
      return {
        ...accum,
        [fnName]: (args) => {
          return new Promise((resolve, _) => {
            resolve(fn(args));
          });
        },
      };
    }, {});
}
