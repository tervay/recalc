import type { OptimizeConfigurationParams } from '~/lib/math/linearOptimizer.worker';
import {
  type ConfigOptOutput,
  type ConfigOptResult,
  makeGrid,
  reduceConfigOutput,
} from '~/lib/math/optimizerUtils';
import Measurement from '~/lib/models/Measurement';

/**
 * Runs the optimization for a single (stator, supply) grid cell. Supplied by
 * the caller so the orchestrator stays agnostic to how the work is executed --
 * the app dispatches to a worker pool, while tests can call the worker function
 * in-process.
 */
export type RunConfigCell = (
  statorAmps: number,
  supplyAmps: number,
) => Promise<ConfigOptResult>;

/**
 * Fans the stator x supply grid out across the provided cell runner and folds
 * the results back into a ConfigOptOutput.
 *
 * The grid is expanded in row-major order (stator outer, supply inner) and
 * `Promise.all` preserves that order, so the resulting `allResults` array -- and
 * therefore the selected recommendation -- is identical to the serial
 * `optimizeConfiguration`, just computed in parallel.
 */
export async function orchestrateConfigOptimization(
  params: OptimizeConfigurationParams,
  runCell: RunConfigCell,
): Promise<ConfigOptOutput> {
  const maxStator = Measurement.fromDict(
    params.maximumComfortableStatorLimitDict,
  ).to('A').scalar;
  const maxSupply = Measurement.fromDict(
    params.maximumComfortableSupplyLimitDict,
  ).to('A').scalar;

  const cells: Array<[number, number]> = [];
  for (const statorAmps of makeGrid(maxStator)) {
    for (const supplyAmps of makeGrid(maxSupply)) {
      cells.push([statorAmps, supplyAmps]);
    }
  }

  const allResults = await Promise.all(
    cells.map(([statorAmps, supplyAmps]) => runCell(statorAmps, supplyAmps)),
  );

  return reduceConfigOutput(allResults);
}
