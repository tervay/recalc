declare module 'minimize-golden-section-1d' {
  interface MinimizeOptions {
    tolerance?: number;
    initialIncrement?: number;
    lowerBound?: number;
    upperBound?: number;
    maxIterations?: number;
    guess?: number;
  }

  interface MinimizeStatus {
    iterations: number;
    argmin: number;
    minimum: number;
    converged: boolean;
  }

  function minimize(
    f: (x: number) => number,
    options?: MinimizeOptions,
    status?: MinimizeStatus,
  ): number;

  export = minimize;
}
