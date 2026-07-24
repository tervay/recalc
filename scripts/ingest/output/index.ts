import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import type { ParsedProduct } from 'scripts/ingest/parsing';
import type { ProductType } from 'scripts/ingest/productTypes';
import type { VendorName } from 'scripts/ingest/vendors';

export async function writeOutput(
  vendor: VendorName,
  productType: ProductType,
  data: ParsedProduct[],
): Promise<void> {
  const outdir = join(process.cwd(), 'app/genData', vendor);
  await mkdir(outdir, { recursive: true });
  const sorted = [...data].sort((a, b) => {
    if (a.sku === b.sku) return 0;
    if (a.sku === null) return 1;
    if (b.sku === null) return -1;
    return a.sku.localeCompare(b.sku);
  });
  await writeFile(
    join(outdir, `${productType}.json`),
    JSON.stringify(sorted, null, 2) + '\n',
  );
}
