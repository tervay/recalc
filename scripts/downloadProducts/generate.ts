import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import type {
  ProductType,
  VendorCache,
  VendorName,
} from 'scripts/downloadProducts/types';

import type { JSONBelt } from '~/lib/types/belts';
import type { JSONGear } from '~/lib/types/gears';
import type { JSONPlanetaryInstance } from '~/lib/types/planetary';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { JSONSprocket } from '~/lib/types/sprockets';

/**
 * Write JSON data to app/genData directory
 */
async function writeJson(
  data: (
    | JSONBelt
    | JSONPulley
    | JSONGear
    | JSONSprocket
    | JSONPlanetaryInstance
  )[],
  vendor: VendorName,
  productType: ProductType,
): Promise<void> {
  const outdir = join(process.cwd(), 'app/genData', vendor);
  const outFile = join(outdir, `${productType}.json`);

  await mkdir(outdir, { recursive: true });
  await writeFile(outFile, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Generate output files from cache
 */
export async function generateOutputFilesFromCache(
  vendor: VendorName,
  productType: ProductType,
  cache: VendorCache,
): Promise<void> {
  const parsedData: (
    | JSONBelt
    | JSONPulley
    | JSONGear
    | JSONSprocket
    | JSONPlanetaryInstance
  )[] = [];

  for (const entry of Object.values(cache)) {
    parsedData.push(entry.parsedData);
  }

  if (parsedData.length > 0) {
    await writeJson(parsedData, vendor, productType);
    console.log(
      `Generated ${parsedData.length} ${productType} for ${vendor} in app/genData/${vendor}/${productType}.json`,
    );
  }
}

/**
 * Generate all output files from all caches
 */
export async function generateAllOutputFiles(
  caches: Map<string, VendorCache>,
): Promise<void> {
  console.log('\nGenerating output files...');

  const tasks: Promise<void>[] = [];

  for (const [cacheKey, cache] of caches.entries()) {
    const [vendor, productType] = cacheKey.split('_') as [
      VendorName,
      ProductType,
    ];
    tasks.push(generateOutputFilesFromCache(vendor, productType, cache));
  }

  await Promise.all(tasks);
  console.log('Output files generation complete.');
}
